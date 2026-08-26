import { ENGLISH, type Alphabet } from './alphabet.js'
import { at } from './invariant.js'
import { nextInt, shuffle } from './rng.js'
import type { RngState } from './types.js'

/** Fraction of tiles drawn from the vowel bag, before rounding. */
const VOWEL_SHARE = 0.35

interface Bags {
  readonly vowels: readonly string[]
  readonly consonants: readonly string[]
}

const bags = new WeakMap<Alphabet, Bags>()

/** Weights expanded into flat bags, so a draw is one bounded index and no branches. */
function bagsFor(alphabet: Alphabet): Bags {
  const cached = bags.get(alphabet)
  if (cached) return cached
  const vowels: string[] = []
  const consonants: string[] = []
  for (const [letter, weight] of Object.entries(alphabet.weights)) {
    const bag = alphabet.vowels.includes(letter) ? vowels : consonants
    for (let copy = 0; copy < weight; copy++) bag.push(letter)
  }
  const built: Bags = { vowels, consonants }
  bags.set(alphabet, built)
  return built
}

function pick(state: RngState, bag: readonly string[]): [string, RngState] {
  const [index, next] = nextInt(state, bag.length)
  return [at(bag, index), next]
}

/**
 * A frequency-weighted draw with a vowel floor, so boards are playable before the generator
 * gets to reject them for admitting too few words or for holding a dead letter.
 */
export function drawLetters(
  state: RngState,
  n: number,
  alphabet: Alphabet = ENGLISH,
): [string[], RngState] {
  if (n < 2) throw new RangeError('a board needs at least two tiles')
  const { vowels, consonants } = bagsFor(alphabet)
  const vowelCount = Math.min(Math.max(2, Math.round(n * VOWEL_SHARE)), n - 1)
  const letters: string[] = []
  let rng = state
  for (let i = 0; i < n; i++) {
    const [letter, next] = pick(rng, i < vowelCount ? vowels : consonants)
    letters.push(letter)
    rng = next
  }
  return shuffle(rng, letters)
}
