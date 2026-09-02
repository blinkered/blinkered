/**
 * Everything about the game that is a fact about a language rather than a fact about the
 * rules. The reducer, the scoring and the economy never look in here; only letter drawing,
 * board acceptance and keyboard folding do.
 *
 * A tile holds a `string`, not a character, and word length is counted in tiles, so an
 * alphabet whose letters are digraphs (Croatian LJ, NJ, DŽ) needs no engine change.
 */
export interface Alphabet {
  /** BCP 47 language tag. Stored with every game, so an old result stays interpretable. */
  readonly id: string
  /** The language's own name for itself, for a menu that a speaker can read. */
  readonly endonym: string
  /**
   * Which way the script runs, which is what "reading order" means everywhere else.
   *
   * The reducer never looks at it: tiles have positions and nothing more. What it settles is
   * how those positions are laid out, which way a word line grows, and which corner an order
   * badge sits in. Required rather than defaulted, so a new language has to answer it.
   */
  readonly direction: 'ltr' | 'rtl'
  /** Draw weight per letter. Relative, so any scale works. */
  readonly weights: Readonly<Record<string, number>>
  /** Which of those letters count as vowels, for the vowel floor in a draw. */
  readonly vowels: readonly string[]
  /**
   * How much of a board should come from the vowel bag, where the default is wrong.
   *
   * The floor exists so a draw cannot come out unspeakable, and 0.35 is right for an alphabet
   * whose consonants cannot be said on their own. A kana script has no such consonants: every
   * tile is already a syllable, so the floor has nothing to do and spending a third of the
   * board on bare あいうえお only makes a worse board. Japanese sets its own measured share.
   *
   * Absent everywhere else, and deliberately so. Greek runs a 49% vowel share and Arabic 29%,
   * and both play well on 0.35; changing it for them would change every board they have ever
   * dealt, for no fault anyone has reported.
   */
  readonly vowelShare?: number
  /** Letters a board may not hold twice: too rare to be usable in pairs. */
  readonly rareLetters: readonly string[]
  /**
   * The first and last letters of the alphabet as the language recites it, where sorting the
   * tiles does not arrive at the same answer.
   *
   * The rules page names an alphabet by its ends — `A … Z`, `А … Я`, `א … ת` — and takes them
   * by sorting the tiles with the language's own collation, which is right for twenty-four of
   * the twenty-five. Arabic is the exception, because three of its tiles are letters a board
   * needs and the alphabet is not recited with: ة and ى are positional forms of ت and ي, and
   * ء is a mark that became a letter. The collator puts ء first, so the row read ء … ي, which
   * is not wrong so much as not something anybody says.
   *
   * Japanese wants the same thing and does not need this, because Unicode already knows ー is a
   * modifier letter rather than a letter. There is no equivalent property here, so Arabic says
   * it out loud.
   */
  readonly recited?: readonly [string, string]
  /**
   * Letters that are dead without a companion. In English a Q with no U can be revealed and
   * never used. Empty for languages where every letter stands alone.
   */
  readonly requires: Readonly<Record<string, readonly string[]>>
  /**
   * Folds a typed key onto a tile letter, and a dictionary entry onto tiles.
   *
   * This is where a language's diacritic policy lives. French E-acute is an E wearing an
   * accent, so it folds away and EPEE and PERE both play on plain E tiles. Croatian Č and
   * Swedish Ö are letters in their own right, so they survive folding and get their own
   * tiles. The difference is a fact about the alphabet, not about Unicode.
   */
  fold(key: string): string
  /**
   * Splits a word into tiles. One code point per tile for most alphabets; an alphabet with
   * digraph letters needs greedy longest-match, which `segmentBy` builds.
   */
  segment(word: string): string[]
  /**
   * How a finished word is written, where that differs from how it is tiled.
   *
   * Only Hebrew needs it. Five of its letters take a different shape at the end of a word, and
   * a tile cannot be two shapes, so the tiles carry the ordinary form and the spelling is put
   * back here. Without it every Hebrew word in the rail would end a letter short of correct:
   * שלומ rather than שלום, which to a Hebrew reader is not a spelling at all.
   *
   * Absent everywhere else, and the caller treats absent as identity. It is display only: the
   * dictionary, the scoring and the tiles all use the folded form.
   */
  display?(word: string): string
}

/**
 * Drops diacritics, leaving the base letter. The whole transform for a language whose
 * accented forms are not separate letters of its alphabet.
 */
export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export interface FoldOptions {
  /** Letters whose mark is part of the letter and must survive: Spanish Ñ, Swedish Ö. */
  readonly keep?: readonly string[]
  /** Characters standing in for several letters: French Œ becomes OE. */
  readonly expand?: Readonly<Record<string, string>>
  /**
   * Whose rules to upper-case by, for the one language where the default is wrong.
   *
   * `toUpperCase` sends both Turkish i's to a plain I, which would merge ILIK and İLİK into
   * one word. Under `tr` the dotless one keeps its I and the dotted one becomes İ, which is
   * what Turkish spelling means by them.
   */
  readonly locale?: string
}

/**
 * Builds a fold: upper-case, expand any stand-in characters, then drop the diacritics that
 * are decoration while protecting the ones that are letters.
 *
 * Upper-casing does some of this already, and correctly: German eszett upper-cases to SS on
 * its own, which is exactly how German word games spell it.
 */
export function folder(options: FoldOptions = {}): (key: string) => string {
  const kept = options.keep ?? []
  const expand = Object.entries(options.expand ?? {})
  const locale = options.locale
  // Guard the protected letters behind characters no alphabet contains, strip, put them back.
  const guards = kept.map((letter, index) => [letter, `\u0001${String(index)}\u0001`] as const)

  return (key) => {
    let text = locale === undefined ? key.toUpperCase() : key.toLocaleUpperCase(locale)
    for (const [from, to] of expand) text = text.split(from).join(to)
    if (guards.length === 0) return stripDiacritics(text)
    for (const [letter, guard] of guards) text = text.split(letter).join(guard)
    text = stripDiacritics(text)
    for (const [letter, guard] of guards) text = text.split(guard).join(letter)
    return text
  }
}

/**
 * Builds a greedy longest-match segmenter for an alphabet with multi-character letters, so
 * a Croatian LJ tile wins over an L tile at the same position. Anything the alphabet does
 * not know survives as a single code point, to be dropped when the word list is filtered.
 */
export function segmentBy(letters: readonly string[]): (word: string) => string[] {
  const ordered = [...letters].sort((a, b) => b.length - a.length)
  return (word) => {
    const tiles: string[] = []
    let at = 0
    while (at < word.length) {
      const letter = ordered.find((candidate) => word.startsWith(candidate, at))
      if (letter === undefined) {
        const codePoint = String.fromCodePoint(word.codePointAt(at) as number)
        tiles.push(codePoint)
        at += codePoint.length
        continue
      }
      tiles.push(letter)
      at += letter.length
    }
    return tiles
  }
}

/** One code point per tile: correct for every alphabet without digraph letters. */
export const byCodePoint = (word: string): string[] => [...word]
