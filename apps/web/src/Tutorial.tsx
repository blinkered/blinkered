import { useEffect, useState } from 'react'
import { WILD_GLYPH, configFor } from '@blinkered/engine'
import type { GameState, Tile } from '@blinkered/engine'
import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { Board } from './Board.js'
import { Icon } from './Icon.js'
import { LetterSwap } from './LetterSwap.js'
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

/** Six tiles, three by two. Enough to make a word from and small enough to read in a modal. */
const LETTERS = [...'SAGTRE']

/**
 * One beat: which tiles are showing, what is selected, and what to say about it.
 *
 * `up` is one character per tile -- `.` face down, `*` a wild, anything else the letter showing.
 * `sel` is tile indices in tap order, so `'013'` is the first, second and fourth tiles taken in
 * that order. Terse on purpose: a beat has to be readable as one line or the choreography below
 * cannot be checked by eye, which is the only way this gets checked at all.
 */
interface Frame {
  readonly up: string
  readonly sel?: string
  readonly caption: string
  /** The word line, when it should say something other than the plain selected letters. */
  readonly word?: string
}

const FRAME_MS = 1400

function stateOf(frame: Frame): GameState {
  const config = configFor('easy', { n: LETTERS.length })
  const tiles: Tile[] = LETTERS.map((letter, id) => {
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
    tiles,
    selection: [...(frame.sel ?? '')].map(Number),
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

/** What the word line shows for a frame: the glyph for a wild, the letter otherwise. */
function wordOf(frame: Frame): string {
  if (frame.word !== undefined) return frame.word
  return [...(frame.sel ?? '')]
    .map((at) => (frame.up[Number(at)] === '*' ? WILD_GLYPH : (LETTERS[Number(at)] ?? '')))
    .join('')
}

interface Step {
  readonly title: string
  readonly frames: readonly Frame[]
  /** Drawn alongside or instead of the board, on the two screens that need something else. */
  readonly panel?: 'controls' | 'swap'
}

function stepsFor(messages: Messages): readonly Step[] {
  return [
    {
      title: messages.htBoardTitle,
      // One tile at a time, in reading order, which is the one rule the whole game rests on.
      frames: [
        { up: '......', caption: messages.htBoardBody },
        { up: 'S.....', caption: messages.htBoardBody },
        { up: 'SA....', caption: messages.htBoardBody },
        { up: 'SAG...', caption: messages.htBoardBody },
      ],
    },
    {
      title: messages.htWordsTitle,
      /*
       * The choreography the tour exists for: take three letters, watch a fourth turn up, give
       * one back, take the better one, complete. Giving a letter back is the beat that earns the
       * screen -- it is the one thing about the interface nobody guesses, and the tap prompt above
       * the board can only assert it.
       */
      frames: [
        { up: 'SAG...', caption: messages.tutPickLetters },
        { up: 'SAG...', sel: '0', caption: messages.tutPickLetters },
        { up: 'SAG...', sel: '01', caption: messages.tutPickLetters },
        { up: 'SAG...', sel: '012', caption: messages.tutPickLetters },
        { up: 'SAGT..', sel: '012', caption: messages.tutMoreTurn },
        { up: 'SAGT..', sel: '01', caption: messages.tutTapBack },
        { up: 'SAGT..', sel: '013', caption: messages.tutComplete },
        { up: 'SAGT..', sel: '013', caption: messages.tutComplete },
      ],
    },
    {
      title: messages.tutControlsTitle,
      panel: 'controls',
      frames: [
        { up: 'SAGT..', caption: messages.tutReset },
        { up: 'SAGT..', caption: messages.tutPause },
        { up: 'SAGT..', caption: messages.tutRestart },
        { up: 'SAGT..', caption: messages.tutQuit },
      ],
    },
    {
      title: messages.htWildTitle,
      frames: [
        { up: 'SA*T..', caption: messages.htWildBody },
        { up: 'SA*T..', sel: '0', caption: messages.htWildBody },
        { up: 'SA*T..', sel: '02', caption: messages.htWildBody },
        { up: 'SA*T..', sel: '023', caption: messages.htWildBody },
        { up: 'SA*T..', sel: '023', caption: messages.htWildBody, word: 'SAT' },
      ],
    },
    {
      title: messages.htSwapTitle,
      panel: 'swap',
      frames: [{ up: 'SAGT..', caption: messages.htSwapBody }],
    },
    {
      title: messages.tutDoneTitle,
      // The whole board face up, which is the one thing the game itself only shows for a moment.
      frames: [{ up: 'SAGTRE', caption: messages.tutDoneBody }],
    },
  ]
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
export function Tutorial({ messages, onDone }: TutorialProps): React.JSX.Element {
  const steps = stepsFor(messages)
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
    if (skipping || current.frames.length < 2) return undefined
    const timer = setInterval(() => {
      setFrame((at) => (at + 1) % current.frames.length)
    }, FRAME_MS)
    return () => {
      clearInterval(timer)
    }
  }, [skipping, current.frames.length])

  const go = (to: number): void => {
    setStep(to)
    setFrame(0)
    // Ticked on arriving at the last screen and clear anywhere else, which is the whole rule:
    // somebody who read the tour has learned the game, and going Back from the end means they
    // have not finished after all.
    setHideAgain(to === steps.length - 1)
  }

  const beat = (current.frames[frame] ?? current.frames[0]) as Frame
  const word = wordOf(beat)

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

        <h3 className="tut-step-title">{current.title}</h3>

        <div className="tut-stage">
          {current.panel === 'swap' ? (
            // The real component, replayed on the tour's own clock: a key that changes every
            // frame is what makes it start over rather than sit finished.
            <div className="tut-swap">
              <LetterSwap swap={{ from: 'G', to: 'E', epoch: frame }} messages={messages} />
            </div>
          ) : (
            <>
              <p className="tut-word">{word === '' ? ' ' : word}</p>
              <div className="board-wrap">
                <Board
                  state={stateOf(beat)}
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
