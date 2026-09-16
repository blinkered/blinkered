import { parsePatch } from '../account/profile.js'
import type { PatchProblem } from '../account/profile.js'
import type { AdminPatch } from './types.js'

/**
 * What an admin is allowed to change, checked before it reaches a column.
 *
 * Almost entirely `parsePatch`, on purpose. A name an admin types goes through exactly the checks
 * a name its owner types does: the rules in `usernames.ts` exist to stop impersonation and
 * confusable homoglyphs, and an admin renaming somebody past them would be creating the problem
 * the rules are there to prevent. What is added is the one field an owner has no business
 * setting.
 */

export type AdminPatchProblem =
  PatchProblem | { readonly field: 'isAdmin'; readonly problem: 'not-a-boolean' }

export type ParsedAdminPatch =
  | { readonly ok: true; readonly patch: AdminPatch }
  | { readonly ok: false; readonly problem: AdminPatchProblem }

/**
 * Reads an admin's PATCH body.
 *
 * `isAdmin` has to be an actual boolean rather than anything truthy. Everywhere else in this
 * repository a value of the wrong type collapses to a sensible default -- `profile.ts` treats
 * `{ bio: 42 }` as "clear it" -- and that is right for a field somebody can retype. It is wrong
 * for the field that decides who can delete accounts: `{ isAdmin: "false" }` is truthy, and a
 * coercion there would grant the power it was trying to describe removing.
 */
export function parseAdminPatch(body: unknown): ParsedAdminPatch {
  const parsed = parsePatch(body)
  if (!parsed.ok) return parsed

  const fields = body as Record<string, unknown>
  if (!('isAdmin' in fields)) return { ok: true, patch: parsed.patch }
  if (typeof fields.isAdmin !== 'boolean') {
    return { ok: false, problem: { field: 'isAdmin', problem: 'not-a-boolean' } }
  }
  return { ok: true, patch: { ...parsed.patch, isAdmin: fields.isAdmin } }
}

/**
 * Reads a `{ <name>: boolean }` body, which three routes want and none of them differently.
 *
 * Strict for the reason above, and it matters more here than it looks: these are the bodies that
 * hide a game and resolve a report, and a missing key coerced to `false` would silently un-hide
 * something the request never mentioned.
 */
export function booleanField(body: unknown, name: string): boolean | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const value = (body as Record<string, unknown>)[name]
  return typeof value === 'boolean' ? value : null
}
