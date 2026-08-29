/** Rules that a player or a difficulty preset can change. Frozen for the life of a game. */
export interface GameConfig {
  /** Number of tiles on the board. */
  readonly n: number
  /**
   * Chance, per tile per deal, that a tile is dealt showing a wild instead of its letter.
   *
   * One number rather than a column in the difficulty table. `n` is the same on every setting and
   * only the clock and the minimum word length change, so the same rate is worth less where there
   * is less time to use it: the mechanic self-balances. Zero turns wild cards off entirely.
   */
  readonly wildChance: number
  /**
   * Chance, per deal, that one tile's letter is replaced by another.
   *
   * Per deal and not per tile, unlike `wildChance`. A replacement is announced and watched; two at
   * once would be two things to watch and the player would catch neither.
   *
   * Set for anti-cheat rather than for flavour. The hold phase shows the whole board face up on
   * purpose, so a player can photograph it and hand twelve letters to a solver, and no amount of
   * hiding can close that: the exposure is the mechanic. What closes it is the board going stale.
   * At 0.5 a transcription is wrong within a round or two, which is a different number from one
   * chosen to feel good. Zero turns replacement off entirely.
   */
  readonly replaceChance: number
  /** Real seconds per tick. The visible timer counts ticks, not seconds. */
  readonly speedMultiplier: number
  readonly initialFlips: number
  /** Minimum common-tier words a generated board must admit. Enforced by @blinkered/words. */
  readonly wMin: number
  /**
   * Shortest acceptable ceiling: a generated board must admit at least one word this long.
   * Without it a board can hold plenty of words and still be unprofitable, since under the
   * fibonacci economy a five-letter word only breaks even. Enforced by @blinkered/words.
   */
  readonly ceilingMin: number
  readonly minWordLength: number
  /**
   * Extra ticks the board sits fully exposed before it hides. Zero means the last tile
   * lands with one tick left and that is all the time there is. Buys thinking and typing
   * time without making the letters easier, and without changing what a round costs.
   */
  readonly holdTicks: number
  readonly wordCompleteMode: WordCompleteMode
  readonly flipEconomy: FlipEconomy
  /** Charge the full N flips for a round even when it ends early. See docs/PLAN.md 1.10. */
  readonly chargeFullRound: boolean
  /** BCP 47 tag naming the alphabet the board was drawn from and words are folded with. */
  readonly language: string
  readonly engineVersion: string
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane'

/** What the board does when a word is accepted. */
export type WordCompleteMode = 'shuffle' | 'spend' | 'keep'

/** What an accepted word pays in flips. */
export type FlipEconomy = 'none' | 'perLetter' | 'fibonacci' | 'overMinimum'

/** Serialisable PRNG state. Lives in game state so a seed replays exactly. */
export interface RngState {
  readonly seed: number
}

export interface Tile {
  /** Stable for the life of the game. Array index into GameState.tiles. */
  readonly id: number
  readonly letter: string
  /** Slot in the grid, reading order. Changes on every shuffle. */
  readonly position: number
  /** Face up. */
  readonly revealed: boolean
  /** Consumed by an accepted word, under the `spend` mode. */
  readonly spent: boolean
  /**
   * Showing as a wild this round, standing for whatever letter completes a word.
   *
   * A mask, not a substitution: `letter` is untouched underneath and is showing again next round.
   * The board is the same letters from first deal to last, which is what keeps this mechanic
   * separate from letter replacement rather than an early draft of it.
   */
  readonly wild: boolean
}

export interface FoundWord {
  readonly word: string
  /**
   * Which of its letters came from a wild, by index. Empty for an ordinary word.
   *
   * Recorded rather than only announced, because the list of found words outlives the effect
   * that announced it: the rail keeps marking what was given for the rest of the game.
   */
  readonly wilds: readonly number[]
  readonly length: number
  readonly points: number
  readonly flips: number
  readonly roundIndex: number
  /** Ticks elapsed since the game began. */
  readonly tick: number
}

export type GameStatus = 'playing' | 'over'

export interface GameState {
  readonly config: GameConfig
  readonly rng: RngState
  /** Indexed by tile id. */
  readonly tiles: readonly Tile[]
  /** Tile ids in tap order. This is the sole source of truth for the current word. */
  readonly selection: readonly number[]
  readonly roundIndex: number
  readonly ticksRemaining: number
  readonly revealsThisRound: number
  readonly flipsRemaining: number
  readonly score: number
  readonly wordsFound: readonly FoundWord[]
  readonly tick: number
  readonly status: GameStatus
}

export type GameEvent =
  | { readonly type: 'TICK' }
  /** Pointer input. */
  | { readonly type: 'TAP_TILE'; readonly tileId: number }
  /** Keyboard input. Selects the next unselected eligible tile bearing this letter. */
  | { readonly type: 'SELECT_LETTER'; readonly letter: string }
  /** Keyboard input. Deselects every selected tile bearing this letter. */
  | { readonly type: 'CLEAR_LETTER'; readonly letter: string }
  /**
   * Keyboard input. Takes the next unselected copy of this letter, or clears them all once
   * every copy is spoken for.
   *
   * One event rather than the view choosing between SELECT and CLEAR, because that choice
   * depends on live game state: a view deciding from a snapshot gives different results
   * depending on whether it happened to re-render between two keystrokes.
   */
  | { readonly type: 'CYCLE_LETTER'; readonly letter: string }
  /** Backspace. Drops the last letter. */
  | { readonly type: 'UNDO_LETTER' }
  /** Escape. */
  | { readonly type: 'RESET_WORD' }
  /** Enter. */
  | { readonly type: 'SUBMIT_WORD' }

export type RejectReason =
  | 'unknown'
  | 'duplicate'
  | 'too-short'
  /**
   * Every letter the wild could have been makes a word already found.
   *
   * Its own reason because the player cannot see what it would have picked, so "not a word" would
   * be a lie about a selection that was several words at once.
   */
  | 'all-found'

export type IgnoredReason =
  'game-over' | 'no-such-letter' | 'not-tappable' | 'already-selected' | 'nothing-selected'

/** What the UI animates and sounds. Emitted instead of making the view diff state. */
export type Effect =
  | { readonly type: 'REVEALED'; readonly tileId: number }
  | { readonly type: 'SELECTED'; readonly tileId: number }
  | { readonly type: 'DESELECTED'; readonly tileIds: readonly number[] }
  | { readonly type: 'INPUT_IGNORED'; readonly reason: IgnoredReason }
  | {
      readonly type: 'WORD_ACCEPTED'
      readonly word: string
      readonly points: number
      readonly flips: number
      /**
       * Which letters of the word came from a wild, by index into the tile sequence. Empty for an
       * ordinary word. The view marks these so the player can see what they were given rather
       * than what they chose.
       */
      readonly wilds: readonly number[]
    }
  | { readonly type: 'WORD_REJECTED'; readonly word: string; readonly reason: RejectReason }
  | {
      readonly type: 'ROUND_ENDED'
      /** New tile id per grid position, for the shuffle animation. */
      readonly layout: readonly number[]
      readonly flipsCharged: number
    }
  /**
   * One tile's letter became another, at the deal.
   *
   * Carries both letters because the view has to show the change rather than the result: by the
   * time this arrives the board already holds the new letter, and a player who is told only what
   * a tile is now has no way to know what it used to be.
   */
  | {
      readonly type: 'LETTER_REPLACED'
      readonly tileId: number
      readonly from: string
      readonly to: string
    }
  | { readonly type: 'GAME_OVER' }

/** What a set of tiles is worth: the two numbers board acceptance is decided on. */
export interface BoardProfile {
  /** Distinct words of at least `minLength` tiles the letters admit, each tile used once. */
  readonly count: number
  /** Tiles in the longest such word: the ceiling that decides whether a board can pay. */
  readonly longest: number
}

/**
 * The word list, in its two roles.
 *
 * `has` is credit and answers from the full tier, so an unusual word still scores. `profile` is
 * the floor and counts only the common tier, so a board is guaranteed solvable from vocabulary
 * people actually use. See docs/DICTIONARIES.md.
 *
 * `profile` is here rather than in @blinkered/words because letter replacement needs it inside
 * `reduce`: a replacement has to leave the board still admitting its words, and that is the
 * generator's acceptance test applied to a board that already exists. Requiring it rather than
 * making it optional is deliberate. A dictionary that could not profile would replay a game
 * differently from one that could, and silent divergence between a client and the server
 * verifying it is the exact failure the pure reducer exists to rule out. Required makes it a type
 * error instead.
 */
export interface Dictionary {
  has(word: string): boolean
  profile(letters: readonly string[], minLength: number): BoardProfile
}
