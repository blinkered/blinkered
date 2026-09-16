import { beforeEach, describe, expect, it } from 'vitest'
import { configFor } from '@blinkered/engine'
import { createApp } from '../src/app.js'
import type { AdminGame, AdminReport, AdminUser } from '../src/admin/types.js'
import { capturingMailer, fakeStore, makeAdmin } from './fake.js'
import type { FakeUser } from './fake.js'

/**
 * The moderation surface.
 *
 * What docs/ACCOUNTS.md asked for: an `is_admin` on `users` and a panel behind it that can delete
 * and modify accounts, curate leaderboards, and resolve the `reports` rows that had a table and
 * nothing reading them.
 *
 * Two properties are worth more than the rest and are asserted first: the gate is on every route
 * because of where the routes are, and nobody can hand themselves the flag.
 */

const JSON_HEADERS = { 'content-type': 'application/json' }
const CONFIG = configFor('medium', { language: 'en' })
const FACES = 'A B C D E F G H I J K L'

describe('the admin surface', () => {
  let store: ReturnType<typeof fakeStore>
  let mailer: ReturnType<typeof capturingMailer>
  let app: ReturnType<typeof createApp>
  let clock: Date
  /** The admin's cookie, and an ordinary player's. */
  let cookie: string
  let theirs: string
  let me: FakeUser
  let them: FakeUser

  const signIn = async (email: string): Promise<string> => {
    await app.request('/v1/auth/code', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email }),
    })
    const verified = await app.request('/v1/auth/code/verify', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, code: mailer.sent.at(-1)?.code }),
    })
    return (verified.headers.get('set-cookie') ?? '').split(';')[0] as string
  }

  const whoIs = async (session: string): Promise<FakeUser> => {
    const profile = (await (
      await app.request('/v1/me', { headers: { cookie: session } })
    ).json()) as { userId: string }
    const found = store.users.get(profile.userId)
    // A sign-in that produced no row is a broken fixture rather than a case to handle.
    if (found === undefined) throw new Error('signed in as nobody')
    return found
  }

  const get = async (
    path: string,
    headers: Record<string, string> = { cookie },
  ): Promise<Response> => app.request(path, { headers })

  const send = async (
    method: string,
    path: string,
    body: unknown,
    headers: Record<string, string> = { cookie },
  ): Promise<Response> =>
    app.request(path, {
      method,
      headers: { ...JSON_HEADERS, ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  /** A finished game belonging to whoever holds this cookie. */
  const keepGame = async (
    session: string,
    over: { score: number; language?: string; difficulty?: string; rounds?: number } = {
      score: 0,
    },
  ): Promise<string> => {
    // The server scores from the words rather than believing a number, so a score is made by
    // choosing words. THE pays 3, CABLE pays more: see `wordScore`.
    const words =
      over.score > 6
        ? [{ word: 'CABLE', round: 0, flips: 5, tick: 4 }]
        : [{ word: 'CAB', round: 0, flips: 3, tick: 4 }]
    const response = await app.request('/v1/games/import', {
      method: 'POST',
      headers: { ...JSON_HEADERS, cookie: session },
      body: JSON.stringify({
        startedAt: clock.getTime() - 60_000,
        finishedAt: clock.getTime(),
        seed: 7,
        difficulty: over.difficulty ?? 'medium',
        source: 'web',
        config: { ...CONFIG, language: over.language ?? 'en' },
        boards: [{ tiles: FACES }],
        words,
        rounds: over.rounds ?? 1,
        guest: false,
      }),
    })
    const { id } = (await response.json()) as { id: string }
    return id
  }

  beforeEach(async () => {
    store = fakeStore()
    mailer = capturingMailer()
    clock = new Date('2026-09-15T12:00:00Z')
    app = createApp({ auth: { store, mailer, now: () => clock, secureCookies: false } })

    theirs = await signIn('player@example.com')
    them = await whoIs(theirs)
    cookie = await signIn('nick@example.com')
    me = await whoIs(cookie)
    // By hand, which is the only way the first one is ever made: nothing in the auth flow writes
    // the column and the panel refuses to write it on the caller's own row.
    makeAdmin(store, me.userId)
  })

  describe('the gate', () => {
    /** Every route, so that one added later cannot be the one nobody checked. */
    const everything: [string, string][] = [
      ['GET', '/v1/admin/users'],
      ['GET', '/v1/admin/users/whoever'],
      ['PATCH', '/v1/admin/users/whoever'],
      ['POST', '/v1/admin/users/whoever/ban'],
      ['POST', '/v1/admin/users/whoever/unban'],
      ['GET', '/v1/admin/games'],
      ['PATCH', '/v1/admin/games/whatever'],
      ['GET', '/v1/admin/reports'],
      ['PATCH', '/v1/admin/reports/whatever'],
    ]

    it('is 401 for a stranger, on every route', async () => {
      for (const [method, path] of everything) {
        const response = await app.request(path, { method, headers: JSON_HEADERS })
        expect(response.status, path).toBe(401)
      }
    })

    it('is 403 for somebody signed in without the flag, on every route', async () => {
      // A different answer from 401 on purpose: signed out means sign in, and not an admin means
      // this page is not for you. There is nothing to enumerate -- you have to be signed in to
      // tell them apart, and your own account's flag is not news to you.
      for (const [method, path] of everything) {
        const response = await app.request(path, {
          method,
          headers: { ...JSON_HEADERS, cookie: theirs },
        })
        expect(response.status, path).toBe(403)
      }
    })

    it('reads the column rather than anything the client said', async () => {
      // `Profile.isAdmin` goes out to the browser so a menu can be drawn. It is not what decides.
      expect((await get('/v1/admin/users')).status).toBe(200)
      makeAdmin(store, me.userId, false)
      expect((await get('/v1/admin/users')).status).toBe(403)
    })

    it('tells the account screen who can moderate', async () => {
      const mine = (await (await get('/v1/me')).json()) as { isAdmin: boolean }
      expect(mine.isAdmin).toBe(true)
      const ordinary = (await (await get('/v1/me', { cookie: theirs })).json()) as {
        isAdmin: boolean
      }
      expect(ordinary.isAdmin).toBe(false)
    })

    it('never puts the flag on a public profile', async () => {
      // Who moderates is nobody else's business, and a public field saying so would be a list of
      // the accounts worth attacking.
      const page = (await (await get(`/v1/users/${me.username}`)).json()) as Record<string, unknown>
      expect(page).not.toHaveProperty('isAdmin')
      expect(page).not.toHaveProperty('email')
    })
  })

  describe('finding somebody', () => {
    it('lists everybody, newest first, when nothing is asked', async () => {
      // A moderation screen with an empty state is a screen that has to be used before it shows
      // anything.
      const { users } = (await (await get('/v1/admin/users')).json()) as { users: AdminUser[] }
      expect(users.map((user) => user.userId)).toEqual([me.userId, them.userId])
    })

    it('searches a username and a sign-in address with the one box', async () => {
      // Whoever is asking has whichever handle they were given: a name from a report, an address
      // from an email.
      const byName = (await (
        await get(`/v1/admin/users?q=${them.username.slice(0, 6)}`)
      ).json()) as { users: AdminUser[] }
      expect(byName.users.map((user) => user.userId)).toEqual([them.userId])

      const byEmail = (await (await get('/v1/admin/users?q=player@example')).json()) as {
        users: AdminUser[]
      }
      expect(byEmail.users.map((user) => user.userId)).toEqual([them.userId])
    })

    it('answers an empty search the way it answers no search', async () => {
      const { users } = (await (await get('/v1/admin/users?q=')).json()) as { users: AdminUser[] }
      expect(users).toHaveLength(2)
    })

    it('finds nobody without pretending otherwise', async () => {
      const { users } = (await (await get('/v1/admin/users?q=zzz')).json()) as {
        users: AdminUser[]
      }
      expect(users).toEqual([])
    })

    it('carries the address, which is the one place in the API that does', async () => {
      // A profile has never had one and `PublicProfile` exists to keep it that way. Moderation
      // means answering "who is this account", and this is where that is answered.
      const { users } = (await (await get('/v1/admin/users?q=player@example')).json()) as {
        users: AdminUser[]
      }
      const [identity] = users[0]?.identities ?? []
      expect(identity).toMatchObject({
        provider: 'email',
        email: 'player@example.com',
        emailVerified: true,
      })
      // A timestamp in the column, a string on the wire, because JSON has no date.
      expect(typeof identity?.createdAt).toBe('string')
    })

    it('counts what somebody has played', async () => {
      await keepGame(theirs, { score: 3 })
      const { users } = (await (await get(`/v1/admin/users?q=${them.username}`)).json()) as {
        users: AdminUser[]
      }
      expect(users[0]?.games).toBe(1)
    })

    it('honours a limit, caps it, and ignores nonsense', async () => {
      expect(
        ((await (await get('/v1/admin/users?limit=1')).json()) as { users: AdminUser[] }).users,
      ).toHaveLength(1)
      for (const limit of ['0', '-2', 'fish', '9.5']) {
        const { users } = (await (await get(`/v1/admin/users?limit=${limit}`)).json()) as {
          users: AdminUser[]
        }
        expect(users, limit).toHaveLength(2)
      }
    })

    it('reads one account in full, and 404s for one that is not there', async () => {
      const found = (await (await get(`/v1/admin/users/${them.userId}`)).json()) as AdminUser
      expect(found.username).toBe(them.username)
      expect(found.bannedAt).toBeNull()
      expect((await get('/v1/admin/users/nobody')).status).toBe(404)
    })
  })

  describe('changing an account', () => {
    it('renames somebody', async () => {
      // The rename is the point of the whole screen: docs/ACCOUNTS.md settles that what defends
      // the namespace is a report button and the power to rename an account and say why.
      const response = await send('PATCH', `/v1/admin/users/${them.userId}`, { username: 'trout' })
      expect(response.status).toBe(200)
      expect(((await response.json()) as AdminUser).username).toBe('trout')
      // And the public page moves with it, because a username is not the key.
      expect((await get('/v1/users/trout')).status).toBe(200)
    })

    it('holds an admin to the same name rules as its owner', async () => {
      // An admin renaming somebody past the rules would be creating the impersonation problem
      // the rules exist to prevent.
      const response = await send('PATCH', `/v1/admin/users/${them.userId}`, { username: 'a' })
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ error: 'bad-field', field: 'username' })
    })

    it('loses to the unique index rather than checking first', async () => {
      // A generated name cannot be the collision: `checkUsername` calls that shape reserved, so
      // nobody can type one and the refusal would be a 400 about the name rather than a 409
      // about the index. So somebody takes a real name first.
      await send('PATCH', `/v1/admin/users/${me.userId}`, { username: 'trout' })
      const response = await send('PATCH', `/v1/admin/users/${them.userId}`, {
        username: 'Trout',
      })
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ error: 'username-taken' })
    })

    it('refuses a name that is the shape the game hands out', async () => {
      // The generated shape is reserved, so nobody can claim one -- including an admin, who
      // would otherwise be able to make somebody indistinguishable from a brand-new account.
      const response = await send('PATCH', `/v1/admin/users/${them.userId}`, {
        username: 'clever-beacon-1267',
      })
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ field: 'username', problem: 'reserved' })
    })

    it('clears a bio', async () => {
      await send('PATCH', `/v1/admin/users/${them.userId}`, { bio: 'buy my coins' })
      const cleared = await send('PATCH', `/v1/admin/users/${them.userId}`, { bio: null })
      expect(((await cleared.json()) as AdminUser).bio).toBeNull()
    })

    it('reads the account back when the patch mentions nothing', async () => {
      const response = await send('PATCH', `/v1/admin/users/${them.userId}`, {})
      expect(response.status).toBe(200)
      expect(((await response.json()) as AdminUser).userId).toBe(them.userId)
    })

    it('404s for an account that is not there', async () => {
      expect((await send('PATCH', '/v1/admin/users/nobody', { bio: 'hi' })).status).toBe(404)
    })

    it('refuses a body it cannot read', async () => {
      expect((await send('PATCH', `/v1/admin/users/${them.userId}`, 'not json')).status).toBe(400)
    })

    describe('the admin flag', () => {
      it('makes somebody else an admin, and takes it back', async () => {
        const made = await send('PATCH', `/v1/admin/users/${them.userId}`, { isAdmin: true })
        expect(((await made.json()) as AdminUser).isAdmin).toBe(true)
        // Which is to say they can now reach the panel.
        expect((await get('/v1/admin/users', { cookie: theirs })).status).toBe(200)

        await send('PATCH', `/v1/admin/users/${them.userId}`, { isAdmin: false })
        expect((await get('/v1/admin/users', { cookie: theirs })).status).toBe(403)
      })

      it('refuses to touch the flag on the account making the request', async () => {
        // Not a rail against a mistake. It is what stops the flag being something the panel can
        // hand to itself: with sign-up never writing the column, every admin was made by
        // somebody else and the first one by hand.
        for (const isAdmin of [true, false]) {
          const response = await send('PATCH', `/v1/admin/users/${me.userId}`, { isAdmin })
          expect(response.status).toBe(409)
          expect(await response.json()).toEqual({ error: 'not-yourself' })
        }
        expect((await get('/v1/admin/users')).status).toBe(200)
      })

      it('lets an admin edit their own name, which is not the flag', async () => {
        const response = await send('PATCH', `/v1/admin/users/${me.userId}`, { username: 'nick' })
        expect(response.status).toBe(200)
      })

      it('wants an actual boolean', async () => {
        // Everywhere else a value of the wrong type collapses to a sensible default. That is
        // right for a bio and wrong for the field that decides who can delete accounts:
        // `"false"` is truthy.
        for (const isAdmin of ['false', 1, null]) {
          const response = await send('PATCH', `/v1/admin/users/${them.userId}`, { isAdmin })
          expect(response.status, String(isAdmin)).toBe(400)
          expect(await response.json()).toMatchObject({ field: 'isAdmin' })
        }
        expect((await get('/v1/admin/users', { cookie: theirs })).status).toBe(403)
      })
    })
  })

  describe('banning an account', () => {
    it('ends the session and takes the profile out of view', async () => {
      // The row stays, which is the operation rather than half of one: this handler can be aimed
      // at anybody so it has to be undoable. `findSession` already checks the column, so the
      // sign-out is a consequence rather than a second step.
      const response = await send('POST', `/v1/admin/users/${them.userId}/ban`, {})
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ banned: true })

      expect((await get('/v1/me', { cookie: theirs })).status).toBe(401)
      expect((await get(`/v1/users/${them.username}`)).status).toBe(404)
      // Still visible to the panel, which is the one surface that has to see one.
      const found = (await (await get(`/v1/admin/users/${them.userId}`)).json()) as AdminUser
      expect(found.bannedAt).toBe(clock.toISOString())
    })

    it('takes a game out of view with the account that played it', async () => {
      const gameId = await keepGame(theirs, { score: 3 })
      await send('POST', `/v1/admin/users/${them.userId}/ban`, {})
      // A game belonging to a banned account is 404, the same answer as a game that never
      // existed. Telling them apart is how an endpoint starts reporting who used to be here.
      expect((await get(`/v1/games/${gameId}`)).status).toBe(404)
    })

    it('lifts a ban', async () => {
      await send('POST', `/v1/admin/users/${them.userId}/ban`, {})
      const restored = await send('POST', `/v1/admin/users/${them.userId}/unban`, {})
      expect(restored.status).toBe(200)
      expect(await restored.json()).toEqual({ banned: false })
      expect((await get(`/v1/users/${them.username}`)).status).toBe(200)
      // The session is still revoked-by-expiry rather than resurrected, but the account works.
      const again = await signIn('player@example.com')
      expect((await get('/v1/me', { cookie: again })).status).toBe(200)
    })

    it('still edits a banned account, so a bad name can be fixed rather than only hidden', async () => {
      await send('POST', `/v1/admin/users/${them.userId}/ban`, {})
      const renamed = await send('PATCH', `/v1/admin/users/${them.userId}`, { username: 'gone' })
      expect(renamed.status).toBe(200)
    })

    it('refuses to ban the account making the request', async () => {
      // Almost certainly a misclick, and the account it would cost is the one that can undo it.
      const response = await send('POST', `/v1/admin/users/${me.userId}/ban`, {})
      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ error: 'not-yourself' })
    })

    it('404s for an account that is not there, either way', async () => {
      expect((await send('POST', '/v1/admin/users/nobody/ban', {})).status).toBe(404)
      expect((await send('POST', '/v1/admin/users/nobody/unban', {})).status).toBe(404)
    })
  })

  describe('curating a board', () => {
    it('lists games in the order a board has them', async () => {
      // Score down, rounds up, clock up -- which is `compareResults` in @blinkered/engine. A
      // listing sorted any other way would not be showing the board it exists to judge.
      const small = await keepGame(theirs, { score: 3 })
      const big = await keepGame(theirs, { score: 10 })
      const { games } = (await (await get('/v1/admin/games')).json()) as { games: AdminGame[] }
      expect(games.map((game) => game.id)).toEqual([big, small])
      expect(games[0]?.owner.username).toBe(them.username)
      // The three columns a listing elsewhere is right not to carry, because they are why a
      // game is or is not on a board.
      expect(games[0]).toMatchObject({ hidden: false, imported: false, leaderboardEligible: false })
    })

    it('filters by language, difficulty and player', async () => {
      const english = await keepGame(theirs, { score: 3 })
      const finnish = await keepGame(theirs, { score: 3, language: 'fi' })
      const asked = async (query: string): Promise<string[]> => {
        const { games } = (await (await get(`/v1/admin/games?${query}`)).json()) as {
          games: AdminGame[]
        }
        return games.map((game) => game.id)
      }
      expect(await asked('language=fi')).toEqual([finnish])
      expect(await asked('language=en')).toEqual([english])
      expect(await asked('difficulty=medium')).toHaveLength(2)
      expect(await asked('difficulty=insane')).toEqual([])
      expect(await asked(`user=${them.userId}`)).toHaveLength(2)
      expect(await asked(`user=${me.userId}`)).toEqual([])
      // An empty parameter is not a filter, which is what a cleared form field sends.
      expect(await asked('language=')).toHaveLength(2)
    })

    it('hides a stupid score, and brings it back', async () => {
      // The whole anti-cheat apparatus, as docs/ACCOUNTS.md has it. Reversible, which is the
      // reason it is a column rather than a delete.
      const gameId = await keepGame(theirs, { score: 10 })
      const hidden = await send('PATCH', `/v1/admin/games/${gameId}`, { hidden: true })
      expect(hidden.status).toBe(200)
      expect(await hidden.json()).toEqual({ hidden: true })

      // Gone from the permalink and from its owner's own page, which is the point: a score
      // removed from a board that still sits at the top of a personal page has been removed
      // from nowhere the person who set it can see.
      expect((await get(`/v1/games/${gameId}`)).status).toBe(404)
      const mine = (await (await get('/v1/me/games', { cookie: theirs })).json()) as {
        games: unknown[]
      }
      expect(mine.games).toEqual([])

      await send('PATCH', `/v1/admin/games/${gameId}`, { hidden: false })
      expect((await get(`/v1/games/${gameId}`)).status).toBe(200)
    })

    it('can still find a hidden game, or there would be no way to un-hide one', async () => {
      const gameId = await keepGame(theirs, { score: 10 })
      await send('PATCH', `/v1/admin/games/${gameId}`, { hidden: true })
      const both = (await (await get('/v1/admin/games')).json()) as { games: AdminGame[] }
      expect(both.games.map((game) => game.id)).toEqual([gameId])

      const only = (await (await get('/v1/admin/games?hidden=true')).json()) as {
        games: AdminGame[]
      }
      expect(only.games.map((game) => game.id)).toEqual([gameId])
      const visible = (await (await get('/v1/admin/games?hidden=false')).json()) as {
        games: AdminGame[]
      }
      expect(visible.games).toEqual([])
      // Anything that is not `true` or `false` is not a filter at all, rather than one of them.
      const nonsense = (await (await get('/v1/admin/games?hidden=perhaps')).json()) as {
        games: AdminGame[]
      }
      expect(nonsense.games.map((game) => game.id)).toEqual([gameId])
    })

    it('wants a boolean, and 404s for a game that is not there', async () => {
      const gameId = await keepGame(theirs, { score: 3 })
      // A missing key coerced to false would silently un-hide something the request never
      // mentioned.
      for (const body of [{}, { hidden: 'true' }, 'not json'] as unknown[]) {
        const response = await send('PATCH', `/v1/admin/games/${gameId}`, body)
        expect(response.status).toBe(400)
      }
      expect((await send('PATCH', '/v1/admin/games/nosuch', { hidden: true })).status).toBe(404)
    })
  })

  describe('the reports queue', () => {
    /** One report from the ordinary player about the admin's own bio, so there is a row. */
    const fileOne = async (field = 'bio'): Promise<void> => {
      const response = await app.request('/v1/reports', {
        method: 'POST',
        headers: { ...JSON_HEADERS, cookie: theirs },
        body: JSON.stringify({ field, username: me.username, reason: 'why not' }),
      })
      expect(response.status).toBe(201)
    }

    it('reads what the button writes, which is what the table was waiting for', async () => {
      await fileOne()
      const { reports } = (await (await get('/v1/admin/reports')).json()) as {
        reports: AdminReport[]
      }
      expect(reports).toHaveLength(1)
      expect(reports[0]).toMatchObject({
        field: 'bio',
        reason: 'why not',
        resolvedAt: null,
        reporter: { username: them.username },
        subjectUser: { username: me.username },
        subjectGame: null,
      })
    })

    it('carries the game and the score when the objection is to one', async () => {
      const gameId = await keepGame(theirs, { score: 10 })
      const response = await app.request('/v1/reports', {
        method: 'POST',
        headers: { ...JSON_HEADERS, cookie },
        body: JSON.stringify({ field: 'score', gameId }),
      })
      expect(response.status).toBe(201)
      const { reports } = (await (await get('/v1/admin/reports')).json()) as {
        reports: AdminReport[]
      }
      expect(reports[0]?.subjectGame?.id).toBe(gameId)
      expect(reports[0]?.subjectGame?.score).toBeGreaterThan(0)
      // And whose score it was, which is what makes "again?" a question anybody can ask.
      expect(reports[0]?.subjectUser?.username).toBe(them.username)
    })

    it('resolves one, and puts it back', async () => {
      await fileOne()
      const [open] = ((await (await get('/v1/admin/reports')).json()) as { reports: AdminReport[] })
        .reports
      const done = await send('PATCH', `/v1/admin/reports/${open?.id ?? ''}`, { resolved: true })
      expect(done.status).toBe(200)
      expect(await done.json()).toEqual({ resolved: true })

      // Gone from the work, still readable as a decision.
      expect(
        ((await (await get('/v1/admin/reports')).json()) as { reports: AdminReport[] }).reports,
      ).toEqual([])
      const all = (await (await get('/v1/admin/reports?state=all')).json()) as {
        reports: AdminReport[]
      }
      expect(all.reports[0]?.resolvedAt).toBe(clock.toISOString())

      await send('PATCH', `/v1/admin/reports/${open?.id ?? ''}`, { resolved: false })
      expect(
        ((await (await get('/v1/admin/reports')).json()) as { reports: AdminReport[] }).reports,
      ).toHaveLength(1)
    })

    it('puts the unresolved ones first, which is the order to work in', async () => {
      await fileOne('bio')
      await fileOne('username')
      const open = ((await (await get('/v1/admin/reports')).json()) as { reports: AdminReport[] })
        .reports
      await send('PATCH', `/v1/admin/reports/${open[0]?.id ?? ''}`, { resolved: true })
      const all = (await (await get('/v1/admin/reports?state=all')).json()) as {
        reports: AdminReport[]
      }
      expect(all.reports.map((report) => report.resolvedAt === null)).toEqual([true, false])
    })

    it('wants a boolean, and 404s for a report that is not there', async () => {
      for (const body of [{}, { resolved: 'yes' }, 'not json'] as unknown[]) {
        expect((await send('PATCH', '/v1/admin/reports/whatever', body)).status).toBe(400)
      }
      expect((await send('PATCH', '/v1/admin/reports/nosuch', { resolved: true })).status).toBe(404)
    })

    it('is empty rather than absent when nobody has complained', async () => {
      const { reports } = (await (await get('/v1/admin/reports')).json()) as {
        reports: AdminReport[]
      }
      expect(reports).toEqual([])
    })
  })
})
