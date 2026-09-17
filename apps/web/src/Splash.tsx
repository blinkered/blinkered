import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * The app's opening: nine letters in a jumble, picked out in order, assembling into the name.
 *
 * Nick's idea, and the reason it belongs here rather than in the title bar: the wordmark's
 * animation is charming at a laptop's width and silly at a phone's, where the row has room for
 * one tile. So the shell shows the trick properly, once, on its own screen -- and the title bar
 * above the game stands still. Same tiles, same flip, same FLIP travel; a third of the duration.
 *
 * It is also the game in nine letters, which is why it is worth a second and a half: the letters
 * are all there from the start and the whole difficulty is that they arrive in the wrong order.
 *
 * **Only in the native shell.** A website that took a second and a half of somebody's attention
 * before showing them anything would be a website with a worse first visit. An app has a launch
 * moment already -- iOS draws `LaunchScreen` before the WebView has painted a pixel -- and this is
 * what fills the gap that follows it.
 */
const TITLE = 'BLINKERED'

/**
 * A letter lights every 128ms, and the word travels in 630.
 *
 * Both were a third of that, and both were wrong: "mobile opening screen is *way* too fast". Half
 * again as slow is still brisk against the title bar's 225ms a letter -- this is an opening rather
 * than an idle flourish -- but it is now something somebody can follow rather than a flicker.
 */
const PICK_MS = 128
/** Must match the transition on `.splash-tile`. */
const TRAVEL_MS = 630
/**
 * Two seconds with the name assembled, which Nick asked for by the clock.
 *
 * It is the whole point of the screen: the letters were always there and the difficulty was the
 * order, and that only reads if the finished word is allowed to sit still for a moment.
 */
const HOLD_MS = 2000
/** The fade. Must match the transition on `.splash.is-leaving`. */
const FADE_MS = 260

type Phase = 'jumbled' | 'picking' | 'assembled' | 'leaving'

export function Splash({ onDone }: { readonly onDone: () => void }): React.JSX.Element {
  const reduced = usePrefersReducedMotion()
  /**
   * The order the tiles are lying in. Shuffled, and shuffled once: a new order on every render
   * would reshuffle the grid under the animation.
   */
  const [order] = useState<readonly number[]>(() => (reduced ? inOrder() : shuffled()))
  const [phase, setPhase] = useState<Phase>(reduced ? 'assembled' : 'jumbled')
  /** How many letters have been picked, in reading order. */
  const [picked, setPicked] = useState(reduced ? TITLE.length : 0)

  const nodes = useRef(new Map<number, HTMLSpanElement>())
  const boxes = useRef(new Map<number, DOMRect>())
  const finish = useRef(onDone)
  finish.current = onDone

  /** Skipping is not cancelling: it goes to the assembled word rather than to nothing. */
  const hurry = (): void => {
    setPicked(TITLE.length)
    setPhase((at) => (at === 'leaving' ? at : 'assembled'))
  }

  // One letter at a time, in reading order, out of the jumble.
  useEffect(() => {
    if (phase !== 'jumbled' && phase !== 'picking') return undefined
    if (picked >= TITLE.length) {
      setPhase('assembled')
      return undefined
    }
    const timer = setTimeout(() => {
      setPhase('picking')
      setPicked((count) => count + 1)
    }, PICK_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [phase, picked])

  // Assembled, held, gone. The travel happens because `phase` changed the layout; see below.
  useEffect(() => {
    if (phase !== 'assembled') return undefined
    const timer = setTimeout(
      () => {
        setPhase('leaving')
      },
      reduced ? HOLD_MS : TRAVEL_MS + HOLD_MS,
    )
    return () => {
      clearTimeout(timer)
    }
  }, [phase, reduced])

  useEffect(() => {
    if (phase !== 'leaving') return undefined
    const timer = setTimeout(
      () => {
        finish.current()
      },
      reduced ? 0 : FADE_MS,
    )
    return () => {
      clearTimeout(timer)
    }
  }, [phase, reduced])

  /*
   * FLIP, in both directions.
   *
   * The tiles go from a 3x3 grid to a single row, so unlike the title bar's travel -- which only
   * ever moves letters along a line -- this one has to invert `y` as well as `x`. Measure where
   * each tile was, put it back there with a transform, then release it on the next frame and let
   * the CSS transition carry it. The alternative is computing nine target positions by hand, which
   * is the same animation with arithmetic that can be wrong.
   */
  const laidOut = phase === 'assembled' || phase === 'leaving'
  useLayoutEffect(() => {
    const previous = boxes.current
    const next = new Map<number, DOMRect>()
    const moves: { node: HTMLSpanElement; dx: number; dy: number }[] = []

    for (const [index, node] of nodes.current) {
      const box = node.getBoundingClientRect()
      next.set(index, box)
      const was = previous.get(index)
      if (!was) continue
      const dx = was.left - box.left
      const dy = was.top - box.top
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) moves.push({ node, dx, dy })
    }
    boxes.current = next
    if (moves.length === 0) return undefined

    for (const { node, dx, dy } of moves) {
      node.style.transition = 'none'
      node.style.transform = `translate(${String(dx)}px, ${String(dy)}px)`
    }
    const frame = requestAnimationFrame(() => {
      for (const { node } of moves) {
        node.style.transition = ''
        node.style.transform = ''
      }
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [laidOut])

  return (
    /*
     * A press anywhere skips it, and the element is a button so that a keyboard and a screen
     * reader get the same escape a thumb does. `aria-label` rather than visible words: the name
     * is being spelled out in tiles that are themselves hidden from the accessibility tree.
     */
    <button
      type="button"
      className={`splash${phase === 'leaving' ? ' is-leaving' : ''}`}
      aria-label={TITLE.charAt(0) + TITLE.slice(1).toLowerCase()}
      onClick={hurry}
    >
      <div className={laidOut ? 'splash-word' : 'splash-grid'} dir="ltr" lang="en">
        {order.map((index) => (
          <span
            key={index}
            ref={(node) => {
              if (node) nodes.current.set(index, node)
              else nodes.current.delete(index)
            }}
            className={`splash-tile title-tile is-up${index < picked ? ' is-lit' : ''}`}
            /* Reading position, so the word row can be ordered by it while the grid is not. */
            style={{ order: laidOut ? index : undefined }}
            aria-hidden="true"
          >
            <span className="title-face title-back" />
            <span className="title-face title-front">{TITLE.charAt(index)}</span>
          </span>
        ))}
      </div>

      {/*
        Whose game it is, in the corner, where a studio mark goes.

        The same element as the about page's, so both take the palette's choice of variant from
        one rule rather than two. Not a link: this is a splash screen, and a tap anywhere on it
        means "get on with it".
      */}
      <span className="splash-mark tightline-mark" role="img" aria-label="Tight Line Software" />
    </button>
  )
}

function inOrder(): number[] {
  return [...TITLE].map((_, index) => index)
}

/** A jumble that is definitely not the word. `Math.random` is fine: this is a flourish. */
function shuffled(): number[] {
  const order = inOrder()
  for (let at = order.length - 1; at > 0; at--) {
    const pick = Math.floor(Math.random() * (at + 1))
    const held = order[at] as number
    order[at] = order[pick] as number
    order[pick] = held
  }
  return order.every((index, position) => index === position) ? shuffled() : order
}

function usePrefersReducedMotion(): boolean {
  const [reduced] = useState(() => {
    try {
      return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  })
  return reduced
}
