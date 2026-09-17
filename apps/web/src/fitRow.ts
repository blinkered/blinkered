import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Keeping a row of controls on one line by measuring it, rather than by guessing breakpoints.
 *
 * The title bar used to wrap. It has six things in it and, as the window narrows, they came off
 * the end one at a time and landed on a second and then a third row -- controls hopping between
 * lines and the account button ending up alone under the wordmark. Nick's words: "I wasn't
 * expecting nav elements to start hopping all over the screen and down to a second line. I was
 * expecting them to get narrow and *stay in the top header area at all times*."
 *
 * So the row never wraps and gives up detail instead, in a fixed order, and the order is applied
 * until the row fits. Which step that lands on cannot be written as a media query: the labels are
 * different lengths in fifty-one languages -- Sign in is "Iniciar sesión" in Spanish and the
 * wordmark is nine tiles wide in all of them -- and the signed-in state swaps a button for an
 * avatar. A breakpoint tuned in English is wrong in German. Measuring is right in every language
 * for the same twenty lines of code.
 *
 * The steps are written as words on a `data-fit` attribute, so the stylesheet reads
 * `[data-fit~='help']`, and they are cumulative: 'help' means the language label is gone as well.
 *
 * On the attribute rather than on `className` because React owns that one. It never rewrites an
 * attribute whose prop has not changed, so in practice a class would survive, but it would
 * survive by a rule about React's diffing rather than by design, and this row re-renders on every
 * flip of the wordmark's animation.
 */
const STEPS = ['lang', 'help', 'nerd', 'small', 'flag', 'mark', 'board'] as const

/**
 * A pixel of slack. `scrollWidth` and `clientWidth` are integers rounded from fractional layout,
 * so an exactly-fitting row reports a one-pixel overflow often enough to matter -- and paying a
 * whole step for a rounding error is how the medal would vanish on a screen it fits on.
 */
const SLACK = 1

function fits(row: HTMLElement): boolean {
  return row.scrollWidth <= row.clientWidth + SLACK
}

function apply(row: HTMLElement, steps: number): void {
  row.dataset.fit = STEPS.slice(0, steps).join(' ')
}

/**
 * @param row the row to keep on one line.
 * @param signature anything that changes what the row contains -- the language, whether there is
 * an account -- so it is measured again when the words in it are different ones.
 * @returns the steps in force, for the one caller that has to know rather than just be styled.
 * That is the wordmark: at the `mark` step it is a single tile, and a shuffle of nine letters that
 * ends by sliding one of them back where it started is silly rather than charming, so `Title` is
 * told to stand still instead. A width would have been the wrong trigger -- which step the row
 * lands on is different in every language.
 */
export function useFitRow(
  row: RefObject<HTMLElement | null>,
  signature: string,
): readonly string[] {
  const [taken, setTaken] = useState<readonly string[]>([])

  // Before the paint, not after it: a row that has not been measured yet is a row still holding
  // every label, and after a paint that is one frame of it hanging off the edge of the screen.
  useLayoutEffect(() => {
    const node = row.current
    if (node === null) return undefined

    /*
     * Into React only when the set changes, which is once or twice through a resize rather than on
     * every frame of one. A re-render does not re-measure -- the effect's dependencies have not
     * moved and neither has the row's box -- so this cannot drive itself.
     */
    const report = (steps: readonly string[]): void => {
      setTaken((held) => (held.join(' ') === steps.join(' ') ? held : steps))
    }

    const measure = (): void => {
      // Fewest steps that fit, from none upwards, so the row comes back as the window widens.
      for (let steps = 0; steps <= STEPS.length; steps += 1) {
        apply(node, steps)
        if (fits(node)) {
          report(STEPS.slice(0, steps))
          return
        }
      }
      report(STEPS)
    }

    measure()

    /*
     * The row's own box, which is the one that changes: taking a step never changes the row's
     * width -- it is a block in a column -- so this cannot drive itself in a loop.
     */
    const observer = new ResizeObserver(measure)
    observer.observe(node)

    /*
     * And once more when the fonts arrive. Every measurement before that is of fallback metrics,
     * which are narrower than the real ones often enough that the row would settle one step too
     * generous and then overflow when the real font paints.
     */
    document.fonts.ready.then(measure).catch(() => {
      // Nothing to do: the row is already measured against whatever is drawing it.
    })

    return () => {
      observer.disconnect()
    }
  }, [row, signature])

  return taken
}
