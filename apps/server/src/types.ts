import type { AccountStore } from './account/types.js'
import type { AuthStore } from './auth/types.js'

/**
 * One database, behind two ports.
 *
 * The routes are written against whichever half they need — signing in never touches games, and
 * the profile screen never reads a login code — and the process wires up a single object that
 * satisfies both. Splitting the interfaces without splitting the store is deliberate: it keeps
 * the fakes in the test suite small without pretending there are two databases.
 */
export type Store = AuthStore & AccountStore
