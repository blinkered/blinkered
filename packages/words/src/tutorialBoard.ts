/**
 * One language's first-run tour: six tiles, and the three words played on them.
 *
 * Here rather than in the web app because it is dictionary-derived data, and because the thing
 * that keeps it true is a test against the shipped word lists, which live in this package.
 */
export interface TutorialBoard {
  /** The six tiles, in deal order. The first three spell `three`. */
  readonly tiles: readonly string[]
  /** The short word the tour spells first, from the first three tiles in order. */
  readonly three: string
  /** The long word it corrects to, using all six tiles. */
  readonly six: string
  readonly card: {
    /** Which tile the card masks. */
    readonly at: number
    /**
     * What the card turns out to be.
     *
     * Never the letter it is masking. Resolving to the tile underneath is an anagram wearing a
     * card and teaches nothing about what a card is for.
     */
    readonly becomes: string
    /** The word that makes, from the other five tiles plus `becomes`. */
    readonly word: string
  }
  /** The letter swap the tour shows between rounds. `from` is on the board; `to` is not. */
  readonly swap: { readonly from: string; readonly to: string }
}

/** A multiset of tiles, for comparing a word against what a board can spell. */
function bag(tiles: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const tile of tiles) counts.set(tile, (counts.get(tile) ?? 0) + 1)
  return counts
}

/** Whether `tiles` can be spelled from `pool`, counting repeats. */
export function spellableFrom(tiles: readonly string[], pool: readonly string[]): boolean {
  const have = bag(pool)
  for (const tile of tiles) {
    const left = have.get(tile) ?? 0
    if (left === 0) return false
    have.set(tile, left - 1)
  }
  return true
}

/** The tiles a board offers once the card is masking one of them and has turned into `becomes`. */
export function tilesWithCard(board: TutorialBoard): string[] {
  return board.tiles.map((tile, at) => (at === board.card.at ? board.card.becomes : tile))
}
