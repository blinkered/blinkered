import { isNativeApp } from './platform.js'

/**
 * Pinning the viewport in the native shell, and only there.
 *
 * Three things zoom a page on iOS and they need three different answers. A focused field whose
 * text is under 16px zooms the whole page in and never back out --- that is font size, and
 * `styles.css` now puts a floor under every field rather than under three named ones. A
 * double-tap zooms too --- that is `touch-action: manipulation` on the root. What is left is a
 * deliberate pinch, and only the viewport meta can refuse that one.
 *
 * **Refused in the app and allowed on the web**, which is not a hedge. Pinch-zoom on a web page
 * is how plenty of people read, and taking it away is a WCAG 1.4.4 failure on a site that has a
 * high-contrast theme precisely because it takes that seriously. An installed app is a different
 * thing: it has no address bar, so a zoom nobody meant is a zoom with no obvious way back, and
 * Nick found exactly that --- "double-tapping the screen anywhere zooms back out ... but most
 * users aren't going to know that."
 *
 * Written from here rather than into `index.html`, because the tag there is the web's and this is
 * the one difference the shell needs. `viewport-fit=cover` is carried over deliberately: the game
 * draws under the notch and pads itself with `env(safe-area-inset-*)`, and dropping it would put
 * the board under the clock.
 */
const PINNED =
  'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'

export function pinViewportInShell(): void {
  if (!isNativeApp()) return
  const tag = document.querySelector('meta[name="viewport"]')
  tag?.setAttribute('content', PINNED)
}
