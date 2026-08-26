/** Rules that a player or a difficulty preset can change. Frozen for the life of a game. */
export interface GameConfig {
  /** Number of tiles on the board. */
  readonly n: number
  /** Real seconds per tick. The visible timer counts ticks, not seconds. */
  readonly speedMultiplier: number
  readonly initialFlips: number
  /** Minimum common-tier words a generated board must admit. Enforced by @flippy/words. */
  readonly wMin: number
  /**
   * Shortest acceptable ceiling: a generated board must admit at least one word this long.
   * Without it a board can hold plenty of words and still be unprofitable, since under the
   * fibonacci economy a five-letter word only breaks even. Enforced by @flippy/words.
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
}

export interface FoundWord {
  readonly word: string
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
  /** Backspace. Drops the last letter. */
  | { readonly type: 'UNDO_LETTER' }
  /** Escape. */
  | { readonly type: 'RESET_WORD' }
  /** Enter. */
  | { readonly type: 'SUBMIT_WORD' }

export type RejectReason = 'unknown' | 'duplicate' | 'too-short'

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
    }
  | { readonly type: 'WORD_REJECTED'; readonly word: string; readonly reason: RejectReason }
  | {
      readonly type: 'ROUND_ENDED'
      /** New tile id per grid position, for the shuffle animation. */
      readonly layout: readonly number[]
      readonly flipsCharged: number
    }
  | { readonly type: 'GAME_OVER' }

/** The full-tier word list. Credit is granted against this. */
export interface Dictionary {
  has(word: string): boolean
}
