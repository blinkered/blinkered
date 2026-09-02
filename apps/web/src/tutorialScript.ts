import { WILD_GLYPH, alphabetFor, flipReward, wordScore } from '@blinkered/engine'
import { TUTORIAL_BOARDS, tilesWithCard } from '@blinkered/words'
import type { GameConfig } from '@blinkered/engine'
import type { TutorialBoard } from '@blinkered/words'
import type { Messages } from '@blinkered/i18n'

/**
 * The tour's choreography, worked out from the language's board rather than typed out.
 *
 * It used to be a literal list of frames against six hard-coded English letters, which was
 * readable and could only ever be English. The boards are per language now, so the beats have to
 * be derived: which tile to tap for which letter of a word is a different answer in every one of
 * them, and in Croatian a tile can be two characters.
 */

/** What a tile is doing in a frame. */
const DOWN = '.'
const UP = '#'
const CARD = '*'

export interface Frame {
  /** One character per tile: `.` face down, `#` face up, `*` showing a card. */
  readonly up: string
  /** Tile indices in tap order, so `[0, 3]` is the first tile then the fourth. */
  readonly sel: readonly number[]
  readonly caption: string
  /** The word line, when it should say something other than the plain selected letters. */
  readonly word?: string
  /** Where in `word` the card's letter landed, marked the way the found-word rail marks it. */
  readonly wildAt?: number
  /** Flips and points a completed word just paid, for the badges the HUD shows in a real game. */
  readonly gain?: { readonly flips: number; readonly points: number }
  /**
   * Whether the Complete button is lit.
   *
   * The button is drawn on every frame of the words screen, because it is on screen throughout a
   * real game; this says when the tour is pressing it. A caption telling you to press something
   * that is nowhere on the screen is the tour describing a different interface from the one it
   * is showing you.
   */
  readonly pressing?: boolean
}

export interface Step {
  readonly title: string
  readonly frames: readonly Frame[]
  /** Drawn alongside or instead of the board, on the screens that need something else. */
  readonly panel?: 'controls' | 'swap' | 'complete'
  /** The letters on the tiles. Only the last screen differs, having taken the swap. */
  readonly tiles: readonly string[]
}

export function boardFor(language: string): TutorialBoard {
  // English when a language has an alphabet but no board, which is a language with no word list
  // and so one the picker never offers.
  return TUTORIAL_BOARDS[language] ?? (TUTORIAL_BOARDS.en as TutorialBoard)
}

/** A mask with the first `n` tiles face up. */
function upTo(n: number, total: number): string {
  return UP.repeat(n) + DOWN.repeat(total - n)
}

/**
 * Which tile to tap for each letter of a word, taking the leftmost tile that still offers it.
 *
 * Leftmost matters: it is what makes a repeated letter come off the board in reading order, the
 * same way the game's own keyboard resolves one.
 */
function tapOrder(word: readonly string[], tiles: readonly string[]): number[] {
  const taken = new Set<number>()
  const order: number[] = []
  for (const letter of word) {
    const at = tiles.findIndex((tile, index) => !taken.has(index) && tile === letter)
    if (at < 0) return []
    taken.add(at)
    order.push(at)
  }
  return order
}

/** What a finished word is worth, from the engine, so the badges show the game's real numbers. */
function gainFor(tiles: number, config: GameConfig): { flips: number; points: number } {
  return { flips: flipReward(tiles, config), points: wordScore(tiles) }
}

export function stepsFor(messages: Messages, language: string, config: GameConfig): Step[] {
  const board = boardFor(language)
  const alphabet = alphabetFor(language)
  const tiles = board.tiles
  const n = tiles.length
  const all = upTo(n, n)

  const longWord = alphabet.segment(board.six)
  const longOrder = tapOrder(longWord, tiles)

  /*
   * How far back the tour has to give letters before it can spell the long word.
   *
   * The short word is the first three tiles in order, so the selections agree only while the
   * long word wants those same tiles in that same order. In English STAGES starts on the same S
   * that SAT does, so only two letters come back and the S is kept, which is what makes it read
   * as a correction rather than as starting over. In German WERDEN shares nothing with DER, so
   * all three come back. Both are the same rule.
   */
  let keep = 0
  while (keep < 3 && longOrder[keep] === keep) keep += 1

  const words: Frame[] = []
  const say = (caption: string, sel: readonly number[], mask: string, extra: Partial<Frame> = {}) =>
    void words.push({ up: mask, sel: [...sel], caption, ...extra })

  // The first three tiles are already up: the previous screen turned them over.
  say(messages.tutPickLetters, [], upTo(3, n))
  for (let taken = 1; taken <= 3; taken += 1) {
    say(messages.tutPickLetters, [0, 1, 2].slice(0, taken), upTo(3, n), {
      ...(taken === 3 ? { word: board.three } : {}),
    })
  }
  // The rest of the board turns over while the short word is still selected, which is the point
  // of the caption: a better letter can still be coming.
  for (let shown = 4; shown <= n; shown += 1) {
    say(messages.tutMoreTurn, [0, 1, 2], upTo(shown, n), { word: board.three })
  }
  // Giving letters back, one tap at a time, down to whatever the long word can reuse.
  for (let held = 2; held >= keep; held -= 1) {
    say(messages.tutTapBack, [0, 1, 2].slice(0, held), all)
  }
  // Then the long word, a tile at a time.
  for (let taken = keep + 1; taken <= longOrder.length; taken += 1) {
    const done = taken === longOrder.length
    say(done ? messages.tutComplete : messages.tutPickLetters, longOrder.slice(0, taken), all, {
      ...(done ? { word: board.six } : {}),
    })
  }
  // Pressed: the button lights, and the two badges say what the word paid.
  say(messages.tutComplete, longOrder, all, {
    word: board.six,
    pressing: true,
    gain: gainFor(longWord.length, config),
  })

  const carded = tilesWithCard(board)
  const cardWord = alphabet.segment(board.card.word)
  const cardOrder = tapOrder(cardWord, carded)
  const cardMask = [...all].map((face, at) => (at === board.card.at ? CARD : face)).join('')
  const wildAt = cardOrder.indexOf(board.card.at)

  const cardFrames: Frame[] = [{ up: cardMask, sel: [], caption: messages.htWildBody }]
  for (let taken = 1; taken <= cardOrder.length; taken += 1) {
    cardFrames.push({
      up: cardMask,
      sel: cardOrder.slice(0, taken),
      caption: messages.htWildBody,
    })
  }
  // The card turns out to be a letter only once the word is made, which is how the game does it:
  // the player gambles and the rail tells them afterwards what they were given.
  cardFrames.push({
    up: cardMask,
    sel: cardOrder,
    caption: messages.htWildBody,
    word: board.card.word,
    wildAt,
    pressing: true,
    gain: gainFor(cardWord.length, config),
  })

  // The board after the swap, which is what the last screen shows: one letter is not what it was.
  const swapped = [...tiles]
  swapped[tiles.indexOf(board.swap.from)] = board.swap.to

  return [
    {
      title: messages.htBoardTitle,
      tiles,
      // One tile at a time, in reading order, which is the one rule the whole game rests on.
      frames: Array.from({ length: n + 1 }, (_, shown) => ({
        up: upTo(shown, n),
        sel: [],
        caption: messages.htBoardBody,
      })),
    },
    { title: messages.htWordsTitle, tiles, panel: 'complete', frames: words },
    {
      title: messages.tutControlsTitle,
      tiles,
      panel: 'controls',
      frames: [messages.tutReset, messages.tutPause, messages.tutRestart, messages.tutQuit].map(
        (caption) => ({ up: all, sel: [], caption }),
      ),
    },
    { title: messages.htWildTitle, tiles, panel: 'complete', frames: cardFrames },
    {
      title: messages.htSwapTitle,
      tiles,
      panel: 'swap',
      frames: [{ up: all, sel: [], caption: messages.htSwapBody }],
    },
    {
      title: messages.tutDoneTitle,
      // The swapped board, face up. The one thing the game itself only shows for a moment.
      tiles: swapped,
      frames: [{ up: all, sel: [], caption: messages.tutDoneBody }],
    },
  ]
}

/** What the word line shows for a frame: the glyph for a card, the tile's letter otherwise. */
export function wordOf(frame: Frame, tiles: readonly string[]): string {
  if (frame.word !== undefined) return frame.word
  return frame.sel.map((at) => (frame.up[at] === CARD ? WILD_GLYPH : (tiles[at] ?? ''))).join('')
}

export const FACE_CARD = CARD
export const FACE_DOWN = DOWN
