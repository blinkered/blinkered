import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ENGINE_VERSION, alphabetFor } from '@blinkered/engine'
import type { Effect, GameEvent, GameResult, GameState } from '@blinkered/engine'
import { format, messagesFor } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import type { TieredIndex } from '@blinkered/words'
import { Board } from './Board.js'
import { LetterSwap, SWAP_MS } from './LetterSwap.js'
import type { Swap } from './LetterSwap.js'
import { GameSetup } from './GameSetup.js'
import { Tutorial } from './Tutorial.js'
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
import { overFixture } from './fixtures.js'
import type { CatalogueEntry } from './dictionary.js'
import { useFocusRelease, withoutStealingFocus } from './focus.js'
import { Share } from './Share.js'
import { isPersonalBest, recordScore, standingOf } from './scores.js'
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
  // an English voice and the browser hyphenates Finnish by English rules. With it goes the
  // direction, which flips the whole layout: every physical offset in the stylesheet is written
  // as a logical one, so the page mirrors from this line alone.
  useEffect(() => {
    document.documentElement.lang = settings.uiLanguage
    document.documentElement.dir = alphabetFor(settings.uiLanguage).direction
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
      <main className="shell centered">
        <h1 lang="en">Blinkered</h1>
        <p className="error">{error}</p>
      </main>
    )
  }
  if (catalogue === null) {
    return (
      <main className="shell centered">
        <h1 lang="en">Blinkered</h1>
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
  /*
   * `?fixture=over` opens straight onto the game-over panel with a canned game behind it, because
   * reaching that panel for real is several minutes of deliberately playing badly. The components
   * and the leaderboard logic are the real ones; only the game that preceded them is invented.
   *
   * Development only, and `import.meta.env.DEV` is what keeps it out of a production bundle
   * entirely. A URL that fakes a finished game is a URL that fakes a personal best, and
   * screenshots travel. See fixtures.ts for the parameters.
   */
  const fixture = import.meta.env.DEV ? overFixture(globalThis.location.search) : null
  const [phase, setPhase] = useState<Phase>(fixture === null ? 'setup' : 'over')
  const [spec, setSpec] = useState<GameSpec | null>(null)
  const [finished, setFinished] = useState<Finished | null>(fixture)

  // The wordmark deals itself as a hand of Blinkered on arrival. Pressing Start during it hurries
  // it along rather than cutting it off, so the game begins on a title that reads BLINKERED.
  const [titleDone, setTitleDone] = useState(false)
  const [hurried, setHurried] = useState(false)
  const [waitingToStart, setWaitingToStart] = useState(false)
  // Only ever true in the native shell, which has no second tab to put the rules in. On the web
  // the link is a link and this stays false forever.
  const [readingRules, setReadingRules] = useState(false)
  /*
   * Closing the tour without ticking the box has to hold for this visit, or the tour reopens the
   * instant it closes: `tutorialSeen` stays false on purpose in that case, since "not now" and
   * "never again" are different answers and only the box means the second one.
   */
  const [tourDone, setTourDone] = useState(false)

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
        standing: standingOf(stored, result, {
          language,
          difficulty: settings.difficulty,
          engineVersion: ENGINE_VERSION,
        }),
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
      {/*
       * The tour, over the setup screen rather than in place of it.
       *
       * Only on a phase where there is no game to interrupt, and only while it has not been
       * dismissed for good. Rendered before the shell so it is the first thing in the document
       * for a screen reader, and over it so the setup screen is already there when it closes:
       * finishing the tour should reveal the choice it just described, not navigate to it.
       */}
      {!settings.tutorialSeen && !tourDone && phase === 'setup' ? (
        <Tutorial
          messages={messages}
          language={language}
          catalogue={catalogue}
          onLanguage={(tag) => {
            // Both, the same way the setup screen's picker sets both: the tour is read and
            // played at once, so its board and its words are the same choice.
            onChange({ ...settings, gameLanguage: tag, uiLanguage: tag })
          }}
          onDone={(hideAgain) => {
            onChange({ ...settings, tutorialSeen: hideAgain })
            setTourDone(true)
          }}
        />
      ) : null}

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
            readIn={settings.uiLanguage}
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
                <FoundWords
                  words={finished.words}
                  messages={messages}
                  language={finished.result.language}
                />
                <Share
                  result={finished.result}
                  personalBest={isPersonalBest(finished.standing)}
                  messages={messages}
                />
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
  // Both of the two ways to lose a game in progress ask first, so this is which question is
  // being asked rather than a flag per button.
  const [confirming, setConfirming] = useState<'quit' | 'restart' | null>(null)
  const game = useGame(dictionary, spec, settings.keyScheme)
  const feedback = useFeedback(game.effects, game.cause, game.epoch, messages, spec.config.language)
  const gain = useWordGain(game.effects, game.epoch)
  const swap = useSwap(game.effects, game.epoch)

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
        {/* Over the board rather than on a tile: which tile changed is exactly what this must
            not give away, since the deal has already happened and naming a position would hand
            the player a free reveal every time. */}
        {swap === null ? null : <LetterSwap swap={swap} messages={messages} />}
        {game.paused && confirming === null ? (
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
       * The confirmations, outside the board rather than over it.
       *
       * They used to be a `.veil` inside `.board-wrap`, which made them 266px wide on a phone:
       * "Quit this game?" wrapped mid-phrase and the two buttons could not fit the track, so they
       * spilled out to the right and looked misaligned because they were. `.board-wrap` is also an
       * inline-size container, and containment makes it the containing block for `position: fixed`,
       * so a full-screen modal could not be built in there at all. Out here it can.
       */}
      {confirming === null ? null : (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <p className="veil-title">
              {confirming === 'quit' ? messages.quitTitle : messages.restartTitle}
            </p>
            <div className="modal-choices">
              <button
                type="button"
                className="btn"
                onMouseDown={withoutStealingFocus}
                onClick={() => {
                  if (confirming === 'quit') onQuit()
                  else {
                    setConfirming(null)
                    onRestart()
                  }
                }}
              >
                {confirming === 'quit' ? messages.quitConfirm : messages.restartConfirm}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onMouseDown={withoutStealingFocus}
                onClick={() => {
                  setConfirming(null)
                  game.setPaused(false)
                }}
              >
                {messages.keepPlaying}
              </button>
            </div>
          </div>
        </div>
      )}

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
          disabled={confirming !== null}
          onClick={() => {
            game.setPaused(!game.paused)
          }}
        />
        {/*
         * Both of these ask first, and the clock stops while they do: a mis-tap must not throw
         * away a game in progress, and the offer to keep playing must not cost flips. Restart used
         * to go straight through, which on a phone meant an accidental brush of the thumb silently
         * dealt a new board with no explanation of where the old one went.
         */}
        <IconButton
          label={messages.restart}
          icon="restart"
          onClick={() => {
            setConfirming('restart')
            game.setPaused(true)
          }}
        />
        <IconButton
          label={messages.quit}
          icon="quit"
          onClick={() => {
            setConfirming('quit')
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

      <FoundWords
        words={game.state.wordsFound}
        messages={messages}
        language={spec.config.language}
      />
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
  language,
}: {
  words: readonly { word: string; points: number; wilds?: readonly number[] }[]
  messages: Messages
  /** The game's language, not the interface's: these are its words, spelled its way. */
  language: string
}): React.JSX.Element {
  if (words.length === 0) {
    return <p className="found dim">{messages.noWordsYet}</p>
  }
  const alphabet = alphabetFor(language)
  // Hebrew's five final forms live here rather than on the tiles, because a tile cannot be two
  // shapes. Everywhere else this is the identity and costs nothing.
  const spell = (word: string): string => alphabet.display?.(word) ?? word
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
          title={`${spell(found.word)} +${String(found.points)}`}
          style={{ ['--len' as string]: String([...found.word].length) }}
        >
          <span className="found-word" dir={alphabet.direction}>
            {/* Letters the wild was given are marked, so the player can see what the board
                handed them rather than what they chose. Marked per character rather than
                highlighting the whole word, because usually only one of them was a gift. */}
            {[...spell(found.word)].map((letter, at) => (
              <span
                key={`${String(at)}-${letter}`}
                className={found.wilds?.includes(at) === true ? 'from-wild' : undefined}
              >
                {letter}
              </span>
            ))}
          </span>
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

/**
 * The letter change to play over its tile, latched for the same reason the gain badge is.
 *
 * Deriving it from the current effects would end the animation at the next dispatch, and a player
 * who taps a tile while watching would cancel the very thing they were watching.
 *
 * Unlike the gain badge this one is also cleared, rather than being left to fade to nothing on its
 * last keyframe. An invisible cover is still two letters in the DOM, one of which is what that
 * tile is now: the board goes to some trouble to keep face-down letters out of the document at
 * all, and leaving one behind here would undo that for the tile the game just drew attention to.
 */
function useSwap(effects: readonly Effect[], epoch: number): Swap | null {
  const [swap, setSwap] = useState<Swap | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )
  useEffect(() => {
    for (const effect of effects) {
      if (effect.type === 'LETTER_REPLACED') {
        setSwap({ from: effect.from, to: effect.to, epoch })
        if (timer.current !== null) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          setSwap(null)
        }, SWAP_MS)
        return
      }
    }
  }, [effects, epoch])
  return swap
}

/** Turns the most interesting effect of the last dispatch into one line of feedback. */
function useFeedback(
  effects: readonly Effect[],
  cause: GameEvent | null,
  epoch: number,
  messages: Messages,
  language: string,
): Feedback | null {
  return useMemo(() => {
    // Folded through the alphabet rather than upper-cased, so the letter named is the one on the
    // tile the player was refused. `toUpperCase` would call a Turkish i an I, which is a
    // different letter and a different tile.
    const alphabet = alphabetFor(language)
    const letter = cause !== null && 'letter' in cause ? alphabet.fold(cause.letter) : null
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
                : effect.reason === 'all-found'
                  ? messages.reasonAllFound
                  : messages.reasonNotAWord
          return {
            kind: 'rejected',
            epoch,
            text: format(messages.wordRejected, { word: effect.word || '—', reason }),
          }
        }
        case 'LETTER_REPLACED':
          /*
           * Found before ROUND_ENDED because the loop runs backwards, so the swap displaces the
           * "shuffled" line rather than adding a row to a bar that has none to give. It is also
           * the more useful of the two: every round shuffles, and this one did something else.
           *
           * An arrow rather than a sentence. It is the same in every language, and it is
           * short enough not to wrap, which matters because this bar is fixed-height and a line
           * that wrapped would push the board.
           */
          return {
            kind: 'note',
            epoch,
            text: `${effect.from} \u2192 ${effect.to}`,
            label: format(messages.letterReplaced, { from: effect.from, to: effect.to }),
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
          // Nothing to say for 'already-selected'. Under `cycle` the letters are canceled
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
  }, [effects, cause, epoch, messages, language])
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
