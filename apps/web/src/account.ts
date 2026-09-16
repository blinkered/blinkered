/**
 * Talking to the API, which until accounts arrived the app had never done.
 *
 * Same origin **in a browser**, so the session is an ordinary cookie: `/v1` is routed to the API
 * by the same proxy that serves the game, and there is no CORS for it anywhere.
 *
 * The native shell is not same-origin and cannot be made to be. It is served from
 * `capacitor://localhost`, so a root-relative path resolves into the app bundle and the
 * `SameSite=Lax` cookie never travels. Where a request goes and what it carries is therefore
 * decided in exactly one place, `api.ts`, and every function here goes through `apiFetch`.
 * Nothing below this line knows which platform it is running on.
 *
 * Every function here answers rather than throws. A build served without an API is still a game,
 * and a screen that refuses to render because it could not learn whether anybody is signed in
 * would be a poor trade for a feature nobody has to use.
 */

import { apiFetch, forgetToken, rememberToken, wantsToken } from './api.js'
import { cached, forget, remember } from './identity.js'
import { queuedFor, settle } from './pendingGames.js'

/** A person, as the server describes them. The same shape `GET /v1/me` returns. */
export interface Account {
  readonly userId: string
  readonly username: string
  /** What the avatar is drawn from. Deterministic, so nothing about the picture is stored. */
  readonly avatarSeed: string
  readonly country: string | null
  readonly uiLanguage: string | null
  readonly gameLanguage: string | null
  readonly bio: string | null
  /**
   * Whether this person can moderate, which decides whether the menu has an Admin item.
   *
   * It decides what is *shown* and nothing else. Every route under `/v1/admin` reads the column
   * itself, so a browser that lies about this gets a menu item and a 403 behind it.
   */
  readonly isAdmin: boolean
}

/**
 * What a sign-in step did, from the client's point of view.
 *
 * The server deliberately says the same thing for a wrong code, an expired one, one already
 * spent, and an address that was never sent one — so there is one failure here rather than four,
 * and the wording the player sees cannot accidentally become a membership oracle.
 */
export type SignInResult = 'sent' | 'signed-in' | 'bad-email' | 'bad-code' | 'unavailable'

/** A game as My Games lists one. Dates arrive as strings, because JSON has no date. */
export interface PlayedGame {
  readonly id: string
  readonly language: string
  readonly difficulty: string
  readonly canonical: boolean
  /** Real seconds per tick, which is what turns a word's `tick` into a readable time. */
  readonly speedMultiplier: number
  readonly score: number
  readonly words: number
  readonly rounds: number
  readonly engineVersion: string
  readonly finishedAt: string
}

/** A profile edit. Absent leaves a field alone; null clears it. Mirrors the server's patch. */
export interface ProfileEdit {
  readonly username?: string
  readonly country?: string | null
  readonly uiLanguage?: string | null
  readonly gameLanguage?: string | null
  readonly bio?: string | null
}

export type SaveResult =
  | { readonly ok: true; readonly account: Account }
  /**
   * Which field was refused and why, in the server's own words: `username` and `taken`,
   * `bio` and `has-link`, and the rest. Both halves, because `too-long` is a thing that can be
   * said about either of them and a screen with one message per field has to know which one to
   * put it under. Passed through rather than translated here, so the screen holding the field
   * decides what to say about it.
   */
  | { readonly ok: false; readonly field: string | null; readonly problem: string }

async function post(path: string, body: unknown): Promise<Response> {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Asks for a code. 202 whoever the address belongs to; 400 only when it is not an address. */
export async function requestCode(email: string, locale: string): Promise<SignInResult> {
  try {
    const response = await post('auth/code', { email, locale })
    if (response.status === 202) return 'sent'
    if (response.status === 400) return 'bad-email'
    return 'unavailable'
  } catch {
    // Offline, or the API is not deployed. Either way the player needs to be told something
    // other than nothing, and it is not their address that is wrong.
    return 'unavailable'
  }
}

/** Spends a code. The cookie arrives on the response and the browser keeps it. */
export async function submitCode(email: string, code: string): Promise<SignInResult> {
  try {
    /*
     * `native` is what asks for a bearer token instead of a cookie, and the client asks rather
     * than the server sniffing a user agent: a guess would be wrong at the only moment that
     * matters, and a browser that asked would simply get the same credential in a header.
     */
    const response = await post('auth/code/verify', { email, code, native: wantsToken() })
    if (!response.ok) {
      return response.status === 400 || response.status === 401 ? 'bad-code' : 'unavailable'
    }
    if (wantsToken()) {
      const issued = (await response.json()) as { token?: unknown }
      // A shell that asked for a token and did not get one is signed in by nothing: there is no
      // cookie either. Reporting it rather than returning 'signed-in' is what stops the app
      // rendering an account it cannot authenticate a single request for.
      if (typeof issued.token !== 'string' || issued.token === '') return 'unavailable'
      rememberToken(issued.token)
    }
    return 'signed-in'
  } catch {
    return 'unavailable'
  }
}

/**
 * Who the browser is, and whether the question could be asked at all.
 *
 * **Three answers rather than two, because the third one is visible to a player.** This used to
 * return `Account | null`, with null meaning every way of not knowing: signed out, refused, API
 * absent, and no network. On the website that was fair, because a browser with no network has no
 * app to be signed in to. In the native shell the bundle is already on the device, so a player
 * can sit in "no network" for a whole game, and answering `null` there renders them as *signed
 * out* while their session is still perfectly good. They would report that as losing their
 * account, and they would be right to.
 *
 * So only a **401** means signed out, because only the server can know that. Anything else that
 * stops us finding out is `offline`, which carries the last account we were told about if there
 * is one. See `identity.ts`.
 */
export type Identity =
  | { readonly state: 'signed-in'; readonly account: Account }
  | { readonly state: 'signed-out' }
  /** The cached account, or null if this device has never seen one. */
  | { readonly state: 'offline'; readonly account: Account | null }

export async function whoAmI(): Promise<Identity> {
  try {
    const response = await apiFetch('me')
    // The one definite answer. `/v1/me` answers 401 `signed-out` and nothing else does.
    if (response.status === 401) {
      forget()
      return { state: 'signed-out' }
    }
    // A 500, a 502, or a build served with no API behind it. We did not learn that nobody is
    // signed in; we learned nothing, which is the same position as having no network.
    if (!response.ok) return { state: 'offline', account: cached() }
    const account = (await response.json()) as Account
    remember(account)
    return { state: 'signed-in', account }
  } catch {
    // No network, or a body that would not parse. Either way the question went unanswered.
    return { state: 'offline', account: cached() }
  }
}

/**
 * Ends the session, on the server as well as here.
 *
 * The server revokes rather than forgetting, so the token stops working rather than merely
 * stopping being presented — which is the difference that matters on a shared machine. This
 * resolves either way: a sign-out the network lost still has to sign the interface out, or
 * somebody who pressed it is left looking at a page that says they are still here.
 */
export async function signOut(): Promise<void> {
  // Before the request, not after, and regardless of how it goes. The interface signs out either
  // way, so a credential or a cache that outlived a lost request would sign the app back in on
  // the next load. The bearer token goes with it: in the shell that token *is* the session, and
  // a revoke whose request was lost would otherwise leave a working one on the device.
  forget()
  forgetToken()
  try {
    await post('auth/signout', {})
  } catch {
    /* Nothing to do. The interface signs out regardless; see above. */
  }
}

/** Saves a profile edit, and hands back what the server stored rather than what was sent. */
export async function saveProfile(edit: ProfileEdit): Promise<SaveResult> {
  try {
    const response = await apiFetch('me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(edit),
    })
    if (response.ok) {
      const account = (await response.json()) as Account
      // The server just described this person, so it is as good an answer as `whoAmI` gets. Not
      // caching it here would leave an offline device showing the name from before the rename.
      remember(account)
      return { ok: true, account }
    }
    if (response.status === 409) return { ok: false, field: 'username', problem: 'taken' }
    if (response.status === 400) {
      const said = (await response.json()) as { field?: unknown; problem?: unknown }
      return {
        ok: false,
        field: typeof said.field === 'string' ? said.field : null,
        problem: typeof said.problem === 'string' ? said.problem : 'unavailable',
      }
    }
    return { ok: false, field: null, problem: 'unavailable' }
  } catch {
    return { ok: false, field: null, problem: 'unavailable' }
  }
}

/**
 * Whether a name can be had, while somebody is still typing it.
 *
 * Advisory, and the server says so too: between this answer and the save, somebody else can take
 * it. What it buys is finding out before pressing the button rather than after.
 */
export async function checkName(
  name: string,
): Promise<{ available: boolean; problem: string | null } | null> {
  return getting(`usernames/${encodeURIComponent(name)}`)
}

/** The board as one round had it. */
export interface BoardAtRound {
  /** Tile faces in tile order, joined by a space. */
  readonly tiles: string
  /**
   * Slots showing as a wild that round, by position. Absent for none.
   *
   * Separate from the faces because a wild is a mask: the letter is still underneath and comes
   * back next round, so writing the card into the string would lose the board.
   */
  readonly wilds?: readonly number[]
}

/**
 * A person as a stranger sees them.
 *
 * Not `Account`, which is what you see of yourself. The two differ by little today and the
 * separate type is the point: whatever `Account` gains next is not automatically public.
 */
export interface PublicProfile {
  readonly userId: string
  readonly username: string
  readonly avatarSeed: string
  readonly country: string | null
  readonly bio: string | null
}

/** A word, with everything the engine knew about it when it was found. */
export interface PlayedWord {
  readonly word: string
  readonly tiles: number
  readonly points: number
  readonly round: number
  readonly flips: number
  readonly tick: number
  /** Absent for an ordinary word, which is almost all of them. */
  readonly wilds?: readonly number[]
}

/**
 * One game in full.
 *
 * `detail` can be null: the summary outlives the document, so a game whose words have been pruned
 * is still a game and still has a score. Nothing prunes yet, and a display that treated the
 * missing document as a missing game would make somebody's history shorter than it is.
 */
export interface PlayedGameDetail extends PlayedGame {
  /** Who played it. Always present: a game nobody has claimed is not shown at all. */
  readonly owner: PublicProfile
  readonly detail: {
    readonly boards: readonly BoardAtRound[]
    readonly words: readonly PlayedWord[]
  } | null
}

/**
 * One game, whole, whoever played it.
 *
 * Public: this is what a shared permalink resolves to. Null for a game that is not there, is
 * hidden, was never claimed, or whose owner is gone -- all of which are one answer on purpose.
 */
export async function gameDetail(id: string): Promise<PlayedGameDetail | null> {
  return getting(`games/${encodeURIComponent(id)}`)
}

/** Somebody's public profile, by name. Null for a name nobody has. */
export async function playerProfile(username: string): Promise<PublicProfile | null> {
  return getting(`users/${encodeURIComponent(username)}`)
}

/** What they have played. Null when the name is unknown or the server did not answer. */
export async function playerGames(username: string): Promise<readonly PlayedGame[] | null> {
  const answered = await getting<{ games: readonly PlayedGame[] }>(
    `users/${encodeURIComponent(username)}/games`,
  )
  return answered === null ? null : answered.games
}

/** Somebody's own games, newest first. Null when the question could not be asked. */
export async function myGames(): Promise<readonly PlayedGame[] | null> {
  const answered = await getting<{ games: readonly PlayedGame[] }>('me/games')
  return answered === null ? null : answered.games
}

/**
 * What the client sends to keep a game it played before signing up.
 *
 * No score. `wordScore` is a function of tile count and nothing else, so the words are
 * sufficient, and a number this side chose is never the number stored. See docs/ACCOUNTS.md,
 * "How a score is checked".
 */
export interface GameToKeep {
  readonly startedAt: number
  readonly finishedAt: number
  readonly seed: number
  readonly difficulty: string
  readonly source: 'web' | 'ios'
  readonly config: unknown
  /** The board each round had, with any wilds it was showing. */
  readonly boards: readonly BoardAtRound[]
  /**
   * Every word, with what the engine knew about it when it was found.
   *
   * No score and no tile count: `wordScore` is a function of tile count and nothing else, so the
   * words are sufficient and the server does its own arithmetic. See docs/ACCOUNTS.md.
   */
  readonly words: readonly {
    readonly word: string
    readonly round: number
    readonly flips: number
    readonly tick: number
    readonly wilds?: readonly number[]
  }[]
  readonly rounds: number
  readonly dictionaryVersion?: string
  /**
   * Whether nobody was signed in when this game **began**.
   *
   * Which is a different question from who is signed in now, and the only party that can answer
   * it is this one. It sets `games.imported`, whose meaning the schema states: a game brought in
   * from a browser's localStorage. A game played while signed in is not that, even though phase A
   * sends both through this same route.
   *
   * It is a claim, and it is allowed to be, for the reason docs/ACCOUNTS.md already gives about
   * scores in phase A: a personal history is a diary and nobody forges a diary. Nothing is
   * granted by it -- `leaderboard_eligible` is a separate column decided elsewhere, and false for
   * both kinds until the server issues seeds.
   */
  readonly guest: boolean
}

/**
 * What emptying the queue achieved.
 *
 * `stored` maps the client key of each game that reached the server to the id the server holds it
 * under, which is what a permalink needs. `left` is how many are still waiting, so a caller can
 * tell "all done" from "stopped early" without inspecting the queue again.
 */
export interface Drained {
  readonly stored: ReadonlyMap<string, string>
  readonly left: number
}

/**
 * Sends every queued game for this account, oldest first, and stops at the first sign of trouble.
 *
 * Replaces `keepGame`, which was one attempt at the moment a game ended and no attempt ever
 * again. This is safe to call as often as anything likes -- on a finished game, on regaining a
 * connection, on launch -- because the server dedupes on `clientKey` and a game already stored
 * comes back 200 with the id it already has.
 *
 * **Serial rather than parallel**, which is deliberate for a queue of up to two hundred whole
 * submissions: a phone that has just regained a flaky connection should not open two hundred
 * requests, and stopping at the first failure is only meaningful if there is a first.
 *
 * Three ways an entry leaves the queue, and the middle one is the one worth stating:
 *
 * - **Stored**, on a 200 or a 201. Both mean the server has it.
 * - **Refused for good**, on a 400. A submission the server calls `bad-game` will be called that
 *   identically forever, so it is dropped rather than retried: one unparseable game at the head
 *   of the queue would otherwise block every good game behind it, which turns one lost game into
 *   all of them.
 * - **Nothing yet**, on anything else. A 401 means the session ended, and a 5xx or a dead
 *   connection means the server could not be asked. Both leave the entry where it is and stop the
 *   drain, because whatever is wrong applies just as much to the next one.
 */
export async function drainGames(userId: string): Promise<Drained> {
  const stored = new Map<string, string>()
  const waiting = queuedFor(userId)
  for (const [at, entry] of waiting.entries()) {
    let response: Response
    try {
      response = await post('games/import', { ...entry.game, clientKey: entry.key })
    } catch {
      return { stored, left: waiting.length - at }
    }
    if (response.ok) {
      const kept = (await response.json()) as { id: string; score: number }
      stored.set(entry.key, kept.id)
      settle(entry.key)
      continue
    }
    if (response.status === 400) {
      settle(entry.key)
      continue
    }
    return { stored, left: waiting.length - at }
  }
  return { stored, left: 0 }
}

/** Which part of somebody is being objected to. Three, because there are three free surfaces. */
export type ReportField = 'username' | 'bio' | 'score'

/**
 * What filing a report did.
 *
 * `filed` and `already` are both successes, and the screen says the same thing about them: from
 * where the person is standing they reported it and it is reported. The distinction is here at
 * all because the server draws it, and swallowing it in the client would make a duplicate look
 * like a failure the next time somebody reads this.
 */
export type ReportResult = 'filed' | 'already' | 'signed-out' | 'no-subject' | 'unavailable'

/**
 * Objecting to a username, a bio, or a score.
 *
 * Behind the session on the server, so a signed-out reader gets `signed-out` and the dialog says
 * to sign in rather than pretending to have sent something.
 */
export async function report(objection: {
  field: ReportField
  username?: string
  gameId?: string
  reason?: string
}): Promise<ReportResult> {
  try {
    const response = await post('reports', objection)
    if (response.status === 201) return 'filed'
    if (response.ok) return 'already'
    if (response.status === 401) return 'signed-out'
    if (response.status === 404) return 'no-subject'
    // 409 is reporting yourself, which the interface does not offer, and 400 is a body this
    // function built. Both are bugs here rather than anything to tell the reader about.
    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}

/**
 * What deleting an account did, or why it did not.
 *
 * `no-address` is its own answer rather than folded into a failure, because it is the one the
 * reader can act on: an account with no confirmed address cannot be checked, and the screen has
 * to say so rather than looking broken.
 */
export type DeleteResult = 'deleted' | 'bad-code' | 'no-address' | 'signed-out' | 'unavailable'

/**
 * Asks for the six-digit code a deletion needs.
 *
 * The address comes from the account rather than from here: letting the client name where a
 * deletion code goes would be letting it name who confirms one. `locale` is sent because the
 * server cannot know it -- an account that has never set `uiLanguage` has none stored.
 *
 * 202 whether or not a code was really sent, matching the sign-in route, so this cannot be used
 * to find out anything. `no-address` is the one refusal worth passing through.
 */
export async function requestDeletionCode(locale: string): Promise<DeleteResult | 'sent'> {
  try {
    const response = await post('me/deletion-code', { locale })
    if (response.status === 202) return 'sent'
    if (response.status === 401) return 'signed-out'
    if (response.status === 409) return 'no-address'
    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}

/**
 * Deletes the account, for good.
 *
 * There is nothing to sign out of afterwards: the session row went with the account, so the
 * cookie it presented is already dead. The caller drops the account from the interface because
 * the interface is the only place it is still remembered.
 */
export async function deleteAccount(code: string): Promise<DeleteResult> {
  try {
    const response = await apiFetch('me', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (response.ok) return 'deleted'
    if (response.status === 400 || response.status === 401) {
      // 401 here is a refused code rather than a lost session, because the route checks the
      // session first and answers `signed-out` for that.
      const said = (await response.json().catch(() => ({}))) as { error?: unknown }
      return said.error === 'signed-out' ? 'signed-out' : 'bad-code'
    }
    if (response.status === 409) return 'no-address'
    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}

/** One GET, one shape of failure. Null covers signed out, refused, absent, and offline alike. */
async function getting<T>(path: string): Promise<T | null> {
  try {
    const response = await apiFetch(path)
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}
