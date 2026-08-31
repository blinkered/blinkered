import { describe, expect, it } from 'vitest'
import { CROATIAN, configFor, replaceLetter, seedRng } from '../src/index.js'
import type { GameConfig, GameState, Tile } from '../src/index.js'
import { dictionaryIn, dictionaryOf, open, play, tick } from './helpers.js'
import type { Harness } from './helpers.js'

/**
 * Letter replacement changes what the board is made of, which is the line between it and wild
 * cards. Most of these tests are about the change being real, announced, and still legal.
 */

/** Rules permissive enough that most swaps clear the floor, so a test is about the swap. */
const LOOSE = { replaceChance: 1, wMin: 1, ceilingMin: 3, minWordLength: 3 } as const

const tilesOf = (letters: string): Tile[] =>
  [...letters].map((letter, id) => ({
    id,
    letter,
    position: id,
    revealed: false,
    spent: false,
    wild: false,
  }))

const boardLetters = (state: GameState): string =>
  [...state.tiles]
    .sort((a, b) => a.id - b.id)
    .map((tile) => tile.letter)
    .join('')

describe('deciding whether to replace', () => {
  it('replaces nothing when the chance is zero, and spends no randomness deciding', () => {
    const rng = seedRng(7)
    const config = configFor('easy', { ...LOOSE, replaceChance: 0, n: 6 })
    const [tiles, replacement, after] = replaceLetter(
      rng,
      tilesOf('OATSRX'),
      config,
      CROATIAN,
      dictionaryOf('OAT'),
    )
    expect(replacement).toBeNull()
    expect(tiles.map((tile) => tile.letter).join('')).toBe('OATSRX')
    // Turning the mechanic off must not shift the stream, or every other draw in the game moves.
    expect(after).toEqual(rng)
  })

  it('declines often enough to notice at a middling chance', () => {
    const config = configFor('easy', { ...LOOSE, replaceChance: 0.5, n: 6 })
    let rng = seedRng(3)
    let swaps = 0
    for (let deal = 0; deal < 200; deal++) {
      const [, replacement, next] = replaceLetter(
        rng,
        tilesOf('OATSRX'),
        config,
        CROATIAN,
        dictionaryOf(...['OAT', 'OATS', 'RAT', 'ART']),
      )
      rng = next
      if (replacement !== null) swaps += 1
    }
    // Not a distribution test: a sanity test that 0.5 is neither never nor always.
    expect(swaps).toBeGreaterThan(60)
    expect(swaps).toBeLessThan(140)
  })
})

describe('choosing the letter', () => {
  const permissive = { ...LOOSE, n: 6 }

  it('changes exactly one letter, and never to the one already there', () => {
    const config = configFor('easy', permissive)
    let rng = seedRng(11)
    for (let deal = 0; deal < 50; deal++) {
      const [tiles, replacement, next] = replaceLetter(
        rng,
        tilesOf('OATSRX'),
        config,
        CROATIAN,
        dictionaryOf('OAT', 'OATS', 'RAT'),
      )
      rng = next
      expect(replacement).not.toBeNull()
      if (replacement === null) return
      expect(replacement.from).not.toBe(replacement.to)
      const changed = tiles.filter((tile, at) => tile.letter !== 'OATSRX'[at])
      expect(changed).toHaveLength(1)
      expect(changed[0]?.id).toBe(replacement.tileId)
      expect(changed[0]?.letter).toBe(replacement.to)
    }
  })

  it('is a function of the seed, so a game replays identically', () => {
    const config = configFor('easy', permissive)
    const run = (): unknown =>
      replaceLetter(seedRng(99), tilesOf('OATSRX'), config, CROATIAN, dictionaryOf('OAT'))[1]
    expect(run()).toEqual(run())
  })

  it('draws by letter frequency, so a board does not drift towards a flat alphabet', () => {
    /*
     * Every candidate clears this floor, so nothing but the weighting decides the outcome. A
     * uniform draw would put Ž on the board as often as A; over a game of six or so swaps that
     * turns a plausible board into a strange one.
     */
    const config = configFor('easy', { ...permissive, language: 'hr' })
    const dictionary = dictionaryIn(CROATIAN, 'OAT')
    let rng = seedRng(5)
    const drawn = new Map<string, number>()
    for (let deal = 0; deal < 400; deal++) {
      const [, replacement, next] = replaceLetter(
        rng,
        tilesOf('OATSRX'),
        config,
        CROATIAN,
        dictionary,
      )
      rng = next
      if (replacement !== null) {
        drawn.set(replacement.to, (drawn.get(replacement.to) ?? 0) + 1)
      }
    }
    const weights = CROATIAN.weights
    const common = Object.entries(weights).sort((a, b) => b[1] - a[1])[0]?.[0] as string
    const rarest = Object.entries(weights).sort((a, b) => a[1] - b[1])[0]?.[0] as string
    expect(drawn.get(common) ?? 0).toBeGreaterThan(drawn.get(rarest) ?? 0)
  })

  it('can draw a letter that is more than one character', () => {
    // Croatian LJ is one tile. A replacement has to be able to become it, which iterating the
    // characters of an alphabet rather than its tile values would quietly rule out.
    const config = configFor('easy', { ...LOOSE, n: 3, language: 'hr' })
    const dictionary = dictionaryIn(CROATIAN, 'LJUT')
    let rng = seedRng(2)
    let sawDigraph = false
    for (let deal = 0; deal < 60 && !sawDigraph; deal++) {
      const [, replacement, next] = replaceLetter(rng, tilesOf('XUT'), config, CROATIAN, dictionary)
      rng = next
      if (replacement?.to === 'LJ') sawDigraph = true
    }
    expect(sawDigraph).toBe(true)
  })
})

describe('keeping the board legal', () => {
  it('tries another tile when the first has no letter that clears the floor', () => {
    /*
     * OATS against a dictionary holding only OAT. Replacing O, A or T destroys the only word the
     * board has, so those three slots have no valid letter at all; the S can become anything.
     * Whichever slot the draw picks first, the swap has to land on the S.
     */
    const config = configFor('easy', { ...LOOSE, n: 4 })
    let rng = seedRng(4)
    for (let deal = 0; deal < 40; deal++) {
      const [tiles, replacement, next] = replaceLetter(
        rng,
        tilesOf('OATS'),
        config,
        CROATIAN,
        dictionaryOf('OAT'),
      )
      rng = next
      expect(replacement?.tileId).toBe(3)
      expect(
        tiles
          .map((tile) => tile.letter)
          .join('')
          .slice(0, 3),
      ).toBe('OAT')
    }
  })

  it('replaces nothing at all rather than break the floor', () => {
    // OAT against a dictionary holding only OAT: every single-letter change destroys the board.
    // Churn is a defense against a cheat and the floor is a promise to the player, so the floor
    // wins.
    const config = configFor('easy', { ...LOOSE, n: 3 })
    const [tiles, replacement] = replaceLetter(
      seedRng(1),
      tilesOf('OAT'),
      config,
      CROATIAN,
      dictionaryOf('OAT'),
    )
    expect(replacement).toBeNull()
    expect(tiles.map((tile) => tile.letter).join('')).toBe('OAT')
  })
})

describe('a replacement in a real game', () => {
  /** Ticks a board of `letters` through to the end of its first round. */
  const throughARound = (letters: string, overrides: Partial<GameConfig> = {}): Harness => {
    const opened = open(letters, { minWordLength: 3, wMin: 1, ceilingMin: 3, ...overrides })
    return play(
      opened.state,
      Array.from({ length: letters.length }, () => tick),
      dictionaryOf('OAT', 'OATS', 'RAT', 'ART', 'TAR', 'OAR'),
    )
  }

  it('announces the change with both letters, since the new one is already on the board', () => {
    const { state, effects } = throughARound('OATSRX', { replaceChance: 1 })
    const announced = effects.filter((effect) => effect.type === 'LETTER_REPLACED')
    expect(announced).toHaveLength(1)
    const [event] = announced
    if (event?.type !== 'LETTER_REPLACED') return
    expect(event.from).not.toBe(event.to)
    expect(state.tiles[event.tileId]?.letter).toBe(event.to)
    expect(boardLetters(state)).not.toBe('OATSRX')
  })

  it('says nothing when nothing changed', () => {
    const { state, effects } = throughARound('OATSRX', { replaceChance: 0 })
    expect(effects.some((effect) => effect.type === 'LETTER_REPLACED')).toBe(false)
    expect(boardLetters(state)).toBe('OATSRX')
  })

  it('comes after the shuffle it belongs to, so the view can order the two', () => {
    const { effects } = throughARound('OATSRX', { replaceChance: 1 })
    const ended = effects.findIndex((effect) => effect.type === 'ROUND_ENDED')
    const replaced = effects.findIndex((effect) => effect.type === 'LETTER_REPLACED')
    expect(ended).toBeGreaterThanOrEqual(0)
    expect(replaced).toBeGreaterThan(ended)
  })

  it('never masks the tile it just replaced', () => {
    /*
     * A tile that changed and was then dealt as a wild would spend its announcement on a letter
     * the board immediately hides. The other tiles still roll, so the round is not short of wilds.
     */
    const { state, effects } = throughARound('OATSRX', { replaceChance: 1, wildChance: 1 })
    const announced = effects.find((effect) => effect.type === 'LETTER_REPLACED')
    expect(announced).toBeDefined()
    if (announced?.type !== 'LETTER_REPLACED') return
    expect(state.tiles[announced.tileId]?.wild).toBe(false)
    expect(state.tiles.filter((tile) => tile.wild).length).toBeGreaterThan(0)
  })

  it('keeps the letters it did not touch', () => {
    const { state, effects } = throughARound('OATSRX', { replaceChance: 1 })
    const announced = effects.find((effect) => effect.type === 'LETTER_REPLACED')
    expect(announced).toBeDefined()
    if (announced?.type !== 'LETTER_REPLACED') return
    const before = [...'OATSRX']
    const after = [...boardLetters(state)]
    for (const [id, letter] of before.entries()) {
      if (id === announced.tileId) continue
      expect(after[id], `tile ${String(id)}`).toBe(letter)
    }
  })
})
