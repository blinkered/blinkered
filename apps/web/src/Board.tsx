import { useLayoutEffect, useRef } from 'react'
import { WILD_GLYPH, alphabetFor } from '@blinkered/engine'
import type { GameState, Tile } from '@blinkered/engine'
import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'

/** Columns for a board of n tiles. Purely a view decision; the engine only knows order. */
export function columnsFor(n: number, portrait: boolean): number {
  if (n <= 4) return 2
  if (n <= 9) return 3
  if (n <= 12) return portrait ? 3 : 4
  return portrait ? 4 : 5
}

/**
 * Rows the grid will actually use, which the stylesheet cannot work out for itself.
 *
 * A tile is sized from the room available, and on a phone the scarce dimension is height, so
 * the height has to be divided by something. CSS knows the column count because it is told,
 * but `repeat()` derives the rows from the item count and never exposes the answer.
 */
export function rowsFor(n: number, columns: number): number {
  return Math.ceil(n / columns)
}

/**
 * How long the flip-back is announced for.
 *
 * Long enough to catch out of the corner of an eye and short enough to be over before the letter
 * could be back: the deal takes it at a mean of three ticks, which is 2.7s on insane.
 */
export const HIDE_MS = 520

interface BoardProps {
  readonly state: GameState
  readonly portrait: boolean
  /**
   * Covers the board completely, letters and all. Used while paused: the game is built
   * around a brief exposure window, so being able to pause and study an exposed board
   * would be the cheapest cheat available.
   */
  readonly concealed: boolean
  /**
   * The tile that has just turned back over of its own accord, for as long as the animation runs.
   *
   * Transient on purpose. It gives the *moment* a voice, because a letter leaving used to look
   * exactly like every other flip and one tile doing it mid-round read as nothing at all. It
   * must not outlive the animation: a mark that stayed would label that slot "a letter you have
   * already seen", which is the one inference this mechanic exists to deny.
   */
  readonly hiding: number | null
  readonly onTapTile: (tileId: number) => void
  readonly messages: Messages
}

/**
 * The board, and the one piece of animation that is load-bearing rather than decorative.
 *
 * Reveal order gates which words are spellable at all, so following a letter through the
 * shuffle is the core skill of the game. The shuffle therefore has to be watchable: tiles
 * travel from their old slot to their new one using FLIP (measure, invert, play) rather than
 * teleporting.
 */
export function Board({
  state,
  portrait,
  concealed,
  hiding,
  onTapTile,
  messages,
}: BoardProps): React.JSX.Element {
  const columns = columnsFor(state.config.n, portrait)
  const nodes = useRef(new Map<number, HTMLButtonElement>())
  const boxes = useRef(new Map<number, DOMRect>())

  const layout = state.tiles.map((tile) => tile.position).join(',')

  useLayoutEffect(() => {
    const previous = boxes.current
    const next = new Map<number, DOMRect>()
    const moves: { node: HTMLButtonElement; dx: number; dy: number }[] = []

    for (const [id, node] of nodes.current) {
      const box = node.getBoundingClientRect()
      next.set(id, box)
      const was = previous.get(id)
      if (!was) continue
      const dx = was.left - box.left
      const dy = was.top - box.top
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) moves.push({ node, dx, dy })
    }
    boxes.current = next
    if (moves.length === 0) return

    for (const { node, dx, dy } of moves) {
      node.style.transition = 'none'
      node.style.transform = `translate(${String(dx)}px, ${String(dy)}px)`
    }
    // Next frame, release the inverse transform and let the transition carry each tile home.
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

  const ordered = [...state.tiles].sort((a, b) => a.position - b.position)

  return (
    <div
      className="board"
      // Reading order is the whole game, so the grid runs the way the language does. CSS grid
      // does the rest: `direction` decides which corner auto-placement starts from, so tile
      // one is top-left in English and top-right in Hebrew with nothing else to say.
      dir={alphabetFor(state.config.language).direction}
      style={{
        ['--cols' as string]: String(columns),
        ['--rows' as string]: String(rowsFor(state.config.n, columns)),
        // The stylesheet times the flip-back off this, so the latch in `App` and the animation
        // cannot drift apart.
        ['--hide-ms' as string]: `${String(HIDE_MS)}ms`,
      }}
      aria-label={format(messages.boardOfTiles, { n: state.config.n })}
    >
      {ordered.map((tile) => (
        <TileButton
          key={tile.id}
          tile={tile}
          concealed={concealed}
          hiding={tile.id === hiding}
          messages={messages}
          order={state.selection.indexOf(tile.id)}
          onTap={onTapTile}
          register={(node) => {
            if (node) nodes.current.set(tile.id, node)
            else nodes.current.delete(tile.id)
          }}
        />
      ))}
    </div>
  )
}

interface TileProps {
  readonly tile: Tile
  readonly concealed: boolean
  /** This tile is the one that just turned back over. */
  readonly hiding: boolean
  /** Index in the current word, or -1 when unselected. */
  readonly order: number
  readonly onTap: (tileId: number) => void
  readonly register: (node: HTMLButtonElement | null) => void
  readonly messages: Messages
}

function TileButton({
  tile,
  concealed,
  hiding,
  order,
  onTap,
  register,
  messages,
}: TileProps): React.JSX.Element {
  const showing = tile.revealed && !concealed
  const selected = order >= 0
  const classes = ['tile']
  if (showing) classes.push('is-up')
  // Only while face up. A wild that announced itself face down would leak which tile it was.
  if (showing && tile.wild) classes.push('is-wild')
  if (tile.spent) classes.push('is-spent')
  if (selected) classes.push('is-selected')
  if (hiding) classes.push('is-hiding')

  const label = concealed
    ? messages.hiddenWhilePaused
    : tile.spent
      ? messages.spentTile
      : tile.revealed
        ? tile.wild
          ? selected
            ? format(messages.letterInWord, { letter: messages.wildCard, position: order + 1 })
            : messages.wildCard
          : selected
            ? format(messages.letterInWord, { letter: tile.letter, position: order + 1 })
            : tile.letter
        : messages.faceDown

  return (
    <button
      ref={register}
      type="button"
      className={classes.join(' ')}
      onClick={() => {
        onTap(tile.id)
      }}
      disabled={!showing || tile.spent}
      aria-label={label}
    >
      <span className="tile-inner">
        <span className="tile-face tile-back" aria-hidden="true" />
        <span className="tile-face tile-front">
          {/* The letter is rendered only while the tile is face up. Hiding it with a 3D
              transform would still leave it in the DOM, where devtools or a screen reader
              would happily read out the whole concealed board. */}
          {/* A card, not the letter underneath, and not a blank: a blank is indistinguishable
              from a tile that has not turned yet, which is the one thing the board must never be
              ambiguous about. The letter it is masking stays out of the DOM for the same reason
              the face-down letters do. */}
          {showing ? (tile.wild ? WILD_GLYPH : tile.letter) : ''}
          {selected ? <span className="tile-order">{order + 1}</span> : null}
        </span>
      </span>
    </button>
  )
}
