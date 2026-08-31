import { nextFloat, nextInt, shuffle } from './rng.js'
import { at } from './invariant.js'
import type { Alphabet } from './alphabet.js'
import type { Dictionary, GameConfig, RngState, Tile } from './types.js'

/**
 * Letter replacement: one tile's letter becoming another at the deal.
 *
 * This is the mechanic wild cards deliberately are not. A wild *masks* a letter for a round and
 * the board keeps its twelve letters from first deal to last; a replacement changes what the
 * board is made of, permanently, and the old letter is gone.
 *
 * It exists for one reason: the hold phase shows the whole board face up on purpose, so a player
 * can photograph twelve letters and hand them to an anagram solver. No amount of hiding closes
 * that, because the exposure is the mechanic. What closes it is the board going stale.
 */

/** One tile's letter becoming another. */
export interface Replacement {
  readonly tileId: number
  readonly from: string
  readonly to: string
}

/**
 * Every letter that could take this slot without dropping the board below its floor.
 *
 * The test is the generator's acceptance test, applied to a board that already exists rather than
 * to a draw: at least `wMin` common words and one of at least `ceilingMin` tiles. It deliberately
 * takes no notice of what the player has already found. The promise a board makes is that it
 * holds W words, not that it holds W words nobody has played yet, and a floor that shrank as the
 * game went on would end every long game by refusing to change anything.
 *
 * Candidates come from `alphabet.weights`, which is keyed by every value the language can deal
 * and is therefore the authoritative tile set: in Croatian a tile can be LJ, NJ or DŽ.
 *
 * The outgoing letter is excluded. Replacing E with E after an animation that promised a change
 * is a broken promise, and the player cannot tell it from a bug.
 *
 * Nothing here enforces the vowel floor that `drawLetters` applies to a fresh board, and nothing
 * needs to: a board that loses its last vowel admits almost no words, so the count test refuses it
 * without having to know what a vowel is.
 */
function candidatesFor(
  letters: readonly string[],
  slot: number,
  alphabet: Alphabet,
  dictionary: Dictionary,
  config: GameConfig,
): string[] {
  const passing: string[] = []
  const trial = [...letters]
  for (const value of Object.keys(alphabet.weights)) {
    if (value === letters[slot]) continue
    trial[slot] = value
    const { count, longest } = dictionary.profile(trial, config.minWordLength)
    if (count >= config.wMin && longest >= config.ceilingMin) passing.push(value)
  }
  return passing
}

/**
 * Draws one letter from those that pass, weighted the way a fresh board is drawn.
 *
 * Weighted rather than uniform because a uniform draw over the alphabet would put Z on the board
 * as often as E, and at this replacement rate a game is six or so swaps long: a board would drift
 * from a plausible mix of letters towards a flat one over the course of a game, getting steadily
 * stranger to play on. Weighting the survivors keeps the board looking like a board.
 */
function draw(passing: readonly string[], alphabet: Alphabet, rng: RngState): [string, RngState] {
  // Built from `entries` rather than by indexing `weights` per candidate, which states that every
  // candidate came from this same map and so keeps the weight a number rather than a maybe. Every
  // weight the shipped alphabets carry is at least one, so a non-empty `passing` fills the bag.
  const survivors = new Set(passing)
  const bag: string[] = []
  for (const [value, weight] of Object.entries(alphabet.weights)) {
    if (!survivors.has(value)) continue
    for (let copy = 0; copy < weight; copy++) bag.push(value)
  }
  const [index, next] = nextInt(rng, bag.length)
  return [at(bag, index), next]
}

/**
 * Decides whether a letter is replaced this deal, and which.
 *
 * Slots are tried in a drawn order rather than in tile order. Which slot is chosen has to be
 * uniform, and it also matters when the first choice has no valid replacement: taking the tiles in
 * order would always fall back to the same second tile, so a board with one awkward letter would
 * develop a fixed pecking order the player could learn.
 *
 * Measured on the shipped dictionaries, 85% to 94% of single-letter swaps clear the floor and no
 * slot in two hundred trials had no valid letter at all, so the loop almost always ends on its
 * first pass. Testing one slot exhaustively costs an alphabet's worth of solver runs, about 35ms,
 * against a deal the player is watching an animation through. See docs/PROPOSALS.md.
 *
 * Returning `null` rather than forcing a swap is the answer when nothing passes anywhere. The word
 * floor is a promise to the player and the churn is a defense against a cheat; breaking the first
 * to honor the second is the wrong way round.
 */
export function replaceLetter(
  rng: RngState,
  tiles: readonly Tile[],
  config: GameConfig,
  alphabet: Alphabet,
  dictionary: Dictionary,
): [Tile[], Replacement | null, RngState] {
  const unchanged = (state: RngState): [Tile[], null, RngState] => [[...tiles], null, state]
  if (config.replaceChance <= 0) return unchanged(rng)

  const [roll, afterRoll] = nextFloat(rng)
  if (roll >= config.replaceChance) return unchanged(afterRoll)

  const letters = tiles.map((tile) => tile.letter)
  const [order, afterOrder] = shuffle(
    afterRoll,
    tiles.map((tile) => tile.id),
  )
  for (const tileId of order) {
    const passing = candidatesFor(letters, tileId, alphabet, dictionary, config)
    if (passing.length === 0) continue
    const [letter, next] = draw(passing, alphabet, afterOrder)
    const replaced = tiles.map((tile) => (tile.id === tileId ? { ...tile, letter } : tile))
    return [replaced, { tileId, from: at(letters, tileId), to: letter }, next]
  }

  return unchanged(afterOrder)
}
