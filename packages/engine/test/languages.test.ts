import { describe, expect, it } from 'vitest'
import { ALPHABET_IDS, DEFAULT_LANGUAGE, alphabetFor, configFor, writeFor } from '../src/index.js'

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
  // Katakana onto hiragana, the long mark kept, and the voicing dropped: ラーメン is four tiles.
  ja: ['ラーメン', 'らーめん', 4],
  // Egyptian Arabic writes with the same letters and folds the same way. إزاي is "how".
  arz: ['إزاي', 'ازاي', 4],
  // Polish keeps its nine marked letters: ŁÓDŹ is a city and LODZ is nothing.
  pl: ['Łódź', 'ŁÓDŹ', 4],
  // Czech length is a letter, so BÝT (to be) keeps its Ý and stays four tiles.
  cs: ['být', 'BÝT', 3],
  // Slovak's syllabic Ĺ: VĹČA is a wolf cub, and the mark is the vowel.
  sk: ['vĺča', 'VĹČA', 4],
  sl: ['ključ', 'KLJUČ', 5],
  // Danish Å is a letter and not an A: ÅL is an eel.
  da: ['ål', 'ÅL', 2],
  // Catalan folds the accent and keeps Ç; the ela geminada's interpunct is dropped, so
  // COL·LEGI is seven tiles rather than eight.
  ca: ['col·legi', 'COLLEGI', 7],
  // Estonian Õ is a letter and Š is not a tile at all: it folds onto S.
  et: ['sõdurišokolaad', 'SÕDURISOKOLAAD', 14],
  // Lithuanian's hooks and macrons are letters. KĄSTI is to bite.
  lt: ['kąsti', 'KĄSTI', 5],
  // Latvian macrons are letters: KĀZAS is a wedding and KAZAS is goats.
  lv: ['kāzas', 'KĀZAS', 5],
  // Macedonian Ѓ decomposes to Г plus an acute, so it has to be protected by name.
  mk: ['ѓавол', 'ЃАВОЛ', 5],
  sr: ['џеп', 'ЏЕП', 3],
  // Ukrainian Й and Ї both decompose, and both survive. МІЙ is "my".
  uk: ['мій', 'МІЙ', 3],
  // Bulgarian Ъ is a vowel here rather than Russian's hard sign.
  bg: ['българия', 'БЪЛГАРИЯ', 8],
  hy: ['հայերեն', 'ՀԱՅԵՐԵՆ', 7],
  // Georgian is unicameral, and upper-casing it would deal Mtavruli. It must not change.
  ka: ['ქართული', 'ქართული', 7],
  eu: ['etxe', 'ETXE', 4],
  gl: ['ollo', 'OLLO', 4],
  // Icelandic acutes are letters, and Þ and Ð are the two English lost.
  is: ['þjóð', 'ÞJÓÐ', 4],
  // Welsh digraphs are two tiles each, so LLAN is four rather than three, and the to-bach folds.
  cy: ['llŷn', 'LLYN', 4],
  // The Irish fada is a letter: SEÁN is a name and SEAN is "old".
  ga: ['seán', 'SEÁN', 4],
  // Hungarian Ő and Ö are different letters. TŐRÖK is "daggers", TÖRÖK is "Turkish".
  hu: ['tőrök', 'TŐRÖK', 5],
  // Romanian's two spellings of ș converge: the Turkish cedilla folds onto the comma below.
  ro: ['şi', 'ȘI', 2],
  // Persian folds the Arabic look-alikes onto its own letters, and drops the ZWNJ that holds
  // می apart from the verb after it.
  fa: ['كتاب', 'کتاب', 4],
  // Naija carries no marks at all, which is the whole of its diacritic decision.
  pcm: ['sabi', 'SABI', 4],
  // Vietnamese holds its tone on the tile and folds the space away, so the two syllables of
  // SINH VIÊN arrive as seven tiles and no gap.
  vi: ['sinh viên', 'SINHVIÊN', 8],
}

describe('the language registry', () => {
  it('covers every language asked for', () => {
    expect([...ALPHABET_IDS].sort()).toEqual([
      'af',
      'ar',
      'arz',
      'bg',
      'ca',
      'cs',
      'cy',
      'da',
      'de',
      'el',
      'en',
      'es',
      'et',
      'eu',
      'fa',
      'fi',
      'fr',
      'ga',
      'gl',
      'he',
      'hr',
      'hu',
      'hy',
      'id',
      'is',
      'it',
      'ja',
      'ka',
      'ko',
      'la',
      'lt',
      'lv',
      'mk',
      'ms',
      'nl',
      'no',
      'pcm',
      'pl',
      'pt',
      'pt-BR',
      'ro',
      'ru',
      'sk',
      'sl',
      'sr',
      'sv',
      'sw',
      'tl',
      'tr',
      'uk',
      'vi',
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

  it('names its own alphabet, sorting having no way to know', () => {
    // ء sorts first and is not one of the twenty-eight, so the rules page read ء … ي.
    expect(arabic.recited).toEqual(['ا', 'ي'])
    for (const letter of arabic.recited ?? []) {
      expect(Object.keys(arabic.weights)).toContain(letter)
    }
  })

  it('is one of only three that have to say so, and all three write this script', () => {
    // Every other language's row comes out right by sorting its tiles with its own collation.
    // This is the check that a new one has been looked at rather than assumed. Persian joins
    // them for the same reason and a different letter: it recites ا … ی, and the collator does
    // not put ی last.
    const naming = ALPHABET_IDS.filter((id) => alphabetFor(id).recited !== undefined)
    expect([...naming].sort()).toEqual(['ar', 'arz', 'fa'])
    expect(alphabetFor('fa').recited).toEqual(['ا', 'ی'])
    for (const letter of alphabetFor('fa').recited ?? []) {
      expect(Object.keys(alphabetFor('fa').weights)).toContain(letter)
    }
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

describe('Japanese', () => {
  const japanese = alphabetFor('ja')

  it('deals the gojūon and the long mark, and nothing else', () => {
    // Forty-seven, which is what a もじぴったん deck holds. Eighty-four kana would be the
    // faithful inventory and an unplayable one.
    expect(Object.keys(japanese.weights)).toHaveLength(47)
  })

  it('plays a plain kana as its voiced one, the way a Japanese word game does', () => {
    // 濁音や半濁音を付けた形で読むことができ: the は card is played as ば.
    expect(japanese.fold('がっこう')).toBe('かつこう')
    expect(japanese.fold('ばば')).toBe(japanese.fold('はは'))
    expect(japanese.fold('ぱん')).toBe(japanese.fold('はん'))
  })

  it('plays a large kana as its small one', () => {
    // ちよこ is read ちょこ, and つ stands in for っ.
    expect(japanese.fold('ちょこ')).toBe('ちよこ')
    expect(japanese.fold('しゃしん')).toBe('しやしん')
  })

  it('does not merge きって and きて, which the mora count keeps apart', () => {
    // The worry that made the first plan refuse to fold small kana. It was misplaced: folding
    // the size does not remove the mora, so one word is three tiles and the other is two.
    expect(japanese.fold('きって')).toBe('きつて')
    expect(japanese.fold('きて')).toBe('きて')
    expect(japanese.fold('きって')).not.toBe(japanese.fold('きて'))
  })

  it('tiles a borrowed word with the same letters as a native one', () => {
    expect(japanese.fold('ラーメン')).toBe('らーめん')
    expect(japanese.segment(japanese.fold('とうきょう'))).toEqual([...'とうきよう'])
  })

  it('draws to its own vowel share rather than the default', () => {
    // Every kana is already a syllable, so the floor that keeps other alphabets speakable has
    // nothing to do here and 35% would spend a third of the board on the three rarest tiles.
    expect(japanese.vowelShare).toBe(0.17)
  })
})

describe('writing a word back', () => {
  it('restores what the fold dropped, and only that', () => {
    // The fold is lossy by design and the loss is the word itself. These are the three shapes
    // it takes: an accent that is decoration, a character standing for two letters, and a
    // space. Each is checked against its own alphabet, since the policy is per language.
    expect(writeFor(alphabetFor('fr'))('épée')).toBe('ÉPÉE')
    expect(alphabetFor('fr').fold('épée')).toBe('EPEE')
    expect(writeFor(alphabetFor('vi'))('châu chấu đá xe')).toBe('CHÂU CHẤU ĐÁ XE')
    expect(alphabetFor('vi').fold('châu chấu đá xe')).toBe('CHÂUCHẤUĐÁXE')
  })

  it('upper-cases by the language\u2019s own rules, not the default ones', () => {
    // The writer and the fold have to agree about case or the rail is written in a different
    // alphabet from the board. Turkish is where a plain toUpperCase gets it wrong.
    expect(writeFor(alphabetFor('tr'))('ılık')).toBe('ILIK')
    expect(writeFor(alphabetFor('tr'))('ilik')).toBe('İLİK')
  })

  it('never invents a spelling for an alphabet that has not asked for one', () => {
    // The safe default: absent means the fold threw nothing away worth keeping, so writing a
    // word gives back exactly what tiling it gives. A new language that forgets to answer
    // keeps its old behaviour rather than growing a second spelling nobody checked.
    for (const id of ALPHABET_IDS) {
      const alphabet = alphabetFor(id)
      if (alphabet.write !== undefined) continue
      const write = writeFor(alphabet)
      for (const probe of ['ABC', 'abc']) {
        expect(write(probe), id).toBe(alphabet.fold(probe))
      }
    }
  })

  it('does not upper-case Georgian, which has no upper case worth having', () => {
    // Mkhedruli has a Mtavruli upper case for headings, and using it would deal a different
    // script. Georgian has no `write`, so it falls through to its own fold, which is the
    // whole point of that default.
    expect(writeFor(alphabetFor('ka'))('ქართული')).toBe('ქართული')
  })
})
