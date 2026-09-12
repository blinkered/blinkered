/**
 * Where in the app the address bar points, which until now was only ever "the game".
 *
 * Two shapes, and they are the two things worth linking to:
 *
 *   /g/<id>        one finished game
 *   /u/<username>  one player
 *
 * A game id rather than anything prettier, because a game permalink is the link that gets
 * shared and it must not rot. A username in the other, because a profile link is read by people
 * and `/u/trout` is worth more than a base64 id -- at the price that renaming somebody breaks
 * their old links, which is the ordinary contract everywhere else on the web and is the right
 * side of the trade when the durable link is the other one.
 *
 * Paths rather than query parameters, so the links look like links. That needs nginx to answer
 * these two prefixes with `index.html`, and deploy/nginx.shared.conf does it for exactly these
 * two and nothing else: a blanket fallback is what made a missing word list parse as HTML once,
 * and the comment there refusing one is still right.
 */

export type Route =
  | { readonly at: 'game' }
  | { readonly at: 'played-game'; readonly id: string }
  | { readonly at: 'player'; readonly username: string }

/** Reads a path. Anything unrecognised is the game, which is what `/` has always been. */
export function routeOf(pathname: string): Route {
  const parts = pathname.split('/').filter((part) => part !== '')
  const [prefix, value] = parts
  if (parts.length === 2 && value !== undefined && value !== '') {
    if (prefix === 'g') return { at: 'played-game', id: decodeURIComponent(value) }
    if (prefix === 'u') return { at: 'player', username: decodeURIComponent(value) }
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
    case 'game':
      return '/'
  }
}

/**
 * The absolute form, for sharing.
 *
 * Built from the page's own origin rather than a constant, so a link copied on the dev host
 * points at the dev host. The share *text* still names playblinkered.com when there is no game
 * to link to; that one is an advertisement rather than a location.
 */
export function urlOf(route: Route): string {
  return new URL(pathOf(route), globalThis.location.origin).toString()
}

/** Moves without reloading, and leaves a history entry so Back works. */
export function goTo(route: Route): void {
  globalThis.history.pushState(null, '', pathOf(route))
  globalThis.dispatchEvent(new PopStateEvent('popstate'))
}
