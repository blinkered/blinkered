import type { GameResult } from '@blinkered/engine'
import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { isPersonalBest } from './scores.js'
import type { Standing } from './scores.js'

interface LeaderboardProps {
  readonly standing: Standing
  /** The game that just finished, so it can be pointed at in the table. */
  readonly current: GameResult
  readonly messages: Messages
}

/** Enough to see where you came without scrolling, and to see the top even when you did badly. */
const SHOWN = 8

/**
 * Where the game that just finished sits among your own.
 *
 * Guest mode, so "your own" means this browser. Only finished games are here: quitting is not a
 * result, and a game abandoned at a good score is not a good game.
 */
export function Leaderboard({ standing, current, messages }: LeaderboardProps): React.JSX.Element {
  const { ranked, rank } = standing

  if (rank === 0) {
    // Custom rules. The game happened and is stored; it simply has nothing to be ranked against.
    return <p className="board-note">{messages.notRanked}</p>
  }
  // Always show the top, and always show the current game even when it is far below it.
  const top = ranked.slice(0, SHOWN)
  const rows = top.includes(current) ? top : [...top, current]

  return (
    <div className="leaderboard">
      <div className="leaderboard-head">
        <h2>{messages.personalBest}</h2>
        <span className="dim">{format(messages.rankOfTotal, { rank, total: ranked.length })}</span>
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
          {rows.map((result) => {
            const at = ranked.indexOf(result) + 1
            const isCurrent = result === current
            return (
              <tr
                key={`${String(result.at)}-${String(result.seed)}`}
                className={isCurrent ? 'is-current' : ''}
              >
                <td>{at}</td>
                <td>{result.score}</td>
                <td>{result.words}</td>
                <td>{result.rounds}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.includes(current) ? null : <p className="dim">{messages.thisGame}</p>}
    </div>
  )
}
