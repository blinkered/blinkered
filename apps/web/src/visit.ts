/**
 * Facts that last a visit rather than a lifetime.
 *
 * `sessionStorage`, which is the only store with the right lifetime for "not now": it survives a
 * reload and a navigation away and back in the same tab, and it goes when the tab closes. A
 * setting in `localStorage` would outlive the visit and a `useState` does not outlive a reload.
 *
 * The distinction exists because of a bug in each direction. The tour's "close without ticking
 * the box" was React state, so **signing in with Google reopened the tour**: that round trip is a
 * full page navigation, the state went with the page, and somebody who had already dismissed the
 * tour and then signed in to keep a game landed back on the first screen of it. Making it a
 * setting instead would be the opposite error -- "not now" and "never again" are different
 * answers, and only the checkbox means the second.
 *
 * `reportDraft.ts` reaches for the same store for the same reason: it is the half-written report
 * surviving the same provider round trip.
 */

const TOUR = 'blinkered.tour-dismissed.v1'

/** Whether the tour has been closed during this visit. */
export function tourDismissed(): boolean {
  try {
    return sessionStorage.getItem(TOUR) === 'yes'
  } catch {
    // Private browsing and blocked storage both land here. Forgetting means the tour may open
    // once more, which is a far better failure than a tour that cannot be closed.
    return false
  }
}

/** Remembers that it was closed, for as long as this tab is open. */
export function dismissTour(): void {
  try {
    sessionStorage.setItem(TOUR, 'yes')
  } catch {
    /* See `tourDismissed`. */
  }
}
