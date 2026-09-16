/**
 * Talking to `/v1/admin`, which is the one part of the API written for us rather than for players.
 *
 * Its own module rather than more functions in `account.ts`, and the reason is the same one the
 * server gives for making `AdminStore` a third port: everything in `account.ts` is scoped to the
 * person asking, and everything here reads across everybody. Two files make that visible.
 *
 * Unlike `account.ts`, these do **not** all collapse failure into null. A moderation screen has
 * to be able to tell "there is nothing here" from "you are not allowed" from "the server did not
 * answer": the first is a finished job, the second is a bug in what the menu offered, and the
 * third is a reason to try again. One null for all three would make the panel lie about at least
 * two of them.
 */

/** One way somebody signs in. The address is here; it is nowhere else in the API. */
export interface AdminIdentity {
  readonly provider: string
  readonly email: string | null
  readonly emailVerified: boolean
  readonly createdAt: string
}

/** A person, as somebody moderating them sees them. Dates are strings; JSON has none. */
export interface AdminUser {
  readonly userId: string
  readonly username: string
  readonly avatarSeed: string
  readonly country: string | null
  readonly uiLanguage: string | null
  readonly gameLanguage: string | null
  readonly bio: string | null
  readonly isAdmin: boolean
  readonly createdAt: string
  /** When an admin banned them, or null. A ban is reversible and keeps the row. */
  readonly bannedAt: string | null
  readonly games: number
  readonly identities: readonly AdminIdentity[]
}

/** A game, with the three columns that say why it is or is not on a board. */
export interface AdminGame {
  readonly id: string
  readonly language: string
  readonly difficulty: string
  readonly canonical: boolean
  readonly speedMultiplier: number
  readonly score: number
  readonly words: number
  readonly rounds: number
  readonly engineVersion: string
  readonly finishedAt: string
  readonly hidden: boolean
  readonly imported: boolean
  readonly leaderboardEligible: boolean
  readonly owner: { readonly userId: string; readonly username: string }
}

/** Somebody objecting to something. Both ends are nullable because the columns are. */
export interface AdminReport {
  readonly id: string
  readonly field: string
  readonly reason: string | null
  readonly createdAt: string
  readonly resolvedAt: string | null
  readonly reporter: { readonly userId: string; readonly username: string } | null
  readonly subjectUser: { readonly userId: string; readonly username: string } | null
  readonly subjectGame: { readonly id: string; readonly score: number } | null
}

/**
 * What a request did, with the failures kept apart.
 *
 * `forbidden` covers 401 and 403 together, which is the one place two server answers are merged:
 * the panel's response to both is the same -- stop showing it -- and it is reached by a menu item
 * that only appears for an admin, so distinguishing them would be distinguishing two bugs.
 */
export interface Failure {
  readonly ok: false
  readonly why: 'forbidden' | 'missing' | 'taken' | 'refused' | 'offline'
  /**
   * Which field the server refused and what it said about it, when it said anything.
   *
   * Carried rather than collapsed into `refused`, because the rename is the point of this screen
   * and "the server refused that" is not an answer somebody can act on. The server already
   * distinguishes `reserved` from `mixed-scripts` from `bad-edges`; throwing that away and then
   * asking an admin to guess would make the one screen that exists to fix a name the screen that
   * cannot say why a name is wrong.
   */
  readonly field?: string
  readonly problem?: string
}

export type Answer<T> = { readonly ok: true; readonly value: T } | Failure

/** Which games a listing wants. Absent means "do not filter on it", as it does on the server. */
export interface GameQuery {
  readonly language?: string
  readonly difficulty?: string
  readonly hidden?: boolean
  readonly user?: string
}

/** A change to somebody's account. Absent leaves a field alone; null clears it. */
export interface AdminEdit {
  readonly username?: string
  readonly country?: string | null
  readonly bio?: string | null
  readonly isAdmin?: boolean
}

export async function findUsers(search: string): Promise<Answer<readonly AdminUser[]>> {
  const found = await ask<{ users: readonly AdminUser[] }>(
    `admin/users?q=${encodeURIComponent(search)}`,
  )
  return unwrap(found, (body) => body.users)
}

export async function readUser(userId: string): Promise<Answer<AdminUser>> {
  return ask<AdminUser>(`admin/users/${encodeURIComponent(userId)}`)
}

export async function editUser(userId: string, edit: AdminEdit): Promise<Answer<AdminUser>> {
  return ask<AdminUser>(`admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: edit,
  })
}

/**
 * Bans an account, or lifts the ban.
 *
 * One function for both directions, because they are one column. `POST` either way: this used to
 * be a `DELETE`, which read as erasure and is not what it does -- the row stays, reversibly.
 * Deleting an account is `DELETE /v1/me`, which somebody does to their own.
 */
export async function banUser(userId: string, banned: boolean): Promise<Answer<null>> {
  const path = encodeURIComponent(userId)
  const answer = await ask<unknown>(`admin/users/${path}/${banned ? 'ban' : 'unban'}`, {
    method: 'POST',
    body: {},
  })
  return unwrap(answer, () => null)
}

export async function findGames(query: GameQuery = {}): Promise<Answer<readonly AdminGame[]>> {
  const asked = new URLSearchParams()
  if (query.language !== undefined) asked.set('language', query.language)
  if (query.difficulty !== undefined) asked.set('difficulty', query.difficulty)
  if (query.hidden !== undefined) asked.set('hidden', String(query.hidden))
  if (query.user !== undefined) asked.set('user', query.user)
  const found = await ask<{ games: readonly AdminGame[] }>(`admin/games?${asked.toString()}`)
  return unwrap(found, (body) => body.games)
}

export async function hideGame(gameId: string, hidden: boolean): Promise<Answer<null>> {
  const answer = await ask<unknown>(`admin/games/${encodeURIComponent(gameId)}`, {
    method: 'PATCH',
    body: { hidden },
  })
  return unwrap(answer, () => null)
}

export async function findReports(openOnly: boolean): Promise<Answer<readonly AdminReport[]>> {
  const found = await ask<{ reports: readonly AdminReport[] }>(
    `admin/reports?state=${openOnly ? 'open' : 'all'}`,
  )
  return unwrap(found, (body) => body.reports)
}

export async function resolveReport(id: string, resolved: boolean): Promise<Answer<null>> {
  const answer = await ask<unknown>(`admin/reports/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { resolved },
  })
  return unwrap(answer, () => null)
}

/**
 * One request, and one place that decides what a status code means here.
 *
 * The two 409s have to be told apart, and getting that wrong was worth recording: a lost rename
 * and a refusal to touch your own account are both conflicts, and reading every 409 as the first
 * one made "you cannot do that to yourself" come out as "somebody already has that name". The
 * body says which, so the body is read.
 */
async function ask<T>(
  path: string,
  sending: { method?: string; body?: unknown } = {},
): Promise<Answer<T>> {
  try {
    const response = await fetch(`/v1/${path}`, {
      method: sending.method ?? 'GET',
      credentials: 'same-origin',
      ...(sending.body === undefined
        ? {}
        : {
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(sending.body),
          }),
    })
    if (response.ok) return { ok: true, value: (await response.json()) as T }
    if (response.status === 401 || response.status === 403) return { ok: false, why: 'forbidden' }
    if (response.status === 404) return { ok: false, why: 'missing' }
    if (response.status === 409) {
      const said = (await response.json().catch(() => ({}))) as { error?: unknown }
      if (said.error === 'not-yourself') {
        return { ok: false, why: 'refused', problem: 'not-yourself' }
      }
      return { ok: false, why: 'taken' }
    }
    if (response.status === 400) {
      // The server names the field and the fault. Read as unknown and checked, because a 400
      // body is still a body somebody else wrote.
      const said = (await response.json().catch(() => ({}))) as {
        field?: unknown
        problem?: unknown
      }
      return {
        ok: false,
        why: 'refused',
        ...(typeof said.field === 'string' ? { field: said.field } : {}),
        ...(typeof said.problem === 'string' ? { problem: said.problem } : {}),
      }
    }
    return { ok: false, why: 'refused' }
  } catch {
    // Offline, or no API at all. A different thing from being refused, and worth saying so: one
    // is worth retrying and the other is not.
    return { ok: false, why: 'offline' }
  }
}

/** Maps the value inside an answer, leaving every failure exactly as it was. */
function unwrap<T, U>(answer: Answer<T>, take: (value: T) => U): Answer<U> {
  return answer.ok ? { ok: true, value: take(answer.value) } : answer
}

/**
 * The server's own words for a refused field, in ours.
 *
 * The same tags `AccountScreen` translates for a player, said once here in English. Kept as a
 * lookup rather than a switch so an unfamiliar tag falls through to the sentence below rather
 * than to nothing: the server is free to add one, and a panel that went silent about a refusal
 * it did not recognise would be worse than a vague panel.
 */
const REFUSALS: Readonly<Record<string, string>> = {
  'too-short': 'Too short.',
  'too-long': 'Too long.',
  'bad-characters': 'Letters, digits, hyphens and underscores only.',
  'bad-edges': 'It has to start and end with a letter or a digit.',
  'mixed-scripts': 'One alphabet at a time. That mixes two, which is how impersonation works.',
  reserved: 'That is the shape the game hands out to new accounts. Nobody may claim one.',
  taken: 'Somebody already has that name.',
  'has-link': 'Links are not allowed in a bio.',
  'has-control': 'That contains characters a bio cannot hold.',
  'not-a-country': 'That is not an ISO 3166-1 country code.',
  'not-a-language': 'That is not a language tag.',
  'not-a-boolean': 'That has to be true or false.',
  'not-an-object': 'The server could not read the request at all.',
  /*
   * The server's guard, which the panel also declines to offer: the buttons are not drawn on your
   * own account. This is here for the case where it happens anyway -- two tabs, one of them
   * looking at a stale listing -- because a refusal with no words is worse than a wrong button.
   */
  'not-yourself': 'Not on your own account. Another admin has to do that one.',
}

/**
 * Why a request failed, in words.
 *
 * English, like the whole panel. The rest of the interface goes through `@blinkered/i18n` in
 * fifty-one languages and this deliberately does not: it is an internal tool with one audience,
 * and putting forty strings nobody outside the project will read into fifty-one locale files
 * would be a cost paid on every future admin string for no reader.
 *
 * Takes the whole failure rather than its `why`, so a refused field can say which field and
 * what was wrong with it. That is the difference between "the server refused that" and "that is
 * the shape the game hands out", and on a screen for fixing names it is the whole difference.
 */
export function trouble(failure: Failure): string {
  switch (failure.why) {
    case 'forbidden':
      return 'Not allowed. Sign in again, or this account is no longer an admin.'
    case 'missing':
      return 'That is not there any more.'
    case 'taken':
      return 'Somebody already has that name.'
    case 'offline':
      return 'Could not reach the server.'
    case 'refused': {
      const said = failure.problem === undefined ? undefined : REFUSALS[failure.problem]
      if (said === undefined) return 'The server refused that.'
      // The field, because `too-long` is a thing the server says about a name and about a bio.
      return failure.field === undefined ? said : `${failure.field}: ${said}`
    }
  }
}
