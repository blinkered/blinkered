import { useEffect, useMemo, useState } from 'react'
import { alphabetFor, configFor } from '@blinkered/engine'
import type { GameState, Tile } from '@blinkered/engine'
import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { Board } from './Board.js'
import { Icon } from './Icon.js'
import { LanguagePicker } from './LanguagePicker.js'
import { LetterSwap } from './LetterSwap.js'
import { boardFor, stepsFor, wordOf } from './tutorialScript.js'
import type { Frame, Step } from './tutorialScript.js'
import type { CatalogueEntry } from './dictionary.js'
import { withoutStealingFocus } from './focus.js'

/**
 * The first-run tour.
 *
 * Every screen here drives the game's own `Board` component from a hand-written state, rather
 * than drawing a picture of a board. That is the whole design: a tutorial that reimplements what
 * it is teaching starts out accurate and quietly stops being so, and the one place a player is
 * guaranteed to be paying close attention is the worst place to be wrong. Tiles flip with the
 * game's flip, a wild draws itself as the game's card, and the letter swap is the same component
 * the game plays.
 *
 * The engine is deliberately NOT driving it. Scripting a reducer into showing one exact word, one
 * exact wild and one exact swap means forcing its random choices at four separate points, which
 * would be more machinery than the frames it produces, and it would put tutorial-shaped holes in
 * `reduce`. Frames are a list; a list is easy to be sure about.
 */

/**
 * How long a frame stays up, from what it has to say rather than from a number per step.
 *
 * A frame that repeats the previous caption is a visual beat -- another tile turning, another
 * letter taken -- and wants to be brisk. A frame that changes the caption has to be read before
 * it goes, and the first version held every frame for 1.4s regardless, which on the controls
 * screen meant four different sentences in under six seconds. You could watch it or read it.
 *
 * Reading time is derived from the caption's length because it has to hold in every language.
 * German runs about 40% longer than English for the same sentence, so any hand-tuned number would
 * be right in one language and wrong in the rest; a rate per character is right everywhere and
 * needs nobody to remember it when a string changes.
 */
const BEAT_MS = 900
const READ_BASE_MS = 1200
const READ_PER_CHAR_MS = 30
/** Long enough for the longest caption, short enough that a loop still feels like a loop. */
const READ_MAX_MS = 6000

/**
 * A tile turning over is quicker than a sentence, because it is not being read.
 *
 * Every screen opens by dealing its board a tile at a time, so at the full beat the tour would
 * spend five and a half seconds on the preamble before the screen said anything. This is the
 * pace the game itself deals at on `easy`, which is the point: the reveal is the mechanic.
 */
const DEAL_MS = 520

/**
 * Long enough for both badges to finish.
 *
 * The score badge is delayed 380ms behind the flips one, deliberately, and each takes a second
 * to rise and fade. At the ordinary beat the frame was gone before the second one had finished
 * arriving, so the half of the bargain the tour is there to explain was the half you missed.
 */
const GAIN_MS = 1800

function holdFor(frame: Frame, previous: Frame): number {
  // A completed word, which has two badges to play out and is the point of the screen.
  if (frame.gain !== undefined) return GAIN_MS
  if (frame.caption !== previous.caption) {
    return Math.min(READ_MAX_MS, READ_BASE_MS + frame.caption.length * READ_PER_CHAR_MS)
  }
  // A frame that only turns a tile over, with nothing taken and nothing said.
  if (frame.sel.length === 0 && frame.up !== previous.up) return DEAL_MS
  return BEAT_MS
}

function stateOf(frame: Frame, tiles: readonly string[], language: string): GameState {
  // The language matters here now: the board reads it to decide which way the grid runs, and a
  // Hebrew tour dealt left to right would be teaching the wrong thing on the first screen.
  const config = configFor('easy', { n: tiles.length, language })
  const board: Tile[] = tiles.map((letter, id) => {
    const face = frame.up[id] ?? '.'
    return {
      id,
      letter,
      position: id,
      revealed: face !== '.',
      spent: false,
      wild: face === '*',
    }
  })
  return {
    config,
    rng: { seed: 1 },
    tiles: board,
    selection: [...frame.sel],
    wildIntent: {},
    roundIndex: 0,
    ticksRemaining: config.n,
    revealsThisRound: 0,
    flipsRemaining: config.initialFlips,
    score: 0,
    wordsFound: [],
    tick: 0,
    status: 'playing',
  }
}

/** The control row, drawn but inert, with the one being described lit. */
function ControlsPanel({ at, messages }: { at: number; messages: Messages }): React.JSX.Element {
  const icons = [
    { icon: 'reset', label: messages.reset },
    { icon: 'pause', label: messages.pause },
    { icon: 'restart', label: messages.restart },
    { icon: 'quit', label: messages.quit },
  ] as const
  return (
    /*
     * `aria-hidden`, and not a set of real buttons. It is a picture of the row under the board,
     * and a screen reader offering five buttons that do nothing is worse than one that says
     * nothing: the caption beside it already names whichever control is lit.
     */
    <div className="tut-controls" aria-hidden="true">
      <span className="btn btn-primary">{messages.completeShort}</span>
      {icons.map((control, index) => (
        <span
          key={control.icon}
          className={`btn btn-icon${index === at ? ' is-lit' : ''}`}
          title={control.label}
        >
          <Icon name={control.icon} />
        </span>
      ))}
    </div>
  )
}

interface TutorialProps {
  readonly messages: Messages
  /** The language the tour is read and played in. Changing it changes the board as well. */
  readonly language: string
  /** Only the languages this build has a word list for, for the picker. */
  readonly catalogue: readonly CatalogueEntry[]
  readonly onLanguage: (language: string) => void
  /** Called once, with whether the player asked not to see this again. */
  readonly onDone: (hideAgain: boolean) => void
}

/**
 * `hideAgain` starts checked only on the last screen.
 *
 * Somebody who read the whole thing has learned the game and should not be asked again; somebody
 * who skipped may well have skipped by accident on a first visit, and defaulting that to "never
 * show me this" would hide the tour from a player who wanted it. So skipping asks, with the box
 * clear, and finishing assumes, with the box ticked.
 */
export function Tutorial({
  messages,
  language,
  catalogue,
  onLanguage,
  onDone,
}: TutorialProps): React.JSX.Element {
  // Memoised because the frame timer depends on the current step: rebuilt every render, the
  // timeout below would be canceled and restarted by every render and never fire.
  const config = useMemo(
    () => configFor('easy', { n: boardFor(language).tiles.length, language }),
    [language],
  )
  const steps = useMemo(() => stepsFor(messages, language, config), [messages, language, config])
  const [step, setStep] = useState(0)
  const [frame, setFrame] = useState(0)
  const [skipping, setSkipping] = useState(false)
  const [hideAgain, setHideAgain] = useState(false)

  const current = steps[step] as Step
  const last = step === steps.length - 1

  // Frames cycle on their own; steps do not. The player controls the pace of the tour and the
  // tour controls the pace of the thing it is showing, which is the way round that lets somebody
  // watch the letter-swap beat twice without having to find a replay button.
  useEffect(() => {
    const beats = current.frames
    if (skipping || beats.length < 2) return undefined
    const showing = beats[frame] as Frame
    const before = beats[(frame - 1 + beats.length) % beats.length] as Frame
    // A timeout rather than an interval, because how long a frame stays up depends on the frame.
    const timer = setTimeout(
      () => {
        setFrame((at) => (at + 1) % beats.length)
      },
      holdFor(showing, before),
    )
    return () => {
      clearTimeout(timer)
    }
  }, [skipping, current, frame])

  const go = (to: number): void => {
    setStep(to)
    setFrame(0)
    // Ticked on arriving at the last screen and clear anywhere else, which is the whole rule:
    // somebody who read the tour has learned the game, and going Back from the end means they
    // have not finished after all.
    setHideAgain(to === steps.length - 1)
  }

  const beat = (current.frames[frame] ?? current.frames[0]) as Frame
  const word = wordOf(beat, current.tiles, alphabetFor(language))

  if (skipping) {
    return (
      <div className="modal tut-modal">
        <div className="modal-card">
          <p className="veil-title">{messages.tutorialSkipTitle}</p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideAgain}
              onChange={(event) => {
                setHideAgain(event.currentTarget.checked)
              }}
            />
            {messages.tutorialHideAgain}
          </label>
          <div className="modal-choices">
            <button
              type="button"
              className="btn btn-primary"
              onMouseDown={withoutStealingFocus}
              onClick={() => {
                onDone(hideAgain)
              }}
            >
              {messages.tutorialSkip}
            </button>
            <button
              type="button"
              className="btn"
              onMouseDown={withoutStealingFocus}
              onClick={() => {
                setSkipping(false)
              }}
            >
              {messages.tutorialBack}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="modal tut-modal"
      role="dialog"
      aria-modal="true"
      aria-label={messages.welcomeTitle}
    >
      <div className="modal-card tut-card">
        <header className="tut-head">
          <h2>{messages.welcomeTitle}</h2>
          <p className="dim">
            {format(messages.tutorialProgress, {
              n: step + 1,
              total: steps.length,
            })}
          </p>
        </header>

        {/*
         * The language, here rather than only on the setup screen behind this.
         *
         * The tour is the first thing a player sees, and a tour in a language they do not read
         * teaches nothing at all -- so the control that fixes that has to be reachable from
         * inside it. It changes the board as well as the words, because the board is a word:
         * every language plays the tour on six tiles of its own, spelling its own three words.
         */}
        {catalogue.length > 0 ? (
          <div className="tut-language">
            <LanguagePicker
              catalogue={catalogue}
              value={language}
              label={messages.gameLanguage}
              onChange={onLanguage}
            />
          </div>
        ) : null}

        <h3 className="tut-step-title">{current.title}</h3>

        <div className="tut-stage">
          {current.panel === 'swap' ? (
            // The real component, replayed on the tour's own clock: a key that changes every
            // frame is what makes it start over rather than sit finished.
            <div className="tut-swap">
              <LetterSwap swap={{ ...boardFor(language).swap, epoch: frame }} messages={messages} />
            </div>
          ) : (
            <>
              <p className="tut-word" dir={alphabetFor(language).direction}>
                {word === ''
                  ? '\u00a0'
                  : [...word].map((letter, at) => (
                      <span
                        key={`${String(at)}-${letter}`}
                        className={at === beat.wildAt ? 'from-wild' : undefined}
                      >
                        {letter}
                      </span>
                    ))}
              </p>
              {/*
               * What the word just paid, in the same animation the HUD plays during a game.
               *
               * Both figures, because both halves of the bargain matter and the tour is where
               * that is explained: the points are the reward and the flips are the turns that
               * reward buys. The numbers come from the engine rather than being written down,
               * so a change to the economy shows up here rather than making this a lie.
               */}
              <p className="tut-gain" aria-hidden="true">
                {beat.gain === undefined ? (
                  '\u00a0'
                ) : (
                  <>
                    <span key={`f${String(step)}-${String(frame)}`} className="stat-gain">
                      +{beat.gain.flips} {messages.flips}
                    </span>
                    <span key={`p${String(step)}-${String(frame)}`} className="stat-gain is-late">
                      +{beat.gain.points} {messages.score}
                    </span>
                  </>
                )}
              </p>
              <div className="board-wrap">
                <Board
                  state={stateOf(beat, current.tiles, language)}
                  portrait
                  concealed={false}
                  messages={messages}
                  onTapTile={() => {
                    // A picture of a board. Tapping it does nothing on purpose.
                  }}
                />
              </div>
            </>
          )}
          {current.panel === 'controls' ? <ControlsPanel at={frame} messages={messages} /> : null}
          {/*
           * The Complete button, drawn but inert, on the screens that press it.
           *
           * The caption says to press Complete, and until now there was no Complete anywhere on
           * the screen: the tour was describing an interface it was not showing. It is on every
           * frame of those screens rather than appearing at the end, because in a real game it
           * is on screen the whole time; what changes is that it lights when the tour presses it.
           */}
          {current.panel === 'controls' || current.panel === 'swap' ? null : (
            /*
             * Drawn on every board screen, and only *lit* on the screens that press it.
             *
             * Reserved rather than conditional so the card is the same height throughout: a
             * modal that grows by a button's worth when you press Next makes the whole thing
             * hop, and the buttons you are aiming at move while you aim. The same reason the
             * board's own box is a fixed height a few rules up.
             */
            <div
              className={`tut-controls${current.panel === 'complete' ? '' : ' is-spacer'}`}
              aria-hidden="true"
            >
              <span className={`btn btn-primary${beat.pressing === true ? ' is-lit' : ''}`}>
                {messages.completeShort}
              </span>
            </div>
          )}
        </div>

        <p className="tut-caption">{beat.caption}</p>

        {last ? (
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideAgain}
              onChange={(event) => {
                setHideAgain(event.currentTarget.checked)
              }}
            />
            {messages.tutorialHideAgain}
          </label>
        ) : null}

        <div className="modal-choices tut-nav">
          <button
            type="button"
            className="btn"
            disabled={step === 0}
            onMouseDown={withoutStealingFocus}
            onClick={() => {
              go(step - 1)
            }}
          >
            {messages.tutorialBack}
          </button>
          {last ? (
            <button
              type="button"
              className="btn btn-primary"
              onMouseDown={withoutStealingFocus}
              onClick={() => {
                onDone(hideAgain)
              }}
            >
              {messages.tutorialStart}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onMouseDown={withoutStealingFocus}
              onClick={() => {
                go(step + 1)
              }}
            >
              {messages.tutorialNext}
            </button>
          )}
          {last ? null : (
            <button
              type="button"
              className="btn tut-skip"
              onMouseDown={withoutStealingFocus}
              onClick={() => {
                // Clear, always. Skipping is not a claim to have learned anything, and on a first
                // visit it is as likely to be a mis-tap as a decision.
                setHideAgain(false)
                setSkipping(true)
              }}
            >
              {messages.tutorialSkip}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
