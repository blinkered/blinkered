import { beforeEach, describe, expect, it } from 'vitest'
import { configFor } from '@blinkered/engine'
import { createApp } from '../src/app.js'
import { MAX_ATTEMPTS } from '../src/auth/policy.js'
import { capturingMailer, fakeStore, makeAdmin } from './fake.js'
import type { FakeUser } from './fake.js'

/**
 * Deleting your own account.
 *
 * App Store guideline 5.1.1(v) is why it exists at all, and its support page is why it is a real
 * delete rather than the ban an admin applies: "only offering to temporarily deactivate or
 * disable an account is insufficient".
 *
 * Two things are asserted harder than the rest, because they are the ones that would be quietly
 * wrong. The cascade has to take the games and leave the reports. And `reason` has to be gone,
 * because nulling a foreign key does not remove a name from prose.
 */

const JSON_HEADERS = { 'content-type': 'application/json' }
const CONFIG = configFor('medium', { language: 'en' })
const FACES = 'A B C D E F G H I J K L'

describe('deleting your own account', () => {
  let store: ReturnType<typeof fakeStore>
  let mailer: ReturnType<typeof capturingMailer>
  let app: ReturnType<typeof createApp>
  let clock: Date
  let cookie: string
  let me: FakeUser
  let theirs: string
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
    if (found === undefined) throw new Error('signed in as nobody')
    return found
  }

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

  /** Asks for a deletion code and hands back the six digits that were mailed. */
  const askForCode = async (session = cookie): Promise<string> => {
    const asked = await send('POST', '/v1/me/deletion-code', {}, { cookie: session })
    expect(asked.status).toBe(202)
    return mailer.sent.at(-1)?.code as string
  }

  const keepGame = async (session: string): Promise<string> => {
    const response = await app.request('/v1/games/import', {
      method: 'POST',
      headers: { ...JSON_HEADERS, cookie: session },
      body: JSON.stringify({
        startedAt: clock.getTime() - 60_000,
        finishedAt: clock.getTime(),
        seed: 7,
        difficulty: 'medium',
        source: 'web',
        config: CONFIG,
        boards: [{ tiles: FACES }],
        words: [{ word: 'CABLE', round: 0, flips: 5, tick: 4 }],
        rounds: 1,
        guest: false,
      }),
    })
    const { id } = (await response.json()) as { id: string }
    return id
  }

  beforeEach(async () => {
    store = fakeStore()
    mailer = capturingMailer()
    clock = new Date('2026-09-16T12:00:00Z')
    app = createApp({ auth: { store, mailer, now: () => clock, secureCookies: false } })
    theirs = await signIn('other@example.com')
    them = await whoIs(theirs)
    cookie = await signIn('nick@example.com')
    me = await whoIs(cookie)
  })

  describe('the code it needs', () => {
    it('mails one to the address on the account', async () => {
      await askForCode()
      // The account's address, not one the request named: letting somebody choose where a
      // deletion code goes is letting them choose who confirms it.
      expect(mailer.sent.at(-1)?.to).toBe('nick@example.com')
    })

    it('is 401 to a stranger', async () => {
      expect((await send('POST', '/v1/me/deletion-code', {}, {})).status).toBe(401)
    })

    it('answers 202 past the rate limit rather than saying it stopped', async () => {
      // Same shape as the sign-in route: whether a code was actually sent is not worth leaking,
      // and here it also stops the button being a way to send yourself mail.
      for (let at = 0; at < 6; at += 1) {
        expect((await send('POST', '/v1/me/deletion-code', {})).status).toBe(202)
      }
    })

    it('says so when the account has no verified address to reach', async () => {
      // The schema allows it: a provider is under no obligation to give us one. Better said
      // plainly than a button that silently never works.
      store.identities.splice(0, store.identities.length)
      const response = await send('POST', '/v1/me/deletion-code', {})
      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ error: 'no-address' })
    })

    it('writes the mail in the language the client is reading', async () => {
      // The client knows and the session does not: `uiLanguage` can be unset on an account that
      // has never said.
      await send('POST', '/v1/me/deletion-code', { locale: 'fi' })
      expect(mailer.sent.at(-1)?.locale).toBe('fi')
      await send('POST', '/v1/me/deletion-code', {})
      expect(mailer.sent.at(-1)?.locale).toBe('en')
    })

    it('takes the code back when the mail does not go', async () => {
      /*
       * The row is written before the send, so that a code can never be in somebody's inbox
       * without being in the table. The cost of that order is this repair: a failed send would
       * otherwise leave a live code nobody has, and spend a slot against the rate limit -- three
       * of those and the address is locked out of a relay that has since been fixed.
       */
      const broken = {
        send: (): Promise<void> => Promise.reject(new Error('the relay said no')),
      }
      const app2 = createApp({
        auth: { store, mailer: broken, now: () => clock, secureCookies: false },
      })
      const before = store.codes.size
      const response = await app2.request('/v1/me/deletion-code', {
        method: 'POST',
        headers: { ...JSON_HEADERS, cookie },
        body: '{}',
      })
      // A 500 rather than a quiet 202: a send that failed is not a code somebody can use, and
      // pretending otherwise leaves them waiting for mail that is not coming.
      expect(response.status).toBe(500)
      expect(store.codes.size).toBe(before)
    })

    it('says so when the deployment cannot send mail at all', async () => {
      // A deployment without a mailer serves the game and cannot verify a deletion. It refuses
      // rather than deleting on a weaker check.
      const mailless = createApp({ auth: { store, now: () => clock } as never })
      const response = await mailless.request('/v1/me/deletion-code', {
        method: 'POST',
        headers: { ...JSON_HEADERS, cookie },
      })
      expect(response.status).toBe(503)
    })
  })

  describe('the deletion itself', () => {
    it('refuses without a code, and refuses a wrong one', async () => {
      expect((await send('DELETE', '/v1/me', {})).status).toBe(400)
      expect((await send('DELETE', '/v1/me', { code: 'abc' })).status).toBe(400)
      await askForCode()
      expect((await send('DELETE', '/v1/me', { code: '000000' })).status).toBe(401)
      // And the account is still there, which is the part that matters about a refusal.
      expect((await send('GET', '/v1/me', undefined)).status).toBe(200)
    })

    it('refuses a code that was never asked for', async () => {
      expect((await send('DELETE', '/v1/me', { code: '123456' })).status).toBe(401)
    })

    it('is 401 to a stranger', async () => {
      expect((await send('DELETE', '/v1/me', { code: '123456' }, {})).status).toBe(401)
    })

    it('spends the code, so the same one cannot delete twice', async () => {
      const code = await askForCode()
      expect((await send('DELETE', '/v1/me', { code })).status).toBe(200)
      // The session died with the row, so this is 401 rather than a second deletion.
      expect((await send('DELETE', '/v1/me', { code })).status).toBe(401)
    })

    it('costs an attempt for a wrong guess and stops counting once it is dead', async () => {
      await askForCode()
      for (let at = 0; at < MAX_ATTEMPTS + 2; at += 1) {
        expect((await send('DELETE', '/v1/me', { code: '000000' })).status).toBe(401)
      }
      // The right code no longer works, because the attempts are spent.
      const stored = [...store.codes.values()].at(-1)
      expect(stored?.attempts).toBe(MAX_ATTEMPTS)
    })

    it('refuses when the account has no verified address to check against', async () => {
      // Asked for while an address was there, then the address goes -- an Apple relay user who
      // revokes forwarding, say. The code cannot be matched to anything, so it is refused rather
      // than accepted on the strength of the session alone.
      const code = await askForCode()
      store.identities.splice(0, store.identities.length)
      const response = await send('DELETE', '/v1/me', { code })
      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ error: 'no-address' })
      expect(store.users.has(me.userId)).toBe(true)
    })

    it('takes the account, the session, the profile and the games with it', async () => {
      const gameId = await keepGame(cookie)
      const code = await askForCode()
      const response = await send('DELETE', '/v1/me', { code })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ deleted: true })

      // Nothing to sign out of: the session went with the row.
      expect((await send('GET', '/v1/me', undefined)).status).toBe(401)
      expect(store.users.has(me.userId)).toBe(false)
      // The profile and the game are gone rather than hidden, which is what 5.1.1(v) asks for.
      expect((await app.request(`/v1/users/${me.username}`)).status).toBe(404)
      expect((await app.request(`/v1/games/${gameId}`)).status).toBe(404)
      expect(store.games).toEqual([])
      // And the name is free again, because the row is really gone.
      expect(store.takenUsernames.has(me.username.toLowerCase())).toBe(false)
    })

    it('frees the way in, so the same address can start over', async () => {
      const code = await askForCode()
      await send('DELETE', '/v1/me', { code })
      expect(store.identities.filter((one) => one.userId === me.userId)).toEqual([])
      // Which is also the ban-evasion hole, and it is not this feature's to close: nothing in
      // the schema recognises a returning account. docs/ACCOUNTS.md says so out loud.
      const again = await signIn('nick@example.com')
      expect((await send('GET', '/v1/me', undefined, { cookie: again })).status).toBe(200)
    })
  })

  describe('what a deletion does to reports', () => {
    /** A report from `them` about `me`, with prose that names the subject. */
    const reportMe = async (field = 'bio'): Promise<void> => {
      const response = await app.request('/v1/reports', {
        method: 'POST',
        headers: { ...JSON_HEADERS, cookie: theirs },
        body: JSON.stringify({
          field,
          username: me.username,
          reason: `${me.username} is posting a slur spelled with Cyrillic characters`,
        }),
      })
      expect(response.status).toBe(201)
    }

    it('keeps the report and erases the person from it', async () => {
      await reportMe()
      const code = await askForCode()
      await send('DELETE', '/v1/me', { code })

      // The row survives, which is the point of `set null` over `cascade`.
      expect(store.reports).toHaveLength(1)
      const [report] = store.reports
      expect(report?.subjectUserId).toBeNull()
      expect(report?.field).toBe('bio')
      // And the reporter is intact, so their record of filing real reports stands.
      expect(report?.reporterUserId).toBe(them.userId)
      /*
       * The part a foreign key cannot do. `reason` is prose the reporter wrote, and it names the
       * subject -- nulling the link would leave "nick-whoever is posting a slur" sitting in a
       * text column. Redaction was considered and refused: usernames are renameable and nothing
       * records the old ones, so the name in a report may be one the account no longer had.
       */
      expect(report?.reason).toBeNull()
    })

    it('leaves reports about other people alone', async () => {
      // Filed by the account that is about to go, about somebody who is staying.
      const response = await app.request('/v1/reports', {
        method: 'POST',
        headers: { ...JSON_HEADERS, cookie },
        body: JSON.stringify({ field: 'bio', username: them.username, reason: 'advertising' }),
      })
      expect(response.status).toBe(201)

      const code = await askForCode()
      await send('DELETE', '/v1/me', { code })

      const [report] = store.reports
      // The reporter is nulled and everything else stands: the objection is about somebody who
      // is still here, so it is still worth reading and still actionable.
      expect(report?.reporterUserId).toBeNull()
      expect(report?.subjectUserId).toBe(them.userId)
      expect(report?.reason).toBe('advertising')
    })

    it('survives as something an admin can still read', async () => {
      await reportMe()
      const code = await askForCode()
      await send('DELETE', '/v1/me', { code })

      // An admin has to exist after the fact, since the one being deleted was not one.
      makeAdmin(store, them.userId)
      const queue = (await (
        await app.request('/v1/admin/reports', { headers: { cookie: theirs } })
      ).json()) as { reports: { subjectUser: unknown; reason: unknown; field: string }[] }
      expect(queue.reports).toHaveLength(1)
      expect(queue.reports[0]?.subjectUser).toBeNull()
      expect(queue.reports[0]?.reason).toBeNull()
      expect(queue.reports[0]?.field).toBe('bio')
    })

    it('takes the game link with the game, without taking the report', async () => {
      const gameId = await keepGame(cookie)
      const response = await app.request('/v1/reports', {
        method: 'POST',
        headers: { ...JSON_HEADERS, cookie: theirs },
        body: JSON.stringify({ field: 'score', gameId, reason: 'impossible in two rounds' }),
      })
      expect(response.status).toBe(201)

      const code = await askForCode()
      await send('DELETE', '/v1/me', { code })

      expect(store.reports).toHaveLength(1)
      // `reason` goes here too, because the report route records the game's owner as the
      // subject -- so a score report is a report about a person as well.
      expect(store.reports[0]?.reason).toBeNull()
      expect(store.reports[0]?.subjectUserId).toBeNull()
    })
  })
})
