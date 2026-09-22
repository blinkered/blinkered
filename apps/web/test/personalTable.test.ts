import { describe, expect, it } from 'vitest'
import { ENGINE_VERSION } from '@blinkered/engine'
import type { GameResult } from '@blinkered/engine'
import { ROWS, rowsOfPlayed, rowsOfResults } from '../src/personalTable.js'
import { toppedIt } from '../src/usePersonalTable.js'
import type { PlayedGame } from '../src/account.js'
import { standingOf } from '../src/scores.js'

/**
 * The table of your own games on the game-over panel, from both places it can come from.
 *
 * Worth testing hardest where the two sources have to agree: a signed-in player's table comes
 * off the server and a guest's comes out of `localStorage`, and a panel that ordered them
 * differently would be showing the same player two histories. The ordering restates the rule
 * `compareResults` holds and the board's SQL was written to agree with, so the agreement is
 * asserted rather than assumed.
 */

const GROUP = { language: 'en', difficulty: 'medium' as const, engineVersion: ENGINE_VERSION }

function result(over: Partial<GameResult> & { score: number }): GameResult {
  return {
    words: 10,
    rounds: 20,
    language: 'en',
    difficulty: 'medium',
    canonical: true,
    at: 1_000_000 + over.score,
    seed: over.score,
    engineVersion: ENGINE_VERSION,
    ...over,
  }
}

function played(over: Partial<PlayedGame> & { score: number }): PlayedGame {
  return {
    id: `game-${String(over.score)}`,
    language: 'en',
    difficulty: 'medium',
    canonical: true,
    speedMultiplier: 1,
    words: 10,
    rounds: 20,
    engineVersion: ENGINE_VERSION,
    finishedAt: new Date(1_000_000 + over.score).toISOString(),
    ...over,
  }
}

describe('the table of your own games', () => {
  describe('from this browser', () => {
    it('is the top five when your game is in them', () => {
      const mine = result({ score: 150 })
      const all = [result({ score: 200 }), mine, result({ score: 100 })]
      const table = rowsOfResults(standingOf(all, mine, GROUP), mine)
      expect(table.rows.map((row) => row.score)).toEqual([200, 150, 100])
      expect(table.rank).toBe(2)
      expect(table.total).toBe(3)
      expect(table.jumped).toBe(false)
      expect(table.rows.filter((row) => row.current)).toHaveLength(1)
    })

    it('is the top four and then yours when yours is further down', () => {
      const mine = result({ score: 10 })
      const all = [mine, ...[90, 80, 70, 60, 50, 40].map((score) => result({ score }))]
      const table = rowsOfResults(standingOf(all, mine, GROUP), mine)
      expect(table.rows).toHaveLength(ROWS)
      expect(table.rows.map((row) => row.score)).toEqual([90, 80, 70, 60, 10])
      // Seventh of seven, and the row says seventh rather than fifth. The break is what stops
      // the number reading as a table that lost count.
      expect(table.rank).toBe(7)
      expect(table.total).toBe(7)
      expect(table.jumped).toBe(true)
      expect(table.rows.at(-1)?.current).toBe(true)
    })

    it('is empty for a game that is ranked against nothing', () => {
      // Custom rules: `rankedResults` keeps only canonical games, so this one is not in its own
      // ranking. An empty table rather than a throw, because the panel asks before it decides
      // whether to draw the section at all.
      const mine = result({ score: 120, canonical: false })
      const table = rowsOfResults(standingOf([mine], mine, GROUP), mine)
      expect(table).toEqual({ rows: [], rank: 0, total: 0, jumped: false })
    })
  })

  describe('from the account', () => {
    it('puts the game that just ended back in, and counts it', () => {
      const table = rowsOfPlayed(
        { games: [played({ score: 200 }), played({ score: 100 })], total: 2, ahead: 1 },
        { score: 150, words: 26, rounds: 20, at: 9_000_000 },
      )
      expect(table.rows.map((row) => row.score)).toEqual([200, 150, 100])
      expect(table.rank).toBe(2)
      // The server was asked to leave this game out of both the rows and the count, so the count
      // it gave has to gain the one row added here. A total that did not is the off-by-one the
      // exclusion exists to prevent.
      expect(table.total).toBe(3)
      expect(table.rows[1]?.current).toBe(true)
      expect(table.rows[1]?.gameId).toBeNull()
    })

    it('orders the way the board does: score, then rounds, then who got there first', () => {
      const table = rowsOfPlayed(
        {
          games: [
            played({ score: 100, rounds: 30, finishedAt: new Date(5000).toISOString() }),
            played({ score: 100, rounds: 20, finishedAt: new Date(7000).toISOString() }),
            played({ score: 100, rounds: 20, finishedAt: new Date(3000).toISOString() }),
          ],
          total: 3,
          ahead: 1,
        },
        { score: 100, words: 26, rounds: 20, at: 4000 },
      )
      // Same score throughout: the fewest rounds first, and among those the earliest finish.
      expect(table.rows.map((row) => [row.rounds, row.at])).toEqual([
        [20, 3000],
        [20, 4000],
        [20, 7000],
        [30, 5000],
      ])
      expect(table.rank).toBe(2)
    })

    it('keeps your game visible when it is nowhere near the top', () => {
      const others = [90, 80, 70, 60, 50].map((score) => played({ score }))
      // Forty games, every one of them better: the rank is the server's count and not a position
      // in the five rows that came back with it. Ranked here, this game would call itself sixth.
      const table = rowsOfPlayed(
        { games: others, total: 40, ahead: 40 },
        { score: 5, words: 3, rounds: 4, at: 9_000_000 },
      )
      expect(table.rows).toHaveLength(ROWS)
      expect(table.rows.map((row) => row.score)).toEqual([90, 80, 70, 60, 5])
      expect(table.jumped).toBe(true)
      expect(table.rank).toBe(41)
      // Forty games on the server, plus the one that is not there yet.
      expect(table.total).toBe(41)
    })

    it('links the rows that have a game behind them, and not the one that does not', () => {
      const table = rowsOfPlayed(
        { games: [played({ score: 200 })], total: 1, ahead: 1 },
        { score: 10, words: 2, rounds: 3, at: 9_000_000 },
      )
      expect(table.rows.map((row) => row.gameId)).toEqual(['game-200', null])
    })
  })
})

/**
 * The crown, and the same claim in the share text.
 *
 * Asked of the table on screen rather than of a second history, which is the fault it was
 * written for: the table came from the account while this came from `localStorage`, so a
 * signed-in player whose browser held three games could be congratulated on a personal best
 * directly above a table showing them fourth of ten.
 */
describe('whether this game topped your table', () => {
  const table = (rank: number, total: number) => ({ rows: [], rank, total, jumped: false })

  it('is true at the top of a table with something to have topped', () => {
    expect(toppedIt(table(1, 10))).toBe(true)
  })

  it('is false anywhere else in it', () => {
    expect(toppedIt(table(4, 10))).toBe(false)
  })

  it('is false for a first game, which has beaten nothing', () => {
    expect(toppedIt(table(1, 1))).toBe(false)
  })

  it('is false when there is no table at all', () => {
    expect(toppedIt(null)).toBe(false)
  })
})
