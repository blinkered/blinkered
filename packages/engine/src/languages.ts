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
    E: 10,
    F: 1,
    G: 2,
    H: 1,
    I: 12,
    L: 4,
    M: 3,
    N: 6,
    O: 9,
    P: 3,
    Q: 1,
    R: 8,
    S: 5,
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
  A: 18,
  B: 3,
  C: 1,
  D: 2,
  E: 8,
  F: 1,
  G: 4,
  H: 2,
  I: 7,
  J: 1,
  K: 6,
  L: 4,
  M: 4,
  N: 9,
  O: 2,
  P: 4,
  Q: 1,
  R: 6,
  S: 5,
  T: 5,
  U: 6,
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
    И: 7,
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
  rareLetters: ['Ъ', 'Щ', 'Э', 'Ц', 'Ф', 'Ж', 'Х', 'Й'],
  requires: {},
  // Й is и краткое, a letter of the alphabet and a tile in Russian's own word games, and it
  // has to say so: in NFD it is И plus a combining breve, so the default fold quietly ate it.
  // It was in `weights` the whole time, which made it a tile the board could deal and no word
  // could ever use — МОЙ was stored as МОИ, merged with МОИ, and one draw in a hundred was
  // dead on arrival. Ё really is folded onto Е, as Russian word games do.
  fold: folder({ keep: ['Й'], expand: { Ё: 'Е' } }),
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
    A: 6,
    Å: 1,
    Æ: 1,
    B: 2,
    C: 1,
    D: 3,
    E: 17,
    F: 2,
    G: 3,
    H: 1,
    I: 5,
    J: 1,
    K: 5,
    L: 5,
    M: 3,
    N: 9,
    O: 4,
    Ø: 1,
    P: 2,
    Q: 1,
    R: 9,
    S: 7,
    T: 8,
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
  // B, C, F, Q, W, X and Z are all effectively foreign to Finnish, hence weight one and no
  // doubling. Ä and Ö are ordinary letters and common.
  //
  // Å is not here at all. It is `ruotsalainen O`, the Swedish O, and it appears in Finnish
  // only inside Swedish names — which is exactly what a validator built from a Wiktionary's
  // page titles could not tell apart from Finnish. Moving to en.wiktionary categories left it
  // spelling nothing: no word of the 44,102 contains one. Dropped on the Estonian precedent,
  // where Š and Ž went the same way for the same reason.
  weights: {
    A: 13,
    Ä: 4,
    B: 1,
    C: 1,
    D: 1,
    E: 8,
    F: 1,
    G: 1,
    H: 2,
    I: 11,
    J: 1,
    K: 6,
    L: 6,
    M: 3,
    N: 8,
    O: 5,
    Ö: 1,
    P: 2,
    Q: 1,
    R: 3,
    S: 7,
    T: 10,
    U: 5,
    V: 2,
    W: 1,
    X: 1,
    Y: 2,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U', 'Y', 'Ä', 'Ö'],
  rareLetters: ['B', 'C', 'F', 'Q', 'W', 'X', 'Z'],
  // Finnish has no native Q, so there is no lone-Q problem to rule out.
  requires: {},
  fold: folder({ keep: ['Ä', 'Ö'] }),
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
  // `locale` changes nothing about the fold, which strips the tonos anyway. It is here for
  // the writer: upper-case Greek drops its accents, so ΆΒΟΛΑ is a misspelling of ΑΒΟΛΑ rather
  // than a more careful version of it, and only `toLocaleUpperCase('el')` knows that. Without
  // it every Greek word in the set came back accented — 255,526 of 257,014 of them.
  fold: folder({ locale: 'el' }),
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
  // Alef to ya, which is the أبجدية. Three of the tiles above are not in it: ة and ى are
  // positional forms and ء is a mark that became a letter, and the collator sorts ء first.
  recited: ['ا', 'ي'],
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

/**
 * The kana that are not tiles, and what they are read as instead.
 *
 * Voicing and size are not distinctions a Japanese word game makes on the board, and this is
 * not a shortcut: it is how the Japanese word games that exist are played. MegaHouse's もじぴったん
 * card deck is forty-six kana and says so outright — 濁音や半濁音を付けた形で読むことができ、
 * つ・い・ゆ・よ などは小文字として使うことも出来る, so the は card is played as ば and ちよこ
 * is read ちょこ. Crossword convention is the same: 濁音や半濁音は清音と区別されず、小さい文字は
 * 大きい文字と同一視される.
 *
 * It is also what makes the game possible. Eighty-four tiles reach a twelfth of what
 * forty-seven do, and a board that cannot spell anything is not a harder game, it is a worse one.
 */
const KANA_FOLD: Readonly<Record<string, string>> = {
  ぁ: 'あ',
  ぃ: 'い',
  ぅ: 'う',
  ぇ: 'え',
  ぉ: 'お',
  っ: 'つ',
  ゃ: 'や',
  ゅ: 'ゆ',
  ょ: 'よ',
  ゎ: 'わ',
  ゕ: 'か',
  ゖ: 'け',
  ゐ: 'い',
  ゑ: 'え',
}

/** Katakana onto hiragana, so a borrowed word is tiled with the same letters as a native one. */
const KATAKANA_TO_HIRAGANA: Readonly<Record<string, string>> = Object.fromEntries(
  Array.from({ length: 0x30f6 - 0x30a1 + 1 }, (_, at) => [
    String.fromCodePoint(0x30a1 + at),
    String.fromCodePoint(0x3041 + at),
  ]),
)

export const JAPANESE: Alphabet = {
  id: 'ja',
  endonym: '日本語',
  direction: 'ltr',
  // Forty-seven: the gojūon, plus the long-vowel mark, which もじぴったん also deals as a card.
  // Every tile is a whole mora, which is why the numbers here read differently from an
  // alphabet's: a three-tile word is an ordinary one and a six-tile word is a long one.
  weights: {
    ー: 1,
    あ: 1,
    い: 7,
    う: 8,
    え: 1,
    お: 1,
    か: 5,
    き: 4,
    く: 5,
    け: 2,
    こ: 3,
    さ: 2,
    し: 7,
    す: 2,
    せ: 2,
    そ: 1,
    た: 3,
    ち: 2,
    つ: 4,
    て: 2,
    と: 2,
    な: 1,
    に: 1,
    ぬ: 1,
    ね: 1,
    の: 1,
    は: 2,
    ひ: 1,
    ふ: 2,
    へ: 1,
    ほ: 1,
    ま: 1,
    み: 1,
    む: 1,
    め: 1,
    も: 1,
    や: 1,
    ゆ: 2,
    よ: 4,
    ら: 1,
    り: 2,
    る: 2,
    れ: 1,
    ろ: 1,
    わ: 1,
    を: 1,
    ん: 8,
  },
  // The five that stand alone. Every other tile is already a syllable, so the draw's vowel floor
  // has far less to do here than in a language whose consonants cannot be spoken by themselves.
  vowels: ['あ', 'い', 'う', 'え', 'お'],
  // Measured rather than inherited. Bare vowels are 17% of the letters in the common tier, and
  // the default 35% would spend a third of every board on あ, え and お, which are the three
  // rarest tiles Japanese has. See `vowelShare`.
  vowelShare: 0.17,
  rareLetters: [
    'あ',
    'え',
    'お',
    'そ',
    'な',
    'に',
    'ぬ',
    'ね',
    'の',
    'ひ',
    'へ',
    'ほ',
    'ま',
    'み',
    'む',
    'め',
    'も',
    'や',
    'ら',
    'れ',
    'ろ',
    'わ',
    'を',
    'ー',
  ],
  requires: {},
  fold: (key) => {
    const hiragana = [...key.normalize('NFD')]
      .filter((character) => character !== '\u3099' && character !== '\u309a')
      .map((character) => KATAKANA_TO_HIRAGANA[character] ?? character)
      .join('')
    return [...hiragana].map((character) => KANA_FOLD[character] ?? character).join('')
  },
  segment: byCodePoint,
}

/**
 * Egyptian Arabic. The same letters, the same normalisation and the same direction as Modern
 * Standard Arabic, which is what makes it a separate word list rather than a separate alphabet:
 * the two differ in vocabulary and in which words are common, not in how they are written.
 *
 * Weights of its own, because those are measured from its own list and Egyptian writing does
 * not distribute its letters the way a newspaper does.
 */
export const EGYPTIAN_ARABIC: Alphabet = {
  ...ARABIC,
  id: 'arz',
  endonym: 'مصرى',
  // Its own table, measured from its own list, the way Malay and Indonesian have theirs. Eleven
  // letters differ from the standard language's: more ا, ل and ه, less ق, ك and ع, which is
  // Egyptian writing rather than a newspaper's.
  weights: {
    ء: 1,
    ا: 18,
    ب: 4,
    ة: 3,
    ت: 5,
    ث: 1,
    ج: 2,
    ح: 2,
    خ: 1,
    د: 3,
    ذ: 1,
    ر: 6,
    ز: 1,
    س: 3,
    ش: 1,
    ص: 1,
    ض: 1,
    ط: 1,
    ظ: 1,
    ع: 2,
    غ: 1,
    ف: 2,
    ق: 2,
    ك: 2,
    ل: 11,
    م: 6,
    ن: 5,
    ه: 3,
    و: 6,
    ى: 1,
    ي: 8,
  },
}

export const POLISH: Alphabet = {
  id: 'pl',
  endonym: 'Polski',
  direction: 'ltr',
  // Thirty-two letters, and no Q, V or X outside borrowings. The nine marked letters are
  // letters rather than decorated ones: BÓR and BOR are different words, as are LOS and LOŚ. Ł
  // needs no protecting because Unicode gives it its own code point rather than building it from
  // an L. The digraphs CH, CZ, DZ, DŹ, DŻ, RZ and SZ are two tiles each: Polish does not count
  // them as letters of the alphabet, and they could not be typed if it did.
  weights: {
    A: 10,
    Ą: 1,
    B: 1,
    C: 4,
    Ć: 1,
    D: 3,
    E: 7,
    Ę: 1,
    F: 1,
    G: 1,
    H: 1,
    I: 8,
    J: 2,
    K: 3,
    L: 2,
    Ł: 3,
    M: 3,
    N: 5,
    Ń: 1,
    O: 7,
    Ó: 1,
    P: 4,
    R: 5,
    S: 4,
    Ś: 1,
    T: 3,
    U: 3,
    W: 4,
    Y: 4,
    Z: 7,
    Ź: 1,
    Ż: 1,
  },
  vowels: ['A', 'Ą', 'E', 'Ę', 'I', 'O', 'Ó', 'U', 'Y'],
  rareLetters: ['B', 'F', 'G', 'H', 'Ć', 'Ń', 'Ś', 'Ź', 'Ż'],
  requires: {},
  fold: folder({ keep: ['Ą', 'Ć', 'Ę', 'Ń', 'Ó', 'Ś', 'Ź', 'Ż'] }),
  segment: byCodePoint,
}

export const CZECH: Alphabet = {
  id: 'cs',
  endonym: 'Čeština',
  direction: 'ltr',
  // Thirty-nine letters, because Czech length is a letter and not an accent: BYT is a flat and
  // BÝT is to be. Czech Scrabble tiles them separately for the same reason. CH is a letter of the
  // alphabet and is two tiles here anyway, for the reason Tagalog NG is — nothing turns two
  // keystrokes into one tile, and a letter that can only be taken with the mouse is worse than a
  // letter the alphabet row is missing.
  weights: {
    A: 7,
    Á: 2,
    B: 2,
    C: 2,
    Č: 1,
    D: 4,
    Ď: 1,
    E: 7,
    É: 1,
    Ě: 1,
    F: 1,
    G: 1,
    H: 2,
    I: 5,
    Í: 3,
    J: 1,
    K: 4,
    L: 5,
    M: 3,
    N: 6,
    Ň: 1,
    O: 8,
    Ó: 1,
    P: 4,
    R: 4,
    Ř: 1,
    S: 4,
    Š: 1,
    T: 6,
    Ť: 1,
    U: 3,
    Ú: 1,
    Ů: 1,
    V: 4,
    X: 1,
    Y: 2,
    Ý: 1,
    Z: 2,
    Ž: 1,
  },
  vowels: ['A', 'Á', 'E', 'É', 'Ě', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý'],
  rareLetters: ['F', 'G', 'J', 'X', 'Č', 'Ď', 'Ň', 'Ř', 'Š', 'Ť', 'Ž'],
  requires: {},
  fold: folder({
    keep: ['Á', 'Č', 'Ď', 'É', 'Ě', 'Í', 'Ň', 'Ó', 'Ř', 'Š', 'Ť', 'Ú', 'Ů', 'Ý', 'Ž'],
  }),
  segment: byCodePoint,
}

export const SLOVAK: Alphabet = {
  id: 'sk',
  endonym: 'Slovenčina',
  direction: 'ltr',
  // Forty letters, and Slovak marks length on its consonants too: Ĺ and Ŕ are syllabic R and L held long,
  // which is why VLK and VĹK are both words. DZ, DŽ and CH are letters of the alphabet and two
  // tiles each, as in Czech.
  weights: {
    A: 8,
    Á: 2,
    Ä: 1,
    B: 2,
    C: 2,
    Č: 1,
    D: 4,
    Ď: 1,
    E: 8,
    É: 1,
    F: 1,
    G: 1,
    H: 2,
    I: 6,
    Í: 1,
    J: 2,
    K: 3,
    L: 4,
    Ĺ: 1,
    Ľ: 1,
    M: 3,
    N: 6,
    Ň: 1,
    O: 8,
    Ó: 1,
    Ô: 1,
    P: 4,
    R: 5,
    Ŕ: 1,
    S: 4,
    Š: 1,
    T: 5,
    Ť: 1,
    U: 3,
    Ú: 1,
    V: 4,
    Y: 2,
    Ý: 1,
    Z: 2,
    Ž: 1,
  },
  vowels: ['A', 'Á', 'Ä', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'Ô', 'U', 'Ú', 'Y', 'Ý'],
  rareLetters: ['F', 'G', 'Č', 'Ď', 'Ĺ', 'Ľ', 'Ň', 'Ŕ', 'Š', 'Ť', 'Ž'],
  requires: {},
  fold: folder({
    keep: ['Á', 'Ä', 'Č', 'Ď', 'É', 'Í', 'Ĺ', 'Ľ', 'Ň', 'Ó', 'Ô', 'Ŕ', 'Š', 'Ť', 'Ú', 'Ý', 'Ž'],
  }),
  segment: byCodePoint,
}

export const SLOVENE: Alphabet = {
  id: 'sl',
  endonym: 'Slovenščina',
  direction: 'ltr',
  // Twenty-five letters, and the smallest alphabet of the Slavic group: no Q, W, X or Y,
  // and no length marks. Slovene has pitch and vowel length and writes neither outside
  // dictionaries, so a Slovene word list needs no decision about them.
  weights: {
    A: 11,
    B: 2,
    C: 1,
    Č: 2,
    D: 3,
    E: 9,
    F: 1,
    G: 2,
    H: 1,
    I: 9,
    J: 4,
    K: 3,
    L: 5,
    M: 3,
    N: 6,
    O: 9,
    P: 4,
    R: 6,
    S: 4,
    Š: 1,
    T: 5,
    U: 2,
    V: 4,
    Z: 2,
    Ž: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['C', 'F', 'H', 'Š', 'Ž'],
  requires: {},
  fold: folder({ keep: ['Č', 'Š', 'Ž'] }),
  segment: byCodePoint,
}

export const DANISH: Alphabet = {
  id: 'da',
  endonym: 'Dansk',
  direction: 'ltr',
  // Twenty-nine letters: the Latin twenty-six and then Æ, Ø and Å, in that order and at
  // the end, which is where a Danish dictionary puts them. Å was AA until 1948 and the old
  // spelling survives in names; it is not folded, because AAL and ÅL would then be one word.
  weights: {
    A: 5,
    Å: 1,
    Æ: 1,
    B: 2,
    C: 1,
    D: 5,
    E: 16,
    F: 2,
    G: 4,
    H: 1,
    I: 5,
    J: 1,
    K: 4,
    L: 5,
    M: 3,
    N: 8,
    O: 4,
    Ø: 1,
    P: 2,
    Q: 1,
    R: 9,
    S: 6,
    T: 7,
    U: 2,
    V: 2,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U', 'Y', 'Æ', 'Ø', 'Å'],
  rareLetters: ['C', 'H', 'J', 'Q', 'W', 'X', 'Z'],
  requires: {},
  fold: folder({ keep: ['Æ', 'Ø', 'Å'] }),
  segment: byCodePoint,
}

export const CATALAN: Alphabet = {
  id: 'ca',
  endonym: 'Català',
  direction: 'ltr',
  // Twenty-seven letters. Ç is a letter; the accents are not — CANTÀS and CANTAS are one
  // word wearing a stress mark, which is what folding is for. The interpunct of the ela geminada
  // (COL·LEGI) is punctuation between two Ls rather than a letter, so it is dropped rather than
  // tiled, the way Swahili's NG' apostrophe is.
  weights: {
    A: 13,
    B: 2,
    C: 5,
    Ç: 1,
    D: 3,
    E: 11,
    F: 1,
    G: 2,
    H: 1,
    I: 9,
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
    V: 1,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['F', 'H', 'J', 'K', 'Q', 'V', 'W', 'X', 'Y', 'Z', 'Ç'],
  requires: {},
  fold: folder({ keep: ['Ç'], expand: { '·': '' } }),
  segment: byCodePoint,
}

export const ESTONIAN: Alphabet = {
  id: 'et',
  endonym: 'Eesti',
  direction: 'ltr',
  // Estonian's alphabet ends Š Z Ž T U V W Õ Ä Ö Ü X Y, which is not a typo: the borrowed
  // letters sit where Estonian puts them rather than where Latin does. Õ is the one nothing else
  // in the group has, and it is a letter — SÕDA is a war and SODA is soda.
  //
  // Š and Ž are letters of that alphabet and are not tiles, the way Italian's J, K, W, X and Y
  // are not: they occur only in borrowings, and not one word of the shipped list has either.
  // They fold onto S and Z instead of being dealt, which makes ŠOKOLAAD playable rather than
  // dropping it, and no Estonian word is merged by it.
  weights: {
    A: 13,
    Ä: 1,
    B: 1,
    C: 1,
    D: 5,
    E: 10,
    F: 1,
    G: 2,
    H: 2,
    I: 9,
    J: 1,
    K: 5,
    L: 6,
    M: 4,
    N: 5,
    O: 3,
    Ö: 1,
    Õ: 1,
    P: 2,
    Q: 1,
    R: 3,
    S: 9,
    T: 8,
    U: 6,
    Ü: 1,
    V: 3,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U', 'Õ', 'Ä', 'Ö', 'Ü'],
  rareLetters: ['B', 'C', 'F', 'J', 'Q', 'W', 'X', 'Y', 'Z'],
  requires: {},
  fold: folder({ keep: ['Õ', 'Ä', 'Ö', 'Ü'] }),
  segment: byCodePoint,
}

export const LITHUANIAN: Alphabet = {
  id: 'lt',
  endonym: 'Lietuvių',
  direction: 'ltr',
  // Thirty-two letters. The hooks and macrons are letters: they mark length and history,
  // and KĄSTI and KASTI are different verbs. Y is a long I and files with the vowels rather than
  // after W, which is why the alphabet reads I Į Y J.
  weights: {
    A: 12,
    Ą: 1,
    B: 1,
    C: 1,
    Č: 1,
    D: 3,
    E: 6,
    Ė: 2,
    Ę: 1,
    F: 1,
    G: 2,
    H: 1,
    I: 13,
    Į: 1,
    J: 2,
    K: 5,
    L: 3,
    M: 3,
    N: 5,
    O: 5,
    P: 3,
    R: 5,
    S: 8,
    Š: 2,
    T: 6,
    U: 6,
    Ų: 1,
    Ū: 1,
    V: 2,
    Y: 2,
    Z: 1,
    Ž: 1,
  },
  vowels: ['A', 'Ą', 'E', 'Ę', 'Ė', 'I', 'Į', 'Y', 'O', 'U', 'Ų', 'Ū'],
  rareLetters: ['B', 'C', 'F', 'H', 'Z', 'Č', 'Ž'],
  requires: {},
  fold: folder({ keep: ['Ą', 'Č', 'Ę', 'Ė', 'Į', 'Š', 'Ų', 'Ū', 'Ž'] }),
  segment: byCodePoint,
}

export const LATVIAN: Alphabet = {
  id: 'lv',
  endonym: 'Latviešu',
  direction: 'ltr',
  // Thirty-three letters, and the macrons carry meaning that nothing else does: KAZA is a
  // goat and KĀZAS is a wedding. Latvian dropped Ō, Ŗ and CH from the alphabet in 1946 and they
  // are not tiles.
  weights: {
    A: 10,
    Ā: 4,
    B: 2,
    C: 1,
    Č: 1,
    D: 3,
    E: 7,
    Ē: 2,
    F: 1,
    G: 2,
    Ģ: 1,
    H: 1,
    I: 10,
    Ī: 2,
    J: 2,
    K: 3,
    Ķ: 1,
    L: 3,
    Ļ: 1,
    M: 4,
    N: 4,
    Ņ: 1,
    O: 3,
    P: 3,
    R: 5,
    S: 9,
    Š: 1,
    T: 6,
    U: 5,
    Ū: 1,
    V: 2,
    Z: 2,
    Ž: 1,
  },
  vowels: ['A', 'Ā', 'E', 'Ē', 'I', 'Ī', 'O', 'U', 'Ū'],
  rareLetters: ['C', 'F', 'H', 'Č', 'Ģ', 'Ķ', 'Ļ', 'Ņ', 'Š', 'Ž'],
  requires: {},
  fold: folder({ keep: ['Ā', 'Č', 'Ē', 'Ģ', 'Ī', 'Ķ', 'Ļ', 'Ņ', 'Š', 'Ū', 'Ž'] }),
  segment: byCodePoint,
}

export const MACEDONIAN: Alphabet = {
  id: 'mk',
  endonym: 'Македонски',
  direction: 'ltr',
  // Thirty-one letters. Ѓ and Ќ have to be protected by name: Unicode builds them from Г
  // and К plus a combining acute, so the default fold would quietly turn them into the letters
  // they are not. Љ, Њ and Џ are single code points and need no such help.
  weights: {
    А: 12,
    Б: 2,
    В: 4,
    Г: 1,
    Ѓ: 1,
    Д: 3,
    Е: 9,
    Ж: 1,
    З: 2,
    Ѕ: 1,
    И: 9,
    Ј: 1,
    К: 4,
    Ќ: 1,
    Л: 4,
    Љ: 1,
    М: 3,
    Н: 7,
    Њ: 1,
    О: 8,
    П: 4,
    Р: 7,
    С: 5,
    Т: 5,
    У: 3,
    Ф: 1,
    Х: 1,
    Ц: 1,
    Ч: 2,
    Џ: 1,
    Ш: 1,
  },
  vowels: ['А', 'Е', 'И', 'О', 'У'],
  rareLetters: ['Ѓ', 'Ѕ', 'Ј', 'Љ', 'Њ', 'Ќ', 'Џ', 'Г', 'Ж', 'Ф', 'Х', 'Ц', 'Ш'],
  requires: {},
  fold: folder({ keep: ['Ѓ', 'Ќ'] }),
  segment: byCodePoint,
}

export const SERBIAN: Alphabet = {
  id: 'sr',
  endonym: 'Српски',
  direction: 'ltr',
  // Thirty letters, in Cyrillic. Serbian is written in two alphabets and this is the
  // official one; the Latin one is the same words letter for letter, and is a second language
  // here rather than a second spelling of this one. Every letter is one code point, and the
  // alphabet has exactly one letter per sound, which is the thing Vuk Karadžić is famous for.
  weights: {
    А: 12,
    Б: 2,
    В: 4,
    Г: 1,
    Д: 3,
    Ђ: 1,
    Е: 9,
    Ж: 1,
    З: 2,
    И: 10,
    Ј: 2,
    К: 3,
    Л: 3,
    Љ: 1,
    М: 4,
    Н: 5,
    Њ: 1,
    О: 9,
    П: 4,
    Р: 6,
    С: 4,
    Т: 5,
    Ћ: 1,
    У: 5,
    Ф: 1,
    Х: 1,
    Ц: 1,
    Ч: 1,
    Џ: 1,
    Ш: 1,
  },
  vowels: ['А', 'Е', 'И', 'О', 'У'],
  rareLetters: ['Ђ', 'Љ', 'Њ', 'Ћ', 'Џ', 'Г', 'Ж', 'Ф', 'Х', 'Ц', 'Ч', 'Ш'],
  requires: {},
  fold: folder(),
  segment: byCodePoint,
}

export const UKRAINIAN: Alphabet = {
  id: 'uk',
  endonym: 'Українська',
  direction: 'ltr',
  // Thirty-three letters. Й and Ї both decompose — Й is И with a breve and Ї is І with a
  // diaeresis — so both are named, the way Russian's Й now is. Ukrainian keeps Г and Ґ apart,
  // which Russian does not have at all, and І, Ї and И are three letters rather than one.
  weights: {
    А: 10,
    Б: 3,
    В: 5,
    Г: 2,
    Ґ: 1,
    Д: 3,
    Е: 5,
    Є: 1,
    Ж: 1,
    З: 2,
    И: 6,
    І: 5,
    Ї: 1,
    Й: 2,
    К: 5,
    Л: 4,
    М: 2,
    Н: 6,
    О: 8,
    П: 3,
    Р: 6,
    С: 4,
    Т: 6,
    У: 3,
    Ф: 1,
    Х: 1,
    Ц: 1,
    Ч: 1,
    Ш: 1,
    Щ: 1,
    Ь: 2,
    Ю: 1,
    Я: 2,
  },
  vowels: ['А', 'Е', 'Є', 'И', 'І', 'Ї', 'О', 'У', 'Ю', 'Я'],
  rareLetters: ['Ж', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ґ'],
  requires: {},
  fold: folder({ keep: ['Й', 'Ї'] }),
  segment: byCodePoint,
}

export const BULGARIAN: Alphabet = {
  id: 'bg',
  endonym: 'Български',
  direction: 'ltr',
  // Thirty letters. Ъ is a vowel in Bulgarian rather than the hard sign it is in Russian —
  // it is the sound in БЪЛГАРИЯ — so it goes in the vowel bag rather than the rare list. Й is
  // named for the same reason it is in Russian and Ukrainian.
  weights: {
    А: 12,
    Б: 2,
    В: 4,
    Г: 1,
    Д: 3,
    Е: 9,
    Ж: 1,
    З: 3,
    И: 9,
    Й: 1,
    К: 3,
    Л: 4,
    М: 3,
    Н: 6,
    О: 7,
    П: 4,
    Р: 6,
    С: 4,
    Т: 7,
    У: 2,
    Ф: 1,
    Х: 1,
    Ц: 1,
    Ч: 1,
    Ш: 1,
    Щ: 1,
    Ъ: 2,
    Ь: 1,
    Ю: 1,
    Я: 2,
  },
  vowels: ['А', 'Е', 'И', 'О', 'У', 'Ъ', 'Ю', 'Я'],
  rareLetters: ['Г', 'Ж', 'Й', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ь'],
  requires: {},
  fold: folder({ keep: ['Й'] }),
  segment: byCodePoint,
}

export const ARMENIAN: Alphabet = {
  id: 'hy',
  endonym: 'Հայերեն',
  direction: 'ltr',
  // Thirty-eight letters, unchanged in order since Mesrop Mashtots set them out in 405.
  // The ligature և is not a tile: upper-casing it yields ԵՒ on its own, which is the two letters
  // it is made of, so it arrives at the board already taken apart.
  weights: {
    Ա: 18,
    Բ: 1,
    Գ: 2,
    Դ: 2,
    Ե: 6,
    Զ: 1,
    Է: 1,
    Ը: 1,
    Թ: 2,
    Ժ: 1,
    Ի: 5,
    Լ: 3,
    Խ: 1,
    Ծ: 1,
    Կ: 5,
    Հ: 2,
    Ձ: 1,
    Ղ: 1,
    Ճ: 1,
    Մ: 4,
    Յ: 3,
    Ն: 9,
    Շ: 1,
    Ո: 8,
    Չ: 1,
    Պ: 1,
    Ջ: 1,
    Ռ: 1,
    Ս: 3,
    Վ: 2,
    Տ: 4,
    Ր: 7,
    Ց: 1,
    Ւ: 4,
    Փ: 1,
    Ք: 1,
    Օ: 1,
    Ֆ: 1,
  },
  vowels: ['Ա', 'Ե', 'Է', 'Ը', 'Ի', 'Ո', 'Օ'],
  rareLetters: [
    'Բ',
    'Զ',
    'Ժ',
    'Խ',
    'Ծ',
    'Ձ',
    'Ղ',
    'Ճ',
    'Շ',
    'Չ',
    'Պ',
    'Ջ',
    'Ռ',
    'Ց',
    'Փ',
    'Ք',
    'Ֆ',
  ],
  requires: {},
  fold: folder(),
  segment: byCodePoint,
}

export const GEORGIAN: Alphabet = {
  id: 'ka',
  endonym: 'ქართული',
  direction: 'ltr',
  // Thirty-three letters and no capitals, which is the whole difficulty. Georgian is
  // unicameral, but Unicode 11 gave Mkhedruli an upper case for setting headings — Mtavruli — and
  // `toUpperCase` obligingly uses it, so the ordinary fold would have dealt ᲥᲐᲠᲗᲣᲚᲘ instead of
  // ქართული. This is Turkish's trap in a different alphabet, found before shipping this time.
  weights: {
    ა: 13,
    ბ: 4,
    გ: 2,
    დ: 3,
    ე: 9,
    ვ: 3,
    ზ: 1,
    თ: 2,
    ი: 13,
    კ: 2,
    ლ: 5,
    მ: 4,
    ნ: 5,
    ო: 5,
    პ: 1,
    ჟ: 1,
    რ: 6,
    ს: 7,
    ტ: 2,
    უ: 3,
    ფ: 1,
    ქ: 1,
    ღ: 1,
    ყ: 1,
    შ: 2,
    ჩ: 1,
    ც: 1,
    ძ: 1,
    წ: 1,
    ჭ: 1,
    ხ: 1,
    ჯ: 1,
    ჰ: 1,
  },
  vowels: ['ა', 'ე', 'ი', 'ო', 'უ'],
  rareLetters: ['ზ', 'პ', 'ჟ', 'ფ', 'ქ', 'ღ', 'ყ', 'ჩ', 'ც', 'ძ', 'წ', 'ჭ', 'ხ', 'ჯ', 'ჰ'],
  requires: {},
  // Its own fold, because upper-casing Georgian is the one thing that must not happen.
  fold: (key) => key.normalize('NFC'),
  segment: byCodePoint,
}

export const BASQUE: Alphabet = {
  id: 'eu',
  endonym: 'Euskara',
  direction: 'ltr',
  // Twenty-seven letters. Ñ is a letter, as it is in Spanish. The digraphs TS, TX, TZ, DD
  // and LL are two tiles each — Basque does not count them as letters, and TX is far too common
  // to be mouse-only. Ü appears only in Souletin and is folded onto U.
  weights: {
    A: 16,
    B: 3,
    C: 1,
    D: 2,
    E: 10,
    F: 1,
    G: 3,
    H: 2,
    I: 9,
    J: 1,
    K: 4,
    L: 4,
    M: 3,
    N: 6,
    Ñ: 1,
    O: 6,
    P: 2,
    Q: 1,
    R: 9,
    S: 4,
    T: 6,
    U: 4,
    V: 1,
    W: 1,
    X: 1,
    Y: 1,
    Z: 3,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['C', 'F', 'J', 'Q', 'V', 'W', 'X', 'Y', 'Ñ'],
  requires: {},
  fold: folder({ keep: ['Ñ'] }),
  segment: byCodePoint,
}

export const GALICIAN: Alphabet = {
  id: 'gl',
  endonym: 'Galego',
  direction: 'ltr',
  // Twenty-seven letters, the Spanish set. The accents mark stress and fold away; Ñ is a
  // letter and does not. The digraph NH is Galician's own and is two tiles, as CH and LL are.
  weights: {
    A: 14,
    B: 2,
    C: 5,
    D: 4,
    E: 11,
    F: 1,
    G: 1,
    H: 1,
    I: 8,
    J: 1,
    K: 1,
    L: 3,
    M: 3,
    N: 6,
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
  rareLetters: ['F', 'G', 'H', 'J', 'K', 'Q', 'V', 'W', 'X', 'Y', 'Z', 'Ñ'],
  requires: {},
  fold: folder({ keep: ['Ñ'] }),
  segment: byCodePoint,
}

export const ICELANDIC: Alphabet = {
  id: 'is',
  endonym: 'Íslenska',
  direction: 'ltr',
  // Thirty-two letters. The acutes are letters and not stress marks — Á is its own vowel,
  // and RAS and RÁS are different words. No C, Q or W, and no Z since the 1974 reform folded it
  // onto S. Þ and Ð are the two letters English lost.
  weights: {
    A: 9,
    Á: 1,
    Æ: 1,
    B: 1,
    D: 2,
    Ð: 1,
    E: 5,
    É: 1,
    F: 3,
    G: 4,
    H: 2,
    I: 9,
    Í: 1,
    J: 1,
    K: 4,
    L: 6,
    M: 3,
    N: 10,
    O: 1,
    Ó: 1,
    Ö: 1,
    P: 1,
    R: 8,
    S: 6,
    T: 6,
    U: 6,
    Ú: 1,
    V: 2,
    X: 1,
    Y: 1,
    Ý: 1,
    Þ: 1,
  },
  vowels: ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Y', 'Ý', 'Æ', 'Ö'],
  rareLetters: ['B', 'J', 'P', 'X', 'Ð', 'Þ'],
  requires: {},
  fold: folder({ keep: ['Á', 'É', 'Í', 'Ó', 'Ú', 'Ý', 'Ö'] }),
  segment: byCodePoint,
}

export const WELSH: Alphabet = {
  id: 'cy',
  endonym: 'Cymraeg',
  direction: 'ltr',
  // Welsh counts CH, DD, FF, NG, LL, PH, RH and TH as letters of its alphabet, and every
  // one of them is two tiles here. This is the Tagalog decision and it costs more in Welsh than
  // anywhere else, because LL and DD are among the commonest letters in the language — but a
  // board whose commonest letter can only be taken with the mouse is a worse game than one whose
  // alphabet row is short. W and Y are vowels in Welsh, which is why CWM and CYNLLYN are
  // pronounceable; both go in the vowel bag. The to-bach (Â, Ê, Ŵ, Ŷ) marks length and folds.
  weights: {
    A: 9,
    B: 2,
    C: 3,
    D: 11,
    E: 7,
    F: 4,
    G: 4,
    H: 4,
    I: 7,
    J: 1,
    L: 6,
    M: 2,
    N: 6,
    O: 6,
    P: 1,
    R: 7,
    S: 3,
    T: 4,
    U: 3,
    W: 4,
    Y: 6,
  },
  vowels: ['A', 'E', 'I', 'O', 'U', 'W', 'Y'],
  rareLetters: ['J', 'P'],
  requires: {},
  fold: folder(),
  segment: byCodePoint,
}

export const IRISH: Alphabet = {
  id: 'ga',
  endonym: 'Gaeilge',
  direction: 'ltr',
  // Eighteen letters and five long vowels, which are letters: the síneadh fada is not a
  // stress mark, and SEAN is old while SEÁN is a name. No J, K, Q, V, W, X, Y or Z outside
  // loanwords. The lenited consonants are written BH, CH, DH and so on — two tiles each, and far
  // too common to be anything else.
  weights: {
    A: 15,
    Á: 2,
    B: 2,
    C: 7,
    D: 3,
    E: 6,
    É: 1,
    F: 1,
    G: 3,
    H: 9,
    I: 10,
    Í: 2,
    L: 5,
    M: 3,
    N: 6,
    O: 4,
    Ó: 1,
    P: 1,
    R: 7,
    S: 4,
    T: 6,
    U: 2,
    Ú: 1,
  },
  vowels: ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú'],
  rareLetters: ['F', 'P'],
  requires: {},
  fold: folder({ keep: ['Á', 'É', 'Í', 'Ó', 'Ú'] }),
  segment: byCodePoint,
}

export const HUNGARIAN: Alphabet = {
  id: 'hu',
  endonym: 'Magyar',
  direction: 'ltr',
  // Fourteen vowels, which is what Hungarian is for: Ö and Ő are different letters, not
  // one letter with an optional accent, and TÖRÖK and TŐRÖK are different words. The nine
  // digraphs and one trigraph — CS, DZ, DZS, GY, LY, NY, SZ, TY, ZS — are letters of the Hungarian
  // alphabet and two or three tiles each here, because SZ and GY are far too common to be
  // mouse-only.
  weights: {
    A: 7,
    Á: 4,
    B: 2,
    C: 1,
    D: 3,
    E: 11,
    É: 3,
    F: 1,
    G: 2,
    H: 1,
    I: 4,
    Í: 1,
    J: 2,
    K: 6,
    L: 7,
    M: 4,
    N: 6,
    O: 4,
    Ó: 1,
    Ö: 1,
    Ő: 1,
    P: 1,
    R: 4,
    S: 6,
    T: 9,
    U: 1,
    Ú: 1,
    Ü: 1,
    Ű: 1,
    V: 2,
    Z: 4,
  },
  vowels: ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'Ö', 'Ő', 'U', 'Ú', 'Ü', 'Ű'],
  rareLetters: ['C', 'F', 'H', 'P'],
  requires: {},
  fold: folder({ keep: ['Á', 'É', 'Í', 'Ó', 'Ö', 'Ő', 'Ú', 'Ü', 'Ű'] }),
  segment: byCodePoint,
}

export const ROMANIAN: Alphabet = {
  id: 'ro',
  endonym: 'Română',
  direction: 'ltr',
  // Thirty-one letters. The one trap is Unicode's: Ș and Ț are S and T with a comma below
  // (U+0218, U+021A), and for years Romanian text was typed with the Turkish cedilla forms Ş and Ţ
  // instead. Both spellings are still everywhere, so the cedilla forms are folded onto the comma
  // ones — otherwise ȘI and ŞI would be two words, and half the corpus would validate against
  // neither. Â and Î are the same sound spelled two ways by position, and are two letters.
  weights: {
    A: 9,
    Ă: 3,
    Â: 1,
    B: 1,
    C: 5,
    D: 2,
    E: 11,
    F: 1,
    G: 1,
    H: 1,
    I: 11,
    Î: 1,
    J: 1,
    K: 1,
    L: 5,
    M: 3,
    N: 6,
    O: 5,
    P: 3,
    R: 8,
    S: 4,
    Ș: 1,
    T: 7,
    Ț: 2,
    U: 5,
    V: 1,
    X: 1,
    Z: 1,
  },
  vowels: ['A', 'Ă', 'Â', 'E', 'I', 'Î', 'O', 'U'],
  rareLetters: ['B', 'F', 'G', 'H', 'J', 'K', 'V', 'X', 'Z', 'Ș'],
  requires: {},
  fold: folder({ keep: ['Ă', 'Â', 'Î', 'Ș', 'Ț'], expand: { ş: 'Ș', ţ: 'Ț', Ş: 'Ș', Ţ: 'Ț' } }),
  segment: byCodePoint,
}

export const PERSIAN: Alphabet = {
  id: 'fa',
  endonym: 'فارسی',
  direction: 'rtl',
  // Thirty-two letters: the Arabic twenty-eight less three Arabic-only shapes, plus پ, چ,
  // ژ and گ, which Persian added for sounds Arabic has not got. Two of its letters look like
  // Arabic ones and are not — Persian ک is U+06A9 and Arabic ك is U+0643, Persian ی is U+06CC and
  // Arabic ي is U+064A — and text arrives spelled both ways, so the Arabic forms fold onto the
  // Persian ones. The zero-width non-joiner that holds می and نمی apart from what follows is a
  // spacing instruction rather than a letter, and is dropped.
  weights: {
    ا: 13,
    ب: 4,
    پ: 1,
    ت: 6,
    ث: 1,
    ج: 1,
    چ: 1,
    ح: 1,
    خ: 2,
    د: 6,
    ذ: 1,
    ر: 8,
    ز: 2,
    ژ: 1,
    س: 4,
    ش: 3,
    ص: 1,
    ض: 1,
    ط: 1,
    ظ: 1,
    ع: 1,
    غ: 1,
    ف: 2,
    ق: 1,
    ک: 3,
    گ: 2,
    ل: 3,
    م: 6,
    ن: 7,
    ه: 4,
    و: 6,
    ی: 11,
  },
  vowels: ['ا', 'و', 'ی'],
  rareLetters: ['ث', 'ج', 'ح', 'ذ', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ق', 'پ', 'چ', 'ژ'],
  requires: {},
  recited: ['ا', 'ی'],
  // Arabic look-alikes onto the Persian letters, the hamza carriers onto their bases, and the
  // short-vowel marks away. The zero-width non-joiner goes too: it is what holds می and نمی
  // apart from the verb that follows, which is a spacing instruction rather than a letter.
  fold: folder({
    expand: {
      // The Arabic look-alikes. Persian ک is U+06A9 and Arabic ك is U+0643; Persian ی is
      // U+06CC and Arabic ي is U+064A. Text arrives spelled both ways.
      '\u0643': '\u06a9',
      '\u064a': '\u06cc',
      '\u0649': '\u06cc',
      '\u0629': '\u0647',
      // Hamza carriers onto the letter underneath, as Arabic does.
      '\u0623': '\u0627',
      '\u0625': '\u0627',
      '\u0622': '\u0627',
      '\u0671': '\u0627',
      '\u0624': '\u0648',
      '\u0626': '\u06cc',
      // Tatweel is a typographic stretch, and the zero-width non-joiner is what holds می and
      // نمی apart from the verb after them: spacing instructions, not letters.
      '\u0640': '',
      '\u200c': '',
      // The short vowels, which Persian writes only in dictionaries and for children.
      '\u064b': '',
      '\u064c': '',
      '\u064d': '',
      '\u064e': '',
      '\u064f': '',
      '\u0650': '',
      '\u0651': '',
      '\u0652': '',
      '\u0653': '',
      '\u0654': '',
      '\u0655': '',
    },
  }),
  segment: byCodePoint,
}

export const NAIJA: Alphabet = {
  id: 'pcm',
  endonym: 'Naijá',
  direction: 'ltr',
  // Nigerian Pidgin, written the way its own Wikipedia writes it: the Latin alphabet with
  // no marks at all. Two of the four Nigerian languages needed a decision about tone and this one
  // needs none — one lemma in a hundred carries a mark of any kind, and folding them merges
  // nothing. No Q or X.
  weights: {
    A: 11,
    B: 2,
    C: 3,
    D: 3,
    E: 10,
    F: 2,
    G: 2,
    H: 3,
    I: 9,
    J: 1,
    K: 2,
    L: 5,
    M: 3,
    N: 7,
    O: 8,
    P: 2,
    R: 6,
    S: 7,
    T: 6,
    U: 3,
    V: 1,
    W: 1,
    Y: 2,
    Z: 1,
  },
  vowels: ['A', 'E', 'I', 'O', 'U'],
  rareLetters: ['J', 'V', 'W', 'Z'],
  requires: {},
  fold: folder(),
  segment: byCodePoint,
}

/**
 * Vietnamese, which is the one language here whose tiles carry their tone.
 *
 * Every other language in this file answered the diacritic question one of two ways, and
 * Vietnamese answers it a third. The marks are not decoration, so they cannot fold like French
 * accents; and there are far too many of them to keep as separate letters the way Croatian keeps
 * Č — six tones over twelve vowel shapes is sixty-six marked vowels, which is not an alphabet
 * anyone would hand a player.
 *
 * Except that it is. Vietboard, the one Vietnamese tile game there is, deals every toned vowel
 * as its own tile: six copies of each plain vowel, one copy of each marked one, eighty-nine
 * letters in the bag. That count was arrived at here independently, from the corpus, before the
 * file was found — and it came to eighty-nine as well. What is dropped is F, which occurs in one
 * word of thirty-six thousand and that word is CAFE.
 *
 * Measured rather than assumed, because eighty-nine tiles sounds unplayable: a twelve-tile board
 * admits a median of 64 words with tone on the tile, against 110 with tone folded away. Folding
 * would buy those forty words for 14% of the vocabulary, and the words it charges are not
 * marginal — HOA, HOÀ, HOÁ, HOẠ, HOẢ, HÒA, HÓA, HỌA and HỎA are nine words that would become
 * one. Sixty-four is thin and it is a real game; one word standing for nine is not Vietnamese.
 *
 * **The space is folded away and is not a tile.** Vietnamese writes its words with a space
 * between syllables, and 82% of them have one — SINH VIÊN is a student, and a game of single
 * syllables would be a game of the 16% of the dictionary that stands alone. Vietboard solves
 * this by putting a space tile in the bag at ten points. That does not survive a twelve-tile
 * board: spending one on whitespace drops the median from 64 words to 48. Folding it costs
 * nothing instead — the same 64 words, six times the vocabulary — and it is unambiguous, since
 * folding the spaces out of all 36,353 words leaves 36,341 distinct keys. Nine collisions, six
 * of which are one borrowed word spelt two ways (BA LÔ and BALÔ, Ô TÔ and ÔTÔ). Exactly one is
 * real: KẾTOÁN is both KẾ TOÁN, accounting, and KẾT OÁN, to bear a grudge.
 *
 * What that costs is the writing back. Hebrew restores its final forms in `display` because a
 * rule can find them; a syllable boundary cannot be found by rule, only looked up, and `display`
 * is deliberately a function of the word alone. So a found word is shown ÁCHÂU rather than Á
 * CHÂU. That is a spacing error a Vietnamese reader can read, where Hebrew's would have been a
 * spelling error, and it is the open item on this language. See docs/LANGUAGES.md.
 */
export const VIETNAMESE: Alphabet = {
  id: 'vi',
  endonym: 'Tiếng Việt',
  direction: 'ltr',
  weights: {
    A: 3,
    Á: 2,
    À: 1,
    Ă: 1,
    Ắ: 1,
    Ằ: 1,
    Ẵ: 1,
    Ẳ: 1,
    Â: 1,
    Ấ: 1,
    Ầ: 1,
    Ẫ: 1,
    Ẩ: 1,
    Ã: 1,
    Ả: 1,
    Ạ: 1,
    Ặ: 1,
    Ậ: 1,
    B: 2,
    C: 6,
    D: 1,
    Đ: 2,
    E: 1,
    É: 1,
    È: 1,
    Ê: 1,
    Ế: 1,
    Ề: 1,
    Ễ: 1,
    Ể: 1,
    Ẽ: 1,
    Ẻ: 1,
    Ẹ: 1,
    Ệ: 1,
    G: 6,
    H: 10,
    I: 5,
    Í: 1,
    Ì: 1,
    Ĩ: 1,
    Ỉ: 1,
    Ị: 1,
    K: 1,
    L: 2,
    M: 3,
    N: 12,
    O: 2,
    Ó: 1,
    Ò: 1,
    Ô: 1,
    Ố: 1,
    Ồ: 1,
    Ỗ: 1,
    Ổ: 1,
    Õ: 1,
    Ỏ: 1,
    Ơ: 1,
    Ớ: 1,
    Ờ: 1,
    Ỡ: 1,
    Ở: 1,
    Ợ: 1,
    Ọ: 1,
    Ộ: 1,
    P: 2,
    Q: 1,
    R: 2,
    S: 1,
    T: 7,
    U: 4,
    Ú: 1,
    Ù: 1,
    Ũ: 1,
    Ủ: 1,
    Ư: 1,
    Ứ: 1,
    Ừ: 1,
    Ữ: 1,
    Ử: 1,
    Ự: 1,
    Ụ: 1,
    V: 1,
    X: 1,
    Y: 1,
    Ý: 1,
    Ỳ: 1,
    Ỹ: 1,
    Ỷ: 1,
    Ỵ: 1,
  },
  vowels: [
    'A',
    'À',
    'Á',
    'Â',
    'Ã',
    'Ă',
    'Ạ',
    'Ả',
    'Ấ',
    'Ầ',
    'Ẩ',
    'Ẫ',
    'Ậ',
    'Ắ',
    'Ằ',
    'Ẳ',
    'Ẵ',
    'Ặ',
    'E',
    'È',
    'É',
    'Ê',
    'Ẹ',
    'Ẻ',
    'Ẽ',
    'Ế',
    'Ề',
    'Ể',
    'Ễ',
    'Ệ',
    'I',
    'Ì',
    'Í',
    'Ĩ',
    'Ỉ',
    'Ị',
    'O',
    'Ò',
    'Ó',
    'Ô',
    'Õ',
    'Ơ',
    'Ọ',
    'Ỏ',
    'Ố',
    'Ồ',
    'Ổ',
    'Ỗ',
    'Ộ',
    'Ớ',
    'Ờ',
    'Ở',
    'Ỡ',
    'Ợ',
    'U',
    'Ù',
    'Ú',
    'Ũ',
    'Ư',
    'Ụ',
    'Ủ',
    'Ứ',
    'Ừ',
    'Ử',
    'Ữ',
    'Ự',
    'Y',
    'Ý',
    'Ỳ',
    'Ỵ',
    'Ỷ',
    'Ỹ',
  ],
  rareLetters: ['D', 'K', 'Q', 'S', 'V', 'X'],
  requires: {},
  // Upper-case and drop the spaces, and nothing else: no diacritic stripping, because in
  // Vietnamese every mark either builds the letter (the breve of Ă, the circumflex of Ê, the
  // horn of Ơ) or carries the tone, and both are the word. NFC last so a tile is one code
  // point however the input arrived.
  fold: (key) =>
    key
      .toUpperCase()
      .replace(/[\s\u00a0-]+/gu, '')
      .normalize('NFC'),
  // The same, minus the part that eats the word. 82% of Vietnamese words have a space in
  // them, so this is the language the written form exists for: CHÂU CHẤU ĐÁ XE is a proverb
  // and CHÂUCHẤUĐÁXE is nothing at all.
  write: (raw) => raw.toUpperCase().normalize('NFC'),
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
    SWAHILI,
    LATIN,
    HEBREW,
    ARABIC,
    KOREAN,
    JAPANESE,
    EGYPTIAN_ARABIC,
    POLISH,
    CZECH,
    SLOVAK,
    SLOVENE,
    DANISH,
    CATALAN,
    ESTONIAN,
    LITHUANIAN,
    LATVIAN,
    MACEDONIAN,
    SERBIAN,
    UKRAINIAN,
    BULGARIAN,
    ARMENIAN,
    GEORGIAN,
    BASQUE,
    GALICIAN,
    ICELANDIC,
    WELSH,
    IRISH,
    HUNGARIAN,
    ROMANIAN,
    PERSIAN,
    NAIJA,
    VIETNAMESE,
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
