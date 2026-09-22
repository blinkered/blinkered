import { useEffect, useState } from 'react'
import type { GameResult } from '@blinkered/engine'
import { myBest } from './account.js'
import { rowsOfPlayed, rowsOfResults } from './personalTable.js'
import type { PersonalTable } from './personalTable.js'
import type { Standing } from './scores.js'

/**
 * The table of your own games, from whichever history is yours.
 *
 * A hook in the app rather than a fetch inside the component that draws it, because two things
 * on the panel have to agree about it. The crown over the table and the line in the share text
 * both mean "you have never done better", and while the table came from the account and those
 * two came from `localStorage` a signed-in player could be congratulated on a personal best
 * directly above a table showing them fourth. One answer, read twice.
 */
export function usePersonalTable(
  finished: { readonly result: GameResult; readonly standing: Standing } | null,
  signedIn: boolean,
): PersonalTable | null {
  /*
   * The account's answer, when there is an account and it arrives.
   *
   * Null until then, and the browser's own table is what shows in the meantime. Local first
   * rather than an empty section or a skeleton, for two reasons: it is real data, and on the one
   * device most people play on it is usually the same table; and it is what this falls back to
   * when the request fails, so an offline player and a player waiting two hundred milliseconds
   * go down the same path rather than two.
   */
  const [mine, setMine] = useState<PersonalTable | null>(null)

  // Read out as primitives, because they are the effect's dependencies and an effect keyed on
  // the result itself would refetch on every render that rebuilt an equal object.
  const language = finished?.result.language
  const difficulty = finished?.result.difficulty
  const engineVersion = finished?.result.engineVersion
  const score = finished?.result.score
  const words = finished?.result.words
  const rounds = finished?.result.rounds
  const at = finished?.result.at

  useEffect(() => {
    if (
      !signedIn ||
      language === undefined ||
      difficulty === undefined ||
      engineVersion === undefined ||
      score === undefined ||
      words === undefined ||
      rounds === undefined ||
      at === undefined
    ) {
      // No account, or no finished game. Either way the account's table is not the answer, and
      // leaving the last one up would put somebody else's history under the heading after a
      // sign-out.
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

  if (finished === null) return null
  return mine ?? rowsOfResults(finished.standing, finished.result)
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
