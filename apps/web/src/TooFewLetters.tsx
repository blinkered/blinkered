import type { Messages } from '@blinkered/i18n'

/**
 * How long the board is covered while this is read.
 *
 * The clock is stopped for exactly this long, so the number lives beside the thing it times
 * rather than being written down twice. 1.5s is what the playtest asked for and it is the right
 * order of magnitude for six words: long enough to look up and read a short line, short enough
 * that a player who already understands the rule is not made to wait through it every time it
 * fires. It fires often in a game played well, which is the argument against a longer hold.
 */
export const TOO_FEW_MS = 1500

/**
 * The round that could not produce another word, announced before the next board arrives.
 *
 * The rule it explains is a kindness -- the alternative is sitting through a round that is
 * already finished -- but a board that deals itself early with no warning reads as a bug, and a
 * player who was mid-thought would be certain of it. So the board is covered, the reason is said
 * plainly, and the next round starts afterwards.
 *
 * Covered rather than annotated, for the reason the message bar cannot carry this: that bar is a
 * 13px fixed-height row that also holds "shuffled" and every rejection, so nothing in it reads as
 * an event. This one has to interrupt, because it is explaining an interruption.
 *
 * `role="status"` rather than `alert`: it is information about the game's own progress, not a
 * problem to be dealt with, and an assertive live region would talk over a screen reader
 * mid-sentence.
 */
export function TooFewLetters({
  round,
  messages,
}: {
  /**
   * Which round was cut, used as the key so two cuts in a row each replay from the first frame.
   *
   * The round rather than the dispatch epoch, which is the mistake this was written with first:
   * the epoch moves on every input, so a player typing while they read this would remount it and
   * restart the fade. One cut belongs to one round.
   */
  readonly round: number
  readonly messages: Messages
}): React.JSX.Element {
  return (
    <div
      key={round}
      className="fewer-veil"
      role="status"
      // The stylesheet times its fade off this, so the clock hold in `useGame` and the animation
      // cannot drift apart.
      style={{ ['--fewer-ms' as string]: `${String(TOO_FEW_MS)}ms` }}
    >
      <p className="fewer-title">{messages.tooFewLetters}</p>
    </div>
  )
}
