import { alphabetFor } from '@blinkered/engine'
import {
  buildIndex,
  calibrate,
  foldCandidates,
  formatWordList,
  fullCut,
  parseFrequencies,
  splitTiers,
} from '@blinkered/words'
import type { Candidate, FrequencyEntry, TierCuts, Tiers } from '@blinkered/words'
import { acceptedBy, lexicon } from './sources.js'
import { frequencyLines } from './corpus.js'
import type { LanguageSpec } from './manifest.js'

/** Nothing shorter is worth a word; nothing longer than the biggest board is reachable. */
export const LENGTH_RANGE = { minLength: 3, maxLength: 16 } as const

/**
 * Occurrences of everything the game could deal, which is what coverage is measured against.
 *
 * Not the whole corpus. Half of any corpus is one- and two-letter words, and counting those
 * in the denominator would put every language at around two thirds and say nothing: the
 * question is what share of the *playable* language a cut reaches.
 */
function playableTokens(candidates: readonly Candidate[]): number {
  return candidates.reduce((sum, candidate) => sum + candidate.count, 0)
}

/** Boards drawn when measuring density. Enough to trust a median, few enough to be quick. */
const DENSITY_SAMPLES = 300
const DENSITY_TILES = 12

export interface Density {
  readonly median: number
  /** Share of boards holding a word long enough to be worth holding out for. */
  readonly ceilingRate: number
}

export interface Built {
  readonly spec: LanguageSpec
  readonly tiers: Tiers
  readonly density: Density
  readonly text: string
}

/**
 * The whole pipeline for one language: fetch, fold, validate, cut, measure.
 *
 * Validation is asked only about the candidates that could survive the deeper cut, which is
 * what keeps a language cheap to build. There is no point asking a spell checker about the
 * millionth commonest word in a subtitle corpus.
 */
export async function build(spec: LanguageSpec, refresh: boolean): Promise<Built> {
  const alphabet = alphabetFor(spec.tag)
  const entries = await pool(spec, refresh)
  const candidates = foldCandidates(entries, alphabet, LENGTH_RANGE)
  const totalTokens = playableTokens(candidates)
  const deepest = fullCut(spec.cuts)
  const considered = candidates.filter((candidate) => candidate.rank <= deepest)
  const groups = await validators(spec, considered, refresh)

  const tiers = splitTiers(candidates, groups, spec.cuts, totalTokens)
  if (tiers.common.length === 0) throw new Error(`${spec.tag}: nothing survived validation`)

  return {
    spec,
    tiers,
    density: measure(spec, tiers),
    text: formatWordList(spec.tag, tiers),
  }
}

/**
 * Every word worth asking about: the corpus, ordered, plus any curated lexicon.
 *
 * A lexicon word the corpus has never seen gets a count of zero, so it sorts to the end and
 * ranks below every cut the common tier applies. That is exactly right: it earns credit like
 * any other word, and it cannot be one of the words a board is required to be solvable from.
 */
async function pool(spec: LanguageSpec, refresh: boolean): Promise<FrequencyEntry[]> {
  const entries = parseFrequencies(await frequencyLines(spec.corpus, refresh))
  const seen = new Set(entries.map((entry) => entry.word))
  const counts = new Map(entries.map((entry) => [entry.word.toLowerCase(), entry.count] as const))

  /**
   * A phrase is only as common as its rarest part, and every part has to be attested: one
   * unknown syllable and the whole entry falls back to zero, which is the honest answer for a
   * compound built out of something the corpus has never seen.
   */
  const fromParts = (word: string): number => {
    if (spec.phrasesFromParts !== true) return 0
    const parts = word.split(/\s+/u)
    if (parts.length < 2) return 0
    const each = parts.map((part) => counts.get(part.toLowerCase()) ?? 0)
    return Math.min(...each)
  }

  const extra: FrequencyEntry[] = []
  for (const source of spec.groups.flat()) {
    for (const word of await lexicon(source, refresh)) {
      if (seen.has(word)) continue
      seen.add(word)
      extra.push({ word, count: fromParts(word) })
    }
  }
  return [...entries, ...extra]
}

/** One set per group, its members unioned, ready for `isAccepted` to intersect. */
async function validators(
  spec: LanguageSpec,
  considered: readonly Candidate[],
  refresh: boolean,
): Promise<ReadonlySet<string>[]> {
  if (spec.groups.length === 0) {
    // Naija, and only by asking. See `unvalidated` in the manifest for why it is allowed and
    // why an empty group list on its own is not.
    if (spec.unvalidated === true) return []
    throw new Error(`${spec.tag}: no validator, so every candidate would be accepted unchecked`)
  }
  const forms = [...new Set(considered.flatMap((candidate) => candidate.forms))]
  const caseRule = spec.caseRule ?? 'lowerCaseOnly'

  const groups: ReadonlySet<string>[] = []
  for (const group of spec.groups) {
    const union = new Set<string>()
    for (const source of group) {
      for (const word of await acceptedBy(source, forms, caseRule, refresh)) union.add(word)
    }
    groups.push(union)
  }
  return groups
}

/**
 * How many words a typical board admits from the common tier.
 *
 * This is the number the cut is calibrated against, because it is the one a player feels. It
 * is measured on the common tier alone: the full tier grants credit, but a board's solvability
 * has to rest on vocabulary people actually have. See docs/DICTIONARIES.md.
 */
export function measure(spec: LanguageSpec, tiers: Tiers): Density {
  const alphabet = alphabetFor(spec.tag)
  const index = buildIndex(tiers.common, alphabet)
  const [row] = calibrate(index, alphabet, {
    sizes: [DENSITY_TILES],
    minLengths: [LENGTH_RANGE.minLength],
    samples: DENSITY_SAMPLES,
  })
  if (row === undefined) throw new Error(`${spec.tag}: calibration produced no rows`)
  return { median: row.median, ceilingRate: row.ceilingRate }
}

/**
 * Sweeps the common cut and reports what each one does to board density, so the size of a
 * language's dictionary is decided by how the game plays rather than by a round number.
 */
export async function sweep(
  spec: LanguageSpec,
  ranks: readonly number[],
  refresh: boolean,
): Promise<{ cut: number; tiers: Tiers; density: Density }[]> {
  const alphabet = alphabetFor(spec.tag)
  const entries = await pool(spec, refresh)
  const candidates = foldCandidates(entries, alphabet, LENGTH_RANGE)
  const totalTokens = playableTokens(candidates)

  const deepest = Math.max(...ranks)
  const considered = candidates.filter((candidate) => candidate.rank <= deepest)
  const groups = await validators(spec, considered, refresh)

  return ranks.map((cut) => {
    const cuts: TierCuts = { commonRank: cut, fullRank: cut }
    const tiers = splitTiers(candidates, groups, cuts, totalTokens)
    return { cut, tiers, density: measure(spec, tiers) }
  })
}
