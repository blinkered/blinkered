import { useEffect, useMemo, useState } from 'react'
import { alphabetFor, configFor } from '@blinkered/engine'
import type { GameState, Tile } from '@blinkered/engine'
import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { Board } from './Board.js'
import { Stat, TickBar } from './Hud.js'
import { Icon } from './Icon.js'
import { LanguagePicker } from './LanguagePicker.js'
import { LetterSwap } from './LetterSwap.js'
import {
  FACE_DOWN,
  FACE_SPENT,
  boardFor,
  showsFlips,
  showsGain,
  showsTicks,
  showsWord,
  stepsFor,
  ticksAt,
  wordOf,
} from './tutorialScript.js'
import type { Frame, Step } from './tutorialScript.js'
import type { CatalogueEntry } from './dictionary.js'
import { withoutStealingFocus } from './focus.js'
import { ignoredByManagers } from './autofill.js'

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
 * **Reading time belongs to a caption, not to a frame.** It used to be charged to the frame the
 * caption changed on, and on the words screen that frame is also one that turns a tile over: the
 * first tile of a sentence sat there for three and a half seconds and the two after it went by in
 * nine hundred milliseconds each. Nick: "What's up with the very long, dramatic pauses on slide 2?
 * The timing between reveals is very inconsistent." So the reading is spread over every frame that
 * shows the sentence, and all of them hold for the same length: the slowest thing any of them is
 * doing, or an even share of the reading, whichever is longer. The sentence still gets its time
 * and the tiles arrive at one pace.
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

/** The run of frames around `at` that all show the same caption. */
function sentenceAt(frames: readonly Frame[], at: number): { first: number; length: number } {
  const said = frames[at]?.caption
  let first = at
  while (first > 0 && frames[first - 1]?.caption === said) first -= 1
  let last = at
  while (last + 1 < frames.length && frames[last + 1]?.caption === said) last += 1
  return { first, length: last - first + 1 }
}

/** What a frame is doing, ignoring what it says: turning a tile over, or anything else. */
function beatFor(frames: readonly Frame[], at: number): number {
  const frame = frames[at] as Frame
  const previous = frames[(at - 1 + frames.length) % frames.length] as Frame
  // A frame that only turns a tile over, with nothing taken and nothing said.
  return frame.sel.length === 0 && frame.up !== previous.up ? DEAL_MS : BEAT_MS
}

export function holdFor(frames: readonly Frame[], at: number): number {
  const frame = frames[at] as Frame
  // A completed word, which has two badges to play out and is the point of the screen.
  if (frame.gain !== undefined) return GAIN_MS
  const { first, length } = sentenceAt(frames, at)
  const busiest = Math.max(...Array.from({ length }, (_, step) => beatFor(frames, first + step)))
  /*
   * One caption for the whole screen gets no reading time of its own, and keeps the pace of the
   * thing it describes: there the loop is the reading time, since it comes round in a few seconds
   * and says the same thing again. Dividing a sentence into it would only slow down the board
   * screen, whose entire subject is how fast the game deals.
   */
  if (length === frames.length) return busiest
  const read = Math.min(READ_MAX_MS, READ_BASE_MS + frame.caption.length * READ_PER_CHAR_MS)
  return Math.max(busiest, Math.round(read / length))
}

/** How long each flip takes to count in, when a word pays several. */
const COUNT_UP_MS = 110

/**
 * The flips counter on the goal screen, ticking rather than jumping.
 *
 * Down is one flip per frame already, because the tiles turn one at a time, and each of those
 * gets a short red tick. Up is a word paying several at once, and a number that simply changes
 * from 36 to 44 reads as a different number rather than as eight flips arriving; so it counts in,
 * a flip at a time, in green. Reduced motion gets the new number straight away.
 */
function FlipCounter({ value, label }: { value: number; label: string }): React.JSX.Element {
  const [shown, setShown] = useState(value)
  const [moved, setMoved] = useState<{ way: 'up' | 'down'; epoch: number } | null>(null)

  useEffect(() => {
    if (value === shown) return undefined
    const still = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (value < shown || still) {
      setShown(value)
      setMoved((last) => ({ way: value < shown ? 'down' : 'up', epoch: (last?.epoch ?? 0) + 1 }))
      return undefined
    }
    const timer = setTimeout(() => {
      setShown((at) => at + 1)
      setMoved((last) => ({ way: 'up', epoch: (last?.epoch ?? 0) + 1 }))
    }, COUNT_UP_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [value, shown])

  return (
    <div
      key={moved?.epoch ?? 0}
      className={`tut-flips${moved === null ? '' : ` is-${moved.way}`}`}
      aria-hidden="true"
    >
      <Stat label={label} value={shown} emphasis="strong" />
    </div>
  )
}

function stateOf(frame: Frame, tiles: readonly string[], language: string): GameState {
  // The language matters here now: the board reads it to decide which way the grid runs, and a
  // Hebrew tour dealt left to right would be teaching the wrong thing on the first screen.
  const config = configFor('easy', { n: tiles.length, language })
  const board: Tile[] = tiles.map((letter, id) => {
    const face = frame.up[id] ?? FACE_DOWN
    return {
      id,
      letter,
      position: id,
      revealed: face !== FACE_DOWN && face !== FACE_SPENT,
      spent: face === FACE_SPENT,
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
  /**
   * Opens the sign-in dialog from the last screen.
   *
   * The tour does not close first. The dialog draws over it the way it draws over everything
   * else, so somebody who changes their mind is still on the screen that offered it, and
   * somebody who signs in comes back to press Start playing.
   */
  readonly onSignIn: () => void
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
  onSignIn,
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
    // A timeout rather than an interval, because how long a frame stays up depends on the frame.
    const timer = setTimeout(
      () => {
        setFrame((at) => (at + 1) % beats.length)
      },
      holdFor(beats, frame),
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
  /*
   * Which tile is turning back over on this frame, so the tour flips it the way the game does.
   *
   * Derived by comparing this frame's faces with the one before rather than written on the frame:
   * a tile that was up and is now down was taken back, and that is the whole test. Without it the
   * hiding screen would teach the rule using the ordinary deal animation, which is the one motion
   * the rule is meant to be distinguishable from.
   */
  const before = frame > 0 ? current.frames[frame - 1] : undefined
  const wentDown =
    before === undefined
      ? -1
      : [...beat.up].findIndex((face, at) => face === FACE_DOWN && before.up[at] !== FACE_DOWN)
  const hiding = wentDown < 0 ? null : wentDown
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
              {...ignoredByManagers}
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
              readIn={language}
              label={messages.gameLanguage}
              onChange={onLanguage}
            />
          </div>
        ) : null}

        <h3 className="tut-step-title">{current.title}</h3>

        <div className="tut-stage">
          {current.panel === 'account' ? (
            /*
             * The words and one button, and nothing that looks like a board.
             *
             * The caption line below the stage is suppressed on this screen: drawing
             * `beat.caption` here *and* there is what made it say the same sentence twice.
             *
             * The button opens the dialog the rest of the app opens. A second sign-in surface
             * inside a tour would need its own validation, its own code step, its own errors in
             * fifty-one languages, and would give the tour a way to fail halfway through.
             */
            <div className="tut-account">
              <p>{beat.caption}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  /*
                   * Taking the offer ends the tour, and it has to: the sign-in dialog is a modal
                   * of its own and `.tut-modal` sits above `.modal` on purpose, so the dialog
                   * opened *underneath* this card and the only way to reach it was to press
                   * Start playing. Two stacked modals is the bug; raising one above the other
                   * would only have hidden it.
                   *
                   * Through `onDone` rather than by closing quietly, so the checkbox on this
                   * screen still means what it says. Somebody who ticks it and then signs in
                   * has said "never again" as clearly as somebody who ticks it and plays.
                   */
                  onDone(hideAgain)
                  onSignIn()
                }}
              >
                {messages.signInTitle}
              </button>
            </div>
          ) : current.panel === 'swap' ? (
            // The real component, replayed on the tour's own clock: a key that changes every
            // frame is what makes it start over rather than sit finished.
            <div className="tut-swap">
              <LetterSwap swap={{ ...boardFor(language).swap, epoch: frame }} messages={messages} />
            </div>
          ) : (
            <>
              {/*
                Reserved on the screens that use it, absent on the screens that do not.
                
                The non-breaking space is what holds the line's height across a screen's frames,
                so the card does not change shape as a word is spelled. What it should not do is
                hold that height on a screen where no word is ever built, and most of them
                never build one: there it was a blank line above the board.
              */}
              {/*
                The flips counter, drawn by the HUD's own component, on the screen about flips.
                Keyed by the step so that coming back to the screen starts it from the top rather
                than counting down from wherever it was left.
              */}
              {showsFlips(current) && beat.flips !== undefined ? (
                <FlipCounter key={step} value={beat.flips} label={messages.flips} />
              ) : null}
              {showsWord(current) ? (
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
              ) : null}
              {/*
               * What the word just paid, in the same animation the HUD plays during a game.
               *
               * Both figures, because both halves of the bargain matter and the tour is where
               * that is explained: the points are the reward and the flips are the turns that
               * reward buys. The numbers come from the engine rather than being written down,
               * so a change to the economy shows up here rather than making this a lie.
               */}
              {showsGain(current) ? (
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
              ) : null}
              {/*
                The round's ticks, above every board that turns tiles, because each tile that
                turns spends one of them and one flip. Nick: "every board that shows flipping
                letters should have the tick bar above it, to emphasize the relationship between
                flips and ticks."
              */}
              {showsTicks(current) ? (
                <div className="tut-ticks">
                  <TickBar
                    total={config.n + config.holdTicks}
                    {...ticksAt(current, frame, config.n + config.holdTicks)}
                    label={messages.ticksLeftLabel}
                  />
                </div>
              ) : null}
              <div className="board-wrap">
                <Board
                  state={stateOf(beat, current.tiles, language)}
                  portrait
                  concealed={false}
                  hiding={hiding}
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
          {current.panel === 'complete' ? (
            /*
             * Only on the screens whose captions say to press it, and lit on the frames that do.
             *
             * It used to be drawn on every board screen and made invisible elsewhere, reserved so
             * that pressing Next could not change the card's height. Within a screen that still
             * matters and still holds -- every frame of a screen that presses Complete draws it.
             * Between screens it was 37px of nothing on most of them, which is the sort of
             * reserved space that adds up to a slide reading as mostly empty.
             */
            <div className="tut-controls" aria-hidden="true">
              <span className={`btn btn-primary${beat.pressing === true ? ' is-lit' : ''}`}>
                {messages.completeShort}
              </span>
            </div>
          ) : null}
        </div>

        {/* The account screen draws its own words inside the stage; see above. */}
        {current.panel === 'account' ? null : <p className="tut-caption">{beat.caption}</p>}

        {last ? (
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideAgain}
              {...ignoredByManagers}
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
