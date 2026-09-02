import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { alphabetFor } from '@blinkered/engine'
import { buildIndex, calibrate, deriveWeights, parseWordList } from '@blinkered/words'
import type { LanguageSpec } from './manifest.js'
import { DATA_DIR } from './write.js'

/**
 * Re-derives a language's draw weights from the list that was just built for it.
 *
 * The order matters and is easy to get backwards. Board density depends on the draw weights,
 * so calibrating a cut against guessed weights calibrates against a guess. Derive first from
 * the shipped vocabulary, paste the result into the alphabet, then calibrate.
 *
 * Derived from the **common** tier, because that is the vocabulary a board has to be solvable
 * from. Weighting the bag toward the letters of words nobody knows would be the opposite of
 * the point.
 */
export function readCommonTier(tag: string): readonly string[] {
  const text = readFileSync(join(DATA_DIR, tag, 'words.txt'), 'utf8')
  return parseWordList(text).common
}

export interface DerivedReport {
  readonly tag: string
  /** Ready to paste into the alphabet, sorted the way the file already sorts letters. */
  readonly block: string
  readonly vowelShare: number
  readonly suggestedRare: readonly string[]
  readonly currentRare: readonly string[]
  /** Letters whose weight moved most, which is where a surprise is worth a look. */
  readonly biggestMoves: readonly string[]
}

export function derive(spec: LanguageSpec): DerivedReport {
  const alphabet = alphabetFor(spec.tag)
  const words = readCommonTier(spec.tag)
  const derived = deriveWeights([...words], alphabet)

  const letters = Object.keys(derived.weights).sort((a, b) => a.localeCompare(b))
  const block = letters
    .map((letter) => `    ${letter}: ${String(derived.weights[letter])},`)
    .join('\n')

  const moves = letters
    .map((letter) => ({
      letter,
      from: alphabet.weights[letter] ?? 0,
      to: derived.weights[letter] ?? 0,
    }))
    .filter((move) => Math.abs(move.to - move.from) >= 3)
    .sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from))
    .map((move) => `${move.letter} ${String(move.from)}->${String(move.to)}`)

  return {
    tag: spec.tag,
    block,
    vowelShare: derived.vowelShare,
    suggestedRare: derived.suggestedRareLetters,
    currentRare: alphabet.rareLetters,
    biggestMoves: moves,
  }
}

/**
 * The two calibrations in `packages/engine/src/difficulty.ts`, measured against the lists
 * that were actually built.
 *
 * This is not optional housekeeping. `defaultWMin` decides how many words a board must admit
 * before the generator accepts it, and it derives that from a curve measured on one word
 * list. Change the list and leave the curve alone, and the floor sits far above what any
 * board can reach: every draw is rejected, the generator burns its whole attempt budget, and
 * it plays the best of four hundred boards while reporting that it failed. Nothing crashes,
 * which is what makes it worth a tool rather than a comment.
 */
export interface FloorReport {
  /** Median words admitted at minimum length 3, for n = 4 to 12. */
  readonly medianWords: readonly number[]
  /** Share of those surviving each minimum word length, measured at n = 9. */
  readonly shareByMinimum: Readonly<Record<number, number>>
}

const FLOOR_SIZES = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const
const FLOOR_MINIMUMS = [2, 3, 4, 5, 6] as const
const FLOOR_SAMPLES = 1500
const FLOOR_BASELINE_SIZE = 9

export function floor(tag: string): FloorReport {
  const alphabet = alphabetFor(tag)
  const index = buildIndex(readCommonTier(tag), alphabet)
  const rows = calibrate(index, alphabet, {
    sizes: FLOOR_SIZES,
    minLengths: FLOOR_MINIMUMS,
    samples: FLOOR_SAMPLES,
  })
  const median = (n: number, minLength: number): number =>
    rows.find((row) => row.n === n && row.minLength === minLength)?.median ?? 0

  const baseline = median(FLOOR_BASELINE_SIZE, 3)
  const shareByMinimum: Record<number, number> = {}
  for (const minLength of FLOOR_MINIMUMS) {
    shareByMinimum[minLength] =
      baseline === 0 ? 0 : Number((median(FLOOR_BASELINE_SIZE, minLength) / baseline).toFixed(2))
  }
  return {
    medianWords: FLOOR_SIZES.map((n) => median(n, 3)),
    shareByMinimum,
  }
}

/**
 * How rich a language's board is relative to the language the curve was measured on.
 *
 * A Greek board admits well under half what an Italian one does, at the same board size and
 * the same cut, because a 24-letter alphabet with a 49% vowel share combines differently from
 * a 21-letter one. One floor for all of them would be too high for some and free for others,
 * so the floor is scaled by this.
 */
export function densityScale(tags: readonly string[], reference: string): Record<string, number> {
  const medianFor = (tag: string): number => {
    const alphabet = alphabetFor(tag)
    const index = buildIndex(readCommonTier(tag), alphabet)
    const [row] = calibrate(index, alphabet, { sizes: [12], minLengths: [3], samples: 300 })
    return row?.median ?? 0
  }
  const base = medianFor(reference)
  const scale: Record<string, number> = {}
  for (const tag of tags) scale[tag] = Number((medianFor(tag) / base).toFixed(2))
  return scale
}
