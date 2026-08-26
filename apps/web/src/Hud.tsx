import { selectedLetters } from '@blinkered/engine'
import type { GameState } from '@blinkered/engine'

interface HudProps {
  readonly state: GameState
  readonly feedback: Feedback | null
}

export interface Feedback {
  readonly kind: 'accepted' | 'rejected' | 'note'
  readonly text: string
  /** Distinguishes repeats of the same message so the animation replays. */
  readonly epoch: number
}

export function Hud({ state, feedback }: HudProps): React.JSX.Element {
  const total = state.config.n + state.config.holdTicks
  const word = selectedLetters(state)
  const low = state.flipsRemaining <= state.config.n

  return (
    <header className="hud">
      <div className="hud-stats">
        <Stat label="flips" value={state.flipsRemaining} emphasis={low ? 'warn' : 'strong'} />
        <Stat label="score" value={state.score} />
        <Stat label="words" value={state.wordsFound.length} />
        <Stat label="round" value={state.roundIndex + 1} />
      </div>

      <div
        className="timer"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={state.ticksRemaining}
        aria-label="Ticks left in this round"
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`pip${i < state.ticksRemaining ? ' is-lit' : ''}`} />
        ))}
      </div>

      <div className="word-line">
        <output className="word" aria-live="polite">
          {word === '' ? <span className="word-empty">type a word</span> : word}
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
