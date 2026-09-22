import type { GameResult } from '@blinkered/engine'
import type { PlayedGame } from './account.js'
import type { Standing } from './scores.js'

/**
 * The table of your own games on the game-over panel, from either place it can come from.
 *
 * Two sources, one shape. Signed in, your games are the account's and live on the server; signed
 * out, they are this browser's and live in `localStorage`. The panel renders one table either
 * way, so the difference stops here rather than in the component.
 *
 * Nick's complaint is what this file is for. The panel used to put the global board's link
 * between the "Your best games" heading and the table under it, which left one reading
 * available: that the table *was* the leaderboard. It never was. This is your own history, and
 * saying which history is the whole job.
 */

/**
 * The game that just ended, as the four numbers that place it.
 *
 * A subset of `GameResult` rather than the thing itself, so the caller can hand over the fields
 * it already has as primitives. That is not a style preference: the component reads them out of
 * state and passes them as effect dependencies, and an effect keyed on an object re-runs on every
 * render that rebuilds an equal one.
 */
export interface PersonalScore {
  readonly score: number
  readonly words: number
  readonly rounds: number
  readonly at: number
}

/** One row, whichever source it came from. */
export interface PersonalRow {
  readonly score: number
  readonly words: number
  readonly rounds: number
  /** Milliseconds, so rows from both sources sort against each other without conversion. */
  readonly at: number
  /** The server's id, when this game has reached the server. Null for a game that has not. */
  readonly gameId: string | null
  /** Whether this is the game that just ended, which is the row the panel highlights. */
  readonly current: boolean
}

export interface PersonalTable {
  /** What to draw, at most `ROWS` of them. */
  readonly rows: readonly PersonalRow[]
  /** Where the current game came, counting from one. */
  readonly rank: number
  /** How many games it was ranked against, including itself. */
  readonly total: number
  /**
   * Whether the last row skipped a gap to get there.
   *
   * True when the current game is too far down to appear under the ones above it, so the table
   * is the top four and then yours. The component draws the break; without it, a game ranked
   * twelfth reads as though it came fifth.
   */
  readonly jumped: boolean
}

/**
 * Exactly five rows, always.
 *
 * Matches the global section above it, so the two tables read as siblings rather than as two
 * unrelated widgets, and keeps a panel that already outgrows a phone from growing with every
 * game somebody banks. It was eight, which is a third of a screen spent on games nobody is
 * looking for.
 */
export const ROWS = 5

/** Your games from this browser, which is all a guest has. */
export function rowsOfResults(standing: Standing, current: GameResult): PersonalTable {
  const rows: PersonalRow[] = []
  let mine: PersonalRow | null = null
  for (const result of standing.ranked) {
    const row = {
      score: result.score,
      words: result.words,
      rounds: result.rounds,
      at: result.at,
      gameId: null,
      // Identity, not equality: `rankedResults` hands back the stored objects, so the game that
      // just ended is the same object here, and two games with the same numbers are still two.
      current: result === current,
    }
    if (row.current) mine = row
    rows.push(row)
  }
  /*
   * A game that is not in its own ranking, which is a game on custom rules.
   *
   * `rankedResults` keeps only canonical games, so a nerd-mode game is ranked against nothing and
   * is not in the list. An empty table rather than a thrown error: the component above decides
   * whether to draw a section at all, and it decides that after asking this.
   */
  if (mine === null) return { rows: [], rank: 0, total: 0, jumped: false }
  return window(rows, mine, standing.rank, standing.ranked.length)
}

/**
 * Your games from the account, with the one that just ended put back in.
 *
 * The server was asked to leave it out, because it is being uploaded at the same moment and would
 * otherwise be there or not depending on which request finished first. Added here, once, so the
 * panel is the same either way -- and so it is present at all when the upload is still queued
 * behind an offline stretch.
 */
export function rowsOfPlayed(
  best: { readonly games: readonly PlayedGame[]; readonly total: number; readonly ahead: number },
  current: PersonalScore,
): PersonalTable {
  const mine: PersonalRow = {
    score: current.score,
    words: current.words,
    rounds: current.rounds,
    at: current.at,
    gameId: null,
    current: true,
  }
  const others = best.games.map((game) => ({
    score: game.score,
    words: game.words,
    rounds: game.rounds,
    at: Date.parse(game.finishedAt),
    gameId: game.id,
    current: false,
  }))
  /*
   * The rank comes from the server, not from this list.
   *
   * `ahead` counts every game of yours that beat this one; the list here is five of them at most.
   * Ranking within it was wrong in the one case somebody would notice: a game that came tenth of
   * ten, fetched alongside the top five, called itself sixth.
   *
   * `total` is counted the same way and excluded this game for the same reason, so it gains the
   * one row added back here.
   */
  return window([...others, mine].sort(compareRows), mine, best.ahead + 1, best.total + 1)
}

/**
 * `compareResults` from @blinkered/engine, for rows.
 *
 * Not a call to it: that function compares two `GameResult`s, and a row off the server has no
 * seed, no engine version and no word list. The rule is the same one -- best score, then the
 * fewest rounds it took, then whoever got there first -- because the server's SQL, the account's
 * table and this browser's table all disagreeing about the same two games is not a bug somebody
 * would find quickly.
 */
function compareRows(left: PersonalRow, right: PersonalRow): number {
  if (left.score !== right.score) return right.score - left.score
  if (left.rounds !== right.rounds) return left.rounds - right.rounds
  return left.at - right.at
}

/**
 * Five rows that always include your game.
 *
 * In the top five, the top five. Below it, the top four and then yours, with `jumped` set so the
 * break can be drawn: the alternative is a row numbered twelve sitting flush under a row numbered
 * four, which reads as a table that lost count.
 *
 * `rank` is passed rather than found, because the two sources know it two ways: this browser's
 * table holds every game and can look, while the account's holds five and has to be told.
 */
function window(
  ranked: readonly PersonalRow[],
  mine: PersonalRow,
  rank: number,
  total: number,
): PersonalTable {
  if (rank <= ROWS) return { rows: ranked.slice(0, ROWS), rank, total, jumped: false }
  // Filtered by identity rather than sliced around, so the row cannot appear twice however few
  // games came back with it.
  const above = ranked.filter((row) => row !== mine).slice(0, ROWS - 1)
  return { rows: [...above, mine], rank, total, jumped: true }
}
