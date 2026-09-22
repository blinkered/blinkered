import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { ROWS } from './personalTable.js'
import type { PersonalTable } from './personalTable.js'

/**
 * Where the game that just finished sits among your own.
 *
 * It was `Leaderboard`, and the name was the confusion: this is not a leaderboard, it is your own
 * history, and it used to carry the global board's link between its heading and its table. Nick,
 * on a panel that read "Your best games" over a link reading "Leaderboard" over a table of three
 * rows: "Confusing." The link now lives in the section it belongs to, one below.
 *
 * Which history the table holds is decided by `usePersonalTable`, not here: signed in it is your
 * account, across every device you have played on, and signed out it is this browser, which is
 * all a guest has. This draws whichever one it is handed, because the two are the same table of
 * the same shape and only the history behind them differs.
 */
export function PersonalBest({
  table,
  best,
  messages,
}: {
  /** The rows to draw, or null when there is no finished game to place. */
  readonly table: PersonalTable | null
  /** Whether to hang the crown on it, asked of this table rather than of a second history. */
  readonly best: boolean
  readonly messages: Messages
}): React.JSX.Element | null {
  // Nothing to draw for a game that is ranked against nothing, which is a game on custom rules.
  // The line saying so is in the section below, which is where every statement about ranking now
  // lives.
  if (table === null || table.rank === 0) return null

  return (
    <section className="personal-best" aria-labelledby="personal-best-title">
      <div className="personal-best-head">
        <h2 id="personal-best-title">{messages.personalBest}</h2>
        {/*
          "#2 of 3", not "2 of 3", which read as page two of three.

          Composed from `columnRank` rather than given a message of its own: that key is already
          the rank sign this locale writes, so the two agree by construction and no translator has
          to be asked the same question twice.
        */}
        <span className="dim">
          {messages.columnRank}
          {format(messages.rankOfTotal, { rank: table.rank, total: table.total })}
        </span>
      </div>
      {/* Only when there was something to beat. Calling a first game a new personal best is
          the same species of nonsense as telling somebody who just finished one that no
          finished games exist yet. */}
      {best ? <p className="leaderboard-crown">{messages.newPersonalBest}</p> : null}
      <table className="nerd-table">
        <thead>
          <tr>
            <th>{messages.columnRank}</th>
            <th>{messages.score}</th>
            <th>{messages.words}</th>
            <th>{messages.round}</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, at) => {
            // Where the row actually came, which is its position in the table for everything
            // above the break and the current game's own rank for the row after it.
            const place = table.jumped && at === ROWS - 1 ? table.rank : at + 1
            return (
              <tr
                key={row.gameId ?? `current-${String(row.at)}`}
                className={`${row.current ? 'is-current' : ''}${
                  table.jumped && at === ROWS - 1 ? ' is-jumped' : ''
                }`}
              >
                <td>{place}</td>
                <td>{row.score}</td>
                <td>{row.words}</td>
                <td>{row.rounds}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
