import { randomBytes } from 'node:crypto'
import { ALPHABET_IDS, DIFFICULTIES, ENGINE_VERSION } from '@blinkered/engine'
import { Hono } from 'hono'
import { currentUser } from '../auth/routes.js'
import type { SessionDeps } from '../auth/routes.js'
import { codeExpiry, tooManyCodes, verifyCode, windowStart } from '../auth/policy.js'
import { codeMatches, hashCode, looksLikeCode, newCode } from '../auth/secrets.js'
import { normalizeUsername } from '../auth/usernames.js'
import { rateLimit } from '../rateLimit.js'
import type { LimitOptions } from '../rateLimit.js'
import type { Store } from '../types.js'
import { parseImport } from './importing.js'
import { parsePatch } from './profile.js'
import { parseReport } from './reporting.js'

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
  /**
   * The mailer, for the deletion code and nothing else on this surface.
   *
   * Optional so that everything here except deletion still works in a deployment without one --
   * which is the arrangement `app.ts` already describes for the health checks, and the same
   * reason `auth` is optional there. A deployment that cannot send mail cannot verify a deletion
   * and says so, rather than deleting on a weaker check.
   */
  readonly mailer?: { send: (mail: { to: string; code: string; locale: string }) => Promise<void> }
  /**
   * Absent where the deployment cannot identify a caller, and then there is no limiter at all.
   * See `rateLimit.ts` for why that is the honest answer rather than a weaker limit.
   */
  readonly publicLimit?: LimitOptions
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

/** Every other row id. Random rather than sequential, and never read aloud, so sixteen bytes. */
function newId(): string {
  return randomBytes(16).toString('base64url')
}

/**
 * How many rows a board serves, and the most it will serve.
 *
 * Ten because that is what an arcade cabinet showed and what Nick asked for. The ceiling exists
 * because the limit reaches a query: an unbounded one is an unbounded scan for anybody who asks.
 */
const DEFAULT_BOARD = 10
const MAX_BOARD = 100

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
   * Somebody's best games in one group, and how many they have in it.
   *
   * Separate from `/me/games` because it answers a different question, and the difference is not
   * cosmetic: `/me/games` is the newest fifty across everything somebody has played, so ranking
   * its answer would title a table "your best games" over your best *recent* games. See `bestOf`
   * in ./types.ts.
   *
   * The engine version is the client's, not a default. A score means nothing across a change to
   * what a difficulty is, so a client that has not reloaded must be told about the games it can
   * actually compare itself with rather than the ones a newer server would rank.
   */
  routes.get('/me/best/:language/:difficulty', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)
    const engineVersion = context.req.query('engineVersion')
    if (engineVersion === undefined || engineVersion === '') {
      return context.json({ error: 'no-engine-version' }, 400)
    }
    const best = await deps.store.bestOf({
      userId: user.userId,
      language: context.req.param('language'),
      difficulty: context.req.param('difficulty'),
      engineVersion,
      placing: placingFrom(context.req.query()),
      limit: bestLimitFrom(context.req.query('limit')),
    })
    return context.json(best)
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
    const stored = await deps.store.insertGame(
      {
        id,
        userId: user.userId,
        seed: game.seed,
        source: game.source,
        imported: game.imported,
        clientKey: game.clientKey,
        /*
         * Whether this game can be ranked, decided here and nowhere else.
         *
         * The column has existed since accounts arrived and nothing ever wrote it, so it was
         * false on every row and a board reading it was empty by construction.
         *
         * **The rule is canonicality alone, and `imported` deliberately does not enter into it.**
         * A custom-rules game is a real game somebody played and is not comparable to a preset
         * one, so it stays off. A game played as a guest and claimed on the game-over panel is a
         * different matter: docs/ACCOUNTS.md used to say such a game is never eligible, on the
         * argument that a board entry needs a server-issued seed and the envelope check. In phase
         * A **neither exists**, so that rule excluded one of two indistinguishable things -- a
         * signed-in game and a claimed guest game are both client-seeded and both re-scored here
         * from the words. It was also self-defeating: the score that persuades somebody to sign
         * up was the one score that would not count.
         *
         * So `imported` stays what the schema says it is, bookkeeping about where a game came
         * from, and stops deciding anything.
         *
         * **A scoreless game is not eligible either.** Zero is what a game that was started and
         * abandoned scores, and what a game played badly enough scores, and a board whose tail is
         * a row of noughts is a board that has stopped ranking anything. It is still kept and
         * still shown in the player's own history, where it is a fact about their evening rather
         * than a claim about the world.
         *
         * The honest limitation of phase A remains: this is a score the server recomputed from
         * words it was sent, on a board the client seeded. Phase C closes that by issuing seeds
         * and checking submissions, and at that point a guest game genuinely cannot qualify --
         * a server cannot have dealt a seed to a game it never knew about. The change then is to
         * this one expression rather than to any query, which is the whole reason for writing a
         * column instead of filtering at read time.
         *
         * **And not paused.** A game whose clock stopped is not ranked, which is Nick's answer to
         * an exploit that has no technical fix: screen-cap the board, pause, pick the words out
         * of the photograph, resume, miss nothing. Hiding the letters during a capture is not
         * possible on iOS and would not stop a second camera anyway; declining to rank the game
         * is. `stopped` on `Game` argues why the app going to the background counts too.
         */
        paused: game.paused,
        leaderboardEligible: game.canonical && game.score > 0 && !game.paused,
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
        hideChance: game.config.hideChance,
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

    /*
     * The score the server computed, not the one the client believed. A client showing a
     * different number afterwards is a bug worth seeing rather than one worth hiding.
     *
     * **201 only when a row was actually created.** A retry of a game already stored answers 200
     * with the id it already has, so a device draining its queue can tell "you have this" from
     * "I took this" without either being an error. Both carry the stored id, which is what the
     * client needs for the permalink either way.
     */
    const created = stored.id === id
    return context.json(stored, created ? 201 : 200)
  })

  /*
   * One board, to anybody at all.
   *
   * Public and unauthenticated, like a game and a profile: a leaderboard nobody can see without
   * an account is an argument for an account that nobody can evaluate.
   *
   * The engine version is not in the URL and is not the caller's to choose. Scores from
   * different rule versions are not comparable -- it is why `games_leaderboard_idx` carries the
   * column -- so the board is always the current engine's, and an old score simply stops being
   * ranked when the rules change. A URL that could name a version would be a URL that could ask
   * for a board nobody can still play into.
   */
  routes.get('/leaderboard/:language/:difficulty', async (context) => {
    const language = context.req.param('language')
    const difficulty = context.req.param('difficulty')
    // Checked against the engine's own list rather than passed through, so an unknown difficulty
    // is a 404 rather than an empty board that looks like a board nobody has played.
    if (!Object.hasOwn(DIFFICULTIES, difficulty)) return context.json({ error: 'no-board' }, 404)
    if (!ALPHABET_IDS.includes(language)) return context.json({ error: 'no-board' }, 404)

    const asked = Number(context.req.query('limit') ?? DEFAULT_BOARD)
    // Clamped rather than refused: a caller asking for a thousand rows gets the most we will
    // serve, and one asking for nonsense gets the default rather than an error about a number.
    const limit = Number.isInteger(asked) && asked > 0 ? Math.min(asked, MAX_BOARD) : DEFAULT_BOARD

    const rows = await deps.store.leaderboard({
      language,
      difficulty,
      engineVersion: ENGINE_VERSION,
      limit,
    })
    return context.json({ language, difficulty, engineVersion: ENGINE_VERSION, rows })
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
   * finished, nobody has claimed, is `hidden`, or belongs to a banned account. Those are all
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
  /*
   * Asking for the code that a deletion needs.
   *
   * Deletion is the one irreversible thing a person can do to their own account, and a session
   * lasts thirty days -- so a session alone means an open laptop is enough to erase somebody.
   * Apple's guidance permits exactly this remedy: "entering a code from an email or phone number
   * already associated with the account".
   *
   * The same machinery as signing in, deliberately: `loginCodes`, `policy.ts`, `secrets.ts`. One
   * implementation of what a six-digit code is, with one rate limit and one expiry. The
   * consequence, worth stating rather than discovering: a code asked for here can be used to sign
   * in and one asked for there can be used to delete. Both mean "whoever holds the inbox", which
   * is already the bar for the account itself -- somebody with the inbox can sign in and then
   * delete anyway. So it is not a new exposure.
   *
   * The address comes from the account rather than from the request. Letting somebody name the
   * address a deletion code goes to would be letting them choose who confirms it.
   */
  routes.post('/me/deletion-code', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)
    const mailer = deps.mailer
    if (mailer === undefined) return context.json({ error: 'no-mailer' }, 503)

    const email = await deps.store.verifiedEmailFor(user.userId)
    // No verified address at all, which the schema allows: a provider is under no obligation to
    // give us one. Said plainly rather than pretended, because the alternative is a button that
    // silently never works.
    if (email === null) return context.json({ error: 'no-address' }, 409)

    const now = clock()
    const issued = await deps.store.countCodesSince(email, windowStart(now))
    // 202 either way, matching the sign-in route: whether a code was actually sent is not a fact
    // worth leaking, and here it also stops the button being a way to send yourself mail.
    if (tooManyCodes(issued)) return context.body(null, 202)

    const code = newCode()
    const id = newId()
    await deps.store.insertCode({ id, email, codeHash: hashCode(code), expiresAt: codeExpiry(now) })
    try {
      // The language the mail is written in, which the client knows and the session does not:
      // `uiLanguage` can be unset on an account that has never said. Optional chaining rather
      // than three type guards, since a body that is null or not an object answers the same way.
      const asked = ((await bodyOf(context.req)) as { locale?: unknown } | null)?.locale
      await mailer.send({ to: email, code, locale: typeof asked === 'string' ? asked : 'en' })
    } catch (failure) {
      // The row is written before the mail goes, so a failed send would otherwise leave a live
      // code nobody has and a slot spent against the rate limit. Same order and same repair as
      // the sign-in route.
      await deps.store.deleteCode(id)
      throw failure
    }
    return context.body(null, 202)
  })

  /*
   * Deleting your own account, for good.
   *
   * A real delete, unlike the ban an admin applies, and the asymmetry is the point. A ban keeps
   * the row because that handler can be aimed at the wrong person and has to be undoable; here
   * the person asking is the row, and they have just answered a code. App Store guideline
   * 5.1.1(v) also wants the account record gone rather than disabled -- "only offering to
   * temporarily deactivate or disable an account is insufficient" -- so a ban would not satisfy
   * it.
   *
   * What goes with it: identities, sessions, games and their documents, by `on delete cascade`.
   * What does not: reports, whose three links are `set null` so the objection outlives the people
   * in it. The one thing a cascade cannot reach is the prose in `reason`, and `deleteAccount`
   * nulls that for a deleted subject in the same transaction.
   */
  routes.delete('/me', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)

    // Optional chaining, as on the code route above: a body that is null, or not an object, or
    // carries no code, all answer the same way.
    const sent = ((await bodyOf(context.req)) as { code?: unknown } | null)?.code
    const given = typeof sent === 'string' ? sent.trim() : ''
    if (!looksLikeCode(given)) return context.json({ error: 'bad-code' }, 400)

    const email = await deps.store.verifiedEmailFor(user.userId)
    if (email === null) return context.json({ error: 'no-address' }, 409)

    const now = clock()
    const stored = await deps.store.latestCode(email)
    if (stored === null) return context.json({ error: 'bad-code' }, 401)
    const verdict = verifyCode(stored, given, now, codeMatches)
    if (verdict !== 'ok') {
      // A wrong guess costs an attempt; a dead code is left alone. As in the sign-in route.
      if (verdict === 'wrong') await deps.store.recordAttempt(stored.id)
      return context.json({ error: 'bad-code' }, 401)
    }
    // Spent before the deletion, so a failure afterwards cannot leave a live code behind.
    await deps.store.consumeCode(stored.id, now)

    const gone = await deps.store.deleteAccount(user.userId)
    // The session died with the row, so there is no cookie to clear and nothing to sign out of.
    // Answered as 200 with a body rather than 204, because the client shows a last screen.
    return context.json({ deleted: gone })
  })

  /*
   * Objecting to something.
   *
   * The half of moderation that faces players, and the reason docs/ACCOUNTS.md gives for it is
   * worth repeating here: a blocklist cannot work across fifty-one languages, so what defends
   * the free-text surfaces is somebody reporting them and somebody able to act. The `reports`
   * table has existed since the first migration with nothing writing to it, which made the
   * moderation queue a queue of nothing.
   *
   * **Behind the session**, which is a deliberate cost. An anonymous button would collect more
   * reports and the column is nullable so it could, but a queue nobody can be held to is a queue
   * of noise: the value of a report is largely who filed it and whether they file good ones.
   *
   * A subject that is not there is 404 rather than a report about nothing, and the two kinds of
   * subject resolve through the same readers the public pages use -- one idea of what a person
   * is and one of what a game is, rather than a moderation-flavoured copy of each.
   */
  routes.post('/reports', async (context) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)

    const parsed = parseReport(await bodyOf(context.req))
    if (!parsed.ok) return context.json({ error: 'bad-report', problem: parsed.problem }, 400)
    const { field, username, gameId, reason } = parsed.report

    /*
     * Both ends, resolved to ids.
     *
     * A reported game carries its owner as well, because a score is objected to *and* somebody
     * set it: a queue that held only the game id would make "has this person done this before"
     * a question nobody can ask.
     */
    let subjectUserId: string | null = null
    let subjectGameId: string | null = null
    if (gameId !== null) {
      const game = await deps.store.gameById(gameId)
      if (game === null) return context.json({ error: 'no-subject' }, 404)
      subjectGameId = gameId
      subjectUserId = game.owner.userId
    }
    if (username !== null) {
      const subject = await deps.store.profileByUsername(normalizeUsername(username))
      if (subject === null) return context.json({ error: 'no-subject' }, 404)
      subjectUserId = subject.userId
    }

    // Reporting yourself is not moderation, and the queue is short enough to be worth keeping
    // free of it. Refused rather than silently dropped, because somebody who did it by accident
    // should find out.
    if (subjectUserId === user.userId) return context.json({ error: 'self-report' }, 409)

    const filed = await deps.store.insertReport({
      id: newId(),
      reporterUserId: user.userId,
      subjectUserId,
      subjectGameId,
      field,
      reason,
    })
    // A duplicate is 200 rather than 409. From where the person is standing they reported it and
    // it is reported; telling them the difference would only invite a second attempt.
    return context.json({ filed }, filed ? 201 : 200)
  })

  /*
   * The two public routes, behind a limit where the deployment can identify a caller.
   *
   * Applied as middleware on the path rather than inside each handler, so a third public route
   * added later inherits it by sitting under the same prefix rather than by somebody remembering.
   */
  if (deps.publicLimit !== undefined) routes.use('/users/*', rateLimit(deps.publicLimit))

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
/**
 * How many rows a best-games table may ask for.
 *
 * Its own ceiling rather than `GAMES_MAX`, because this one is read to fill a five-row table on
 * a panel and there is no page two. Two hundred rows would be a different feature.
 */
const BEST_LIMIT = 5
const BEST_MAX = 20

function bestLimitFrom(asked: string | undefined): number {
  const wanted = Number(asked ?? BEST_LIMIT)
  return Number.isInteger(wanted) && wanted > 0 ? Math.min(wanted, BEST_MAX) : BEST_LIMIT
}

/**
 * The game being placed in the table, from the query string, or null when none was named.
 *
 * All three or nothing: a score with no finish time cannot be excluded from the rows it is being
 * ranked against, and a half-given game would be counted twice. Null rather than a 400 for a
 * malformed one -- the worst it costs is a table with one extra row and a rank of one, which is
 * a results screen that is slightly wrong rather than a results screen that is an error page.
 *
 * **Bounded, not merely typed, and the bounds are the point.** `Number.isInteger` says yes to
 * 1e308 and to 1e16, and both of those reach the database: a score that large is handed to an
 * `integer` column, which Postgres rejects on the parameter, and a moment that large is an
 * Invalid Date, which drizzle's timestamp mapper turns into `RangeError: Invalid time value` on
 * its way to `toISOString`. Nothing catches either, so both were a 500 from a query string. The
 * fake store could not have caught them -- it compares JavaScript numbers, where a huge score is
 * simply a big number and `new Date(1e16).getTime()` is NaN, which compares unequal to every row
 * and so excludes nothing. Tested here against the route rather than against the store for
 * exactly that reason.
 *
 * An empty parameter is absent rather than zero: `Number('')` is 0, so `?score=&rounds=&at=`
 * described a scoreless game finished at the epoch, and got a straight-faced answer about it.
 */
const INT4_MAX = 2 ** 31 - 1
/** The end of the range a `Date` can hold. Past it, every date operation throws. */
const TIME_MAX = 8.64e15

export function placingFrom(
  query: Record<string, string>,
): { score: number; rounds: number; at: Date } | null {
  const score = countFrom(query.score)
  const rounds = countFrom(query.rounds)
  const at = numberFrom(query.at)
  if (score === null || rounds === null || at === null) return null
  if (!Number.isSafeInteger(at) || Math.abs(at) > TIME_MAX) return null
  return { score, rounds, at: new Date(at) }
}

/** A count the database can hold, or null. Whole, not negative, and inside an `integer`. */
function countFrom(asked: string | undefined): number | null {
  const value = numberFrom(asked)
  if (value === null || !Number.isInteger(value)) return null
  return value >= 0 && value <= INT4_MAX ? value : null
}

/** A number that was actually given. Absent and empty are both absent; `Number('')` is 0. */
function numberFrom(asked: string | undefined): number | null {
  if (asked === undefined || asked === '') return null
  const value = Number(asked)
  return Number.isFinite(value) ? value : null
}

function limitFrom(asked: string | undefined): number {
  const wanted = Number(asked ?? GAMES_LIMIT)
  return Number.isInteger(wanted) && wanted > 0 ? Math.min(wanted, GAMES_MAX) : GAMES_LIMIT
}

/** As in `auth/routes.ts`: the body is whatever somebody posted, so it is typed as that. */
async function bodyOf(request: { json: <T>() => Promise<T> }): Promise<unknown> {
  return request.json<unknown>().catch(() => null)
}
