import { WILD_GLYPH, alphabetFor, flipReward, wordScore } from '@blinkered/engine'
import { TUTORIAL_BOARDS, tilesWithCard } from '@blinkered/words'
import type { Alphabet, GameConfig } from '@blinkered/engine'
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
/** Face down because a finished word used it, which is not the same as not dealt yet. */
const SPENT = '-'

export interface Frame {
  /** One character per tile: `.` face down, `#` face up, `*` showing a card, `-` spent. */
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
  /**
   * The flips counter, on the screen that is about flips.
   *
   * Counted from the engine's own numbers like the badges are: the easy level's starting budget,
   * one off for every tile that turns, and `flipReward` back for the word.
   */
  readonly flips?: number
  /** The letters on the tiles, when a frame's differ from its screen's: after a swap. */
  readonly tiles?: readonly string[]
  /** The letter-change interstitial, drawn over the board the way the game draws it. */
  readonly swap?: boolean
}

export interface Step {
  readonly title: string
  readonly frames: readonly Frame[]
  /** Drawn alongside or instead of the board, on the screens that need something else. */
  readonly panel?: 'complete' | 'account'
  /** The letters on the tiles. Only the last screen differs, having taken the swap. */
  readonly tiles: readonly string[]
}

/**
 * Whether a screen ever builds a word, and whether it ever pays for one.
 *
 * Both lines are reserved space: the word line and the gain badges hold their height on every
 * frame so that a screen does not change shape halfway through, which is the reason they are
 * drawn with a non-breaking space when they are empty. Reserved *per screen* rather than for the
 * whole deck, though, because most screens never use either -- and there they were 50px of
 * blank line above the board, which is most of what made those slides read as mostly space.
 *
 * Derived from the frames rather than declared on the step. A flag somebody has to remember to
 * set is a flag that is wrong the first time a screen gains a word.
 */
export function showsWord(step: Step): boolean {
  return step.frames.some((frame) => frame.sel.length > 0 || frame.word !== undefined)
}

export function showsGain(step: Step): boolean {
  return step.frames.some((frame) => frame.gain !== undefined)
}

/** How many tiles a frame has dealt: every one not face down, spent ones included. */
function dealtIn(frame: Frame): number {
  return [...frame.up].filter((face) => face !== DOWN).length
}

/**
 * Whether a screen turns tiles, which is what earns it the tick bar.
 *
 * A screen whose board never changes would show a bar that never moves, which says nothing.
 */
export function showsTicks(step: Step): boolean {
  return new Set(step.frames.map(dealtIn)).size > 1
}

/**
 * The tick bar for a frame: what is left of the round, and the lowest it has been on this screen.
 *
 * Worked out from the faces rather than written on the frames, the way the game works it out: a
 * tile turning spends a tick, so a round of `total` ticks has `total` less the tiles dealt left.
 * A letter hiding puts one back, and because the floor remembers the lowest the bar has been this
 * round, that tick lights red exactly as it does in a game.
 */
export function ticksAt(
  step: Step,
  at: number,
  total: number,
): { remaining: number; floor: number } {
  const left = (frame: Frame): number => total - dealtIn(frame)
  // From the start of the round this frame is in, which is the last frame with nothing dealt: the
  // game starts its low-water mark again each round, or a new round's full bar would all read red.
  let round = at
  while (round > 0 && dealtIn(step.frames[round] as Frame) > 0) round -= 1
  const seen = step.frames.slice(round, at + 1).map(left)
  return { remaining: seen.at(-1) ?? total, floor: Math.min(...seen) }
}

export function showsFlips(step: Step): boolean {
  return step.frames.some((frame) => frame.flips !== undefined)
}

export function boardFor(language: string): TutorialBoard {
  // English when a language has an alphabet but no board, which is a language with no word list
  // and so one the picker never offers.
  return TUTORIAL_BOARDS[language] ?? (TUTORIAL_BOARDS.en as TutorialBoard)
}

/** A mask with the given tiles face up and the rest face down. */
function facesUp(total: number, up: readonly number[]): string {
  const lit = new Set(up)
  return Array.from({ length: total }, (_, at) => (lit.has(at) ? UP : DOWN)).join('')
}

/**
 * The order the tour turns tiles over in, which is deliberately not reading order.
 *
 * The game picks its next tile at random from whatever is still face down, so a tour that filled
 * the board from the left taught the one thing it does not do -- and the board screen's own
 * caption says "in random order" while the animation underneath showed a fixed one. Nick:
 * "The animations show everything revealing in reading order. Fix this so that people aren't
 * surprised when the game starts playing."
 *
 * A fixed scatter rather than a random one. The deck is documentation: two people describing the
 * same screen to each other should be describing the same screen, and a tour that deals
 * differently on every open cannot be screenshotted twice. Bit-reversal is the scatter -- read
 * each index backwards in binary and sort by that -- which on the six-tile boards gives
 * 0, 4, 2, 1, 5, 3: it crosses the board instead of sweeping it, and it wants no table per
 * board size.
 */
function dealOrder(total: number): number[] {
  const width = Math.max(1, Math.ceil(Math.log2(Math.max(total, 2))))
  const reversed = (at: number): number => {
    let out = 0
    for (let bit = 0; bit < width; bit += 1) out = out * 2 + ((at >> bit) & 1)
    return out
  }
  return Array.from({ length: total }, (_, at) => at).sort((a, b) => reversed(a) - reversed(b))
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
  const all = UP.repeat(n)
  const dealt = dealOrder(n)

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

  /*
   * This screen opens part way into a round, with three tiles up and the rest to come.
   *
   * The three are the first three tiles whatever the deal would have done, because those are the
   * ones that spell the short word -- `tutorialBoard.test.ts` holds every board to that. So the
   * remaining tiles are the ones the scatter applies to, which is what the loop below turns over.
   */
  const opening = [0, 1, 2]
  const later = dealt.filter((at) => !opening.includes(at))
  say(messages.tutPickLetters, [], facesUp(n, opening))
  for (let taken = 1; taken <= 3; taken += 1) {
    say(messages.tutPickLetters, opening.slice(0, taken), facesUp(n, opening), {
      ...(taken === 3 ? { word: board.three } : {}),
    })
  }
  // The rest of the board turns over while the short word is still selected, which is the point
  // of the caption: a better letter can still be coming.
  for (let more = 1; more <= later.length; more += 1) {
    say(messages.tutMoreTurn, opening, facesUp(n, [...opening, ...later.slice(0, more)]), {
      word: board.three,
    })
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
  /*
   * And then the letters it used are gone for the rest of the round.
   *
   * A beta tester, after a game or two: "I'm still not entirely certain on how letters are
   * retained or replaced." Every level spends them, so they turn face down and come back at the
   * next deal; nothing on this screen said so, and the tour ended on a board still full of them.
   */
  say(
    messages.tutSpentBody,
    [],
    [...all].map((face, at) => (longOrder.includes(at) ? SPENT : face)).join(''),
  )

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

  /*
   * Two letters turning back over, and coming back in the other order.
   *
   * The order is the lesson. A letter that hides is not held aside to be handed straight back: it
   * goes into the same pile as every letter the deal has not reached, and the next turn picks from
   * that pile at random. So the second one to go is the first one back, which is a thing the tour
   * can show in four frames and a sentence would labour.
   *
   * Two rather than one because a single letter going and returning reads as a stumble; two makes
   * it a rule. The tiles are the second and the second to last, which on every board in the set is
   * a pair far enough apart to see at a glance.
   */
  const away = (...hidden: readonly number[]): string =>
    [...all].map((face, at) => (hidden.includes(at) ? DOWN : face)).join('')
  const firstAway = 1
  const secondAway = Math.max(2, n - 2)
  const hideFrames: Frame[] = [
    { up: all, sel: [], caption: messages.tutHideBody },
    { up: away(firstAway), sel: [], caption: messages.tutHideBody },
    { up: away(firstAway, secondAway), sel: [], caption: messages.tutHideBody },
    { up: away(firstAway), sel: [], caption: messages.tutHideBody },
    { up: all, sel: [], caption: messages.tutHideBody },
  ]

  // The board after the swap: one letter is not what it was.
  const swapped = [...tiles]
  swapped[tiles.indexOf(board.swap.from)] = board.swap.to

  /*
   * The next round's board: the same letters, somewhere else.
   *
   * Turned half way round, so every tile moves and none of them lands where it was. A fixed
   * rearrangement rather than a random one, for the reason the deal order is fixed.
   */
  const half = Math.floor(n / 2)
  const reshuffled = tiles.map((_, at) => tiles[(at + half) % n] as string)
  const reswapped = [...reshuffled]
  reswapped[reshuffled.indexOf(board.swap.from)] = board.swap.to

  /*
   * What the game is for, before any of how it works.
   *
   * The board deals with the counter running down a flip per tile, and then the long word buys a
   * handful back. That is the whole economy in one loop: the counter is the only thing on screen
   * that says the game can end, and the only thing that says long words are the way to stop it.
   */
  const goalFrames: Frame[] = []
  let flips = config.initialFlips
  goalFrames.push({ up: facesUp(n, []), sel: [], caption: messages.tutGoalBody, flips })
  for (let shown = 1; shown <= n; shown += 1) {
    flips -= 1
    goalFrames.push({
      up: facesUp(n, dealt.slice(0, shown)),
      sel: [],
      caption: messages.tutGoalBody,
      flips,
    })
  }
  for (let taken = 1; taken <= longOrder.length; taken += 1) {
    goalFrames.push({
      up: all,
      sel: longOrder.slice(0, taken),
      caption: messages.tutGoalBody,
      flips,
    })
  }
  const paid = gainFor(longWord.length, config)
  goalFrames.push({
    up: all,
    sel: longOrder,
    caption: messages.tutGoalBody,
    word: board.six,
    gain: paid,
    flips: flips + paid.flips,
  })

  /*
   * The two ways a letter changes, on one screen: hiding inside a round, then swapping between
   * rounds. They were two screens when the tour ran to nine; they are one idea at two speeds, and
   * medium, where new players start, does both.
   *
   * The swap is drawn over the board, as the game draws it, and the board under it already holds
   * the new letter, so it is there when the cover lifts.
   */
  /*
   * The rule first, then the two exceptions to it.
   *
   * Dawna did not realize the letters carry over from one round to the next, so a word she saw
   * too late looked lost. The board turns over and the same letters deal back in new places; then
   * a letter hides, and a letter is swapped. The screen's first frame is the old board and every
   * frame after it is the new one, which is what makes the hiding and the swap happen to the
   * letters that just came back.
   */
  const changeFrames: Frame[] = [
    { up: all, sel: [], caption: messages.tutSameLetters, tiles },
    { up: facesUp(n, []), sel: [], caption: messages.tutSameLetters },
    ...Array.from({ length: n }, (_, at) => ({
      up: facesUp(n, dealt.slice(0, at + 1)),
      sel: [],
      caption: messages.tutSameLetters,
    })),
    ...hideFrames,
    { up: all, sel: [], caption: messages.htSwapBody, tiles: reswapped, swap: true },
  ]

  return [
    { title: messages.tutGoalTitle, tiles, frames: goalFrames },
    { title: messages.htWordsTitle, tiles, panel: 'complete', frames: words },
    { title: messages.htWildTitle, tiles, panel: 'complete', frames: cardFrames },
    { title: messages.tutChangeTitle, tiles: reshuffled, frames: changeFrames },
    /*
     * What an account is for, and it is last on purpose.
     *
     * It exists because of a number rather than a design: one signup in production besides
     * Nick's own, which says the offer is not reaching anybody. The tour is the one place every
     * player passes through, and the last screen is the one still on the glass when somebody
     * decides whether to press Start playing.
     *
     * No board and one frame, because the deck's machinery wants at least one and this screen
     * is its caption. The panel draws the words and the button, which opens the same
     * `SignInDialog` the rest of the app uses.
     */
    {
      title: messages.tutAccountTitle,
      tiles: swapped,
      panel: 'account',
      frames: [{ up: all, sel: [], caption: messages.tutAccountBody }],
    },
  ]
}

/**
 * What the word line shows for a frame: the glyph for a card, the tile's letter otherwise.
 *
 * Spelled the way the language writes it, all the way through rather than only at the end.
 * Korean is why: its tiles are letters and nobody reads a string of them, so a word part way
 * through has to show as far as it composes — ㄱ, then 가, then 각. Hebrew gets the same
 * treatment and it costs nothing, the final form simply appearing as soon as the letter is last.
 */
export function wordOf(frame: Frame, tiles: readonly string[], alphabet: Alphabet): string {
  const letters =
    frame.word ??
    frame.sel.map((at) => (frame.up[at] === CARD ? WILD_GLYPH : (tiles[at] ?? ''))).join('')
  return alphabet.display?.(letters) ?? letters
}

export const FACE_CARD = CARD
export const FACE_DOWN = DOWN
export const FACE_SPENT = SPENT
