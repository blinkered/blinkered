import { selectedLetters } from '@blinkered/engine'
import type { GameState } from '@blinkered/engine'
import type { Messages } from '@blinkered/i18n'
import { format, plural } from '@blinkered/i18n'

interface HudProps {
  readonly state: GameState
  readonly feedback: Feedback | null
  /** What the last accepted word paid back, so the FLIPS figure can show where it came from. */
  readonly flipGain: FlipGain | null
  readonly messages: Messages
}

export interface FlipGain {
  readonly flips: number
  /** Changes on every dispatch, so two words paying the same amount both animate. */
  readonly epoch: number
}

export interface Feedback {
  readonly kind: 'accepted' | 'rejected' | 'note'
  readonly text: string
  /** Distinguishes repeats of the same message so the animation replays. */
  readonly epoch: number
}

export function Hud({ state, feedback, flipGain, messages }: HudProps): React.JSX.Element {
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
          {...(flipGain === null
            ? {}
            : {
                // Keyed by epoch so the animation replays for every word, including two in a row
                // paying the same. Hidden from assistive technology: the figure it decorates is
                // already live, and announcing "+3" separately would be the same news twice.
                badge: (
                  <span key={flipGain.epoch} className="flip-gain" aria-hidden="true">
                    +{flipGain.flips}
                  </span>
                ),
              })}
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
          {word !== '' ? (
            word
          ) : feedback === null ? (
            /* Both are rendered and one is drawn, per device. "Type a word" on a phone is an
             instruction to use a thing the phone does not have, and the touch version is now
             the only place the tap rules are stated: they used to also sit under the board,
             which spent a row saying something already on screen.

             It stands down while there is a message, rather than sharing the line with one. A
             rejected word clears the selection, so the two would otherwise appear together, and
             the pair wrapped to a second line and moved the board. */
            <>
              <span className="word-empty keys-only">{messages.typeAWord}</span>
              <span className="word-empty touch-only">
                {format(messages.tapPrompt, { action: messages.completeShort })}
              </span>
            </>
          ) : null}
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
  badge,
}: {
  label: string
  value: number
  emphasis?: 'strong' | 'warn'
  /** Floats over the figure and fades. Positioned absolutely, so it cannot move the layout. */
  badge?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={`stat${emphasis === undefined ? '' : ` is-${emphasis}`}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {badge}
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
