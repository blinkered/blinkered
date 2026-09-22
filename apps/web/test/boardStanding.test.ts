import { describe, expect, it } from 'vitest'
import type { GameResult } from '@blinkered/engine'
import { isThisGame, placeInto } from '../src/BoardStanding.js'
import type { BoardRow } from '../src/account.js'
import { routeOf, pathOf } from '../src/route.js'

/**
 * Where a finished game would rank, and the address a board lives at.
 *
 * The projection is the half worth testing hardest, because **getting it wrong is invisible**: it
 * would show somebody a rank they will not get, and nothing about the screen would look broken.
 * It restates the server's ordering -- score descending, rounds ascending, earlier finish wins --
 * rather than calling `compareResults`, which compares two `GameResult`s where one side here is a
 * board row with no engine version, seed or word list. So the agreement between the two is
 * asserted rather than assumed.
 */

const AS = { username: 'This game', avatarSeed: 'seed' }

function row(over: Partial<BoardRow> & { score: number }): BoardRow {
  return {
    rank: 1,
    gameId: `g-${String(over.score)}-${String(over.rounds ?? 6)}`,
    username: `player-${String(over.score)}`,
    avatarSeed: 'x',
    country: null,
    rounds: 6,
    finishedAt: '2026-09-01T00:00:00.000Z',
    ...over,
  }
}

function result(over: Partial<GameResult> & { score: number }): GameResult {
  return {
    words: 4,
    rounds: 6,
    language: 'en',
    difficulty: 'insane',
    canonical: true,
    at: Date.parse('2026-09-02T00:00:00.000Z'),
    seed: 4821,
    engineVersion: '0.3.0',
    ...over,
  }
}

describe('placing a finished game on a board', () => {
  it('puts a winning score first', () => {
    const rows = placeInto([row({ score: 30 }), row({ score: 20 })], result({ score: 40 }), AS)
    expect(rows?.map((one) => one.score)).toEqual([40, 30, 20])
    expect(rows?.[0]?.gameId).toBeNull()
    expect(rows?.[0]?.rank).toBe(1)
  })

  it('puts it in the middle where it belongs', () => {
    const rows = placeInto(
      [row({ score: 40 }), row({ score: 20 }), row({ score: 10 })],
      result({ score: 30 }),
      AS,
    )
    expect(rows?.map((one) => one.score)).toEqual([40, 30, 20, 10])
    expect(rows?.[1]?.gameId).toBeNull()
  })

  it('renumbers every rank, because inserting pushes the rest down', () => {
    const rows = placeInto(
      [row({ score: 40, rank: 1 }), row({ score: 20, rank: 2 })],
      result({ score: 30 }),
      AS,
    )
    // Not [1, 2, 2]: the ranks the server sent are wrong for this list the moment a row goes in.
    expect(rows?.map((one) => one.rank)).toEqual([1, 2, 3])
  })

  it('places onto an empty board, which is the first game ever played on it', () => {
    const rows = placeInto([], result({ score: 5 }), AS)
    expect(rows?.map((one) => one.rank)).toEqual([1])
    expect(rows?.[0]?.gameId).toBeNull()
  })

  /*
   * The tie-breaks, which are the two rules a reimplementation gets wrong.
   *
   * Fewer rounds wins at equal score, and at a full tie the row that was already there stays
   * ahead: the finished game is by definition later than anything on the board.
   */
  it('goes ahead of an equal score that took more rounds', () => {
    const rows = placeInto([row({ score: 30, rounds: 9 })], result({ score: 30, rounds: 6 }), AS)
    expect(rows?.[0]?.gameId).toBeNull()
  })

  it('goes behind an equal score that took fewer rounds', () => {
    const rows = placeInto([row({ score: 30, rounds: 4 })], result({ score: 30, rounds: 6 }), AS)
    expect(rows?.[0]?.gameId).not.toBeNull()
    expect(rows?.[1]?.gameId).toBeNull()
  })

  it('goes behind an identical score that got there first', () => {
    const rows = placeInto(
      [row({ score: 30, rounds: 6, finishedAt: '2026-09-01T00:00:00.000Z' })],
      result({ score: 30, rounds: 6 }),
      AS,
    )
    expect(rows?.[1]?.gameId).toBeNull()
  })

  /*
   * The case that must render nothing, and the reason the whole component is conditional.
   *
   * "You would be eleventh" is an argument against signing up, so a score outside the visible
   * board is not shown at all.
   */
  it('answers null when the score does not place', () => {
    const full = [50, 40, 30, 20, 10].map((score) => row({ score }))
    expect(placeInto(full, result({ score: 5 }), AS)).toBeNull()
  })

  it('still shows five rows when it squeezes in last', () => {
    const full = [50, 40, 30, 20, 10].map((score) => row({ score }))
    const rows = placeInto(full, result({ score: 15 }), AS)
    expect(rows?.map((one) => one.score)).toEqual([50, 40, 30, 20, 15])
    // The row it displaced is gone, and the projected one is last.
    expect(rows?.[4]?.gameId).toBeNull()
  })

  it('carries the name and picture it was given', () => {
    const rows = placeInto([], result({ score: 5 }), {
      username: 'clever-beacon-1267',
      avatarSeed: 'seed-1267',
    })
    expect(rows?.[0]).toMatchObject({ username: 'clever-beacon-1267', avatarSeed: 'seed-1267' })
  })
})

describe('the address a board lives at', () => {
  it('reads and writes /l/<language>/<difficulty>', () => {
    expect(routeOf('/l/en/insane')).toEqual({
      at: 'board',
      language: 'en',
      difficulty: 'insane',
    })
    expect(pathOf({ at: 'board', language: 'fi', difficulty: 'easy' })).toBe('/l/fi/easy')
  })

  it('round-trips a tag that needs encoding', () => {
    const route = { at: 'board', language: 'pt-BR', difficulty: 'medium' } as const
    expect(routeOf(pathOf(route))).toEqual(route)
  })

  it.each(['/l', '/l/', '/l/en', '/l/en/', '/l/en/insane/extra', '/l//insane'])(
    'reads %s as the game, because it is not a board',
    (path) => {
      // Half an address is not half a board; it is an address this app does not have, and the
      // game is what every such address has always been.
      expect(routeOf(path)).toEqual({ at: 'game' })
    },
  )

  it('does not disturb the addresses that were already here', () => {
    expect(routeOf('/g/abc')).toEqual({ at: 'played-game', id: 'abc' })
    expect(routeOf('/u/nick')).toEqual({ at: 'player', username: 'nick' })
    expect(routeOf('/admin')).toEqual({ at: 'admin' })
    expect(routeOf('/')).toEqual({ at: 'game' })
  })
})

/**
 * Telling your own game apart from the board's copy of it.
 *
 * Signed in, the upload of the game that just ended races the board request the panel makes, so
 * the board may come back already holding it. Without this the panel projects a second row for a
 * game that is already there and somebody sees themselves twice, and which way the race went is
 * not something a results screen should be able to show.
 */
describe('the game that just ended, on a board that already has it', () => {
  const finished = { at: 1_700_000_000_000 } as GameResult
  const ME = { username: 'quick-otter-1234' }

  it('recognises it by the name and the finish time the client sent', () => {
    const same = row({
      score: 120,
      username: ME.username,
      finishedAt: new Date(finished.at).toISOString(),
    })
    expect(isThisGame(same, finished, ME)).toBe(true)
  })

  it('leaves every other row alone, however alike', () => {
    // The same score, the same rounds, one second apart: two games, and only one of them is this
    // one. Matching on the numbers instead would have hidden somebody else's row.
    const other = row({
      score: 120,
      username: ME.username,
      finishedAt: new Date(finished.at + 1000).toISOString(),
    })
    expect(isThisGame(other, finished, ME)).toBe(false)
  })

  it('leaves a stranger who finished in the same millisecond alone', () => {
    // Two players can share a millisecond; one player cannot repeat one. On the time alone this
    // took a stranger off the board and moved everybody below them up a place.
    const theirs = row({
      score: 120,
      username: 'brave-heron-5678',
      finishedAt: new Date(finished.at).toISOString(),
    })
    expect(isThisGame(theirs, finished, ME)).toBe(false)
  })

  it('removes nothing at all for a guest, who has nothing on the board', () => {
    const same = row({ score: 120, finishedAt: new Date(finished.at).toISOString() })
    expect(isThisGame(same, finished, null)).toBe(false)
  })
})
