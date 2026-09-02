import { alphabetFor } from '@blinkered/engine'
import type { Alphabet } from '@blinkered/engine'
import { frequencyUrl, type LanguageSpec } from './manifest.js'
import { fetchText } from './sources.js'
import { readCommonTier } from './weights.js'

/**
 * Finds a language's first-run tour board: six tiles, and the three words played on them.
 *
 * The constraints are all in `packages/words/src/tutorialBoard.ts` and all checked by
 * `tutorialBoard.test.ts`. What is here is the search, and the one judgement it makes: boards
 * are ranked by the **worst** of their three words in the corpus, so a board scores well only
 * when every word on it is one a speaker uses rather than one a dictionary admits.
 *
 * That ranking is the whole reason this is a tool rather than a person with a dictionary.
 * Ordering the candidates alphabetically produced ABENDE for German; summing the draw weights
 * produced EEENRS for English; ranking by corpus frequency produces the words on the shipped
 * boards, which run from rank 66 to rank 421.
 */

export interface CardPlan {
  readonly at: number
  readonly masked: string
  readonly becomes: string
  readonly word: string
}

export interface BoardPlan {
  /** In deal order: the three-letter word first, then the rest as they fall in the long word. */
  readonly tiles: readonly string[]
  readonly three: string
  readonly six: string
  readonly card: CardPlan
  readonly swap: { readonly from: string; readonly to: string }
  /** Corpus rank of the worst of the three words. Lower is better; this is the sort key. */
  readonly worstRank: number
}

/** A multiset key, so two spellings of the same letters land in the same bucket. */
function key(tiles: readonly string[]): string {
  return [...tiles].sort().join(' ')
}

/** Every way to choose three of six positions, which is the search over short words. */
function threeOfSix(): number[][] {
  const out: number[][] = []
  const walk = (start: number, acc: number[]): void => {
    if (acc.length === 3) {
      out.push([...acc])
      return
    }
    for (let at = start; at < 6; at += 1) {
      acc.push(at)
      walk(at + 1, acc)
      acc.pop()
    }
  }
  walk(0, [])
  return out
}

const THREE_OF_SIX = threeOfSix()

/**
 * Where each word falls in the corpus the list was built from.
 *
 * A word the corpus never saw has no rank and is skipped. That is stricter than the common
 * tier alone, and deliberately: a lexicon-supplied word is a real word and still the wrong
 * thing to open a tour with, because nobody has to have met it.
 */
async function corpusRanks(spec: LanguageSpec, refresh: boolean): Promise<Map<string, number>> {
  const text = await fetchText(`frequency/${spec.frequency}.txt`, frequencyUrl(spec), refresh)
  const alphabet = alphabetFor(spec.tag)
  const rank = new Map<string, number>()
  const lines = text.split('\n')
  for (const [at, line] of lines.entries()) {
    const word = line.split(' ')[0]
    if (word === undefined || word === '') continue
    const folded = alphabet.fold(word)
    if (!rank.has(folded)) rank.set(folded, at)
  }
  return rank
}

/** Words of exactly `size` tiles the corpus knows, bucketed by their letters. */
function bucket(
  words: readonly string[],
  alphabet: Alphabet,
  rank: ReadonlyMap<string, number>,
  size: number,
): Map<string, string[]> {
  const buckets = new Map<string, string[]>()
  for (const word of words) {
    if (!rank.has(word)) continue
    const tiles = alphabet.segment(word)
    if (tiles.length !== size) continue
    const bucketKey = key(tiles)
    const found = buckets.get(bucketKey)
    if (found === undefined) buckets.set(bucketKey, [word])
    else found.push(word)
  }
  for (const words_ of buckets.values()) {
    words_.sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0))
  }
  return buckets
}

/**
 * The commonest card the board can carry, or null if it can carry none.
 *
 * The card replaces one tile with a letter that is not already under it, which is what makes
 * the resulting word unspellable without the card: the word wants one more of that letter than
 * the board holds. So the test's "needs the card rather than merely allowing it" holds by
 * construction, and there is nothing here to check it against.
 */
function bestCard(
  tiles: readonly string[],
  sixes: ReadonlyMap<string, string[]>,
  letters: readonly string[],
  taken: readonly string[],
  rank: ReadonlyMap<string, number>,
): CardPlan | null {
  let best: CardPlan | null = null
  for (const [at, masked] of tiles.entries()) {
    const rest = tiles.filter((_, index) => index !== at)
    for (const becomes of letters) {
      if (becomes === masked) continue
      const found = sixes.get(key([...rest, becomes]))?.find((word) => !taken.includes(word))
      if (found === undefined) continue
      if (best === null || (rank.get(found) ?? 0) < (rank.get(best.word) ?? 0)) {
        best = { at, masked, becomes, word: found }
      }
    }
  }
  return best
}

/**
 * Deal order: the short word's tiles first and in its order, then whatever is left, in the
 * order the long word wants them.
 *
 * The first three tiles have to spell the short word *in order*, because the tour taps tile
 * one, two and three and the word has to appear as it goes.
 */
function dealOrder(three: readonly string[], six: readonly string[]): string[] {
  const pool = [...six]
  for (const tile of three) pool.splice(pool.indexOf(tile), 1)
  const tail = six.filter((tile) => {
    const at = pool.indexOf(tile)
    if (at < 0) return false
    pool.splice(at, 1)
    return true
  })
  return [...three, ...tail]
}

/** Ranked candidates, best first. */
export async function findBoards(spec: LanguageSpec, refresh: boolean): Promise<BoardPlan[]> {
  const alphabet = alphabetFor(spec.tag)
  const rank = await corpusRanks(spec, refresh)
  const common = readCommonTier(spec.tag)
  const threes = bucket(common, alphabet, rank, 3)
  const sixes = bucket(common, alphabet, rank, 6)
  const letters = Object.keys(alphabet.weights)

  const found: BoardPlan[] = []
  for (const [letterKey, words] of sixes) {
    const tiles = letterKey.split(' ')
    // Only the two commonest spellings of each letter set: a third anagram of the same tiles
    // is the same board wearing a different word and only crowds the ranking.
    for (const six of words.slice(0, 2)) {
      const long = alphabet.segment(six)
      let three: string | null = null
      for (const positions of THREE_OF_SIX) {
        const candidates = threes.get(key(positions.map((at) => tiles[at] as string)))
        if (candidates === undefined) continue
        // Not a prefix of the long word, or the correction is the same word typed slower.
        const pick = candidates.find(
          (word) => alphabet.segment(word).join('') !== long.slice(0, 3).join(''),
        )
        if (pick === undefined) continue
        if (three === null || (rank.get(pick) ?? 0) < (rank.get(three) ?? 0)) three = pick
      }
      if (three === null) continue

      // Deal order first, because the card records a tile *index* and the two orders differ:
      // `tiles` here is the sorted multiset key, and the board is dealt short word first.
      const board = dealOrder(alphabet.segment(three), long)
      const card = bestCard(board, sixes, letters, [six, three], rank)
      if (card === null) continue

      // The swap gives away the board's least useful letter for the most useful one it lacks,
      // which is the swap a player would want and so the one worth showing.
      const from = tiles.reduce((a, b) =>
        (alphabet.weights[a] ?? 0) <= (alphabet.weights[b] ?? 0) ? a : b,
      )
      const to = letters
        .filter((letter) => !tiles.includes(letter))
        .reduce((a, b) => ((alphabet.weights[a] ?? 0) >= (alphabet.weights[b] ?? 0) ? a : b))

      found.push({
        tiles: board,
        three,
        six,
        card,
        swap: { from, to },
        worstRank: Math.max(rank.get(three) ?? 0, rank.get(six) ?? 0, rank.get(card.word) ?? 0),
      })
    }
  }
  return found.sort((a, b) => a.worstRank - b.worstRank)
}

/** The entry as it goes into `packages/words/src/tutorialBoards.ts`. */
export function asEntry(tag: string, plan: BoardPlan): string {
  const tiles = plan.tiles.map((tile) => `'${tile}'`).join(', ')
  return (
    `  ${tag.includes('-') ? `'${tag}'` : tag}: {\n` +
    `    tiles: [${tiles}],\n` +
    `    three: '${plan.three}',\n` +
    `    six: '${plan.six}',\n` +
    `    card: { at: ${String(plan.card.at)}, becomes: '${plan.card.becomes}', ` +
    `word: '${plan.card.word}' },\n` +
    `    swap: { from: '${plan.swap.from}', to: '${plan.swap.to}' },\n` +
    `  },`
  )
}
