import { useEffect, useState } from 'react'
import type { GameResult } from '@blinkered/engine'
import type { Messages } from '@blinkered/i18n'
import { BoardRow } from './LeaderboardPage.js'
import { leaderboard } from './account.js'
import type { Board, BoardRow as Row } from './account.js'

/**
 * Where the game that just finished sits on the global board.
 *
 * Nick's idea, and a better one than the tour's account screen: a paragraph about what an account
 * is for asks somebody to imagine a reason, and this hands them one they can see -- their score,
 * in the board's own shape, third from the top among named strangers.
 *
 * **It says which tense it is in.** For a guest the heading is `leaderboardWouldBe`, "Where this
 * game would rank", because a row drawn among real rows and left unlabelled reads as a result
 * that already counts, and for a guest it counts for nothing until they sign in. For somebody
 * signed in it is `leaderboardRanksHere`, because the game is already on its way to the server
 * and the conditional was simply wrong -- Nick, on a signed-in game sitting first: "that's
 * exactly where the game would rank. And does rank. Confusing."
 *
 * **The section is always here for a ranked game**, whether or not the score placed. It used to
 * vanish, which made the panel a different shape after a good game than after an ordinary one,
 * and left the board's link stranded in the middle of a table of your own games. A score outside
 * the board gets one quiet line and the link, which is the whole of what there is to say.
 */
export function BoardStanding({
  result,
  paused,
  messages,
  me,
  onSignIn,
  onGlobalBoard,
}: {
  readonly result: GameResult
  /**
   * Whether this game's clock ever stopped, which means it has no place on the board.
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
   * Decides three things: the name and picture on their row, which tense the heading is in, and
   * whether the offer beneath it is drawn at all. A signed-in player sees where their game
   * landed; a guest sees the same thing with an offer under it, which is the point.
   */
  readonly me: { readonly username: string; readonly avatarSeed: string } | null
  readonly onSignIn: () => void
  /**
   * Opens the global board for the rules just played.
   *
   * Here rather than in the table of your own games, where it used to sit between the heading and
   * the rows and left one reading available: that those rows were the leaderboard. They are your
   * own history. This section is the one that is actually about the board, so this is where the
   * way to it belongs -- as a link at the end of it, not as a call to action in the middle of
   * something else.
   */
  readonly onGlobalBoard: () => void
}): React.JSX.Element | null {
  const [board, setBoard] = useState<Board | null>(null)

  const ranked = result.canonical && !paused
  useEffect(() => {
    // Nothing to ask about for a game that cannot be on the board: `canonical` is what the server
    // checks before marking a game eligible, and a game whose clock stopped is refused the same
    // way. Either question's answer could only be discarded.
    if (!ranked) return undefined
    let current = true
    void leaderboard(result.language, result.difficulty).then((found) => {
      if (current) setBoard(found)
    })
    return () => {
      current = false
    }
  }, [ranked, result.language, result.difficulty])

  // A game on rules nobody else is playing has no board to be on, and so no link to one either.
  if (!result.canonical) return <p className="board-note">{messages.notRanked}</p>

  const link = (
    <button type="button" className="board-global-link" onClick={onGlobalBoard}>
      {messages.leaderboardTitle} →
    </button>
  )

  // The clock stopped, so there is a board and this game is not going on it. Said plainly, with
  // the way to the board still open: it is somebody else's board now, and still worth a look.
  if (paused) {
    return (
      <section className="board-standing">
        <p className="board-note">{messages.notRankedPaused}</p>
        {link}
      </section>
    )
  }

  /*
   * Still reading the board, or unable to: the link alone.
   *
   * Not nothing, which is what this did, and not a heading over an empty box either. One line
   * holds the section's place while the request is out, and stays as the whole section when the
   * request failed -- an offline player is told where the board is, and told nothing about where
   * they came, which is all anybody knows.
   */
  if (board === null) return <section className="board-standing">{link}</section>

  /*
   * The board as it stands, minus this game.
   *
   * Signed in, the upload of the game that just ended races the request above, so the answer may
   * already contain it. Projecting a row for a game that is already in the list is how somebody
   * ends up on their own board twice, and which way the race went is not something a results
   * screen should be able to show. The finish time identifies it: one person cannot finish two
   * games in the same millisecond, and it is the same number the client sent.
   */
  const others = board.rows.filter((row) => !isThisGame(row, result, me))
  const rows = placeInto(others, result, {
    username: me?.username ?? messages.leaderboardThisGame,
    // A picture either way. The seed is the reader's own when they have one, and the game's seed
    // otherwise, which is deterministic and theirs for as long as the panel is open.
    avatarSeed: me?.avatarSeed ?? String(result.seed),
  })

  /*
   * Outside the board: one line, and no inducement.
   *
   * The guest offer is deliberately absent here. An advertisement that appears whatever you
   * scored is an advertisement, and one that says you would be eleventh is an argument against
   * signing up. The button lower down the panel still offers to keep the game, which is the
   * honest version of the same ask.
   *
   * The wording names the number `SHOWN` holds. They move together or the line starts lying.
   */
  if (rows === null) {
    return (
      <section className="board-standing">
        <p className="board-note">{messages.leaderboardOutside}</p>
        {link}
      </section>
    )
  }

  return (
    <section className="board-standing is-placed" aria-labelledby="board-standing-title">
      <h3 id="board-standing-title">
        {me === null ? messages.leaderboardWouldBe : messages.leaderboardRanksHere}
      </h3>
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
      {link}
    </section>
  )
}

/** How many rows the board section shows. Short: it sits in a panel somebody is already reading. */
const SHOWN = 5

/** A row that may be the projected one, which is the only row with no game behind it. */
export type ProjectedRow = Omit<Row, 'gameId'> & { readonly gameId: string | null }

/**
 * Whether a board row is the game that just ended, arrived there ahead of this request.
 *
 * On the finish time and the name together. The time is the client's own number round-tripped
 * through the server -- `GameToKeep.finishedAt` is `result.at`, stored as a timestamp and handed
 * back as ISO -- and one player cannot repeat it, but two players can share a millisecond. On the
 * time alone this removed a stranger's row and moved everybody below it up a place, which is a
 * board that quietly disagrees with the one behind the link under it.
 *
 * A guest has nothing on the board by definition, so nothing is ever removed for one: their game
 * has not been uploaded, and any match at all would be somebody else's row.
 */
export function isThisGame(
  row: Row,
  result: GameResult,
  me: { readonly username: string } | null,
): boolean {
  if (me === null) return false
  return row.username === me.username && Date.parse(row.finishedAt) === result.at
}

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
