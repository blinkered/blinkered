import type { Messages } from '@blinkered/i18n'
import type { PlayedGame } from './account.js'
import { goTo, pathOf } from './route.js'

/**
 * A list of finished games, with the date as the way in.
 *
 * Shared by your own games and somebody else's, because they are the same list. The button is
 * in the first cell rather than wrapping the row: a `<tr>` cannot hold one, and making the row
 * itself clickable would mean reinventing the keyboard and focus behaviour a button already has.
 */
export function GamesTable({
  games,
  messages,
  onOpen,
}: {
  readonly games: readonly PlayedGame[]
  readonly messages: Messages
  /**
   * What opening a game does, or absent to navigate to its permalink.
   *
   * The account screen keeps its list mounted underneath and swaps the panel, so it passes a
   * handler. A public profile has no panel to swap and navigates to the permalink instead.
   */
  readonly onOpen?: (id: string) => void
}): React.JSX.Element {
  return (
    <table className="account-games">
      <thead>
        <tr>
          <th scope="col">{messages.columnWhen}</th>
          <th scope="col">{messages.columnGame}</th>
          <th scope="col">{messages.score}</th>
          <th scope="col">{messages.words}</th>
          <th scope="col">{messages.columnRounds}</th>
        </tr>
      </thead>
      <tbody>
        {games.map((game) => (
          <tr key={game.id}>
            <td>
              {/*
                An anchor, always, even where the click is handled here. The `href` is what makes
                a row middle-clickable into a new tab and right-clickable into a copied link,
                which a button can never be; the handler is what stops a plain left click from
                reloading the whole app to move one panel.
              */}
              <a
                className="game-open"
                href={pathOf({ at: 'played-game', id: game.id })}
                onClick={(event) => {
                  // Let the browser have the clicks that mean "somewhere else": a new tab, a new
                  // window, a download. Only the plain one is ours.
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                  if (event.button !== 0) return
                  event.preventDefault()
                  if (onOpen === undefined) goTo({ at: 'played-game', id: game.id })
                  else onOpen(game.id)
                }}
              >
                {new Date(game.finishedAt).toLocaleDateString()}
              </a>
            </td>
            <td>
              {game.language} · {game.difficulty}
            </td>
            <td>{game.score}</td>
            <td>{game.words}</td>
            <td>{game.rounds}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
