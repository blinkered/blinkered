import { describe, expect, it } from 'vitest'
import { letter, open, play, submit, tick, WORDS } from './helpers.js'
import type { FlipEconomy, GameConfig, GameState } from '../src/index.js'

/** ATESON exposes A T E S O N in reading order, which spells plenty. */
const exposed = (overrides: Partial<GameConfig> = {}): GameState =>
  play(
    open('ATESON', overrides).state,
    Array.from({ length: 5 }, () => tick),
  ).state

const spell = (state: GameState, word: string) =>
  play(state, [...[...word].map((value) => letter(value)), submit])

describe('accepting a word', () => {
  it('scores it, pays it, and records it', () => {
    const before = exposed()
    const { state, effects } = spell(before, 'ATE')
    expect(state.score).toBe(2)
    expect(state.flipsRemaining).toBe(before.flipsRemaining + 2)
    expect(state.selection).toEqual([])
    expect(state.wordsFound).toEqual([
      { word: 'ATE', wilds: [], length: 3, points: 2, flips: 2, roundIndex: 0, tick: 5 },
    ])
    expect(effects.at(-1)).toEqual({
      type: 'WORD_ACCEPTED',
      word: 'ATE',
      points: 2,
      flips: 2,
      wilds: [],
    })
  })

  it('accumulates across words', () => {
    const { state } = spell(spell(exposed({ wordCompleteMode: 'keep' }), 'ATE').state, 'NOTES')
    expect(state.wordsFound.map((found) => found.word)).toEqual(['ATE', 'NOTES'])
    expect(state.score).toBe(2 + 5)
  })

  it('scores the whole board when the letters allow it', () => {
    const { state } = spell(exposed(), 'ATONES')
    expect(state.score).toBe(8)
    expect(state.wordsFound[0]?.flips).toBe(8)
  })
})

describe('rejecting a word', () => {
  it('rejects a word below the minimum length', () => {
    const { state, effects } = spell(exposed(), 'AT')
    expect(state.score).toBe(0)
    expect(state.selection).toEqual([])
    expect(effects.at(-1)).toEqual({ type: 'WORD_REJECTED', word: 'AT', reason: 'too-short' })
  })

  it('rejects an empty submission', () => {
    const { effects } = play(exposed(), [submit])
    expect(effects).toEqual([{ type: 'WORD_REJECTED', word: '', reason: 'too-short' }])
  })

  it('rejects a word the dictionary does not know', () => {
    const { effects } = spell(exposed(), 'AES')
    expect(effects.at(-1)).toEqual({ type: 'WORD_REJECTED', word: 'AES', reason: 'unknown' })
  })

  it('rejects a word already found', () => {
    const { effects } = spell(spell(exposed({ wordCompleteMode: 'keep' }), 'ATE').state, 'ATE')
    expect(effects.at(-1)).toEqual({ type: 'WORD_REJECTED', word: 'ATE', reason: 'duplicate' })
  })

  it('still rejects it a round later', () => {
    const first = spell(exposed(), 'ATE').state
    const nextRound = play(
      first,
      Array.from({ length: 6 }, () => tick),
    ).state
    expect(nextRound.roundIndex).toBe(1)
    const { effects } = spell(nextRound, 'ATE')
    expect(effects.at(-1)).toEqual({ type: 'WORD_REJECTED', word: 'ATE', reason: 'duplicate' })
  })

  it('costs nothing', () => {
    const before = exposed()
    const { state } = spell(before, 'AES')
    expect(state.flipsRemaining).toBe(before.flipsRemaining)
    expect(state.score).toBe(0)
  })
})

describe('word-complete modes', () => {
  it('spend hides the letters it used and leaves the rest alone', () => {
    const { state } = spell(exposed({ wordCompleteMode: 'spend' }), 'ATE')
    expect(state.tiles.filter((t) => t.spent).map((t) => t.letter)).toEqual(['A', 'T', 'E'])
    expect(state.tiles.filter((t) => t.spent).every((t) => !t.revealed)).toBe(true)
    expect(state.tiles.filter((t) => t.revealed).map((t) => t.letter)).toEqual(['S', 'O', 'N'])
    expect(state.roundIndex).toBe(0)
  })

  it('spend puts the used letters out of reach for the rest of the round', () => {
    const after = spell(exposed({ wordCompleteMode: 'spend' }), 'ATE').state
    const { effects } = play(after, [letter('A')])
    expect(effects).toEqual([{ type: 'INPUT_IGNORED', reason: 'no-such-letter' }])
  })

  it('keep leaves every letter available, so anagrams are farmable', () => {
    const after = spell(exposed({ wordCompleteMode: 'keep' }), 'ATE').state
    expect(after.tiles.every((t) => !t.spent)).toBe(true)
    const { state } = spell(after, 'EAT')
    expect(state.wordsFound.map((f) => f.word)).toEqual(['ATE', 'EAT'])
  })

  it('shuffle ends the round the moment the word lands', () => {
    const { state, effects } = spell(exposed({ wordCompleteMode: 'shuffle' }), 'ATE')
    expect(state.roundIndex).toBe(1)
    expect(state.revealsThisRound).toBe(1)
    const kinds = effects.map((effect) => effect.type)
    expect(kinds.slice(-3)).toEqual(['WORD_ACCEPTED', 'ROUND_ENDED', 'REVEALED'])
  })

  it('shuffle can bill the unrevealed tiles when told to', () => {
    const early = play(
      open('ATESON', { wordCompleteMode: 'shuffle', chargeFullRound: true }).state,
      [tick, tick],
    ).state
    const { effects } = spell(early, 'ATE')
    const ended = effects.find((effect) => effect.type === 'ROUND_ENDED')
    expect(ended).toMatchObject({ flipsCharged: 3 })
  })

  it('shuffle bills nothing by default', () => {
    const early = play(open('ATESON', { wordCompleteMode: 'shuffle' }).state, [tick, tick]).state
    const { effects } = spell(early, 'ATE')
    const ended = effects.find((effect) => effect.type === 'ROUND_ENDED')
    expect(ended).toMatchObject({ flipsCharged: 0 })
  })
})

describe('flip economies', () => {
  const cases: readonly [FlipEconomy, number][] = [
    ['none', 0],
    ['perLetter', 3],
    ['fibonacci', 2],
    ['overMinimum', 1],
  ]

  for (const [economy, reward] of cases) {
    it(`${economy} pays ${String(reward)} for a three-letter word`, () => {
      const before = exposed({ flipEconomy: economy })
      const { state } = spell(before, 'ATE')
      expect(state.flipsRemaining - before.flipsRemaining).toBe(reward)
    })
  }
})

describe('dictionary boundary', () => {
  it('asks the dictionary in upper case', () => {
    const asked: string[] = []
    const spy = {
      has: (candidate: string) => {
        asked.push(candidate)
        return WORDS.has(candidate)
      },
    }
    play(exposed(), [letter('a'), letter('t'), letter('e'), submit], spy)
    expect(asked).toEqual(['ATE'])
  })
})
