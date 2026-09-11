import { useEffect, useState } from 'react'
import { alphabetFor } from '@blinkered/engine'
import type { TieredIndex } from '@blinkered/words'
import { gameDetail } from './account.js'
import type { PlayedGameDetail, PlayedWord } from './account.js'
import { spellingFor } from './spelling.js'

/**
 * One finished game, round by round.
 *
 * The listing answers "what did I score"; this answers the two questions a listing cannot. What
 * words did I find, and what was in front of me when I found them.
 *
 * **Boards are shown by change rather than one per round**, which is the whole layout decision.
 * A fifteen-round game stores fifteen boards and thirteen of them are usually identical, so
 * drawing them all is a wall of the same twelve letters with the interesting thing buried in it.
 * What a player remembers is the board they had and the moment it moved under them, so the
 * opening deal is drawn once and every later round says only what changed. A game where nothing
 * was replaced then reads as one board and a list of words, which is what it was.
 *
 * English, like the rest of the account surface, and for the reason recorded in `SignInDialog`.
 */

/** Renders a tick count as the clock a player was watching. */
function elapsed(tick: number, secondsPerTick: number): string {
  const total = Math.round(tick * secondsPerTick)
  const minutes = Math.floor(total / 60)
  return `${String(minutes)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * What changed between two boards, as the letters that moved.
 *
 * Positional rather than a set difference, because a replacement is one tile changing face and
 * the position is half of what makes it recognisable: `V` becoming `O` in the eleventh slot is a
 * different memory from a `V` vanishing somewhere.
 */
function changes(before: string, after: string): { at: number; from: string; to: string }[] {
  const was = before.split(' ')
  const now = after.split(' ')
  const moved: { at: number; from: string; to: string }[] = []
  now.forEach((face, at) => {
    const old = was[at]
    if (old !== undefined && old !== face) moved.push({ at, from: old, to: face })
  })
  return moved
}

export function GameDetail({
  id,
  dictionary,
  onBack,
}: {
  readonly id: string
  /**
   * The dictionary in hand, or null.
   *
   * Only useful when it happens to be the same language as the game being read, which is the
   * common case and never worth forcing: fetching a whole word list to draw a history would cost
   * megabytes to restore a handful of Vietnamese spaces. See `spelling.ts`.
   */
  readonly dictionary: TieredIndex | null
  readonly onBack: () => void
}): React.JSX.Element {
  const [game, setGame] = useState<PlayedGameDetail | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    setGame(null)
    setFailed(false)
    void gameDetail(id).then((found) => {
      if (!live) return
      if (found === null) setFailed(true)
      else setGame(found)
    })
    return () => {
      live = false
    }
  }, [id])

  if (failed) {
    return (
      <div className="game-detail">
        <BackLink onBack={onBack} />
        <p className="signin-note is-bad" lang="en">
          That game could not be read.
        </p>
      </div>
    )
  }
  if (game === null) {
    return (
      <div className="game-detail">
        <BackLink onBack={onBack} />
        <p className="dim" lang="en">
          Reading the game…
        </p>
      </div>
    )
  }

  const alphabet = alphabetFor(game.language)
  const { spell, laid } = spellingFor(game.language, dictionary)
  const detail = game.detail
  const byRound = new Map<number, PlayedWord[]>()
  for (const word of detail?.words ?? []) {
    byRound.set(word.round, [...(byRound.get(word.round) ?? []), word])
  }
  const boards = detail?.boards ?? []
  const opening = boards[0]

  return (
    <div className="game-detail">
      <BackLink onBack={onBack} />

      <header className="game-head">
        <p className="game-when" lang="en">
          {new Date(game.finishedAt).toLocaleString(undefined, {
            dateStyle: 'full',
            timeStyle: 'short',
          })}
        </p>
        <p className="game-what">
          {game.language} · {game.difficulty}
        </p>
        <p className="game-score">
          <strong>{game.score}</strong>
          <span className="dim" lang="en">
            {' '}
            points from {game.words} words over {game.rounds} rounds
          </span>
        </p>
        {/* Said plainly rather than left to be inferred from a board it never appears on. */}
        {game.canonical ? null : (
          <p className="signin-note" lang="en">
            Played on edited rules, so this game is not ranked.
          </p>
        )}
      </header>

      {detail === null ? (
        <p className="dim" lang="en">
          The words and boards for this game are no longer kept.
        </p>
      ) : (
        <>
          {opening === undefined ? null : (
            <section>
              <h2 lang="en">The opening board</h2>
              <Board board={opening} direction={alphabet.direction} />
            </section>
          )}

          <section>
            <h2 lang="en">Round by round</h2>
            <ol className="rounds">
              {boards.map((board, round) => {
                const moved = round === 0 ? [] : changes(boards[round - 1] as string, board)
                const found = byRound.get(round) ?? []
                return (
                  <li key={round} className="round">
                    <span className="round-number" aria-hidden="true">
                      {round + 1}
                    </span>
                    <div className="round-body">
                      {/* The change, above the word, because it happened first: the board moved
                          and then the player found something on what was left. */}
                      {moved.map((change) => (
                        <p key={change.at} className="round-change" lang="en">
                          <span className="chip is-gone">{change.from}</span>
                          <span aria-hidden="true">→</span>
                          <span className="chip">{change.to}</span>
                          <span className="dim"> replaced in slot {change.at + 1}</span>
                        </p>
                      ))}
                      {found.length === 0 && moved.length === 0 ? (
                        <p className="round-nothing dim" lang="en">
                          nothing found
                        </p>
                      ) : null}
                      {found.map((word) => (
                        <p key={word.word} className="round-word">
                          <span
                            className="found-word"
                            dir={alphabet.direction}
                            title={spell(word.word)}
                          >
                            {laid(word.word).map(({ letter, tile }, at) => (
                              <span
                                key={`${String(at)}-${letter}`}
                                className={
                                  word.wilds?.includes(tile) === true ? 'from-wild' : undefined
                                }
                              >
                                {letter}
                              </span>
                            ))}
                          </span>
                          <span className="round-facts dim" lang="en">
                            <span className="round-points">+{word.points}</span>
                            <span>{word.tiles} tiles</span>
                            {/* Under `fibonacci` this is the whole economy: a long word buys the
                                rounds that let you find the next one. */}
                            <span>+{word.flips} flips</span>
                            <span>{elapsed(word.tick, game.speedMultiplier)}</span>
                          </span>
                        </p>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        </>
      )}
    </div>
  )
}

function BackLink({ onBack }: { readonly onBack: () => void }): React.JSX.Element {
  return (
    <button type="button" className="signin-again game-back" onClick={onBack} lang="en">
      ← All games
    </button>
  )
}

/** Twelve faces in a row, drawn as the tiles they were rather than as a string. */
function Board({
  board,
  direction,
}: {
  readonly board: string
  readonly direction: 'ltr' | 'rtl'
}): React.JSX.Element {
  return (
    <p className="board-strip" dir={direction}>
      {board.split(' ').map((face, at) => (
        <span key={`${String(at)}-${face}`} className="chip">
          {face}
        </span>
      ))}
    </p>
  )
}
