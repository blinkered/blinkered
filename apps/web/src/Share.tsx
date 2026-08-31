import { useEffect, useRef, useState } from 'react'
import type { GameResult } from '@blinkered/engine'
import { shareText } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { withoutStealingFocus } from './focus.js'

/** Where the synopsis points. The domain the game is played on, not the one it is served from. */
const HOME = 'https://playblinkered.com'

/** How long "Copied." stays up. Long enough to read, short enough not to need dismissing. */
const CONFIRM_MS = 2500

interface ShareProps {
  readonly result: GameResult
  /** The board's letters, so the message says what there was to work with. */
  readonly letters: readonly string[]
  /** Whether the leaderboard called this a personal best, so the two cannot disagree. */
  readonly personalBest: boolean
  readonly messages: Messages
}

/**
 * Sends the finished game somewhere else.
 *
 * Three ways out, in order of how good they are, because the first two are not always there:
 *
 * 1. The share sheet, which is what a phone and the native shell have, and is the only one that
 *    reaches another app directly.
 * 2. The clipboard, which is what a desktop browser has.
 * 3. The text itself, on screen and selectable. This is not a nicety: `navigator.clipboard` is
 *    undefined outside a secure context, so a build served over plain HTTP on a LAN -- which is
 *    exactly how this gets tested on a phone -- reaches step three every time. Without it the
 *    button would simply do nothing there, which is the worst failure a button has.
 *
 * A canceled share sheet is not an error and says nothing. The player closed it on purpose.
 */
export function Share({ result, letters, personalBest, messages }: ShareProps): React.JSX.Element {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const text = shareText(messages, result, { personalBest, url: HOME, letters })

  // The confirmation clears itself. Held in a ref so a second tap restarts the clock rather than
  // inheriting the first tap's remaining time.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  const confirm = (next: 'copied' | 'manual'): void => {
    setState(next)
    if (timer.current !== null) clearTimeout(timer.current)
    // The fallback text stays until the panel goes: it is the only copy the player can reach.
    if (next === 'copied') {
      timer.current = setTimeout(() => {
        setState('idle')
      }, CONFIRM_MS)
    }
  }

  const send = async (): Promise<void> => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text })
        return
      } catch {
        // Canceled, or refused by the platform. Fall through to the clipboard rather than
        // telling the player something went wrong, because usually nothing did.
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      confirm('copied')
    } catch {
      confirm('manual')
    }
  }

  return (
    <div className="share">
      <button
        type="button"
        className="btn"
        onMouseDown={withoutStealingFocus}
        onClick={() => {
          void send()
        }}
      >
        {messages.share}
      </button>
      {state === 'copied' ? <p className="share-note">{messages.shareCopied}</p> : null}
      {state === 'manual' ? (
        <>
          <p className="share-note">{messages.shareSelect}</p>
          {/* Selectable, and pre-selected on focus, since the whole point is to get it out. */}
          <textarea
            className="share-text"
            readOnly
            rows={4}
            value={text}
            onFocus={(event) => {
              event.currentTarget.select()
            }}
          />
        </>
      ) : null}
    </div>
  )
}
