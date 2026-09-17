import { useRef } from 'react'
import { Icon } from './Icon.js'
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
  play = false,
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
  /**
   * Whether the mark deals itself rather than standing still.
   *
   * One page asks for it: the about page, where the wordmark's animation is the point rather than
   * decoration. Everywhere else a head is chrome above something somebody came to read, and a
   * nine-tile shuffle every time they open it would be a flourish charging rent.
   */
  readonly play?: boolean
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
          <Title mark still={!play} />
        </a>
      ) : (
        <button type="button" className="page-home" title={back} onClick={onHome}>
          <Title mark still={!play} />
        </button>
      )}

      {children === undefined ? null : <div className="page-tools">{children}</div>}

      {/*
       * The labelled way back as well as the mark, which is two ways home on purpose: the mark is
       * what everybody clicks without reading and the words are what somebody looks for when they
       * cannot find the way out.
       *
       * **A control rather than a hint.** It was dim text with a `←` in front of it, and Nick's
       * note was that it is "a very muted CTA ... too low-contrast to spot for normal human
       * beings, and there is no iconography". It now borrows the border, background and type of
       * `.how-to-play`, which is this app's shape for "press this to go somewhere", and carries a
       * drawn arrow. The glyph is an `Icon` rather than a character in the string, so no
       * translator has to keep it and it turns with `dir` rather than against it.
       */}
      {onHome === undefined ? null : (
        <button type="button" className="page-back" onClick={onHome}>
          <Icon name="back" />
          <span>{back}</span>
        </button>
      )}
    </header>
  )
}
