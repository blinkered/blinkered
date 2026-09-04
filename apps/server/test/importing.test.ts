import { describe, expect, it } from 'vitest'
import { ENGINE_VERSION, configFor } from '@blinkered/engine'
import { parseImport } from '../src/account/importing.js'

const NOW = new Date('2026-09-04T12:00:00Z')
const CONFIG = configFor('medium', { language: 'en' })

/** A game that could have been played, as the browser would send it. */
function body(changes: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    startedAt: NOW.getTime() - 120_000,
    finishedAt: NOW.getTime() - 1000,
    seed: 4821,
    difficulty: 'medium',
    source: 'web',
    config: { ...CONFIG },
    letters: 'ABCDEFGHIJKL'.split(''),
    words: ['HOUSE', 'RIVER'],
    rounds: 8,
    ...changes,
  }
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
    expect(parsed.game.words).toEqual(['HOUSE', 'RIVER'])
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
      expect(parseImport(body({ config, letters: lettersFor(config) }), NOW)).toEqual({
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

  it('refuses a board that is not the board the ruleset describes', () => {
    for (const letters of ['ABC', ['A'], [...'ABCDEFGHIJKL', 'M'], [...'ABCDEFGHIJK', 5]]) {
      expect(parseImport(body({ letters }), NOW)).toEqual({ ok: false, problem: 'bad-letters' })
    }
  })

  it('refuses words that are not words', () => {
    for (const words of ['HOUSE', [42], [''], ['x'.repeat(65)]]) {
      expect(parseImport(body({ words }), NOW)).toEqual({ ok: false, problem: 'bad-words' })
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
    expect(parseImport(body({ words: ['HOUSE', 'HOUSE'] }), NOW)).toEqual({
      ok: false,
      problem: 'duplicate',
    })
    expect(parseImport(body({ words: ['AB'] }), NOW)).toEqual({ ok: false, problem: 'too-short' })
    // Under `spend` a round deals `n` tiles, so a game cannot have spent more than it dealt.
    expect(parseImport(body({ rounds: 1, words: ['HOUSE', 'RIVER', 'PLANET'] }), NOW)).toEqual({
      ok: false,
      problem: 'impossible-tiles',
    })
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

/** Letters sized to whatever `n` the malformed config claims, so the board is never what fails. */
function lettersFor(config: unknown): string[] {
  const n = typeof config === 'object' && config !== null ? (config as { n?: unknown }).n : 12
  const size = typeof n === 'number' && Number.isInteger(n) && n > 0 && n < 400 ? n : 12
  return Array.from({ length: size }, (_, at) => String.fromCharCode(65 + (at % 26)))
}
