import { useCallback, useEffect, useMemo, useState } from 'react'
import { ENGINE_VERSION } from '@blinkered/engine'
import type { Effect, GameEvent, GameResult, GameState } from '@blinkered/engine'
import { format, messagesFor } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import type { TieredIndex } from '@blinkered/words'
import { Board } from './Board.js'
import { GameSetup } from './GameSetup.js'
import { HowToPlay } from './HowToPlay.js'
import { HowToPlayLink } from './HowToPlayLink.js'
import { Hud, countOf, formatFinalResult } from './Hud.js'
import { Icon } from './Icon.js'
import type { Feedback, WordGain } from './Hud.js'
import { LanguagePicker } from './LanguagePicker.js'
import { Leaderboard } from './Leaderboard.js'
import { NerdPanel } from './NerdPanel.js'
import { Title } from './Title.js'
import { loadCatalogue, loadDictionary } from './dictionary.js'
import type { CatalogueEntry } from './dictionary.js'
import { useFocusRelease, withoutStealingFocus } from './focus.js'
import { recordScore, standingOf } from './scores.js'
import type { Standing } from './scores.js'
import {
  configOf,
  isCanonical,
  loadSettings,
  saveSettings,
  withOverride,
  withRuleset,
} from './settings.js'
import type { Ruleset, Settings } from './settings.js'
import { useGame } from './useGame.js'
import type { GameSpec } from './useGame.js'

/**
 * A game is set up, played, and then over. Nothing starts on its own.
 *
 * `setup` is where the game-time choices are made and where the rules can be edited; `playing`
 * locks all of them, because a game whose rules changed underneath it cannot honestly be ranked
 * against anything; `over` shows where the game came and offers the same choices again.
 */
type Phase = 'setup' | 'playing' | 'over'

/** What a finished game leaves behind, once the board itself is gone. */
interface Finished {
  readonly result: GameResult
  readonly standing: Standing
  readonly words: readonly { word: string; points: number }[]
}

export function App(): React.JSX.Element {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [catalogue, setCatalogue] = useState<readonly CatalogueEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const messages = useMemo(() => messagesFor(settings.uiLanguage), [settings.uiLanguage])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // The interface language belongs on the document too, or a screen reader announces Greek in
  // an English voice and the browser hyphenates Finnish by English rules.
  useEffect(() => {
    document.documentElement.lang = settings.uiLanguage
  }, [settings.uiLanguage])

  useEffect(() => {
    const controller = new AbortController()
    loadCatalogue(controller.signal)
      .then(setCatalogue)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      controller.abort()
    }
  }, [])

  if (error !== null) {
    return (
      <main className="shell centred">
        <h1>Blinkered</h1>
        <p className="error">{error}</p>
      </main>
    )
  }
  if (catalogue === null) {
    return (
      <main className="shell centred">
        <h1>Blinkered</h1>
        <p className="dim">{messages.readingDictionary}</p>
      </main>
    )
  }
  return (
    <Session catalogue={catalogue} settings={settings} messages={messages} onChange={setSettings} />
  )
}

/** Loads the dictionary for a language, and reports honestly while it is doing so. */
function useDictionary(
  language: string,
  messages: Messages,
): { dictionary: TieredIndex | null; error: string | null } {
  const [dictionary, setDictionary] = useState<TieredIndex | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setDictionary(null)
    setError(null)
    loadDictionary(language, messages, controller.signal)
      .then(setDictionary)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      controller.abort()
    }
    // `messages` only supplies the wording of a failure. Re-fetching a dictionary because
    // somebody changed interface language would be silly.
  }, [language])

  return { dictionary, error }
}

function Session({
  catalogue,
  settings,
  messages,
  onChange,
}: {
  catalogue: readonly CatalogueEntry[]
  settings: Settings
  messages: Messages
  onChange: (next: Settings) => void
}): React.JSX.Element {
  // A stored game language this deployment has no list for falls back to one it does have,
  // rather than to a loading state that never finishes.
  const language = catalogue.some((entry) => entry.tag === settings.gameLanguage)
    ? settings.gameLanguage
    : (catalogue[0]?.tag ?? settings.gameLanguage)

  const { dictionary, error } = useDictionary(language, messages)
  const [phase, setPhase] = useState<Phase>('setup')
  const [spec, setSpec] = useState<GameSpec | null>(null)
  const [finished, setFinished] = useState<Finished | null>(null)

  // The wordmark deals itself as a hand of Blinkered on arrival. Pressing Start during it hurries
  // it along rather than cutting it off, so the game begins on a title that reads BLINKERED.
  const [titleDone, setTitleDone] = useState(false)
  const [hurried, setHurried] = useState(false)
  const [waitingToStart, setWaitingToStart] = useState(false)
  // Only ever true in the native shell, which has no second tab to put the rules in. On the web
  // the link is a link and this stays false forever.
  const [readingRules, setReadingRules] = useState(false)

  const config = useMemo(() => configOf(settings), [settings])
  const playing = phase === 'playing'
  const nerdFocus = useFocusRelease()

  const begin = useCallback((): void => {
    setFinished(null)
    setSpec({ config, seed: freshSeed() })
    setPhase('playing')
  }, [config])

  const start = (): void => {
    if (titleDone) {
      begin()
      return
    }
    setHurried(true)
    setWaitingToStart(true)
  }

  useEffect(() => {
    if (!waitingToStart || !titleDone) return
    setWaitingToStart(false)
    begin()
  }, [waitingToStart, titleDone, begin])

  const quit = (): void => {
    // A quit is not a result. A game abandoned at a good score is not a good game.
    setSpec(null)
    setPhase('setup')
  }

  const onFinish = useCallback(
    (state: GameState, seed: number): void => {
      const result: GameResult = {
        score: state.score,
        words: state.wordsFound.length,
        rounds: state.roundIndex + 1,
        language,
        difficulty: settings.difficulty,
        canonical: isCanonical(settings),
        at: Date.now(),
        seed,
        engineVersion: ENGINE_VERSION,
      }
      const stored = recordScore(result)
      setFinished({
        result,
        standing: standingOf(stored, result, { language, difficulty: settings.difficulty }),
        words: state.wordsFound,
      })
      setPhase('over')
    },
    [language, settings],
  )

  const setup = (startLabel: string): React.JSX.Element => (
    <GameSetup
      settings={settings}
      messages={messages}
      ready={dictionary !== null && !waitingToStart}
      startLabel={startLabel}
      onRuleset={(ruleset: Ruleset) => {
        onChange(withRuleset(settings, ruleset))
      }}
      onStart={start}
    />
  )

  return (
    <>
      {/*
       * The rules in the native shell, drawn over the top rather than in place of the game.
       *
       * Returning them instead of the shell was the first attempt and it was wrong: React
       * unmounts what it replaces, so `Playing` went with it, and coming back mounted a fresh
       * game on the same seed. The player lost the word they were holding and the board started
       * over, which is worse than the dropped link this exists to fix. Rendering both keeps the
       * game mounted, so it is still there, still paused, still holding its selection.
       */}
      {readingRules ? (
        <div className="rules-overlay">
          <HowToPlay
            messages={messages}
            language={settings.uiLanguage}
            onLanguage={(tag) => {
              onChange({ ...settings, uiLanguage: tag })
            }}
            onBack={() => {
              setReadingRules(false)
            }}
          />
        </div>
      ) : null}

      <main className={`shell${settings.nerdMode ? ' has-nerd' : ''}`}>
        <div className="titlebar">
          <Title
            skip={hurried}
            onDone={() => {
              setTitleDone(true)
            }}
          />
          {/*
           * One How to play, for every phase of the game. It used to be two: one under the Start
           * button and one at the end of the legend, where it was an unstyled blue link hanging
           * off the bottom of the page. A control always in the same place is easier to find than
           * one that moves with the phase.
           *
           * Beside the wordmark rather than after the language picker, which is packing rather
           * than taste. The title bar wraps greedily in this order, and with the help control
           * further along, the second row came to 290px against 288px available at 320px wide and
           * pushed the nerd toggle onto a third row. Here the rows are 266px and 234px.
           */}
          <HowToPlayLink
            language={settings.uiLanguage}
            messages={messages}
            onShowInApp={() => {
              setReadingRules(true)
            }}
          />

          {/* Always here, and live except while a game is running. Somebody arriving at a page
            in a language they cannot read has to be able to fix that before anything else. */}
          <LanguagePicker
            catalogue={catalogue}
            value={language}
            label={messages.gameLanguage}
            disabled={playing}
            onChange={(tag) => {
              onChange({ ...settings, gameLanguage: tag, uiLanguage: tag })
            }}
          />
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.nerdMode}
              {...nerdFocus.handlers}
              onChange={(e) => {
                // Give the keyboard back, or the board stops hearing anything typed at it.
                nerdFocus.release(e.currentTarget)
                onChange({ ...settings, nerdMode: e.target.checked })
              }}
            />
            <span>{messages.nerdMode}</span>
          </label>
        </div>

        <div className={`body${settings.nerdMode ? ' has-nerd' : ''}`}>
          <div className={`play${playing ? ' has-board' : ''}`}>
            {error !== null ? <p className="error">{error}</p> : null}

            {phase === 'setup' ? <div className="panel">{setup(messages.start)}</div> : null}

            {phase === 'over' && finished !== null ? (
              <div className="panel">
                <p className="veil-title">{messages.outOfFlips}</p>
                <p className="result-line">
                  {formatFinalResult(messages, {
                    score: finished.result.score,
                    words: finished.result.words,
                    rounds: finished.result.rounds,
                  })}
                </p>
                <Leaderboard
                  standing={finished.standing}
                  current={finished.result}
                  messages={messages}
                />
                <FoundWords words={finished.words} messages={messages} />
                {setup(messages.newGame)}
              </div>
            ) : null}

            {playing && spec !== null && dictionary !== null ? (
              <Playing
                key={spec.seed}
                dictionary={dictionary}
                spec={spec}
                settings={settings}
                messages={messages}
                onRestart={start}
                onQuit={quit}
                onFinish={onFinish}
                rulesOpen={readingRules}
              />
            ) : null}
          </div>

          {settings.nerdMode ? (
            <NerdPanel
              settings={settings}
              config={config}
              dictionary={dictionary}
              locked={playing}
              messages={messages}
              onChange={onChange}
              onOverride={(overrides) => {
                onChange(withOverride(settings, overrides))
              }}
            />
          ) : null}
        </div>
      </main>
    </>
  )
}

function Playing({
  dictionary,
  spec,
  settings,
  messages,
  onRestart,
  onQuit,
  onFinish,
  rulesOpen,
}: {
  dictionary: TieredIndex
  spec: GameSpec
  settings: Settings
  messages: Messages
  onRestart: () => void
  onQuit: () => void
  onFinish: (state: GameState, seed: number) => void
  /**
   * True while the in-app rules cover the game, which only happens in the native shell. Reading
   * the rules must not cost flips, and the clock lives in here rather than in Session, so Session
   * says the rules are open and this decides what that means.
   */
  rulesOpen: boolean
}): React.JSX.Element {
  const portrait = usePortrait()
  const [confirmingQuit, setConfirmingQuit] = useState(false)
  const game = useGame(dictionary, spec, settings.keyScheme)
  const feedback = useFeedback(game.effects, game.cause, game.epoch, messages)
  const gain = useWordGain(game.effects, game.epoch)

  useEffect(() => {
    if (rulesOpen) game.setPaused(true)
  }, [rulesOpen, game])

  const over = game.state.status === 'over'
  // Reported once the reducer says so; the parent then takes over and unmounts this.
  const finalState = game.state
  const { seed } = spec
  useEffect(() => {
    if (over) onFinish(finalState, seed)
  }, [over, finalState, seed, onFinish])

  return (
    <>
      <Hud state={game.state} feedback={feedback} gain={gain} messages={messages} />

      <div className="board-wrap">
        <Board
          state={game.state}
          portrait={portrait}
          concealed={game.paused}
          messages={messages}
          onTapTile={(tileId) => {
            game.dispatch({ type: 'TAP_TILE', tileId })
          }}
        />
        {confirmingQuit ? (
          <div className="veil">
            <p className="veil-title">{messages.quitTitle}</p>
            <div className="controls">
              <button
                type="button"
                className="btn"
                onMouseDown={withoutStealingFocus}
                onClick={onQuit}
              >
                {messages.quitConfirm}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onMouseDown={withoutStealingFocus}
                onClick={() => {
                  setConfirmingQuit(false)
                  game.setPaused(false)
                }}
              >
                {messages.keepPlaying}
              </button>
            </div>
          </div>
        ) : game.paused ? (
          <div className="veil">
            <p>{messages.paused}</p>
            <button
              type="button"
              className="btn"
              onMouseDown={withoutStealingFocus}
              onClick={() => {
                game.setPaused(false)
              }}
            >
              {messages.resume}
            </button>
          </div>
        ) : null}
      </div>

      {/*
       * One row, on every screen and in every language. Five word-labelled buttons cannot do
       * that: at 320px they wrapped onto a second line, which cost a row of the board.
       *
       * So the primary keeps words, because "press Complete" is what the instruction above the
       * board tells you to do, and it uses `completeShort` so the two always agree. The other
       * four are drawings with their full localised name on `aria-label` and `title`.
       */}
      <div className="controls">
        <button
          type="button"
          className="btn btn-primary"
          disabled={game.paused}
          onMouseDown={withoutStealingFocus}
          onClick={() => {
            game.dispatch({ type: 'SUBMIT_WORD' })
          }}
        >
          {messages.completeShort} <kbd>enter</kbd>
        </button>
        <IconButton
          label={messages.reset}
          icon="reset"
          hint="esc"
          disabled={game.paused}
          onClick={() => {
            game.dispatch({ type: 'RESET_WORD' })
          }}
        />
        <IconButton
          label={game.paused ? messages.resume : messages.pause}
          icon={game.paused ? 'resume' : 'pause'}
          disabled={confirmingQuit}
          onClick={() => {
            game.setPaused(!game.paused)
          }}
        />
        <IconButton label={messages.restart} icon="restart" onClick={onRestart} />
        <IconButton
          label={messages.quit}
          icon="quit"
          onClick={() => {
            // Confirmed, and the clock stops while it is: a mis-click must not throw away a
            // game in progress, and the offer to keep playing must not cost flips.
            setConfirmingQuit(true)
            game.setPaused(true)
          }}
        />
      </div>

      {/* Only the bindings the buttons cannot advertise. Enter and Escape are already written
          on the two buttons that own them, so repeating them here is noise, and the keyboard
          items are hidden where there is no keyboard. How to play moved to the title bar, which
          leaves every item here a keyboard item, so the whole list goes on a touch screen.


          A list rather than a paragraph of spans, because the items are only separated by a
          flex gap: visually that reads fine, but as one run of text it does not, and a screen
          reader gets the text. */}
      <ul className="legend">
        <li className="keys-only">{messages.lettersSelect}</li>
        <li className="keys-only">
          <kbd>shift-X</kbd> {format(messages.clearsEvery, { letter: 'X' })}
        </li>
        <li className="keys-only">
          <kbd>&#x232b;</kbd> {messages.undoLastLetter}
        </li>
      </ul>

      <FoundWords words={game.state.wordsFound} messages={messages} />
    </>
  )
}

/**
 * A secondary control: a drawing, and its name everywhere a drawing cannot be read.
 *
 * `aria-label` for a screen reader, `title` for a pointer that hovers, and the `hint` is the
 * keyboard binding, which the stylesheet already hides where there is no keyboard.
 */
function IconButton({
  label,
  icon,
  hint,
  disabled = false,
  onClick,
}: {
  label: string
  icon: 'reset' | 'pause' | 'resume' | 'restart' | 'quit'
  hint?: string
  disabled?: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="btn btn-icon"
      disabled={disabled}
      aria-label={label}
      title={label}
      onMouseDown={withoutStealingFocus}
      onClick={onClick}
    >
      <Icon name={icon} />
      {/* Drawn only where there is room, which is a desktop. The drawing is what makes five
          controls fit a phone; the word is what makes them obvious anywhere else. */}
      <span className="btn-text">{label}</span>
      {hint === undefined ? null : <kbd>{hint}</kbd>}
    </button>
  )
}

function FoundWords({
  words,
  messages,
}: {
  words: readonly { word: string; points: number }[]
  messages: Messages
}): React.JSX.Element {
  if (words.length === 0) {
    return <p className="found dim">{messages.noWordsYet}</p>
  }
  return (
    <ul className="found">
      {[...words].reverse().map((found) => (
        // `--len` is the word's length, which the narrow rail uses to size the text so that a
        // long word shrinks to fit rather than being cut. Spread rather than measured in JS: the
        // length is already known here, and a ResizeObserver per word would be a lot of
        // machinery for an answer arithmetic can give. The title still carries the whole thing,
        // for the rare word too long even at the smallest size.
        <li
          key={found.word}
          title={`${found.word} +${String(found.points)}`}
          style={{ ['--len' as string]: String([...found.word].length) }}
        >
          <span className="found-word">{found.word}</span>
          <span className="found-points">{found.points}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * What the last accepted word was worth, for the badges that float over the figures.
 *
 * Gains only. Flips are also spent, one per tile that turns, and a round can charge for the ones
 * it did not use; animating those would mean a number floating over the HUD several times a
 * round, which is the difference between a reward and a nag.
 */
function useWordGain(effects: readonly Effect[], epoch: number): WordGain | null {
  // Latched, not derived. Deriving it from the current effects tied the badge's life to the next
  // dispatch, and the next dispatch is a TICK: measured, the badge was destroyed 745ms into its
  // own 1000ms animation, and where a submit fell in the tick cycle decided whether the player
  // saw the whole thing, a fragment, or nothing. Holding the last gain hands the timing back to
  // the animation, which is the only thing that knows when it has finished. Nothing clears it,
  // because the last keyframe is transparent and a new word replaces it with a fresh key.
  const [gain, setGain] = useState<WordGain | null>(null)
  useEffect(() => {
    for (const effect of effects) {
      if (effect.type === 'WORD_ACCEPTED') {
        setGain({ points: effect.points, flips: effect.flips, epoch })
        return
      }
    }
  }, [effects, epoch])
  return gain
}

/** Turns the most interesting effect of the last dispatch into one line of feedback. */
function useFeedback(
  effects: readonly Effect[],
  cause: GameEvent | null,
  epoch: number,
  messages: Messages,
): Feedback | null {
  return useMemo(() => {
    const letter = cause !== null && 'letter' in cause ? cause.letter.toUpperCase() : null
    for (const effect of [...effects].reverse()) {
      switch (effect.type) {
        case 'WORD_ACCEPTED':
          // Nothing to say here. The word arrives in the rail with its points, announcing itself
          // by turning green and settling, and the flips it paid back are the FLIPS figure
          // changing. Saying it a third time in the word line was what made that line wrap and
          // shove the board down at the exact moment the player was looking at it.
          return null
        case 'WORD_REJECTED': {
          const reason =
            effect.reason === 'duplicate'
              ? messages.reasonDuplicate
              : effect.reason === 'too-short'
                ? messages.reasonTooShort
                : messages.reasonNotAWord
          return {
            kind: 'rejected',
            epoch,
            text: format(messages.wordRejected, { word: effect.word || '—', reason }),
          }
        }
        case 'ROUND_ENDED':
          return {
            kind: 'note',
            epoch,
            text:
              effect.flipsCharged > 0
                ? format(messages.shuffledAndBilled, {
                    flips: countOf(messages, 'flips', effect.flipsCharged),
                  })
                : messages.shuffled,
          }
        case 'INPUT_IGNORED':
          // Being refused a letter has to be loud. A player typing ALIAS cannot see how many
          // A tiles the board holds, and silently building ALIS instead is how a word gets
          // submitted that nobody meant to submit.
          if (effect.reason === 'no-such-letter') {
            return {
              kind: 'rejected',
              epoch,
              text:
                letter === null ? messages.nothingUp : format(messages.noSuchLetterUp, { letter }),
            }
          }
          // Nothing to say for 'already-selected'. Under `cycle` the letters are cancelled
          // and the word line shows that plainly; under `advance` the word simply does not
          // grow. Neither needs narrating.
          return null
        case 'REVEALED':
        case 'SELECTED':
        case 'DESELECTED':
        case 'GAME_OVER':
          break
      }
    }
    return null
  }, [effects, cause, epoch, messages])
}

function usePortrait(): boolean {
  const [portrait, setPortrait] = useState(
    () => globalThis.matchMedia('(orientation: portrait)').matches,
  )
  useEffect(() => {
    const query = globalThis.matchMedia('(orientation: portrait)')
    const onChange = (): void => {
      setPortrait(query.matches)
    }
    query.addEventListener('change', onChange)
    return () => {
      query.removeEventListener('change', onChange)
    }
  }, [])
  return portrait
}

function freshSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1
}
