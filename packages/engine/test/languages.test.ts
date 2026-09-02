import { describe, expect, it } from 'vitest'
import { ALPHABET_IDS, DEFAULT_LANGUAGE, alphabetFor, configFor } from '../src/index.js'

/** One probe per language: a word that exercises that alphabet's diacritic policy. */
const PROBES: Readonly<Record<string, readonly [string, string, number]>> = {
  en: ['naive', 'NAIVE', 5],
  fr: ['épée', 'EPEE', 4],
  es: ['añejo', 'AÑEJO', 5],
  it: ['perché', 'PERCHE', 6],
  de: ['straße', 'STRASSE', 7],
  nl: ['coëfficiënt', 'COEFFICIENT', 11],
  pt: ['ação', 'AÇAO', 4],
  // Same alphabet as pt, different word list. A spelling the two variants disagree on.
  'pt-BR': ['ônibus', 'ONIBUS', 6],
  hr: ['džemper', 'DŽEMPER', 6],
  ms: ['makan', 'MAKAN', 5],
  id: ['makan', 'MAKAN', 5],
  ru: ['ёлка', 'ЕЛКА', 4],
  sv: ['förälder', 'FÖRÄLDER', 8],
  no: ['blåbær', 'BLÅBÆR', 6],
  fi: ['hyvää', 'HYVÄÄ', 5],
  el: ['καλημέρα', 'ΚΑΛΗΜΕΡΑ', 8],
  af: ['wêreld', 'WERELD', 6],
  // The dotted i, which is the whole Turkish case trap; the dotless one has its own test.
  tr: ['iğne', 'İĞNE', 4],
  // NG is two tiles, so six letters are six tiles, and the stress acute is decoration.
  tl: ['ngayón', 'NGAYON', 6],
  // The apostrophe in NG' is dropped rather than tiled, so a cow is five tiles.
  sw: ["ng'ombe", 'NGOMBE', 6],
  // A macron is a teaching aid, not a spelling.
  la: ['amāre', 'AMARE', 5],
  // Niqqud are marks, and the final mem is the same tile as the ordinary one.
  he: ['שָׁלוֹם', 'שלומ', 4],
  // Alef with maddah is alef, and the harakat are not tiles.
  ar: ['الآن', 'الان', 4],
  // A syllable is its letters: 한 is ㅎ + ㅏ + ㄴ, and the compound final in 없 is two tiles.
  ko: ['한글', 'ㅎㅏㄴㄱㅡㄹ', 6],
}

describe('the language registry', () => {
  it('covers every language asked for', () => {
    expect([...ALPHABET_IDS].sort()).toEqual([
      'af',
      'ar',
      'de',
      'el',
      'en',
      'es',
      'fi',
      'fr',
      'he',
      'hr',
      'id',
      'it',
      'ko',
      'la',
      'ms',
      'nl',
      'no',
      'pt',
      'pt-BR',
      'ru',
      'sv',
      'sw',
      'tl',
      'tr',
    ])
  })

  it('defaults to English', () => {
    expect(DEFAULT_LANGUAGE).toBe('en')
    expect(configFor('medium').language).toBe('en')
  })

  it('refuses a language it has no alphabet for', () => {
    expect(() => alphabetFor('xx')).toThrow(RangeError)
  })

  it('has a probe for every language, so none goes unexercised', () => {
    expect(Object.keys(PROBES).sort()).toEqual([...ALPHABET_IDS].sort())
  })
})

describe.each(ALPHABET_IDS)('%s', (id) => {
  const alphabet = alphabetFor(id)
  const [raw, folded, tiles] = PROBES[id] as readonly [string, string, number]

  it('is internally coherent', () => {
    const letters = Object.keys(alphabet.weights)
    expect(letters.length).toBeGreaterThan(15)
    expect(alphabet.endonym).not.toBe('')
    expect(Object.values(alphabet.weights).every((weight) => weight > 0)).toBe(true)
    for (const vowel of alphabet.vowels) expect(letters).toContain(vowel)
    for (const rare of alphabet.rareLetters) expect(letters).toContain(rare)
    for (const [letter, needs] of Object.entries(alphabet.requires)) {
      expect(letters).toContain(letter)
      for (const companion of needs) expect(letters).toContain(companion)
    }
    // A board needs both kinds of tile to be playable at all.
    expect(alphabet.vowels.length).toBeGreaterThan(0)
    expect(letters.length - alphabet.vowels.length).toBeGreaterThan(0)
  })

  it('folds its own diacritic policy correctly', () => {
    expect(alphabet.fold(raw)).toBe(folded)
    // Folding is idempotent, which matters because it runs on both keys and word lists.
    expect(alphabet.fold(alphabet.fold(raw))).toBe(folded)
  })

  it('segments a folded word into playable tiles', () => {
    const segments = alphabet.segment(alphabet.fold(raw))
    expect(segments).toHaveLength(tiles)
    const playable = new Set(Object.keys(alphabet.weights))
    for (const tile of segments) expect(playable.has(tile)).toBe(true)
  })
})

describe('Turkish', () => {
  const turkish = alphabetFor('tr')

  it('keeps the dotless and the dotted i apart', () => {
    // The default `toUpperCase` sends both to a plain I, which would make these one word.
    expect(turkish.fold('ılık')).toBe('ILIK')
    expect(turkish.fold('ilik')).toBe('İLİK')
    expect(turkish.fold('ılık')).not.toBe(turkish.fold('ilik'))
  })

  it('deals both of them as separate tiles', () => {
    const letters = Object.keys(turkish.weights)
    expect(letters).toContain('I')
    expect(letters).toContain('İ')
  })

  it('treats the circumflex as decoration', () => {
    expect(turkish.fold('kâğıt')).toBe('KAĞIT')
  })
})

describe('Hebrew', () => {
  const hebrew = alphabetFor('he')

  it('runs right to left', () => {
    expect(hebrew.direction).toBe('rtl')
  })

  it('tiles a final letter as its ordinary form', () => {
    // A tile cannot be two shapes, so the five finals fold, exactly as Hebrew Scrabble does it.
    expect(hebrew.fold('שלום')).toBe('שלומ')
    expect(hebrew.fold('מים')).toBe('מימ')
    // And so a board holding one mem can spell a word that ends in one.
    expect(hebrew.segment(hebrew.fold('מים'))).toEqual(['מ', 'י', 'מ'])
  })

  it('writes the final form back when the word is finished', () => {
    // Called through the alphabet rather than lifted off it, which is the habit the lint asks
    // for and the right one: `display` is a method and only ever called as one.
    expect(hebrew.display?.('שלומ')).toBe('שלום')
    expect(hebrew.display?.('מימ')).toBe('מים')
    // Only at the end. The mem in the middle of מימ stays ordinary.
    expect(hebrew.display?.('ילד')).toBe('ילד')
  })
})

describe('Arabic', () => {
  const arabic = alphabetFor('ar')

  it('runs right to left', () => {
    expect(arabic.direction).toBe('rtl')
  })

  it('folds every alef and every hamza carrier onto its letter', () => {
    expect(arabic.fold('أحمد')).toBe('احمد')
    expect(arabic.fold('إلى')).toBe('الى')
    expect(arabic.fold('الآن')).toBe('الان')
    expect(arabic.fold('مسؤول')).toBe('مسوول')
    expect(arabic.fold('قائمة')).toBe('قايمة')
  })

  it('folds a decomposed hamza the same way as a composed one', () => {
    // The combining hamza is not a Unicode diacritic, so it survives `stripDiacritics` and
    // would have wanted a tile of its own. Listing it is what stops that.
    expect(arabic.fold('أ'.normalize('NFD'))).toBe('ا')
    expect(arabic.fold('أ')).toBe(arabic.fold('أ'.normalize('NFD')))
  })

  it('keeps a standalone hamza, which is a letter rather than a mark', () => {
    // شي is a word, so folding the hamza away would merge two of them.
    expect(arabic.fold('شيء')).toBe('شيء')
    expect(arabic.segment('شيء')).toHaveLength(3)
  })

  it('drops the harakat and the tatweel', () => {
    expect(arabic.fold('كِتَاب')).toBe('كتاب')
    expect(arabic.fold('كــتــاب')).toBe('كتاب')
  })
})

describe('Korean', () => {
  const korean = alphabetFor('ko')

  it('deals exactly the keys of a Korean keyboard', () => {
    // Forty. Unicode gives a compound final its own code point and tiling those would have been
    // easier, but they reach 0.7% of the vocabulary and three of them reach none of it.
    expect(Object.keys(korean.weights)).toHaveLength(40)
    for (const compound of [...'ㄳㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ']) {
      expect(Object.keys(korean.weights)).not.toContain(compound)
    }
  })

  it('takes a syllable apart into its letters and puts it back', () => {
    const round = (word: string): string => korean.display?.(korean.fold(word)) ?? ''
    for (const word of ['한글', '앉다', '없다', '읽다', '많다', '괜찮다', '왜', '값', '의사']) {
      expect(round(word), word).toBe(word)
    }
  })

  it('tells a final consonant from the next syllable by what follows it', () => {
    // The entire rule, and the only thing separating these pairs.
    expect(korean.display?.(korean.fold('국어'))).toBe('국어')
    expect(korean.display?.(korean.fold('구거'))).toBe('구거')
    expect(korean.display?.(korean.fold('없다'))).toBe('없다')
    expect(korean.display?.(korean.fold('업소'))).toBe('업소')
    expect(korean.display?.(korean.fold('읽다'))).toBe('읽다')
    expect(korean.display?.(korean.fold('일가'))).toBe('일가')
  })
})

describe('a Korean word part way through being built', () => {
  const korean = alphabetFor('ko')

  it('shows as far as it composes and leaves the rest as letters', () => {
    // The word line asks for this on every keystroke, because it spells the word as it goes.
    // ㅎㅏㄴㄱ is 한 and then a ㄱ waiting for a vowel, and that is what a reader should see.
    expect(korean.display?.('ㅎㅏㄴㄱ')).toBe('한ㄱ')
    expect(korean.display?.('ㅎ')).toBe('ㅎ')
    expect(korean.display?.('')).toBe('')
  })

  it('leaves a letter that cannot start a syllable alone', () => {
    // A lone vowel is not a syllable: Korean puts a silent ㅇ in front of one.
    expect(korean.display?.('ㅏ')).toBe('ㅏ')
    expect(korean.display?.('ㅏㅎㅏㄴ')).toBe('ㅏ한')
  })
})
