/**
 * Talking to the API, which until now the app has never done.
 *
 * Same origin, so the session is an ordinary cookie and there is no CORS anywhere: `/v1` is
 * routed to the API by the same proxy that serves the game. That is why `credentials` has to be
 * set at all — `fetch` omits cookies on same-origin requests only when nobody says otherwise, and
 * a sign-in that does not carry its own cookie back is a sign-in that never sticks.
 */

export interface Account {
  readonly userId: string
  readonly username: string
}

/**
 * What a sign-in step did, from the client's point of view.
 *
 * The server deliberately says the same thing for a wrong code, an expired one, one already
 * spent, and an address that was never sent one — so there is one failure here rather than four,
 * and the wording the player sees cannot accidentally become a membership oracle.
 */
export type SignInResult = 'sent' | 'signed-in' | 'bad-email' | 'bad-code' | 'unavailable'

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
  try {
    const response = await fetch('/v1/me', { credentials: 'same-origin' })
    if (!response.ok) return null
    return (await response.json()) as Account
  } catch {
    return null
  }
}
