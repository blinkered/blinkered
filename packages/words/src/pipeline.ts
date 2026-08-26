import type { Alphabet } from '@blinkered/engine'

/**
 * Turning a frequency list and a dictionary into a word list Blinkered can ship.
 *
 * The shape of it, and the evidence for every number, is docs/DICTIONARIES.md. In short: a
 * frequency list proposes the candidates in the order people actually use them, a dictionary
 * decides which of them are words, and we ship the intersection. Nothing here does I/O, so
 * the decisions are testable and the fetching lives in tools/dictionary.
 *
 * One asymmetry runs through the whole file. A candidate has a **raw** spelling, which is
 * what a dictionary must be asked about, and a **folded** spelling, which is what the game
 * deals in tiles. French ÉPÉE is validated as `épée` and played as EPEE, and several raw
 * spellings can fold onto one playable word.
 */

export interface FrequencyEntry {
  readonly word: string
  /** Occurrences in the corpus. Only the ordering is load-bearing. */
  readonly count: number
}

/**
 * Reads a frequency list of `<word> <count>` lines, commonest first.
 *
 * Anything unparseable is skipped rather than fatal: these lists are corpus output, and a
 * stray blank or malformed line is not a reason to refuse to build a language.
 */
export function parseFrequencies(lines: Iterable<string>): FrequencyEntry[] {
  const entries: FrequencyEntry[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    const split = trimmed.lastIndexOf(' ')
    if (split <= 0) continue
    const count = Number(trimmed.slice(split + 1))
    if (!Number.isFinite(count) || count <= 0) continue
    entries.push({ word: trimmed.slice(0, split), count })
  }
  return entries
}

export interface Candidate {
  /** Folded onto the alphabet's tiles: the spelling the game plays. */
  readonly word: string
  readonly tiles: number
  /** Raw spellings that fold onto it, commonest first. What a validator is asked about. */
  readonly forms: readonly string[]
  /** Occurrences summed over those spellings. */
  readonly count: number
  /** Position by count, commonest first, counting from one. Where a tier cut is applied. */
  readonly rank: number
}

export interface CandidateOptions {
  readonly minLength?: number
  readonly maxLength?: number
}

/** Spread rather than `??` per field, so no default is an untestable branch. */
export const CANDIDATE_DEFAULTS: Required<CandidateOptions> = { minLength: 3, maxLength: 16 }

/**
 * Folds a frequency list onto an alphabet's tiles and drops everything unplayable: too short
 * to be worth a word, too long to fit the biggest board, or carrying a letter the alphabet
 * does not have.
 *
 * Words that fold together are merged and their counts added, which is the honest reading:
 * ACCION is one playable word however many accented and unaccented spellings the corpus has
 * for it, and it is as common as all of them together.
 */
export function foldCandidates(
  entries: Iterable<FrequencyEntry>,
  alphabet: Alphabet,
  options: CandidateOptions = {},
): Candidate[] {
  const { minLength, maxLength } = { ...CANDIDATE_DEFAULTS, ...options }
  const playable = new Set(Object.keys(alphabet.weights))
  const merged = new Map<string, { forms: string[]; count: number; tiles: number }>()

  for (const entry of entries) {
    const word = alphabet.fold(entry.word.trim())
    const tiles = alphabet.segment(word)
    if (tiles.length < minLength || tiles.length > maxLength) continue
    if (!tiles.every((tile) => playable.has(tile))) continue

    const known = merged.get(word)
    if (known === undefined) {
      merged.set(word, { forms: [entry.word], count: entry.count, tiles: tiles.length })
      continue
    }
    known.forms.push(entry.word)
    known.count += entry.count
  }

  return (
    [...merged]
      // Ties broken by spelling, so the same inputs always produce the same file.
      .sort(([leftWord, left], [rightWord, right]) =>
        right.count === left.count ? leftWord.localeCompare(rightWord) : right.count - left.count,
      )
      .map(([word, entry], index) => ({
        word,
        tiles: entry.tiles,
        forms: entry.forms,
        count: entry.count,
        rank: index + 1,
      }))
  )
}

/**
 * What a validator source's capitalisation is evidence of.
 *
 * A frequency list is lower-cased throughout, so the case in the *dictionary* is the only
 * case information the pipeline has, and it is worth a lot: an entry a dictionary lists only
 * as `James` is a name, and one it lists as `hiss` is a word.
 *
 * - `lowerCaseOnly` reads it that way and drops the capitalised entries. Right for almost
 *   every language, and the reason JAMES, MRS and MMM are not in the English list.
 * - `ignoreCase` throws the evidence away. Required for German, where every noun is
 *   capitalised, so `lowerCaseOnly` would delete the nouns and leave the verbs. The cost is
 *   that German admits some proper nouns; see the German section of docs/DICTIONARIES.md.
 */
export type CaseRule = 'lowerCaseOnly' | 'ignoreCase'

export interface ValidatorOptions {
  readonly caseRule?: CaseRule
}

export const VALIDATOR_DEFAULTS: Required<ValidatorOptions> = { caseRule: 'lowerCaseOnly' }

/**
 * Collects the spellings one validator source accepts, in the case a candidate will be asked
 * about: lower case, because that is how a frequency list spells everything.
 */
export function buildValidator(
  entries: Iterable<string>,
  options: ValidatorOptions = {},
): Set<string> {
  const { caseRule } = { ...VALIDATOR_DEFAULTS, ...options }
  const accepted = new Set<string>()
  for (const entry of entries) {
    const word = entry.trim()
    if (word === '') continue
    if (caseRule === 'ignoreCase') {
      accepted.add(word.toLowerCase())
      continue
    }
    if (isLowerCase(word)) accepted.add(word)
  }
  return accepted
}

/**
 * True when a word is written in lower case and has a case to be written in. The second half
 * matters: a string of digits is neither upper nor lower, and answering yes would let it
 * through a filter meant to catch names.
 */
export function isLowerCase(word: string): boolean {
  return word === word.toLowerCase() && word !== word.toUpperCase()
}

/**
 * A candidate is a word when every validator group says so, and a group says so when any of
 * its members does.
 *
 * The two levels are both wanted. Independent sources for one language are intersected,
 * which is what makes the shipped list better than either of them. Variants of one language
 * are unioned: en-US and en-GB are one group, so COLOUR and COLOR both play, which is a gift
 * to the player rather than a decision to make on their behalf.
 */
export function isAccepted(candidate: Candidate, groups: readonly ReadonlySet<string>[]): boolean {
  return groups.every((group) => candidate.forms.some((form) => group.has(form)))
}

export interface TierCuts {
  /** Candidate rank at or below which an accepted word counts toward the board's word floor. */
  readonly commonRank: number
  /**
   * Candidate rank at or below which an accepted word earns credit, or absent for no limit.
   *
   * Absent is the right answer wherever the validator knows the language: the full tier's job
   * is to be generous, and a rank cut there refuses words the dictionary was perfectly happy
   * to accept. WEAL sits at rank 85,602 in the English corpus, so a 50,000 cut rejected a word
   * every English speaker knows.
   *
   * A limit is still wanted where the validator cannot tell one language from another. A
   * Wiktionary in language X documents words of every other language, and the deep tail of a
   * subtitle corpus is full of them, so an uncapped cut there would quietly accept English
   * words as Italian.
   */
  readonly fullRank?: number
}

/** The resolved credit cut: every candidate, unless a limit was asked for. */
export function fullCut(cuts: TierCuts): number {
  return cuts.fullRank ?? Number.POSITIVE_INFINITY
}

export interface TierStats {
  /** Playable candidates the frequency list offered, before any cut. */
  readonly candidates: number
  readonly commonConsidered: number
  readonly fullConsidered: number
  readonly commonKept: number
  readonly fullKept: number
  /** Share of considered candidates a validator accepted. Falls as the cut goes deeper. */
  readonly commonYield: number
  readonly fullYield: number
  /**
   * Share of `totalTokens` that the full tier accounts for. The caller decides what the
   * denominator is; the pipeline is handed playable occurrences, so this reads as the share
   * of the playable language the cut reaches. The corpus-size-independent sanity check on a
   * cut; see DICTIONARIES.md.
   */
  readonly coverage: number
}

export interface Tiers {
  /** Counted toward W by the board generator. A subset of `full`. */
  readonly common: readonly string[]
  /** Accepted for credit. */
  readonly full: readonly string[]
  readonly stats: TierStats
}

/**
 * Applies the cuts and the validators, and reports enough to judge whether the cuts were
 * right. Both tiers come out sorted, so a rebuild that changes nothing produces no diff.
 */
export function splitTiers(
  candidates: readonly Candidate[],
  groups: readonly ReadonlySet<string>[],
  cuts: TierCuts,
  totalTokens: number,
): Tiers {
  const common: string[] = []
  const full: string[] = []
  let commonConsidered = 0
  let fullConsidered = 0
  let keptTokens = 0

  const deepest = fullCut(cuts)
  for (const candidate of candidates) {
    if (candidate.rank > deepest) break
    fullConsidered += 1
    const withinCommon = candidate.rank <= cuts.commonRank
    if (withinCommon) commonConsidered += 1
    if (!isAccepted(candidate, groups)) continue
    full.push(candidate.word)
    keptTokens += candidate.count
    if (withinCommon) common.push(candidate.word)
  }

  common.sort()
  full.sort()
  return {
    common,
    full,
    stats: {
      candidates: candidates.length,
      commonConsidered,
      fullConsidered,
      commonKept: common.length,
      fullKept: full.length,
      commonYield: share(common.length, commonConsidered),
      fullYield: share(full.length, fullConsidered),
      coverage: share(keptTokens, totalTokens),
    },
  }
}

/** Nothing measured against nothing is zero, not a division by zero. */
function share(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole
}

/** Magic line every shipped list starts with, so a truncated or wrong file is obvious. */
const HEADER = '#blinkered/wordlist/1'

/**
 * Renders both tiers as one file, common words first, with the split recorded in the header.
 *
 * One file rather than two because the browser fetches it: two tiers mean two roles for one
 * dictionary, not two downloads, and a header line is cheaper than a second round trip.
 */
export function formatWordList(language: string, tiers: Tiers): string {
  const head = `${HEADER} language=${language} common=${String(tiers.common.length)} full=${String(tiers.full.length)}`
  const common = new Set(tiers.common)
  const rest = tiers.full.filter((word) => !common.has(word))
  return [head, ...tiers.common, ...rest, ''].join('\n')
}

export interface ParsedWordList {
  readonly language: string
  readonly common: readonly string[]
  readonly full: readonly string[]
}

/**
 * Reads a shipped list back. Strict on purpose: a dev server answers a missing path with an
 * HTML page, and a word list that silently parses as one word would be worse than an error.
 */
export function parseWordList(text: string): ParsedWordList {
  const lines = text.split('\n')
  // `split` always yields at least one element, so the header line is always there to read.
  const head = lines[0] as string
  if (!head.startsWith(HEADER)) throw new Error('not a Blinkered word list')

  const fields = new Map<string, string>()
  for (const field of head.slice(HEADER.length).trim().split(/\s+/)) {
    const split = field.indexOf('=')
    if (split > 0) fields.set(field.slice(0, split), field.slice(split + 1))
  }
  const language = fields.get('language') ?? ''
  const commonCount = Number(fields.get('common'))
  const fullCount = Number(fields.get('full'))

  const words = lines.slice(1).filter((word) => word !== '')
  const counted = Number.isInteger(commonCount) && Number.isInteger(fullCount)
  if (!counted || words.length !== fullCount || commonCount > fullCount) {
    throw new Error(`word list for "${language}" is truncated or mislabelled`)
  }
  return { language, common: words.slice(0, commonCount), full: words }
}
