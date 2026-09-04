import { randomBytes } from 'node:crypto'
import { Hono } from 'hono'
import { alphabetFor, wordScore } from '@blinkered/engine'
import { currentUser } from '../auth/routes.js'
import type { SessionDeps } from '../auth/routes.js'
import { normalizeUsername } from '../auth/usernames.js'
import type { Store } from '../types.js'
import { parseImport } from './importing.js'
import { parsePatch } from './profile.js'
import type { GameWordRow } from './types.js'

/**
 * What an account *is*, once somebody has one: a profile, a name, and a history.
 *
 * Every route here is behind the session cookie, including the username check. That last one is
 * deliberate and is the cheap half of what docs/ACCOUNTS.md asks for: an availability endpoint is
 * an enumeration endpoint, and requiring a session turns "anyone can walk the namespace" into
 * "anyone with an account can", which is a different problem and a much smaller one. The rate
 * limit that document also asks for belongs in front of this, and does not exist yet.
 */

export interface AccountDeps extends SessionDeps {
  readonly store: Store
}

/** Most games one request will hand back, and the default when nobody says. */
const GAMES_LIMIT = 50
const GAMES_MAX = 200

/** Row ids, matching `auth/routes.ts`: random, so nothing about the table is inferable from one. */
function newId(): string {
  return randomBytes(16).toString('base64url')
}

export function accountRoutes(deps: AccountDeps): Hono {
  const clock = deps.now ?? ((): Date => new Date())
  const routes = new Hono()

  /*
   * Who am I, in full.
   *
   * The whole profile rather than a name, because every consumer of this wants the avatar seed
   * too, and the session lookup already has the row: see the note on `Profile`.
   */
  routes.get('/me', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)
    return context.json(user)
  })

  /*
   * Edit it.
   *
   * A patch rather than a put, so the profile screen can send the one field somebody touched and
   * two tabs open at once cannot silently revert each other's edits.
   */
  routes.patch('/me', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)

    const parsed = parsePatch(await bodyOf(context.req))
    if (!parsed.ok) {
      return context.json(
        { error: 'bad-field', field: parsed.problem.field, problem: parsed.problem.problem },
        400,
      )
    }
    const updated = await deps.store.updateProfile(user.userId, parsed.patch)
    // Null is the unique index's answer rather than a lookup's, which is why the check below is
    // only ever an early warning: between a check and an update somebody else can take the name.
    if (updated === null) return context.json({ error: 'username-taken' }, 409)
    return context.json(updated)
  })

  /*
   * Is this name free.
   *
   * Answers the shape question and the availability question together, because a form asking one
   * at a time makes somebody fix a name twice. `taken` is advisory: the rename is what decides.
   */
  routes.get('/usernames/:name', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)

    const name = context.req.param('name')
    const parsed = parsePatch({ username: name })
    if (!parsed.ok) {
      return context.json({ available: false, problem: parsed.problem.problem })
    }
    const normalized = normalizeUsername(name)
    // Their own name reads as available, because to them it is: a form that says "taken" about
    // the name already in it is a form that looks broken.
    const taken =
      normalized !== normalizeUsername(user.username) &&
      (await deps.store.usernameTaken(normalized))
    return context.json({ available: !taken, problem: taken ? 'taken' : null })
  })

  /* Somebody's own games, newest first. */
  routes.get('/me/games', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)
    const asked = Number(context.req.query('limit') ?? GAMES_LIMIT)
    const limit = Number.isInteger(asked) && asked > 0 ? Math.min(asked, GAMES_MAX) : GAMES_LIMIT
    const games = await deps.store.gamesOf(user.userId, limit)
    return context.json({ games })
  })

  /*
   * Keep a game played before there was an account.
   *
   * The one moment a score stops being anonymous, and the worst possible time to lose one: it is
   * the score that just persuaded somebody to sign up. Never leaderboard-eligible — it has no
   * server-issued seed and never passed an envelope check — and `imported` says so in the row
   * rather than only in the eligibility flag, so the reason survives the next schema argument.
   */
  routes.post('/games/import', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)

    const parsed = parseImport(await bodyOf(context.req), clock())
    if (!parsed.ok) return context.json({ error: 'bad-game', problem: parsed.problem }, 400)
    const { game } = parsed

    const id = newId()
    const alphabet = alphabetFor(game.config.language)
    const words: GameWordRow[] = game.words.map((word, ordinal) => {
      // Tiles rather than characters, for the reason reducer.ts gives where it matters: Croatian
      // LJ is one tile, and a length in characters would overpay every word that holds one.
      const tiles = alphabet.segment(word).length
      return { ordinal, word, tiles, points: wordScore(tiles) }
    })

    await deps.store.insertGame(
      {
        id,
        userId: user.userId,
        seed: game.seed,
        source: game.source,
        imported: true,
        difficulty: game.difficulty,
        language: game.config.language,
        canonical: game.canonical,
        n: game.config.n,
        speedMultiplier: game.config.speedMultiplier,
        holdTicks: game.config.holdTicks,
        initialFlips: game.config.initialFlips,
        wMin: game.config.wMin,
        minWordLength: game.config.minWordLength,
        wordCompleteMode: game.config.wordCompleteMode,
        flipEconomy: game.config.flipEconomy,
        chargeFullRound: game.config.chargeFullRound,
        wildChance: game.config.wildChance,
        replaceChance: game.config.replaceChance,
        letters: game.letters,
        score: game.score,
        wordsCount: game.words.length,
        roundsPlayed: game.rounds,
        engineVersion: game.config.engineVersion,
        dictionaryVersion: game.dictionaryVersion,
        startedAt: game.startedAt,
        finishedAt: game.finishedAt,
      },
      words,
    )

    // The score the server computed, not the one the client believed. A client showing a
    // different number afterwards is a bug worth seeing rather than one worth hiding.
    return context.json({ id, score: game.score }, 201)
  })

  return routes
}

/** As in `auth/routes.ts`: the body is whatever somebody posted, so it is typed as that. */
async function bodyOf(request: { json: <T>() => Promise<T> }): Promise<unknown> {
  return request.json<unknown>().catch(() => null)
}
