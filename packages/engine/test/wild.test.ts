import { describe, expect, it } from 'vitest'
import {
  WILD_GLYPH,
  alphabetFor,
  dealWilds,
  resolveWilds,
  MAX_WILDS,
  seedRng,
  selectedLetters,
} from '../src/index.js'
import type { GameEvent, GameState, Tile } from '../src/index.js'
import {
  WORDS,
  clearLetter,
  dictionaryOf,
  letter,
  open,
  play,
  resetWord,
  submit,
  tap,
  tick,
  undo,
} from './helpers.js'

/**
 * Wild cards mask a letter for a round. The letter underneath is untouched, which is the line
 * between this and letter replacement, so most of these tests are about the mask being a mask.
 */

const EN = alphabetFor('en')

const faces = (word: string, ...wildAt: number[]) =>
  [...word].map((letter, at) => ({ letter, wild: wildAt.includes(at) }))

describe('dealing wilds', () => {
  const plain: Tile[] = [...'ABCDEF'].map((letter, id) => ({
    id,
    letter,
    position: id,
    revealed: false,
    spent: false,
    wild: false,
  }))

  it('deals none at all when the chance is zero, and spends no randomness doing it', () => {
    const rng = seedRng(7)
    const [tiles, after] = dealWilds(rng, plain, 0)
    expect(tiles.every((tile) => !tile.wild)).toBe(true)
    // The stream is untouched, so turning wild cards off does not change any other draw.
    expect(after).toEqual(rng)
  })

  it('never deals more than the cap, even when the chance is one', () => {
    const [tiles] = dealWilds(seedRng(7), plain, 1)
    expect(tiles.filter((tile) => tile.wild)).toHaveLength(MAX_WILDS)
  })

  it('does not favor the front of the board when the roll overflows the cap', () => {
    // Keeping the first two would make tile 0 likelier to be wild than tile 5, which is a tell.
    // Every tile rolls wild here, so the cap alone decides which survive, and it should spread.
    const counts = new Array<number>(plain.length).fill(0)
    let rng = seedRng(11)
    for (let round = 0; round < 300; round++) {
      const [tiles, next] = dealWilds(rng, plain, 1)
      rng = next
      for (const tile of tiles) if (tile.wild) counts[tile.id] = (counts[tile.id] ?? 0) + 1
    }
    // Six tiles sharing two slots over three hundred deals averages a hundred each.
    for (const [id, count] of counts.entries()) {
      expect(count, `tile ${String(id)}`).toBeGreaterThan(40)
    }
  })

  it('caps the count but not the places, so a wild still moves between deals', () => {
    let rng = seedRng(23)
    const seen = new Set<string>()
    for (let round = 0; round < 20; round++) {
      const [tiles, next] = dealWilds(rng, plain, 1)
      rng = next
      seen.add(
        tiles
          .filter((tile) => tile.wild)
          .map((tile) => tile.id)
          .join(','),
      )
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('leaves the letters underneath alone', () => {
    const [tiles] = dealWilds(seedRng(3), plain, 1)
    expect(tiles.map((tile) => tile.letter).join('')).toBe('ABCDEF')
  })

  it('is a function of the seed, so a game replays identically', () => {
    const once = dealWilds(seedRng(99), plain, 0.5)[0].map((tile) => tile.wild)
    const twice = dealWilds(seedRng(99), plain, 0.5)[0].map((tile) => tile.wild)
    expect(once).toEqual(twice)
  })

  it('lands near the rate it is given', () => {
    // Not a distribution test, a sanity test: 0.2 over six hundred tiles should not come out at
    // nought or six hundred.
    let rng = seedRng(1)
    let wilds = 0
    for (let round = 0; round < 100; round++) {
      const [tiles, next] = dealWilds(rng, plain, 0.2)
      rng = next
      wilds += tiles.filter((tile) => tile.wild).length
    }
    expect(wilds).toBeGreaterThan(60)
    expect(wilds).toBeLessThan(180)
  })
})

describe('resolving a selection that contains a wild', () => {
  const found = new Set<string>()

  it('becomes a word the wild can complete', () => {
    // _AT against the fixture dictionary, which holds OAT and RAT and TAN but not BAT.
    const out = resolveWilds(faces('_AT', 0), EN, WORDS, found, seedRng(1))
    expect(out.kind).toBe('resolved')
    if (out.kind !== 'resolved') return
    expect(['EAT', 'OAT', 'RAT']).toContain(out.resolution.word)
    expect(out.resolution.wilds).toEqual([0])
  })

  it('reports which places were given, not which were chosen', () => {
    const out = resolveWilds(faces('T_A', 1), EN, WORDS, found, seedRng(1))
    expect(out.kind).toBe('resolved')
    if (out.kind !== 'resolved') return
    expect(out.resolution.word).toBe('TEA')
    expect(out.resolution.wilds).toEqual([1])
  })

  it('refuses when no letter completes anything', () => {
    // Nothing in the fixture dictionary matches Z_Z.
    expect(resolveWilds(faces('Z_Z', 1), EN, WORDS, found, seedRng(1)).kind).toBe('unknown')
  })

  it('separates "already had them all" from "not a word"', () => {
    // Three words in the fixture match _AT. With all of them found there is nothing left to give,
    // which is a different answer from the selection not being a word.
    const all = new Set(['EAT', 'OAT', 'RAT'])
    expect(resolveWilds(faces('_AT', 0), EN, WORDS, all, seedRng(1)).kind).toBe('all-found')
    // With one still going, it resolves to that one rather than refusing.
    const one = resolveWilds(faces('_AT', 0), EN, WORDS, new Set(['EAT', 'OAT']), seedRng(1))
    expect(one.kind).toBe('resolved')
    if (one.kind === 'resolved') expect(one.resolution.word).toBe('RAT')
  })

  it('solves two wilds at once', () => {
    const out = resolveWilds(faces('_A_', 0, 2), EN, WORDS, found, seedRng(5))
    expect(out.kind).toBe('resolved')
    if (out.kind !== 'resolved') return
    expect(out.resolution.wilds).toEqual([0, 2])
    expect(WORDS.has(out.resolution.word)).toBe(true)
  })

  it('refuses three rather than searching an alphabet cubed', () => {
    expect(resolveWilds(faces('___', 0, 1, 2), EN, WORDS, found, seedRng(1)).kind).toBe(
      'too-many-wilds',
    )
  })

  it('advances the RNG, so two identical selections can differ', () => {
    const first = resolveWilds(faces('_AT', 0), EN, WORDS, found, seedRng(1))
    expect(first.kind).toBe('resolved')
    if (first.kind !== 'resolved') return
    // The returned state is the one the game must carry forward; reusing the old one would make
    // every wild in a game resolve the same way.
    expect(first.rng).not.toEqual(seedRng(1))
  })

  it('draws from the alphabet, so a digraph language can produce one', () => {
    // Croatian LJ is one tile. A wild has to be able to become it, which A-to-Z cannot express.
    const hr = alphabetFor('hr')
    const dictionary = dictionaryOf('LJUT')
    const out = resolveWilds(faces('_UT', 0), hr, dictionary, new Set(), seedRng(1))
    expect(out.kind).toBe('resolved')
    if (out.kind === 'resolved') expect(out.resolution.word).toBe('LJUT')
  })
})

describe('taking a wild from the keyboard', () => {
  /** OAT with one tile masked, fully revealed. */
  const masked = (wildId: number): GameState => {
    const opened = play(
      open('OAT', { wildChance: 0, minWordLength: 3 }).state,
      Array.from({ length: 2 }, () => tick),
    ).state
    return {
      ...opened,
      tiles: opened.tiles.map((tile) => (tile.id === wildId ? { ...tile, wild: true } : tile)),
    }
  }

  it('tells you nothing about the letter underneath', () => {
    /*
     * The leak this fixes. Matching a card by `tile.letter` meant typing the masked letter picked
     * it and typing anything else was refused, so the keyboard answered the one question the
     * mechanic rests on. The property that says it is gone is that every letter behaves the same:
     * A is what the card is hiding and Z is not, and neither of them can tell you that.
     */
    const board = masked(1)
    const hiding = play(board, [letter('a')])
    const notHiding = play(board, [letter('z')])
    expect(hiding.state.selection).toEqual([1])
    expect(notHiding.state.selection).toEqual([1])
    expect(hiding.effects).toEqual(notHiding.effects)
  })

  it('prefers a real tile, because a card is worth more than the letter it stands in for', () => {
    const { state } = play(masked(1), [letter('t')])
    expect(state.selection).toEqual([2])
    expect(state.wildIntent).toEqual({})
  })

  it('remembers which letter was typed onto the card', () => {
    const { state } = play(masked(0), [letter('e')])
    expect(state.selection).toEqual([0])
    expect(state.wildIntent).toEqual({ 0: 'E' })
  })

  it('resolves to the letter that was typed', () => {
    // _AT is EAT, OAT and RAT in the fixture. Which one comes back is the player's to choose.
    for (const [typed, word] of [
      ['e', 'EAT'],
      ['o', 'OAT'],
      ['r', 'RAT'],
    ] as const) {
      const { state } = play(masked(0), [letter(typed), letter('a'), letter('t'), submit])
      expect(
        state.wordsFound.map((found) => found.word),
        typed,
      ).toEqual([word])
    }
  })

  it('falls back to the ordinary draw when the typed letter makes nothing', () => {
    // ZAT is not a word, so asking for Z cannot be honoured. Refusing would make the keyboard
    // worse than the thumb for the same selection, so it resolves as a tap would.
    const { state } = play(masked(0), [letter('z'), letter('a'), letter('t'), submit])
    expect(state.wordsFound).toHaveLength(1)
    expect(['EAT', 'OAT', 'RAT']).toContain(state.wordsFound[0]?.word)
  })

  it('gives the card back to the key that took it', () => {
    const taken = play(masked(0), [letter('e')])
    expect(taken.state.selection).toEqual([0])
    const given = play(taken.state, [clearLetter('e')])
    expect(given.state.selection).toEqual([])
    expect(given.state.wildIntent).toEqual({})
  })

  it('forgets what was typed as soon as the card is given back', () => {
    for (const undoing of [undo, resetWord, tap(0)]) {
      const taken = play(masked(0), [letter('e')])
      const back = play(taken.state, [undoing])
      expect(back.state.selection, undoing.type).toEqual([])
      expect(back.state.wildIntent, undoing.type).toEqual({})
    }
  })

  it('records nothing for a card that was tapped rather than typed', () => {
    const { state } = play(masked(0), [tap(0)])
    expect(state.selection).toEqual([0])
    expect(state.wildIntent).toEqual({})
  })

  it('cycles through the copies, then the card, then gives them all back', () => {
    const cycle: GameEvent = { type: 'CYCLE_LETTER', letter: 't' }
    let state = masked(0)
    state = play(state, [cycle]).state
    expect(state.selection).toEqual([2])
    state = play(state, [cycle]).state
    expect(state.selection).toEqual([2, 0])
    state = play(state, [cycle]).state
    expect(state.selection).toEqual([])
  })

  it('is refused when the board has neither the letter nor a card', () => {
    const plain = play(
      open('OAT', { wildChance: 0, minWordLength: 3 }).state,
      Array.from({ length: 2 }, () => tick),
    ).state
    const cycle: GameEvent = { type: 'CYCLE_LETTER', letter: 'z' }
    for (const event of [letter('z'), cycle]) {
      expect(play(plain, [event]).effects.at(-1), event.type).toEqual({
        type: 'INPUT_IGNORED',
        reason: 'no-such-letter',
      })
    }
  })

  it('is refused when every copy is held and there is no card left', () => {
    const plain = play(
      open('OAT', { wildChance: 0, minWordLength: 3 }).state,
      Array.from({ length: 2 }, () => tick),
    ).state
    const { effects } = play(plain, [letter('t'), letter('t')])
    expect(effects.at(-1)).toEqual({ type: 'INPUT_IGNORED', reason: 'already-selected' })
  })
})

describe('a wild in a real game', () => {
  /** OATRSX fully revealed, with wilds wherever the test puts them. */
  const boardWith = (...wildIds: number[]): GameState => {
    const opened = play(
      open('OATRSX', { wildChance: 0, minWordLength: 3 }).state,
      Array.from({ length: 5 }, () => tick),
    ).state
    return {
      ...opened,
      tiles: opened.tiles.map((tile) => ({ ...tile, wild: wildIds.includes(tile.id) })),
    }
  }

  it('shows the glyphs rather than the letters when a word is refused', () => {
    // Nothing in the fixture dictionary is three letters ending in X, so no letter completes it.
    const { effects } = play(boardWith(0, 1), [tap(0), tap(1), tap(5), submit])
    expect(effects.at(-1)).toEqual({
      type: 'WORD_REJECTED',
      word: `${WILD_GLYPH}${WILD_GLYPH}X`,
      reason: 'unknown',
    })
  })

  it('refuses a selection over the cap rather than searching an alphabet cubed', () => {
    // The deal cannot produce three, so this exercises the guard rather than the rule. Worth
    // holding: the alternative to refusing here is a million lookups on the main thread.
    const { effects } = play(boardWith(0, 1, 2), [tap(0), tap(1), tap(2), submit])
    expect(effects.at(-1)).toEqual({
      type: 'WORD_REJECTED',
      word: WILD_GLYPH.repeat(3),
      reason: 'unknown',
    })
  })

  it('shows the glyph in the word being built, never the letter it is masking', () => {
    /*
     * A regression test for a leak. The word line rendered `tile.letter`, so selecting a wild
     * spelled out the letter hidden under it: the player could read the mask off the screen,
     * which removes the entire gamble, and it disagreed with the board, which showed a card in
     * the same position.
     */
    const board = play(
      open('OAT', { wildChance: 0, minWordLength: 3 }).state,
      Array.from({ length: 2 }, () => tick),
    ).state
    const wilded: GameState = {
      ...board,
      tiles: board.tiles.map((tile) => (tile.id === 1 ? { ...tile, wild: true } : tile)),
    }
    const { state } = play(wilded, [tap(0), tap(1), tap(2)])
    expect(selectedLetters(state)).toBe(`O${WILD_GLYPH}T`)
    expect(selectedLetters(state)).not.toContain('A')
  })

  it('caps the deal and keeps every letter underneath, so a high chance cannot flood a board', () => {
    const flooded = play(
      open('OATRSX', { wildChance: 1, minWordLength: 3 }).state,
      Array.from({ length: 5 }, () => tick),
    ).state
    expect(flooded.tiles.filter((tile) => tile.wild)).toHaveLength(MAX_WILDS)
    expect(flooded.tiles.map((tile) => tile.letter).join('')).toBe('OATRSX')
  })

  it('refuses when the wild can only make words already found, and says which refusal it is', () => {
    /*
     * The player cannot see what the wild would have picked, so this has to be its own answer.
     * "Not a word" would be a lie about a selection that was three words at once until they were
     * all played. `keep` mode leaves the tiles available so the same selection can be made twice.
     */
    const only = dictionaryOf('OAT')
    const board = play(
      open('OAT', { wildChance: 0, minWordLength: 3, wordCompleteMode: 'keep' }).state,
      Array.from({ length: 2 }, () => tick),
      only,
    ).state
    const wilded: GameState = {
      ...board,
      tiles: board.tiles.map((tile) => (tile.id === 1 ? { ...tile, wild: true } : tile)),
    }
    const first = play(wilded, [tap(0), tap(1), tap(2), submit], only)
    expect(first.state.wordsFound.map((found) => found.word)).toEqual(['OAT'])

    const again = play(first.state, [tap(0), tap(1), tap(2), submit], only)
    expect(again.effects.at(-1)).toEqual({
      type: 'WORD_REJECTED',
      word: `O${WILD_GLYPH}T`,
      reason: 'all-found',
    })
    expect(again.state.wordsFound).toHaveLength(1)
  })

  it('records the word it became, not the glyphs', () => {
    // One wild among letters: O_T resolves to OAT, the only fixture word matching.
    const board = play(
      open('OAT', { wildChance: 0, minWordLength: 3 }).state,
      Array.from({ length: 2 }, () => tick),
    ).state
    const wilded: GameState = {
      ...board,
      tiles: board.tiles.map((tile) => (tile.id === 1 ? { ...tile, wild: true } : tile)),
    }
    const { state, effects } = play(wilded, [tap(0), tap(1), tap(2), submit])
    expect(state.wordsFound.map((found) => found.word)).toEqual(['OAT'])
    expect(effects.at(-1)).toEqual({
      type: 'WORD_ACCEPTED',
      word: 'OAT',
      points: 2,
      flips: 2,
      wilds: [1],
    })
  })
})
