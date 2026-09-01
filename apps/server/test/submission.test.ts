import { describe, expect, it } from 'vitest'
import { configFor, wordScore } from '@blinkered/engine'
import { scoreSubmission } from '../src/submission.js'

describe('scoreSubmission', () => {
  const medium = configFor('medium')

  it('scores the words rather than believing a score', () => {
    const verdict = scoreSubmission({ words: ['CAT', 'HOUSE', 'PLANTS'], rounds: 5 }, medium)
    expect(verdict).toEqual({ ok: true, score: 15, words: 3, tiles: 14 })
  })

  it('accepts a game that scored nothing, because that is a game', () => {
    expect(scoreSubmission({ words: [], rounds: 12 }, medium)).toEqual({
      ok: true,
      score: 0,
      words: 0,
      tiles: 0,
    })
  })

  it('refuses a word below the ruleset minimum', () => {
    // `hard` requires four. The reducer would have rejected CAT as too-short, so a game
    // containing it is not a game.
    const hard = configFor('hard')
    expect(scoreSubmission({ words: ['CAT'], rounds: 3 }, hard)).toEqual({
      ok: false,
      reason: 'too-short',
    })
    expect(scoreSubmission({ words: ['CATS'], rounds: 3 }, hard)).toMatchObject({ ok: true })
  })

  it('refuses the same word twice', () => {
    expect(scoreSubmission({ words: ['HOUSE', 'HOUSE'], rounds: 4 }, medium)).toEqual({
      ok: false,
      reason: 'duplicate',
    })
  })

  it('refuses a round count that could not have happened', () => {
    for (const rounds of [0, -1, 1.5, Number.NaN]) {
      expect(scoreSubmission({ words: ['CAT'], rounds }, medium), String(rounds)).toEqual({
        ok: false,
        reason: 'impossible-rounds',
      })
    }
  })

  it('refuses more tiles than the rounds claimed ever dealt', () => {
    // Twelve tiles a round under `spend`, so two rounds deal 24 and no game can spend 25.
    const words = ['PLANTS', 'HOUSES', 'GARDEN', 'FLOWER', 'SPRING']
    expect(words.join('').length).toBe(30)
    expect(scoreSubmission({ words, rounds: 2 }, medium)).toEqual({
      ok: false,
      reason: 'impossible-tiles',
    })
    expect(scoreSubmission({ words, rounds: 3 }, medium)).toMatchObject({ ok: true })
  })

  it('does not apply the tile bound where the rules do not spend tiles', () => {
    // `keep` leaves the letters on the board, so a tile can be used again and the bound is
    // simply untrue. Not a preset, so no such game reaches a board, but it is still a game.
    const keep = configFor('medium', { wordCompleteMode: 'keep' })
    const words = ['PLANTS', 'HOUSES', 'GARDEN', 'FLOWER', 'SPRING']
    expect(scoreSubmission({ words, rounds: 2 }, keep)).toMatchObject({ ok: true })
  })

  it('bounds the size of the request', () => {
    const words = Array.from({ length: 2001 }, (_, index) => `WORD${String(index)}`)
    expect(scoreSubmission({ words, rounds: 500 }, medium)).toEqual({
      ok: false,
      reason: 'too-many-words',
    })
  })

  it('counts tiles rather than characters, so a digraph language is not shortchanged', () => {
    // LJUDI is five characters and four Croatian tiles: worth 3, not 5. The same segmentation
    // decides whether it clears the minimum, so counting characters would be wrong twice.
    const croatian = configFor('medium', { language: 'hr' })
    const verdict = scoreSubmission({ words: ['LJUDI'], rounds: 2 }, croatian)
    expect(verdict).toEqual({ ok: true, score: wordScore(4), words: 1, tiles: 4 })
  })
})
