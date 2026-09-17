import { useRef } from 'react'
import { Title } from './Title.js'
import { useFitRow } from './fitRow.js'

/**
 * The same head on every page that is not the game.
 *
 * There were five of them. The rules page spelled "Blinkered" as plain text and put a Back
 * button under its own heading; the board page had a title and a text link; the account and
 * player pages had an avatar, a name and a button called something else again; the player page's
 * way home said "Play Blinkered" in English in all fifty-one languages. Nick asked the obvious
 * question -- "Any reason their nav bars don't all look effectively the same?" -- and there is
 * none. They were written one at a time, each solving its own way home.
 *
 * So all of them get this: the wordmark at the start, the page's own controls in the middle if it
 * has any, and one way back at the end. The mark is the same nine tiles the game draws, standing
 * still rather than dealing themselves, which is what makes these pages look like the game
 * instead of like a documentation site that happens to be the same colour.
 */
export function PageHead({
  back,
  onHome,
  children,
}: {
  /** The label on the way back, in the page's language. */
  readonly back: string
  /**
   * Where home is. Given, the mark and the label are buttons and this closes the page over the
   * game; omitted, the mark is a link to `/` -- which is the standalone rules page, a document
   * with no game behind it to go back to.
   */
  readonly onHome?: () => void
  /** The page's own controls, between the mark and the way back. */
  readonly children?: React.ReactNode
}): React.JSX.Element {
  /*
   * Measured on one line, the same way and by the same steps as the title bar: the wordmark is
   * nine tiles here too, and a page reached from a shared link is reached on a phone more often
   * than the game is.
   */
  const row = useRef<HTMLElement>(null)
  useFitRow(row, back)

  return (
    <header className="page-head" ref={row}>
      {onHome === undefined ? (
        <a className="page-home" href="/" title={back}>
          <Title still />
        </a>
      ) : (
        <button type="button" className="page-home" title={back} onClick={onHome}>
          <Title still />
        </button>
      )}

      {children === undefined ? null : <div className="page-tools">{children}</div>}

      {/*
       * The labelled way back as well as the mark, which is two ways home on purpose: the mark is
       * what everybody clicks without reading and the words are what somebody looks for when they
       * cannot find the way out. The arrow is in the markup rather than in the string, so no
       * translator has to carry it and no right-to-left locale has to flip it -- the row does
       * that, because `←` in a `dir="rtl"` page points the way out either way.
       */}
      {onHome === undefined ? null : (
        <button type="button" className="page-back" onClick={onHome}>
          ← {back}
        </button>
      )}
    </header>
  )
}
