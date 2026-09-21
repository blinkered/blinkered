import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { alphabetFor } from '@blinkered/engine'
import { calibrate, buildIndex } from '@blinkered/words'
import type { ParsedWordList } from '@blinkered/words'
import type { Status, Upstream } from './upstream.js'
import { repoUrl } from './upstream.js'

export const DATA = fileURLToPath(new URL('../../../packages/words/data/', import.meta.url))
export const REGISTRY = fileURLToPath(
  new URL('../../../packages/i18n/src/registry.ts', import.meta.url),
)

/** The same board the density number has always been measured on. See tools/dictionary. */
const DENSITY_SAMPLES = 300
const DENSITY_TILES = 12
const MIN_LENGTH = 3

/**
 * What to say when a repository has not said.
 *
 * Not a default and not a guess at the answer: a language's terms are declared in its own
 * `status.json`, beside `ships`, and this is what goes in the manifest until one is. A borrowed
 * list with no stated terms is a gap worth showing rather than a blank worth filling, so the
 * report names every language in this state and says what to add upstream.
 */
export const UNDECLARED = 'undeclared'

/** The language's name in English, for English prose. `endonym` is its name for itself. */
function englishName(tag: string): string {
  return new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' }).of(tag) ?? tag
}

export interface Entry {
  readonly tag: string
  readonly endonym: string
  readonly common: number
  readonly full: number
  readonly bytes: number
  readonly license: string
  readonly density: number
  /** Where these bytes came from. Absent only for a list that predates borrowing. */
  readonly upstream?: Upstream
}

interface Manifest {
  readonly version: number
  readonly languages: readonly Entry[]
}

export function manifestPath(): string {
  return join(DATA, 'manifest.json')
}

/** What this repository is holding right now, which is what a regression is measured against. */
export function readManifest(): Entry[] {
  const path = manifestPath()
  if (!existsSync(path)) return []
  return [...(JSON.parse(readFileSync(path, 'utf8')) as Manifest).languages]
}

export function hasList(tag: string): boolean {
  return existsSync(join(DATA, tag, 'words.txt'))
}

/** Every language directory on disk, which is not the same as every language in the manifest. */
export function onDisk(): string[] {
  return readdirSync(DATA, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(DATA, entry.name, 'words.txt')))
    .map((entry) => entry.name)
    .sort()
}

/** How many words a typical twelve-tile board admits from the common tier. */
export function density(tag: string, parsed: ParsedWordList): number {
  const alphabet = alphabetFor(tag)
  const index = buildIndex([...parsed.common], alphabet)
  const [row] = calibrate(index, alphabet, {
    sizes: [DENSITY_TILES],
    minLengths: [MIN_LENGTH],
    samples: DENSITY_SAMPLES,
  })
  if (row === undefined) throw new Error(`${tag}: calibration produced no rows`)
  return row.median
}

function licenseFile(tag: string, upstream: Upstream, status: Status): string {
  const language = englishName(tag)
  const terms =
    status.license === undefined
      ? `The repository above has not declared terms for this list in its status.json.
Until it does, this file cannot state them, and nothing here should be read as a
grant. See that repository's own LICENSE and NOTICE.`
      : `${status.license}. Declared by the repository above, in its status.json, and
copied here rather than decided here: the terms of a word list belong to whoever
assembled the evidence for it.

Note that this covers the list. A dictionary repository is not all one licence; its
build scripts are under its own LICENSE, which is a different question and does not
travel with the words.`

  return `${language} word list
${repoUrl(tag)}
${upstream.commit}

${terms}

No upstream dictionary is named, because none was relied on. This list is not a copy of
a dictionary and is not derived from one. Every word in it ships because three
independent collections of ${language} text were found to contain it, and the record of
which collections, and where in them, is public at the repository above. A dictionary
did propose the words worth looking up, and nothing it proposed survives here except as
a question the evidence answered.
`
}

function provenanceFile(
  tag: string,
  parsed: ParsedWordList,
  upstream: Upstream,
  status: Status,
  when: Date,
): string {
  const endonym = alphabetFor(tag).endonym
  return `# ${endonym} (\`${tag}\`)

Borrowed, not built. This list is a copy of what \`${upstream.repo}\` publishes on its main
branch, and that repository is where it is made, measured and argued about.

| | |
| --- | --- |
| upstream | ${repoUrl(tag)} |
| commit | [\`${upstream.commit.slice(0, 12)}\`](${repoUrl(tag)}/commit/${upstream.commit}) |
| committed | ${upstream.committed} |
| blob | \`${upstream.blob}\` |
| borrowed | ${when.toISOString()} |
| common | ${parsed.common.length.toLocaleString('en-US')} |
| full | ${parsed.full.length.toLocaleString('en-US')} |
| digest | \`${parsed.digest === '' ? 'none' : parsed.digest}\` |

## Why it ships

\`${upstream.repo}\` says so, in its own \`status.json\`${
    status.decided === undefined ? '' : `, decided ${status.decided}`
  }:

> ${(status.why ?? 'Blessed upstream, with no reason recorded.').replace(/\s+/g, ' ').trim()}

That is a separate question from whether the list deals a playable board, and a higher one. This
repository checks the board; only the repository that built the list is in a position to say
whether the list is any good. A language can clear the floor comfortably and be held back anyway.

## Where the words come from

Every word here is attested: three independent collections of ${endonym} text were found to
contain it, and the evidence recording which, and where, is committed upstream next to the
list. Independence is counted over families rather than collections, because three pages of
one web crawl can easily be three mirrors of one dictionary.

The dictionaries that used to build this list still have a job, and it is a smaller one: they
propose the words worth looking up. Their candidate lists live in
\`blinkered-attestation/candidates\`, apart from the lists they judge.

## What to do about this file

Nothing by hand. \`pnpm languages update\` rewrites it from whatever the upstream repository
publishes, and refuses to disable a language that used to work without an operator saying so.
Editing it here would only make this repository disagree with the one that is right.
`
}

export interface Borrowed {
  readonly entry: Entry
  readonly previous?: Entry
}

/** Writes one language into the repository, and returns what the manifest should say about it. */
export function borrow(
  tag: string,
  text: string,
  parsed: ParsedWordList,
  upstream: Upstream,
  status: Status,
  when: Date,
): Entry {
  const dir = join(DATA, tag)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'words.txt'), text, 'utf8')
  writeFileSync(join(dir, 'LICENSE'), licenseFile(tag, upstream, status), 'utf8')
  writeFileSync(
    join(dir, 'PROVENANCE.md'),
    provenanceFile(tag, parsed, upstream, status, when),
    'utf8',
  )

  return {
    tag,
    endonym: alphabetFor(tag).endonym,
    common: parsed.common.length,
    full: parsed.full.length,
    bytes: Buffer.byteLength(text, 'utf8'),
    license: status.license ?? UNDECLARED,
    density: density(tag, parsed),
    upstream,
  }
}

/** Removes a language's directory. Only ever reached with the operator's approval. */
export function discard(tag: string): void {
  rmSync(join(DATA, tag), { recursive: true, force: true })
}

export function writeManifest(entries: readonly Entry[]): void {
  const sorted = [...entries].sort((a, b) => a.tag.localeCompare(b.tag))
  const body = { version: 1, languages: sorted }
  writeFileSync(manifestPath(), `${JSON.stringify(body, null, 2)}\n`, 'utf8')
}

/**
 * Sets `available` on each localization, which is the one place the app asks.
 *
 * A line edit rather than a generated file, because `registry.ts` is written by hand and holds
 * the reasoning for every flag, endonym and exonym in it. One locale is one line, and the flag
 * is rewritten in place; a locale the file does not have is a fault worth stopping for rather
 * than a line to append, since a tag with no messages is not a localization.
 */
export function setAvailable(available: ReadonlySet<string>, tags: readonly string[]): void {
  let source = readFileSync(REGISTRY, 'utf8')
  for (const tag of tags) {
    // Found by position rather than by line. A locale is one line until prettier decides it is
    // too long, and then it is seven: `arz` and `pcm` both carry a `namedIn` and both wrap. A
    // line-based edit read the file as having no locale for them at all, which is the right
    // error for a tag nobody translated and a bad one for a tag sitting there wrapped.
    const entry = source.indexOf(`tag: '${tag}',`)
    if (entry === -1) throw new Error(`registry.ts has no locale for "${tag}"`)
    // The first flag after the tag is that locale's: every entry has exactly one, and the tag
    // line comes first in all of them.
    const flag = /available: (?:true|false),/.exec(source.slice(entry))
    if (flag === null) throw new Error(`registry.ts locale "${tag}" has no available flag`)
    const at = entry + flag.index
    source = `${source.slice(0, at)}available: ${String(available.has(tag))},${source.slice(at + flag[0].length)}`
  }
  writeFileSync(REGISTRY, source, 'utf8')
}
