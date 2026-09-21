import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ALPHABET_IDS, alphabetFor } from '@blinkered/engine'
import { parseWordList } from '../src/index.js'

/*
 * The written form has to be the same word, written properly.
 *
 * It is produced at build time from the raw corpus spelling, which is the only place the
 * unfolded word still exists, and then never checked again — so this reads the shipped files,
 * the one place the fold and the writer meet. Two faults it is aimed at, both found by looking
 * at real output rather than by reasoning:
 *
 * - **A spelling that is a different word.** If the writer disagrees with the fold about case,
 *   the rail is written in a different alphabet from the board. Turkish dotted I and Georgian
 *   Mtavruli are each one careless `toUpperCase` away.
 * - **Corpus punctuation smuggled in as a letter.** OpenSubtitles writes an apostrophe as a
 *   backtick and Russian frequency lists mark stress with one, so `you`ve` and `Б`ЕТОР` both
 *   arrived looking like spellings. `stripDiacritics` had been deleting these silently for a
 *   year, which is why nobody had seen one.
 */
const DATA = fileURLToPath(new URL('../data/', import.meta.url))
const shipped = ALPHABET_IDS.filter((tag) => existsSync(`${DATA}${tag}/words.txt`))

function read(tag: string): ReturnType<typeof parseWordList> {
  return parseWordList(readFileSync(`${DATA}${tag}/words.txt`, 'utf8'))
}

describe('every written form', () => {
  it.each(shipped)('%s', (tag) => {
    const { written } = read(tag)
    const alphabet = alphabetFor(tag)

    const wrong: { word: string; spelling: string; folds: string }[] = []
    const punctuated: { word: string; spelling: string }[] = []
    for (const [word, spelling] of written) {
      // Folding the spelling has to give back the word it is stored under. Anything else is a
      // second word in the file wearing the first one's key.
      const folds = alphabet.fold(spelling)
      if (folds !== word) wrong.push({ word, spelling, folds })
      // A letter, a mark on a letter, or a word boundary. Nothing else is spelling.
      //
      // Both boundaries earn their place. Vietnamese writes a compound with spaces and a
      // transliterated loanword with hyphens — A-LÊ-HẤP, BA-LÊ — and the fold eats both.
      // Across all fifty-one languages those two characters are the only non-letters that
      // appear at all, which is what makes this worth asserting rather than hoping.
      if (/[^\p{L}\p{M}\p{Nd} -]/u.test(spelling)) punctuated.push({ word, spelling })
    }

    expect(wrong.slice(0, 5)).toEqual([])
    expect(punctuated.slice(0, 5)).toEqual([])
  })

  it('stores a spelling only where it says something the folded word does not', () => {
    // The sparse half of the format. A spelling identical to its key is bytes for nothing and
    // a sign the writer is running where it has no work to do.
    for (const tag of shipped) {
      const { written } = read(tag)
      const idle = [...written].filter(([word, spelling]) => word === spelling)
      expect(idle.slice(0, 3), tag).toEqual([])
    }
  })

  it('leaves the words themselves alone, whatever it writes beside them', () => {
    // The format's one hard promise. Every consumer but the rail reads column one, so a
    // spelling that shifted a word would change the dictionary, the board and the scoring.
    //
    // Asked of every shipped language rather than of one. It used to be asked of Vietnamese,
    // because Vietnamese was the language the rail exists for -- the fold eats the spaces and
    // 82% of its words have one -- and Vietnamese does not ship while its dictionary is being
    // attested. Generalising was the right answer anyway: the promise was never Vietnamese's.
    for (const tag of shipped) {
      const { full, common } = read(tag)
      expect(full.filter((word) => word.includes('\t')).slice(0, 3), tag).toEqual([])
      const known = new Set(full)
      expect(common.filter((word) => !known.has(word)).slice(0, 3), tag).toEqual([])
    }
  })

  it('has nothing to write for any language shipping today', () => {
    /*
     * A statement of fact, and a tripwire rather than a satisfying test.
     *
     * The rail is exercised by two languages and neither ships right now: Vietnamese, where
     * the fold eats the spaces out of 82% of the vocabulary, and Hebrew, which used it six
     * times. The seven attested lists are all languages that fold onto themselves, so the
     * spelling map is empty everywhere and the checks above run over nothing.
     *
     * That is a gap, and it is written down here rather than left for somebody to discover.
     * When this fails, a language that writes its words differently from how it tiles them has
     * come back, and the dense case is worth pinning again the way Vietnamese used to pin it:
     * one known compound, and a spelling map covering over half the list.
     */
    const carrying = shipped.filter((tag) => read(tag).written.size > 0)
    expect(carrying, 'a language with written forms is back; restore the dense case').toEqual([])
  })
})
