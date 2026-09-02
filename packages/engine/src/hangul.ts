/**
 * Hangul, taken apart into the letters it is built from and put back together again.
 *
 * Korean looks syllabic and is not: 한 is ㅎ + ㅏ + ㄴ, and Unicode knows it, because NFD
 * decomposes every syllable block into exactly the letters that made it. So Korean is an
 * alphabet game like every other language here, and the only work is choosing which code point
 * stands for a letter.
 *
 * **The tiles are compatibility jamo**, the ones on a Korean keyboard. Unicode has three code
 * points for ㄱ — one for the initial position, one for the final, and one for the letter
 * itself — and a player who sees two of them on a board sees one letter twice. Folding all
 * three onto the letter is what makes a board holding ㄱ able to spell a word that ends in one.
 *
 * **The tiles are exactly the keys of a Korean keyboard**, which is forty of them. Unicode gives
 * a compound final like ㄵ or ㅄ its own code point, and tiling those would have been easier, but
 * it would also have put eleven letters on the board that between them reach 0.7% of the
 * vocabulary — three of them appear in no word at all — and it would have made the alphabet
 * recite as ㄱ … ㄿ. They are two tiles each, the way they are two keystrokes each.
 *
 * The compound *vowels* stay whole: ㅘ ㅙ ㅢ are typed as two keys too, but they are a fifth of
 * all Korean vowels by use rather than a rounding error, and nothing about them is ambiguous.
 *
 * **Which leaves one thing to get right, and one rule gets it.** A consonant closes the syllable
 * before it unless a vowel follows and claims it, and where two consonants could close it
 * together, they do if what comes next still starts a syllable. That is the whole difference
 * between 없다 and 업소, and between 읽다 and 일가.
 */

/**
 * The three tables the syllable algorithm is defined by, written as the letters rather than as
 * the code points, so they can be read.
 *
 * Position in each is the index Unicode uses: initial `i`, medial `m` and final `f` compose to
 * `0xAC00 + (i * 21 + m) * 28 + f`, and every Hangul syllable is that arithmetic and nothing
 * else. The blank at the head of the finals is the syllable with no final consonant.
 */
const INITIALS = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ']
const MEDIALS = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ']
const FINALS = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ']

/** Where the conjoining jamo blocks start, which is what NFD produces. */
const FIRST_INITIAL = 0x1100
const FIRST_MEDIAL = 0x1161
/** Finals are indexed from one, so the block starts one before the first real one. */
const FINAL_BASE = 0x11a7

const FIRST_SYLLABLE = 0xac00

/**
 * The compound finals, as the two letters they are typed and tiled as.
 *
 * Position in `FINALS` rather than the letter, because that is what the decomposition hands over
 * and what the composition needs back.
 */
const COMPOUND_FINALS: Readonly<Record<string, string>> = {
  ㄳ: 'ㄱㅅ',
  ㄵ: 'ㄴㅈ',
  ㄶ: 'ㄴㅎ',
  ㄺ: 'ㄹㄱ',
  ㄻ: 'ㄹㅁ',
  ㄼ: 'ㄹㅂ',
  ㄽ: 'ㄹㅅ',
  ㄾ: 'ㄹㅌ',
  ㄿ: 'ㄹㅍ',
  ㅀ: 'ㄹㅎ',
  ㅄ: 'ㅂㅅ',
}

/** The two letters of a compound final, back to the one code point that closes a syllable. */
const COMPOUND_AT = new Map(
  Object.entries(COMPOUND_FINALS).map(([final, parts]) => [parts, final] as const),
)

/** Every letter a Korean board can deal, which is every key of a Korean keyboard. */
export const JAMO: readonly string[] = [
  ...new Set(
    [...INITIALS, ...MEDIALS, ...FINALS.slice(1)].filter((letter) => !(letter in COMPOUND_FINALS)),
  ),
]

const IS_MEDIAL = new Set(MEDIALS)
const INITIAL_AT = new Map(INITIALS.map((letter, at) => [letter, at] as const))
const MEDIAL_AT = new Map(MEDIALS.map((letter, at) => [letter, at] as const))
const FINAL_AT = new Map(FINALS.map((letter, at) => [letter, at] as const).slice(1))

/**
 * A conjoining jamo as the letter it is, or the character unchanged.
 *
 * Unchanged is the right answer for anything that is not Korean: a Latin letter in a loanword
 * survives the fold and is then dropped by the alphabet filter, which is what should happen to
 * it. Rewriting it here would be the alphabet quietly inventing a tile.
 */
function letterOf(codePoint: number): string {
  if (codePoint >= FIRST_INITIAL && codePoint < FIRST_INITIAL + INITIALS.length) {
    return INITIALS[codePoint - FIRST_INITIAL] as string
  }
  if (codePoint >= FIRST_MEDIAL && codePoint < FIRST_MEDIAL + MEDIALS.length) {
    return MEDIALS[codePoint - FIRST_MEDIAL] as string
  }
  if (codePoint > FINAL_BASE && codePoint < FINAL_BASE + FINALS.length) {
    return FINALS[codePoint - FINAL_BASE] as string
  }
  return String.fromCodePoint(codePoint)
}

/** Every syllable taken apart into the letters it is typed with, one tile each. */
export function foldHangul(text: string): string {
  return [...text.normalize('NFD')]
    .map((character) => letterOf(character.codePointAt(0) as number))
    .map((letter) => COMPOUND_FINALS[letter] ?? letter)
    .join('')
}

/**
 * Whether a consonant at `at` closes the syllable that started before it, rather than opening
 * the next one.
 *
 * The whole rule: a consonant is a final unless a vowel follows it, because a vowel needs a
 * consonant in front of it and would take this one. ㄱㅜㄱㅓ is 구거 and ㄱㅜㄱㅇㅓ is 국어, and
 * that is the only thing telling them apart.
 */
function closes(jamo: readonly string[], at: number): boolean {
  if (!FINAL_AT.has(jamo[at] as string)) return false
  const next = jamo[at + 1]
  return next === undefined || !IS_MEDIAL.has(next)
}

/**
 * The final that closes a syllable starting at `at`, and how many letters it took.
 *
 * Two letters where they make a compound final and the next letter still starts a syllable,
 * one where they do not, none where a vowel is waiting to claim the consonant. 없다 is
 * ㅇㅓㅂㅅㄷㅏ and 업소 is ㅇㅓㅂㅅㅗ; the ㅗ is the entire difference.
 */
function finalAt(jamo: readonly string[], at: number): { index: number; taken: number } {
  const pair = COMPOUND_AT.get(`${jamo[at] ?? ''}${jamo[at + 1] ?? ''}`)
  if (pair !== undefined && closes(jamo, at + 1)) {
    return { index: FINAL_AT.get(pair) as number, taken: 2 }
  }
  if (closes(jamo, at)) return { index: FINAL_AT.get(jamo[at] as string) as number, taken: 1 }
  return { index: 0, taken: 0 }
}

/**
 * Letters put back into syllables, which is how Korean is written.
 *
 * The board deals letters and a Korean reader does not read letters: ㅎㅏㄴㄱㅡㄹ is the right
 * set of tiles and 한글 is the word. Anything that will not compose is passed through, so a
 * half-built word is shown as far as it goes rather than being refused.
 */
export function composeHangul(text: string): string {
  const jamo = [...text]
  let out = ''
  let at = 0
  while (at < jamo.length) {
    // In range for the whole loop, so it is a letter rather than a maybe-letter, and saying so
    // keeps the pass-through below from looking like it has a case nothing can reach.
    const letter = jamo[at] as string
    const initial = INITIAL_AT.get(letter)
    const medial = MEDIAL_AT.get(jamo[at + 1] ?? '')
    if (initial === undefined || medial === undefined) {
      out += letter
      at += 1
      continue
    }
    const final = finalAt(jamo, at + 2)
    out += String.fromCodePoint(
      FIRST_SYLLABLE + (initial * MEDIALS.length + medial) * FINALS.length + final.index,
    )
    at += 2 + final.taken
  }
  return out
}
