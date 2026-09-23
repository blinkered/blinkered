import { useRef } from 'react'
import { WILD_GLYPH, alphabetFor, selectedLetters } from '@blinkered/engine'
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

/**
 * The lowest the timer has been this round, which is what makes an added tick tell-able.
 *
 * A tick that a hide handed back relights a pip that had already gone out, and that is exactly
 * what a player should be able to see: this one was not here at the start of the round, it was put
 * back. Anything lit above the low-water mark is such a tick, and it stops being marked the moment
 * it is spent, which is the right lifetime -- roughly as long as the letter is away.
 *
 * Kept here rather than in the engine because it is a fact about what has been shown, not about
 * the game. The engine deliberately keeps no record of what it took back, and this needs none: the
 * bar knows how short it has been.
 */
function useLowWater(roundIndex: number, ticksRemaining: number): number {
  const mark = useRef({ round: roundIndex, floor: ticksRemaining })
  if (mark.current.round !== roundIndex) mark.current = { round: roundIndex, floor: ticksRemaining }
  // Idempotent, so a double render under StrictMode reaches the same answer.
  else if (ticksRemaining < mark.current.floor) mark.current.floor = ticksRemaining
  return mark.current.floor
}

export function Hud({ state, feedback, gain, messages }: HudProps): React.JSX.Element {
  const total = state.config.n + state.config.holdTicks
  const floor = useLowWater(state.roundIndex, state.ticksRemaining)
  const alphabet = alphabetFor(state.config.language)
  // Spelled the way the language writes it while it is still being built, not only when it is
  // finished. Korean is why: its tiles are letters, and ㄱㅏㄱ is not something anyone reads.
  const letters = selectedLetters(state)
  const word = alphabet.display?.(letters) ?? letters
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

      <TickBar
        total={total}
        remaining={state.ticksRemaining}
        floor={floor}
        label={messages.ticksLeftLabel}
      />

      {/*
       * One line, always exactly as tall as itself, and one place where it starts.
       *
       * Everything that has anything to say about the current move says it here: the prompt, the
       * word being built, the message about it, and the card key. They arrive and leave
       * constantly, and the board is directly underneath, so any of them changing the height of
       * this box makes the board flinch on a submission. The height is fixed in CSS at every
       * width and the overflow is hidden; nothing in here is allowed to grow it.
       *
       * **Whatever this line is saying, it starts in the same place: same left edge, same
       * baseline.** Nick, as a rule rather than a bug report: "At any time, there is some message
       * (or no message) to display in the HUD. Display that message, whatever it is, starting from
       * the same place." That is why a message replaces what the line was showing rather than
       * appearing beside it -- a string that follows the word begins wherever the word happens to
       * end -- and why the card key is pinned to the far end of the line in CSS, where it cannot
       * push anything. The prompt has stood down for a message since long before this; the word
       * now does the same, and the selected tiles carry their order numbers while it does.
       */}
      <div className={`word-line${wildUp ? ' has-key' : ''}`}>
        {/* The word runs the game language's way; the rest of the line runs the page's. They
            are different questions and in nerd mode they have different answers. */}
        <output
          className="word"
          dir={alphabetFor(state.config.language).direction}
          aria-live="polite"
        >
          {feedback !== null ? null : word}
        </output>
        {/* Beside the word rather than inside it, which is what puts it on the same line as a
            message rather than three pixels below one: inside, it inherited the word's larger
            strut and sat on that baseline instead of its own.

            Both are rendered and one is drawn, per device. "Type a word" on a phone is an
            instruction to use a thing the phone does not have, and the touch version is now the
            only place the tap rules are stated: they used to also sit under the board, which
            spent a row saying something already on screen. */}
        {feedback === null && word === '' ? (
          <>
            <span className="word-empty keys-only">{messages.typeAWord}</span>
            <span className="word-empty touch-only">
              {format(messages.tapPrompt, { action: messages.completeShort })}
            </span>
          </>
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
        {/* Last in the line, and pinned to its far end in CSS, so it can never decide where a
            message starts. It sits in this line rather than in a row of its own: it used to be a
            paragraph between the HUD and the board that appeared with the first card of a round
            and left with the last, which moved the board every time. Inside a fixed box it can
            come and go for free. */}
        {wildUp ? (
          <span className="wild-key">
            <span aria-hidden="true">{WILD_GLYPH}</span> {messages.wildKey}
          </span>
        ) : null}
      </div>
    </header>
  )
}

/**
 * The round's ticks, one pip each, lit while they remain.
 *
 * Its own component because the tour draws it too: every tile that turns spends a tick of the
 * round and a flip of the game, and the tour is where that link has to be seen.
 */
export function TickBar({
  total,
  remaining,
  floor,
  label,
}: {
  readonly total: number
  readonly remaining: number
  /** The lowest `remaining` has been this round; lit pips above it were handed back. */
  readonly floor: number
  readonly label: string
}): React.JSX.Element {
  return (
    <div
      className="timer"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={remaining}
      aria-label={label}
    >
      {Array.from({ length: total }, (_, i) => {
        const lit = i < remaining
        // Lit, and above the lowest this round has been: a tick handed back by a letter that
        // turned over rather than one the round started with.
        const added = lit && i >= floor
        return <span key={i} className={`pip${lit ? ' is-lit' : ''}${added ? ' is-added' : ''}`} />
      })}
    </div>
  )
}

export function Stat({
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
