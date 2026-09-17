import { useEffect, useState } from 'react'
import type { GameResult } from '@blinkered/engine'
import type { Messages } from '@blinkered/i18n'
import { BoardRow } from './LeaderboardPage.js'
import { leaderboard } from './account.js'
import type { Board, BoardRow as Row } from './account.js'

/**
 * Where the game that just finished would sit on the global board, shown before it is there.
 *
 * Nick's idea, and a better one than the tour's account screen: a paragraph about what an account
 * is for asks somebody to imagine a reason, and this hands them one they can see -- their score,
 * in the board's own shape, third from the top among named strangers.
 *
 * **It is a projection and it says so.** The heading is `leaderboardWouldBe`, "Where this game
 * would rank", because a row drawn among real rows and left unlabelled reads as a result that
 * already counts, and for a guest it counts for nothing until they sign in. The projected row
 * carries no game id and so is not a link: there is nothing on the server to point at yet.
 *
 * **It only appears when the score actually places.** Nothing renders for a game outside the
 * visible board, for a custom ruleset, or when the board could not be read. An inducement that
 * appears whatever you scored is an advertisement, and one that says you would be eleventh is an
 * argument against signing up.
 */
export function BoardPreview({
  result,
  paused,
  messages,
  me,
  onSignIn,
}: {
  readonly result: GameResult
  /**
   * Whether this game's clock ever stopped, which means it has no place to be projected into.
   *
   * The server will refuse to rank it, so showing somebody where it *would* have ranked is a
   * promise the next screen breaks. Passed in rather than read off `result`, which is the engine's
   * shape and knows nothing about clocks being stopped.
   */
  readonly paused: boolean
  readonly messages: Messages
  /**
   * The reader, when there is one.
   *
   * Decides two things: the name and picture on the projected row, and whether the offer beneath
   * it is drawn at all. A signed-in player sees where their game landed; a guest sees the same
   * thing with an offer under it, which is the point.
   */
  readonly me: { readonly username: string; readonly avatarSeed: string } | null
  readonly onSignIn: () => void
}): React.JSX.Element | null {
  const [board, setBoard] = useState<Board | null>(null)

  useEffect(() => {
    /*
     * Nothing to project onto for a custom ruleset.
     *
     * `canonical` is what the server checks before marking a game eligible, so a nerd-mode game
     * has no board to be on, and asking would be a request whose answer could only be discarded.
     */
    if (!result.canonical) return undefined
    // Nor for a game whose clock stopped: eligibility is decided the same way on the server, and
    // a projection the server will not honour is worse than no projection.
    if (paused) return undefined
    let current = true
    void leaderboard(result.language, result.difficulty).then((found) => {
      if (current) setBoard(found)
    })
    return () => {
      current = false
    }
  }, [result.canonical, paused, result.language, result.difficulty])

  if (board === null) return null

  const rows = placeInto(board.rows, result, {
    username: me?.username ?? messages.leaderboardThisGame,
    // A picture either way. The seed is the reader's own when they have one, and the game's seed
    // otherwise, which is deterministic and theirs for as long as the panel is open.
    avatarSeed: me?.avatarSeed ?? String(result.seed),
  })
  if (rows === null) return null

  return (
    <section className="board-preview" aria-labelledby="board-preview-title">
      <h3 id="board-preview-title">{messages.leaderboardWouldBe}</h3>
      <ol className="board-rows">
        {rows.map((row) => (
          <BoardRow
            key={row.gameId ?? 'projected'}
            row={row}
            language={result.language}
            messages={messages}
            mine={row.gameId === null}
            linked={row.gameId !== null}
          />
        ))}
      </ol>
      {me === null ? (
        <button type="button" className="btn btn-primary" onClick={onSignIn}>
          {messages.signInKeepGame}
        </button>
      ) : null}
    </section>
  )
}

/** How many rows the projection shows. Short: it sits above a panel somebody is already reading. */
const SHOWN = 5

/** A row that may be the projected one, which is the only row with no game behind it. */
export type ProjectedRow = Omit<Row, 'gameId'> & { readonly gameId: string | null }

/**
 * Inserts a finished game into a board, or answers null when it does not place.
 *
 * The comparison is the server's: score descending, then rounds ascending, then the earlier
 * finish. `compareResults` in @blinkered/engine is the same rule and is what the board's SQL was
 * written to agree with; the reason this does not call it is that it compares two `GameResult`s,
 * and one side here is a board row with no engine version, no seed and no word list. Showing
 * somebody a rank they will not get is the failure this guards against, so the order is asserted
 * in a test rather than trusted.
 *
 * Null when the game falls outside what the board would hold.
 */
export function placeInto(
  rows: readonly Row[],
  result: GameResult,
  as: { readonly username: string; readonly avatarSeed: string },
): readonly ProjectedRow[] | null {
  const ahead = rows.filter((row) => beats(row, result)).length
  if (ahead >= SHOWN) return null

  const projected: ProjectedRow = {
    rank: ahead + 1,
    gameId: null,
    username: as.username,
    avatarSeed: as.avatarSeed,
    country: null,
    score: result.score,
    rounds: result.rounds,
    finishedAt: new Date(result.at).toISOString(),
  }

  return (
    [...rows.slice(0, ahead), projected, ...rows.slice(ahead)]
      .slice(0, SHOWN)
      // Renumbered, because inserting a row pushes everything below it down and the ranks the
      // server sent are no longer right for this list.
      .map((row, at) => ({ ...row, rank: at + 1 }))
  )
}

/** Whether an existing row stays ahead of the finished game. */
function beats(row: Row, result: GameResult): boolean {
  if (row.score !== result.score) return row.score > result.score
  if (row.rounds !== result.rounds) return row.rounds < result.rounds
  // A full tie goes to whoever got there first, which is the server's own rule.
  return new Date(row.finishedAt).getTime() <= result.at
}
