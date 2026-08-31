import { WILD_GLYPH, selectedLetters } from '@blinkered/engine'
import type { GameState } from '@blinkered/engine'
import type { Messages } from '@blinkered/i18n'
import { format, plural } from '@blinkered/i18n'

interface HudProps {
  readonly state: GameState
  readonly feedback: Feedback | null
  /** What the last accepted word was worth, so the figures can show where it came from. */
  readonly gain: WordGain | null
  readonly messages: Messages
}

export interface WordGain {
  readonly points: number
  readonly flips: number
  /** Changes on every dispatch, so two words worth the same amount both animate. */
  readonly epoch: number
}

export interface Feedback {
  readonly kind: 'accepted' | 'rejected' | 'note'
  readonly text: string
  /**
   * What a screen reader says instead, where `text` is not a sentence.
   *
   * Only the letter swap uses it. `R -> S` is the whole message in every language and fits a row
   * with no room to spare, but read aloud it is a shape rather than a statement.
   */
  readonly label?: string
  /** Distinguishes repeats of the same message so the animation replays. */
  readonly epoch: number
}

/**
 * The two amounts a word is worth, floating over the figures they changed.
 *
 * Staggered rather than simultaneous: two numbers appearing at once in different places read as
 * one event and the eye picks one of them. Flips first because FLIPS is the leftmost figure, so
 * the pair runs the way the row is read.
 */
function gainBadge(gain: WordGain, amount: number, late: boolean): React.ReactNode {
  // Keyed by epoch so the animation replays for every word, including two in a row worth the
  // same. Hidden from assistive technology: both figures are already live regions, and saying
  // "+3" beside them would be the same news twice.
  return (
    <span key={gain.epoch} className={`stat-gain${late ? ' is-late' : ''}`} aria-hidden="true">
      +{amount}
    </span>
  )
}

export function Hud({ state, feedback, gain, messages }: HudProps): React.JSX.Element {
  const total = state.config.n + state.config.holdTicks
  const word = selectedLetters(state)
  const low = state.flipsRemaining <= state.config.n
  const wildUp = state.tiles.some((tile) => tile.wild && tile.revealed && !tile.spent)

  return (
    <header className="hud">
      <div className="hud-stats">
        <Stat
          label={messages.flips}
          value={state.flipsRemaining}
          emphasis={low ? 'warn' : 'strong'}
          {...(gain === null || gain.flips <= 0
            ? {}
            : { badge: gainBadge(gain, gain.flips, false) })}
        />
        <Stat
          label={messages.score}
          value={state.score}
          {...(gain === null || gain.points <= 0
            ? {}
            : { badge: gainBadge(gain, gain.points, true) })}
        />
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

      {/*
       * One line, always exactly as tall as itself.
       *
       * Everything that has anything to say about the current move says it here: the prompt, the
       * word being built, the message about it, and the card key. They arrive and leave
       * constantly, and the board is directly underneath, so any of them changing the height of
       * this box makes the board flinch on a submission. The height is fixed in CSS at every
       * width and the overflow is hidden; nothing in here is allowed to grow it.
       */}
      <div className={`word-line${wildUp ? ' has-key' : ''}`}>
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
        {/* The key sits in this line rather than in a row of its own. It used to be a paragraph
            between the HUD and the board that appeared with the first card of a round and left
            with the last, which moved the board every time. Inside a fixed box it can come and go
            for free. */}
        {wildUp ? (
          <span className="wild-key">
            <span aria-hidden="true">{WILD_GLYPH}</span> {messages.wildKey}
          </span>
        ) : null}
        {feedback === null ? null : (
          <span
            key={feedback.epoch}
            className={`feedback is-${feedback.kind}`}
            role="status"
            aria-label={feedback.label}
          >
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
