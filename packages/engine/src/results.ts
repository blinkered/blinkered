import { configFor } from './difficulty.js'
import type { Difficulty, GameConfig } from './types.js'

/**
 * The record of a finished game.
 *
 * Lives in the engine rather than in the web app because ranking is a rule, not a view: the
 * same ordering has to hold when a server ranks a submitted score against everyone else's, and
 * two implementations of "which game was better" would eventually disagree. The app owns where
 * these are stored; the engine owns what they mean.
 */
export interface GameResult {
  readonly score: number
  readonly words: number
  /** Rounds played, counting from one. */
  readonly rounds: number
  readonly language: string
  readonly difficulty: Difficulty
  /**
   * False when the rules were changed away from the preset.
   *
   * Recorded rather than discarded: a custom-rules game is still a game somebody played and
   * still worth showing them, it just cannot be ranked against a canonical one.
   */
  readonly canonical: boolean
  /** Epoch milliseconds, for display and to break ties in favor of whoever got there first. */
  readonly at: number
  /** With the ruleset, enough to replay the game and verify the score. */
  readonly seed: number
  readonly engineVersion: string
}

/** What a leaderboard compares like with like across. */
export interface ResultGroup {
  readonly language: string
  readonly difficulty: Difficulty
  /**
   * Which engine's idea of that difficulty.
   *
   * The presets are still bids rather than measurements, so `medium` names a different game
   * before and after a retune. `engineVersion` has been recorded on every result since the
   * beginning for exactly this; until it was part of the group it was a field nobody read, and
   * a table quietly mixing two rulesets is worse than one that starts again.
   */
  readonly engineVersion: string
}

/**
 * Best game first.
 *
 * Score decides it. A tie goes to the game that took fewer rounds, because reaching the same
 * score on less board is the better game, and a tie on both goes to whoever did it first.
 */
export function compareResults(left: GameResult, right: GameResult): number {
  if (left.score !== right.score) return right.score - left.score
  if (left.rounds !== right.rounds) return left.rounds - right.rounds
  return left.at - right.at
}

/**
 * The games that can be ranked against each other, best first.
 *
 * A score means nothing across languages or difficulties: fourteen scoreless rounds of easy
 * English is not the same game as ten of insane Russian, and a Greek board admits well under
 * half what an Italian one does. Nor does it mean anything across a change to what a difficulty
 * is. So a leaderboard is per language, per difficulty, per engine version, and canonical only.
 */
export function rankedResults(results: readonly GameResult[], group: ResultGroup): GameResult[] {
  return results
    .filter(
      (result) =>
        result.canonical &&
        result.language === group.language &&
        result.difficulty === group.difficulty &&
        result.engineVersion === group.engineVersion,
    )
    .sort(compareResults)
}

/** Two rulesets that say the same thing. Every field of a `GameConfig` is a primitive. */
function sameRules(preset: GameConfig, candidate: GameConfig): boolean {
  return (Object.keys(preset) as (keyof GameConfig)[]).every(
    (key) => preset[key] === candidate[key],
  )
}

/**
 * Whether a ruleset is the published preset it claims to be, which is what ranking requires.
 *
 * Here rather than in the web app for the reason at the top of this file: the server decides
 * what reaches a public board, the client decides what to tell the player about their own, and
 * two implementations of "is this a real medium game" would drift. It was in `apps/web` until
 * accounts made that a problem.
 *
 * Asks what the rules **are**, not how they were reached. A game hand-tuned in nerd mode to
 * numbers identical to a preset is a game on that preset, and ranks.
 *
 * Compared against the difficulty the game claims, and only that one. Comparing against all four
 * was the first version and it mislabels: tune `medium` until it happens to equal `hard` and the
 * game would count as canonical while being filed under `medium`, so it would reach a board as a
 * medium game played at hard's speed. A coincidence between two presets is not worth a wrong
 * label.
 *
 * The preset's own keys are what get compared, so a config that is missing one is not canonical
 * rather than accidentally equal to one. That matters on a server, where a config is rebuilt from
 * columns rather than handed over whole.
 */
export function isCanonical(config: GameConfig, difficulty: Difficulty): boolean {
  // Language is pinned on both sides. It reaches the engine through the ruleset, since the word
  // floor depends on how many words the dictionary admits, but it is nobody's idea of a
  // difficulty setting and a French game is not a custom one.
  return sameRules(configFor(difficulty, { language: config.language }), config)
}

/** Where a game sits in a ranking, counting from one. Zero when it is not in it at all. */
export function rankOf(ranked: readonly GameResult[], result: GameResult): number {
  return ranked.indexOf(result) + 1
}
