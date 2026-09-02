import { execFileSync, spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { CACHE, cachePath, fetchText, download } from './sources.js'
import { JMDICT, JMDICT_ATTRIBUTION, JMDICT_LICENSE, jmdictReadings } from './jmdict.js'
import type { Corpus } from './manifest.js'

/**
 * Where a language's word ordering comes from.
 *
 * The pipeline needs one thing from a corpus and nothing else: which words are commoner than
 * which. It decides the common tier, and the tutorial board is ranked by it. It never decides
 * whether a word exists — that is the validator's job, and the reason for the separation is
 * written up in docs/DICTIONARIES.md.
 *
 * Two corpora, and the second exists because the first does not cover the languages that are
 * next. Swahili, Latin, Yoruba, Hausa, Igbo and Nigerian Pidgin have no OpenSubtitles list at
 * either 2016 or 2018 — every one of those tags 404s — while each has a Wikipedia of between
 * 1,655 and 126,000 articles. STATUS.md had already named the OpenSubtitles provenance as the
 * weak link in the set, so this is a debt worth paying whatever it unlocks.
 *
 * Both produce the same thing: `word count` lines, commonest first, lower case. Wikipedia's are
 * counted here and then cached in that format, so everything downstream is unchanged and a
 * second build does no work.
 */

const OPEN_SUBTITLES =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018'

const DUMPS = 'https://dumps.wikimedia.org'

export function corpusUrl(corpus: Corpus): string {
  if (corpus.kind === 'openSubtitles') {
    return `${OPEN_SUBTITLES}/${corpus.id}/${corpus.id}_full.txt`
  }
  if (corpus.kind === 'jmdict') return JMDICT
  return `${DUMPS}/${corpus.wiki}wiki/latest/${corpus.wiki}wiki-latest-pages-articles.xml.bz2`
}

/** `word count` lines, commonest first. */
export async function frequencyLines(corpus: Corpus, refresh: boolean): Promise<string[]> {
  if (corpus.kind === 'openSubtitles') {
    const text = await fetchText(`frequency/${corpus.id}.txt`, corpusUrl(corpus), refresh)
    return text.split('\n')
  }
  if (corpus.kind === 'jmdict') {
    // Only the banded readings order anything. The rest arrive as a lexicon, with a count of
    // zero, ranking below every cut and earning credit without being words a board must hold.
    return (await jmdictReadings(refresh))
      .filter((reading) => reading.count > 0)
      .map((reading) => `${reading.kana} ${String(reading.count)}`)
  }
  return (await wikipediaCounts(corpus.wiki, refresh)).split('\n')
}

/**
 * A word count over one Wikipedia's articles, cached in the shape the other corpus arrives in.
 *
 * The dump is the ordinary `pages-articles` one rather than a search index, because that URL is
 * stable: the search-index dumps carry the week's date in the path, so a pinned URL rots in a
 * month and an unpinned one is not reproducible. `latest` moves too, of course, but the word
 * lists are committed, so rebuilding is a deliberate act with a reviewed diff, and PROVENANCE
 * records the day it was done.
 */
async function wikipediaCounts(wiki: string, refresh: boolean): Promise<string> {
  const counted = cachePath(`frequency/${wiki}-wikipedia.txt`)
  if (!refresh && existsSync(counted)) return readFileSync(counted, 'utf8')

  requireBzip2()
  const dump = await download(
    `dumps/${wiki}wiki-latest-pages-articles.xml.bz2`,
    corpusUrl({ kind: 'wikipedia', wiki }),
    refresh,
  )

  process.stderr.write(`  counting words in ${wiki}wiki\n`)
  const counts = await countDump(dump)

  // A token seen once in a whole encyclopaedia is a typo, a scanno or somebody's surname far
  // more often than it is a word, and keeping them triples the file for no ordering it changes:
  // everything at count one sorts below everything else anyway.
  const ordered = [...counts]
    .filter(([, count]) => count > 1)
    .sort(([leftWord, left], [rightWord, right]) =>
      right === left ? leftWord.localeCompare(rightWord) : right - left,
    )
  const text = `${ordered.map(([word, count]) => `${word} ${String(count)}`).join('\n')}\n`
  mkdirSync(dirname(counted), { recursive: true })
  writeFileSync(counted, text)
  process.stderr.write(`  ${String(ordered.length)} distinct words\n`)
  return text
}

/** Letters, marks, and the apostrophes that sit inside a word rather than between two. */
const TOKEN = /\p{L}[\p{L}\p{M}'’]*/gu

/**
 * Counts the article text in a dump, one line at a time.
 *
 * Streaming rather than reading it in: the smallest of these dumps is 2MB compressed and the
 * largest 160MB, which is several hundred megabytes of XML, and none of it is needed twice.
 */
async function countDump(path: string): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  const bunzip = spawn('bzip2', ['-dc', path], { stdio: ['ignore', 'pipe', 'inherit'] })
  const reader = new Reader()

  for await (const line of createInterface({ input: bunzip.stdout, crlfDelay: Infinity })) {
    const text = reader.read(line)
    if (text === '') continue
    for (const match of text.matchAll(TOKEN)) {
      const word = match[0].normalize('NFC').toLowerCase()
      counts.set(word, (counts.get(word) ?? 0) + 1)
    }
  }
  await new Promise<void>((resolve, reject) => {
    bunzip.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`bzip2 exited ${String(code)}`))
    })
    bunzip.on('error', reject)
  })
  return counts
}

/**
 * Turns dump lines into prose, keeping only what an article says.
 *
 * Not a wikitext parser, and it does not need to be. The corpus decides ordering and nothing
 * else, so the cost of imperfect stripping is that a few template parameter names rank as
 * words, and every one of them then has to get past a dictionary of the language. What matters
 * is the two things that would skew the *ordering*: markup that repeats on every page, and
 * pages that are not articles.
 */
class Reader {
  /** Namespace of the page being read. Only 0 is an article. */
  private ns: number | null = null
  private inText = false
  /** Open `{{` and `{|`, which nest and cross lines. */
  private braces = 0

  read(line: string): string {
    if (line.includes('</page>')) {
      this.ns = null
      this.inText = false
      this.braces = 0
      return ''
    }
    const ns = /<ns>(-?\d+)<\/ns>/.exec(line)
    if (ns !== null) this.ns = Number(ns[1])

    let body = line
    if (!this.inText) {
      const open = /<text[^>]*>/.exec(line)
      if (open === null) return ''
      this.inText = true
      body = line.slice(open.index + open[0].length)
    }
    const close = body.indexOf('</text>')
    if (close >= 0) {
      body = body.slice(0, close)
      this.inText = false
    }
    if (this.ns !== 0) return ''
    return this.strip(body)
  }

  private strip(line: string): string {
    let text = unescapeXml(line)
    // A section heading is structure rather than prose, and it is the markup that repeats most:
    // every article on a wiki ends with the same two or three of them. On arz.wikipedia, which
    // is 1.6 million bot-written stubs, that put مصادر and لينكات برانيه — "sources" and
    // "external links" — at ranks four to six in the whole language.
    if (/^\s*=+.*=+\s*$/.test(text)) return ''
    // Whole-element markup first, because what is inside it is markup too.
    text = text.replace(/<!--[\s\S]*?-->/g, ' ')
    text = text.replace(/<ref[^>]*\/>/gi, ' ')
    text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, ' ')
    text = text.replace(/<[^>]*>/g, ' ')
    // A link to another namespace is a file, a category or an interlanguage link, and the words
    // in it are a filename rather than prose.
    text = text.replace(/\[\[[^[\]|]*:[^[\]]*\]\]/g, ' ')
    // A piped link says its target and shows its label; only the label was written to be read.
    text = text.replace(/\[\[[^[\]|]*\|/g, ' ')
    text = text.replace(/\[\[|\]\]/g, ' ')
    // An external link's URL is not words. Its label, after the first space, is.
    text = text.replace(/\[(?:https?|ftp):\/\/\S*/g, ' ')
    text = text.replace(/'{2,}/g, ' ')
    text = text.replace(/^[=*#:;|!]+/g, ' ')

    return this.dropBraced(text)
  }

  /** Everything between `{{` or `{|` and its match, counting depth across lines. */
  private dropBraced(text: string): string {
    let kept = ''
    let at = 0
    while (at < text.length) {
      if (text.startsWith('{{', at) || text.startsWith('{|', at)) {
        this.braces += 1
        at += 2
        continue
      }
      if (text.startsWith('}}', at) || text.startsWith('|}', at)) {
        this.braces = Math.max(0, this.braces - 1)
        at += 2
        continue
      }
      if (this.braces === 0) kept += text[at] ?? ''
      at += 1
    }
    return kept
  }
}

const ENTITIES: Readonly<Record<string, string>> = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&amp;': '&',
}

/** The five XML entities a dump uses, ampersand last so it cannot double-decode. */
function unescapeXml(text: string): string {
  let out = text
  for (const [entity, character] of Object.entries(ENTITIES)) {
    out = out.split(entity).join(character)
  }
  return out
}

/** Refuses to run without the decompressor. Node's zlib does not do bzip2. */
export function requireBzip2(): void {
  try {
    execFileSync('bzip2', ['--help'], { stdio: 'ignore' })
  } catch {
    throw new Error(`bzip2 is not installed, and the Wikipedia dumps in ${CACHE} need it.`)
  }
}

export interface CorpusTerms {
  readonly attribution: string
  readonly license: string
}

/** What a word list has to say about where its ordering came from. */
export function corpusTerms(corpus: Corpus): CorpusTerms {
  if (corpus.kind === 'openSubtitles') {
    return {
      attribution: 'hermitdave/FrequencyWords, from the OpenSubtitles 2018 corpus via OPUS',
      license: 'MIT',
    }
  }
  if (corpus.kind === 'jmdict') {
    return { attribution: `${JMDICT_ATTRIBUTION}, nf priority bands`, license: JMDICT_LICENSE }
  }
  return {
    attribution:
      `${corpus.wiki}.wikipedia.org contributors, word counts over the article text of the ` +
      'pages-articles dump',
    license: 'CC-BY-SA-4.0',
  }
}
