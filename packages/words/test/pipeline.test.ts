import { describe, expect, it } from 'vitest'
import { FRENCH, GERMAN, SPANISH } from '@blinkered/engine'
import {
  buildValidator,
  foldCandidates,
  formatWordList,
  isAccepted,
  isLowerCase,
  parseFrequencies,
  parseWordList,
  splitTiers,
} from '../src/pipeline.js'
import type { Candidate, Tiers } from '../src/pipeline.js'
import { MINI } from './fixtures.js'

describe('parseFrequencies', () => {
  it('reads the word and its count, in the order given', () => {
    expect(parseFrequencies(['the 100', 'cat 40', 'dog 30'])).toEqual([
      { word: 'the', count: 100 },
      { word: 'cat', count: 40 },
      { word: 'dog', count: 30 },
    ])
  })

  it('skips what it cannot read rather than refusing the language', () => {
    // Corpus output. A blank line or a stray header is not worth failing a build over.
    expect(parseFrequencies(['', '   ', 'countless', 'zero 0', 'nan x', ' 12', 'ok 5'])).toEqual([
      { word: 'ok', count: 5 },
    ])
  })
})

describe('foldCandidates', () => {
  it('ranks by count, commonest first, counting from one', () => {
    const candidates = foldCandidates(
      [
        { word: 'ant', count: 5 },
        { word: 'rate', count: 90 },
        { word: 'sea', count: 40 },
      ],
      MINI,
    )
    expect(candidates.map((c) => [c.word, c.rank])).toEqual([
      ['RATE', 1],
      ['SEA', 2],
      ['ANT', 3],
    ])
  })

  it('breaks ties by spelling, so a rebuild produces no diff', () => {
    const tied = [
      { word: 'ton', count: 7 },
      { word: 'ant', count: 7 },
      { word: 'net', count: 7 },
    ]
    expect(foldCandidates(tied, MINI).map((c) => c.word)).toEqual(['ANT', 'NET', 'TON'])
  })

  it('merges the spellings that fold together and adds their counts', () => {
    // A corpus holds both spellings of a Spanish word; the game has one tile sequence for it.
    const [candidate] = foldCandidates(
      [
        { word: 'acción', count: 60 },
        { word: 'accion', count: 15 },
      ],
      SPANISH,
    )
    expect(candidate).toMatchObject({ word: 'ACCION', count: 75, forms: ['acción', 'accion'] })
  })

  it('drops words the alphabet cannot spell', () => {
    // Q is not a MINI letter, so no tiles exist to play QUIT with.
    const kept = foldCandidates(
      [
        { word: 'quit', count: 99 },
        { word: 'note', count: 10 },
      ],
      MINI,
    )
    expect(kept.map((c) => c.word)).toEqual(['NOTE'])
  })

  it('drops words too short or too long to be reachable, counted in tiles', () => {
    const kept = foldCandidates(
      [
        { word: 'at', count: 99 },
        { word: 'ant', count: 50 },
        { word: 'treason', count: 10 },
      ],
      MINI,
      { minLength: 3, maxLength: 4 },
    )
    expect(kept.map((c) => c.word)).toEqual(['ANT'])
  })
})

describe('buildValidator', () => {
  it('keeps what the source lists, ignoring blanks and whitespace', () => {
    expect(buildValidator([' hiss ', '', '  ', 'grunt'])).toEqual(new Set(['hiss', 'grunt']))
  })

  it('drops capitalised entries, which is how proper nouns go', () => {
    expect(buildValidator(['hiss', 'Hiss', 'James', 'MRS'])).toEqual(new Set(['hiss']))
  })

  it('lower-cases them instead when a language capitalises its nouns', () => {
    // German would lose every noun to that filter, and a frequency list is lower-cased, so
    // German throws the case evidence away on both sides. See DICTIONARIES.md.
    expect(buildValidator(['Haus', 'haben'], { caseRule: 'ignoreCase' })).toEqual(
      new Set(['haus', 'haben']),
    )
  })
})

describe('isLowerCase', () => {
  it('is true only for a word that is lower case and has a case', () => {
    expect(isLowerCase('épée')).toBe(true)
    expect(isLowerCase('слово')).toBe(true)
    expect(isLowerCase('Épée')).toBe(false)
    // No case at all is not lower case: answering yes would let it past a filter for names.
    expect(isLowerCase('1234')).toBe(false)
  })
})

describe('isAccepted', () => {
  const candidate = (forms: string[]): Candidate => ({
    word: 'WORD',
    tiles: 4,
    forms,
    count: 1,
    rank: 1,
  })

  it('needs every group to agree, which is what intersecting sources means', () => {
    const one = new Set(['word'])
    const two = new Set(['other'])
    expect(isAccepted(candidate(['word']), [one])).toBe(true)
    expect(isAccepted(candidate(['word']), [one, two])).toBe(false)
  })

  it('needs only one member of a group, which is what unioning variants means', () => {
    // en-US has "color" and en-GB has "colour"; both are English, so both play.
    const variants = [new Set(['color']), new Set(['colour'])]
    expect(isAccepted(candidate(['colour']), [new Set(['color', 'colour'])])).toBe(true)
    expect(isAccepted(candidate(['colour']), variants)).toBe(false)
  })

  it('accepts a folded word when any of its raw spellings validates', () => {
    // ÉPÉE is validated as the accented spelling and played on plain E tiles.
    const [french] = foldCandidates(
      [
        { word: 'epee', count: 3 },
        { word: 'épée', count: 30 },
      ],
      FRENCH,
    )
    expect(french?.word).toBe('EPEE')
    expect(isAccepted(french as Candidate, [new Set(['épée'])])).toBe(true)
  })
})

describe('splitTiers', () => {
  const ranked = foldCandidates(
    [
      { word: 'senator', count: 100 },
      { word: 'treason', count: 90 },
      { word: 'atones', count: 80 },
      { word: 'ornate', count: 70 },
      { word: 'tonters', count: 60 },
    ],
    MINI,
  )
  const everything = new Set(['senator', 'treason', 'atones', 'ornate'])

  it('cuts by rank and keeps only what a validator accepts', () => {
    const tiers = splitTiers(ranked, [everything], { commonRank: 2, fullRank: 4 }, 400)
    expect(tiers.common).toEqual(['SENATOR', 'TREASON'])
    expect(tiers.full).toEqual(['ATONES', 'ORNATE', 'SENATOR', 'TREASON'])
  })

  it('stops at the full cut rather than reading the whole list', () => {
    const tiers = splitTiers(ranked, [everything], { commonRank: 1, fullRank: 2 }, 400)
    expect(tiers.stats).toMatchObject({
      candidates: 5,
      commonConsidered: 1,
      fullConsidered: 2,
      commonKept: 1,
      fullKept: 2,
      commonYield: 1,
      fullYield: 1,
    })
  })

  it('reports the yield that falls as the cut goes deeper', () => {
    const tiers = splitTiers(ranked, [everything], { commonRank: 5, fullRank: 5 }, 400)
    // TONTERS is spellable, common enough to be a candidate, and still not a word.
    expect(tiers.stats.fullYield).toBeCloseTo(0.8)
  })

  it('reports what share of the corpus the shipped list accounts for', () => {
    const tiers = splitTiers(ranked, [everything], { commonRank: 4, fullRank: 4 }, 400)
    expect(tiers.stats.coverage).toBeCloseTo(340 / 400)
  })

  it('measures nothing against nothing as zero', () => {
    const tiers = splitTiers([], [everything], { commonRank: 1, fullRank: 1 }, 0)
    expect(tiers.stats).toMatchObject({ commonYield: 0, fullYield: 0, coverage: 0 })
  })

  it('accepts every candidate when no credit cut is asked for', () => {
    // The credit tier's job is generosity. A rank cut there rejected WEAL, which sits at rank
    // 85,602 in the English corpus and is a word every English speaker knows.
    const tiers = splitTiers(ranked, [everything], { commonRank: 1 }, 400)
    expect(tiers.common).toEqual(['SENATOR'])
    expect(tiers.full).toEqual(['ATONES', 'ORNATE', 'SENATOR', 'TREASON'])
    expect(tiers.stats.fullConsidered).toBe(5)
  })

  it('ranks a word the corpus has never seen below every cut', () => {
    // A lexicon word arrives with a count of zero, so it earns credit and cannot be one of
    // the words a board is required to be solvable from.
    const withLexicon = foldCandidates(
      [
        { word: 'senator', count: 100 },
        { word: 'atones', count: 0 },
      ],
      MINI,
    )
    const tiers = splitTiers(withLexicon, [everything], { commonRank: 1 }, 100)
    expect(tiers.common).toEqual(['SENATOR'])
    expect(tiers.full).toEqual(['ATONES', 'SENATOR'])
  })

  it('sorts both tiers, so an unchanged rebuild produces no diff', () => {
    const tiers = splitTiers(ranked, [everything], { commonRank: 4, fullRank: 4 }, 400)
    expect(tiers.common).toEqual([...tiers.common].sort())
    expect(tiers.full).toEqual([...tiers.full].sort())
  })
})

describe('formatWordList and parseWordList', () => {
  const tiers: Tiers = {
    common: ['ANT', 'NOTE'],
    full: ['ANT', 'NOTE', 'SENATOR'],
    stats: {
      candidates: 3,
      commonConsidered: 2,
      fullConsidered: 3,
      commonKept: 2,
      fullKept: 3,
      commonYield: 1,
      fullYield: 1,
      coverage: 1,
    },
  }

  it('writes the common tier first and records the split in the header', () => {
    expect(formatWordList('test-mini', tiers)).toBe(
      '#blinkered/wordlist/1 language=test-mini common=2 full=3\nANT\nNOTE\nSENATOR\n',
    )
  })

  it('round-trips', () => {
    const parsed = parseWordList(formatWordList('test-mini', tiers))
    expect(parsed).toEqual({ language: 'test-mini', common: tiers.common, full: tiers.full })
  })

  it('refuses anything that is not a word list', () => {
    // A dev server answers a missing path with its index page, and parsing that as one word
    // would be worse than an error.
    expect(() => parseWordList('<!doctype html>')).toThrow(/not a Blinkered word list/)
  })

  it('refuses a file whose contents do not match its header', () => {
    const truncated = '#blinkered/wordlist/1 language=en common=2 full=9\nANT\nNOTE\n'
    expect(() => parseWordList(truncated)).toThrow(/truncated or mislabelled/)
    const unlabelled = '#blinkered/wordlist/1 language=en\nANT\n'
    expect(() => parseWordList(unlabelled)).toThrow(/truncated or mislabelled/)
    const upsideDown = '#blinkered/wordlist/1 language=en common=2 full=1\nANT\n'
    expect(() => parseWordList(upsideDown)).toThrow(/truncated or mislabelled/)
  })

  it('survives a header with no fields at all', () => {
    expect(() => parseWordList('#blinkered/wordlist/1\n')).toThrow(/truncated or mislabelled/)
  })
})

describe('the German exception', () => {
  const candidates = foldCandidates(
    [
      { word: 'haus', count: 50 },
      { word: 'haben', count: 40 },
    ],
    GERMAN,
  )

  it('loses the nouns under the rule that suits every other language', () => {
    const strict = buildValidator(['Haus', 'haben'])
    expect(splitTiers(candidates, [strict], { commonRank: 2, fullRank: 2 }, 90).full).toEqual([
      'HABEN',
    ])
  })

  it('keeps them once case stops being evidence', () => {
    const relaxed = buildValidator(['Haus', 'haben'], { caseRule: 'ignoreCase' })
    expect(splitTiers(candidates, [relaxed], { commonRank: 2, fullRank: 2 }, 90).full).toEqual([
      'HABEN',
      'HAUS',
    ])
  })
})
