import { useEffect, useState } from 'react'
import { WILD_GLYPH, alphabetFor } from '@blinkered/engine'
import type { TieredIndex } from '@blinkered/words'
import { gameDetail } from './account.js'
import type { BoardAtRound, PlayedGameDetail, PlayedWord } from './account.js'
import { spellingFor } from './spelling.js'

/**
 * One finished game, round by round.
 *
 * The listing answers "what did I score"; this answers the two questions a listing cannot. What
 * words did I find, and what was in front of me when I found them.
 *
 * **A round that changed shows its whole board.** The first version showed only the delta -- `Y`
 * struck through, an arrow, `O` -- which was compact and asked the reader to rebuild the board in
 * their head from the opening deal and every change since. The point of keeping a board per round
 * was to spare them exactly that. So any round whose board differs from the one before it draws
 * the board as that round had it, with the slots that moved marked, and the delta stays as a
 * caption underneath because the board alone cannot say what *was* there.
 *
 * Rounds that changed nothing draw no board, which is most of them, and a game where nothing was
 * ever replaced reads as one board and a list of words -- which is what it was.
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
 * How each kind of change reads.
 *
 * A replacement and a card are not the same event and should not share a sentence: one is a
 * letter gone for good, the other a letter hidden for a round and coming back.
 */
const WORDING: Readonly<Record<Change['kind'], string>> = {
  replaced: 'replaced in',
  'wild-on': 'wild card in',
  'wild-off': 'card gone from',
}

/** One slot that is not what it was, and what happened to it. */
interface Change {
  readonly at: number
  readonly kind: 'replaced' | 'wild-on' | 'wild-off'
  readonly from: string
  readonly to: string
}

/**
 * What changed between two rounds, slot by slot.
 *
 * Positional rather than a set difference, because a replacement is one tile changing face and
 * the position is half of what makes it recognisable: `V` becoming `O` in the eleventh slot is a
 * different memory from a `V` vanishing somewhere.
 *
 * Wilds count as changes in both directions. A card arriving is the board becoming easier for a
 * round and is the thing a player remembers about that round; a card leaving is the letter coming
 * back, which is why the mask is kept beside the letters rather than written over them.
 */
function changes(before: BoardAtRound, after: BoardAtRound): Change[] {
  const was = before.tiles.split(' ')
  const now = after.tiles.split(' ')
  const wasWild = new Set(before.wilds ?? [])
  const nowWild = new Set(after.wilds ?? [])
  const moved: Change[] = []
  now.forEach((face, at) => {
    const old = was[at]
    if (old === undefined) return
    if (old !== face) moved.push({ at, kind: 'replaced', from: old, to: face })
    else if (!wasWild.has(at) && nowWild.has(at)) {
      moved.push({ at, kind: 'wild-on', from: face, to: WILD_GLYPH })
    } else if (wasWild.has(at) && !nowWild.has(at)) {
      moved.push({ at, kind: 'wild-off', from: WILD_GLYPH, to: face })
    }
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
                const before = boards[round - 1]
                const moved = before === undefined ? [] : changes(before, board)
                const found = byRound.get(round) ?? []
                return (
                  <li key={round} className="round">
                    <span className="round-number" aria-hidden="true">
                      {round + 1}
                    </span>
                    <div className="round-body">
                      {/* The board, above the words, because it came first: the board moved and
                          then the player found something on what it had become. Drawn only when
                          it is not the board already shown above, so the common round is a word
                          and nothing else. */}
                      {moved.length === 0 ? null : (
                        <>
                          <Board
                            board={board}
                            direction={alphabet.direction}
                            marked={new Set(moved.map((change) => change.at))}
                          />
                          <p className="round-change dim" lang="en">
                            {moved.map((change) => (
                              <span key={change.at} className="round-delta">
                                <span className="chip is-gone">{change.from}</span>
                                <span aria-hidden="true">→</span>
                                <span
                                  className={`chip${change.to === WILD_GLYPH ? ' is-wild' : ''}`}
                                >
                                  {change.to}
                                </span>
                                <span>
                                  {WORDING[change.kind]} slot {change.at + 1}
                                </span>
                              </span>
                            ))}
                          </p>
                        </>
                      )}
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

/**
 * The board, drawn as the tiles it was rather than as a string.
 *
 * A slot showing a wild draws the card rather than the letter, because that is what the player
 * was looking at: the letter underneath was not knowable at the time, and it is on the boards
 * either side of this one for anybody curious in hindsight.
 */
function Board({
  board,
  direction,
  marked,
}: {
  readonly board: BoardAtRound
  readonly direction: 'ltr' | 'rtl'
  /** Slots that are not what they were last round, so the eye goes to them first. */
  readonly marked?: ReadonlySet<number>
}): React.JSX.Element {
  const wilds = new Set(board.wilds ?? [])
  return (
    <p className="board-strip" dir={direction}>
      {board.tiles.split(' ').map((face, at) => {
        const classes = ['chip']
        if (wilds.has(at)) classes.push('is-wild')
        if (marked?.has(at) === true) classes.push('is-changed')
        return (
          <span key={`${String(at)}-${face}`} className={classes.join(' ')}>
            {wilds.has(at) ? WILD_GLYPH : face}
          </span>
        )
      })}
    </p>
  )
}
