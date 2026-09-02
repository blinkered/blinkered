import { byCodePoint, folder, segmentBy } from './alphabet.js'
import { composeHangul, foldHangul } from './hangul.js'
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
  weights: INDONESIAN_WEIGHTS,
}

export const RUSSIAN: Alphabet = {
  id: 'ru',
  endonym: 'Русский',
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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
  direction: 'ltr',
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

export const SWAHILI: Alphabet = {
  id: 'sw',
  endonym: 'Kiswahili',
  direction: 'ltr',
  // Twenty-four letters: no Q and no X, which Swahili has never had. The digraphs CH, DH, GH,
  // KH, NY, SH and TH are two tiles each, for the reason Tagalog NG is: a multi-character tile
  // can only be taken with the mouse, and these are far too common for that.
  weights: {
    A: 19,
    B: 2,
    C: 1,
    D: 2,
    E: 5,
    F: 1,
    G: 2,
    H: 4,
    I: 14,
    J: 1,
    K: 6,
    L: 4,
    M: 5,
    N: 6,
    O: 5,
    P: 1,
    R: 2,
    S: 3,
    T: 3,
    U: 8,
    V: 1,
    W: 3,
    Y: 1,
    Z: 2,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['C', 'F', 'J', 'P', 'V', 'Y'],
  // No Q at all, so there is no lone-Q problem to rule out.
  requires: {},
  // The apostrophe in NG' is dropped rather than tiled. It marks a real distinction — NG'OMBE
  // is a cow — but a tile nobody can type is worse than a spelling nobody can argue with, and
  // Swahili has no pair of words that the two spellings would merge.
  fold: folder({ expand: { "'": '', '’': '' } }),
  segment: byCodePoint,
}

export const LATIN: Alphabet = {
  id: 'la',
  endonym: 'Latina',
  direction: 'ltr',
  // Twenty-four letters. No W, which Latin never had, and no J, because the dictionary spells
  // consonantal i as I: IUSTITIA, not JUSTITIA. U and V *are* kept apart, which is the other
  // half of the same convention and the one every modern Latin text follows.
  weights: {
    A: 10,
    B: 1,
    C: 5,
    D: 2,
    E: 8,
    F: 1,
    G: 2,
    H: 1,
    I: 11,
    K: 1,
    L: 5,
    M: 5,
    N: 5,
    O: 7,
    P: 3,
    Q: 1,
    R: 7,
    S: 9,
    T: 7,
    U: 9,
    V: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U', 'Y'],
  rareLetters: ['B', 'F', 'H', 'K', 'Q', 'V', 'X', 'Z'],
  // Q is followed by U in every Latin word there is, so a lone Q is a dead tile.
  requires: QU,
  // Macrons are a teaching aid rather than spelling: no Roman wrote them and no dictionary
  // headword carries them, so AMĀRE and AMARE are one word.
  fold: folder(),
  segment: byCodePoint,
}

/** The five letters Hebrew writes differently at the end of a word, and their ordinary forms. */
const HEBREW_FINALS: Readonly<Record<string, string>> = {
  ך: 'כ',
  ם: 'מ',
  ן: 'נ',
  ף: 'פ',
  ץ: 'צ',
}

const HEBREW_ORDINARY: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(HEBREW_FINALS).map(([final, ordinary]) => [ordinary, final]),
)

export const HEBREW: Alphabet = {
  id: 'he',
  endonym: 'עברית',
  direction: 'rtl',
  // Twenty-two letters and no case at all, which is why its word list ignores case rather than
  // using it as evidence: the proper-noun filter every Latin language relies on has nothing to
  // look at here.
  weights: {
    א: 4,
    ב: 4,
    ג: 2,
    ד: 3,
    ה: 7,
    ו: 11,
    ז: 1,
    ח: 3,
    ט: 3,
    י: 12,
    כ: 2,
    ל: 5,
    מ: 7,
    נ: 6,
    ס: 3,
    ע: 2,
    פ: 4,
    צ: 2,
    ק: 4,
    ר: 7,
    ש: 3,
    ת: 5,
  },
  // The mothers of reading, which are the nearest thing Hebrew writes to vowels. Niqqud are
  // marks rather than letters and are stripped, as unpointed Hebrew has been written for
  // centuries and as every Hebrew word game does.
  vowels: ['א', 'ה', 'ו', 'י'],
  rareLetters: ['ז'],
  requires: {},
  // Final forms fold onto their ordinary ones, the way Hebrew Scrabble does it: a tile cannot
  // be two shapes, so it carries the one that appears everywhere but the end of a word.
  fold: folder({ expand: HEBREW_FINALS }),
  segment: byCodePoint,
  // And this puts the shape back, for a word that is finished. שלומ is not a spelling.
  display: (word) => {
    const last = word.slice(-1)
    const final = HEBREW_ORDINARY[last]
    return final === undefined ? word : word.slice(0, -1) + final
  },
}

/**
 * Arabic's normalisation, which is where all the decisions are.
 *
 * The hamza carriers fold onto the letter carrying them, and the alef forms onto plain alef.
 * That is what an Arabic search index does and what people type, and it is forced here anyway:
 * أ decomposes to alef plus a combining hamza that Unicode does not class as a diacritic, so
 * without a rule the mark would survive the fold and want a tile of its own.
 *
 * The three combining marks are listed too, so a word that arrives already decomposed lands in
 * the same place as one that does not. Tatweel is a stretch, not a letter.
 *
 * Standalone hamza keeps its tile, and that is the one asymmetry: ء is folded away nowhere,
 * because شيء without it is شي, which is a different word.
 */
const ARABIC_FOLD: Readonly<Record<string, string>> = {
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ٱ: 'ا',
  ؤ: 'و',
  ئ: 'ي',
  '\u0640': '',
  '\u0653': '',
  '\u0654': '',
  '\u0655': '',
}

export const ARABIC: Alphabet = {
  id: 'ar',
  endonym: 'العربية',
  direction: 'rtl',
  // Twenty-eight letters, plus taa marbuta and alef maksura, which are letters in their own
  // right and end a great many words, plus standalone hamza. No case, like Hebrew.
  weights: {
    ء: 1,
    ا: 17,
    ب: 4,
    ة: 3,
    ت: 6,
    ث: 1,
    ج: 2,
    ح: 2,
    خ: 1,
    د: 3,
    ذ: 1,
    ر: 5,
    ز: 1,
    س: 3,
    ش: 1,
    ص: 1,
    ض: 1,
    ط: 1,
    ظ: 1,
    ع: 3,
    غ: 1,
    ف: 2,
    ق: 3,
    ك: 3,
    ل: 10,
    م: 6,
    ن: 5,
    ه: 2,
    و: 4,
    ى: 1,
    ي: 8,
  },
  // The long vowels. Arabic writes the short ones as marks, and the marks are stripped, so
  // these three are what a board has to be able to make a syllable out of.
  vowels: ['ا', 'و', 'ي', 'ى'],
  rareLetters: ['ء', 'ث', 'خ', 'ذ', 'ز', 'ش', 'ص', 'ض', 'ط', 'ظ', 'غ'],
  requires: {},
  fold: folder({ expand: ARABIC_FOLD }),
  segment: byCodePoint,
}

export const KOREAN: Alphabet = {
  id: 'ko',
  endonym: '한국어',
  direction: 'ltr',
  // Forty letters, which is what Hangul is underneath and also exactly what a Korean keyboard
  // has: 한 is ㅎ + ㅏ + ㄴ, and NFD says so. The compound *finals* are two tiles each, the way
  // they are two keystrokes; the compound vowels ㅘ ㅙ ㅢ are one, being a fifth of Korean vowel
  // use rather than a rounding error. hangul.ts has the whole argument.
  weights: {
    ㄱ: 8,
    ㄲ: 1,
    ㄴ: 6,
    ㄷ: 3,
    ㄸ: 1,
    ㄹ: 6,
    ㅁ: 4,
    ㅂ: 4,
    ㅃ: 1,
    ㅅ: 6,
    ㅆ: 1,
    ㅇ: 11,
    ㅈ: 4,
    ㅉ: 1,
    ㅊ: 1,
    ㅋ: 1,
    ㅌ: 1,
    ㅍ: 1,
    ㅎ: 2,
    ㅏ: 9,
    ㅐ: 2,
    ㅑ: 1,
    ㅒ: 1,
    ㅓ: 4,
    ㅔ: 1,
    ㅕ: 2,
    ㅖ: 1,
    ㅗ: 5,
    ㅘ: 1,
    ㅙ: 1,
    ㅚ: 1,
    ㅛ: 1,
    ㅜ: 4,
    ㅝ: 1,
    ㅞ: 1,
    ㅟ: 1,
    ㅠ: 1,
    ㅡ: 3,
    ㅢ: 1,
    ㅣ: 6,
  },
  vowels: [
    'ㅏ',
    'ㅐ',
    'ㅑ',
    'ㅒ',
    'ㅓ',
    'ㅔ',
    'ㅕ',
    'ㅖ',
    'ㅗ',
    'ㅘ',
    'ㅙ',
    'ㅚ',
    'ㅛ',
    'ㅜ',
    'ㅝ',
    'ㅞ',
    'ㅟ',
    'ㅠ',
    'ㅡ',
    'ㅢ',
    'ㅣ',
  ],
  rareLetters: ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ'],
  requires: {},
  fold: foldHangul,
  segment: byCodePoint,
  // The board deals letters and a Korean reader does not read letters. ㅎㅏㄴㄱㅡㄹ is the right
  // set of tiles; 한글 is the word.
  display: composeHangul,
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
    SWAHILI,
    LATIN,
    HEBREW,
    ARABIC,
    KOREAN,
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
