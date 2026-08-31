import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'

/**
 * How long the whole interstitial takes, start to finish.
 *
 * The clock is stopped for exactly this long, which is why the number lives here beside the
 * animation rather than being guessed at in two places. A round costs nothing while it is
 * stopped, so the budget is set by how long the change takes to *read* rather than by what it
 * costs: long enough to look up, find the old letter, watch it hand over, and register the new
 * one. The first version ran at 1.5s over a single tile and was gone before the eye arrived; 2.6s
 * over the whole board was legible but still hurried, so this is 3.6s. The keyframes are all
 * percentages, so the holds stretch with it and nothing else needs retiming.
 */
export const SWAP_MS = 3600

/** One tile's letter having changed, for the interstitial that announces it. */
export interface Swap {
  readonly from: string
  readonly to: string
  /** Changes on every swap, so a repeat replays rather than being skipped as unchanged. */
  readonly epoch: number
}

/**
 * The letter change, announced over the whole board.
 *
 * Two things went wrong with the first version, which played on the tile itself.
 *
 * It **told the player where the letter was**. The deal has already happened by the time this
 * runs, so flipping up the changed tile named its position for the coming round: one tile
 * revealed for free, every other round, in a game whose entire economy is paying flips for
 * exactly that. A bonus nobody designed is a bug.
 *
 * And it was **too small and too quick to land**. One tile out of twelve, for a second and a
 * half, on a board the player is not yet looking at. The `->` line in the message bar had the
 * same problem for the same reason: it is a 13px row that also carries "shuffled" and every
 * rejection, so nothing in it reads as an event.
 *
 * So it is now an interstitial rather than an annotation. The board is covered, and the two
 * letters get a third of its width each, the outgoing one on the left and the incoming one on the
 * right. Nothing about it says which tile changed, which is the point: the player learns that the
 * board's letters are not what they were, and has to find out where by playing.
 *
 * The old letter dims rather than disappearing. "Fade it out" was the ask and a full fade is the
 * literal reading, but it loses the story: a player who looks up late would see one letter and no
 * reason it is being shown to them. Ending on a dimmed R, an arrow, and a bright S means the last
 * second of the animation still says what happened.
 */
export function LetterSwap({
  swap,
  messages,
}: {
  readonly swap: Swap
  readonly messages: Messages
}): React.JSX.Element {
  return (
    // Keyed on the epoch so two swaps in consecutive rounds each replay from the first frame.
    // `role="status"` announces it once; the tiles themselves are decorative, and the heading
    // plus the spoken sentence carry everything a screen reader needs.
    <div
      key={swap.epoch}
      className="swap-veil"
      role="status"
      // The stylesheet times every keyframe off this rather than repeating the number, so the
      // clock hold in useGame and the animation cannot drift apart.
      style={{ ['--swap-ms' as string]: `${String(SWAP_MS)}ms` }}
    >
      <p className="swap-title">{messages.letterSwap}</p>
      <div className="swap-pair" aria-hidden="true">
        <span className="swap-tile swap-old">{swap.from}</span>
        <span className="swap-arrow">→</span>
        <span className="swap-tile swap-new">{swap.to}</span>
      </div>
      {/* The arrow is a shape, not a sentence. This is the same string the message bar uses as
          its spoken form, so the two cannot drift apart. */}
      <p className="sr-only">{format(messages.letterReplaced, { from: swap.from, to: swap.to })}</p>
    </div>
  )
}
