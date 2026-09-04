/**
 * The picture that stands for an account.
 *
 * Geometric and generated, never uploaded. docs/ACCOUNTS.md takes that decision and gives the
 * reason: there is nothing hosted, so there is nothing to moderate, no report queue for images,
 * no appeals, and nothing to explain to a store reviewer. It is a smaller thing than a photograph
 * and it is meant to be.
 *
 * Deterministic from `avatarSeed`, so the same account is the same picture on every device
 * without a byte being stored to make it so, and inline SVG, so there is no dependency and no
 * second request. Coarse on purpose: five cells across, because the place it has to work is 28
 * pixels in the title bar, and anything finer is a smudge there.
 *
 * Initials on a colour was the alternative and loses for one reason worth keeping written down:
 * a generated name like `clever-beacon-1267` gives `CB`, and the whole point of the picture is to
 * be the thing you recognise when the name is one you did not choose.
 */

/** Cells across, and down. Odd, so there is a middle column to mirror around. */
const GRID = 5
const HALF = Math.ceil(GRID / 2)

/**
 * Two independent 32-bit lanes over the seed.
 *
 * One hash would have to serve both the pattern and the colour, and slicing bits out of a single
 * FNV lane correlates them: names hashing near each other get both a similar shape and a similar
 * hue, which is exactly the collision the picture exists to prevent. The words pipeline already
 * uses two lanes for its digest, for the same reason.
 */
function lanes(seed: string): readonly [number, number] {
  let shape = 0x811c9dc5
  let hue = 0x9e3779b1
  for (let at = 0; at < seed.length; at += 1) {
    const code = seed.charCodeAt(at)
    shape = Math.imul(shape ^ code, 0x01000193) >>> 0
    hue = Math.imul(hue ^ code, 0x85ebca6b) >>> 0
  }
  return [shape, hue]
}

/**
 * Which cells are filled, mirrored around the middle column.
 *
 * Symmetry is what makes fifteen random bits read as an emblem rather than as noise, which is the
 * whole trick every identicon uses. Fifteen bits is 32,768 patterns; the hue carries the rest of
 * the distinctness.
 *
 * A pattern too sparse to see is redrawn from the same lane rather than left alone. An avatar of
 * one lit cell is a smudge at 28 pixels, and at one in a few thousand accounts it would be a bug
 * report rather than a curiosity.
 */
function cells(shape: number): readonly boolean[] {
  const bits = Array.from({ length: GRID * HALF }, (_, at) => ((shape >>> at) & 1) === 1)
  const lit = bits.filter(Boolean).length
  const filled = lit < 3 || lit > GRID * HALF - 3 ? bits.map((_, at) => at % 3 !== 0) : bits
  const grid: boolean[] = []
  for (let row = 0; row < GRID; row += 1) {
    for (let column = 0; column < GRID; column += 1) {
      // The mirror: column 3 reads column 1, column 4 reads column 0.
      const source = column < HALF ? column : GRID - 1 - column
      grid.push(filled[row * HALF + source] === true)
    }
  }
  return grid
}

export function Avatar({
  seed,
  size = 28,
  className,
}: {
  readonly seed: string
  /** Drawn size in pixels. 28 in the title bar, larger on the profile screen. */
  readonly size?: number
  readonly className?: string
}): React.JSX.Element {
  const [shape, hue] = lanes(seed)
  const angle = hue % 360
  const grid = cells(shape)

  return (
    <svg
      className={className === undefined ? 'avatar' : `avatar ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${String(GRID)} ${String(GRID)}`}
      // Decorative. The username is beside it in every place it appears, so naming the picture
      // would make a screen reader say the same person twice.
      aria-hidden="true"
      focusable="false"
    >
      {/* Both tones are the same hue, so the picture reads as one object rather than as a
          shape sitting on an unrelated square. Lightness rather than hue carries the contrast,
          which is what keeps it legible for the eight percent of players who cannot use hue. */}
      <rect width={GRID} height={GRID} fill={`hsl(${String(angle)} 38% 20%)`} />
      {grid.map((on, at) =>
        on ? (
          <rect
            key={at}
            x={at % GRID}
            y={Math.floor(at / GRID)}
            width={1}
            height={1}
            fill={`hsl(${String(angle)} 68% 62%)`}
          />
        ) : null,
      )}
    </svg>
  )
}
