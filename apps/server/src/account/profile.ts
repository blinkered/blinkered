import type { UsernameProblem } from '../auth/usernames.js'
import { checkUsername } from '../auth/usernames.js'
import type { ProfilePatch } from './types.js'

/**
 * What a person is allowed to say about themselves, checked before it reaches a column.
 *
 * Separated from the route for the reason `policy.ts` gives about login codes: all of it is
 * arithmetic over a value, so all of it is testable without a Postgres, and the route does not
 * get to invent its own idea of a valid bio.
 */

/** The bio, in code points. Short on purpose; see docs/ACCOUNTS.md. */
export const BIO_MAX = 140

export type BioProblem = 'too-long' | 'has-link' | 'has-control'
export type PatchProblem =
  | { readonly field: 'username'; readonly problem: UsernameProblem }
  | { readonly field: 'bio'; readonly problem: BioProblem }
  | { readonly field: 'country'; readonly problem: 'not-a-country' }
  | { readonly field: 'uiLanguage' | 'gameLanguage'; readonly problem: 'not-a-language' }
  | { readonly field: 'body'; readonly problem: 'not-an-object' }

export type ParsedPatch =
  | { readonly ok: true; readonly patch: ProfilePatch }
  | { readonly ok: false; readonly problem: PatchProblem }

/**
 * Anything that would read as a link.
 *
 * Three shapes, because a spammer needs only one of them to work: a scheme, the `www.` that
 * every mail client turns into a link anyway, and a bare host. The bio is rendered as text and
 * is never auto-linked — that is the rule the whole field depends on and it is written down in
 * docs/ACCOUNTS.md — so what this is defending is not the renderer, it is the value of the field
 * to somebody advertising in it.
 *
 * The host pattern over-rejects, and knowingly: `cats.so` is a valid sentence in the wrong place
 * and this refuses it. A TLD list would be more precise, and it would be a second list to keep
 * in step with ICANN for the sake of a 140-character field somebody can rewrite. The dot has to
 * be tight on both sides, so ordinary prose with a full stop and a space is unaffected.
 */
const LINK = /:\/\/|\bwww\.|[\p{L}\p{N}][\p{L}\p{N}-]*\.[A-Za-z]{2,24}(?![\p{L}\p{N}])/u

/** Anything that is not text: C0, C1, and the direction overrides that let a name lie about itself. */
const CONTROL = /[\p{Cc}\p{Cf}]/u

/** Two ASCII letters, ISO 3166-1 alpha-2, self-declared. Never geo-IP; see docs/ACCOUNTS.md. */
const COUNTRY = /^[A-Za-z]{2}$/

/**
 * The shape of a BCP 47 tag, and not a membership test.
 *
 * Which languages the game actually has is the catalogue the client already reads, built from
 * the word lists at build time. Copying it here would be a second list that goes stale the first
 * time one is added, and a tag the game cannot display falls back to the default anyway — which
 * is what an unknown tag does today for a browser that reports one.
 */
const LANGUAGE = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/

/** Checks a bio and hands back what will be stored, which is the trimmed form. */
export function checkBio(bio: string): BioProblem | null {
  const trimmed = bio.trim()
  if ([...trimmed].length > BIO_MAX) return 'too-long'
  if (CONTROL.test(trimmed)) return 'has-control'
  if (LINK.test(trimmed)) return 'has-link'
  return null
}

/**
 * Reads a PATCH body into a patch, or says what is wrong with it.
 *
 * Absent and null are different answers and both are kept: `{}` leaves a field alone and
 * `{ bio: null }` clears it. An empty string clears too, because a field somebody has emptied in
 * a form is a field they meant to remove, and storing `''` would make "no bio" and "a bio of
 * nothing" two states that render identically and sort differently.
 *
 * The first problem rather than all of them, matching `checkUsername`: the audience is somebody
 * with a form open who will see the next one the moment they fix this.
 */
export function parsePatch(body: unknown): ParsedPatch {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, problem: { field: 'body', problem: 'not-an-object' } }
  }
  const fields = body as Record<string, unknown>
  let patch: ProfilePatch = {}

  if ('username' in fields) {
    // No clearing here, and that is the one asymmetry: `users.username` is NOT NULL and stays
    // that way, for the reason usernames.ts gives at length. An empty one is a bad name rather
    // than an instruction to remove it, and `checkUsername` says so.
    const name = text(fields.username) ?? ''
    const problem = checkUsername(name)
    if (problem !== null) return { ok: false, problem: { field: 'username', problem } }
    patch = { ...patch, username: name }
  }

  if ('bio' in fields) {
    const bio = text(fields.bio)
    if (bio === null) patch = { ...patch, bio: null }
    else {
      const problem = checkBio(bio)
      if (problem !== null) return { ok: false, problem: { field: 'bio', problem } }
      patch = { ...patch, bio }
    }
  }

  if ('country' in fields) {
    const country = text(fields.country)
    if (country === null) patch = { ...patch, country: null }
    else if (!COUNTRY.test(country)) {
      return { ok: false, problem: { field: 'country', problem: 'not-a-country' } }
    } else {
      // Stored upper case, because ISO 3166-1 alpha-2 is upper case and the flag files are named
      // in lower. One of the two has to be canonical or a lookup eventually misses.
      patch = { ...patch, country: country.toUpperCase() }
    }
  }

  if ('uiLanguage' in fields) {
    const tag = text(fields.uiLanguage)
    if (tag === null) patch = { ...patch, uiLanguage: null }
    else if (!LANGUAGE.test(tag)) {
      return { ok: false, problem: { field: 'uiLanguage', problem: 'not-a-language' } }
    } else patch = { ...patch, uiLanguage: tag }
  }

  if ('gameLanguage' in fields) {
    const tag = text(fields.gameLanguage)
    if (tag === null) patch = { ...patch, gameLanguage: null }
    else if (!LANGUAGE.test(tag)) {
      return { ok: false, problem: { field: 'gameLanguage', problem: 'not-a-language' } }
    } else patch = { ...patch, gameLanguage: tag }
  }

  return { ok: true, patch }
}

/**
 * A submitted value as text, or null for "remove this".
 *
 * Null, an empty string, and a value of a type the field never holds all collapse to the same
 * answer, and that last one is deliberate: a client sending `{ bio: 42 }` has a bug, and clearing
 * the field is a smaller surprise than storing `"42"` under somebody's name.
 */
function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
