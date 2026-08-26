import { drawLetters, letterFaults, seedRng } from '@flippy/engine'
import type { Alphabet } from '@flippy/engine'
import type { WordIndex } from './wordIndex.js'

export interface DeriveOptions {
  /** Total tiles in the notional bag. Bigger means finer-grained weights. */
  readonly bagSize?: number
  /** Weight at or below which a letter is too rare to allow twice on one board. */
  readonly rareAtOrBelow?: number
}

export interface DerivedWeights {
  /** Draw weight per tile, ready to drop into an Alphabet. */
  readonly weights: Record<string, number>
  /** Share of the bag that is vowels, which is what the draw's vowel floor should track. */
  readonly vowelShare: number
  /** Letters rare enough that two on one board makes a poor game. A suggestion, not a verdict. */
  readonly suggestedRareLetters: string[]
  /** Raw frequency per tile across the list, before rounding. For eyeballing the result. */
  readonly frequency: Record<string, number>
  readonly wordsCounted: number
}

/**
 * Derives draw weights from a word list, so a language's letter distribution comes from its
 * own vocabulary rather than from a guess.
 *
 * Counts each distinct word once (type frequency), not each occurrence in running text (token
 * frequency). For a tile game that is the better basis: it reflects the letters a solver will
 * actually need to spell the words in the list, rather than how often newspapers print THE.
 */
/** Spread rather than `??` per field, so no option has an untestable default branch. */
export const DERIVE_DEFAULTS: Required<DeriveOptions> = { bagSize: 100, rareAtOrBelow: 1 }

export function deriveWeights(
  words: readonly string[],
  alphabet: Alphabet,
  options: DeriveOptions = {},
): DerivedWeights {
  const { bagSize, rareAtOrBelow } = { ...DERIVE_DEFAULTS, ...options }

  const counts = new Map<string, number>()
  let total = 0
  for (const word of words) {
    for (const tile of alphabet.segment(word)) {
      counts.set(tile, (counts.get(tile) ?? 0) + 1)
      total += 1
    }
  }

  const frequency: Record<string, number> = {}
  const weights: Record<string, number> = {}
  for (const tile of Object.keys(alphabet.weights)) {
    const count = counts.get(tile) ?? 0
    const share = total === 0 ? 0 : count / total
    frequency[tile] = share
    // Every letter of the alphabet stays drawable, however rare, or words using it die.
    weights[tile] = Math.max(1, Math.round(share * bagSize))
  }

  const bag = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
  const vowelWeight = Object.entries(weights)
    .filter(([tile]) => alphabet.vowels.includes(tile))
    .reduce((sum, [, weight]) => sum + weight, 0)

  return {
    weights,
    vowelShare: vowelWeight / bag,
    suggestedRareLetters: Object.entries(weights)
      .filter(([tile, weight]) => weight <= rareAtOrBelow && !alphabet.vowels.includes(tile))
      .map(([tile]) => tile)
      .sort(),
    frequency,
    wordsCounted: words.length,
  }
}

/** How many draws per requested sample before giving up on an unworkable alphabet. */
const ATTEMPTS_PER_SAMPLE = 50

export interface CalibrationRow {
  readonly n: number
  readonly minLength: number
  readonly p25: number
  readonly median: number
  readonly p75: number
  /** Share of accepted draws holding a word long enough to turn a profit. */
  readonly ceilingRate: number
  readonly faultRate: number
}

export interface CalibrateOptions {
  readonly sizes?: readonly number[]
  readonly minLengths?: readonly number[]
  readonly samples?: number
  readonly seed?: number
  /** Length a board must reach to be worth playing. Six under the fibonacci economy. */
  readonly ceiling?: number
}

export const CALIBRATE_DEFAULTS: Required<CalibrateOptions> = {
  sizes: [6, 7, 8, 9, 10, 11, 12],
  minLengths: [2, 3, 4, 5, 6],
  samples: 1500,
  seed: 1,
  ceiling: 6,
}

/**
 * Samples boards and reports how many words they admit, which is what the word floor in
 * `defaultWMin` has to be calibrated against. Those numbers describe a dictionary, not the
 * rules, so they have to be regenerated whenever the word list changes.
 */
export function calibrate(
  index: WordIndex,
  alphabet: Alphabet,
  options: CalibrateOptions = {},
): CalibrationRow[] {
  const { sizes, minLengths, samples, seed, ceiling } = { ...CALIBRATE_DEFAULTS, ...options }
  const rows: CalibrationRow[] = []

  for (const n of sizes) {
    // One set of boards per size, measured at every minimum length, so the rows agree.
    const boards: string[][] = []
    let faults = 0
    let rng = seedRng(seed)
    // An alphabet whose every draw is faulty would otherwise spin here forever.
    const ceilingOnAttempts = samples * ATTEMPTS_PER_SAMPLE
    for (let attempt = 0; boards.length < samples; attempt++) {
      if (attempt >= ceilingOnAttempts) {
        throw new RangeError(`cannot draw ${String(samples)} sound boards of ${String(n)} tiles`)
      }
      const [letters, next] = drawLetters(rng, n, alphabet)
      rng = next
      if (letterFaults(letters, alphabet).length > 0) {
        faults += 1
        continue
      }
      boards.push(letters)
    }

    for (const minLength of minLengths) {
      const counts: number[] = []
      let reachedCeiling = 0
      for (const board of boards) {
        const { count, longest } = index.profile(board, minLength)
        counts.push(count)
        if (longest >= ceiling) reachedCeiling += 1
      }
      counts.sort((a, b) => a - b)
      rows.push({
        n,
        minLength,
        p25: quantile(counts, 0.25),
        median: quantile(counts, 0.5),
        p75: quantile(counts, 0.75),
        ceilingRate: reachedCeiling / boards.length,
        faultRate: faults / (faults + boards.length),
      })
    }
  }
  return rows
}

function quantile(sorted: readonly number[], share: number): number {
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * share))
  // Non-empty by construction: a calibration row is only built from at least one board.
  return sorted[index] as number
}
