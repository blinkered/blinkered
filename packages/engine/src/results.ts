import type { Difficulty } from './types.js'

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
  /** Epoch milliseconds, for display and to break ties in favour of whoever got there first. */
  readonly at: number
  /** With the ruleset, enough to replay the game and verify the score. */
  readonly seed: number
  readonly engineVersion: string
}

/** What a leaderboard compares like with like across. */
export interface ResultGroup {
  readonly language: string
  readonly difficulty: Difficulty
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
 * half what an Italian one does. So a leaderboard is per language, per difficulty, and
 * canonical only.
 */
export function rankedResults(results: readonly GameResult[], group: ResultGroup): GameResult[] {
  return results
    .filter(
      (result) =>
        result.canonical &&
        result.language === group.language &&
        result.difficulty === group.difficulty,
    )
    .sort(compareResults)
}

/** Where a game sits in a ranking, counting from one. Zero when it is not in it at all. */
export function rankOf(ranked: readonly GameResult[], result: GameResult): number {
  return ranked.indexOf(result) + 1
}
