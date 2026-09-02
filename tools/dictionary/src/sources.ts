import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { buildValidator } from '@blinkered/words'
import type { CaseRule } from '@blinkered/words'
import type { Source } from './manifest.js'

/**
 * Fetching, caching and asking a dictionary whether a word is a word.
 *
 * Everything downloaded is cached, because the pipeline gets run repeatedly while the cuts
 * are being calibrated and re-downloading a hundred megabytes to answer the same question is
 * both rude and slow.
 */

export const CACHE = resolve('.cache/dictionary')

function cachePath(name: string): string {
  return join(CACHE, name)
}

/** Downloads once, then reads from disk. `refresh` forces the download. */
async function cached(name: string, url: string, refresh: boolean): Promise<Buffer> {
  const path = cachePath(name)
  if (!refresh && existsSync(path)) return readFileSync(path)

  process.stderr.write(`  fetching ${url}\n`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${String(response.status)} from ${url}`)
  const body = Buffer.from(await response.arrayBuffer())
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
  return body
}

export async function fetchText(name: string, url: string, refresh: boolean): Promise<string> {
  return (await cached(name, url, refresh)).toString('utf8')
}

export async function fetchGunzipped(name: string, url: string, refresh: boolean): Promise<string> {
  return gunzipSync(await cached(name, url, refresh)).toString('utf8')
}

const WIKTIONARY = (wiki: string): string =>
  `https://dumps.wikimedia.org/${wiki}wiktionary/latest/${wiki}wiktionary-latest-all-titles-in-ns0.gz`

/** Wikimedia asks for a real one and throttles requests without it. */
const USER_AGENT = 'blinkered-dictionary/1 (https://playblinkered.com)'

/** Members per request. 500 is the ceiling for an anonymous caller. */
const CATEGORY_PAGE = 500

interface CategoryResponse {
  readonly query?: { readonly categorymembers?: readonly { readonly title: string }[] }
  readonly continue?: { readonly cmcontinue?: string }
}

/**
 * Every page filed directly under one category, paged through the API and cached as a list.
 *
 * There is no dump for this. The `all-titles` dump `titles` uses is per wiki, and what a
 * category needs is per language on one wiki, which only the API answers. Thirty thousand
 * Tagalog lemmas is sixty-seven requests, once, and then it is a file on disk like the rest.
 */
async function categoryMembers(
  wiki: string,
  category: string,
  refresh: boolean,
): Promise<string[]> {
  const slug = category.replace(/[^\p{L}\p{N}]+/gu, '-')
  const path = cachePath(`categories/${wiki}-${slug}.txt`)
  if (!refresh && existsSync(path)) {
    return readFileSync(path, 'utf8')
      .split('\n')
      .filter((title) => title !== '')
  }

  process.stderr.write(`  fetching ${wiki}.wiktionary ${category}\n`)
  const titles: string[] = []
  let cursor: string | undefined
  do {
    const url = new URL(`https://${wiki}.wiktionary.org/w/api.php`)
    for (const [key, value] of Object.entries({
      action: 'query',
      format: 'json',
      list: 'categorymembers',
      cmtitle: category,
      cmnamespace: '0',
      cmtype: 'page',
      cmlimit: String(CATEGORY_PAGE),
      ...(cursor === undefined ? {} : { cmcontinue: cursor }),
    })) {
      url.searchParams.set(key, value)
    }
    const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } })
    if (!response.ok) throw new Error(`${String(response.status)} from ${url.toString()}`)
    const body = (await response.json()) as CategoryResponse
    for (const member of body.query?.categorymembers ?? []) titles.push(member.title)
    cursor = body.continue?.cmcontinue
  } while (cursor !== undefined)

  // A category that answers with nothing has been renamed, and an empty validator would
  // quietly reject the whole language rather than fail.
  if (titles.length === 0) throw new Error(`${wiki}.wiktionary has no pages in ${category}`)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${titles.join('\n')}\n`)
  return titles
}

/**
 * Turns one source into the question "does this source accept this spelling?".
 *
 * The two kinds answer it differently. Wiktionary titles are a set, so membership is the
 * answer. Hunspell knows morphology rather than a list of forms, so it has to be *asked*,
 * and `hunspell -l` answers for the whole candidate list in one pass.
 *
 * Asking hunspell is a large improvement on the plan this replaced, which was to expand each
 * dictionary with `unmunch` and ship the result. Expansion produced 83 million Portuguese
 * forms, silently ignored Croatian's alias table, and silently passed Greek straight through.
 * All three problems were problems with expanding at all: nothing needs the full form list to
 * answer a yes-or-no question about thirty thousand words.
 */
export async function acceptedBy(
  source: Source,
  candidates: readonly string[],
  caseRule: CaseRule,
  refresh: boolean,
): Promise<Set<string>> {
  if (source.kind === 'titles') {
    const text = await fetchGunzipped(`titles/${source.wiki}.gz`, WIKTIONARY(source.wiki), refresh)
    // First line is the column header, and it is not a word in any language.
    return buildValidator(text.split('\n').slice(1), { caseRule })
  }
  if (source.kind === 'wordList') {
    const text = await fetchText(`lists/${source.id}.txt`, source.url, refresh)
    return buildValidator(text.split('\n'), { caseRule })
  }
  if (source.kind === 'category') {
    const members: string[] = []
    for (const category of source.categories) {
      members.push(...(await categoryMembers(source.wiki, category, refresh)))
    }
    return buildValidator(members, { caseRule })
  }
  return askHunspell(source.id, source.dic, source.aff, candidates, refresh)
}

/**
 * The words a source can contribute to the candidate pool, which only a word list can.
 *
 * A frequency list is a good way to *order* candidates and a bad way to decide which words
 * exist. SWALE occurs thirteen times in a corpus of film subtitles, which is a fact about
 * films rather than about English, and gating credit on it rejected a perfectly ordinary word.
 * So where a curated lexicon exists, every word in it is a candidate, whether the corpus has
 * ever seen it or not. Corpus frequency then decides only which words the board must be
 * solvable from.
 *
 * A category is a lexicon too, and this is the difference between the two Wiktionary kinds.
 * A title list is every language at once, so it cannot say which words are Tagalog; a
 * category says exactly that, and enumerating it turns thirty thousand lemmas the subtitle
 * corpus never saw into words that earn credit.
 *
 * Empty for the other two kinds. A hunspell dictionary cannot be enumerated without expanding
 * it, which is the trap documented in docs/DICTIONARIES.md.
 */
export async function lexicon(source: Source, refresh: boolean): Promise<readonly string[]> {
  if (source.kind === 'category') {
    const words: string[] = []
    for (const category of source.categories) {
      words.push(...(await categoryMembers(source.wiki, category, refresh)))
    }
    return words
  }
  if (source.kind !== 'wordList') return []
  const text = await fetchText(`lists/${source.id}.txt`, source.url, refresh)
  return text
    .split('\n')
    .map((word) => word.trim())
    .filter((word) => word !== '')
}

/**
 * Spell-checks the candidate list against a hunspell dictionary and returns what it accepted.
 *
 * `hunspell -l` prints the words it rejects, so the accepted set is everything else. Working
 * that way round matters: hunspell is generous about case, and feeding it lower-case
 * candidates is what makes it reject `james` while accepting `hiss`. The proper-noun filter
 * and the spell check are the same pass.
 */
async function askHunspell(
  id: string,
  dicUrl: string,
  affUrl: string,
  candidates: readonly string[],
  refresh: boolean,
): Promise<Set<string>> {
  const dic = await fetchText(`hunspell/${id}.dic`, dicUrl, refresh)
  const aff = await fetchText(`hunspell/${id}.aff`, affUrl, refresh)
  const dir = cachePath('hunspell')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${id}.dic`), dic)
  writeFileSync(join(dir, `${id}.aff`), aff)

  const listPath = cachePath(`candidates-${id}.txt`)
  writeFileSync(listPath, `${candidates.join('\n')}\n`)

  const rejected = execFileSync(
    'hunspell',
    ['-l', '-i', 'UTF-8', '-d', join(dir, id), listPath],
    // A large language rejects a lot of words, and the default buffer is not close to enough.
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  )
  const no = new Set(rejected.split('\n').filter((word) => word !== ''))
  const yes = new Set(candidates.filter((word) => !no.has(word)))
  // A dictionary that accepts everything or nothing has not been read; the aff file failed to
  // load, or the encoding is wrong. Either way the resulting word list would be nonsense.
  if (yes.size === 0 || yes.size === candidates.length) {
    throw new Error(
      `hunspell/${id} accepted ${String(yes.size)} of ${String(candidates.length)} candidates, ` +
        `which means it was not really consulted`,
    )
  }
  return yes
}

/** Refuses to run without the one external tool the pipeline needs. */
export function requireHunspell(): void {
  try {
    execFileSync('hunspell', ['-vv'], { stdio: 'ignore' })
  } catch {
    throw new Error('hunspell is not installed. `brew install hunspell` or the apt equivalent.')
  }
}
