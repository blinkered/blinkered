import { useEffect, useMemo, useState } from 'react'
import type { Effect } from '@blinkered/engine'
import type { WordIndex } from '@blinkered/words'
import { Board } from './Board.js'
import { Hud } from './Hud.js'
import type { Feedback } from './Hud.js'
import { NerdPanel } from './NerdPanel.js'
import { loadDictionary } from './dictionary.js'
import { configOf, loadSettings, saveSettings } from './settings.js'
import type { Settings } from './settings.js'
import { useGame } from './useGame.js'
import type { GameSpec } from './useGame.js'

export function App(): React.JSX.Element {
  const [dictionary, setDictionary] = useState<WordIndex | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    loadDictionary('en', controller.signal)
      .then(setDictionary)
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
  if (dictionary === null) {
    return (
      <main className="shell centred">
        <h1>Blinkered</h1>
        <p className="dim">Reading the dictionary…</p>
      </main>
    )
  }
  return <Playing dictionary={dictionary} />
}

function Playing({ dictionary }: { dictionary: WordIndex }): React.JSX.Element {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [spec, setSpec] = useState<GameSpec>(() => ({
    config: configOf(loadSettings()),
    seed: freshSeed(),
  }))
  const portrait = usePortrait()

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const config = useMemo(() => configOf(settings), [settings])
  const game = useGame(dictionary, spec, settings.keyScheme)
  const feedback = useFeedback(game.effects, game.epoch)
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
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.nerdMode}
              onChange={(e) => {
                setSettings({ ...settings, nerdMode: e.target.checked })
              }}
            />
            <span>nerd mode</span>
          </label>
        </div>

        <Hud state={game.state} feedback={feedback} />

        <div className="board-wrap">
          <Board
            state={game.state}
            portrait={portrait}
            concealed={game.paused && !over}
            onTapTile={(tileId) => {
              game.dispatch({ type: 'TAP_TILE', tileId })
            }}
          />
          {game.paused && !over ? (
            <div className="veil">
              <p>Paused</p>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  game.setPaused(false)
                }}
              >
                Resume
              </button>
            </div>
          ) : null}
          {over ? (
            <div className="veil">
              <p className="veil-title">Out of flips</p>
              <p>
                {game.state.score} points from {game.state.wordsFound.length}{' '}
                {game.state.wordsFound.length === 1 ? 'word' : 'words'} over{' '}
                {game.state.roundIndex + 1} rounds
              </p>
              <button type="button" className="btn btn-primary" onClick={newGame}>
                Play again
              </button>
            </div>
          ) : null}
        </div>

        <div className="controls">
          <button
            type="button"
            className="btn btn-primary"
            disabled={over || game.paused}
            onClick={() => {
              game.dispatch({ type: 'SUBMIT_WORD' })
            }}
          >
            Complete word <kbd>enter</kbd>
          </button>
          <button
            type="button"
            className="btn"
            disabled={over || game.paused}
            onClick={() => {
              game.dispatch({ type: 'RESET_WORD' })
            }}
          >
            Reset <kbd>esc</kbd>
          </button>
          <button
            type="button"
            className="btn"
            disabled={over}
            onClick={() => {
              game.setPaused(!game.paused)
            }}
          >
            {game.paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="btn" onClick={newGame}>
            New game
          </button>
        </div>

        <FoundWords state={game.state} />
      </div>

      {settings.nerdMode ? (
        <NerdPanel
          settings={settings}
          config={config}
          board={game.board}
          dirty={dirty}
          onChange={setSettings}
          onNewGame={newGame}
        />
      ) : null}
    </main>
  )
}

function FoundWords({
  state,
}: {
  state: { wordsFound: readonly { word: string; points: number }[] }
}): React.JSX.Element {
  if (state.wordsFound.length === 0) {
    return <p className="found dim">No words yet.</p>
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
function useFeedback(effects: readonly Effect[], epoch: number): Feedback | null {
  return useMemo(() => {
    for (const effect of [...effects].reverse()) {
      switch (effect.type) {
        case 'WORD_ACCEPTED':
          return {
            kind: 'accepted',
            epoch,
            text: `${effect.word}  +${String(effect.points)} points, +${String(effect.flips)} flips`,
          }
        case 'WORD_REJECTED': {
          const reason =
            effect.reason === 'duplicate'
              ? 'already found'
              : effect.reason === 'too-short'
                ? 'too short'
                : 'not a word'
          return { kind: 'rejected', epoch, text: `${effect.word || '—'}  ${reason}` }
        }
        case 'ROUND_ENDED':
          return {
            kind: 'note',
            epoch,
            text:
              effect.flipsCharged > 0
                ? `shuffled, billed ${String(effect.flipsCharged)} unused flips`
                : 'shuffled',
          }
        case 'INPUT_IGNORED':
          if (effect.reason === 'no-such-letter') return { kind: 'rejected', epoch, text: 'not up' }
          return null
        case 'REVEALED':
        case 'SELECTED':
        case 'DESELECTED':
        case 'GAME_OVER':
          break
      }
    }
    return null
  }, [effects, epoch])
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
