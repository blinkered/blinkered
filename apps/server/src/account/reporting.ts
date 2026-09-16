/**
 * What somebody is allowed to object to, checked before it reaches a row.
 *
 * Separated from the route for the reason `profile.ts` and `policy.ts` give: all of it is
 * arithmetic over a value, so all of it is testable without a Postgres, and the route does not
 * get to invent its own idea of a valid report.
 *
 * docs/ACCOUNTS.md settles why this exists at all. A blocklist is not going to work across
 * fifty-one languages and pretending otherwise is worse than not having one; what works is a
 * report button and the power to rename an account and tell its owner why. This is that button's
 * half of it, and the admin queue is the other.
 */

/** Which part is being objected to. Three, because there are three free-text surfaces. */
export const REPORT_FIELDS = ['username', 'bio', 'score'] as const

export type ReportField = (typeof REPORT_FIELDS)[number]

/**
 * How much somebody may write about why.
 *
 * Longer than a bio, because a bio is a performance and this is an explanation: "they are using
 * a slur spelled with Cyrillic о" does not fit in 140 characters and is exactly the report worth
 * receiving. Still bounded, because the field is free text arriving from anybody.
 */
export const REASON_MAX = 500

/** Anything that is not text: C0, C1, and the direction overrides that let a string lie. */
const CONTROL = /[\p{Cc}\p{Cf}]/u

export type ReportProblem =
  | 'not-an-object'
  | 'bad-field'
  /** `username` and `bio` are about a person, and neither means anything without one. */
  | 'no-subject'
  /** `score` is about a game, and a game id is the only thing that identifies one. */
  | 'no-game'
  | 'reason-too-long'
  | 'reason-has-control'

/**
 * A report as the body describes it, before either end has been looked up.
 *
 * A username rather than a user id, because the client has a username -- it is what the page it
 * is looking at is addressed by -- and asking it for an id would mean publishing one somewhere
 * a report button could read it. The route resolves it, and a name nobody has is a 404 there
 * rather than a validation problem here.
 */
export interface ParsedReport {
  readonly field: ReportField
  readonly username: string | null
  readonly gameId: string | null
  readonly reason: string | null
}

export type ReportParse =
  | { readonly ok: true; readonly report: ParsedReport }
  | { readonly ok: false; readonly problem: ReportProblem }

/**
 * Reads a report body, or says what is wrong with it.
 *
 * The subject is required and which subject depends on the field, which is the one rule here
 * worth stating twice: a report about a name needs a name and a report about a score needs a
 * game. A body carrying both is accepted and both are kept -- a score reported from a profile
 * page is still a report about that game, and the queue is better for knowing where it came
 * from.
 */
export function parseReport(body: unknown): ReportParse {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, problem: 'not-an-object' }
  }
  const fields = body as Record<string, unknown>

  const field = fields.field
  if (typeof field !== 'string' || !isReportField(field)) {
    return { ok: false, problem: 'bad-field' }
  }

  const username = text(fields.username)
  const gameId = text(fields.gameId)
  if (field === 'score') {
    if (gameId === null) return { ok: false, problem: 'no-game' }
  } else if (username === null) return { ok: false, problem: 'no-subject' }

  const reason = text(fields.reason)
  if (reason !== null) {
    if ([...reason].length > REASON_MAX) return { ok: false, problem: 'reason-too-long' }
    if (CONTROL.test(reason)) return { ok: false, problem: 'reason-has-control' }
  }

  return { ok: true, report: { field, username, gameId, reason } }
}

function isReportField(value: string): value is ReportField {
  return (REPORT_FIELDS as readonly string[]).includes(value)
}

/**
 * A submitted value as text, or null for "not given".
 *
 * The same collapse `profile.ts` makes and for the same reason: a client sending a number where
 * a string belongs has a bug, and treating it as absent is a smaller surprise than coercing it.
 */
function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
