import { DIFFICULTIES, type Difficulty } from '@blinkered/engine'
import { messagesFor } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { useEffect, useState } from 'react'
import { Avatar } from './Avatar.js'
import { ignoredByManagers } from './autofill.js'
import { LanguagePicker } from './LanguagePicker.js'
import { leaderboard } from './account.js'
import type { Board, BoardRow as BoardRow_ } from './account.js'
import { countryName } from './countries.js'
import { goTo } from './route.js'
import type { CatalogueEntry } from './dictionary.js'

/**
 * One board, at `/l/<language>/<difficulty>`.
 *
 * **The board's language is the page's language**, which is the part worth stating because it is
 * not how the rest of the app works. Everywhere else the interface is in whatever the reader
 * picked in settings. Here it follows the board: opening `/l/fi/insane` puts the page in Finnish,
 * and changing the language selector changes both the board and the words around it at once.
 * Nick asked for exactly that, and it is right for the thing a board is -- a link somebody sends
 * to a player of that language, who should not have to read English to see where they rank.
 *
 * Nothing about that touches settings. A reader whose interface is Greek and who opens the
 * Finnish board sees a Finnish board and is still reading Greek everywhere else, because this is
 * a property of the address rather than a preference.
 *
 * **Both selectors navigate rather than filter.** They call `goTo`, so Back walks through the
 * boards somebody looked at, and the address is always the board on screen. A selector that set
 * state would leave the URL lying about what is displayed, which on the one page whose whole
 * purpose is being shared is the wrong way round.
 */
export function LeaderboardPage({
  language,
  difficulty,
  catalogue,
  myUsername,
  onHome,
}: {
  readonly language: string
  readonly difficulty: string
  readonly catalogue: readonly CatalogueEntry[]
  /**
   * The reader's own username, so their row can be marked. Null for a reader with no account.
   *
   * A name rather than an id, because a board row carries no user id: the rows are public and a
   * public row has never carried one. Comparing a name is enough here and adds nothing to the
   * wire, and names are unique by the index that makes them unique.
   */
  readonly myUsername: string | null
  readonly onHome: () => void
}): React.JSX.Element {
  const [board, setBoard] = useState<Board | null>(null)
  const [asked, setAsked] = useState(false)

  /*
   * Read in the board's own language, not the reader's.
   *
   * `messagesFor` falls back to English for a tag it does not have, which is what makes a
   * hand-typed address safe: `/l/klingon/insane` reads in English and then says there is no such
   * board, rather than failing to render at all.
   */
  const messages = messagesFor(language)

  useEffect(() => {
    setAsked(false)
    setBoard(null)
    let current = true
    void leaderboard(language, difficulty).then((found) => {
      // The guard is the point: both selectors navigate, so a slow answer for the board somebody
      // has already left must not overwrite the one they are looking at now.
      if (!current) return
      setBoard(found)
      setAsked(true)
    })
    return () => {
      current = false
    }
  }, [language, difficulty])

  const go = (to: { language?: string; difficulty?: string }): void => {
    const next = {
      at: 'board' as const,
      language: to.language ?? language,
      difficulty: to.difficulty ?? difficulty,
    }
    goTo(next)
  }

  return (
    <section className="board-page" aria-labelledby="board-title">
      <header className="board-head">
        <h2 id="board-title">{messages.leaderboardTitle}</h2>
        {/*
          The same way out the public pages use, with the label translated. `PlayerPage` has a
          private `HomeLink` that hardcodes "Play Blinkered" in English; `backToGame` already
          exists in every language, so this one says it in the board's.
        */}
        <button
          type="button"
          className="signin-again game-back"
          onClick={() => {
            goTo({ at: 'game' })
            onHome()
          }}
        >
          ← {messages.backToGame}
        </button>
      </header>

      <div className="board-pickers">
        <LanguagePicker
          catalogue={catalogue}
          value={language}
          readIn={language}
          label={messages.gameLanguage}
          onChange={(tag) => {
            go({ language: tag })
          }}
        />
        <label className="board-difficulty">
          <span>{messages.difficulty}</span>
          {/*
            The four opt-out attributes, because every field in this app carries them except the
            one in the email sign-in flow. A `<select>` has no business carrying an `autocomplete`
            token, so `ignoredByManagers` rather than `notACredential`. `autofill.test.ts` walks
            the source for exactly this and caught it missing here.
          */}
          <select
            value={difficulty}
            {...ignoredByManagers}
            onChange={(event) => {
              go({ difficulty: event.target.value })
            }}
          >
            {Object.keys(DIFFICULTIES).map((name) => (
              <option key={name} value={name}>
                {messages.difficultyNames[name as Difficulty]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!asked ? (
        <p className="board-note">{messages.gamesLoading}</p>
      ) : board === null || board.rows.length === 0 ? (
        /*
         * One message for an empty board and for a board that is not one.
         *
         * docs/ACCOUNTS.md: empty boards say they are empty rather than being offered as a menu
         * of disappointments. A language with no word list has no board and never will, and
         * saying so differently would be this page reporting which boards exist.
         */
        <p className="board-note">{messages.leaderboardEmpty}</p>
      ) : (
        <ol className="board-rows">
          {board.rows.map((row) => (
            <BoardRow
              key={row.gameId}
              row={row}
              language={language}
              messages={messages}
              mine={row.username === myUsername}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

/**
 * One row, shared by the real board and by the projected one on the game-over panel.
 *
 * Shared on purpose. The projection's whole effect depends on looking like the board it is a
 * projection of -- a row in a different shape would read as a different kind of thing -- and two
 * copies of this markup would drift the first time either was touched.
 *
 * `linked` is false for the projected row, which has no game on the server to point at yet. That
 * is the only difference between the two, and it is a property of the row rather than of the
 * screen it is on.
 */
export function BoardRow({
  row,
  language,
  messages,
  mine,
  linked = true,
}: {
  readonly row: Omit<BoardRow_, 'gameId'> & { readonly gameId: string | null }
  readonly language: string
  readonly messages: Messages
  readonly mine: boolean
  readonly linked?: boolean
}): React.JSX.Element {
  const who = (
    <>
      <Avatar seed={row.avatarSeed} size={28} />
      <span className="board-name">{row.username}</span>
      {row.country === null ? null : (
        <span className="board-country">{countryName(row.country, language)}</span>
      )}
    </>
  )
  return (
    <li className={`board-row${mine ? ' is-mine' : ''}`}>
      {/*
        The rank, and a medal for the first three.

        The medal is drawn from `row.rank` rather than from position in a list, so it cannot
        drift if anything ever filters rows after they arrive, and so the projected row gets the
        medal it would actually hold. `aria-hidden` because the rank beside it says the same
        thing out loud.
      */}
      <span className="board-rank">
        {row.rank <= 3 ? (
          <span className="board-medal" aria-hidden="true">
            {MEDALS[row.rank - 1]}
          </span>
        ) : null}
        <span className="board-place">{row.rank}</span>
      </span>
      {linked && row.gameId !== null ? (
        <a className="board-who" href={`/g/${encodeURIComponent(row.gameId)}`}>
          {who}
        </a>
      ) : (
        <span className="board-who">{who}</span>
      )}
      <span className="board-score">
        <strong>{row.score}</strong> <span className="board-unit">{messages.score}</span>
      </span>
      <span className="board-rounds">
        {row.rounds} <span className="board-unit">{messages.columnRounds}</span>
      </span>
    </li>
  )
}

/**
 * Gold, silver, bronze, in that order.
 *
 * Emoji rather than drawn shapes, because three characters need no asset, no colour decisions
 * and no dark-mode variant, and every platform this runs on has them. They are decoration: the
 * rank number sits beside each one and is what a screen reader reads.
 */
const MEDALS = ['🥇', '🥈', '🥉'] as const
