import { randomBytes } from 'node:crypto'
import { Hono } from 'hono'
import { currentUser } from '../auth/routes.js'
import type { SessionDeps } from '../auth/routes.js'
import { normalizeUsername } from '../auth/usernames.js'
import type { Store } from '../types.js'
import { parseImport } from './importing.js'
import { parsePatch } from './profile.js'

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

/**
 * A game id, which is also a URL.
 *
 * Eight bytes rather than the sixteen every other row gets, because this one is read by people:
 * `/g/bU-E2lFFzcG2zv6yGevoMg` is twenty-two characters of noise in a shared link and
 * `/g/bU-E2lFFzcG` is eleven. Nothing else in the schema appears in an address bar, so nothing
 * else is shortened -- a session token is 256 bits and stays that way.
 *
 * Sixty-four bits is still random rather than sequential, which is the property that matters:
 * an id says nothing about how many games there are or what order they arrived in.
 *
 * It is also enough. Collisions are a birthday problem, and the arithmetic decides the size:
 *
 * | games       | 6 bytes (8 chars) | 8 bytes (11 chars) |
 * | ----------- | ----------------- | ------------------ |
 * | 1 million   | 1 in 560          | 1 in 37 million    |
 * | 11 million  | 1 in 5            | 1 in 300,000       |
 * | 100 million | certain           | 1 in 3,700         |
 *
 * Eleven million is about a year at ten thousand daily players. Eight characters would have been
 * prettier and would have needed a retry loop around the insert, where a collision costs somebody
 * the game they just finished; eleven needs none, so there is no such path to get wrong.
 */
function newGameId(): string {
  return randomBytes(8).toString('base64url')
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
    const games = await deps.store.gamesOf(user.userId, limitFrom(context.req.query('limit')))
    return context.json({ games })
  })

  /*
   * Keep a finished game.
   *
   * Both kinds arrive here, because phase A issues no seeds and so every game is finished on the
   * client whoever was signed in: one played while signed in, and one played by a guest who then
   * signed up on the game-over panel. That second one is the moment a score stops being
   * anonymous, and the worst possible time to lose one -- it is the score that just persuaded
   * somebody to sign up.
   *
   * Neither is ever leaderboard-eligible, and the row says so through the column that means it.
   * `imported` is a different fact -- whether the game predates the account -- and conflating the
   * two put "kept from a guest game" under games their owner had played while signed in.
   */
  routes.post('/games/import', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)

    const parsed = parseImport(await bodyOf(context.req), clock())
    if (!parsed.ok) return context.json({ error: 'bad-game', problem: parsed.problem }, 400)
    const { game } = parsed

    const id = newGameId()
    await deps.store.insertGame(
      {
        id,
        userId: user.userId,
        seed: game.seed,
        source: game.source,
        imported: game.imported,
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
        score: game.score,
        wordsCount: game.words.length,
        roundsPlayed: game.rounds,
        engineVersion: game.config.engineVersion,
        dictionaryVersion: game.dictionaryVersion,
        startedAt: game.startedAt,
        finishedAt: game.finishedAt,
      },
      { boards: game.boards, words: game.words },
    )

    // The score the server computed, not the one the client believed. A client showing a
    // different number afterwards is a bug worth seeing rather than one worth hiding.
    return context.json({ id, score: game.score }, 201)
  })

  /*
   * One game, in full, to anybody who has the link.
   *
   * Games are public, so this is not scoped to an owner and the account screen reads it too:
   * one route rather than a public one and a private one that could drift about what a game is.
   * It replaced an owner-scoped `/me/games/:id`, and that was a real reversal -- the old one
   * answered 404 to everybody else on purpose.
   *
   * Still 404, and for the same reason it was then, for a game that is not there, never
   * finished, nobody has claimed, is `hidden`, or belongs to a deleted account. Those are all
   * "no such game" to a stranger, and telling them apart is how an endpoint starts reporting
   * which games exist.
   */
  routes.get('/games/:id', async (context) => {
    const found = await deps.store.gameById(context.req.param('id'))
    if (found === null) return context.json({ error: 'no-game' }, 404)
    return context.json({ ...found.summary, owner: found.owner, detail: found.detail })
  })

  /*
   * Somebody's profile, by the name in the URL.
   *
   * Looked up on the normalized form, because that is what uniqueness is on: `/u/Trout` and
   * `/u/trout` are one person, and a link that only worked in the case it was typed in would be
   * a link that breaks when somebody retypes it.
   *
   * A username can change, so these are the links that rot. That is the ordinary web contract
   * and it is the right side of the trade -- the links worth keeping are game permalinks, and
   * those carry an id that never moves.
   */
  routes.get('/users/:username', async (context) => {
    const found = await deps.store.profileByUsername(
      normalizeUsername(context.req.param('username')),
    )
    if (found === null) return context.json({ error: 'no-user' }, 404)
    return context.json(found)
  })

  /* What they have played, newest first. Public, like the profile it hangs off. */
  routes.get('/users/:username/games', async (context) => {
    const found = await deps.store.profileByUsername(
      normalizeUsername(context.req.param('username')),
    )
    if (found === null) return context.json({ error: 'no-user' }, 404)
    const games = await deps.store.gamesOf(found.userId, limitFrom(context.req.query('limit')))
    return context.json({ games })
  })

  return routes
}

/** How many games a listing hands back. Shared, so the two listings cannot disagree. */
function limitFrom(asked: string | undefined): number {
  const wanted = Number(asked ?? GAMES_LIMIT)
  return Number.isInteger(wanted) && wanted > 0 ? Math.min(wanted, GAMES_MAX) : GAMES_LIMIT
}

/** As in `auth/routes.ts`: the body is whatever somebody posted, so it is typed as that. */
async function bodyOf(request: { json: <T>() => Promise<T> }): Promise<unknown> {
  return request.json<unknown>().catch(() => null)
}
