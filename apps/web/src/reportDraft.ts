import type { ReportField } from './account.js'
import type { Route } from './route.js'

/**
 * A report somebody started writing before they had an account.
 *
 * It exists because of an ordering problem the feature cannot avoid: reporting is behind the
 * session, and the person best placed to write a good report is whoever just read the thing they
 * are objecting to, who may well not be signed in. The first version let them write five hundred
 * characters, press Send, and only then learn they needed an account -- and the text was gone,
 * because there was nowhere for it to be.
 *
 * So it is kept, and the trip through a provider is what decides where: Apple and Google are a
 * whole navigation away and back, so component state cannot survive it and `sessionStorage` is
 * the smallest thing that can. The same choice `SignInDialog` already makes about a half-typed
 * address, and for the same reason.
 *
 * Session rather than local storage: this is one unsent report in one tab, not a preference.
 * Ten minutes, matching the sign-in resume, so a tab left open overnight does not offer to send
 * an objection somebody has long since thought better of.
 */

/** What is being objected to, and which fields that makes available. */
export type Subject =
  | { readonly kind: 'person'; readonly username: string }
  | { readonly kind: 'game'; readonly gameId: string }

export interface ReportDraft {
  readonly subject: Subject
  readonly field: ReportField
  readonly reason: string
}

const KEY = 'blinkered.report'
const KEEP_MS = 10 * 60 * 1000

/**
 * What a subject is addressed by, as one string.
 *
 * Needed because a `Subject` is built inline at every call site, so it is a new object on every
 * render and cannot be compared by identity or used in a dependency array. This can.
 */
export function subjectKey(subject: Subject): string {
  return subject.kind === 'person' ? `u:${subject.username}` : `g:${subject.gameId}`
}

/**
 * Where a draft belongs, as a route.
 *
 * The draft knows its own page rather than storing one, which is what makes the return trip
 * work without a second stored field to go stale: the subject *is* the address. Apple and Google
 * come back to `/?signin=ok` rather than to wherever the reader was — that is the server's
 * redirect and it is right to keep it simple — so somebody has to remember, and the thing that
 * remembers is the draft.
 */
export function routeOfDraft(draft: ReportDraft): Route {
  return draft.subject.kind === 'person'
    ? { at: 'player', username: draft.subject.username }
    : { at: 'played-game', id: draft.subject.gameId }
}

export function keepDraft(draft: ReportDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...draft, at: Date.now() }))
  } catch {
    /* Private browsing, or storage the browser refuses. The report still sends; it just will
       not survive a trip through a provider, which is the same trade SignInDialog makes. */
  }
}

/** The draft in hand, or null for absent, stale, and unreadable alike. */
export function draftKept(): ReportDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > KEEP_MS) return null
    const subject = asSubject(parsed.subject)
    if (subject === null) return null
    if (typeof parsed.field !== 'string' || !isField(parsed.field)) return null
    if (typeof parsed.reason !== 'string') return null
    return { subject, field: parsed.field, reason: parsed.reason }
  } catch {
    // Storage the browser refuses, or a value somebody else's code wrote. Starting over is a
    // worse experience than resuming and a much better one than a dialog that will not render.
    return null
  }
}

export function dropDraft(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* As above. */
  }
}

/**
 * A stored subject, checked rather than trusted.
 *
 * Every field is verified because this came out of storage, which is to say out of a previous
 * version of this code or out of somebody's devtools. A draft that is not the shape we wrote is
 * no draft: the alternative is a dialog rendering `undefined` as a username and then reporting
 * it.
 */
function asSubject(value: unknown): Subject | null {
  if (typeof value !== 'object' || value === null) return null
  const fields = value as Record<string, unknown>
  if (fields.kind === 'person' && typeof fields.username === 'string') {
    return { kind: 'person', username: fields.username }
  }
  if (fields.kind === 'game' && typeof fields.gameId === 'string') {
    return { kind: 'game', gameId: fields.gameId }
  }
  return null
}

function isField(value: string): value is ReportField {
  return value === 'username' || value === 'bio' || value === 'score'
}
