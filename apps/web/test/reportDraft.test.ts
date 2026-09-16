import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { draftKept, dropDraft, keepDraft, routeOfDraft, subjectKey } from '../src/reportDraft.js'
import type { ReportDraft } from '../src/reportDraft.js'

/**
 * The half-written report, and the reasons it is not simply `JSON.parse`.
 *
 * **The first test in `apps/web`, and it does not close that gap.** ACCOUNTS.md item 5 and
 * STATUS.md both record that the web app has no tests and that a Playwright suite is the thing
 * that would fix it; this is one pure module, tested the way every other pure module in this
 * repository is, because it has branches that a browser walkthrough checks once and a change
 * six months from now would not.
 *
 * `apps/web` is deliberately still outside the coverage gate. A percentage over a directory with
 * one tested file in it would read as a claim about the directory.
 */

/**
 * A storage made of a Map, or one that refuses.
 *
 * Refusing is the case worth having: `sessionStorage` throws in private browsing and where site
 * data is blocked, and a dialog that will not render is a worse outcome than a report that does
 * not survive a trip through a provider.
 */
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

const PERSON: ReportDraft = {
  subject: { kind: 'person', username: 'trout' },
  field: 'bio',
  reason: 'a slur spelled with Cyrillic characters',
}

const GAME: ReportDraft = {
  subject: { kind: 'game', gameId: 'pzAOU8y0zes' },
  field: 'score',
  reason: '',
}

/** What the module reads and writes, so a test can put a shape in it by hand. */
const KEY = 'blinkered.report'

function use(storage: Storage): void {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

describe('keeping a half-written report', () => {
  let storage: Storage

  beforeEach(() => {
    storage = fakeStorage()
    use(storage)
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'sessionStorage')
  })

  it('round-trips a report about a person, and one about a game', () => {
    for (const draft of [PERSON, GAME]) {
      keepDraft(draft)
      expect(draftKept()).toEqual(draft)
    }
  })

  it('is nothing until something is kept, and nothing again once dropped', () => {
    expect(draftKept()).toBeNull()
    keepDraft(PERSON)
    dropDraft()
    expect(draftKept()).toBeNull()
  })

  it('forgets a draft older than ten minutes', () => {
    // A tab left open overnight should not offer to send an objection somebody has long since
    // thought better of. Written by hand rather than by moving a clock, because the timestamp is
    // the stored shape and that is what is being checked.
    storage.setItem(KEY, JSON.stringify({ ...PERSON, at: Date.now() - 11 * 60 * 1000 }))
    expect(draftKept()).toBeNull()
    storage.setItem(KEY, JSON.stringify({ ...PERSON, at: Date.now() - 9 * 60 * 1000 }))
    expect(draftKept()).toEqual(PERSON)
  })

  /*
   * Everything below is a shape that is not what we wrote.
   *
   * It matters because this came out of storage, which is to say out of a previous version of
   * this code or out of somebody's devtools. The alternative to checking is a dialog rendering
   * `undefined` as a username and then reporting it.
   */
  it('refuses anything that is not the shape it wrote', () => {
    const rubbish: unknown[] = [
      'not json at all',
      '{}',
      JSON.stringify({ ...PERSON }), // no timestamp
      JSON.stringify({ ...PERSON, at: 'lunchtime' }),
      JSON.stringify({ ...PERSON, at: Date.now(), subject: null }),
      JSON.stringify({ ...PERSON, at: Date.now(), subject: 'trout' }),
      JSON.stringify({ at: Date.now(), subject: { kind: 'person' }, field: 'bio', reason: '' }),
      JSON.stringify({ at: Date.now(), subject: { kind: 'game' }, field: 'score', reason: '' }),
      JSON.stringify({
        at: Date.now(),
        subject: { kind: 'other', username: 'x' },
        field: 'bio',
        reason: '',
      }),
      JSON.stringify({ ...PERSON, at: Date.now(), field: 'avatar' }),
      JSON.stringify({ ...PERSON, at: Date.now(), field: 42 }),
      JSON.stringify({ ...PERSON, at: Date.now(), reason: 42 }),
    ]
    for (const written of rubbish) {
      storage.setItem(KEY, written as string)
      expect(draftKept(), written as string).toBeNull()
    }
  })

  it('survives a storage that refuses, in all three directions', () => {
    // Private browsing, or site data blocked. The feature degrades to not surviving a provider
    // round trip, which is the same trade SignInDialog makes about a half-typed address.
    use(fakeStorage({ refuses: true }))
    expect(() => {
      keepDraft(PERSON)
    }).not.toThrow()
    expect(draftKept()).toBeNull()
    expect(() => {
      dropDraft()
    }).not.toThrow()
  })
})

describe('what a draft says about where it belongs', () => {
  it('keys a subject by what addresses it, so two people do not collide', () => {
    expect(subjectKey(PERSON.subject)).toBe('u:trout')
    expect(subjectKey(GAME.subject)).toBe('g:pzAOU8y0zes')
    // The prefixes are why: a player called `pzAOU8y0zes` is not that game.
    expect(subjectKey({ kind: 'person', username: 'pzAOU8y0zes' })).not.toBe(
      subjectKey(GAME.subject),
    )
  })

  it('finds its own way back, because the subject is the address', () => {
    // Apple and Google return to `/?signin=ok` rather than to wherever the reader was, so
    // something has to remember. This is it, and it needs nothing stored beyond the subject.
    expect(routeOfDraft(PERSON)).toEqual({ at: 'player', username: 'trout' })
    expect(routeOfDraft(GAME)).toEqual({ at: 'played-game', id: 'pzAOU8y0zes' })
  })
})
