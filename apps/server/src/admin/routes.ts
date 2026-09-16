import { Hono } from 'hono'
import { currentUser } from '../auth/routes.js'
import type { SessionDeps } from '../auth/routes.js'
import type { Profile } from '../auth/types.js'
import type { Store } from '../types.js'
import { booleanField, parseAdminPatch } from './editing.js'
import type { GameFilter } from './types.js'

/**
 * The moderation surface, and the only part of the API that reads across everybody.
 *
 * docs/ACCOUNTS.md asked for this in one sentence and it is worth quoting, because it is also the
 * argument against the smaller thing: "the shape it should take is not a lone endpoint. What is
 * actually wanted is an `is_admin` on `users` and an admin panel behind it: delete and modify
 * accounts, curate leaderboards, resolve the `reports` rows that already have a table and nothing
 * reading them. A moderation queue with no way to act on it is the current state, and one delete
 * route would not change that."
 *
 * So: three things to act on, and one gate in front of all of them.
 */

export interface AdminDeps extends SessionDeps {
  readonly store: Store
}

/**
 * The gate, as middleware over the whole subtree.
 *
 * One place rather than a check at the top of nine handlers, which is the property worth having:
 * a route added to this file later is behind the gate because of where it is, not because
 * somebody remembered. That is the opposite trade from `account/routes.ts`, where each handler
 * asks for the session itself -- there the answer differs per route, since some of them are
 * public. Here nothing is public, and there is nothing to decide per route.
 *
 * 401 and 403 are kept apart deliberately. They are different facts and the client shows
 * different things: signed out means sign in, and not an admin means this page is not for you.
 * There is no enumeration concern -- you have to be signed in to tell them apart at all, and
 * being told your own account is not an admin reveals nothing you did not already know.
 */
interface AdminEnv {
  Variables: { admin: Profile }
}

export function adminRoutes(deps: AdminDeps): Hono<AdminEnv> {
  const clock = deps.now ?? ((): Date => new Date())
  const routes = new Hono<AdminEnv>()

  routes.use('*', async (context, next) => {
    const user = await currentUser(deps, context)
    if (user === null) return context.json({ error: 'signed-out' }, 401)
    // The column, every time, rather than anything the client said about itself. `Profile.isAdmin`
    // goes out to the browser so a menu can be drawn; this is what decides.
    if (!user.isAdmin) return context.json({ error: 'not-admin' }, 403)
    context.set('admin', user)
    await next()
  })

  /*
   * Find somebody.
   *
   * One search box over names and sign-in addresses together, because the question is always
   * "find me this person" and whoever is asking has whichever handle they were given -- a
   * username from a report, an address from an email. No query lists the most recent accounts,
   * which is the right thing to open on: a moderation screen with an empty state is a screen
   * that has to be used before it shows anything.
   */
  routes.get('/users', async (context) => {
    const users = await deps.store.findUsers(
      context.req.query('q') ?? null,
      limitFrom(context.req.query('limit')),
    )
    return context.json({ users })
  })

  /* One account, in full: how they sign in, and how much they have played. */
  routes.get('/users/:id', async (context) => {
    const user = await deps.store.adminUser(context.req.param('id'))
    if (user === null) return context.json({ error: 'no-user' }, 404)
    return context.json(user)
  })

  /*
   * Change one.
   *
   * The rename is the point of it, and docs/ACCOUNTS.md says why it has to exist: a blocklist
   * cannot work across fifty-one languages, so what defends the namespace is "a report button and
   * the power to rename an account and tell its owner why". The rename is this route; telling
   * them why is still a thing a person does by hand.
   */
  routes.patch('/users/:id', async (context) => {
    const id = context.req.param('id')
    const parsed = parseAdminPatch(await bodyOf(context.req))
    if (!parsed.ok) {
      return context.json(
        { error: 'bad-field', field: parsed.problem.field, problem: parsed.problem.problem },
        400,
      )
    }

    /*
     * Nobody edits their own admin flag.
     *
     * Not a safety rail against a mistake -- it is what stops the flag being a thing an admin
     * panel can hand out to itself. Combined with the column never being written anywhere in
     * sign-up, it means every admin was made by somebody else, and the first one by hand against
     * the database. A one-admin deployment that removes its own flag would also have locked
     * everybody out of the panel, which this happens to prevent as well.
     */
    if (parsed.patch.isAdmin !== undefined && id === context.get('admin').userId) {
      return context.json({ error: 'not-yourself' }, 409)
    }

    const result = await deps.store.editUser(id, parsed.patch)
    if (result.ok) return context.json(result.user)
    if (result.reason === 'no-user') return context.json({ error: 'no-user' }, 404)
    return context.json({ error: 'username-taken', field: 'username', problem: 'taken' }, 409)
  })

  /*
   * Mark an account deleted, and bring one back.
   *
   * Marked rather than reaped, which is what `users.deleted_at` is for: a cascade fired from an
   * HTTP handler has no way back if it was aimed at the wrong row, and this handler can be aimed
   * at anybody. The reaper that finishes the job is what App Store 5.1.1(v) will need and does
   * not exist yet.
   *
   * A marked account cannot sign in -- `findSession` already joins `users` and checks the
   * column -- so this ends their sessions as a consequence rather than as a second step.
   */
  routes.delete('/users/:id', async (context) => {
    const id = context.req.param('id')
    // Deleting yourself through the panel is almost certainly a misclick, and the account you
    // would lose is the one that can undo it.
    if (id === context.get('admin').userId) return context.json({ error: 'not-yourself' }, 409)
    const found = await deps.store.markUserDeleted(id, clock())
    if (!found) return context.json({ error: 'no-user' }, 404)
    return context.json({ deleted: true })
  })

  routes.post('/users/:id/restore', async (context) => {
    const found = await deps.store.markUserDeleted(context.req.param('id'), null)
    if (!found) return context.json({ error: 'no-user' }, 404)
    return context.json({ deleted: false })
  })

  /*
   * Curating a board, which in practice means looking at games and hiding the impossible ones.
   *
   * docs/ACCOUNTS.md settles what the defence against a forged score is, and it is this screen:
   * the server scores a submission from its own words, which stops the thirty-second attack, and
   * anything that survives that is dealt with by somebody looking at it. "If a stupid score
   * appears anyway, delete it. A `hidden` column and an admin route."
   *
   * Hidden games are included in the listing unless the filter excludes them, because a hidden
   * game that could not be found again could never be un-hidden.
   */
  routes.get('/games', async (context) => {
    const hidden = context.req.query('hidden')
    const filter: GameFilter = {
      ...maybe('language', context.req.query('language')),
      ...maybe('difficulty', context.req.query('difficulty')),
      ...maybe('userId', context.req.query('user')),
      // Absent means both, which is not the same as false and is why this is not a boolean with
      // a default. A screen that silently hid the hidden ones would be the one screen that
      // cannot do its job.
      ...(hidden === 'true' || hidden === 'false' ? { hidden: hidden === 'true' } : {}),
      limit: limitFrom(context.req.query('limit')),
    }
    const games = await deps.store.findGames(filter)
    return context.json({ games })
  })

  /* Hide a game, or bring it back. Reversible, which is the whole reason it is not a delete. */
  routes.patch('/games/:id', async (context) => {
    const hidden = booleanField(await bodyOf(context.req), 'hidden')
    if (hidden === null) return context.json({ error: 'bad-field', field: 'hidden' }, 400)
    const found = await deps.store.setGameHidden(context.req.param('id'), hidden)
    if (!found) return context.json({ error: 'no-game' }, 404)
    return context.json({ hidden })
  })

  /*
   * The queue.
   *
   * Open ones by default, because that is the work. `state=all` is for looking at what was
   * decided, which is the other thing a queue is for and the reason resolving is reversible.
   */
  routes.get('/reports', async (context) => {
    const reports = await deps.store.findReports(
      context.req.query('state') !== 'all',
      limitFrom(context.req.query('limit')),
    )
    return context.json({ reports })
  })

  /* Deal with one, or put it back. */
  routes.patch('/reports/:id', async (context) => {
    const resolved = booleanField(await bodyOf(context.req), 'resolved')
    if (resolved === null) return context.json({ error: 'bad-field', field: 'resolved' }, 400)
    const found = await deps.store.setReportResolved(
      context.req.param('id'),
      resolved ? clock() : null,
    )
    if (!found) return context.json({ error: 'no-report' }, 404)
    return context.json({ resolved })
  })

  return routes
}

/** Most rows one request will hand back, and the default when nobody says. */
const PAGE = 50
const PAGE_MAX = 200

/** As in `account/routes.ts`, and the same numbers: two listings that disagreed would confuse. */
function limitFrom(asked: string | undefined): number {
  const wanted = Number(asked ?? PAGE)
  return Number.isInteger(wanted) && wanted > 0 ? Math.min(wanted, PAGE_MAX) : PAGE
}

/**
 * A query parameter as an optional property, with absent still meaning absent.
 *
 * `exactOptionalPropertyTypes` is on, so `{ language: undefined }` is not the same type as `{}`
 * and only the second one means "do not filter on it".
 */
function maybe<K extends string>(key: K, value: string | undefined): Record<K, string> | object {
  return value === undefined || value === '' ? {} : { [key]: value }
}

/** As in the other two route files: the body is whatever somebody posted, so it is typed as that. */
async function bodyOf(request: { json: <T>() => Promise<T> }): Promise<unknown> {
  return request.json<unknown>().catch(() => null)
}
