import { beforeEach, describe, expect, it } from 'vitest'
import { configFor } from '@blinkered/engine'
import { createApp } from '../src/app.js'
import { REASON_MAX, parseReport } from '../src/account/reporting.js'
import { capturingMailer, fakeStore } from './fake.js'

/**
 * The player's half of moderation.
 *
 * docs/ACCOUNTS.md settles why it exists: a blocklist cannot work across fifty-one languages, so
 * what defends a username and a bio is somebody reporting them and somebody able to act. The
 * `reports` table has existed since the first migration with nothing writing to it.
 */

const JSON_HEADERS = { 'content-type': 'application/json' }
const CONFIG = configFor('medium', { language: 'en' })

describe('reading a report body', () => {
  it('takes a field, a subject, and a reason', () => {
    const parsed = parseReport({ field: 'bio', username: ' trout ', reason: ' spam ' })
    expect(parsed).toEqual({
      ok: true,
      report: { field: 'bio', username: 'trout', gameId: null, reason: 'spam' },
    })
  })

  it('wants an object', () => {
    for (const body of [null, 'bio', 42, ['bio']]) {
      expect(parseReport(body)).toEqual({ ok: false, problem: 'not-an-object' })
    }
  })

  it('wants one of the three fields there are', () => {
    // Three, because there are three free-text surfaces. A fourth would be a column change.
    for (const field of [undefined, 42, 'avatar', '']) {
      expect(parseReport({ field, username: 'trout' })).toEqual({
        ok: false,
        problem: 'bad-field',
      })
    }
  })

  it('wants a person for a report about a person', () => {
    for (const field of ['username', 'bio']) {
      expect(parseReport({ field })).toEqual({ ok: false, problem: 'no-subject' })
      // A value of the wrong type reads as absent, the same collapse `profile.ts` makes.
      expect(parseReport({ field, username: 42 })).toEqual({ ok: false, problem: 'no-subject' })
    }
  })

  it('wants a game for a report about a score', () => {
    expect(parseReport({ field: 'score' })).toEqual({ ok: false, problem: 'no-game' })
    expect(parseReport({ field: 'score', username: 'trout' })).toEqual({
      ok: false,
      problem: 'no-game',
    })
  })

  it('keeps both ends when both are given', () => {
    // A score reported from a profile page is still a report about that game, and the queue is
    // better for knowing where it came from.
    const parsed = parseReport({ field: 'score', gameId: 'abc', username: 'trout' })
    expect(parsed.ok && parsed.report).toEqual({
      field: 'score',
      username: 'trout',
      gameId: 'abc',
      reason: null,
    })
  })

  it('needs no reason at all', () => {
    const parsed = parseReport({ field: 'username', username: 'trout' })
    expect(parsed.ok && parsed.report.reason).toBeNull()
    // Blank and absent are one answer: a form somebody left empty said nothing.
    const blank = parseReport({ field: 'username', username: 'trout', reason: '   ' })
    expect(blank.ok && blank.report.reason).toBeNull()
  })

  it('bounds the reason, in code points rather than bytes', () => {
    const emoji = '🐟'.repeat(REASON_MAX + 1)
    expect(parseReport({ field: 'bio', username: 'trout', reason: emoji })).toEqual({
      ok: false,
      problem: 'reason-too-long',
    })
    expect(
      parseReport({ field: 'bio', username: 'trout', reason: '🐟'.repeat(REASON_MAX) }).ok,
    ).toBe(true)
  })

  it('refuses a reason that is not text', () => {
    // C0, C1 and the direction overrides, which are what let a string lie about itself.
    expect(parseReport({ field: 'bio', username: 'trout', reason: 'a‮b' })).toEqual({
      ok: false,
      problem: 'reason-has-control',
    })
  })
})

describe('filing one', () => {
  let store: ReturnType<typeof fakeStore>
  let mailer: ReturnType<typeof capturingMailer>
  let app: ReturnType<typeof createApp>
  let clock: Date
  let cookie: string

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

  const send = async (
    body: unknown,
    headers: Record<string, string> = { cookie },
  ): Promise<Response> =>
    app.request('/v1/reports', {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...headers },
      body: JSON.stringify(body),
    })

  /** Somebody to object to, and a finished game of theirs to object to. */
  const someoneElse = async (): Promise<{ username: string; gameId: string }> => {
    const theirs = await signIn('other@example.com')
    const me = (await (await app.request('/v1/me', { headers: { cookie: theirs } })).json()) as {
      username: string
    }
    const kept = await app.request('/v1/games/import', {
      method: 'POST',
      headers: { ...JSON_HEADERS, cookie: theirs },
      body: JSON.stringify({
        startedAt: clock.getTime() - 60_000,
        finishedAt: clock.getTime(),
        seed: 7,
        difficulty: 'medium',
        source: 'web',
        config: CONFIG,
        boards: [{ tiles: 'A B C D E F G H I J K L' }],
        words: [{ word: 'CAB', round: 0, flips: 3, tick: 4 }],
        rounds: 1,
        guest: false,
      }),
    })
    const { id } = (await kept.json()) as { id: string }
    return { username: me.username, gameId: id }
  }

  beforeEach(async () => {
    store = fakeStore()
    mailer = capturingMailer()
    clock = new Date('2026-09-15T12:00:00Z')
    app = createApp({ auth: { store, mailer, now: () => clock, secureCookies: false } })
    cookie = await signIn('nick@example.com')
  })

  it('is 401 for a stranger', async () => {
    // Deliberate, and a cost: an anonymous button would collect more reports, and a queue
    // nobody can be held to is a queue of noise.
    expect((await send({ field: 'bio', username: 'trout' }, {})).status).toBe(401)
  })

  it('refuses a body it cannot read, and says which part', async () => {
    const response = await send({ field: 'nothing' })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'bad-report', problem: 'bad-field' })
  })

  it('refuses a body that is not JSON at all', async () => {
    const response = await app.request('/v1/reports', {
      method: 'POST',
      headers: { ...JSON_HEADERS, cookie },
      body: 'not json',
    })
    expect(response.status).toBe(400)
  })

  it('writes a report about a name', async () => {
    const { username } = await someoneElse()
    const response = await send({ field: 'username', username, reason: 'a slur in Cyrillic' })
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ filed: true })

    const [filed] = store.reports
    expect(filed?.field).toBe('username')
    expect(filed?.reason).toBe('a slur in Cyrillic')
    expect(filed?.subjectGameId).toBeNull()
    expect(filed?.subjectUserId).not.toBeNull()
  })

  it('writes a report about a score, and records whose score it was', async () => {
    // The owner as well as the game, because "has this person done this before" is the question
    // a queue holding only game ids could not answer.
    const { gameId } = await someoneElse()
    expect((await send({ field: 'score', gameId })).status).toBe(201)
    const [filed] = store.reports
    expect(filed?.subjectGameId).toBe(gameId)
    expect(filed?.subjectUserId).not.toBeNull()
  })

  it('is 404 for a name nobody has and a game nobody played', async () => {
    expect((await send({ field: 'bio', username: 'nobody' })).status).toBe(404)
    expect((await send({ field: 'score', gameId: 'nosuchgame' })).status).toBe(404)
  })

  it('refuses a report about yourself', async () => {
    const me = (await (await app.request('/v1/me', { headers: { cookie } })).json()) as {
      username: string
    }
    const response = await send({ field: 'bio', username: me.username })
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'self-report' })
  })

  it('takes one open report per person per subject, and says the second one worked too', async () => {
    // 200 rather than 409. From where the person is standing they reported it and it is
    // reported; telling them the difference would only invite a third attempt.
    const { username } = await someoneElse()
    expect((await send({ field: 'bio', username })).status).toBe(201)
    const again = await send({ field: 'bio', username })
    expect(again.status).toBe(200)
    expect(await again.json()).toEqual({ filed: false })
    expect(store.reports).toHaveLength(1)

    // A different field about the same person is a different objection.
    expect((await send({ field: 'username', username })).status).toBe(201)
    expect(store.reports).toHaveLength(2)
  })
})
