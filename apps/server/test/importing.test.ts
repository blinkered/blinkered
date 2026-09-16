import { describe, expect, it } from 'vitest'
import { ENGINE_VERSION, configFor } from '@blinkered/engine'
import { parseImport } from '../src/account/importing.js'

const NOW = new Date('2026-09-04T12:00:00Z')
const CONFIG = configFor('medium', { language: 'en' })
const FACES = 'A B C D E F G H I J K L'
const BOARD = { tiles: FACES }

/** A game that could have been played, as the browser would send it. */
function body(changes: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    startedAt: NOW.getTime() - 120_000,
    finishedAt: NOW.getTime() - 1000,
    seed: 4821,
    difficulty: 'medium',
    source: 'web',
    config: { ...CONFIG },
    boards: [BOARD, BOARD],
    words: [
      { word: 'HOUSE', round: 0, flips: 8, tick: 42 },
      { word: 'RIVER', round: 1, flips: 8, tick: 96 },
    ],
    rounds: 8,
    ...changes,
  }
}

/** The words a body carries, as claims, for the cases that vary only in the word list. */
function said(...words: string[]): Record<string, unknown>[] {
  return words.map((word, at) => ({ word, round: at, flips: 1, tick: at + 1 }))
}

describe('reading a game a browser played before there was an account', () => {
  it('takes a whole one, and computes the score rather than reading it', () => {
    // The client never sends a score. `wordScore` is a function of tile count and nothing else,
    // so the words are sufficient, and a number the client chose is never stored.
    const parsed = parseImport(body({ score: 999_999 }), NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.game.score).toBeGreaterThan(0)
    expect(parsed.game.score).toBeLessThan(100)
    expect(parsed.game.words.map((one) => one.word)).toEqual(['HOUSE', 'RIVER'])
    // Scored here, from the tile count, and never read from the body.
    expect(parsed.game.words[0]).toMatchObject({ tiles: 5, round: 0, flips: 8, tick: 42 })
    expect(parsed.game.finishedAt.getTime()).toBe(NOW.getTime() - 1000)
  })

  it('decides canonicality itself, rather than believing the body', () => {
    // A client saying a game was canonical is a client claiming its own score is rankable, which
    // is not its claim to make.
    const preset = parseImport(body({ canonical: false }), NOW)
    expect(preset.ok && preset.game.canonical).toBe(true)

    const custom = parseImport(
      body({ config: { ...CONFIG, minWordLength: CONFIG.minWordLength + 1 }, canonical: true }),
      NOW,
    )
    expect(custom.ok && custom.game.canonical).toBe(false)
  })

  it('keeps a nerd-mode game, because it is still that person’s game', () => {
    const parsed = parseImport(body({ config: { ...CONFIG, wildChance: 0.5 } }), NOW)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.game.config.wildChance).toBe(0.5)
  })

  /*
   * The idempotency key, which is the one field the server never interprets.
   *
   * Permissive about what it is and strict about its size, because it reaches a unique index. A
   * key that is not usable reads as "no key", so the game still stores and simply loses the
   * protection against storing twice -- losing the guarantee beats losing somebody's game.
   */
  it('takes a client key as given', () => {
    const parsed = parseImport(body({ clientKey: 'f7c1e0a2-queued-1' }), NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.game.clientKey).toBe('f7c1e0a2-queued-1')
  })

  it('trims a client key, so whitespace cannot make two keys of one', () => {
    const parsed = parseImport(body({ clientKey: '  queued-7  ' }), NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.game.clientKey).toBe('queued-7')
  })

  it.each([
    ['absent', undefined],
    ['not a string', 4821],
    ['null', null],
    ['empty', ''],
    ['nothing but whitespace', '   '],
    ['longer than the column wants', 'k'.repeat(65)],
  ])('stores the game with no key when the key is %s', (_what, clientKey) => {
    const parsed = parseImport(body({ clientKey }), NOW)
    // Still a game. This is the decisive half: an unusable key is not a bad game.
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.game.clientKey).toBeNull()
  })

  it('takes a key of exactly the maximum length', () => {
    const parsed = parseImport(body({ clientKey: 'k'.repeat(64) }), NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.game.clientKey).toHaveLength(64)
  })

  it('refuses a body that is not an object', () => {
    for (const value of [null, 'a game', 42, []]) {
      expect(parseImport(value, NOW)).toEqual({ ok: false, problem: 'not-an-object' })
    }
  })

  it('refuses times that could not have happened', () => {
    for (const changes of [
      { startedAt: 'yesterday' },
      { finishedAt: null },
      { startedAt: NOW.getTime(), finishedAt: NOW.getTime() - 60_000 },
      // A machine with a wrong clock would otherwise put a row at the top of a history sorted by
      // date for the next decade.
      { finishedAt: NOW.getTime() + 60 * 60 * 1000 },
    ]) {
      expect(parseImport(body(changes), NOW)).toEqual({ ok: false, problem: 'bad-times' })
    }
  })

  it('allows a little clock skew, since no two machines agree', () => {
    const parsed = parseImport(body({ finishedAt: NOW.getTime() + 60_000 }), NOW)
    expect(parsed.ok).toBe(true)
  })

  it('refuses a seed that is not one, and a difficulty that is not one', () => {
    expect(parseImport(body({ seed: -1 }), NOW)).toEqual({ ok: false, problem: 'bad-seed' })
    expect(parseImport(body({ seed: 1.5 }), NOW)).toEqual({ ok: false, problem: 'bad-seed' })
    expect(parseImport(body({ difficulty: 'gentle' }), NOW)).toEqual({
      ok: false,
      problem: 'bad-difficulty',
    })
  })

  it('refuses a ruleset that is not one', () => {
    for (const config of [
      null,
      'medium',
      [],
      { ...CONFIG, n: 0 },
      { ...CONFIG, n: 12.5 },
      { ...CONFIG, n: 'twelve' },
      { ...CONFIG, n: Number.POSITIVE_INFINITY },
      { ...CONFIG, speedMultiplier: 0 },
      { ...CONFIG, holdTicks: -1 },
      { ...CONFIG, initialFlips: 1.5 },
      { ...CONFIG, wMin: -1 },
      { ...CONFIG, minWordLength: 0 },
      { ...CONFIG, wildChance: 1.5 },
      { ...CONFIG, replaceChance: -0.1 },
      { ...CONFIG, wordCompleteMode: 'vanish' },
      { ...CONFIG, flipEconomy: 'generous' },
      { ...CONFIG, chargeFullRound: 'no' },
      { ...CONFIG, language: '' },
      { ...CONFIG, language: 7 },
    ]) {
      expect(parseImport(body({ config, boards: boardsFor(config) }), NOW)).toEqual({
        ok: false,
        problem: 'bad-config',
      })
    }
  })

  it('takes the engine the game was played on, and falls back to this one', () => {
    const old = parseImport(body({ config: { ...CONFIG, engineVersion: '0.1.0' } }), NOW)
    expect(old.ok && old.game.config.engineVersion).toBe('0.1.0')

    const missing = { ...CONFIG } as Record<string, unknown>
    delete missing.engineVersion
    const guessed = parseImport(body({ config: missing }), NOW)
    expect(guessed.ok && guessed.game.config.engineVersion).toBe(ENGINE_VERSION)
  })

  it('refuses boards that are not the board the ruleset describes', () => {
    for (const boards of [
      'A B C',
      [],
      [{ tiles: 'A B C' }],
      [BOARD, { tiles: 'A B C D E F G H I J K L M' }],
      [BOARD, 42],
      // A face that is not a face, with the board still the right number of slots: an empty one,
      // and one longer than any tile the game deals.
      [{ tiles: 'A B C D E F G H I J K ' }],
      [{ tiles: 'ABCDEFGHI B C D E F G H I J K L' }],
      // And a string too long to be a board of this size at all, refused before it is split.
      [{ tiles: 'AB '.repeat(60).trim() }],
      [BOARD, { tiles: FACES, wilds: [12] }],
      [BOARD, { tiles: FACES, wilds: ['a'] }],
      [FACES],
      // More boards than there were rounds: a game cannot have started a tenth round of eight.
      Array.from({ length: 9 }, () => BOARD),
    ]) {
      expect(parseImport(body({ boards }), NOW)).toEqual({ ok: false, problem: 'bad-boards' })
    }
  })

  it('keeps the wilds a board was showing, and leaves them off a board with none', () => {
    // A wild is a mask over a letter that is still underneath, so the two are kept apart: writing
    // the card into the faces would lose the board it goes back to next round.
    const parsed = parseImport(body({ boards: [{ tiles: FACES, wilds: [0, 11] }, BOARD] }), NOW)
    expect(parsed.ok && parsed.game.boards).toEqual([{ tiles: FACES, wilds: [0, 11] }, BOARD])

    for (const wilds of [undefined, null, []]) {
      const plain = parseImport(body({ boards: [{ tiles: FACES, wilds }] }), NOW)
      expect(plain.ok && plain.game.boards[0]).not.toHaveProperty('wilds')
    }
  })

  it('refuses a wild in a slot the board does not have', () => {
    // Bounded by the board rather than by a word, which is the other thing `wilds` indexes.
    for (const wilds of [[12], [-1], [1.5], 'all', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]]) {
      expect(parseImport(body({ boards: [{ tiles: FACES, wilds }] }), NOW)).toEqual({
        ok: false,
        problem: 'bad-boards',
      })
    }
  })

  it('takes fewer boards than rounds, so one missed snapshot does not cost the game', () => {
    // The import is silent on failure by design, so strictness here would cost somebody their
    // score in order to report a client bug they cannot see.
    expect(parseImport(body({ boards: [BOARD] }), NOW).ok).toBe(true)
  })

  it('refuses words that are not words', () => {
    for (const words of [
      'HOUSE',
      [42],
      [{ word: '' }],
      [{ word: 'x'.repeat(65), round: 0, flips: 1, tick: 1 }],
      [{ word: 'HOUSE' }],
      [{ word: 'HOUSE', round: -1, flips: 1, tick: 1 }],
      [{ word: 'HOUSE', round: 0.5, flips: 1, tick: 1 }],
      [{ word: 'HOUSE', round: 0, flips: 'lots', tick: 1 }],
      [{ word: 'HOUSE', round: 0, flips: 1, tick: null }],
    ]) {
      expect(parseImport(body({ words }), NOW)).toEqual({ ok: false, problem: 'bad-words' })
    }
  })

  it('takes wilds only as positions inside the word', () => {
    const ok = parseImport(
      body({ words: [{ word: 'HOUSE', round: 0, flips: 1, tick: 1, wilds: [0, 4] }] }),
      NOW,
    )
    expect(ok.ok && ok.game.words[0]?.wilds).toEqual([0, 4])

    for (const wilds of [[5], [-1], [1.5], ['a'], [0, 1, 2, 3, 4, 5], 'none']) {
      const parsed = parseImport(
        body({ words: [{ word: 'HOUSE', round: 0, flips: 1, tick: 1, wilds }] }),
        NOW,
      )
      expect(parsed).toEqual({ ok: false, problem: 'bad-words' })
    }
  })

  it('leaves wilds off an ordinary word rather than writing an empty list', () => {
    for (const wilds of [undefined, null, []]) {
      const parsed = parseImport(
        body({ words: [{ word: 'HOUSE', round: 0, flips: 1, tick: 1, wilds }] }),
        NOW,
      )
      expect(parsed.ok && parsed.game.words[0]).not.toHaveProperty('wilds')
    }
  })

  it('passes the submission checker’s verdict through unchanged', () => {
    // Everything `scoreSubmission` already refuses stays refused, and says the same word for it.
    expect(parseImport(body({ rounds: 'eight' }), NOW)).toEqual({
      ok: false,
      problem: 'impossible-rounds',
    })
    expect(parseImport(body({ rounds: 0 }), NOW)).toEqual({
      ok: false,
      problem: 'impossible-rounds',
    })
    expect(parseImport(body({ words: said('HOUSE', 'HOUSE') }), NOW)).toEqual({
      ok: false,
      problem: 'duplicate',
    })
    expect(parseImport(body({ words: said('AB') }), NOW)).toEqual({
      ok: false,
      problem: 'too-short',
    })
    // Under `spend` a round deals `n` tiles, so a game cannot have spent more than it dealt.
    expect(
      parseImport(
        body({ rounds: 1, boards: [BOARD], words: said('HOUSE', 'RIVER', 'PLANET') }),
        NOW,
      ),
    ).toEqual({ ok: false, problem: 'impossible-tiles' })
  })

  it('takes the game as a guest game only when told so, and never guesses', () => {
    // Absent withholds the label rather than inventing one about where a game came from.
    expect(parseImport(body({ guest: true }), NOW)).toMatchObject({
      ok: true,
      game: { imported: true },
    })
    for (const guest of [false, undefined, 'yes', 1]) {
      expect(parseImport(body({ guest }), NOW)).toMatchObject({
        ok: true,
        game: { imported: false },
      })
    }
  })

  it('reads the source, and treats anything unfamiliar as the web', () => {
    expect(parseImport(body({ source: 'ios' }), NOW).ok).toBe(true)
    const parsed = parseImport(body({ source: 'toaster' }), NOW)
    expect(parsed.ok && parsed.game.source).toBe('web')
  })

  it('keeps the dictionary build when there is one, and null when there is not', () => {
    const named = parseImport(body({ dictionaryVersion: 'abc123' }), NOW)
    expect(named.ok && named.game.dictionaryVersion).toBe('abc123')
    const anonymous = parseImport(body({ dictionaryVersion: 9 }), NOW)
    expect(anonymous.ok && anonymous.game.dictionaryVersion).toBeNull()
  })
})

/** Boards sized to whatever `n` the malformed config claims, so the board is never what fails. */
function boardsFor(config: unknown): { tiles: string }[] {
  const n = typeof config === 'object' && config !== null ? (config as { n?: unknown }).n : 12
  const size = typeof n === 'number' && Number.isInteger(n) && n > 0 && n < 400 ? n : 12
  return [
    {
      tiles: Array.from({ length: size }, (_, at) => String.fromCharCode(65 + (at % 26))).join(' '),
    },
  ]
}
