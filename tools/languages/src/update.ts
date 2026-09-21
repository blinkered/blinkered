import { LOCALES } from '@blinkered/i18n'
import { NotAWordList, usability } from './floor.js'
import type { Floor, Tour } from './floor.js'
import { borrow, discard, hasList, readManifest, setAvailable, writeManifest } from './store.js'
import type { Entry } from './store.js'
import { fetchList, repoUrl, token } from './upstream.js'
import type { Absence, Upstream } from './upstream.js'

/**
 * What happened to one language. Six of these, and only two of them are regressions.
 *
 * The distinction that matters is between a language that has never worked and one that used
 * to. Most of these languages have no dictionary repository at all, which is the ordinary state
 * of the project rather than news; a language that worked yesterday and does not today is the
 * only thing worth stopping for.
 */
export type Verdict =
  | 'added'
  | 'updated'
  | 'unchanged'
  /** Nothing here and nothing upstream. The queue in blinkered-attestation/candidates. */
  | 'absent'
  /** Upstream has a list, it does not deal a playable board, and this repository had none. */
  | 'unusable'
  /** This repository has a list and upstream no longer does. */
  | 'lost'
  /** This repository has a list, upstream still does, and it no longer deals a playable board. */
  | 'failing'

export const REGRESSIONS: readonly Verdict[] = ['lost', 'failing']

export interface Outcome {
  readonly tag: string
  readonly endonym: string
  readonly verdict: Verdict
  readonly floor?: Floor
  /**
   * Whether the first-run tour still works. Advisory: it never changes a verdict, because a
   * language whose demonstration needs rebuilding is not a language that stopped playing.
   */
  readonly tour?: Tour
  readonly upstream?: Upstream
  /** What this repository held before the run, so a report can say what changed. */
  readonly held?: Entry
  /** Why a language is absent, or why a list was refused. One line, for the operator. */
  readonly note?: string
}

export interface Plan {
  readonly outcomes: readonly Outcome[]
  readonly regressions: readonly Outcome[]
  /** Regressions the operator has not approved. Nothing is written while this is non-empty. */
  readonly blocked: readonly Outcome[]
}

export interface Options {
  /** Only these tags, for a quick check. Empty means every localization. */
  readonly only: readonly string[]
  /** Tags whose regression the operator has approved, in writing, on this invocation. */
  readonly approved: ReadonlySet<string>
  readonly dryRun: boolean
}

/** Enough at once to be quick, few enough not to look like an attack on the API. */
const AT_ONCE = 6

async function pooled<T, R>(items: readonly T[], work: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array<R>(items.length)
  let next = 0
  const runners = Array.from({ length: Math.min(AT_ONCE, items.length) }, async () => {
    for (let at = next++; at < items.length; at = next++) {
      out[at] = await work(items[at] as T)
    }
  })
  await Promise.all(runners)
  return out
}

const ABSENCE: Record<Absence, string> = {
  'no-repository': 'no dictionary repository yet',
  'no-list': 'repository exists, nothing built yet',
}

/** Reads one language upstream and decides what it means, without writing anything. */
async function inspect(tag: string, endonym: string, held: Entry | undefined, auth: string): Promise<Outcome> {
  const here = hasList(tag)
  const found = await fetchList(tag, auth)

  if (typeof found === 'string') {
    const note = ABSENCE[found]
    if (!here) return { tag, endonym, verdict: 'absent', note, ...(held && { held }) }
    return { tag, endonym, verdict: 'lost', note, ...(held && { held }) }
  }

  const { text, upstream } = found
  let floor: Floor
  let tour: Tour
  try {
    const judged = usability(tag, text)
    floor = judged.floor
    tour = judged.tour
  } catch (error) {
    if (!(error instanceof NotAWordList)) throw error
    // A repository that publishes something other than a word list is not a language that got
    // worse, it is a language that is broken upstream. Same two verdicts either way, because the
    // question this repository asks is only ever "can this be dealt".
    const note = `upstream ${upstream.commit.slice(0, 12)} is not a word list: ${error.message}`
    const verdict: Verdict = here ? 'failing' : 'unusable'
    return { tag, endonym, verdict, upstream, note, ...(held && { held }) }
  }

  if (!floor.passes) {
    const verdict: Verdict = here ? 'failing' : 'unusable'
    return {
      tag,
      endonym,
      verdict,
      floor,
      tour,
      upstream,
      note: floor.why ?? '',
      ...(held && { held }),
    }
  }

  if (!here) return { tag, endonym, verdict: 'added', floor, tour, upstream, ...(held && { held }) }
  const same = held?.upstream?.blob === upstream.blob
  return {
    tag,
    endonym,
    verdict: same ? 'unchanged' : 'updated',
    floor,
    tour,
    upstream,
    ...(held && { held }),
  }
}

/** Reads every language and works out what would happen, which is the whole of the decision. */
export async function survey(options: Options): Promise<Plan> {
  const auth = token()
  const held = new Map(readManifest().map((entry) => [entry.tag, entry] as const))
  const wanted = LOCALES.filter(
    (locale) => options.only.length === 0 || options.only.includes(locale.tag),
  )

  const outcomes = await pooled(wanted, (locale) =>
    inspect(locale.tag, locale.endonym, held.get(locale.tag), auth),
  )
  const regressions = outcomes.filter((outcome) => REGRESSIONS.includes(outcome.verdict))
  const blocked = regressions.filter((outcome) => !options.approved.has(outcome.tag))
  return { outcomes, regressions, blocked }
}

/**
 * Applies a plan: borrows what passed, discards what the operator agreed to lose, and rewrites
 * the manifest and the `available` flags from what is on disk afterwards.
 *
 * A language the run did not look at keeps whatever it had. That is what makes `--only` safe:
 * checking German must not quietly deregister the other fifty.
 */
export async function apply(plan: Plan, when: Date): Promise<Entry[]> {
  if (plan.blocked.length > 0) throw new Error('refusing to write with regressions unapproved')

  const auth = token()
  const entries = new Map(readManifest().map((entry) => [entry.tag, entry] as const))

  for (const outcome of plan.outcomes) {
    const { tag, verdict } = outcome
    if (verdict === 'added' || verdict === 'updated') {
      // Re-read rather than carrying the body through the plan: fifty-one word lists in memory
      // is most of a gigabyte, and the plan is a thing the operator reads before anything is
      // written. The blob sha is checked against what the survey saw, so a push landing in
      // between is caught rather than silently borrowed.
      const found = await fetchList(tag, auth)
      if (typeof found === 'string' || found.upstream.blob !== outcome.upstream?.blob) {
        throw new Error(`${tag} changed upstream while this ran; run it again`)
      }
      const { parsed } = usability(tag, found.text)
      entries.set(tag, borrow(tag, found.text, parsed, found.upstream, when))
      continue
    }
    if (verdict === 'lost' || verdict === 'failing') {
      discard(tag)
      entries.delete(tag)
      continue
    }
    // 'unchanged' keeps every byte it has, including the date in its PROVENANCE.md. Rewriting a
    // file whose contents are identical would put fifty languages in the diff of a run that
    // borrowed nothing, and the point of recording the upstream commit is that it tells you when
    // something moved.
    if (verdict === 'unchanged') continue
    // 'absent' and 'unusable': nothing here to offer, and nothing worth writing.
    entries.delete(tag)
  }

  const kept = [...entries.values()].filter((entry) => hasList(entry.tag))
  writeManifest(kept)
  setAvailable(
    new Set(kept.map((entry) => entry.tag)),
    LOCALES.map((locale) => locale.tag),
  )
  return kept
}

/** The line the report and the commit message both use to name where a list came from. */
export function cite(outcome: Outcome): string {
  const { upstream } = outcome
  if (upstream === undefined) return repoUrl(outcome.tag)
  return `${repoUrl(outcome.tag)}@${upstream.commit.slice(0, 12)} (${upstream.committed.slice(0, 10)})`
}
