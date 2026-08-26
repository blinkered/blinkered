import { useEffect, useMemo, useState } from 'react'
import type { Effect, GameEvent } from '@blinkered/engine'
import { format, messagesFor } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import type { TieredIndex } from '@blinkered/words'
import { Board } from './Board.js'
import { Hud, countOf, formatFinalResult } from './Hud.js'
import type { Feedback } from './Hud.js'
import { LanguagePicker } from './LanguagePicker.js'
import { NerdPanel } from './NerdPanel.js'
import { loadCatalogue, loadDictionary } from './dictionary.js'
import type { CatalogueEntry } from './dictionary.js'
import { withoutStealingFocus } from './focus.js'
import { configOf, loadSettings, saveSettings } from './settings.js'
import type { Settings } from './settings.js'
import { useGame } from './useGame.js'
import type { GameSpec } from './useGame.js'

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

  if (error !== null) return <Shell>{<p className="error">{error}</p>}</Shell>
  if (catalogue === null) {
    return <Shell>{<p className="dim">{messages.readingDictionary}</p>}</Shell>
  }
  return (
    <Loading catalogue={catalogue} settings={settings} messages={messages} onChange={setSettings} />
  )
}

function Shell({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <main className="shell centred">
      <h1>Blinkered</h1>
      {children}
    </main>
  )
}

/**
 * Holds the dictionary for the chosen language, and reloads it when that changes.
 *
 * Separate from `App` so switching language remounts the game rather than trying to keep a
 * board built from one language's letters alive against another language's dictionary.
 */
function Loading({
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
  const [dictionary, setDictionary] = useState<TieredIndex | null>(null)
  const [error, setError] = useState<string | null>(null)

  // A stored game language whose list this deployment does not have falls back to the first
  // one it does, rather than to a loading screen that never finishes.
  const language = catalogue.some((entry) => entry.tag === settings.gameLanguage)
    ? settings.gameLanguage
    : (catalogue[0]?.tag ?? settings.gameLanguage)

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
    // Keyed on the language alone. `messages` is read here only to word a failure, and
    // re-fetching a dictionary because somebody changed interface language would be silly.
  }, [language, messages])

  const pick = (tag: string): void => {
    // One control, both languages. Anyone who wants them to differ can say so in nerd mode.
    onChange({ ...settings, gameLanguage: tag, uiLanguage: tag })
  }

  if (error !== null) return <Shell>{<p className="error">{error}</p>}</Shell>
  if (dictionary === null) {
    return (
      <Shell>
        <p className="dim">{messages.readingDictionary}</p>
        <LanguagePicker
          catalogue={catalogue}
          value={language}
          label={messages.gameLanguage}
          onChange={pick}
        />
      </Shell>
    )
  }
  return (
    <Playing
      // Remounts on a language change, which throws away a board of the wrong letters.
      key={language}
      dictionary={dictionary}
      catalogue={catalogue}
      settings={settings}
      messages={messages}
      language={language}
      onChange={onChange}
      onPickLanguage={pick}
    />
  )
}

function Playing({
  dictionary,
  catalogue,
  settings,
  messages,
  language,
  onChange,
  onPickLanguage,
}: {
  dictionary: TieredIndex
  catalogue: readonly CatalogueEntry[]
  settings: Settings
  messages: Messages
  language: string
  onChange: (next: Settings) => void
  onPickLanguage: (tag: string) => void
}): React.JSX.Element {
  const config = useMemo(() => configOf(settings), [settings])
  const [spec, setSpec] = useState<GameSpec>(() => ({ config, seed: freshSeed() }))
  const portrait = usePortrait()

  const game = useGame(dictionary, spec, settings.keyScheme)
  const feedback = useFeedback(game.effects, game.cause, game.epoch, messages)
  const dirty = JSON.stringify(config) !== JSON.stringify(spec.config)

  const newGame = (): void => {
    setSpec({ config, seed: freshSeed() })
  }

  const over = game.state.status === 'over'

  return (
    <main className={`shell${settings.nerdMode ? ' has-nerd' : ''}`}>
      <div className="play">
        <div className="titlebar">
          <h1>Blinkered</h1>
          <LanguagePicker
            catalogue={catalogue}
            value={language}
            label={messages.gameLanguage}
            onChange={onPickLanguage}
          />
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.nerdMode}
              onChange={(e) => {
                onChange({ ...settings, nerdMode: e.target.checked })
              }}
            />
            <span>{messages.nerdMode}</span>
          </label>
        </div>

        <Hud state={game.state} feedback={feedback} messages={messages} />

        <div className="board-wrap">
          <Board
            state={game.state}
            portrait={portrait}
            concealed={game.paused && !over}
            messages={messages}
            onTapTile={(tileId) => {
              game.dispatch({ type: 'TAP_TILE', tileId })
            }}
          />
          {game.paused && !over ? (
            <div className="veil">
              <p>{messages.paused}</p>
              <button
                type="button"
                onMouseDown={withoutStealingFocus}
                className="btn"
                onClick={() => {
                  game.setPaused(false)
                }}
              >
                {messages.resume}
              </button>
            </div>
          ) : null}
          {over ? (
            <div className="veil">
              <p className="veil-title">{messages.outOfFlips}</p>
              <p>
                {formatFinalResult(messages, {
                  score: game.state.score,
                  words: game.state.wordsFound.length,
                  rounds: game.state.roundIndex + 1,
                })}
              </p>
              <button
                type="button"
                onMouseDown={withoutStealingFocus}
                className="btn btn-primary"
                onClick={newGame}
              >
                {messages.playAgain}
              </button>
            </div>
          ) : null}
        </div>

        <div className="controls">
          <button
            type="button"
            onMouseDown={withoutStealingFocus}
            className="btn btn-primary"
            disabled={over || game.paused}
            onClick={() => {
              game.dispatch({ type: 'SUBMIT_WORD' })
            }}
          >
            {messages.completeWord} <kbd>enter</kbd>
          </button>
          <button
            type="button"
            onMouseDown={withoutStealingFocus}
            className="btn"
            disabled={over || game.paused}
            onClick={() => {
              game.dispatch({ type: 'RESET_WORD' })
            }}
          >
            {messages.reset} <kbd>esc</kbd>
          </button>
          <button
            type="button"
            onMouseDown={withoutStealingFocus}
            className="btn"
            disabled={over}
            onClick={() => {
              game.setPaused(!game.paused)
            }}
          >
            {game.paused ? messages.resume : messages.pause}
          </button>
          <button
            type="button"
            onMouseDown={withoutStealingFocus}
            className="btn"
            onClick={newGame}
          >
            {messages.newGame}
          </button>
        </div>

        {/* Only the bindings the buttons cannot advertise. Enter and Escape are already
            written on Complete word and Reset, so repeating them here is noise. Hidden on
            touch devices, where none of it applies. */}
        <p className="legend">
          <span>{messages.lettersSelect}</span>
          <span>
            <kbd>shift-X</kbd> {format(messages.clearsEvery, { letter: 'X' })}
          </span>
          <span>
            <kbd>&#x232b;</kbd> {messages.undoLastLetter}
          </span>
        </p>

        <FoundWords state={game.state} messages={messages} />
      </div>

      {settings.nerdMode ? (
        <NerdPanel
          settings={settings}
          config={config}
          board={game.board}
          dictionary={dictionary}
          dirty={dirty}
          messages={messages}
          onChange={onChange}
          onNewGame={newGame}
        />
      ) : null}
    </main>
  )
}

function FoundWords({
  state,
  messages,
}: {
  state: { wordsFound: readonly { word: string; points: number }[] }
  messages: Messages
}): React.JSX.Element {
  if (state.wordsFound.length === 0) {
    return <p className="found dim">{messages.noWordsYet}</p>
  }
  return (
    <ul className="found">
      {[...state.wordsFound].reverse().map((found) => (
        <li key={found.word}>
          {found.word}
          <span className="found-points">{found.points}</span>
        </li>
      ))}
    </ul>
  )
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
          return {
            kind: 'accepted',
            epoch,
            text: format(messages.wordAccepted, {
              word: effect.word,
              points: effect.points,
              flips: effect.flips,
            }),
          }
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
