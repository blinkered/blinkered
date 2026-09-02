import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { cachePath, download } from './sources.js'

/**
 * JMdict, which is the only way Japanese gets into this pipeline at all.
 *
 * Every other language is ordered by a corpus and vetted by a dictionary, and the two are
 * independent on purpose. Japanese cannot have that, for a reason that is a fact about the
 * language rather than a gap in the sourcing: **the game is played in kana and a corpus is
 * written in kanji.** Ranking readings by corpus frequency would mean mapping every written
 * form to its reading, which is a morphological analyser's job, and the OpenSubtitles list is
 * no help even before that — Japanese has no spaces, so a tokeniser has already had a go at it,
 * and what comes out is 分か, 言, 知, 聞: stems with the inflection sheared off.
 *
 * JMdict carries both halves. It holds the readings, and roughly a tenth of them carry an `nf`
 * priority band — a rank in blocks of five hundred, from a newspaper corpus. So the ordering and
 * the membership come from one file here, which is worth saying out loud and is not a licence to
 * skip the separation everywhere else.
 *
 * CC BY-SA 4.0, which five shipped languages already use.
 */

export const JMDICT = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz'

export const JMDICT_LICENSE = 'CC-BY-SA-4.0'
export const JMDICT_ATTRIBUTION =
  'JMdict, the Electronic Dictionary Research and Development Group, James William Breen and ' +
  'contributors'

/** Bands run nf01 to nf48, commonest first, so the count is the band turned the right way up. */
const BANDS = 48

export interface Reading {
  /** As JMdict writes it: hiragana for native words, katakana for borrowed ones. */
  readonly kana: string
  /** Occurrences to report, which is the band inverted. Zero for a reading with no band. */
  readonly count: number
}

/**
 * Every reading in JMdict, with the ranked ones ranked.
 *
 * Extracted with a regular expression rather than an XML parser. The file is one shape, every
 * entry is `<entry>…</entry>`, and the two elements wanted are `<reb>` and the priority tags;
 * a parser would pull thirty megabytes into a tree to answer that.
 */
export async function jmdictReadings(refresh: boolean): Promise<Reading[]> {
  const cached = cachePath('jmdict/readings.txt')
  if (!refresh && existsSync(cached)) return parse(readFileSync(cached, 'utf8'))

  const path = await download('jmdict/JMdict_e.gz', JMDICT, refresh)
  process.stderr.write('  reading JMdict\n')
  const xml = gunzipSync(readFileSync(path)).toString('utf8')

  const best = new Map<string, number>()
  for (const entry of xml.split('<entry>').slice(1)) {
    // The band on either the kanji or the reading element: an entry is common if either is.
    const bands = [...entry.matchAll(/<[rk]e_pri>nf(\d+)<\/[rk]e_pri>/g)].map((hit) =>
      Number(hit[1]),
    )
    const count = bands.length === 0 ? 0 : BANDS + 1 - Math.min(...bands)
    for (const hit of entry.matchAll(/<reb>([^<]+)<\/reb>/g)) {
      const kana = hit[1] as string
      best.set(kana, Math.max(best.get(kana) ?? 0, count))
    }
  }

  const readings = [...best]
    .sort(([leftKana, left], [rightKana, right]) =>
      right === left ? leftKana.localeCompare(rightKana) : right - left,
    )
    .map(([kana, count]) => ({ kana, count }))

  mkdirSync(dirname(cached), { recursive: true })
  writeFileSync(
    cached,
    `${readings.map(({ kana, count }) => `${kana} ${String(count)}`).join('\n')}\n`,
  )
  process.stderr.write(`  ${String(readings.length)} readings\n`)
  return readings
}

function parse(text: string): Reading[] {
  const readings: Reading[] = []
  for (const line of text.split('\n')) {
    const split = line.lastIndexOf(' ')
    if (split <= 0) continue
    readings.push({ kana: line.slice(0, split), count: Number(line.slice(split + 1)) })
  }
  return readings
}
