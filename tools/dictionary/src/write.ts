import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { alphabetFor } from '@blinkered/engine'
import type { Built } from './build.js'
import { LENGTH_RANGE } from './build.js'
import { corpusTerms, corpusUrl } from './corpus.js'
import type { Source } from './manifest.js'

export const DATA_DIR = 'packages/words/data'

/**
 * Whether a license carries a share-alike obligation onto the shipped list. Recorded rather
 * than hidden: a permissively validated language can go anywhere, and one of these needs a
 * decision before a store build applies DRM to the binary around it. See DICTIONARIES.md.
 *
 * A prefix test rather than a list of exact versions. The list held only `CC-BY-SA-4.0`, so
 * Icelandic's CC-BY-SA-3.0 was flagged as unencumbered while its own LICENSE said otherwise,
 * and the next version of the license would have done it again.
 */
function shareAlike(license: string): boolean {
  return license.startsWith('CC-BY-SA-')
}

/** A source with no conditions at all. Recorded for attribution, not for terms. */
const PUBLIC_DOMAIN = 'LicenseRef-public-domain'

function describe(source: Source): string {
  switch (source.kind) {
    case 'hunspell':
      return `hunspell \`${source.id}\` (${source.license}) — ${source.attribution}`
    case 'titles':
      return `${source.wiki}.wiktionary.org page titles (${source.license}) — ${source.attribution}`
    case 'wordList':
      return `word list \`${source.id}\` (${source.license}) — ${source.attribution}`
    case 'jmdict':
      return `JMdict kana readings (${source.license}) — ${source.attribution}`
    case 'category':
      return (
        `${source.wiki}.wiktionary.org ${source.categories.join(', ')} ` +
        `(${source.license}) — ${source.attribution}`
      )
  }
}

/**
 * How the credit tier is bounded, in words rather than in a number that might be absent.
 *
 * Absent is the usual answer and the right one: the credit tier's job is to accept anything
 * the validator calls a word, and a rank cut there rejects words on the grounds that films
 * rarely mention them.
 */
function creditCut(spec: Built['spec']): string {
  const limit = spec.cuts.fullRank
  return limit === undefined ? 'no limit' : `rank ${String(limit)}`
}

/**
 * Every license the shipped list actually depends on.
 *
 * The validators, plus the corpus **only where the corpus decides membership**. Everywhere
 * else the corpus contributes ordering and no content — a word it proposes that no validator
 * accepts does not appear — which is the argument PROVENANCE.md makes, and it is sound. For an
 * `unvalidated` language that sentence is simply false: there is no validator, so the corpus
 * chooses every word in the file. Naijá is the one language in that position, and it is the
 * one whose terms came out empty.
 */
function licenses(built: Built): string[] {
  const validators = built.spec.groups.flat().map((source) => source.license)
  const fromCorpus = built.spec.unvalidated === true ? [corpusTerms(built.spec.corpus).license] : []
  return [...new Set([...validators, ...fromCorpus])].sort()
}

/**
 * The terms the derived list is distributed under: the most restrictive of its inputs.
 *
 * Deliberately conservative. The list is a thin derivative — a corpus ordering intersected
 * with a yes-or-no answer, with neither input shipped — and a good argument says it inherits
 * nothing. Making that argument is not the same as being right about it, and the cost of
 * assuming otherwise is nil for the languages that need it.
 */
function distributionTerms(built: Built): string {
  const all = licenses(built)
  const found = all.filter(shareAlike)
  // Sorted, so the oldest version wins where a language somehow depends on two. Nothing does
  // today; picking deterministically is cheaper than finding out the day something does.
  if (found[0] !== undefined) return found[0]
  // Public domain adds no condition, so it adds nothing to the terms either.
  const binding = all.filter((license) => license !== PUBLIC_DOMAIN)
  // No conditions from anywhere is not a missing answer, it is the permissive one. A list
  // derived from unconditioned inputs carries no copyleft, and saying so beats a blank line
  // where an SPDX identifier belongs.
  return binding.length === 0 ? 'MIT' : binding.join(' AND ')
}

function licenseFile(built: Built): string {
  const { spec } = built
  const terms = distributionTerms(built)
  return `Blinkered word list for ${alphabetFor(spec.tag).endonym} (${spec.tag})
SPDX-License-Identifier: ${terms}

This file is generated. It is not a copy of any dictionary. It is the list of words that
appear in a frequency-ordered corpus of ${spec.tag} AND are accepted by every validator
below, filtered to what the game can deal as tiles. Neither input is redistributed here.
Rebuild it with \`pnpm dictionary build --language=${spec.tag}\`.

Distributed under ${terms}, which is the most restrictive of the terms below. See
PROVENANCE.md for what was relied on and why.

Ordering
  ${corpusTerms(spec.corpus).attribution}
  ${corpusTerms(spec.corpus).license}

Validation
${spec.groups
  .flat()
  .map((source) => `  ${describe(source)}`)
  .join('\n')}

The full text of each license is in ../licenses/.
`
}

function provenanceFile(built: Built): string {
  const { spec, tiers, density } = built
  const percent = (share: number): string => `${(share * 100).toFixed(1)}%`
  return `# Provenance: ${alphabetFor(spec.tag).endonym} (${spec.tag})

Generated by \`pnpm dictionary build --language=${spec.tag}\`. Do not edit \`words.txt\` by
hand; edit the sources in \`tools/dictionary/src/manifest.ts\` and rebuild.

## What is in the file

| | |
| --- | --- |
| common tier | ${String(tiers.common.length)} words, counted toward the board's word floor |
| full tier | ${String(tiers.full.length)} words, accepted for credit |
| length | ${String(LENGTH_RANGE.minLength)} to ${String(LENGTH_RANGE.maxLength)} tiles |
| candidate cut | rank ${String(spec.cuts.commonRank)} for the common tier; ${creditCut(spec)} for credit |
| validation yield | ${percent(tiers.stats.commonYield)} at the common cut, ${percent(tiers.stats.fullYield)} at the full cut |
| corpus coverage | ${percent(tiers.stats.coverage)} of all occurrences |
| board density | median ${String(density.median)} words on 12 tiles, ${percent(density.ceilingRate)} hold a six-letter word |

## Sources

**Ordering.** ${corpusTerms(spec.corpus).attribution}, ${corpusTerms(spec.corpus).license}.
\`${corpusUrl(spec.corpus)}\`

Contributes which words are candidates and in what order. Contributes no content: a word it
proposes that no validator accepts does not appear.

**Validation.** A candidate must be accepted by every group; a group accepts it if any member
does.

${spec.groups
  .map(
    (group, index) =>
      `Group ${String(index + 1)}:\n${group.map((source) => `- ${describe(source)}`).join('\n')}`,
  )
  .join('\n\n')}

Hunspell sources are consulted with \`hunspell -l\`, which asks the dictionary about our
candidates rather than expanding it into every form it can generate. Expansion was tried
first and abandoned: see the \`unmunch\` section of docs/DICTIONARIES.md for the two ways it
fails without saying so.

## Terms relied on

${licenses(built)
  .map((license) => `- \`${license}\``)
  .join('\n')}

Where an upstream dictionary is offered under several licenses, the branch above is the one
relied on, and it is never GPL. Distributed under \`${distributionTerms(built)}\`.
${spec.caveat === undefined ? '' : `\n## Caveat\n\n${spec.caveat}\n`}`
}

export interface ManifestEntry {
  readonly tag: string
  readonly endonym: string
  readonly common: number
  readonly full: number
  readonly bytes: number
  readonly license: string
  readonly shareAlike: boolean
  readonly density: number
}

export function writeLanguage(built: Built): ManifestEntry {
  const dir = join(DATA_DIR, built.spec.tag)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'words.txt'), built.text, 'utf8')
  writeFileSync(join(dir, 'LICENSE'), licenseFile(built), 'utf8')
  writeFileSync(join(dir, 'PROVENANCE.md'), provenanceFile(built), 'utf8')

  const terms = distributionTerms(built)
  return {
    tag: built.spec.tag,
    endonym: alphabetFor(built.spec.tag).endonym,
    common: built.tiers.common.length,
    full: built.tiers.full.length,
    bytes: Buffer.byteLength(built.text, 'utf8'),
    license: terms,
    shareAlike: shareAlike(terms),
    density: built.density.median,
  }
}

/**
 * The index the app reads to know which languages exist.
 *
 * Committed alongside the data, so a build offers exactly the languages whose list is present
 * rather than every language the engine has an alphabet for.
 */
export function writeManifest(entries: readonly ManifestEntry[]): void {
  const sorted = [...entries].sort((a, b) => a.tag.localeCompare(b.tag))
  const body = { version: 1, languages: sorted }
  writeFileSync(join(DATA_DIR, 'manifest.json'), `${JSON.stringify(body, null, 2)}\n`, 'utf8')
}
