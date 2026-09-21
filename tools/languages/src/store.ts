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
 * What an evidence-built list is distributed under.
 *
 * Not an SPDX identifier, because there is no upstream license to name. A list here is the set
 * of words three independent collections were found to contain, and the dictionary that
 * suggested looking them up supplied a question rather than an answer. See the LICENSE written
 * into each directory, which says that at length, and `blinkered-attestation` for the argument.
 */
export const TERMS = 'attested'

export interface Entry {
  readonly tag: string
  readonly endonym: string
  readonly common: number
  readonly full: number
  readonly bytes: number
  readonly license: string
  readonly shareAlike: boolean
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
    .filter((entry) => entry.isDirectory() && entry.name !== 'licences')
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

function licenseFile(tag: string, upstream: Upstream): string {
  return `${alphabetFor(tag).endonym} word list
${repoUrl(tag)}
${upstream.commit}

No upstream license is named here, because none was relied on.

This list is not a copy of a dictionary and is not derived from one. Every word in it
ships because three independent collections of ${alphabetFor(tag).endonym} text were found
to contain it, and the file recording which collections, and where in them, is public at
the repository above. A dictionary did propose the words worth looking up. Nothing it
proposed survived into this file except as a question the evidence answered.

That is a citation rather than a license grant, and it is the whole point of the method:
a word list assembled this way inherits no terms from the dictionaries that suggested it,
because it took nothing from them that a license governs.

What this file is, then, is Blinkered's own compilation, distributed with the rest of
Blinkered. See LICENSE and NOTICE at the root of this repository. The evidence, the rule,
and the argument for both live in blinkered-attestation.
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
  writeFileSync(join(dir, 'LICENSE'), licenseFile(tag, upstream), 'utf8')
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
    license: TERMS,
    shareAlike: false,
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
    const line = new RegExp(`^(\\s*\\{ tag: '${tag}',.*?)(available: (?:true|false), )?(messages: )`, 'm')
    if (!line.test(source)) throw new Error(`registry.ts has no locale for "${tag}"`)
    source = source.replace(line, `$1available: ${String(available.has(tag))}, $3`)
  }
  writeFileSync(REGISTRY, source, 'utf8')
}
