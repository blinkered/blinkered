import { nextFloat, nextInt, shuffle } from './rng.js'
import type { Alphabet } from './alphabet.js'
import type { Dictionary, RngState, Tile } from './types.js'

/**
 * Wild cards: tiles dealt showing a wild instead of their letter.
 *
 * A mask rather than a substitution. The letter underneath is untouched and shows again next
 * round, so the board is the same letters from first deal to last. That is the line between this
 * and letter replacement, which changes what the board is made of.
 *
 * A wild is strictly better than the letter it hides, because it can always become that letter.
 * So masking cannot make a board unsolvable, and the generator and the word floor need no
 * knowledge of any of this.
 */

/**
 * How many wilds may be on the board at once.
 *
 * Resolution costs a dictionary lookup per candidate, so one wild is an alphabet's worth and two
 * is that squared: about a thousand for Russian, which is nothing. Three is thirty-five thousand
 * and four is a million.
 *
 * The cap belongs on the deal rather than on the submission, and the first version had it the
 * wrong way round. Refusing a word for containing three wilds tells the player "not a word" about
 * a selection that is thousands of words, and they cannot see why: exactly the confusion
 * `all-found` exists to prevent. At 0.02 it would almost never happen, which is what made it look
 * harmless, but `wildChance` is adjustable up to 0.5, and there three wilds is the usual case.
 *
 * Capping the deal removes the failure instead of hiding it, and leaves nothing to explain in the
 * rules. With a minimum word length of three it also guarantees at least one real letter in every
 * word, so the engine never writes one entirely by itself.
 */
export const MAX_WILDS = 2

/**
 * What a wild shows, and what a rejected selection containing one is called back to the player.
 *
 * A card rather than a letter or a blank. A blank is indistinguishable from a tile that has not
 * turned yet, which is the one thing the board must never be ambiguous about.
 */
export const WILD_GLYPH = '🃏'

/**
 * Rolls which tiles are dealt as wilds. Called on every deal, so a wild moves round to round.
 *
 * Every tile rolls independently, and the result is then capped at `MAX_WILDS`. When the roll
 * produces more than that, which ones survive is drawn rather than taken in order: keeping the
 * first two would make tile 0 likelier to be wild than tile 11, and a board whose bonus favours
 * the top-left is a board with a tell.
 */
export function dealWilds(
  rng: RngState,
  tiles: readonly Tile[],
  chance: number,
): [Tile[], RngState] {
  if (chance <= 0) return [tiles.map((tile) => ({ ...tile, wild: false })), rng]

  let state = rng
  const rolled: number[] = []
  for (const tile of tiles) {
    const [roll, next] = nextFloat(state)
    state = next
    if (roll < chance) rolled.push(tile.id)
  }

  let keep = rolled
  if (rolled.length > MAX_WILDS) {
    const [order, next] = shuffle(state, rolled)
    state = next
    keep = order.slice(0, MAX_WILDS)
  }

  const wild = new Set(keep)
  return [tiles.map((tile) => ({ ...tile, wild: wild.has(tile.id) })), state]
}

export interface Resolution {
  /** The word the selection turned out to be. */
  readonly word: string
  /** Indices into the selection that were wild, so the view can mark what was given. */
  readonly wilds: readonly number[]
}

export type ResolveOutcome =
  | { readonly kind: 'resolved'; readonly resolution: Resolution; readonly rng: RngState }
  /** No letter completes a word here at all. */
  | { readonly kind: 'unknown' }
  /** Letters do complete words, but every one of them is a word already found. */
  | { readonly kind: 'all-found' }
  /** More wilds than resolution is willing to search. */
  | { readonly kind: 'too-many-wilds' }

/**
 * Works out what a selection containing wilds spells.
 *
 * Every combination of letters the wilds could take is tried against the dictionary, and one of
 * the words that result is chosen at random. Random is fair here in a way it would not be in
 * another game: `wordScore` depends only on length, and every resolution of one selection has the
 * same length, so they are all worth exactly the same. There is nothing for a cleverer choice to
 * win.
 *
 * The draw comes from the game's own seeded RNG rather than `Math.random`, because the engine is
 * deterministic from `(seed, difficulty, event log)` and a server has to be able to replay a game
 * to verify its score. One `Math.random` here would end that quietly.
 *
 * Candidates come from the alphabet's own tile values, not from A to Z. `weights` is keyed by
 * every value the language can deal, which makes it the authoritative list: a tile in Croatian can
 * be LJ, NJ or DŽ, and a wild has to be able to become one.
 */
export function resolveWilds(
  faces: readonly { readonly letter: string; readonly wild: boolean }[],
  alphabet: Alphabet,
  dictionary: Dictionary,
  found: ReadonlySet<string>,
  rng: RngState,
): ResolveOutcome {
  const slots = faces.map((face, at) => ({ at, wild: face.wild })).filter((face) => face.wild)
  // A guard, not a rule: the deal caps wilds at `MAX_WILDS`, so a selection cannot exceed it in
  // play. It stays because this function is callable on any faces at all, and a million lookups
  // is a worse answer than a refusal.
  if (slots.length > MAX_WILDS) return { kind: 'too-many-wilds' }

  const wilds = slots.map((slot) => slot.at)
  // Every real word the wilds could make, before excluding the ones already played. Keeping both
  // lists is what separates "this is not a word" from "you have had all of these already".
  const matches: string[] = []

  // Every assignment of alphabet tiles to wild slots, depth-first. Bounded by the cap above.
  const walk = (index: number, letters: string[]): void => {
    if (index === wilds.length) {
      const word = letters.join('')
      if (dictionary.has(word)) matches.push(word)
      return
    }
    const at = wilds[index] as number
    for (const value of Object.keys(alphabet.weights)) {
      const next = [...letters]
      next[at] = value
      walk(index + 1, next)
    }
  }
  walk(
    0,
    faces.map((face) => face.letter),
  )

  const candidates = matches.filter((word) => !found.has(word))
  if (candidates.length === 0) {
    return matches.length > 0 ? { kind: 'all-found' } : { kind: 'unknown' }
  }

  const [pick, next] = nextInt(rng, candidates.length)
  return {
    kind: 'resolved',
    resolution: { word: candidates[pick] as string, wilds },
    rng: next,
  }
}
