import type { Messages } from '@blinkered/i18n'
import { PageHead } from './PageHead.js'

/**
 * Who made this, and why it exists at all.
 *
 * **The prose is English and stays English.** Everything else the game says is in fifty-one
 * languages, and this page is the one place where that would be wrong: it is one person's account
 * of a shower thought, with his name and his address in it, and putting a machine translation of
 * that in his mouth is not localisation. The chrome around it -- the heading, the way back, the
 * two links that lead here -- is localised like every other page.
 *
 * **The wordmark plays here**, and it is the head's own mark that does it rather than a second
 * copy in the body -- which is what the first version had, and Nick's note was exactly that: "the
 * request was to animate the wordmark at the top, not to have a second wordmark". The title bar's
 * copy stands still on a phone, because a shuffle of nine tiles is silly when the row has space
 * for one of them; this page has the width and nothing competing for attention, which is the one
 * place the animation is the point.
 */
export function AboutPage({
  messages,
  onHome,
}: {
  readonly messages: Messages
  readonly onHome: () => void
}): React.JSX.Element {
  return (
    <section className="about-page" aria-labelledby="about-title">
      <PageHead back={messages.backToGame} onHome={onHome} play />

      <h1 className="page-title" id="about-title">
        {messages.about}
      </h1>

      <p>
        Blinkered started out as a shower thought: what if you combined the nerdy fun of the New
        York Times&rsquo; Spelling Bee with the countdown clock stress of Bejeweled? And what if you
        didn&rsquo;t know when each letter would be available?
      </p>

      <p>
        Brought to life with ☕ and{' '}
        <a href="https://claude.com/" target="_blank" rel="noreferrer">
          Claude Code
        </a>{' '}
        in the mountains of Western Maine ⛰ 🎣 🍁 🎿. We hope you enjoy it!
      </p>

      {/*
        The two marks, in the corner of the internet each belongs to.

        GitHub's is its own mark, drawn inline for the same reason `Icon.tsx` draws the rest:
        `currentColor` follows the palette, where a PNG would be black on the light theme and
        black on the dark one. The Tight Line link is text until the artwork arrives, at which
        point it is an `<img>` here and a width in `.about-marks` and nothing else.
      */}
      <div className="about-marks">
        <a
          className="about-link"
          href="https://github.com/blinkered/blinkered"
          target="_blank"
          rel="noreferrer"
          aria-label="Blinkered on GitHub"
        >
          <svg viewBox="0 0 16 16" width="28" height="28" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A7.995 7.995 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
        </a>
        <a
          className="about-link about-tightline"
          href="https://www.tightlinesoftware.com"
          target="_blank"
          rel="noreferrer"
        >
          {/*
            The mark, in the variant the palette calls for -- there are two, drawn for a dark
            ground and a light one, and the stylesheet picks. A background image rather than an
            `<img>` so that choice stays in CSS beside the palettes; `role="img"` with a label is
            what keeps it in the accessibility tree.
          */}
          <span className="tightline-mark" role="img" aria-label="Tight Line Software" />
        </a>
      </div>
    </section>
  )
}
