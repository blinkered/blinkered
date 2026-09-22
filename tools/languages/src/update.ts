import { LOCALES } from '@blinkered/i18n'
import { NotAWordList, usability } from './floor.js'
import type { Floor, Tour, Usable } from './floor.js'
import { borrow, discard, hasList, readManifest, setAvailable, writeManifest } from './store.js'
import type { Entry } from './store.js'
import { STATUS, blessed, fetchList, pending, repoUrl, token } from './upstream.js'
import type { Absence, Status, Upstream } from './upstream.js'

/**
 * What happened to one language. Eight of these, and only three are regressions.
 *
 * The distinction that matters is between a language that has never worked and one that used
 * to. Most of these languages have no dictionary repository at all, which is the ordinary state
 * of the project rather than news; a language that worked yesterday and does not today is the
 * only thing worth stopping for. Each pair below is the same fact on either side of that line.
 */
export type Verdict =
  | 'added'
  | 'updated'
  | 'unchanged'
  /** Nothing here and nothing upstream. The queue in blinkered-attestation/candidates. */
  | 'absent'
  /** Upstream has a list and has refused it, in writing. Its own decision, not ours to overrule. */
  | 'held'
  /**
   * Upstream has a list and nobody has ruled on it either way.
   *
   * Split out of `held`, which used to mean both this and a refusal, because they ask different
   * things of the operator: a refusal asks to be read, and this asks to be decided.
   */
  | 'pending'
  /** Upstream has a list, it does not deal a playable board, and this repository had none. */
  | 'unusable'
  /** This repository has a list and upstream no longer does. */
  | 'lost'
  /** This repository has a list, and upstream has decided it should stop shipping. */
  | 'withdrawn'
  /** This repository has a list, upstream still does, and it no longer deals a playable board. */
  | 'failing'

/**
 * The three ways a language this repository plays today would stop being playable.
 *
 * All three are the operator's to approve, and for one reason: whatever the cause, the effect on
 * somebody who opened the app this morning is identical.
 */
export const REGRESSIONS: readonly Verdict[] = ['lost', 'withdrawn', 'failing']

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
  /**
   * Why the floor could not be measured, when something else had already decided the verdict.
   *
   * Only ever set on a language the blessing spoke for. For one upstream wants shipped, a list
   * that does not parse *is* the verdict, and arrives as `unusable` or `failing` with the same
   * sentence in `note`.
   */
  readonly unmeasured?: string
  /** What the language says about itself. Absent when there was nothing upstream to ask. */
  readonly status?: Status | null
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
  /**
   * Re-write every borrowed language even where upstream has not moved.
   *
   * For when what changed is on this side: the LICENSE and PROVENANCE.md are generated from
   * templates here, so editing one of those templates leaves seven files describing themselves
   * the old way with nothing to notice it. Borrowing is otherwise keyed on the upstream blob,
   * which is right for the words and blind to the prose around them.
   */
  readonly rewrite: boolean
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

/** The floor, or the one sentence saying why there is no floor to report. */
type Measured = { readonly judged: Usable } | { readonly unmeasured: string }

/**
 * Deals the three boards, and catches the one failure that is a fact about the list rather than
 * a fault in the run.
 *
 * Split out of `inspect` because it now happens on both sides of the blessing, and what an
 * unparseable list *means* depends on which side: for a language upstream wants shipped it is
 * the verdict, and for one nobody has ruled on it is a footnote under the row.
 */
function measure(tag: string, text: string, upstream: Upstream): Measured {
  try {
    return { judged: usability(tag, text) }
  } catch (error) {
    if (!(error instanceof NotAWordList)) throw error
    return {
      unmeasured: `upstream ${upstream.commit.slice(0, 12)} is not a word list: ${error.message}`,
    }
  }
}

/** The floor fields an outcome carries, from a measurement that may not have been taken. */
function measured(seen: Measured | undefined): Partial<Outcome> {
  if (seen === undefined) return {}
  if ('judged' in seen) return { floor: seen.judged.floor, tour: seen.judged.tour }
  return { unmeasured: seen.unmeasured }
}

/** What the report prints beside a language whose repository has not blessed it. */
function blessingNote(status: Status | null, here: boolean): string {
  if (status === null) {
    return here
      ? `${STATUS} is gone upstream, so nothing blesses it any more`
      : `no ${STATUS} upstream, so nobody has ruled on it yet`
  }
  if (status.ships === 'pending') {
    return here
      ? 'upstream has gone back to pending, so nothing blesses it any more'
      : 'built upstream, and nobody has ruled on it yet'
  }
  return status.why ?? 'refused upstream, with no reason given'
}

/** Reads one language upstream and decides what it means, without writing anything. */
async function inspect(
  tag: string,
  endonym: string,
  held: Entry | undefined,
  auth: string,
  rewrite: boolean,
): Promise<Outcome> {
  const here = hasList(tag)
  const found = await fetchList(tag, auth)

  if (typeof found === 'string') {
    const note = ABSENCE[found]
    if (!here) return { tag, endonym, verdict: 'absent', note, ...(held && { held }) }
    return { tag, endonym, verdict: 'lost', note, ...(held && { held }) }
  }

  const { text, upstream, status } = found

  /*
   * The blessing decides the verdict, and the floor is measured for everything it has not refused.
   *
   * The two questions are not in the same order of authority. The floor asks whether a board can
   * be dealt; `ships` asks whether it should be. Japanese answers yes to the first and no to the
   * second -- it clears the floor comfortably and is refused because its reader cannot build
   * compound words, which is most of Japanese -- so a run whose verdict followed the floor would
   * report it as passing and then withdraw it, which reads as a mechanical failure of exactly the
   * kind this file exists to distinguish from.
   *
   * What that ordering must not do is decline to look. Returning here before measuring drew a
   * closed circle around every unblessed language: it is not offered until somebody blesses it,
   * nobody can bless it without knowing whether it plays, and the only run that could say so
   * skipped it on the grounds that it was not blessed. So a `pending` language is measured like
   * any other and its floor is printed under its row.
   *
   * A refusal is still not measured, and that is not the same omission. There the argument is
   * editorial and already written down; dealing Japanese three more boards it would pass would
   * put a line in every run that nothing turns on and nobody acts upon.
   */
  if (!blessed(status)) {
    const refused = !pending(status)
    const verdict: Verdict = here ? 'withdrawn' : refused ? 'held' : 'pending'
    return {
      tag,
      endonym,
      verdict,
      upstream,
      status,
      note: blessingNote(status, here),
      ...measured(refused ? undefined : measure(tag, text, upstream)),
      ...(held && { held }),
    }
  }

  const seen = measure(tag, text, upstream)
  if (!('judged' in seen)) {
    // A repository that publishes something other than a word list is not a language that got
    // worse, it is a language that is broken upstream. Same two verdicts either way, because the
    // question this repository asks is only ever "can this be dealt".
    const verdict: Verdict = here ? 'failing' : 'unusable'
    return { tag, endonym, verdict, status, upstream, note: seen.unmeasured, ...(held && { held }) }
  }
  const { floor, tour } = seen.judged

  if (!floor.passes) {
    const verdict: Verdict = here ? 'failing' : 'unusable'
    return {
      tag,
      endonym,
      verdict,
      floor,
      tour,
      status,
      upstream,
      note: floor.why ?? '',
      ...(held && { held }),
    }
  }

  if (!here) {
    return { tag, endonym, verdict: 'added', floor, tour, status, upstream, ...(held && { held }) }
  }
  const same = !rewrite && held?.upstream?.blob === upstream.blob
  return {
    tag,
    endonym,
    verdict: same ? 'unchanged' : 'updated',
    floor,
    tour,
    status,
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
    inspect(locale.tag, locale.endonym, held.get(locale.tag), auth, options.rewrite),
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
      // The blessing is re-read with the bytes and re-checked, so a language whose repository
      // withdrew it between the survey and the write is refused rather than borrowed. Through
      // `blessed`, because `!found.status.ships` is false for the string `'pending'`: written
      // the obvious way, this guard would wave through every language nobody had ruled on.
      //
      // The null is tested separately rather than folded into `blessed`, which would have to
      // claim to be a type guard to narrow here. It would be a false one: everything it rejects
      // is not null, it is a language that was refused.
      const { status } = found
      if (status === null || !blessed(status)) {
        throw new Error(`${tag} stopped shipping upstream while this ran; run it again`)
      }
      const { parsed } = usability(tag, found.text)
      entries.set(tag, borrow(tag, found.text, parsed, found.upstream, status, when))
      continue
    }
    if (verdict === 'lost' || verdict === 'withdrawn' || verdict === 'failing') {
      discard(tag)
      entries.delete(tag)
      continue
    }
    // 'unchanged' keeps every byte it has, including the date in its PROVENANCE.md. Rewriting a
    // file whose contents are identical would put fifty languages in the diff of a run that
    // borrowed nothing, and the point of recording the upstream commit is that it tells you when
    // something moved.
    if (verdict === 'unchanged') continue
    // 'absent', 'held', 'pending' and 'unusable': nothing to offer, and nothing worth writing.
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
