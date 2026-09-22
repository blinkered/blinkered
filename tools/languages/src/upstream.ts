import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

/** The organization every dictionary repository lives in. */
export const ORG = 'blinkered'
export const PREFIX = 'blinkered-dictionary-'
/** The one file this repository borrows. Everything else stays where it was built. */
export const WORDS = 'words.txt'
/** The language's own verdict on whether it is fit to ship, which is not ours to infer. */
export const STATUS = 'status.json'

export function repoFor(tag: string): string {
  return `${PREFIX}${tag}`
}

export function repoUrl(tag: string): string {
  return `https://github.com/${ORG}/${repoFor(tag)}`
}

/** Where a borrowed list came from, in enough detail that somebody can go and look. */
export interface Upstream {
  readonly repo: string
  /** The commit that last changed `words.txt`, which is what this copy is a copy of. */
  readonly commit: string
  /** When that commit was made, so a stale borrow is visible without resolving the sha. */
  readonly committed: string
  /** Git's own hash of the file, which is what tells one borrow from another. */
  readonly blob: string
}

/**
 * What a language's repository says about shipping, and there are three answers rather than two.
 *
 * `false` used to carry both "we looked and said no" and "nobody has looked yet". Those are
 * different facts and they want different handling: the first is a decision with an argument
 * behind it, the second is work not done. Japanese is `false` and will stay that way until its
 * reader can build compound words; a language built this morning is `'pending'`.
 *
 * Only `true` ships. The other two are alike in that one respect and in no other, and the code
 * here says `blessed(status)` rather than testing the field, because `!status.ships` is false
 * for the string `'pending'` and would offer every language nobody had ruled on.
 */
export type Ships = boolean | 'pending'

/**
 * A language's own decision about whether Blinkered should be playing it.
 *
 * Deliberately not something this repository works out for itself. Japanese clears the usability
 * floor comfortably and is held back anyway, because its reader cannot produce compound words and
 * Japanese vocabulary is largely compounds -- a judgment about whether the list is any good,
 * which no board count can reach. The floor is a mechanical check and this is an editorial one,
 * and a language that passes the first and fails the second must not ship.
 */
export interface Status {
  readonly ships: Ships
  readonly decided?: string
  /** Why, in the operator's words. Carried into the report, because the reason is the point. */
  readonly why?: string
  /**
   * The SPDX id the list itself is under, declared by the repository that made it.
   *
   * Read rather than assumed. A language's terms are that language's to state, and this used to
   * be a constant here, which meant two places knew the answer and only one of them was right.
   * If a list ever ships under something else, or these ever change, the change arrives on its
   * own.
   *
   * Not the repository's `LICENSE` file, which covers its code. These repositories are
   * Apache-2.0 for `build.mjs` and CC0 for `words.txt`, and it is the second that travels with
   * the words. Reading the file would confidently borrow the wrong one.
   */
  readonly license?: string
}

export interface Fetched {
  readonly upstream: Upstream
  readonly text: string
  /**
   * Null when the repository publishes no `status.json` at all, which counts as "do not ship".
   *
   * Failing closed is the only safe default: shipping on the assumption is how a list nobody
   * approved reaches a player. It is distinguished from a *failed read*, which throws instead --
   * a token that has expired must not read as fifty-one languages quietly withdrawing.
   *
   * It reads as `'pending'` rather than as a refusal. A repository with no `status.json` is one
   * nobody has ruled on yet, which is the same state a fresh language is in, and calling it a
   * decision would hide it among the languages that were actually argued over.
   */
  readonly status: Status | null
}

/**
 * Whether this language's repository has blessed it. Only `true` does.
 *
 * A function rather than a field test, and every caller uses it, because the field is no longer
 * a boolean and the obvious `!status.ships` reads `'pending'` as blessed.
 */
export function blessed(status: Status | null): boolean {
  return status !== null && status.ships === true
}

/**
 * Whether nobody has ruled on this language yet, which is not the same as having refused it.
 *
 * The distinction is the whole reason for the third state. A refusal is an argument somebody
 * made and can be read; this is a question nobody has answered.
 */
export function pending(status: Status | null): boolean {
  return status === null || status.ships === 'pending'
}

/**
 * Why a language has no list to borrow. Both are ordinary states rather than faults: most of
 * these languages have no repository yet, and a repository can exist before it has built
 * anything.
 */
export type Absence = 'no-repository' | 'no-list'

/**
 * A token for the API, from whatever the operator has already set up.
 *
 * These repositories are private, so an unauthenticated read reports every one of them as
 * missing. That is the worst possible failure here: fifty-one languages would look like
 * fifty-one deletions and the regression gate would fire on all of them. So a missing token is
 * refused up front rather than discovered as data.
 */
export function token(): string {
  if (process.env.GITHUB_TOKEN !== undefined && process.env.GITHUB_TOKEN !== '') {
    return process.env.GITHUB_TOKEN
  }
  try {
    const found = execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (found !== '') return found
  } catch {
    // gh is not installed, or nobody is logged in. Same answer either way.
  }
  throw new Error(
    'no GitHub credentials: run `gh auth login`, or set GITHUB_TOKEN. The dictionary ' +
      'repositories are private, and an anonymous read reports every one of them as missing.',
  )
}

/** Git's hash of a blob, computed here rather than asked for, because it is cheap and checkable. */
export function blobSha(text: string): string {
  const body = Buffer.from(text, 'utf8')
  return createHash('sha1')
    .update(`blob ${String(body.length)}\0`)
    .update(body)
    .digest('hex')
}

interface Commit {
  readonly sha: string
  readonly commit: { readonly committer: { readonly date: string } }
}

async function api(path: string, accept: string, auth: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: { accept, authorization: `Bearer ${auth}`, 'x-github-api-version': '2022-11-28' },
  })
}

/**
 * One language's list as its main branch has it, or why there is none.
 *
 * Through the API rather than raw.githubusercontent, for the reason the roll-up in
 * `blinkered-attestation` gives: raw serves from a CDN that holds a copy for several minutes and
 * ignores a cache-busting query string, so an import run straight after a push would borrow the
 * previous list and record the new commit against it. The two calls are the file and the commit
 * that last touched it, and they are made in that order so a push landing between them shows up
 * as a commit newer than the bytes rather than the other way round.
 */
export async function fetchList(tag: string, auth: string): Promise<Fetched | Absence> {
  const repo = `${ORG}/${repoFor(tag)}`
  const list = await api(
    `/repos/${repo}/contents/${WORDS}?ref=main`,
    'application/vnd.github.raw',
    auth,
  )
  if (list.status === 404) {
    // A repository that does not exist and one that exists without a list are both 404 here, and
    // they are different facts about the language. One more call separates them.
    const probe = await api(`/repos/${repo}`, 'application/vnd.github+json', auth)
    return probe.status === 404 ? 'no-repository' : 'no-list'
  }
  if (!list.ok) throw new Error(`${repo}: fetching ${WORDS} failed (${String(list.status)})`)
  const text = await list.text()

  const commits = await api(
    `/repos/${repo}/commits?path=${WORDS}&sha=main&per_page=1`,
    'application/vnd.github+json',
    auth,
  )
  if (!commits.ok) throw new Error(`${repo}: reading history failed (${String(commits.status)})`)
  const [last] = (await commits.json()) as Commit[]
  if (last === undefined) throw new Error(`${repo}: ${WORDS} exists with no commit touching it`)

  return {
    text,
    status: await fetchStatus(repo, auth),
    upstream: {
      repo,
      commit: last.sha,
      committed: last.commit.committer.date,
      blob: blobSha(text),
    },
  }
}

/**
 * The language's own verdict, or null if it has not published one.
 *
 * Only a 404 is an answer. Anything else -- a rate limit, a revoked token, a gateway having a bad
 * morning -- is a question this run cannot answer, and guessing "not blessed" would turn a
 * network fault into a mass withdrawal that the operator would then be asked to approve.
 */
async function fetchStatus(repo: string, auth: string): Promise<Status | null> {
  const answer = await api(
    `/repos/${repo}/contents/${STATUS}?ref=main`,
    'application/vnd.github.raw',
    auth,
  )
  if (answer.status === 404) return null
  if (!answer.ok) throw new Error(`${repo}: reading ${STATUS} failed (${String(answer.status)})`)

  const body = (await answer.json()) as Record<string, unknown>
  // A status file that does not say is not a status file. Same reasoning as the 404 above, in the
  // other direction: this is a malformed answer rather than a missing one, and it stops the run.
  //
  // A fourth state would arrive here as this error rather than as a guess, and that is the right
  // way round. The writer upstream normalises anything it does not recognise to `'pending'`,
  // which is correct for a writer with a blessing to protect; a reader doing the same would turn
  // the day the vocabulary grew into fifty-one silent withdrawals for the operator to approve.
  const said = body.ships
  if (typeof said !== 'boolean' && said !== 'pending') {
    throw new Error(
      `${repo}: ${STATUS} needs true, false or "pending" for "ships", and has ${JSON.stringify(said)}`,
    )
  }
  // `null` and absent mean the same thing here, and the writer upstream uses both: the template
  // carries a blessing forward with `?? null`, so a field nobody has filled in arrives as an
  // explicit null rather than as a missing key. Reading one and not the other would put the
  // string "null" in a LICENSE file.
  const text = (key: string): string | undefined =>
    typeof body[key] === 'string' && body[key] !== '' ? body[key] : undefined

  return {
    ships: said,
    ...(text('decided') !== undefined && { decided: text('decided') as string }),
    ...(text('why') !== undefined && { why: text('why') as string }),
    ...(text('license') !== undefined && { license: text('license') as string }),
  }
}
