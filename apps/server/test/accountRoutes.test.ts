import { beforeEach, describe, expect, it } from 'vitest'
import { configFor } from '@blinkered/engine'
import { createApp } from '../src/app.js'
import type { ApiDeps } from '../src/app.js'
import { BIO_MAX } from '../src/account/profile.js'
import type { Profile } from '../src/auth/types.js'
import { capturingMailer, fakeStore } from './fake.js'

const JSON_HEADERS = { 'content-type': 'application/json' }
const CONFIG = configFor('medium', { language: 'en' })
/** Twelve tiles, which is what a board looks like in a detail document. */
const FACES = 'A B C D E F G H I J K L'
const BOARD = { tiles: FACES }

describe('the account surface', () => {
  let store: ReturnType<typeof fakeStore>
  let mailer: ReturnType<typeof capturingMailer>
  let app: ReturnType<typeof createApp>
  let clock: Date
  let cookie: string

  const deps = (): ApiDeps => ({ store, mailer, now: () => clock, secureCookies: false })

  /** Signs a fresh address in and keeps the cookie, which is what every route here needs. */
  const signIn = async (email = 'nick@example.com'): Promise<string> => {
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

  beforeEach(async () => {
    store = fakeStore()
    mailer = capturingMailer()
    clock = new Date('2026-09-04T12:00:00Z')
    app = createApp({ auth: deps() })
    cookie = await signIn()
  })

  describe('who am I', () => {
    it('answers with the whole profile, avatar seed and all', async () => {
      const me = (await (await get('/v1/me')).json()) as Profile
      expect(me.username).toMatch(/^[a-z]+-[a-z]+-\d{4}$/)
      // The picture is drawn wherever the name is shown, so it comes back with the name rather
      // than from a route of its own.
      expect(me.avatarSeed).toBe(me.userId)
      expect(me.bio).toBeNull()
    })

    it('is 401 for every way of not being signed in', async () => {
      for (const headers of [{}, { cookie: 'blinkered_session=x' }]) {
        expect((await get('/v1/me', headers)).status).toBe(401)
      }
    })
  })

  describe('editing it', () => {
    it('takes a patch and hands back what was stored', async () => {
      const response = await send('PATCH', '/v1/me', {
        username: 'trout',
        country: 'us',
        bio: '  fly fishing  ',
        uiLanguage: 'en',
        gameLanguage: 'fi',
      })
      expect(response.status).toBe(200)
      const me = (await response.json()) as Profile
      expect(me).toMatchObject({
        username: 'trout',
        country: 'US',
        bio: 'fly fishing',
        gameLanguage: 'fi',
      })
      // What the server stored, not what the client hoped it stored.
      expect((await (await get('/v1/me')).json()) as Profile).toMatchObject({ username: 'trout' })
    })

    it('mentions only what it was asked to change', async () => {
      await send('PATCH', '/v1/me', { bio: 'here' })
      await send('PATCH', '/v1/me', { country: 'FI' })
      expect((await (await get('/v1/me')).json()) as Profile).toMatchObject({
        bio: 'here',
        country: 'FI',
      })
    })

    it('clears a field asked to be cleared, which absent cannot express', async () => {
      await send('PATCH', '/v1/me', { bio: 'here' })
      await send('PATCH', '/v1/me', { bio: null })
      expect(((await (await get('/v1/me')).json()) as Profile).bio).toBeNull()
    })

    it('accepts a patch that changes nothing, and reads it back', async () => {
      const response = await send('PATCH', '/v1/me', {})
      expect(response.status).toBe(200)
      expect(((await response.json()) as Profile).username).toMatch(/-\d{4}$/)
    })

    it('says which field was wrong, and what was wrong with it', async () => {
      const response = await send('PATCH', '/v1/me', { bio: 'x'.repeat(BIO_MAX + 1) })
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: 'bad-field',
        field: 'bio',
        problem: 'too-long',
      })
    })

    it('survives a body that is not JSON at all', async () => {
      const response = await send('PATCH', '/v1/me', 'not json')
      expect(response.status).toBe(400)
      expect(((await response.json()) as { field: string }).field).toBe('body')
    })

    it('refuses a name somebody else has, and says so as a conflict', async () => {
      await send('PATCH', '/v1/me', { username: 'trout' })
      const second = await signIn('other@example.com')
      const response = await send('PATCH', '/v1/me', { username: 'Trout' }, { cookie: second })
      // Case-insensitively and on the normalized form: `Trout` and `trout` are one person.
      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ error: 'username-taken' })
    })

    it('is 401 signed out, so a patch is never anonymous', async () => {
      expect((await send('PATCH', '/v1/me', { bio: 'hi' }, {})).status).toBe(401)
    })
  })

  describe('checking a name before committing to it', () => {
    it('says a free one is free', async () => {
      expect(await (await get('/v1/usernames/trout')).json()).toEqual({
        available: true,
        problem: null,
      })
    })

    it('says a taken one is taken', async () => {
      await send('PATCH', '/v1/me', { username: 'trout' })
      const second = await signIn('other@example.com')
      expect(await (await get('/v1/usernames/trout', { cookie: second })).json()).toEqual({
        available: false,
        problem: 'taken',
      })
    })

    it('calls the name you already have available, because to you it is', async () => {
      await send('PATCH', '/v1/me', { username: 'trout' })
      // A form that says "taken" about the name already in it is a form that looks broken.
      expect(await (await get('/v1/usernames/Trout')).json()).toEqual({
        available: true,
        problem: null,
      })
    })

    it('answers the shape question in the same breath as the availability one', async () => {
      // Otherwise somebody fixes the name twice: once for the rules and once for the collision.
      expect(await (await get('/v1/usernames/no')).json()).toEqual({
        available: false,
        problem: 'too-short',
      })
    })

    it('needs a session, so the namespace is not open to a stranger to walk', async () => {
      expect((await get('/v1/usernames/trout', {})).status).toBe(401)
    })
  })

  describe('keeping a game played before signing up', () => {
    const game = (changes: Record<string, unknown> = {}): Record<string, unknown> => ({
      startedAt: clock.getTime() - 120_000,
      finishedAt: clock.getTime() - 1000,
      seed: 4821,
      difficulty: 'medium',
      source: 'web',
      config: { ...CONFIG },
      boards: [BOARD, BOARD],
      words: [
        { word: 'HOUSE', round: 0, flips: 8, tick: 42 },
        { word: 'RIVER', round: 1, flips: 8, tick: 96, wilds: [2] },
      ],
      rounds: 8,
      ...changes,
    })

    it('stores it, with the score the server computed', async () => {
      const response = await send('POST', '/v1/games/import', game())
      expect(response.status).toBe(201)
      const kept = (await response.json()) as { id: string; score: number }
      expect(kept.score).toBeGreaterThan(0)

      const stored = store.games[0]
      expect(stored?.row.score).toBe(kept.score)
      expect(stored?.detail.words.map((word) => word.word)).toEqual(['HOUSE', 'RIVER'])
      // Tiles, not characters, because that is what scores.
      expect(stored?.detail.words[0]?.tiles).toBe(5)
      expect(stored?.detail.boards).toEqual([BOARD, BOARD])
    })

    it('keeps what the engine already knew about each word', () => {
      // `roundIndex`, `wilds`, `flips` and `tick` were computed during play and thrown away at
      // the door. In a document they cost a version bump rather than a migration, which is most
      // of the argument for the document.
      return send('POST', '/v1/games/import', game()).then(() => {
        expect(store.games[0]?.detail.words[1]).toMatchObject({
          word: 'RIVER',
          round: 1,
          flips: 8,
          tick: 96,
          wilds: [2],
        })
      })
    })

    it('leaves wilds out of an ordinary word rather than writing an empty list', () => {
      // Most words have no wilds, and an empty array costs bytes in every one of them to say so.
      return send('POST', '/v1/games/import', game()).then(() => {
        expect(store.games[0]?.detail.words[0]).not.toHaveProperty('wilds')
      })
    })

    it('never marks any game as one for a leaderboard', async () => {
      await send('POST', '/v1/games/import', game())
      // The row never mentions eligibility at all, so the column's `false` default is the only
      // thing that can stand. A route that has no way to say yes cannot be talked into it.
      expect('leaderboardEligible' in (store.games[0]?.row ?? {})).toBe(false)
    })

    it('marks a game imported only when it began before the account did', async () => {
      // The bug this exists for: every game was written with `imported: true`, so a history told
      // people that games they had played while signed in were kept from a guest game. Untrue,
      // and useless even where it was true.
      await send('POST', '/v1/games/import', game({ guest: true }))
      await send('POST', '/v1/games/import', game({ guest: false }))
      await send('POST', '/v1/games/import', game())
      expect(store.games.map((kept) => kept.row.imported)).toEqual([true, false, false])
    })

    it('counts tiles in the game’s own alphabet', async () => {
      // Croatian LJ is one tile. A length in characters would overpay every word that holds one.
      const hr = configFor('medium', { language: 'hr' })
      await send(
        'POST',
        '/v1/games/import',
        game({
          config: { ...hr },
          words: [{ word: 'LJUDI', round: 0, flips: 4, tick: 10 }],
        }),
      )
      expect(store.games.at(-1)?.detail.words[0]?.tiles).toBe(4)
    })

    it('keeps a game that found nothing, because a game is still a game', async () => {
      const response = await send('POST', '/v1/games/import', game({ words: [] }))
      expect(response.status).toBe(201)
      expect(store.games[0]?.row.score).toBe(0)
      expect(store.games[0]?.detail.words).toEqual([])
      // A game with no words still had a board, and the board is the interesting half.
      expect(store.games[0]?.detail.boards).not.toEqual([])
    })

    it('says what was wrong with a game it will not take', async () => {
      const response = await send('POST', '/v1/games/import', game({ difficulty: 'gentle' }))
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'bad-game', problem: 'bad-difficulty' })
    })

    it('reads the wall clock when nobody injected one', async () => {
      // The default matters here rather than anywhere else: the clock is what decides whether a
      // finish time is in the future, and a deployment does not pass one in.
      const live = createApp({ auth: { store, mailer, secureCookies: false } })
      const response = await live.request('/v1/games/import', {
        method: 'POST',
        headers: { ...JSON_HEADERS, cookie },
        body: JSON.stringify(game({ finishedAt: Date.now() - 1000 })),
      })
      expect(response.status).toBe(201)
    })

    it('refuses a board that is not the board the ruleset describes', async () => {
      for (const boards of [
        [],
        [{ tiles: 'A B C' }],
        [BOARD, BOARD, BOARD, BOARD, BOARD, BOARD, BOARD, BOARD, BOARD],
        'ABC',
      ]) {
        const response = await send('POST', '/v1/games/import', game({ boards }))
        expect(response.status).toBe(400)
      }
    })

    it('is 401 signed out, since a game has to belong to somebody', async () => {
      expect((await send('POST', '/v1/games/import', game(), {})).status).toBe(401)
    })
  })

  describe('my games', () => {
    const importOne = async (finishedAt: number, seed: number): Promise<void> => {
      await send('POST', '/v1/games/import', {
        startedAt: finishedAt - 60_000,
        finishedAt,
        seed,
        difficulty: 'medium',
        source: 'web',
        config: { ...CONFIG },
        boards: [BOARD],
        words: [{ word: 'HOUSE', round: 0, flips: 8, tick: 12 }],
        rounds: 4,
      })
    }

    it('lists them newest first', async () => {
      await importOne(clock.getTime() - 100_000, 1)
      await importOne(clock.getTime() - 1000, 2)
      const { games } = (await (await get('/v1/me/games')).json()) as {
        games: { finishedAt: string }[]
      }
      expect(games).toHaveLength(2)
      expect(new Date(games[0]?.finishedAt ?? 0).getTime()).toBeGreaterThan(
        new Date(games[1]?.finishedAt ?? 0).getTime(),
      )
    })

    it('shows nobody else’s', async () => {
      await importOne(clock.getTime() - 1000, 1)
      const second = await signIn('other@example.com')
      const { games } = (await (await get('/v1/me/games', { cookie: second })).json()) as {
        games: unknown[]
      }
      expect(games).toEqual([])
    })

    it('honours a limit, caps it, and ignores a nonsensical one', async () => {
      for (let i = 0; i < 3; i += 1) await importOne(clock.getTime() - 1000 * (i + 1), i)
      const count = async (query: string): Promise<number> =>
        ((await (await get(`/v1/me/games${query}`)).json()) as { games: unknown[] }).games.length
      expect(await count('?limit=1')).toBe(1)
      expect(await count('?limit=100000')).toBe(3)
      expect(await count('?limit=nonsense')).toBe(3)
      expect(await count('?limit=0')).toBe(3)
    })

    it('is 401 signed out', async () => {
      expect((await get('/v1/me/games', {})).status).toBe(401)
    })
  })

  describe('one game in full', () => {
    const keep = async (): Promise<string> => {
      const response = await send('POST', '/v1/games/import', {
        startedAt: clock.getTime() - 120_000,
        finishedAt: clock.getTime() - 1000,
        seed: 4821,
        difficulty: 'medium',
        source: 'web',
        config: { ...CONFIG },
        boards: [BOARD, BOARD],
        words: [{ word: 'HOUSE', round: 0, flips: 8, tick: 42 }],
        rounds: 6,
      })
      return ((await response.json()) as { id: string }).id
    }

    it('hands back the summary and the document together', async () => {
      const id = await keep()
      const response = await get(`/v1/me/games/${id}`)
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id,
        language: 'en',
        difficulty: 'medium',
        detail: {
          boards: [BOARD, BOARD],
          words: [{ word: 'HOUSE', tiles: 5, round: 0, flips: 8, tick: 42 }],
        },
      })
    })

    it('is 404 for somebody else’s game, not 403', async () => {
      // The two are distinguishable only to whoever is guessing at ids, and telling them apart
      // is how this endpoint starts reporting which games exist.
      const id = await keep()
      const other = await signIn('other@example.com')
      expect((await get(`/v1/me/games/${id}`, { cookie: other })).status).toBe(404)
    })

    it('is 404 for a game that is not there at all', async () => {
      expect((await get('/v1/me/games/made-up')).status).toBe(404)
    })

    it('is 401 signed out', async () => {
      const id = await keep()
      expect((await get(`/v1/me/games/${id}`, {})).status).toBe(401)
    })
  })

  describe('signing out', () => {
    it('kills the session rather than forgetting it', async () => {
      expect((await get('/v1/me')).status).toBe(200)
      const response = await send('POST', '/v1/auth/signout', {})
      expect(response.status).toBe(204)
      // The credential is dead, not merely undisplayed: a token copied off a shared machine has
      // to stop working, which is the whole reason to sign out.
      expect((await get('/v1/me')).status).toBe(401)
      expect(response.headers.get('set-cookie') ?? '').toContain('blinkered_session=')
    })

    it('is 204 with no cookie, and with one nobody has heard of', async () => {
      for (const headers of [{}, { cookie: 'blinkered_session=made-up' }]) {
        expect((await send('POST', '/v1/auth/signout', {}, headers)).status).toBe(204)
      }
    })

    it('is 204 the second time, so a double click is not an error', async () => {
      await send('POST', '/v1/auth/signout', {})
      expect((await send('POST', '/v1/auth/signout', {})).status).toBe(204)
    })
  })

  describe('the providers that are not built', () => {
    it('answer 501 rather than 404, so the client can tell a stub from a routing mistake', async () => {
      for (const provider of ['apple', 'google']) {
        const response = await get(`/v1/auth/${provider}`)
        expect(response.status).toBe(501)
        expect(await response.json()).toEqual({ error: 'not-implemented', provider })
      }
    })
  })
})
