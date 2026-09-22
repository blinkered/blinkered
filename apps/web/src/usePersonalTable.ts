import { useEffect, useState } from 'react'
import type { GameResult } from '@blinkered/engine'
import { myBest } from './account.js'
import { rowsOfPlayed, rowsOfResults } from './personalTable.js'
import type { PersonalTable } from './personalTable.js'
import type { Standing } from './scores.js'

/**
 * The table of your own games, from whichever history is yours.
 *
 * A hook in the app rather than a fetch inside the component that draws it, because two things on
 * the panel have to agree about it. The crown over the table and the line in the share text both
 * mean "you have never done better", and while the table came from the account and those two came
 * from `localStorage` a signed-in player could be congratulated on a personal best directly above
 * a table showing them fourth. One answer, read twice.
 */
export function usePersonalTable(
  finished: { readonly result: GameResult; readonly standing: Standing } | null,
  signedIn: boolean,
  /**
   * How many times a drain has stored games, which is the only way the account's history changes
   * while this panel is open.
   *
   * Signing in *on* the game-over panel is what this is for, and it is the flow the panel exists
   * to serve. The account appears first and the games follow, one request each, so an answer
   * fetched the instant it appeared describes an account with nothing in it: a guest with forty
   * games saw "#3 of 40" become "#1 of 1", the table collapse to one row, and the personal best
   * disappear from the crown and from the share text. Counting the drains is what asks again.
   */
  drained: number,
): PersonalTable | null {
  /*
   * The account's answer, and the deps it was fetched for.
   *
   * Kept together rather than in two states, so a stale answer cannot be drawn: it is used only
   * when its key still matches. Writing on success alone and never clearing left the invariant
   * "this belongs to what is on screen" resting on the order state happened to change in.
   */
  const [mine, setMine] = useState<{ readonly key: string; readonly table: PersonalTable } | null>(
    null,
  )

  // Read out as primitives, because they are the effect's dependencies and an effect keyed on the
  // result itself would refetch on every render that rebuilt an equal object.
  const language = finished?.result.language
  const difficulty = finished?.result.difficulty
  const engineVersion = finished?.result.engineVersion
  const score = finished?.result.score
  const words = finished?.result.words
  const rounds = finished?.result.rounds
  const at = finished?.result.at
  /*
   * Whether there is a board to be ranked against at all.
   *
   * A nerd-mode game is ranked against nothing -- `rankedResults` keeps only canonical games --
   * and the account's answer has no way to say so: `ahead + 1` is at least one, so an unranked
   * game would come back first of one and be drawn as a table. The local path says it honestly,
   * with a rank of zero, and this is what keeps the question from being asked at all.
   */
  const ranked = finished?.result.canonical === true
  const key = `${String(language)}/${String(difficulty)}/${String(engineVersion)}/${String(at)}/${String(drained)}`

  useEffect(() => {
    if (
      !signedIn ||
      !ranked ||
      language === undefined ||
      difficulty === undefined ||
      engineVersion === undefined ||
      score === undefined ||
      words === undefined ||
      rounds === undefined ||
      at === undefined
    ) {
      return undefined
    }
    let live = true
    void myBest({ language, difficulty, engineVersion }, { score, rounds, at }).then((best) => {
      if (live && best !== null)
        setMine({ key, table: rowsOfPlayed(best, { score, words, rounds, at }) })
    })
    return () => {
      live = false
    }
  }, [signedIn, ranked, language, difficulty, engineVersion, score, words, rounds, at, key])

  if (finished === null) return null
  // The account's answer only while it is still about this game, this account and this drain.
  // Anything else falls back to the browser's own table, which is always about the game on screen.
  if (mine !== null && mine.key === key && signedIn) return mine.table
  return rowsOfResults(finished.standing, finished.result)
}

/**
 * Whether this game topped the table, with something to have topped.
 *
 * `isPersonalBest` in scores.ts asks the same question of this browser's store, and is still what
 * a guest's table is built from. This asks it of whichever table is on screen, which is the only
 * version that cannot contradict the rows underneath it. A first game is not a personal best,
 * which is the same reason the crown waits for a second game before appearing.
 */
export function toppedIt(table: PersonalTable | null): boolean {
  return table !== null && table.rank === 1 && table.total > 1
}
