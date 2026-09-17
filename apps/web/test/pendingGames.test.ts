import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { drainGames } from '../src/account.js'
import type { GameToKeep } from '../src/account.js'
import { claim, enqueue, newKey, queued, queuedFor, settle } from '../src/pendingGames.js'

/**
 * The upload queue, and the three ways an entry leaves it.
 *
 * The behaviour worth pinning is not "a game uploads" -- that was true before. It is that a game
 * which **fails** to upload stays, that a game the server refuses for good does **not** stay, and
 * that a queue is never drained into the wrong account.
 *
 * The middle one is the one a browser walkthrough would never find: one unparseable submission at
 * the head of the queue, retried forever, blocks every good game behind it. That turns one lost
 * game into all of them.
 */

const KEY = 'blinkered.pending-games.v1'

/** Enough of a submission to be queued. The server parses the real shape; this store does not. */
const GAME = { seed: 4821, difficulty: 'medium', source: 'web' } as unknown as GameToKeep

function fakeStorage(options: { refuses?: boolean } = {}): Storage {
  const held = new Map<string, string>()
  const refuse = (): never => {
    throw new DOMException('denied', 'SecurityError')
  }
  return {
    get length() {
      return held.size
    },
    clear: () => {
      held.clear()
    },
    key: (at: number) => [...held.keys()][at] ?? null,
    getItem: (key: string) => (options.refuses === true ? refuse() : (held.get(key) ?? null)),
    setItem: (key: string, value: string) => {
      if (options.refuses === true) refuse()
      held.set(key, value)
    },
    removeItem: (key: string) => {
      if (options.refuses === true) refuse()
      held.delete(key)
    },
  }
}

function use(storage: Storage): void {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

/** A `fetch` that answers each call from a list, so a drain of several can be scripted. */
function answeringInTurn(
  replies: readonly ({ status: number; body?: unknown } | 'unreachable')[],
): typeof fetch {
  let at = 0
  return vi.fn((): Promise<Response> => {
    const reply = replies[Math.min(at, replies.length - 1)]
    at += 1
    if (reply === undefined || reply === 'unreachable') {
      return Promise.reject(new TypeError('Failed to fetch'))
    }
    return Promise.resolve(
      new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
        status: reply.status,
        headers: { 'content-type': 'application/json' },
      }),
    )
  })
}

describe('the queue itself', () => {
  let storage: Storage

  beforeEach(() => {
    storage = fakeStorage()
    use(storage)
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('gives each game a distinct key', () => {
    const keys = new Set(Array.from({ length: 200 }, () => newKey()))
    expect(keys.size).toBe(200)
    expect([...keys][0]).toMatch(/^[0-9a-f]{32}$/)
  })

  it('holds a game and hands back its key', () => {
    const entry = enqueue('u_1', GAME)
    expect(queued()).toHaveLength(1)
    expect(queued()[0]?.key).toBe(entry.key)
    expect(queued()[0]?.userId).toBe('u_1')
  })

  it('keeps them oldest first', () => {
    const first = enqueue('u_1', GAME)
    const second = enqueue('u_1', GAME)
    expect(queued().map((one) => one.key)).toEqual([first.key, second.key])
  })

  it('separates one account from another on the same device', () => {
    enqueue('u_1', GAME)
    const theirs = enqueue('u_2', GAME)
    expect(queuedFor('u_1')).toHaveLength(1)
    expect(queuedFor('u_2')).toEqual([expect.objectContaining({ key: theirs.key })])
    expect(queuedFor('u_3')).toEqual([])
  })

  /*
   * The guest's game, and the bug that made this necessary.
   *
   * Signing in with Google or Apple is a full page navigation: away to the provider and back to
   * `/?signin=ok`, with the app torn down and rebuilt. The upload used to be reached from the
   * finished game in React state, which does not survive that, so a guest who signed in through
   * a provider to keep their game lost it every time -- silently, and only through a provider,
   * because the email code keeps the page alive.
   *
   * An unclaimed entry survives because it is in storage. These are the tests that would fail if
   * the owner requirement came back.
   */
  it('holds a guest game with no owner', () => {
    const entry = enqueue(null, GAME)
    expect(queued()[0]?.userId).toBeNull()
    // And it is sent for nobody until it is claimed.
    expect(queuedFor('u_1')).toEqual([])
    expect(entry.key).toBeTruthy()
  })

  it('hands every unclaimed game to whoever signs in', () => {
    enqueue(null, GAME)
    enqueue(null, GAME)
    expect(claim('u_1')).toBe(2)
    expect(queuedFor('u_1')).toHaveLength(2)
    expect(queued().every((one) => one.userId === 'u_1')).toBe(true)
  })

  it('leaves an owned game with its owner when somebody else claims', () => {
    // The case the owner field exists for: one device, two people over its life.
    enqueue('u_1', GAME)
    enqueue(null, GAME)
    expect(claim('u_2')).toBe(1)
    expect(queuedFor('u_1')).toHaveLength(1)
    expect(queuedFor('u_2')).toHaveLength(1)
  })

  it('claims nothing, and says so, when there is nothing unclaimed', () => {
    enqueue('u_1', GAME)
    expect(claim('u_1')).toBe(0)
    expect(queuedFor('u_1')).toHaveLength(1)
  })

  it('drops an unclaimed game that waited too long, rather than adopting it', () => {
    /*
     * The shared-machine case. A guest's game belongs to the person who just played it, and
     * after half an hour the next person to sign in is not reliably that person.
     */
    const entry = enqueue(null, GAME)
    const hourLater = Date.now() + 60 * 60 * 1000
    expect(claim('u_2', hourLater)).toBe(0)
    expect(queued().map((one) => one.key)).not.toContain(entry.key)
    expect(queuedFor('u_2')).toEqual([])
  })

  it('claims one still inside the window', () => {
    const entry = enqueue(null, GAME)
    const soon = Date.now() + 5 * 60 * 1000
    expect(claim('u_1', soon)).toBe(1)
    expect(queuedFor('u_1').map((one) => one.key)).toEqual([entry.key])
  })

  it('reads a stored unclaimed entry back, so a reload does not discard it', () => {
    // The whole point: this shape has to survive being written before a navigation and read
    // after one. A validator that insisted on a string owner would drop it here.
    storage.setItem(KEY, JSON.stringify([{ key: 'k1', userId: null, game: GAME, at: Date.now() }]))
    expect(queued()).toHaveLength(1)
    expect(claim('u_1')).toBe(1)
  })

  it('drops one by key and leaves the rest', () => {
    const first = enqueue('u_1', GAME)
    const second = enqueue('u_1', GAME)
    settle(first.key)
    expect(queued().map((one) => one.key)).toEqual([second.key])
  })

  it('drops the oldest once it is full, rather than growing without bound', () => {
    const first = enqueue('u_1', GAME)
    for (let n = 0; n < 200; n += 1) enqueue('u_1', GAME)
    const all = queued()
    expect(all).toHaveLength(200)
    expect(all.map((one) => one.key)).not.toContain(first.key)
  })

  it.each([
    ['not an array', '{"key":"a"}'],
    ['not JSON', 'nonsense {'],
  ])('reads a store that is %s as empty', (_what, raw) => {
    storage.setItem(KEY, raw)
    expect(queued()).toEqual([])
  })

  it('discards entries of the wrong shape and keeps the rest', () => {
    const good = { key: 'k1', userId: 'u_1', game: GAME, at: 1 }
    storage.setItem(
      KEY,
      JSON.stringify([
        good,
        { key: '', userId: 'u_1', game: GAME, at: 1 },
        { key: 'k2', userId: '', game: GAME, at: 1 },
        { key: 'k3', userId: 'u_1', game: null, at: 1 },
        { key: 'k4', userId: 'u_1', game: GAME, at: 'soon' },
        'not an object',
        null,
      ]),
    )
    expect(queued().map((one) => one.key)).toEqual(['k1'])
  })

  it('survives a storage that refuses', () => {
    use(fakeStorage({ refuses: true }))
    expect(() => enqueue('u_1', GAME)).not.toThrow()
    expect(queued()).toEqual([])
    expect(() => {
      settle('whatever')
    }).not.toThrow()
  })
})

describe('draining the queue', () => {
  beforeEach(() => {
    use(fakeStorage())
  })

  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('sends nothing and claims nothing when the queue is empty', async () => {
    const fetching = answeringInTurn([{ status: 201, body: { id: 'g1', score: 10 } }])
    globalThis.fetch = fetching
    await expect(drainGames('u_1')).resolves.toEqual({ stored: new Map(), left: 0 })
    expect(fetching).not.toHaveBeenCalled()
  })

  it('stores a game and drops it from the queue', async () => {
    const entry = enqueue('u_1', GAME)
    globalThis.fetch = answeringInTurn([{ status: 201, body: { id: 'g1', score: 10 } }])
    const drained = await drainGames('u_1')
    expect(drained.stored.get(entry.key)).toBe('g1')
    expect(drained.left).toBe(0)
    expect(queued()).toEqual([])
  })

  it('treats a 200 as stored, which is what a retry of a stored game answers', async () => {
    const entry = enqueue('u_1', GAME)
    globalThis.fetch = answeringInTurn([{ status: 200, body: { id: 'g-already', score: 10 } }])
    const drained = await drainGames('u_1')
    expect(drained.stored.get(entry.key)).toBe('g-already')
    expect(queued()).toEqual([])
  })

  it('sends the key with the game, which is what makes the retry safe', async () => {
    const entry = enqueue('u_1', GAME)
    const fetching = answeringInTurn([{ status: 201, body: { id: 'g1', score: 10 } }])
    globalThis.fetch = fetching
    await drainGames('u_1')
    const sent = JSON.parse(
      (fetching as unknown as { mock: { calls: [string, { body: string }][] } }).mock.calls[0]?.[1]
        .body ?? '{}',
    ) as { clientKey?: string }
    expect(sent.clientKey).toBe(entry.key)
  })

  /*
   * The poison-pill case, and the reason a 400 is not treated like every other failure.
   *
   * A submission the server calls `bad-game` will be called that identically forever. Retried at
   * the head of the queue it blocks every good game behind it, so one lost game becomes all of
   * them.
   */
  it('drops a game refused for good and carries on to the next', async () => {
    const bad = enqueue('u_1', GAME)
    const good = enqueue('u_1', GAME)
    globalThis.fetch = answeringInTurn([
      { status: 400, body: { error: 'bad-game', problem: 'bad-boards' } },
      { status: 201, body: { id: 'g2', score: 10 } },
    ])
    const drained = await drainGames('u_1')
    expect(drained.stored.has(bad.key)).toBe(false)
    expect(drained.stored.get(good.key)).toBe('g2')
    expect(queued()).toEqual([])
  })

  it.each([
    ['a lost session', { status: 401, body: { error: 'signed-out' } } as const],
    ['a server that is unwell', { status: 500 } as const],
    ['a gateway with nothing behind it', { status: 502 } as const],
  ])('stops on %s and leaves everything queued', async (_what, reply) => {
    enqueue('u_1', GAME)
    enqueue('u_1', GAME)
    globalThis.fetch = answeringInTurn([reply])
    const drained = await drainGames('u_1')
    expect(drained.stored.size).toBe(0)
    expect(drained.left).toBe(2)
    // The decisive assertion for the whole feature: nothing was thrown away.
    expect(queued()).toHaveLength(2)
  })

  it('stops when the connection fails and keeps what it had already stored', async () => {
    const first = enqueue('u_1', GAME)
    enqueue('u_1', GAME)
    globalThis.fetch = answeringInTurn([
      { status: 201, body: { id: 'g1', score: 10 } },
      'unreachable',
    ])
    const drained = await drainGames('u_1')
    expect(drained.stored.get(first.key)).toBe('g1')
    expect(drained.left).toBe(1)
    expect(queued()).toHaveLength(1)
  })

  it('never sends another account’s games', async () => {
    enqueue('u_2', GAME)
    const fetching = answeringInTurn([{ status: 201, body: { id: 'g1', score: 10 } }])
    globalThis.fetch = fetching
    await expect(drainGames('u_1')).resolves.toEqual({ stored: new Map(), left: 0 })
    expect(fetching).not.toHaveBeenCalled()
    // Still theirs, still waiting for them to sign in again.
    expect(queuedFor('u_2')).toHaveLength(1)
  })
})
