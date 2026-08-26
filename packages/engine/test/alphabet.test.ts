import { describe, expect, it } from 'vitest'
import { byCodePoint, folder, segmentBy, stripDiacritics } from '../src/index.js'

describe('stripDiacritics', () => {
  it('leaves the base letter behind', () => {
    expect(stripDiacritics('épée')).toBe('epee')
    expect(stripDiacritics('père')).toBe('pere')
    expect(stripDiacritics('côté')).toBe('cote')
  })

  it('leaves unaccented text alone', () => {
    expect(stripDiacritics('EPEE')).toBe('EPEE')
  })

  it('cannot touch a letter that is not a base plus a mark', () => {
    // A stroke or a slash is part of the glyph rather than a combining mark, which is a hint
    // that these are letters in their own right: Polish Ł, Croatian Đ, Norwegian Ø.
    expect(stripDiacritics('ŁADNA')).toBe('ŁADNA')
    expect(stripDiacritics('ĐAK')).toBe('ĐAK')
    expect(stripDiacritics('BLØMST')).toBe('BLØMST')
  })
})

describe('folder', () => {
  it('upper-cases and strips by default', () => {
    expect(folder()('épée')).toBe('EPEE')
  })

  it('protects the letters an alphabet considers its own', () => {
    const spanish = folder({ keep: ['Ñ'] })
    expect(spanish('añejo')).toBe('AÑEJO')
    // Everything unprotected still folds away.
    expect(spanish('acción')).toBe('ACCION')
  })

  it('expands a character that stands for several letters', () => {
    const french = folder({ expand: { Œ: 'OE', Æ: 'AE' } })
    expect(french('cœur')).toBe('COEUR')
    expect(french('curriculæ')).toBe('CURRICULAE')
  })

  it('needs no rule for German eszett, because upper-casing already does it', () => {
    expect(folder({ keep: ['Ä', 'Ö', 'Ü'] })('straße')).toBe('STRASSE')
  })

  it('is idempotent, since it runs on both keystrokes and word lists', () => {
    const swedish = folder({ keep: ['Å', 'Ä', 'Ö'] })
    const once = swedish('förälder')
    expect(swedish(once)).toBe(once)
  })

  it('does not let a protected letter be mistaken for its guard', () => {
    // The guard characters must be sequences no word can contain, or a word holding one
    // would come back mangled.
    const guarded = folder({ keep: ['Ä', 'Ö'] })
    expect(guarded('ÄÖÄÖ')).toBe('ÄÖÄÖ')
    expect(guarded('0Ä1Ö0')).toBe('0Ä1Ö0')
  })
})

describe('segmentBy', () => {
  const segment = segmentBy(['DŽ', 'LJ', 'NJ', 'A', 'D', 'E', 'J', 'L', 'N', 'Ž'])

  it('prefers the longest letter at each position', () => {
    expect(segment('DŽELA')).toEqual(['DŽ', 'E', 'L', 'A'])
    expect(segment('DELA')).toEqual(['D', 'E', 'L', 'A'])
  })

  it('does not let a digraph swallow the wrong letters', () => {
    expect(segment('JADŽ')).toEqual(['J', 'A', 'DŽ'])
    expect(segment('LJNJ')).toEqual(['LJ', 'NJ'])
    expect(segment('LNJ')).toEqual(['L', 'NJ'])
  })

  it('passes through anything the alphabet does not know, one code point at a time', () => {
    // Survives so the word list can drop it, rather than being silently mangled here.
    expect(segment("A'D")).toEqual(['A', "'", 'D'])
  })
})

describe('byCodePoint', () => {
  it('gives one tile per code point', () => {
    expect(byCodePoint('ŁADNA')).toEqual(['Ł', 'A', 'D', 'N', 'A'])
  })
})
