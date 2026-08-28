import { format, plural } from './messages.js'
import type { Messages } from './messages.js'
import type { GameResult } from '@blinkered/engine'

/**
 * The synopsis a player sends someone else after a game.
 *
 * Here rather than in the web app because it is message composition, which is what this package
 * does, and because it is worth testing: it is the one piece of text in the game that leaves the
 * game, and a wrong plural or a missing line is public.
 *
 * Three lines, or four when there is something to boast about. Short enough to survive a text
 * message without folding, and every line of it is a string the game already had: the same result
 * sentence the panel shows and the same words the leaderboard uses for a personal best. Nothing
 * here is a second, drifting copy of a message that exists elsewhere.
 *
 * The URL is a parameter rather than a constant. Which host the game lives on is a fact about the
 * deployment, and this package has no business knowing it.
 */
export interface ShareOptions {
  /** Whether this game came top of the player's own table, on the leaderboard's own terms. */
  readonly personalBest: boolean
  readonly url: string
  /**
   * The board's letters, in the order they were dealt.
   *
   * What makes the message worth reading rather than a scoreboard: anyone who plays can see what
   * there was to work with and judge the score against it. The letters are the same for the whole
   * game, so one line of them describes the whole thing.
   */
  readonly letters: readonly string[]
}

export function shareText(messages: Messages, result: GameResult, options: ShareOptions): string {
  /*
   * A comma, not a dash: the game's own name and then how it was played.
   *
   * `nerdMode` for an edited ruleset, because that is what the setup screen's own chip calls it,
   * and repeating the difficulty a custom game was derived from would be a lie. Not `customRules`,
   * which is a whole sentence about scores not being ranked and belongs on the screen that says so.
   */
  const rules = result.canonical ? messages.difficultyNames[result.difficulty] : messages.nerdMode
  const lines = [
    `Blinkered, ${rules}, ${options.letters.join('')}`,
    format(messages.finalResult, {
      score: result.score,
      words: plural(messages.tag, messages.plurals.words, result.words),
      rounds: plural(messages.tag, messages.plurals.rounds, result.rounds),
    }),
  ]
  if (options.personalBest) lines.push(messages.newPersonalBest)
  lines.push(options.url)
  return lines.join('\n')
}
