import { selectedLetters } from '@blinkered/engine'
import type { GameState } from '@blinkered/engine'
import type { Messages } from '@blinkered/i18n'
import { format, plural } from '@blinkered/i18n'

interface HudProps {
  readonly state: GameState
  readonly feedback: Feedback | null
  readonly messages: Messages
}

export interface Feedback {
  readonly kind: 'accepted' | 'rejected' | 'note'
  readonly text: string
  /** Distinguishes repeats of the same message so the animation replays. */
  readonly epoch: number
}

export function Hud({ state, feedback, messages }: HudProps): React.JSX.Element {
  const total = state.config.n + state.config.holdTicks
  const word = selectedLetters(state)
  const low = state.flipsRemaining <= state.config.n

  return (
    <header className="hud">
      <div className="hud-stats">
        <Stat
          label={messages.flips}
          value={state.flipsRemaining}
          emphasis={low ? 'warn' : 'strong'}
        />
        <Stat label={messages.score} value={state.score} />
        <Stat label={messages.words} value={state.wordsFound.length} />
        <Stat label={messages.round} value={state.roundIndex + 1} />
      </div>

      <div
        className="timer"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={state.ticksRemaining}
        aria-label={messages.ticksLeftLabel}
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`pip${i < state.ticksRemaining ? ' is-lit' : ''}`} />
        ))}
      </div>

      <div className="word-line">
        <output className="word" aria-live="polite">
          {word === '' ? (
            /* Both are rendered and one is drawn, per device. "Type a word" on a phone is an
             instruction to use a thing the phone does not have, and the touch version is now
             the only place the tap rules are stated: they used to also sit under the board,
             which spent a row saying something already on screen. */
            <>
              <span className="word-empty keys-only">{messages.typeAWord}</span>
              <span className="word-empty touch-only">
                {format(messages.tapPrompt, { action: messages.completeShort })}
              </span>
            </>
          ) : (
            word
          )}
        </output>
        {feedback === null ? null : (
          <span key={feedback.epoch} className={`feedback is-${feedback.kind}`} role="status">
            {feedback.text}
          </span>
        )}
      </div>
    </header>
  )
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string
  value: number
  emphasis?: 'strong' | 'warn'
}): React.JSX.Element {
  return (
    <div className={`stat${emphasis === undefined ? '' : ` is-${emphasis}`}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

/** Kept here so the one place that renders a count is the one place that pluralises it. */
export function formatFinalResult(
  messages: Messages,
  counts: { score: number; words: number; rounds: number },
): string {
  return format(messages.finalResult, {
    score: counts.score,
    words: countOf(messages, 'words', counts.words),
    rounds: countOf(messages, 'rounds', counts.rounds),
  })
}

export function countOf(
  messages: Messages,
  kind: keyof Messages['plurals'],
  count: number,
): string {
  return plural(messages.tag, messages.plurals[kind], count)
}
