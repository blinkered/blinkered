import { compareResults, rankOf, rankedResults } from '@blinkered/engine'
import type { Difficulty, GameResult } from '@blinkered/engine'

/**
 * The guest-mode score store: this browser, this device, nobody else.
 *
 * Only the storage lives here. What makes one game better than another, and which games can be
 * compared at all, is in `@blinkered/engine`, because a server will have to agree with us about
 * it later and two implementations of that would drift.
 */

const KEY = 'blinkered.scores.v1'

/**
 * Games kept. Generous, because they cost nothing and somebody's twentieth-best game is still
 * theirs, but bounded, because localStorage is not infinite and a corrupt megabyte is worse
 * than a missing leaderboard.
 */
const KEEP = 500

export function loadScores(): GameResult[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isResult)
  } catch {
    // A corrupt or unavailable store means no leaderboard, not a broken game.
    return []
  }
}

/**
 * Records a finished game and hands back the whole store.
 *
 * Returns the stored array so the caller can rank against it without a second read, and so the
 * object identity survives: `rankOf` finds a game by identity, and re-reading from storage
 * would hand back an equal object that is not the same one.
 */
export function recordScore(result: GameResult): GameResult[] {
  const all = [...loadScores(), result]
  // Trim the worst first, per group, so a language you play rarely does not get evicted by one
  // you play constantly.
  const kept = all.length <= KEEP ? all : trim(all)
  try {
    localStorage.setItem(KEY, JSON.stringify(kept))
  } catch {
    // Private browsing and blocked storage are both fine; the leaderboard is just this session.
  }
  return kept
}

function trim(all: readonly GameResult[]): GameResult[] {
  const groups = new Map<string, GameResult[]>()
  for (const result of all) {
    const key = `${result.language}/${result.difficulty}`
    const group = groups.get(key) ?? []
    group.push(result)
    groups.set(key, group)
  }
  const share = Math.max(1, Math.floor(KEEP / groups.size))
  const kept: GameResult[] = []
  for (const group of groups.values()) {
    kept.push(...[...group].sort(compareResults).slice(0, share))
  }
  return kept
}

export interface Standing {
  /** The games this one can be ranked against, best first. */
  readonly ranked: readonly GameResult[]
  /** Where this game came, counting from one. Zero when it cannot be ranked. */
  readonly rank: number
}

/**
 * Whether a game topped the player's own table, with something to have topped.
 *
 * One definition, because two things say so now: the crown on the leaderboard and the line in the
 * share text. A first game is not a personal best, which is the same reason the crown waits for a
 * second game before appearing.
 */
export function isPersonalBest(standing: Standing): boolean {
  return standing.rank === 1 && standing.ranked.length > 1
}

export function standingOf(
  scores: readonly GameResult[],
  result: GameResult,
  group: { language: string; difficulty: Difficulty; engineVersion: string },
): Standing {
  const ranked = rankedResults(scores, group)
  return { ranked, rank: rankOf(ranked, result) }
}

/** True when the value came out of storage looking like a result rather than like anything else. */
function isResult(value: unknown): value is GameResult {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<GameResult>
  return (
    typeof candidate.score === 'number' &&
    typeof candidate.rounds === 'number' &&
    typeof candidate.words === 'number' &&
    typeof candidate.language === 'string' &&
    typeof candidate.difficulty === 'string' &&
    typeof candidate.at === 'number'
  )
}
