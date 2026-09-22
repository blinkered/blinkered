import { useEffect, useState } from 'react'
import type { GameResult } from '@blinkered/engine'
import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { myBest } from './account.js'
import { ROWS, rowsOfPlayed, rowsOfResults } from './personalTable.js'
import type { PersonalTable } from './personalTable.js'
import { isPersonalBest } from './scores.js'
import type { Standing } from './scores.js'

/**
 * Where the game that just finished sits among your own.
 *
 * It was `Leaderboard`, and the name was the confusion: this is not a leaderboard, it is your own
 * history, and it used to carry the global board's link between its heading and its table. Nick,
 * on a panel that read "Your best games" over a link reading "Leaderboard" over a table of three
 * rows: "Confusing." The link now lives in the section it belongs to, one below.
 *
 * Signed in, "your own" means your account, across every device you have played on. Signed out it
 * means this browser, which is all a guest has.
 */
export function PersonalBest({
  standing,
  current,
  signedIn,
  messages,
}: {
  readonly standing: Standing
  /** The game that just finished, which is the row this table exists to place. */
  readonly current: GameResult
  /**
   * Whether there is an account behind this game.
   *
   * Decides where the table comes from, and nothing else about how it is drawn. A guest's five
   * rows and a signed-in player's five rows are the same table of the same shape; only the
   * history behind them differs.
   */
  readonly signedIn: boolean
  readonly messages: Messages
}): React.JSX.Element | null {
  /*
   * This browser's answer, always computed, and the account's when it arrives.
   *
   * Local first rather than an empty section or a skeleton, for two reasons. It is real data --
   * on the one device most people play on it is usually the same table -- and it is the answer
   * this component falls back to anyway when the request fails, so an offline player and a
   * player waiting two hundred milliseconds go down the same path rather than two.
   */
  const local = rowsOfResults(standing, current)
  const [mine, setMine] = useState<PersonalTable | null>(null)

  // Read out as primitives, because they are the effect's dependencies and an effect keyed on
  // `current` itself would refetch on every render that rebuilt an equal object.
  const { language, difficulty, engineVersion, score, words, rounds, at } = current
  useEffect(() => {
    if (!signedIn) {
      // Signed out on a panel that was signed in a moment ago: drop the account's table rather
      // than leaving somebody else's history under the heading.
      setMine(null)
      return undefined
    }
    let live = true
    void myBest({ language, difficulty, engineVersion }, { score, rounds, at }).then((best) => {
      if (live && best !== null) setMine(rowsOfPlayed(best, { score, words, rounds, at }))
    })
    return () => {
      live = false
    }
  }, [signedIn, language, difficulty, engineVersion, score, words, rounds, at])

  // Custom rules. The game happened and is stored; it simply has nothing to be ranked against.
  // The line saying so is in the section below, which is where every other statement about
  // ranking now lives.
  if (standing.rank === 0) return null

  const table = mine ?? local

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
      {isPersonalBest(standing) ? (
        <p className="leaderboard-crown">{messages.newPersonalBest}</p>
      ) : null}
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
