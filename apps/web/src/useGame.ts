import { useCallback, useEffect, useRef, useState } from 'react'
import { createGame, keyToEvent, reduce } from '@blinkered/engine'
import type { Effect, GameConfig, GameEvent, GameState, KeyScheme } from '@blinkered/engine'
import { generateBoard } from '@blinkered/words'
import type { GeneratedBoard, WordIndex } from '@blinkered/words'
import { alphabetFor } from '@blinkered/engine'

export interface GameSpec {
  readonly config: GameConfig
  readonly seed: number
}

export interface Session {
  readonly state: GameState
  readonly board: GeneratedBoard
  /** Effects from the most recent dispatch, for animation and feedback. */
  readonly effects: readonly Effect[]
  /** Increments on every dispatch, so a repeated effect still reads as new. */
  readonly epoch: number
}

function open(dictionary: WordIndex, spec: GameSpec): Session {
  const alphabet = alphabetFor(spec.config.language)
  const board = generateBoard(spec.config, spec.seed, dictionary, alphabet)
  const [state, effects] = createGame({
    config: spec.config,
    letters: board.letters,
    seed: spec.seed,
  })
  return { state, board, effects, epoch: 0 }
}

export interface Game extends Session {
  /** True while the tab is hidden or the player has paused. The clock is stopped. */
  readonly paused: boolean
  readonly setPaused: (paused: boolean) => void
  readonly dispatch: (event: GameEvent) => void
}

/**
 * Owns the wall clock, which the engine deliberately does not. Everything else about a game
 * is the engine's pure reducer; this hook only decides when a tick happens.
 */
export function useGame(dictionary: WordIndex, spec: GameSpec, keyScheme: KeyScheme): Game {
  const [session, setSession] = useState<Session>(() => open(dictionary, spec))
  const [manuallyPaused, setManuallyPaused] = useState(false)
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden')

  // Restart whenever the caller hands over a different game to play.
  useEffect(() => {
    setSession(open(dictionary, spec))
    setManuallyPaused(false)
  }, [dictionary, spec])

  const dispatch = useCallback(
    (event: GameEvent) => {
      setSession((prev) => {
        if (prev.state.status === 'over') return prev
        const [state, effects] = reduce(prev.state, event, dictionary)
        return { ...prev, state, effects, epoch: prev.epoch + 1 }
      })
    },
    [dictionary],
  )

  // A hidden tab has its timers throttled to a minute or worse, so a game left running in
  // the background would either stall or fast-forward through its flips on return. Pause.
  useEffect(() => {
    const onVisibility = (): void => {
      setHidden(document.visibilityState === 'hidden')
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const paused = manuallyPaused || hidden
  const over = session.state.status === 'over'
  const tickMs = session.state.config.speedMultiplier * 1000

  useEffect(() => {
    if (paused || over) return undefined
    const timer = setInterval(() => {
      dispatch({ type: 'TICK' })
    }, tickMs)
    return () => {
      clearInterval(timer)
    }
  }, [paused, over, tickMs, dispatch])

  // The listener is bound once; the latest state is read through a ref so the handler never
  // closes over a stale board.
  const stateRef = useRef(session.state)
  stateRef.current = session.state
  const schemeRef = useRef(keyScheme)
  schemeRef.current = keyScheme
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const onKeyDown = (press: KeyboardEvent): void => {
      if (press.repeat || pausedRef.current) return
      // Leave the browser's own shortcuts alone, and stay out of form controls.
      if (press.metaKey || press.ctrlKey) return
      const target = press.target
      if (
        target instanceof HTMLElement &&
        /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName)
      ) {
        return
      }
      const event = keyToEvent(
        stateRef.current,
        { key: press.key, alt: press.altKey },
        schemeRef.current,
      )
      if (event === null) return
      press.preventDefault()
      dispatch(event)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [dispatch])

  return { ...session, paused, setPaused: setManuallyPaused, dispatch }
}
