import type { AccountStore } from './account/types.js'
import type { AdminStore } from './admin/types.js'
import type { AuthStore } from './auth/types.js'

/**
 * One database, behind three ports.
 *
 * The routes are written against whichever they need -- signing in never touches games, the
 * profile screen never reads a login code, and nothing outside the admin panel reads across
 * everybody -- and the process wires up a single object that satisfies all three. Splitting the
 * interfaces without splitting the store is deliberate: it keeps the fakes in the test suite
 * small without pretending there are three databases.
 *
 * The split is by **surface** rather than by table, which is why `reports` is written through
 * `AccountStore` and read through `AdminStore`. A port per table would have put the moderation
 * queue's reader within reach of the report button.
 */
export type Store = AuthStore & AccountStore & AdminStore
