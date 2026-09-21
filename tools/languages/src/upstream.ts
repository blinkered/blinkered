import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

/** The organization every dictionary repository lives in. */
export const ORG = 'blinkered'
export const PREFIX = 'blinkered-dictionary-'
/** The one file this repository borrows. Everything else stays where it was built. */
export const WORDS = 'words.txt'

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

export interface Fetched {
  readonly upstream: Upstream
  readonly text: string
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
    upstream: {
      repo,
      commit: last.sha,
      committed: last.commit.committer.date,
      blob: blobSha(text),
    },
  }
}
