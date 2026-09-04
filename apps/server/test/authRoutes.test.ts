import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { authRoutes } from '../src/auth/routes.js'
import type { AuthDeps } from '../src/auth/routes.js'
import type { AuthStore, StoredCode } from '../src/auth/types.js'
import type { LoginMail, Mailer } from '../src/auth/mail.js'
import { MAX_ATTEMPTS, MAX_CODES_PER_WINDOW } from '../src/auth/policy.js'
import { isGeneratedUsername } from '../src/auth/usernames.js'

/**
 * A store made of Maps.
 *
 * The point of the port is that these tests assert facts about the flow — that a spent code
 * cannot be spent twice, that a wrong guess costs an attempt and a dead one does not — rather
 * than facts about SQL. The Postgres implementation is checked by the integration suite.
 */
function fakeStore(): AuthStore & {
  codes: Map<string, StoredCode & { email: string }>
  users: Map<string, { email: string; username: string }>
  sessions: Map<string, { userId: string; expiresAt: Date }>
  issued: { id: string; email: string; at: Date }[]
  takenUsernames: Set<string>
} {
  const codes = new Map<string, StoredCode & { email: string }>()
  const users = new Map<string, { email: string; username: string }>()
  const sessions = new Map<string, { userId: string; expiresAt: Date }>()
  const issued: { id: string; email: string; at: Date }[] = []
  const takenUsernames = new Set<string>()

  return {
    codes,
    users,
    sessions,
    issued,
    takenUsernames,
    countCodesSince: (email, since) =>
      Promise.resolve(issued.filter((i) => i.email === email && i.at >= since).length),
    insertCode: (row) => {
      codes.set(row.id, {
        ...row,
        attempts: 0,
        consumedAt: null,
      })
      issued.push({ id: row.id, email: row.email, at: new Date() })
      return Promise.resolve()
    },
    latestCode: (email) => {
      const live = [...codes.values()].filter((c) => c.email === email && c.consumedAt === null)
      return Promise.resolve(live.at(-1) ?? null)
    },
    deleteCode: (id) => {
      codes.delete(id)
      const at = issued.findIndex((i) => i.id === id)
      if (at !== -1) issued.splice(at, 1)
      return Promise.resolve()
    },
    recordAttempt: (id) => {
      const row = codes.get(id)
      if (row !== undefined) codes.set(id, { ...row, attempts: row.attempts + 1 })
      return Promise.resolve()
    },
    consumeCode: (id, at) => {
      const row = codes.get(id)
      if (row !== undefined) codes.set(id, { ...row, consumedAt: at })
      return Promise.resolve()
    },
    userIdForEmail: (email) => {
      const found = [...users.entries()].find(([, u]) => u.email === email)
      return Promise.resolve(found?.[0] ?? null)
    },
    createUser: ({ id, email, username }) => {
      if (takenUsernames.has(username)) return Promise.resolve(null)
      takenUsernames.add(username)
      users.set(id, { email, username })
      return Promise.resolve(id)
    },
    findSession: (id, now) => {
      const row = sessions.get(id)
      if (row === undefined || row.expiresAt <= now) return Promise.resolve(null)
      const user = users.get(row.userId)
      if (user === undefined) return Promise.resolve(null)
      return Promise.resolve({ userId: row.userId, username: user.username })
    },
    createSession: (row) => {
      sessions.set(row.id, { userId: row.userId, expiresAt: row.expiresAt })
      return Promise.resolve()
    },
  }
}

function capturingMailer(): Mailer & { sent: LoginMail[] } {
  const sent: LoginMail[] = []
  return {
    sent,
    send: (mail) => {
      sent.push(mail)
      return Promise.resolve()
    },
  }
}

describe('signing in with a code', () => {
  let store: ReturnType<typeof fakeStore>
  let mailer: ReturnType<typeof capturingMailer>
  let app: ReturnType<typeof authRoutes>
  let clock: Date

  const deps = (): AuthDeps => ({
    store,
    mailer,
    now: () => clock,
    secureCookies: false,
  })

  const post = async (path: string, body: unknown): Promise<Response> =>
    app.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  beforeEach(() => {
    store = fakeStore()
    mailer = capturingMailer()
    clock = new Date('2026-09-04T00:00:00Z')
    app = authRoutes(deps())
  })

  const signIn = async (email: string): Promise<Response> => {
    await post('/code', { email })
    const code = mailer.sent.at(-1)?.code as string
    return post('/code/verify', { email, code })
  }

  it('sends a code and says nothing about who the address belongs to', async () => {
    const response = await post('/code', { email: 'nick@example.com' })
    expect(response.status).toBe(202)
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0]?.to).toBe('nick@example.com')
  })

  it('normalizes the address, so one mailbox is one account', async () => {
    await post('/code', { email: '  Nick@Example.COM ' })
    expect(mailer.sent[0]?.to).toBe('nick@example.com')
  })

  it('tells somebody who mistyped their address, since nobody enumerates with that', async () => {
    const response = await post('/code', { email: 'not-an-address' })
    expect(response.status).toBe(400)
    expect(mailer.sent).toHaveLength(0)
  })

  it('survives a request that is not JSON at all', async () => {
    const response = await app.request('/code', { method: 'POST', body: 'not json' })
    expect(response.status).toBe(400)
  })

  it('creates the account on first sign-in, with a name it can already use', async () => {
    const response = await signIn('nick@example.com')
    expect(response.status).toBe(200)
    expect(store.users.size).toBe(1)
    const created = [...store.users.values()][0]
    expect(isGeneratedUsername(created?.username ?? '')).toBe(true)
    expect(created?.email).toBe('nick@example.com')
  })

  it('signs an existing account in rather than making a second one', async () => {
    await signIn('nick@example.com')
    await signIn('nick@example.com')
    expect(store.users.size).toBe(1)
    expect(store.sessions.size).toBe(2)
  })

  it('sets a session cookie the browser will actually return', async () => {
    const response = await signIn('nick@example.com')
    const cookie = response.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('blinkered_session=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    // Development is plain HTTP behind Caddy, where a Secure cookie is accepted and never sent
    // back, which looks exactly like a session that will not stick.
    expect(cookie).not.toContain('Secure')
  })

  it('marks the cookie Secure by default, so production does not depend on remembering', async () => {
    app = authRoutes({ store, mailer, now: () => clock })
    const response = await signIn('nick@example.com')
    expect(response.headers.get('set-cookie') ?? '').toContain('Secure')
  })

  it('never stores the token it handed out', async () => {
    const response = await signIn('nick@example.com')
    const token = /blinkered_session=([^;]+)/.exec(response.headers.get('set-cookie') ?? '')?.[1]
    expect(token).toBeDefined()
    expect([...store.sessions.keys()]).not.toContain(token)
  })

  it('refuses a wrong code, and charges it an attempt', async () => {
    await post('/code', { email: 'nick@example.com' })
    const response = await post('/code/verify', { email: 'nick@example.com', code: '000000' })
    expect(response.status).toBe(401)
    expect([...store.codes.values()][0]?.attempts).toBe(1)
    expect(store.sessions.size).toBe(0)
  })

  it('will not spend the same code twice', async () => {
    await post('/code', { email: 'nick@example.com' })
    const code = mailer.sent[0]?.code as string
    expect((await post('/code/verify', { email: 'nick@example.com', code })).status).toBe(200)
    expect((await post('/code/verify', { email: 'nick@example.com', code })).status).toBe(401)
    expect(store.sessions.size).toBe(1)
  })

  it('says the same thing whether the address was ever sent a code', async () => {
    // Otherwise this endpoint reports whether an address has an account.
    const stranger = await post('/code/verify', { email: 'nobody@example.com', code: '123456' })
    await post('/code', { email: 'nick@example.com' })
    const wrong = await post('/code/verify', { email: 'nick@example.com', code: '000000' })
    expect(stranger.status).toBe(wrong.status)
    expect(await stranger.json()).toEqual(await wrong.json())
  })

  it('stops charging attempts once the code is dead', async () => {
    await post('/code', { email: 'nick@example.com' })
    for (let i = 0; i < MAX_ATTEMPTS + 3; i += 1) {
      await post('/code/verify', { email: 'nick@example.com', code: '000000' })
    }
    // Counting past the limit changes nothing and writes on every request somebody sends.
    expect([...store.codes.values()][0]?.attempts).toBe(MAX_ATTEMPTS)
  })

  it('refuses the right code once the attempts are spent', async () => {
    await post('/code', { email: 'nick@example.com' })
    const code = mailer.sent[0]?.code as string
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      await post('/code/verify', { email: 'nick@example.com', code: '000000' })
    }
    expect((await post('/code/verify', { email: 'nick@example.com', code })).status).toBe(401)
  })

  it('refuses a code that has expired', async () => {
    await post('/code', { email: 'nick@example.com' })
    const code = mailer.sent[0]?.code as string
    clock = new Date(clock.getTime() + 60 * 60 * 1000)
    expect((await post('/code/verify', { email: 'nick@example.com', code })).status).toBe(401)
  })

  it('rejects a malformed code without looking anything up', async () => {
    await post('/code', { email: 'nick@example.com' })
    const response = await post('/code/verify', { email: 'nick@example.com', code: 'abc' })
    expect(response.status).toBe(400)
    expect([...store.codes.values()][0]?.attempts).toBe(0)
  })

  it('stops sending after the limit, and still says 202', async () => {
    for (let i = 0; i < MAX_CODES_PER_WINDOW + 2; i += 1) {
      const response = await post('/code', { email: 'nick@example.com' })
      expect(response.status).toBe(202)
    }
    // The limit is on the mail, because an address somebody else can make us flood is an
    // address we are being used to harass.
    expect(mailer.sent).toHaveLength(MAX_CODES_PER_WINDOW)
  })

  it('retries past a username somebody already has', async () => {
    // The retry is against the unique index rather than a lookup, because a check followed by
    // an insert is a race. Every generated name is taken here except by exhaustion.
    let calls = 0
    const store2 = fakeStore()
    const original = store2.createUser.bind(store2)
    store2.createUser = (input) => {
      calls += 1
      return calls === 1 ? Promise.resolve(null) : original(input)
    }
    app = authRoutes({ store: store2, mailer, now: () => clock, secureCookies: false })
    await post('/code', { email: 'nick@example.com' })
    const code = mailer.sent[0]?.code as string
    const response = await post('/code/verify', { email: 'nick@example.com', code })
    expect(response.status).toBe(200)
    expect(calls).toBe(2)
  })

  it('gives up rather than looping forever when no name can be had', async () => {
    const store3 = fakeStore()
    store3.createUser = () => Promise.resolve(null)
    app = authRoutes({ store: store3, mailer, now: () => clock, secureCookies: false })
    await post('/code', { email: 'nick@example.com' })
    const code = mailer.sent[0]?.code as string
    const response = await post('/code/verify', { email: 'nick@example.com', code })
    expect(response.status).toBe(503)
  })

  it('spends the code before making the account, so a failure leaves nothing live', async () => {
    const store4 = fakeStore()
    store4.createUser = () => Promise.resolve(null)
    app = authRoutes({ store: store4, mailer, now: () => clock, secureCookies: false })
    await post('/code', { email: 'nick@example.com' })
    const code = mailer.sent[0]?.code as string
    await post('/code/verify', { email: 'nick@example.com', code })
    // Asking for another code is a smaller problem than a code that survived being used.
    expect([...store4.codes.values()][0]?.consumedAt).not.toBeNull()
  })
})

describe('bodies that are not what the route hoped for', () => {
  let store: ReturnType<typeof fakeStore>
  let mailer: ReturnType<typeof capturingMailer>
  let app: ReturnType<typeof authRoutes>

  beforeEach(() => {
    store = fakeStore()
    mailer = capturingMailer()
    app = authRoutes({ store, mailer, secureCookies: false })
  })

  const post = async (path: string, body: unknown): Promise<Response> =>
    app.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('defaults the locale when none is sent', async () => {
    await post('/code', { email: 'nick@example.com' })
    expect(mailer.sent[0]?.locale).toBe('en')
  })

  it('takes the locale when one is', async () => {
    await post('/code', { email: 'nick@example.com', locale: 'el' })
    // The code has to arrive in the language they read. It is the one message in the product
    // that cannot be shrugged off, because it is the one they need in order to get in.
    expect(mailer.sent[0]?.locale).toBe('el')
  })

  it('treats a field of the wrong type as absent rather than trusting it', async () => {
    for (const body of [{ email: 42 }, { email: null }, { email: { toString: 'no' } }, {}]) {
      expect((await post('/code', body)).status).toBe(400)
    }
    for (const body of [
      { email: 'nick@example.com', code: 123456 },
      { email: 'nick@example.com' },
      { email: [], code: '123456' },
    ]) {
      expect((await post('/code/verify', body)).status).toBe(400)
    }
    expect(mailer.sent).toHaveLength(0)
  })
})

describe('who am I', () => {
  it('answers with the account the cookie belongs to, and round-trips a real sign-in', async () => {
    const store = fakeStore()
    const mailer = capturingMailer()
    const app = createApp({ auth: { store, mailer, secureCookies: false } })
    const json = { 'content-type': 'application/json' }

    await app.request('/v1/auth/code', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ email: 'nick@example.com' }),
    })
    const verified = await app.request('/v1/auth/code/verify', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ email: 'nick@example.com', code: mailer.sent[0]?.code }),
    })
    const cookie = (verified.headers.get('set-cookie') ?? '').split(';')[0] as string

    const me = await app.request('/v1/me', { headers: { cookie } })
    expect(me.status).toBe(200)
    expect(((await me.json()) as { username: string }).username).toMatch(/^[a-z]+-[a-z]+-\d{4}$/)
  })

  it('is 401 for no cookie, an unknown one, and a spoiled one alike', async () => {
    // One thing for the client to branch on. Telling them apart describes somebody else's
    // session back to whoever is guessing at it.
    const app = createApp({ auth: { store: fakeStore(), mailer: capturingMailer() } })
    for (const headers of [
      {},
      { cookie: 'blinkered_session=' },
      { cookie: 'blinkered_session=x' },
    ]) {
      expect((await app.request('/v1/me', { headers })).status).toBe(401)
    }
  })
})

describe('a send that fails', () => {
  it('leaves no code behind and costs nothing against the limit', async () => {
    // The bug this exists for: the row is written before the mail goes, so two failed sends
    // spent two of three slots and locked the address out of a relay that had since been fixed.
    const store = fakeStore()
    const app = authRoutes({
      store,
      mailer: { send: () => Promise.reject(new Error('421 try again later')) },
      secureCookies: false,
    })
    const ask = async (): Promise<number> =>
      (
        await app.request('/code', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'nick@example.com' }),
        })
      ).status

    for (let i = 0; i < MAX_CODES_PER_WINDOW + 2; i += 1) expect(await ask()).toBe(500)
    // No live code nobody has, and no slot spent.
    expect(store.codes.size).toBe(0)
    expect(await store.countCodesSince('nick@example.com', new Date(0))).toBe(0)
  })

  it('still lets a working send through afterwards', async () => {
    const store = fakeStore()
    let broken = true
    const sent: string[] = []
    const app = authRoutes({
      store,
      mailer: {
        send: (mail) => {
          if (broken) return Promise.reject(new Error('421'))
          sent.push(mail.code)
          return Promise.resolve()
        },
      },
      secureCookies: false,
    })
    const ask = async (): Promise<Response> =>
      app.request('/code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'nick@example.com' }),
      })

    for (let i = 0; i < 4; i += 1) await ask()
    broken = false
    expect((await ask()).status).toBe(202)
    expect(sent).toHaveLength(1)
  })
})
