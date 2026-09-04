/**
 * Talking to the API, which until accounts arrived the app had never done.
 *
 * Same origin, so the session is an ordinary cookie and there is no CORS anywhere: `/v1` is
 * routed to the API by the same proxy that serves the game. That is why `credentials` has to be
 * set at all — `fetch` omits cookies on same-origin requests only when nobody says otherwise, and
 * a sign-in that does not carry its own cookie back is a sign-in that never sticks.
 *
 * Every function here answers rather than throws. A build served without an API is still a game,
 * and a screen that refuses to render because it could not learn whether anybody is signed in
 * would be a poor trade for a feature nobody has to use.
 */

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
  readonly imported: boolean
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
  return fetch(`/v1/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // Same origin, and still stated: the default is `same-origin`, and relying on a default for
    // the thing the whole feature depends on is how it breaks the day something proxies it.
    credentials: 'same-origin',
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
    const response = await post('auth/code/verify', { email, code })
    if (response.ok) return 'signed-in'
    if (response.status === 400 || response.status === 401) return 'bad-code'
    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}

/**
 * Who the browser is, or null.
 *
 * Null for every way of being signed out, including the API not being there at all. A build
 * served without one is still a game, and a game that refuses to start because it could not find
 * out whether nobody is signed in would be a poor trade.
 */
export async function whoAmI(): Promise<Account | null> {
  return getting<Account>('me')
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
  try {
    await post('auth/signout', {})
  } catch {
    /* Nothing to do. The interface signs out regardless; see above. */
  }
}

/** Saves a profile edit, and hands back what the server stored rather than what was sent. */
export async function saveProfile(edit: ProfileEdit): Promise<SaveResult> {
  try {
    const response = await fetch('/v1/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(edit),
    })
    if (response.ok) return { ok: true, account: (await response.json()) as Account }
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
  readonly letters: readonly string[]
  readonly words: readonly string[]
  readonly rounds: number
  readonly dictionaryVersion?: string
}

/** Keeps a guest game. Null when it could not be kept, which the caller has to be able to say. */
export async function keepGame(game: GameToKeep): Promise<{ id: string; score: number } | null> {
  try {
    const response = await post('games/import', game)
    if (!response.ok) return null
    return (await response.json()) as { id: string; score: number }
  } catch {
    return null
  }
}

/** One GET, one shape of failure. Null covers signed out, refused, absent, and offline alike. */
async function getting<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`/v1/${path}`, { credentials: 'same-origin' })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}
