import { NATIVE_API_ORIGIN } from './api.js'
import { isNativeApp } from './platform.js'

/**
 * Where in the app the address bar points, which until now was only ever "the game".
 *
 * Three shapes. Two of them are the things worth linking to:
 *
 *   /g/<id>        one finished game
 *   /u/<username>  one player
 *   /admin         moderation, which is not worth linking to and has an address anyway
 *   /about         who made this
 *
 * A game id rather than anything prettier, because a game permalink is the link that gets
 * shared and it must not rot. A username in the other, because a profile link is read by people
 * and `/u/trout` is worth more than a base64 id -- at the price that renaming somebody breaks
 * their old links, which is the ordinary contract everywhere else on the web and is the right
 * side of the trade when the durable link is the other one.
 *
 * Paths rather than query parameters, so the links look like links. That needs nginx to answer
 * these with `index.html`, and deploy/nginx.shared.conf does it for exactly these three and
 * nothing else -- the two prefixes as prefixes, and `/admin` as an exact match so it cannot grow
 * to swallow a neighbour. A blanket fallback is what made a missing word list parse as HTML once,
 * and the comment there refusing one is still right.
 */

export type Route =
  | { readonly at: 'game' }
  | { readonly at: 'played-game'; readonly id: string }
  | { readonly at: 'player'; readonly username: string }
  /**
   * Moderation.
   *
   * An address rather than only a menu item, for two reasons that have nothing to do with
   * sharing a link. It survives a reload, which matters on the screen somebody works in for
   * twenty minutes at a time; and it is what lets the panel be reached at all in a tab that
   * was opened straight onto it.
   *
   * It grants nothing. The menu item appears for an admin and the panel is drawn for one, but
   * every route under `/v1/admin` reads the column itself, so typing this address signed out
   * gets an empty panel full of refusals.
   */
  | { readonly at: 'admin' }
  /**
   * One board, by language and difficulty: `/l/en/insane`.
   *
   * Both parts are in the address rather than in state, which is the point of it being an
   * address at all: a board is the most shareable thing the game has, and "look at the Finnish
   * insane board" has to survive being pasted. It also makes the selectors navigation rather
   * than filtering, so Back works through them.
   *
   * Not validated here. `routeOf` reads addresses and does not know which languages exist;
   * the server answers 404 for a board that is not one, and the screen says so.
   */
  | { readonly at: 'board'; readonly language: string; readonly difficulty: string }
  /**
   * Who made this and why: `/about`.
   *
   * An address rather than a dialog, because it is the one page somebody might actually want to
   * send to a person -- and because the two links on it point outward, which a modal makes
   * awkward. Exact, like `/admin`, so it cannot grow to swallow a neighbour.
   */
  | { readonly at: 'about' }

/** Reads a path. Anything unrecognised is the game, which is what `/` has always been. */
export function routeOf(pathname: string): Route {
  const parts = pathname.split('/').filter((part) => part !== '')
  const [prefix, value] = parts
  if (parts.length === 1 && prefix === 'admin') return { at: 'admin' }
  if (parts.length === 1 && prefix === 'about') return { at: 'about' }
  if (parts.length === 2 && value !== undefined && value !== '') {
    if (prefix === 'g') return { at: 'played-game', id: decodeURIComponent(value) }
    if (prefix === 'u') return { at: 'player', username: decodeURIComponent(value) }
  }
  // Three parts, and both of the last two have to be there: `/l/en` is not half a board, it is
  // an address this app does not have, and the game is what every such address has always been.
  if (parts.length === 3 && prefix === 'l') {
    const [, language, difficulty] = parts
    if (
      language !== undefined &&
      language !== '' &&
      difficulty !== undefined &&
      difficulty !== ''
    ) {
      return {
        at: 'board',
        language: decodeURIComponent(language),
        difficulty: decodeURIComponent(difficulty),
      }
    }
  }
  return { at: 'game' }
}

/** The path a route lives at, which is also what gets shared. */
export function pathOf(route: Route): string {
  switch (route.at) {
    case 'played-game':
      return `/g/${encodeURIComponent(route.id)}`
    case 'player':
      return `/u/${encodeURIComponent(route.username)}`
    case 'admin':
      return '/admin'
    case 'about':
      return '/about'
    case 'board':
      return `/l/${encodeURIComponent(route.language)}/${encodeURIComponent(route.difficulty)}`
    case 'game':
      return '/'
  }
}

/**
 * The absolute form, for sharing.
 *
 * The page's own origin on the web, so a link copied on the dev host points at the dev host and
 * a link copied in production points at production. The share *text* still names
 * playblinkered.com when there is no game to link to; that one is an advertisement rather than a
 * location.
 *
 * **Except in the native shell, where the page's origin is not a place.** Nick shared a game from
 * the app and Messages carried `capacitor://localhost/g/T7EZjIEcIz8` -- a scheme that means
 * something only inside the app that sent it, and nothing at all to whoever received it. The
 * shell is always the production app, so a link from it is always a production link.
 */
export function urlOf(route: Route): string {
  return new URL(pathOf(route), shareOrigin()).toString()
}

/** Where a shared link points. The site and the API are one origin, so `api.ts` owns the value. */
function shareOrigin(): string {
  return isNativeApp() ? NATIVE_API_ORIGIN : globalThis.location.origin
}

/**
 * Whether a click on an in-app link is ours to handle, rather than the browser's.
 *
 * A modified click or a middle click means "somewhere else": a new tab, a new window, a download.
 * Only the plain left click should move the page without loading it again. That matters most in
 * the native shell, where letting the anchor load the page reloads the whole webview and plays the
 * splash screen before the destination.
 */
export function isPlainClick(event: {
  readonly metaKey: boolean
  readonly ctrlKey: boolean
  readonly shiftKey: boolean
  readonly altKey: boolean
  readonly button: number
}): boolean {
  return !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0
}

/** Moves without reloading, and leaves a history entry so Back works. */
export function goTo(route: Route): void {
  globalThis.history.pushState(null, '', pathOf(route))
  globalThis.dispatchEvent(new PopStateEvent('popstate'))
}
