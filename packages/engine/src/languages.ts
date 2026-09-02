import { byCodePoint, folder, segmentBy } from './alphabet.js'
import type { Alphabet } from './alphabet.js'

/**
 * The languages Blinkered knows how to deal a board in.
 *
 * The draw weights here are derived, not guessed: `pnpm dictionary weights` recalculates them
 * from each language's own shipped vocabulary, which is a far better basis than anyone's
 * intuition. Regenerate them whenever a word list changes. See docs/DICTIONARIES.md.
 *
 * What is not an estimate is each alphabet's letter inventory and its diacritic policy, and
 * those are the decisions that matter. Two kinds of language:
 *
 * - accents as decoration: French, Italian, Dutch, Malay, Indonesian, and the vowels of
 *   Spanish and Portuguese. The mark folds away, so EPEE and PERE share plain E tiles, and
 *   a US keyboard can play the language. This is what every word game in these languages
 *   does, Scrabble included.
 * - diacritics as letters: Croatian Č Ć Đ Š Ž, German Ä Ö Ü, Swedish and Finnish Å Ä Ö,
 *   Norwegian Æ Ø Å, Spanish Ñ, Portuguese Ç. Own letter, own tile, own weight, no folding,
 *   because collapsing them would merge words a speaker considers different.
 */

const QU = { Q: ['U'] } as const

export const ENGLISH: Alphabet = {
  id: 'en',
  endonym: 'English',
  // Derived from the word list by tools/derive rather than copied from Scrabble: Scrabble's
  // distribution follows letters in running text, and a board has to spell dictionary words,
  // where C, L, S and P are far commoner and D, W and F rather less so.
  weights: {
    A: 8,
    B: 2,
    C: 4,
    D: 4,
    E: 12,
    F: 1,
    G: 3,
    H: 2,
    I: 8,
    J: 1,
    K: 1,
    L: 5,
    M: 3,
    N: 7,
    O: 6,
    P: 3,
    Q: 1,
    R: 7,
    S: 8,
    T: 7,
    U: 3,
    V: 1,
    W: 1,
    X: 1,
    Y: 2,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['J', 'K', 'Q', 'V', 'W', 'X', 'Z'],
  requires: QU,
  fold: folder(),
  segment: byCodePoint,
}

export const FRENCH: Alphabet = {
  id: 'fr',
  endonym: 'Français',
  weights: {
    A: 8,
    B: 1,
    C: 4,
    D: 2,
    E: 17,
    F: 1,
    G: 2,
    H: 1,
    I: 8,
    J: 1,
    K: 1,
    L: 4,
    M: 3,
    N: 7,
    O: 6,
    P: 3,
    Q: 1,
    R: 9,
    S: 8,
    T: 7,
    U: 4,
    V: 2,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['J', 'K', 'Q', 'W', 'X', 'Y', 'Z'],
  requires: QU,
  // CINQ and COQ exist, so the rule costs French a word or two. Worth it: a lone Q is dead
  // in almost every other case.
  fold: folder({ expand: { Œ: 'OE', Æ: 'AE' } }),
  segment: byCodePoint,
}

export const SPANISH: Alphabet = {
  id: 'es',
  endonym: 'Español',
  weights: {
    A: 13,
    B: 2,
    C: 5,
    D: 4,
    E: 12,
    F: 1,
    G: 2,
    H: 1,
    I: 8,
    J: 1,
    K: 1,
    L: 4,
    M: 3,
    N: 7,
    Ñ: 1,
    O: 9,
    P: 3,
    Q: 1,
    R: 9,
    S: 7,
    T: 5,
    U: 3,
    V: 1,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['J', 'K', 'Ñ', 'Q', 'W', 'X', 'Z'],
  requires: QU,
  // CH and LL stopped being letters of the alphabet in the 1994 reform, so they are two
  // tiles each. Ñ never was: it stays.
  fold: folder({ keep: ['Ñ'] }),
  segment: byCodePoint,
}

export const ITALIAN: Alphabet = {
  id: 'it',
  endonym: 'Italiano',
  // Twenty-one letters. J, K, W, X and Y appear only in loanwords and are not dealt.
  weights: {
    A: 12,
    B: 1,
    C: 5,
    D: 3,
    E: 11,
    F: 1,
    G: 2,
    H: 1,
    I: 11,
    L: 4,
    M: 3,
    N: 7,
    O: 10,
    P: 3,
    Q: 1,
    R: 8,
    S: 6,
    T: 8,
    U: 2,
    V: 2,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['H', 'Q', 'Z'],
  requires: QU,
  fold: folder(),
  segment: byCodePoint,
}

export const GERMAN: Alphabet = {
  id: 'de',
  endonym: 'Deutsch',
  weights: {
    A: 6,
    Ä: 1,
    B: 2,
    C: 3,
    D: 2,
    E: 16,
    F: 2,
    G: 4,
    H: 5,
    I: 6,
    J: 1,
    K: 2,
    L: 5,
    M: 2,
    N: 9,
    O: 3,
    Ö: 1,
    P: 1,
    Q: 1,
    R: 8,
    S: 6,
    T: 7,
    U: 3,
    Ü: 1,
    V: 1,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U', 'Ä', 'Ö', 'Ü'],
  rareLetters: ['J', 'Q', 'V', 'X', 'Y', 'Z'],
  requires: QU,
  // Eszett needs no rule: upper-casing turns it into SS on its own, which is how German
  // word games spell it. The umlauts are letters and stay.
  fold: folder({ keep: ['Ä', 'Ö', 'Ü'] }),
  segment: byCodePoint,
}

export const DUTCH: Alphabet = {
  id: 'nl',
  endonym: 'Nederlands',
  weights: {
    A: 7,
    B: 2,
    C: 2,
    D: 4,
    E: 17,
    F: 1,
    G: 4,
    H: 2,
    I: 6,
    J: 1,
    K: 3,
    L: 5,
    M: 2,
    N: 8,
    O: 6,
    P: 2,
    Q: 1,
    R: 7,
    S: 5,
    T: 6,
    U: 2,
    V: 2,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['C', 'J', 'Q', 'X', 'Y', 'Z'],
  requires: QU,
  // IJ is a single letter to a typographer and two tiles to a Dutch word game. Two tiles.
  fold: folder(),
  segment: byCodePoint,
}

export const PORTUGUESE: Alphabet = {
  id: 'pt',
  endonym: 'Português',
  weights: {
    A: 14,
    B: 1,
    C: 4,
    Ç: 1,
    D: 4,
    E: 11,
    F: 1,
    G: 2,
    H: 1,
    I: 8,
    J: 1,
    K: 1,
    L: 3,
    M: 4,
    N: 5,
    O: 9,
    P: 3,
    Q: 1,
    R: 9,
    S: 8,
    T: 5,
    U: 3,
    V: 2,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['J', 'K', 'Q', 'W', 'X', 'Y', 'Z'],
  requires: QU,
  fold: folder({ keep: ['Ç'] }),
  segment: byCodePoint,
}

/**
 * Brazilian Portuguese. Same alphabet and the same diacritic policy; the two differ in
 * vocabulary and in a few spellings, which is a fact about the word list rather than about
 * the letters. Kept as its own language so each gets its own dictionary and its own flag.
 */
export const PORTUGUESE_BR: Alphabet = {
  ...PORTUGUESE,
  id: 'pt-BR',
  endonym: 'Português (Brasil)',
}

/** Croatian letters, longest first so LJ beats L and DŽ beats D at the same position. */
const CROATIAN_LETTERS = [
  'DŽ',
  'LJ',
  'NJ',
  'A',
  'B',
  'C',
  'Č',
  'Ć',
  'D',
  'Đ',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'R',
  'S',
  'Š',
  'T',
  'U',
  'V',
  'Z',
  'Ž',
]

export const CROATIAN: Alphabet = {
  id: 'hr',
  endonym: 'Hrvatski',
  // Thirty letters, three of them digraphs, and no Q, W, X or Y at all. This is the
  // alphabet that proves a tile holds a string rather than a character.
  weights: {
    A: 12,
    B: 2,
    C: 1,
    Ć: 1,
    Č: 1,
    D: 3,
    Đ: 1,
    DŽ: 1,
    E: 8,
    F: 1,
    G: 1,
    H: 1,
    I: 10,
    J: 3,
    K: 3,
    L: 3,
    LJ: 1,
    M: 3,
    N: 5,
    NJ: 1,
    O: 9,
    P: 4,
    R: 6,
    S: 4,
    Š: 1,
    T: 6,
    U: 5,
    V: 4,
    Z: 2,
    Ž: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['DŽ', 'Đ', 'F', 'Ć', 'Ž', 'LJ', 'NJ'],
  requires: {},
  fold: folder({ keep: ['Č', 'Ć', 'Đ', 'Š', 'Ž'] }),
  segment: segmentBy(CROATIAN_LETTERS),
}

/**
 * Malay and Indonesian share one alphabet and differ in vocabulary: Indonesian borrowed from
 * Dutch, Malaysian from English, and the spelling was unified in 1972. Two word lists, one
 * letter inventory, and no diacritics anywhere, which makes them the least friction of the
 * set.
 */
const MALAY_WEIGHTS = {
  A: 17,
  B: 3,
  C: 1,
  D: 2,
  E: 8,
  F: 1,
  G: 4,
  H: 2,
  I: 7,
  J: 1,
  K: 5,
  L: 4,
  M: 4,
  N: 9,
  O: 4,
  P: 4,
  Q: 1,
  R: 6,
  S: 5,
  T: 5,
  U: 5,
  V: 1,
  W: 1,
  X: 1,
  Y: 1,
  Z: 1,
}

/**
 * Indonesian's own table. The two languages share an alphabet and a 1972 spelling reform, and
 * for a while shared these numbers on the assumption that the distributions matched. With a
 * word list for each, they measurably do not: eleven letters differ, and Indonesian's Dutch
 * borrowings against Malaysian's English ones show up as more M, N, K and U and less A and R.
 */
const INDONESIAN_WEIGHTS = {
  A: 17,
  B: 3,
  C: 1,
  D: 2,
  E: 9,
  F: 1,
  G: 4,
  H: 2,
  I: 7,
  J: 1,
  K: 6,
  L: 3,
  M: 6,
  N: 11,
  O: 2,
  P: 3,
  Q: 1,
  R: 5,
  S: 4,
  T: 4,
  U: 6,
  V: 1,
  W: 1,
  X: 1,
  Y: 2,
  Z: 1,
}

export const MALAY: Alphabet = {
  id: 'ms',
  endonym: 'Bahasa Melayu',
  weights: MALAY_WEIGHTS,
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['Q', 'V', 'X', 'Z'],
  requires: QU,
  fold: folder(),
  segment: byCodePoint,
}

export const INDONESIAN: Alphabet = {
  ...MALAY,
  id: 'id',
  endonym: 'Bahasa Indonesia',
  weights: INDONESIAN_WEIGHTS,
}

export const RUSSIAN: Alphabet = {
  id: 'ru',
  endonym: 'Русский',
  // Thirty-two tiles: Ё is folded onto Е, as Russian word games do.
  weights: {
    А: 9,
    Б: 2,
    В: 4,
    Г: 1,
    Д: 3,
    Е: 8,
    Ж: 1,
    З: 2,
    И: 8,
    Й: 1,
    К: 3,
    Л: 5,
    М: 3,
    Н: 5,
    О: 9,
    П: 4,
    Р: 5,
    С: 6,
    Т: 7,
    У: 3,
    Ф: 1,
    Х: 1,
    Ц: 1,
    Ч: 1,
    Ш: 1,
    Щ: 1,
    Ъ: 1,
    Ы: 2,
    Ь: 3,
    Э: 1,
    Ю: 1,
    Я: 2,
  },
  vowels: ['А', 'Е', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я'],
  rareLetters: ['Ъ', 'Щ', 'Э', 'Ц', 'Ф', 'Ж', 'Х'],
  requires: {},
  fold: folder({ expand: { Ё: 'Е' } }),
  segment: byCodePoint,
}

export const SWEDISH: Alphabet = {
  id: 'sv',
  endonym: 'Svenska',
  weights: {
    A: 10,
    Å: 1,
    Ä: 2,
    B: 2,
    C: 1,
    D: 4,
    E: 9,
    F: 2,
    G: 4,
    H: 1,
    I: 5,
    J: 1,
    K: 4,
    L: 5,
    M: 3,
    N: 8,
    O: 3,
    Ö: 2,
    P: 2,
    Q: 1,
    R: 10,
    S: 7,
    T: 8,
    U: 2,
    V: 2,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U', 'Y', 'Å', 'Ä', 'Ö'],
  rareLetters: ['C', 'Q', 'W', 'X', 'Z'],
  requires: QU,
  fold: folder({ keep: ['Å', 'Ä', 'Ö'] }),
  segment: byCodePoint,
}

export const NORWEGIAN: Alphabet = {
  id: 'no',
  endonym: 'Norsk',
  weights: {
    A: 7,
    Å: 1,
    Æ: 1,
    B: 2,
    C: 1,
    D: 3,
    E: 14,
    F: 2,
    G: 4,
    H: 2,
    I: 6,
    J: 1,
    K: 4,
    L: 6,
    M: 3,
    N: 7,
    O: 5,
    Ø: 1,
    P: 2,
    Q: 1,
    R: 9,
    S: 7,
    T: 7,
    U: 2,
    V: 2,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U', 'Y', 'Æ', 'Ø', 'Å'],
  rareLetters: ['C', 'Q', 'W', 'X', 'Z'],
  requires: QU,
  fold: folder({ keep: ['Æ', 'Ø', 'Å'] }),
  segment: byCodePoint,
}

export const FINNISH: Alphabet = {
  id: 'fi',
  endonym: 'Suomi',
  // B, C, F, Q, W, X, Z and Å are all effectively foreign to Finnish, hence weight one and
  // no doubling. Ä and Ö are ordinary letters and common.
  weights: {
    A: 12,
    Å: 1,
    Ä: 4,
    B: 1,
    C: 1,
    D: 1,
    E: 8,
    F: 1,
    G: 1,
    H: 2,
    I: 10,
    J: 1,
    K: 5,
    L: 6,
    M: 3,
    N: 7,
    O: 5,
    Ö: 1,
    P: 3,
    Q: 1,
    R: 3,
    S: 7,
    T: 11,
    U: 6,
    V: 2,
    W: 1,
    X: 1,
    Y: 2,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U', 'Y', 'Ä', 'Ö', 'Å'],
  rareLetters: ['B', 'C', 'F', 'Q', 'W', 'X', 'Z', 'Å'],
  // Finnish has no native Q, so there is no lone-Q problem to rule out.
  requires: {},
  fold: folder({ keep: ['Å', 'Ä', 'Ö'] }),
  segment: byCodePoint,
}

export const GREEK: Alphabet = {
  id: 'el',
  endonym: 'Ελληνικά',
  // Twenty-four letters. The tonos is decoration and folds away, exactly as Greek word
  // games treat it, and final sigma upper-cases onto Σ without needing a rule.
  weights: {
    Α: 12,
    Β: 1,
    Γ: 2,
    Δ: 2,
    Ε: 10,
    Ζ: 1,
    Η: 4,
    Θ: 1,
    Ι: 9,
    Κ: 4,
    Λ: 3,
    Μ: 4,
    Ν: 5,
    Ξ: 1,
    Ο: 8,
    Π: 4,
    Ρ: 5,
    Σ: 8,
    Τ: 6,
    Υ: 4,
    Φ: 1,
    Χ: 1,
    Ψ: 1,
    Ω: 2,
  },
  vowels: ['Α', 'Ε', 'Η', 'Ι', 'Ο', 'Υ', 'Ω'],
  rareLetters: ['Β', 'Ζ', 'Ξ', 'Ψ'],
  requires: {},
  fold: folder(),
  segment: byCodePoint,
}

export const AFRIKAANS: Alphabet = {
  id: 'af',
  endonym: 'Afrikaans',
  // Twenty-six letters and nothing exotic. Afrikaans writes several diacritics — ê ë ô û î ï
  // and the acute on é — and every one of them is decoration: SÊ and SE are the same letters
  // wearing a different hat, so they fold together the way French accents do.
  weights: {
    A: 7,
    B: 2,
    C: 1,
    D: 4,
    E: 17,
    F: 1,
    G: 5,
    H: 1,
    I: 7,
    J: 1,
    K: 5,
    L: 5,
    M: 2,
    N: 6,
    O: 7,
    P: 2,
    Q: 1,
    R: 8,
    S: 7,
    T: 5,
    U: 3,
    V: 2,
    W: 2,
    X: 1,
    Y: 1,
    Z: 1,
  },
  // Y is a vowel here rather than the half-vowel it is in English: it spells the diphthong in
  // BYT and WYN and never stands in for a consonant, so the draw's vowel floor should count it.
  vowels: ['A', 'E', 'I', 'O', 'U', 'Y'],
  rareLetters: ['C', 'F', 'H', 'J', 'Q', 'X', 'Z'],
  requires: QU,
  fold: folder(),
  segment: byCodePoint,
}

export const TURKISH: Alphabet = {
  id: 'tr',
  endonym: 'Türkçe',
  // Twenty-nine letters: no Q, W or X, and I and İ are two of them rather than one letter
  // twice. Ç Ğ Ö Ş Ü are letters in their own right and keep their marks; the circumflex in
  // KÂĞIT is decoration and does not.
  weights: {
    A: 12,
    B: 2,
    C: 1,
    Ç: 1,
    D: 4,
    E: 8,
    F: 1,
    G: 1,
    Ğ: 1,
    H: 1,
    I: 6,
    İ: 8,
    J: 1,
    K: 5,
    L: 6,
    M: 5,
    N: 7,
    O: 3,
    Ö: 1,
    P: 1,
    R: 7,
    S: 3,
    Ş: 2,
    T: 4,
    U: 3,
    Ü: 2,
    V: 1,
    Y: 4,
    Z: 2,
  },
  vowels: ['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü'],
  rareLetters: ['C', 'Ç', 'F', 'G', 'Ğ', 'H', 'J', 'P', 'V'],
  // No native Q at all, so there is no lone-Q problem to rule out.
  requires: {},
  // The one language whose case mapping the default gets wrong. `toUpperCase` sends the
  // dotless ı and the dotted i to the same plain I, which would merge ILIK (lukewarm) with
  // İLİK (marrow); under `tr` each keeps its own letter. See `folder`.
  fold: folder({ keep: ['Ç', 'Ğ', 'İ', 'Ö', 'Ş', 'Ü'], locale: 'tr' }),
  segment: byCodePoint,
}

export const TAGALOG: Alphabet = {
  id: 'tl',
  endonym: 'Tagalog',
  // Twenty-six letters, and two deliberate omissions from the twenty-eight the modern
  // Filipino alphabet lists.
  //
  // Ñ is Spanish and stayed Spanish: Tagalog spells that sound NY, as in PINYA and BANYO, so
  // the tilde survives only in borrowed names and folds onto N.
  //
  // NG is the harder call, because it genuinely is a letter — it has its own place in the
  // abakada and its own name. It is two tiles here anyway, because a multi-character tile can
  // only be taken with the mouse: nothing turns two keystrokes into one tile, so Croatian DŽ
  // is click-only and nobody minds, DŽ being a curiosity. NG is in a large share of Tagalog
  // words, and a board whose commonest letter cannot be typed is a worse game than one whose
  // alphabet is a letter short.
  weights: {
    A: 22,
    B: 4,
    C: 1,
    D: 2,
    E: 3,
    F: 1,
    G: 5,
    H: 2,
    I: 8,
    J: 1,
    K: 4,
    L: 5,
    M: 4,
    N: 9,
    O: 5,
    P: 4,
    Q: 1,
    R: 3,
    S: 5,
    T: 5,
    U: 4,
    V: 1,
    W: 1,
    X: 1,
    Y: 3,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['C', 'F', 'J', 'Q', 'V', 'W', 'X', 'Z'],
  requires: QU,
  fold: folder(),
  segment: byCodePoint,
}

const ALPHABETS: Readonly<Record<string, Alphabet>> = Object.fromEntries(
  [
    ENGLISH,
    FRENCH,
    SPANISH,
    ITALIAN,
    GERMAN,
    DUTCH,
    PORTUGUESE,
    PORTUGUESE_BR,
    CROATIAN,
    MALAY,
    INDONESIAN,
    RUSSIAN,
    SWEDISH,
    NORWEGIAN,
    FINNISH,
    GREEK,
    AFRIKAANS,
    TURKISH,
    TAGALOG,
  ].map((alphabet) => [alphabet.id, alphabet]),
)

export const DEFAULT_LANGUAGE = ENGLISH.id

/**
 * Every language an alphabet exists for. Not the same as every language that can be played:
 * that also needs a word list, and the web app offers only the languages whose list is
 * actually present.
 */
export const ALPHABET_IDS: readonly string[] = Object.keys(ALPHABETS)

export function alphabetFor(id: string): Alphabet {
  const alphabet = ALPHABETS[id]
  if (!alphabet) throw new RangeError(`no alphabet for language ${id}`)
  return alphabet
}
