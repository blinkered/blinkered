import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * The wordmark, played as a hand of Blinkered.
 *
 * Nine tiles come up face down in a shuffled order and flip over one at a time. Once they are
 * all exposed, the word is selected out of them a letter at a time, in reading order, each tile
 * lighting up as it is taken. Then the tiles travel into the order they were picked in, and the
 * jumble turns out to have said BLINKERED all along.
 *
 * Which is the game: the letters are always there, and the whole difficulty is that they arrive
 * in the wrong order.
 *
 * Skippable, and skipping is not cancelling. Pressing Start mid-animation exposes and selects
 * everything at once and still runs the travel, because a title that vanished halfway through a
 * shuffle would read as a bug rather than as impatience being honoured.
 */
const TITLE = 'BLINKERED'

/**
 * One tile at a time, deliberately unhurried, because this is the half that has to be
 * understood: tiles arrive one by one and you cannot read them yet.
 */
const REVEAL_MS = 450
/** Picking the word out of the jumble. Half the interval, because this half is the pay-off. */
const SELECT_MS = 225
/** A beat between the three movements, so they read as three rather than as one long one. */
const BEAT_MS = 260
/** Must match the transition on `.title-tile`. */
const TRAVEL_MS = 840

interface TitleProps {
  /** Set when the player has started a game and does not want to wait for this. */
  readonly skip: boolean
  /** Fired once, when the tiles have finished travelling. */
  readonly onDone: () => void
}

export function Title({ skip, onDone }: TitleProps): React.JSX.Element {
  const reduced = usePrefersReducedMotion()
  const [order, setOrder] = useState<readonly number[]>(() =>
    reduced ? inOrder() : shuffledOrder(),
  )
  /** Display positions turned face up, in display order. */
  const [revealed, setRevealed] = useState(() => (reduced ? TITLE.length : 0))
  /** Letters taken into the word, in reading order. */
  const [selected, setSelected] = useState(() => (reduced ? TITLE.length : 0))
  const [travelling, setTravelling] = useState(reduced)
  /** Dropped once the word is assembled, leaving a clean wordmark rather than a lit one. */
  const [lit, setLit] = useState(true)

  const nodes = useRef(new Map<number, HTMLSpanElement>())
  const boxes = useRef(new Map<number, DOMRect>())

  // Fired at most once, however the animation ends and whatever React decides to re-run.
  const announced = useRef(false)
  const finish = useRef(onDone)
  finish.current = onDone

  const allUp = revealed >= TITLE.length
  const allTaken = selected >= TITLE.length

  // Movement one: flip them over, one at a time, in the order they happen to be lying in.
  useEffect(() => {
    if (allUp) return undefined
    const timer = setTimeout(() => {
      setRevealed((count) => count + 1)
    }, REVEAL_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [revealed, allUp])

  // Movement two: pick the word out of them, in reading order.
  useEffect(() => {
    if (!allUp || allTaken) return undefined
    const timer = setTimeout(
      () => {
        setSelected((count) => count + 1)
      },
      selected === 0 ? BEAT_MS : SELECT_MS,
    )
    return () => {
      clearTimeout(timer)
    }
  }, [allUp, selected, allTaken])

  // Movement three: let them travel into the order they were picked in.
  useEffect(() => {
    if (!allTaken || travelling) return undefined
    const timer = setTimeout(
      () => {
        setTravelling(true)
        setOrder(inOrder())
      },
      skip ? 0 : BEAT_MS,
    )
    return () => {
      clearTimeout(timer)
    }
  }, [allTaken, travelling, skip])

  useEffect(() => {
    if (!travelling) return undefined
    const timer = setTimeout(
      () => {
        setLit(false)
        if (announced.current) return
        announced.current = true
        finish.current()
      },
      reduced ? 0 : TRAVEL_MS,
    )
    return () => {
      clearTimeout(timer)
    }
  }, [travelling, reduced])

  // Impatience: expose and take everything at once, and let the travel still happen.
  useEffect(() => {
    if (!skip) return
    setRevealed(TITLE.length)
    setSelected(TITLE.length)
  }, [skip])

  // FLIP: measure where each tile was, invert it into its old place, then let it travel. The
  // same technique the board uses for a shuffle, and for the same reason: a letter you can
  // follow is the difference between a shuffle you can read and one you cannot.
  const layout = order.join(',')
  useLayoutEffect(() => {
    const previous = boxes.current
    const next = new Map<number, DOMRect>()
    const moves: { node: HTMLSpanElement; dx: number }[] = []

    for (const [index, node] of nodes.current) {
      const box = node.getBoundingClientRect()
      next.set(index, box)
      const was = previous.get(index)
      if (!was) continue
      const dx = was.left - box.left
      if (Math.abs(dx) > 0.5) moves.push({ node, dx })
    }
    boxes.current = next
    if (moves.length === 0) return undefined

    for (const { node, dx } of moves) {
      node.style.transition = 'none'
      node.style.transform = `translateX(${String(dx)}px)`
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
  }, [layout])

  return (
    <h1 className="title" aria-label={TITLE.charAt(0) + TITLE.slice(1).toLowerCase()}>
      {order.map((index, position) => {
        const up = position < revealed
        const classes = ['title-tile']
        if (up) classes.push('is-up')
        if (lit && index < selected) classes.push('is-lit')
        return (
          <span
            key={index}
            ref={(node) => {
              if (node) nodes.current.set(index, node)
              else nodes.current.delete(index)
            }}
            className={classes.join(' ')}
            aria-hidden="true"
          >
            <span className="title-face title-back" />
            <span className="title-face title-front">{up ? TITLE.charAt(index) : ''}</span>
          </span>
        )
      })}
    </h1>
  )
}

function inOrder(): number[] {
  return [...TITLE].map((_, index) => index)
}

/**
 * A shuffled order that is definitely not already the word.
 *
 * Only a view flourish, so `Math.random` is fine here: the engine's ban on it is about game
 * state, which has to replay from a seed.
 */
function shuffledOrder(): number[] {
  const order = inOrder()
  for (let at = order.length - 1; at > 0; at--) {
    const pick = Math.floor(Math.random() * (at + 1))
    const held = order[at] as number
    order[at] = order[pick] as number
    order[pick] = held
  }
  // A shuffle that happens to spell the word is a shuffle nobody will believe.
  return order.every((index, position) => index === position) ? shuffledOrder() : order
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
