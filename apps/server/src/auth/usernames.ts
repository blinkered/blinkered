import { randomInt } from 'node:crypto'

/**
 * What the world calls somebody, from the moment the account exists.
 *
 * `users.username` is `NOT NULL` and stays that way. A row in `users` is a person with a name,
 * which is what everything downstream assumes — `games.userId`, `reports`, the leaderboard join
 * — and the alternative designs both cost more than they look. A nullable username puts a hole
 * in the one publicly visible column and makes every later reader ask whether this user is real
 * yet. A signed "verified, no profile" token keeps the schema clean and introduces a bearer
 * credential whose whole purpose is to create an account, which is a thing that then has to be
 * short-lived, single-use, and bound to its identity or it becomes a way to attach somebody
 * else's verified email to a new account.
 *
 * So a new account gets a generated name and can change it. Every path that makes a user —
 * a code, Apple, Google, an import, a test fixture — produces a complete row, and the cases
 * nobody has thought of yet get a working account rather than a special case.
 */

/**
 * Words a generated name is built from.
 *
 * Hand-picked, and deliberately **not** drawn from the game's own word lists. Those contain every
 * word in the language, which is exactly the problem: a random pair out of 174,456 English words
 * produces something unfortunate often enough to matter, and the game ships 51 of them. This list
 * is short, boring, and read by a person before it went in — which is the only property that
 * makes it safe.
 */
const ADJECTIVES = [
  'amber',
  'brave',
  'bright',
  'calm',
  'clever',
  'copper',
  'crimson',
  'curious',
  'eager',
  'gentle',
  'golden',
  'happy',
  'hidden',
  'jolly',
  'keen',
  'lively',
  'lucky',
  'merry',
  'noble',
  'polished',
  'quick',
  'quiet',
  'rapid',
  'silver',
  'smooth',
  'snowy',
  'solid',
  'spry',
  'sunny',
  'swift',
  'tidy',
  'witty',
] as const

const NOUNS = [
  'anchor',
  'badger',
  'beacon',
  'brook',
  'cedar',
  'comet',
  'compass',
  'ember',
  'falcon',
  'harbor',
  'heron',
  'kestrel',
  'lantern',
  'ledger',
  'marble',
  'meadow',
  'otter',
  'pebble',
  'quill',
  'ridge',
  'river',
  'rudder',
  'sable',
  'sparrow',
  'spruce',
  'thistle',
  'tinder',
  'trout',
  'valley',
  'willow',
  'wren',
  'yarrow',
] as const

/** The tail that makes a name unique without a database round trip most of the time. */
const SUFFIX_DIGITS = 4

/**
 * The longest name the generator can produce.
 *
 * Asserted against `USERNAME_MAX` by a test rather than left to whoever adds a word. Not because
 * the limit is tight — it is not, deliberately — but because the two have to stay coherent: the
 * first version squeezed the word list to fit a UI-shaped limit of twenty, which is the wrong
 * direction. A generated name must be one the server would accept; what a *form* will accept is
 * the form's business.
 */
export const LONGEST_GENERATED =
  Math.max(...ADJECTIVES.map((word) => word.length)) +
  Math.max(...NOUNS.map((word) => word.length)) +
  SUFFIX_DIGITS +
  2

/**
 * The shape a generated name always has, and which a person is never allowed to type.
 *
 * Reserving it closes a squat: without this, somebody can register `swift-otter-4821` today and
 * wait for the generator to want it, or worse, pick the name a specific person's account is
 * about to be given. A pattern nobody can choose cannot be lain in wait for.
 */
const GENERATED = new RegExp(
  `^(${ADJECTIVES.join('|')})-(${NOUNS.join('|')})-\\d{${String(SUFFIX_DIGITS)}}$`,
)

/** Whether a name is one of ours rather than one somebody chose. */
export function isGeneratedUsername(name: string): boolean {
  return GENERATED.test(normalizeUsername(name))
}

/**
 * A name for a brand-new account.
 *
 * 32 × 32 × 10,000 is ten million, so a collision is rare rather than impossible, and the caller
 * retries against the unique index rather than trusting the arithmetic. Not derived from
 * `users.id`: that would tie the public name to the primary key, so anyone who saw one would know
 * the other, and it would publish the sign-up order the day the id stopped being random.
 */
export function generateUsername(): string {
  const adjective = ADJECTIVES[randomInt(0, ADJECTIVES.length)] as string
  const noun = NOUNS[randomInt(0, NOUNS.length)] as string
  const suffix = String(randomInt(0, 10 ** SUFFIX_DIGITS)).padStart(SUFFIX_DIGITS, '0')
  return `${adjective}-${noun}-${suffix}`
}

/**
 * The form uniqueness is actually enforced on.
 *
 * NFKC first, so a fullwidth `ｎｉｃｋ` and a plain `nick` are the same account rather than two —
 * the schema comment calls that impersonation with extra steps, and it is. Then lower case,
 * because a leaderboard where `Nick` and `nick` are different people is a leaderboard nobody
 * trusts.
 */
export function normalizeUsername(name: string): string {
  return name.normalize('NFKC').toLowerCase()
}

export const USERNAME_MIN = 3

/**
 * The cap the server enforces, which is deliberately looser than the one a person will see.
 *
 * The tighter limit is a UI concern — a name that fits a leaderboard row and a profile header —
 * and it belongs in the form, where it can be a live character count rather than a rejection
 * after the fact. Down here the job is narrower: stop a name that is an abuse of a text column,
 * and stop nothing else. Making the two the same number is how a generated name ends up
 * refused by the rules that generated it, which is exactly what happened.
 */
export const USERNAME_MAX = 32

export type UsernameProblem =
  'too-short' | 'too-long' | 'bad-characters' | 'bad-edges' | 'mixed-scripts' | 'reserved'

/**
 * Letters, digits, and separators between them. Letters from any script, because the game is
 * played in fifty-one languages and a Greek player wanting to be Ελληνικά is not an edge case.
 */
const ALLOWED = /^[\p{L}\p{N}][\p{L}\p{N}_-]*[\p{L}\p{N}]$/u

/**
 * Scripts that may not be mixed.
 *
 * Mixing them is how `pаypal` gets written with a Cyrillic а. Latin, Greek and Cyrillic are the
 * confusable trio that matters here, since they share letterforms; everything else is checked the
 * same way for consistency rather than because anybody is imitating Georgian in Armenian.
 */
const SCRIPTS = [
  /\p{Script=Latin}/u,
  /\p{Script=Greek}/u,
  /\p{Script=Cyrillic}/u,
  /\p{Script=Hebrew}/u,
  /\p{Script=Arabic}/u,
  /\p{Script=Armenian}/u,
  /\p{Script=Georgian}/u,
  /\p{Script=Hangul}/u,
  /\p{Script=Hiragana}/u,
  /\p{Script=Katakana}/u,
  /\p{Script=Han}/u,
] as const

/**
 * Why a chosen name cannot be used, or `null` when it can.
 *
 * Returns the first problem rather than all of them, because unlike the environment check in
 * `config.ts` the audience here is somebody typing into a box who will see the next problem the
 * moment they fix this one.
 */
export function checkUsername(name: string): UsernameProblem | null {
  const normalized = normalizeUsername(name)
  const length = [...normalized].length
  if (length < USERNAME_MIN) return 'too-short'
  if (length > USERNAME_MAX) return 'too-long'
  if (!ALLOWED.test(normalized)) {
    // A separator on either end is worth its own answer: it is the likeliest near-miss, and
    // "that character is not allowed" is a confusing thing to read about a hyphen you were
    // allowed to use in the middle.
    return /^[_-]|[_-]$/.test(normalized) ? 'bad-edges' : 'bad-characters'
  }
  const scripts = SCRIPTS.filter((script) => script.test(normalized))
  if (scripts.length > 1) return 'mixed-scripts'
  if (isGeneratedUsername(normalized)) return 'reserved'
  return null
}
