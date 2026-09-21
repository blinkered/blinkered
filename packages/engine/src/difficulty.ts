import { DEFAULT_LANGUAGE } from './languages.js'
import { at } from './invariant.js'
import type { Difficulty, GameConfig } from './types.js'

/**
 * Bumped when a rule changes what a game is, because results carry it and the leaderboard groups
 * on it. 0.2.0 was the difficulty retune; 0.3.0 makes the swap rate a difficulty column, which
 * among other things means `easy` no longer changes its letters at all. 0.4.0 cuts the flip
 * budgets after playtesting and ends a round that can no longer produce a word. 0.5.0 is the
 * letters that hide: a tile can turn back over on its own and return later in the round, and the
 * deal became a uniformly random draw so that it could (see PLAN.md 1.13).
 *
 * A bump empties the boards, since they group on this, and that is the point rather than a cost:
 * an easy score set over seven minutes and 168 flips is not the same achievement as one set over
 * three minutes and 84. 0.5.0 is the clearest case of that yet -- a hard board now takes letters
 * away from you -- and it is also the widest, since the random deal changes every level including
 * the two that never hide. The old games keep their scores and stay in their players' history.
 */
export const ENGINE_VERSION = '0.5.0'

/** Twelve tiles, 4x3 in landscape and 3x4 in portrait. A player may pick another size. */
export const DEFAULT_BOARD_SIZE = 12

/*
 * There is no cap on how many letters a round may take back, and there was one for a while: first
 * one a round, then as many as the board has tiles. Both were mine and neither was asked for, and
 * the first was actively wrong -- it made `hideChance` decide *when* the single hide happened
 * rather than how many there were, so the number in nerd mode did not mean what it says. Nick, at
 * 0.5: "I am typically seeing one flip-back per round. I would expect every other tick to yield a
 * flip-back, roughly."
 *
 * What is true, and is worth writing down rather than rediscovering: a round is a random walk. A
 * reveal spends a tick and a hide adds one, so the drift per tick is `2p - 1`, and the expected
 * length of a round is `(n + holdTicks) / (1 - 2p)` ticks. At 0.1 that is 17.5 against a measured
 * 17.3; at 0.25 it is 28 against 26.
 *
 * **Below 0.5 a round ends with probability one. At 0.5 it still does, with an infinite expected
 * length. Above 0.5 it may never end at all.** That is a real cliff rather than a corner case, and
 * it is guarded where the number is set instead of in here: the nerd-mode dial stops at 0.4, and
 * the levels ship 0, 0.05, 0.1 and 0.15. A player spending letters on words shortens the round
 * whatever the chance, so the cliff is a watcher's problem, which is exactly who the property
 * tests are.
 */

/**
 * Chance per tile per deal of a wild card, before nerd mode says otherwise.
 *
 * 0.02 against twelve tiles puts a wild in 21.5% of rounds and two in 2.2%, which is between two
 * and three in a game depending on how many rounds the setting allows. Knowingly generous for a
 * first pass: a wild can be a whole word by fishing, and three of them against a fourteen-word
 * game is a fifth of the words. A treat nobody sees teaches nothing about whether it is fun, so
 * this starts high and comes down if play says so.
 */
export const DEFAULT_WILD_CHANCE = 0.02

/**
 * How the swap rate came to be a difficulty column after all.
 *
 * It shipped as one flat number, on the grounds that one guessed number is easier to argue with
 * than four. Playing said otherwise, and for a better reason than balance: whether the board holds
 * still is not a *degree* of difficulty, it is a different game. With the letters fixed you can
 * learn them and carry a word list between rounds; once they drift you cannot, and a skill you had
 * been using stops working. That is the kind of thing a difficulty level should name.
 *
 * The rate stops climbing at `hard` rather than peaking at `insane`, which looks wrong on the
 * table and is right. What a swap costs you is a stale memorized list, and `insane` shows the full
 * board for 2.7 seconds, so there was never a list to go stale: the axis does its work in the
 * middle of the ladder. Pushing it higher would mostly buy `insane` more of the one thing it
 * should not have, since the clock stops for the announcement and a pause on a 12.6-second round
 * is a rest.
 */

/**
 * Board size is a player's choice, not a difficulty axis. A bigger board is harder to track
 * and gives less time per tile, but it admits far more words and much longer ones, so it is
 * easier to score on: at N=6 a seven-letter word is arithmetically impossible. So a profile
 * holds only the rules that do not scale with the board, and the two that do are derived
 * from N below, which keeps a level equally hard at every size.
 *
 * Still bids rather than measurements. tools/simulate would replace them with numbers that came
 * from watching thousands of games rather than from a hunch. See docs/PLAN.md 1.9.
 */
export interface DifficultyProfile {
  readonly speedMultiplier: number
  readonly holdTicks: number
  /** Rounds you survive having scored nothing at all. Flips are this times the board size. */
  readonly initialRounds: number
  readonly minWordLength: number
  /** Chance per deal that one tile's letter is replaced. Zero on `easy`; see the note above. */
  readonly replaceChance: number
  /**
   * Chance per tick that an exposed, unselected letter turns back over. Zero on `easy`.
   *
   * The game is called Blinkered and until this existed the letters did not hide from anybody;
   * they queued, in an order the grid could be read for. This is the mechanic that makes the name
   * literal.
   */
  readonly hideChance: number
}

/*
 * Retuned after playing, which said every level was about one notch harder than its name:
 * medium played as hard, hard as barely short of insane, and insane as unplayable.
 *
 * The number that did it is not `speedMultiplier` by itself but what it multiplies: the window
 * with the whole board face up.
 *
 * **That window is `(holdTicks + 1) * speedMultiplier`, not `holdTicks * speedMultiplier`**, and
 * this comment had it wrong by one tick until 2026-09-18. The last tile lands when the timer
 * reads `holdTicks + 1` and the round then runs down to zero, so `holdTicks + 1` tick-lengths
 * elapse with every letter showing. PLAN.md 1.2 always said so and nerd mode always displayed it,
 * which is the argument for reading the number off the thing the player sees rather than deriving
 * it twice.
 *
 * On the old table that window did not shrink from level to level so much as go out: 8.0s, 3.6s,
 * 1.8s, 0.7s. Insane gave the player under a second with twelve letters in front of them, so the
 * only word available was one spotted while the board was still dealing; hard's 1.8s is a glance,
 * which is why the two felt adjacent. A setting cannot be hard in an interesting way if the thing
 * it takes away is the part of the round you think in.
 *
 * The window now halves rather than vanishing -- 10.8s, 7.5s, 4.8s, 2.7s after that retune, and
 * 9.0s, 6.5s, 4.8s, 2.7s after the one below -- and the tick slows across the board, each level
 * landing roughly where the level below it used to be. Insane is still comfortably the hardest:
 * 0.9s a tile is the old hard, with under three seconds to look.
 *
 * Then playtested, which said the opposite thing about the other axis: the first game goes on far
 * too long. Easy guaranteed 14 rounds of 30.6s -- seven minutes before the game could end, and
 * that is the floor, since every word buys more. "Too many flips for so slow a game."
 *
 * So the endurance budget moved, and the round count stopped being the thing held in order.
 *
 * A round is not a comparable unit between levels: it is 25.5s on easy and 12.6s on insane, so
 * equal round counts are unequal sittings, and the number a player feels is the wall clock. What
 * the ladder now keeps monotone is the floor in seconds -- 2.98, 2.77, 2.70, 2.10 minutes at the
 * default size -- which reads the right way round while the round counts (7, 8, 9, 10) read
 * backwards. They are backwards for the reason above, and that inversion is the whole point of
 * writing the floor down here:
 *
 *              per tile   hold   full board up   rounds   floor
 *   easy          1.5s      5      6 ticks, 9.0s      7     2.98 min
 *   medium        1.3s      4      5 ticks, 6.5s      8     2.77 min
 *   hard          1.2s      3      4 ticks, 4.8s      9     2.70 min
 *   insane        0.9s      2      3 ticks, 2.7s     10     2.10 min
 *
 * The cuts are a gradient rather than a flat trim, because the complaint was not "games are
 * long", it was "easy and medium are long": easy loses half its flips (168 to 84 at twelve
 * tiles), medium a third (144 to 96), hard a sixth (132 to 108), and insane keeps all 120 of its
 * own, since two minutes was never the problem and insane is supposed to have flips to play with.
 *
 * The clock also stepped up on the two levels that were called slow, 1.8s to 1.5s and 1.5s to
 * 1.3s. That shortens the think window as a side effect -- easy's full board was up for 10.8s and
 * is now up for 9.0s -- which is a real cost and is accepted rather than compensated with a
 * larger `holdTicks`: adding hold ticks lengthens the round, and the round being long is what
 * started this. 9.0s with twelve letters that never change is still the most generous window in
 * the game, by more than three times.
 */
export const DIFFICULTIES: Readonly<Record<Difficulty, DifficultyProfile>> = {
  easy: {
    speedMultiplier: 1.5,
    holdTicks: 5,
    initialRounds: 7,
    minWordLength: 3,
    replaceChance: 0,
    hideChance: 0,
  },
  medium: {
    speedMultiplier: 1.3,
    holdTicks: 4,
    initialRounds: 8,
    minWordLength: 3,
    replaceChance: 0.25,
    hideChance: 0.05,
  },
  hard: {
    speedMultiplier: 1.2,
    holdTicks: 3,
    initialRounds: 9,
    minWordLength: 4,
    replaceChance: 0.5,
    hideChance: 0.1,
  },
  insane: {
    speedMultiplier: 0.9,
    holdTicks: 2,
    initialRounds: 10,
    minWordLength: 4,
    replaceChance: 0.5,
    hideChance: 0.15,
  },
}

/*
 * What each step adds, which is the part a player can be told.
 *
 * The old table escalated three numbers between every pair of levels and changed the *kind* of
 * game exactly once, at medium-to-hard, where three-letter words stop counting. So the ladder had
 * one interesting rung and two quantitative ones. Turning swaps off on easy puts a second named
 * pressure in the gap:
 *
 *   easy    the board you can learn      twelve letters, all game
 *   medium  the board starts drifting    a letter changes now and then
 *   hard    small change stops counting  three-letter words are out
 *   insane  nothing holds still          all of it, as fast as it goes
 *
 * Wild cards are deliberately NOT a fourth scaled axis. The same wild is worth less where there is
 * less time to use it, so a flat rate already self-balances, and moving two mechanics at once
 * would leave the next play unable to say which one did what.
 */

/**
 * Median distinct words a board of n tiles admits at minimum length 3, indexed from n=4.
 *
 * Measured on the shipped English common tier. Regenerate with `pnpm dictionary floor`
 * whenever a word list changes: these numbers describe a dictionary, not the rules, and a
 * stale curve is a silent fault rather than a loud one. The previous values were three times
 * these, having been measured against a 78,000-word placeholder list, and left the floor so
 * far above any real board that the generator rejected every draw it made.
 */
const MEDIAN_WORDS = [3, 8, 15, 24, 40, 63, 86, 126, 164] as const
const SMALLEST_MEASURED = 4
const LARGEST_MEASURED = SMALLEST_MEASURED + MEDIAN_WORDS.length - 1

/** Share of those words that survive raising the minimum length, measured at n=9. */
const SHARE_BY_MINIMUM: Readonly<Record<number, number>> = {
  2: 1,
  3: 1,
  4: 0.52,
  5: 0.16,
  6: 0.03,
}
const SHARE_BEYOND_TABLE = 0.03

/**
 * How rich each language's board is next to English, at the same size and the same cut.
 *
 * The curve above is one language's, and languages are not interchangeable here: a Russian
 * board admits under half what an English one does, because a 32-letter alphabet combines
 * differently from a 26-letter one. A single floor would be unreachable in Russian and free
 * in English, so it is scaled. Regenerate with `pnpm dictionary floor`.
 *
 * Seven entries, where there were fifty-one. A number here describes a particular dictionary,
 * and the other forty-four have no dictionary here to describe: their lists left when Blinkered
 * started borrowing attested ones. Keeping their old numbers would have been worse than having
 * none, because those were measured against lists that are not the lists those languages will
 * come back with. A language with no entry falls through to `UNMEASURED_SCALE` and cannot be
 * dealt anyway, so the gap is only ever a gap while somebody is adding one.
 */
const DENSITY_SCALE: Readonly<Record<string, number>> = {
  de: 0.68,
  en: 1,
  es: 0.73,
  fr: 0.94,
  ko: 0.67,
  ru: 0.43,
  tl: 0.43,
}

/** A language with no measurement yet is assumed to behave like the one that was measured. */
const UNMEASURED_SCALE = 1

/** Aim below the median so acceptance costs a draw or two rather than hundreds. */
const TARGET_SHARE_OF_MEDIAN = 0.7

/**
 * How many words a board must admit to be worth playing. Scales with the board, because a
 * count that filters hard at nine tiles is trivial at twelve and impossible at six.
 */
export function defaultWMin(
  n: number,
  minWordLength: number,
  language: string = DEFAULT_LANGUAGE,
): number {
  const size = Math.min(LARGEST_MEASURED, Math.max(SMALLEST_MEASURED, Math.round(n)))
  const median = at(MEDIAN_WORDS, size - SMALLEST_MEASURED)
  const share = SHARE_BY_MINIMUM[minWordLength] ?? SHARE_BEYOND_TABLE
  const scale = DENSITY_SCALE[language] ?? UNMEASURED_SCALE
  return Math.max(1, Math.round(median * share * scale * TARGET_SHARE_OF_MEDIAN))
}

/**
 * The first length that turns a profit under the fibonacci economy: five letters only break
 * even, so a board with no six-letter word cannot be played at a profit however well it is
 * played. Board acceptance requires one. See docs/PLAN.md 1.7.
 */
export const PROFITABLE_LENGTH = 6

/**
 * Resolves a difficulty and any explicit overrides into a complete ruleset. Board size,
 * minimum word length and language are read first, because the flip budget and the word floor
 * are derived from them; an explicit `initialFlips` or `wMin` still wins.
 */
export function configFor(difficulty: Difficulty, overrides: Partial<GameConfig> = {}): GameConfig {
  const profile = DIFFICULTIES[difficulty]
  const n = overrides.n ?? DEFAULT_BOARD_SIZE
  const minWordLength = overrides.minWordLength ?? profile.minWordLength
  // Read before the floor is derived, because how many words a board can admit is as much a
  // fact about the language as about the board size.
  const language = overrides.language ?? DEFAULT_LANGUAGE

  const resolved: GameConfig = {
    n,
    wildChance: overrides.wildChance ?? DEFAULT_WILD_CHANCE,
    replaceChance: overrides.replaceChance ?? profile.replaceChance,
    speedMultiplier: profile.speedMultiplier,
    holdTicks: profile.holdTicks,
    initialFlips: profile.initialRounds * n,
    minWordLength,
    wMin: defaultWMin(n, minWordLength, language),
    ceilingMin: PROFITABLE_LENGTH,
    wordCompleteMode: 'spend',
    flipEconomy: 'fibonacci',
    chargeFullRound: false,
    hideChance: overrides.hideChance ?? profile.hideChance,
    language,
    engineVersion: ENGINE_VERSION,
  }
  return { ...resolved, ...overrides }
}
