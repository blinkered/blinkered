import { describe, expect, it } from 'vitest'
import { dealt, letter, open, play, revealedLetters, submit, tick } from './helpers.js'
import type { Effect } from '../src/index.js'

const revealsIn = (effects: readonly Effect[]): number =>
  effects.filter((effect) => effect.type === 'REVEALED').length

describe('round lifecycle', () => {
  it('opens with one tile face up and the timer reading N', () => {
    const { state, effects } = dealt('ATESON')
    expect(state.ticksRemaining).toBe(6)
    expect(state.revealsThisRound).toBe(1)
    // `open` lays the letters so the deal spells its argument, so the first one is always A. Which
    // slot holds it is the seed's business and is deliberately not asserted.
    expect(revealedLetters(state)).toBe('A')
    expect(effects).toHaveLength(1)
    expect(effects[0]).toMatchObject({ type: 'REVEALED' })
  })

  it('reveals one letter a tick until the board is full', () => {
    /*
     * This used to assert reading order, `A` then `AT` then `ATE`, and there is no reading order
     * any more: a tick turns over a letter chosen from whatever is face down. What survives is
     * the part the round is built on -- exactly one letter arrives per tick, and none arrives
     * twice -- so it is counted rather than spelled.
     *
     * `revealedLetters` reads the board in slot order, which is what a player sees, and after k
     * ticks that is some arrangement of the first k letters this helper laid down.
     */
    let current = dealt('ATESON').state
    const seen: string[] = [revealedLetters(current)]
    for (let i = 0; i < 5; i++) {
      current = play(current, [tick]).state
      seen.push(revealedLetters(current))
    }
    expect(seen.map((letters) => letters.length)).toEqual([1, 2, 3, 4, 5, 6])
    for (const [at, letters] of seen.entries()) {
      expect([...letters].sort().join('')).toBe([...'ATESON'.slice(0, at + 1)].sort().join(''))
    }
    expect(seen.at(-1)).toHaveLength(6)
  })

  it('shows the last tile with exactly one tick left', () => {
    const { state } = play(
      open('ATESON').state,
      Array.from({ length: 5 }, () => tick),
    )
    expect(state.ticksRemaining).toBe(1)
    expect(state.revealsThisRound).toBe(6)
  })

  it('runs a round for exactly N ticks, then shuffles', () => {
    const { state, effects } = play(
      open('ATESON').state,
      Array.from({ length: 6 }, () => tick),
    )
    const ended = effects.filter((effect) => effect.type === 'ROUND_ENDED')
    expect(ended).toHaveLength(1)
    expect(state.roundIndex).toBe(1)
    expect(state.ticksRemaining).toBe(6)
    expect(state.revealsThisRound).toBe(1)
  })

  it('hides and unspends everything at the shuffle, and re-lays the board', () => {
    const { state, effects } = play(
      open('ATESON').state,
      Array.from({ length: 6 }, () => tick),
    )
    expect(state.tiles.filter((t) => t.revealed)).toHaveLength(1)
    expect(state.tiles.every((t) => !t.spent)).toBe(true)
    const positions = [...state.tiles.map((t) => t.position)].sort((a, b) => a - b)
    expect(positions).toEqual([0, 1, 2, 3, 4, 5])
    const ended = effects.find((effect) => effect.type === 'ROUND_ENDED')
    expect(ended).toMatchObject({ flipsCharged: 0 })
    expect([...(ended?.type === 'ROUND_ENDED' ? ended.layout : [])].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5,
    ])
  })

  it('charges one flip per reveal', () => {
    const { state } = play(open('ATESON', { initialFlips: 100 }).state, [tick, tick])
    expect(state.flipsRemaining).toBe(97)
  })

  it('stops revealing once the flips run out, but still finishes the round', () => {
    const opened = open('ATESON', { initialFlips: 3 }).state
    expect(opened.flipsRemaining).toBe(2)
    const { state, effects } = play(
      opened,
      Array.from({ length: 4 }, () => tick),
    )
    expect(revealsIn(effects)).toBe(2)
    expect(state.revealsThisRound).toBe(3)
    expect(state.flipsRemaining).toBe(0)
    expect(state.status).toBe('playing')
  })

  it('ends the game when the flips are gone and the round completes', () => {
    const { state, effects } = play(
      open('ATESON', { initialFlips: 3 }).state,
      Array.from({ length: 6 }, () => tick),
    )
    expect(state.status).toBe('over')
    expect(state.flipsRemaining).toBe(0)
    expect(effects.at(-1)).toEqual({ type: 'GAME_OVER' })
  })

  it('holds the full board for holdTicks extra ticks', () => {
    const opened = open('ATESON', { holdTicks: 2 }).state
    expect(opened.ticksRemaining).toBe(8)
    const exposed = play(
      opened,
      Array.from({ length: 5 }, () => tick),
    )
    expect(exposed.state.revealsThisRound).toBe(6)
    expect(exposed.state.ticksRemaining).toBe(3)
    // Three ticks of a fully exposed board instead of one, and no further reveals.
    const held = play(exposed.state, [tick, tick])
    expect(revealsIn(held.effects)).toBe(0)
    expect(held.state.roundIndex).toBe(0)
    expect(held.state.ticksRemaining).toBe(1)
    const rolled = play(held.state, [tick])
    expect(rolled.state.roundIndex).toBe(1)
  })

  it('charges the same flips per round however long the hold', () => {
    const withHold = play(
      open('ATESON', { holdTicks: 4, initialFlips: 100 }).state,
      Array.from({ length: 10 }, () => tick),
    ).state
    const without = play(
      open('ATESON', { holdTicks: 0, initialFlips: 100 }).state,
      Array.from({ length: 6 }, () => tick),
    ).state
    expect(withHold.roundIndex).toBe(1)
    expect(without.roundIndex).toBe(1)
    expect(withHold.flipsRemaining).toBe(without.flipsRemaining)
  })

  it('carries the hold into every later round', () => {
    const second = play(
      open('ATESON', { holdTicks: 2 }).state,
      Array.from({ length: 8 }, () => tick),
    )
    expect(second.state.roundIndex).toBe(1)
    expect(second.state.ticksRemaining).toBe(8)
  })

  it('ends the moment the board goes dead, without running the timer down', () => {
    /*
     * One letter up, one flip left, and a three-letter minimum: the flip can buy a second letter
     * and there is no third, so the game is already decided and ends on the deal.
     *
     * It used to take one more tick to get here -- the old rule waited for the flips to reach
     * zero, so it turned over the second letter first. Nothing about that tile could matter,
     * which is the whole objection: the player was watching a game that was already over.
     */
    const { state, effects } = dealt('ATESON', { initialFlips: 2 })
    expect(revealedLetters(state)).toBe('A')
    expect(state.flipsRemaining).toBe(1)
    expect(state.status).toBe('over')
    expect(state.ticksRemaining).toBe(6)
    expect(effects.at(-1)).toEqual({ type: 'GAME_OVER' })
  })

  it('keeps going when exactly enough letters are exposed to spell something', () => {
    const { state } = play(dealt('ATESON', { initialFlips: 3 }).state, [tick, tick])
    // Slot order, so the three letters the deal laid down come back in some arrangement.
    expect([...revealedLetters(state)].sort().join('')).toBe('AET')
    expect(state.flipsRemaining).toBe(0)
    expect(state.status).toBe('playing')
  })

  it('ends when a word spends the last letters it could have used', () => {
    // The word still scores. It just leaves nothing behind to play with.
    const exposed = play(dealt('ATESON', { initialFlips: 3, flipEconomy: 'none' }).state, [
      tick,
      tick,
    ]).state
    const { state, effects } = play(exposed, [letter('A'), letter('T'), letter('E'), submit])
    expect(state.score).toBe(2)
    expect(state.wordsFound.map((found) => found.word)).toEqual(['ATE'])
    expect(state.status).toBe('over')
    expect(effects.at(-1)).toEqual({ type: 'GAME_OVER' })
  })

  it('can be revived by a word that pays for more flips', () => {
    /*
     * Near enough the same position, but fibonacci pays two flips for ATE and the budget starts
     * one higher, so the three left over can reach the three letters a word needs and reveals
     * resume.
     *
     * The extra flip is load-bearing now. At the old budget the word paid for two reveals and
     * two is short of the three-letter floor, so the game ends rather than reviving: a payment
     * that cannot reach another word is not a revival, and the engine no longer pretends
     * otherwise by spending it a tile at a time.
     */
    const exposed = play(dealt('ATESON', { initialFlips: 4 }).state, [tick, tick]).state
    const { state } = play(exposed, [letter('A'), letter('T'), letter('E'), submit])
    expect(state.status).toBe('playing')
    expect(state.flipsRemaining).toBe(3)
    expect(revealedLetters(play(state, [tick]).state)).toBe('S')
  })

  /*
   * The rule playtesting asked for: a round that cannot produce another word deals the next board
   * instead of spending its remaining ticks in front of a player who can do nothing.
   *
   * "The remaining flips count down at the normal rate which is a waste of user time."
   */
  describe('a round with too few letters left', () => {
    /** Six letters, three-letter floor, and flips enough that the budget is never the reason. */
    const roomy = { initialFlips: 40 } as const

    it('deals the next board as soon as a word takes the count below the floor', () => {
      // ATE and SON both score, which spends all six: nothing is left to spell a third word
      // with, and five ticks of the round are still unused.
      const full = play(
        open('ATESON', roomy).state,
        Array.from({ length: 5 }, () => tick),
      ).state
      expect(full.revealsThisRound).toBe(6)
      const { state, effects } = play(full, [
        letter('A'),
        letter('T'),
        letter('E'),
        submit,
        letter('S'),
        letter('O'),
        letter('N'),
        submit,
      ])
      const ended = effects.filter((effect) => effect.type === 'ROUND_ENDED')
      expect(ended).toHaveLength(1)
      expect(ended[0]).toMatchObject({ cutShort: true, flipsCharged: 0 })
      expect(state.roundIndex).toBe(1)
      expect(state.status).toBe('playing')
      // Both words still count, and the board is fresh with its first tile up.
      expect(state.wordsFound.map((found) => found.word)).toEqual(['ATE', 'SON'])
      expect(state.revealsThisRound).toBe(1)
    })

    it('charges nothing for the tiles it skips', () => {
      // A flip is spent by a reveal and by nothing else, which is what makes clearing a board
      // cheaper than dawdling on one rather than dearer.
      const full = play(
        open('ATESON', roomy).state,
        Array.from({ length: 5 }, () => tick),
      ).state
      const before = full.flipsRemaining
      const { state } = play(full, [letter('A'), letter('T'), letter('E'), submit])
      // ATE spends three tiles and pays two flips; three letters are left, which is exactly the
      // floor, so this round is not cut and nothing but the word has changed the budget.
      expect(state.flipsRemaining).toBe(before + 2)
      expect(state.roundIndex).toBe(0)

      const { state: cut } = play(state, [letter('S'), letter('O'), letter('N'), submit])
      // SON pays two more. The cut itself is free: the deal that follows spends one flip on the
      // first tile of the new board, the way any deal does.
      expect(cut.flipsRemaining).toBe(before + 4 - 1)
    })

    it('says a round ended normally was not cut short', () => {
      const { effects } = play(
        open('ATESON', roomy).state,
        Array.from({ length: 6 }, () => tick),
      )
      const ended = effects.filter((effect) => effect.type === 'ROUND_ENDED')
      expect(ended).toHaveLength(1)
      expect(ended[0]).toMatchObject({ cutShort: false })
    })

    it('ends the game instead when no future board could reach a word either', () => {
      // Three flips against a four-letter floor: this round is dead and so is every round after
      // it, because a fresh board would only turn over three tiles. That is game over, not a
      // cut, and the distinction is the reason `settle` runs first.
      const { state, effects } = open('ATESON', { initialFlips: 3, minWordLength: 4 })
      expect(state.status).toBe('over')
      expect(effects.filter((effect) => effect.type === 'ROUND_ENDED')).toHaveLength(0)
      expect(effects.at(-1)).toEqual({ type: 'GAME_OVER' })
    })

    it('counts the letters a flip could still turn over, not only the ones showing', () => {
      // One letter up and a three-letter floor, so the count showing is below the floor and the
      // round survives anyway: there are five tiles face down and the flips to pay for them.
      const { state } = open('ATESON', roomy)
      expect(state.tiles.filter((tile) => tile.revealed)).toHaveLength(1)
      expect(state.status).toBe('playing')
      expect(state.roundIndex).toBe(0)
    })
  })

  it('ignores every input once the game is over', () => {
    const over = play(
      open('ATESON', { initialFlips: 3 }).state,
      Array.from({ length: 6 }, () => tick),
    ).state
    const after = play(over, [tick, { type: 'SELECT_LETTER', letter: 'A' }])
    expect(after.state).toBe(over)
    expect(after.effects).toEqual([
      { type: 'INPUT_IGNORED', reason: 'game-over' },
      { type: 'INPUT_IGNORED', reason: 'game-over' },
    ])
  })
})
