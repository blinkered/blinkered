import { useCallback, useEffect, useRef, useState } from 'react'
import { createGame, keyToEvent, reduce } from '@blinkered/engine'
import type { Effect, GameConfig, GameEvent, GameState, KeyScheme } from '@blinkered/engine'
import { generateBoard } from '@blinkered/words'
import { SWAP_MS } from './LetterSwap.js'
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
  /** The event that produced those effects, so feedback can name the letter involved. */
  readonly cause: GameEvent | null
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
  return { state, board, effects, cause: null, epoch: 0 }
}

export interface Game extends Session {
  /** True while the tab is hidden or the player has paused. The clock is stopped. */
  readonly paused: boolean
  readonly setPaused: (paused: boolean) => void
  readonly dispatch: (event: GameEvent) => void
}

/**
 * Whether a keystroke belongs to the game rather than to whatever has focus.
 *
 * A text field owns every key it receives, and a `select` owns letters too, since typing one
 * jumps to the matching option. A button owns almost nothing: it answers to Enter and Space
 * and ignores the rest. Lumping buttons in with the text fields cost the game its keyboard
 * every time somebody clicked Pause or picked a language with the mouse, because focus stayed
 * on the control and every letter after that went nowhere.
 */
function playable(press: KeyboardEvent): boolean {
  const target = press.target
  if (!(target instanceof HTMLElement)) return true
  // An open listbox owns every key, including the letters: arrow keys move through it and a
  // letter jumps to an option. It says so by role rather than by reaching in here.
  if (target.closest('[role="listbox"]') !== null) return false
  switch (target.tagName) {
    case 'INPUT':
    case 'TEXTAREA':
    case 'SELECT':
      return false
    case 'BUTTON':
      // Let the browser have the two keys that press a button.
      return press.key !== 'Enter' && press.key !== ' '
    default:
      return true
  }
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
        return { ...prev, state, effects, cause: event, epoch: prev.epoch + 1 }
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

  /*
   * The clock stops while a letter is being changed.
   *
   * Not a pause: the veil stays down and the board stays visible, because the whole point is that
   * the player watches. It costs them nothing, since a round is only spent by ticks and no ticks
   * happen. Without it the interstitial would play over a board that was already turning tiles,
   * and the one moment the mechanic gets to explain itself would be competing with the deal.
   *
   * The timer lives in a ref rather than in the effect's cleanup. Tying it to the dependency
   * array looked tidier and was wrong: `effects` is a new array on every dispatch, and a player
   * who taps a tile mid-swap dispatches, so the cleanup would cancel the hold and start the clock
   * again halfway through the animation.
   */
  const [swapping, setSwapping] = useState(false)
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!session.effects.some((effect) => effect.type === 'LETTER_REPLACED')) return
    setSwapping(true)
    if (swapTimer.current !== null) clearTimeout(swapTimer.current)
    swapTimer.current = setTimeout(() => {
      setSwapping(false)
    }, SWAP_MS)
  }, [session.effects])
  useEffect(
    () => () => {
      if (swapTimer.current !== null) clearTimeout(swapTimer.current)
    },
    [],
  )

  const paused = manuallyPaused || hidden
  const over = session.state.status === 'over'
  const tickMs = session.state.config.speedMultiplier * 1000

  useEffect(() => {
    if (paused || over || swapping) return undefined
    const timer = setInterval(() => {
      dispatch({ type: 'TICK' })
    }, tickMs)
    return () => {
      clearInterval(timer)
    }
  }, [paused, over, swapping, tickMs, dispatch])

  // The listener is bound once. It no longer needs to read game state at all: keyToEvent
  // maps a keystroke to an intent and the reducer resolves it against live state, so there
  // is nothing left here to go stale between keystrokes.
  const schemeRef = useRef(keyScheme)
  schemeRef.current = keyScheme
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const onKeyDown = (press: KeyboardEvent): void => {
      if (press.repeat || pausedRef.current) return
      // Leave the browser's own shortcuts alone, and stay out of form controls.
      if (press.metaKey || press.ctrlKey) return
      if (!playable(press)) return
      const event = keyToEvent({ key: press.key, modified: press.shiftKey }, schemeRef.current)
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
