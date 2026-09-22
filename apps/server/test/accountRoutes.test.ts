import { beforeEach, describe, expect, it } from 'vitest'
import { ENGINE_VERSION, configFor } from '@blinkered/engine'
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

    /*
     * The upload queue's guarantee, at the route.
     *
     * A device that finished a game with no network posts it later, and a retry whose response
     * was lost is indistinguishable from a second attempt. Without the key the only outcomes are
     * a duplicate row or a guess from the timestamp, and a guess is how a history grows a
     * phantom game.
     */
    it('stores a retried game once, and says which of the two it did', async () => {
      const queued = game({ clientKey: 'queued-1' })

      const first = await send('POST', '/v1/games/import', queued)
      expect(first.status).toBe(201)
      const created = (await first.json()) as { id: string; score: number }

      const again = await send('POST', '/v1/games/import', queued)
      // 200 rather than 201: nothing was created, and this is not an error either. A device
      // draining its queue needs to tell "you have this" from "I took this".
      expect(again.status).toBe(200)
      const echoed = (await again.json()) as { id: string; score: number }

      expect(echoed).toEqual(created)
      expect(store.games).toHaveLength(1)
    })

    it('keeps two different games that carry different keys', async () => {
      await send('POST', '/v1/games/import', game({ clientKey: 'queued-1' }))
      await send('POST', '/v1/games/import', game({ clientKey: 'queued-2' }))
      expect(store.games).toHaveLength(2)
    })

    it('keeps every keyless game, because nulls do not collide', async () => {
      // Every row written before the column existed has no key, and two of them are two games.
      await send('POST', '/v1/games/import', game())
      await send('POST', '/v1/games/import', game())
      expect(store.games).toHaveLength(2)
    })

    /*
     * What reaches a board, decided on import and nowhere else.
     *
     * Three rules, and two of them were reversals: `imported` used to disqualify a claimed guest
     * game, which made the score that persuades somebody to sign up the one score that would not
     * count; and a scoreless game used to qualify, which would have left a board with a tail of
     * noughts.
     */
    it('marks a canonical game with a score as eligible', async () => {
      await send('POST', '/v1/games/import', game())
      expect(store.games[0]?.row.leaderboardEligible).toBe(true)
    })

    it('marks a claimed guest game eligible too', async () => {
      // `guest` sets `imported`, which is bookkeeping about where the game came from and no
      // longer decides whether it can be ranked.
      await send('POST', '/v1/games/import', game({ guest: true }))
      expect(store.games[0]?.row.imported).toBe(true)
      expect(store.games[0]?.row.leaderboardEligible).toBe(true)
    })

    it('never marks a paused game eligible, and remembers that it was paused', async () => {
      /*
       * The exploit this closes has no technical fix: screen-cap the board, stop the clock, pick
       * the words out of the photograph, resume, miss nothing. iOS cannot hide a view from a
       * screenshot on request and a second phone defeats anything that could, so the game
       * declines to rank a game whose clock stopped rather than pretending to prevent the
       * capture. The row keeps `paused` as well, so a history can say which of the three reasons
       * applied.
       */
      await send('POST', '/v1/games/import', game({ paused: true }))
      expect(store.games[0]?.row.paused).toBe(true)
      expect(store.games[0]?.row.leaderboardEligible).toBe(false)
    })

    it('reads a missing paused field as not paused', async () => {
      // Every client before this field existed sent games that were ranked; treating silence as
      // "paused" would unrank them retroactively.
      await send('POST', '/v1/games/import', game())
      expect(store.games[0]?.row.paused).toBe(false)
      expect(store.games[0]?.row.leaderboardEligible).toBe(true)
    })

    it('ignores a paused flag that is not a boolean', async () => {
      // `=== true` rather than truthiness, which is the same rule the rest of this body parser
      // uses: a client sending `"yes"` is a client sending nonsense, not a client pausing.
      await send('POST', '/v1/games/import', game({ paused: 'yes' }))
      expect(store.games[0]?.row.paused).toBe(false)
    })

    it('never marks a scoreless game eligible', async () => {
      // No words, so the server scores it zero. Kept, and off every board.
      const response = await send('POST', '/v1/games/import', game({ words: [] }))
      expect(response.status).toBe(201)
      expect(store.games[0]?.row.score).toBe(0)
      expect(store.games[0]?.row.leaderboardEligible).toBe(false)
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

    it('gives a game an id short enough to live in a link', async () => {
      // Eleven characters, not the twenty-two every other row gets. This one is read by people:
      // it is the whole of a shared permalink after `/g/`. See `newGameId` for why not eight.
      const response = await send('POST', '/v1/games/import', game())
      const { id } = (await response.json()) as { id: string }
      expect(id).toHaveLength(11)
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    /*
     * This used to assert that the route never mentioned eligibility at all, so the column's
     * `false` default was the only thing that could stand: "a route that has no way to say yes
     * cannot be talked into it". True, and it made every board empty by construction, which is
     * what the three tests above now cover instead. The rule the route decides is written down
     * in one expression there, and it is the only place that writes the column.
     */

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

  /*
   * The table of your own best games on the game-over panel.
   *
   * Separate from `/me/games` because it answers a different question, and the tests are separate
   * for the same reason: this one is ordered by what a score is worth rather than by when it
   * happened, and it is asked about one group while the game it is about is still being uploaded.
   */
  describe('my best games', () => {
    const BEST = `/v1/me/best/en/medium?engineVersion=${ENGINE_VERSION}`

    /*
     * Six distinct words, because a submission carrying the same word twice is refused.
     *
     * Five tiles each, so the score rises evenly with the count and the order this table is in is
     * unambiguous: three words always beat two.
     */
    const POOL = ['HOUSE', 'MOUSE', 'PLANT', 'STONE', 'BRAVE', 'CRANE']

    /** A game whose score rises with the number of words, which is what orders this table. */
    const importOne = async (finishedAt: number, seed: number, words: number): Promise<void> => {
      await send('POST', '/v1/games/import', {
        startedAt: finishedAt - 60_000,
        finishedAt,
        seed,
        difficulty: 'medium',
        source: 'web',
        config: { ...CONFIG },
        boards: [BOARD],
        words: POOL.slice(0, words).map((word, at) => ({ word, round: at, flips: 8, tick: 12 })),
        rounds: 6,
      })
    }

    const best = async (
      path = BEST,
      headers: Record<string, string> = { cookie },
    ): Promise<{ games: { score: number; finishedAt: string }[]; total: number; ahead: number }> =>
      (await (await get(path, headers)).json()) as {
        games: { score: number; finishedAt: string }[]
        total: number
        ahead: number
      }

    /** The query a panel sends: the game it is placing, by the three numbers that place it. */
    const placing = (score: number, rounds: number, at: number): string =>
      `&score=${String(score)}&rounds=${String(rounds)}&at=${String(at)}`

    it('is your best first, not your newest first', async () => {
      // Newest last, so an answer that came back in the order `/me/games` uses would be the
      // reverse of the one this asserts.
      await importOne(clock.getTime() - 100_000, 1, 3)
      await importOne(clock.getTime() - 50_000, 2, 1)
      await importOne(clock.getTime() - 1000, 3, 2)
      const { games, total } = await best()
      expect(games.map((game) => game.score)).toEqual(
        [...games.map((g) => g.score)].sort((a, b) => b - a),
      )
      expect(games).toHaveLength(3)
      expect(total).toBe(3)
    })

    it('leaves out the game it is placing, and does not count it either', async () => {
      const placed = clock.getTime() - 100_000
      await importOne(placed, 1, 3)
      await importOne(clock.getTime() - 1000, 2, 1)
      const { games, total } = await best(`${BEST}${placing(15, 6, placed)}`)
      expect(games).toHaveLength(1)
      expect(games.map((game) => Date.parse(game.finishedAt))).not.toContain(placed)
      // The count has to drop with the row. A total that still says two while one row came back
      // is the off-by-one this prevents.
      expect(total).toBe(1)
    })

    it('counts what beats the game being placed, however few rows came back', async () => {
      for (let i = 0; i < 6; i += 1) await importOne(clock.getTime() - 1000 * (i + 1), i, i + 1)
      // Worse than all six, asked for with room for one row. Ranked inside the answer this would
      // call itself second; the count is over every game, so it is seventh.
      const { ahead, games } = await best(`${BEST}&limit=1${placing(1, 60, clock.getTime())}`)
      expect(games).toHaveLength(1)
      expect(ahead).toBe(6)
    })

    it('counts a tie the way the board breaks one', async () => {
      const first = clock.getTime() - 100_000
      await importOne(first, 1, 2)
      // The same score in the same rounds: whoever got there first stays ahead, so a game
      // finished later is behind it and one finished earlier is not.
      expect((await best(`${BEST}${placing(10, 6, first + 1000)}`)).ahead).toBe(1)
      expect((await best(`${BEST}${placing(10, 6, first - 1000)}`)).ahead).toBe(0)
      // The same score in fewer rounds wins, and in more rounds loses.
      expect((await best(`${BEST}${placing(10, 5, first + 1000)}`)).ahead).toBe(0)
      expect((await best(`${BEST}${placing(10, 7, first - 1000)}`)).ahead).toBe(1)
    })

    it('places nothing for a game given by halves', async () => {
      await importOne(clock.getTime() - 1000, 1, 1)
      // A score with no finish time cannot be taken out of the rows it is being ranked against,
      // so it is not ranked at all rather than ranked and double counted.
      const half = await best(`${BEST}&score=10`)
      expect(half.total).toBe(1)
      expect(half.ahead).toBe(0)
      expect(
        (await best(`${BEST}&score=nonsense&rounds=6&at=${String(clock.getTime())}`)).ahead,
      ).toBe(0)
    })

    it('answers only about the group it was asked about', async () => {
      await importOne(clock.getTime() - 1000, 1, 1)
      expect((await best(`/v1/me/best/en/hard?engineVersion=${ENGINE_VERSION}`)).total).toBe(0)
      expect((await best(`/v1/me/best/fr/medium?engineVersion=${ENGINE_VERSION}`)).total).toBe(0)
      // A score means nothing across a change to what a difficulty is, which is why the version
      // is part of the group rather than a detail of it.
      expect((await best('/v1/me/best/en/medium?engineVersion=0.0.1')).total).toBe(0)
    })

    it('honours a limit, caps it, and ignores a nonsensical one', async () => {
      for (let i = 0; i < 6; i += 1) await importOne(clock.getTime() - 1000 * (i + 1), i, i + 1)
      const count = async (query: string): Promise<number> =>
        (await best(`${BEST}${query}`)).games.length
      expect(await count('&limit=2')).toBe(2)
      // Six games, a five-row default, and a ceiling well above both.
      expect(await count('')).toBe(5)
      expect(await count('&limit=100000')).toBe(6)
      expect(await count('&limit=nonsense')).toBe(5)
      expect(await count('&limit=0')).toBe(5)
    })

    it('refuses without an engine version, rather than guessing one', async () => {
      expect((await get('/v1/me/best/en/medium')).status).toBe(400)
      expect((await get('/v1/me/best/en/medium?engineVersion=')).status).toBe(400)
    })

    it('shows nobody else’s', async () => {
      await importOne(clock.getTime() - 1000, 1, 1)
      const second = await signIn('other@example.com')
      expect((await best(BEST, { cookie: second })).total).toBe(0)
    })

    it('is 401 signed out', async () => {
      expect((await get(BEST, {})).status).toBe(401)
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

    it('hands back the summary, the document and who played it', async () => {
      const id = await keep()
      const response = await get(`/v1/games/${id}`)
      expect(response.status).toBe(200)
      const game = (await response.json()) as { owner: { username: string } }
      // The generated name, asserted on its own rather than through a matcher: `stringMatching`
      // is typed `any`, and a lint rule rightly refuses to let one into a typed comparison.
      expect(game.owner.username).toMatch(/^[a-z]+-[a-z]+-\d{4}$/)
      expect(game).toMatchObject({
        id,
        language: 'en',
        detail: {
          boards: [BOARD, BOARD],
          words: [{ word: 'HOUSE', tiles: 5, round: 0, flips: 8, tick: 42 }],
        },
      })
    })

    it('shows it to a stranger, and to nobody signed in at all', async () => {
      // Games are public. This route used to be owner-scoped and answer 404 to everybody else;
      // sharing a permalink is what reversed that.
      const id = await keep()
      const other = await signIn('other@example.com')
      expect((await get(`/v1/games/${id}`, { cookie: other })).status).toBe(200)
      expect((await get(`/v1/games/${id}`, {})).status).toBe(200)
    })

    it('never puts an address on a public game', async () => {
      const id = await keep()
      const body = await (await get(`/v1/games/${id}`, {})).text()
      expect(body).not.toContain('nick@example.com')
      expect(body).not.toContain('email')
    })

    it('is 404 for a game that is not there at all', async () => {
      expect((await get('/v1/games/made-up', {})).status).toBe(404)
    })
  })

  describe('somebody else’s profile', () => {
    it('is readable by anyone, under any casing of the name', async () => {
      await send('PATCH', '/v1/me', { username: 'Trout', bio: 'fly fishing', country: 'us' })
      for (const name of ['Trout', 'trout', 'TROUT']) {
        const response = await get(`/v1/users/${name}`, {})
        expect(response.status).toBe(200)
        expect(await response.json()).toMatchObject({
          username: 'Trout',
          bio: 'fly fishing',
          country: 'US',
        })
      }
    })

    it('carries the picture but never the address', async () => {
      await send('PATCH', '/v1/me', { username: 'kestrel' })
      const body = await (await get('/v1/users/kestrel', {})).text()
      expect(body).toContain('avatarSeed')
      expect(body).not.toContain('nick@example.com')
    })

    it('lists their games, newest first', async () => {
      await send('PATCH', '/v1/me', { username: 'heron' })
      await send('POST', '/v1/games/import', {
        startedAt: clock.getTime() - 120_000,
        finishedAt: clock.getTime() - 1000,
        seed: 1,
        difficulty: 'medium',
        source: 'web',
        config: { ...CONFIG },
        boards: [BOARD],
        words: [],
        rounds: 3,
      })
      const { games } = (await (await get('/v1/users/heron/games', {})).json()) as {
        games: unknown[]
      }
      expect(games).toHaveLength(1)
    })

    it('honours a limit on the public listing too', async () => {
      await send('PATCH', '/v1/me', { username: 'wren' })
      for (let i = 0; i < 3; i += 1) {
        await send('POST', '/v1/games/import', {
          startedAt: clock.getTime() - 120_000,
          finishedAt: clock.getTime() - 1000 * (i + 1),
          seed: i,
          difficulty: 'medium',
          source: 'web',
          config: { ...CONFIG },
          boards: [BOARD],
          words: [],
          rounds: 3,
        })
      }
      const count = async (query: string): Promise<number> =>
        ((await (await get(`/v1/users/wren/games${query}`, {})).json()) as { games: unknown[] })
          .games.length
      expect(await count('?limit=2')).toBe(2)
      expect(await count('?limit=nonsense')).toBe(3)
    })

    it('is 404 for a name nobody has', async () => {
      expect((await get('/v1/users/nobody-at-all', {})).status).toBe(404)
      expect((await get('/v1/users/nobody-at-all/games', {})).status).toBe(404)
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

describe('the public routes under a rate limit', () => {
  /*
   * The wiring rather than the limiter, which `rateLimit.test.ts` covers on its own. What is
   * worth asserting here is that the limit is attached to the public prefix and not to anything
   * else: a limit that also caught `/v1/me` would throttle somebody using their own account.
   */
  it('refuses a caller past the limit, and leaves the signed-in routes alone', async () => {
    const store = fakeStore()
    const mailer = capturingMailer()
    const clock = new Date('2026-09-15T00:00:00Z')
    const app = createApp({
      auth: {
        store,
        mailer,
        now: () => clock,
        secureCookies: false,
        publicLimit: { limit: 2, windowMs: 60_000 },
      },
    })
    const caller = { headers: { 'x-forwarded-for': '203.0.113.7' } }

    // Unknown names, so these are 404s: the limit counts requests rather than successes, which
    // is the point when the thing being slowed down is somebody guessing names.
    expect((await app.request('/v1/users/nobody', caller)).status).toBe(404)
    expect((await app.request('/v1/users/nobody-else', caller)).status).toBe(404)
    expect((await app.request('/v1/users/a-third', caller)).status).toBe(429)

    // Nothing outside the public prefix is affected.
    expect((await app.request('/v1/me', caller)).status).toBe(401)
  })

  it('is absent when the deployment cannot identify a caller', async () => {
    const app = createApp({
      auth: {
        store: fakeStore(),
        mailer: capturingMailer(),
        now: () => new Date('2026-09-15T00:00:00Z'),
        secureCookies: false,
      },
    })
    const caller = { headers: { 'x-forwarded-for': '203.0.113.7' } }
    for (let n = 0; n < 5; n += 1) {
      expect((await app.request('/v1/users/nobody', caller)).status).toBe(404)
    }
  })
})
