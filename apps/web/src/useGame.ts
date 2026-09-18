import { useCallback, useEffect, useRef, useState } from 'react'
import { createGame, keyToEvent, reduce } from '@blinkered/engine'
import type { Effect, GameConfig, GameEvent, GameState, KeyScheme } from '@blinkered/engine'
import { generateBoard } from '@blinkered/words'
import { SWAP_MS } from './LetterSwap.js'
import { TOO_FEW_MS } from './TooFewLetters.js'
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
  /**
   * Whether the clock has ever stopped in this game, by either route.
   *
   * It is what decides leaderboard eligibility, and the exploit it closes is Nick's: screen-cap
   * the board, stop the clock, pick the words out of the photograph at leisure, resume, and miss
   * nothing. Nothing can stop somebody photographing a screen -- a second phone would do it --
   * so the answer is not to try, and instead to say that a game whose clock stopped is not a
   * game anybody is ranked on.
   *
   * **Including the tab going away**, which is the part worth arguing. Pausing by hand and
   * switching apps stop the clock identically, and the second one is *easier*: leave the game,
   * study the screenshot in Photos, come back. A rule that only counted the Pause button would
   * be a rule with a hole in the shape of the home gesture.
   */
  readonly stopped: boolean
  /**
   * True while the notice about a round that ran out of usable letters is up.
   *
   * The clock is stopped for this too, and deliberately not through `paused`: that flag is what
   * costs a player their place on the leaderboard, and a hold the game itself imposed is not the
   * player stopping the clock. Nothing they did earned the penalty, so nothing here applies it.
   */
  readonly fewerLetters: boolean
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
  /** Latched, never cleared within a game: see `stopped` on `Game`. */
  const [stopped, setStopped] = useState(false)
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden')

  // Restart whenever the caller hands over a different game to play.
  useEffect(() => {
    setSession(open(dictionary, spec))
    setManuallyPaused(false)
    setStopped(false)
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

  /*
   * And it stops again while the player is told why a round ended early.
   *
   * Same shape as the swap above and for the same two reasons: the hold has to be as long as the
   * notice, and the timer belongs in a ref because `effects` is a new array on every dispatch, so
   * a cleanup tied to it would cancel the hold the moment the player touched anything.
   *
   * Free, like the swap. The engine has already dealt the next board by the time this effect
   * arrives -- the reducer is where a round ends -- so what is being held is the first tick of
   * the new round, and a round is only spent by ticks.
   */
  const [fewerLetters, setFewerLetters] = useState(false)
  const fewerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const cut = session.effects.some((effect) => effect.type === 'ROUND_ENDED' && effect.cutShort)
    if (!cut) return
    setFewerLetters(true)
    if (fewerTimer.current !== null) clearTimeout(fewerTimer.current)
    fewerTimer.current = setTimeout(() => {
      setFewerLetters(false)
    }, TOO_FEW_MS)
  }, [session.effects])
  useEffect(
    () => () => {
      if (fewerTimer.current !== null) clearTimeout(fewerTimer.current)
    },
    [],
  )
  useEffect(
    () => () => {
      if (swapTimer.current !== null) clearTimeout(swapTimer.current)
    },
    [],
  )

  const paused = manuallyPaused || hidden
  const over = session.state.status === 'over'

  /*
   * Latched here rather than in the two places that can pause, because there are three: the
   * button, the tab going away, and the in-app rules opening over a running game. One effect on
   * the derived value catches all of them and anything added later.
   *
   * Not latched once the game is over: the panel that follows a finished game is not play, and a
   * tab hidden while somebody reads their score has stopped nothing.
   */
  useEffect(() => {
    if (paused && !over) setStopped(true)
  }, [paused, over])
  const tickMs = session.state.config.speedMultiplier * 1000

  useEffect(() => {
    if (paused || over || swapping || fewerLetters) return undefined
    const timer = setInterval(() => {
      dispatch({ type: 'TICK' })
    }, tickMs)
    return () => {
      clearInterval(timer)
    }
  }, [paused, over, swapping, fewerLetters, tickMs, dispatch])

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

  return { ...session, paused, stopped, fewerLetters, setPaused: setManuallyPaused, dispatch }
}
