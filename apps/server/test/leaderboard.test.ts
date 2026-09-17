import { beforeEach, describe, expect, it } from 'vitest'
import { ENGINE_VERSION } from '@blinkered/engine'
import { createApp } from '../src/app.js'
import { capturingMailer, fakeStore } from './fake.js'
import type { GameDetail, GameRow } from '../src/account/types.js'

/**
 * A board, and the four rules that decide what is on it.
 *
 * Worth a file of its own because every one of them is a decision somebody could undo without
 * noticing, and three of them are invisible in the happy path:
 *
 * - **Only eligible games**, which means canonical and not a guest import. The column was
 *   `default(false)` and written by nothing until boards existed, so a board reading it was empty
 *   by construction; the risk now is the opposite one, of ranking something that should not be.
 * - **A player may hold several rows.** ACCOUNTS.md said one row per player and Nick reversed it,
 *   arcade-style. A regression here restores the old behaviour silently.
 * - **Banned accounts are absent**, for the same reason their profiles 404.
 * - **The order agrees with `compareResults`**: score descending, rounds ascending, earliest
 *   finish wins the tie. Any other order is a board that disagrees with the client's own ranking.
 */

const DETAIL: GameDetail = {
  boards: [{ tiles: 'A B C' }],
  words: [{ word: 'HOUSE', tiles: 5, points: 20, round: 0, flips: 8, tick: 42 }],
}

describe('a board', () => {
  let store: ReturnType<typeof fakeStore>
  let app: ReturnType<typeof createApp>
  let counter = 0

  const player = (username: string, options: { banned?: boolean } = {}): string => {
    counter += 1
    const userId = `u_${String(counter)}`
    store.users.set(userId, {
      userId,
      username,
      avatarSeed: `seed-${username}`,
      country: 'US',
      uiLanguage: null,
      gameLanguage: null,
      bio: null,
      isAdmin: false,
      email: `${username}@example.com`,
      createdAt: new Date(),
      bannedAt: options.banned === true ? new Date() : null,
    })
    return userId
  }

  const game = (userId: string, over: Partial<GameRow> & { score: number }): void => {
    counter += 1
    store.games.push({
      row: {
        id: `g_${String(counter)}`,
        userId,
        seed: 42,
        source: 'web',
        imported: false,
        clientKey: null,
        paused: false,
        leaderboardEligible: true,
        difficulty: 'insane',
        language: 'en',
        canonical: true,
        n: 12,
        speedMultiplier: 1.4,
        holdTicks: 4,
        initialFlips: 168,
        wMin: 25,
        minWordLength: 4,
        wordCompleteMode: 'spend',
        flipEconomy: 'fibonacci',
        chargeFullRound: false,
        wildChance: 0.02,
        replaceChance: 0.5,
        wordsCount: 1,
        roundsPlayed: 6,
        engineVersion: ENGINE_VERSION,
        dictionaryVersion: null,
        startedAt: new Date('2026-09-01T00:00:00Z'),
        finishedAt: new Date('2026-09-01T00:01:00Z'),
        ...over,
      },
      detail: DETAIL,
    })
  }

  const board = async (path = `/v1/leaderboard/en/insane`): Promise<Response> => app.request(path)

  const rowsOf = async (response: Response): Promise<{ username: string; score: number }[]> =>
    ((await response.json()) as { rows: { username: string; score: number }[] }).rows

  beforeEach(() => {
    counter = 0
    store = fakeStore()
    app = createApp({ auth: { store, mailer: capturingMailer() } })
  })

  it('ranks by score, then rounds, then who got there first', async () => {
    const a = player('alpha')
    const b = player('bravo')
    const c = player('charlie')
    game(b, { score: 30 })
    // Same score as bravo, fewer rounds, so ahead of it.
    game(c, { score: 30, roundsPlayed: 4 })
    game(a, { score: 40 })

    const rows = await rowsOf(await board())
    expect(rows.map((row) => row.username)).toEqual(['alpha', 'charlie', 'bravo'])
  })

  it('breaks a full tie in favour of the earlier finish', async () => {
    const early = player('early')
    const late = player('late')
    game(late, { score: 30, finishedAt: new Date('2026-09-02T00:00:00Z') })
    game(early, { score: 30, finishedAt: new Date('2026-09-01T00:00:00Z') })
    const rows = await rowsOf(await board())
    expect(rows.map((row) => row.username)).toEqual(['early', 'late'])
  })

  it('lets one player hold several rows, which is the arcade rule', async () => {
    // ACCOUNTS.md used to say one row per player. This is the reversal, and the assertion that
    // would fail if anybody restored a `distinct on`.
    const hog = player('quarters')
    game(hog, { score: 40 })
    game(hog, { score: 30 })
    game(hog, { score: 20 })
    const rows = await rowsOf(await board())
    expect(rows).toHaveLength(3)
    expect(new Set(rows.map((row) => row.username))).toEqual(new Set(['quarters']))
  })

  it('numbers the ranks from one, in order', async () => {
    const a = player('alpha')
    game(a, { score: 40 })
    game(a, { score: 30 })
    const answered = (await (await board()).json()) as { rows: { rank: number }[] }
    expect(answered.rows.map((row) => row.rank)).toEqual([1, 2])
  })

  it('leaves out a game nothing marked eligible', async () => {
    // Which is what every row written before boards existed looks like: the column was
    // `default(false)` and nothing wrote it.
    const a = player('alpha')
    game(a, { score: 99, leaderboardEligible: false })
    expect(await rowsOf(await board())).toEqual([])
  })

  it('shows a claimed guest game, which the import route now marks eligible', async () => {
    // `imported` is bookkeeping about where a game came from and decides nothing here. The
    // reversal matters because the claimed game is the score that persuaded somebody to sign up.
    const a = player('alpha')
    game(a, { score: 40, imported: true, leaderboardEligible: true })
    expect((await rowsOf(await board()))[0]?.score).toBe(40)
  })

  it('leaves out a hidden game, which is the whole anti-cheat apparatus', async () => {
    const a = player('alpha')
    game(a, { score: 99 })
    // The fake keeps hidden ids in a set rather than a column, because `GameRow` has none.
    store.hidden.add(store.games[0]?.row.id as string)
    expect(await rowsOf(await board())).toEqual([])
  })

  it('leaves out a banned account, for the reason its profile 404s', async () => {
    const shamed = player('banned', { banned: true })
    const fine = player('fine')
    game(shamed, { score: 99 })
    game(fine, { score: 10 })
    const rows = await rowsOf(await board())
    expect(rows.map((row) => row.username)).toEqual(['fine'])
  })

  it('is a different board per language and per difficulty', async () => {
    const a = player('alpha')
    game(a, { score: 40, language: 'en', difficulty: 'insane' })
    game(a, { score: 50, language: 'fi', difficulty: 'insane' })
    game(a, { score: 60, language: 'en', difficulty: 'easy' })

    expect(await rowsOf(await board('/v1/leaderboard/en/insane'))).toHaveLength(1)
    expect((await rowsOf(await board('/v1/leaderboard/fi/insane')))[0]?.score).toBe(50)
    expect((await rowsOf(await board('/v1/leaderboard/en/easy')))[0]?.score).toBe(60)
  })

  it('leaves out a score set under different rules', async () => {
    // The engine version is in the index for this reason: scores from different rule versions
    // are not comparable, so an old one stops being ranked rather than ranking wrongly.
    const a = player('alpha')
    game(a, { score: 99, engineVersion: '0.0.1-ancient' })
    expect(await rowsOf(await board())).toEqual([])
  })

  it('serves ten by default and takes a limit up to a hundred', async () => {
    const a = player('alpha')
    for (let n = 0; n < 12; n += 1) game(a, { score: 100 - n })
    expect(await rowsOf(await board())).toHaveLength(10)
    expect(await rowsOf(await board('/v1/leaderboard/en/insane?limit=3'))).toHaveLength(3)
    // Clamped rather than refused, and nonsense falls back to the default.
    expect(await rowsOf(await board('/v1/leaderboard/en/insane?limit=9999'))).toHaveLength(12)
    expect(await rowsOf(await board('/v1/leaderboard/en/insane?limit=nope'))).toHaveLength(10)
    expect(await rowsOf(await board('/v1/leaderboard/en/insane?limit=0'))).toHaveLength(10)
  })

  it('carries what a row needs to be drawn and linked', async () => {
    const a = player('alpha')
    game(a, { score: 40 })
    const [row] = await rowsOf(await board())
    // The game id is what makes a row a link, and the avatar seed is what draws the identicon.
    expect(row).toMatchObject({
      rank: 1,
      username: 'alpha',
      avatarSeed: 'seed-alpha',
      country: 'US',
      score: 40,
      rounds: 6,
    })
    expect((row as unknown as { gameId: string }).gameId).toBeTruthy()
  })

  it('answers 404 for a language or a difficulty that is not one', async () => {
    // Not an empty board, which would look like a board nobody has played into.
    expect((await board('/v1/leaderboard/en/impossible')).status).toBe(404)
    expect((await board('/v1/leaderboard/klingon/insane')).status).toBe(404)
  })

  it('is public, because a board nobody can see is no argument for an account', async () => {
    const a = player('alpha')
    game(a, { score: 40 })
    const answered = await board()
    expect(answered.status).toBe(200)
    expect((await answered.json()) as { engineVersion: string }).toMatchObject({
      language: 'en',
      difficulty: 'insane',
      engineVersion: ENGINE_VERSION,
    })
  })
})
