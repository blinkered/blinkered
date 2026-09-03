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
  /**
   * How a raw dictionary spelling is written on screen, where the fold threw something away.
   *
   * `fold` is lossy on purpose: French ÉPÉE plays on plain E tiles and Vietnamese CHÂU CHẤU
   * plays with no space tile. What it costs is the word itself. The folded key is the only
   * thing a word list held, so the rail printed EPEE and, worse, CHÂUCHẤUĐÁXE — one run-on
   * where the language has four words.
   *
   * `display` cannot fix that: it takes the folded word, so it can only do what a rule can
   * find, which is why Hebrew's final forms work and a space does not. This runs at build
   * time instead, on the raw spelling the corpus had, and the result is stored beside the
   * folded key. See `formatWordList`.
   *
   * Absent means the fold threw nothing away worth keeping, and the caller treats absent as
   * `fold` — so a language that forgets to answer keeps exactly its old behaviour rather than
   * inventing a spelling.
   */
  readonly write?: (raw: string) => string
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
export type Fold = ((key: string) => string) & {
  /** How to write what this fold discards. Attached by `folder`; see `writeFor`. */
  readonly write?: (raw: string) => string
}

export function folder(options: FoldOptions = {}): Fold {
  const kept = options.keep ?? []
  const expand = Object.entries(options.expand ?? {})
  const locale = options.locale
  // Guard the protected letters behind characters no alphabet contains, strip, put them back.
  const guards = kept.map((letter, index) => [letter, `\u0001${String(index)}\u0001`] as const)

  const fold = (key: string): string => {
    let text = locale === undefined ? key.toUpperCase() : key.toLocaleUpperCase(locale)
    for (const [from, to] of expand) text = text.split(from).join(to)
    if (guards.length === 0) return stripDiacritics(text)
    for (const [letter, guard] of guards) text = text.split(letter).join(guard)
    text = stripDiacritics(text)
    for (const [letter, guard] of guards) text = text.split(guard).join(letter)
    return text
  }

  // Attached rather than declared on every alphabet, because the writer is a function of the
  // same options and there are forty-four of them. An alphabet whose fold is hand-written
  // answers with its own `write`; one built here never has to.
  return Object.assign(fold, { write: writer(options) })
}

/**
 * Builds the display counterpart of a `folder`: the same case rule and the same expansions,
 * without the stripping.
 *
 * The two have to agree about case or the rail is written in a different alphabet from the
 * board — Turkish dotted I and Georgian Mtavruli are both one careless `toUpperCase` away.
 * Expansions are applied here too, deliberately: Œ stands for two letters, and showing it
 * beside an O tile and an E tile reads as a fault rather than as spelling.
 */
export function writer(options: FoldOptions = {}): (raw: string) => string {
  const expand = Object.entries(options.expand ?? {})
  const locale = options.locale

  return (raw) => {
    let text = locale === undefined ? raw.toUpperCase() : raw.toLocaleUpperCase(locale)
    for (const [from, to] of expand) text = text.split(from).join(to)
    return text.replace(LOOSE_ACCENT, '').normalize('NFC')
  }
}

/**
 * A diacritic standing on its own rather than sitting on a letter, which is corpus noise
 * every time.
 *
 * `stripDiacritics` deletes these silently and nobody noticed, because deleting them is the
 * right answer for a tile. Keeping them was wrong the moment the raw spelling started being
 * shown: OpenSubtitles writes an apostrophe as a backtick, so `you\`ve` came back as YOU`VE,
 * and Russian frequency lists mark stress the same way, so БЕТОР came back as Б`ЕТОР.
 *
 * The test is grammatical rather than a list of characters. A combining mark is part of the
 * letter in front of it and belongs to the word; a spacing accent is a character in its own
 * right and belongs to whatever produced the file.
 */
const LOOSE_ACCENT = /(?!\p{M})\p{Diacritic}/gu

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

/**
 * How an alphabet writes a raw dictionary spelling, in the order the answers are trusted:
 * the alphabet's own `write` for a hand-written fold, the one `folder` attached otherwise,
 * and the fold itself when neither exists.
 *
 * The last is the safe default rather than a guess: it produces exactly the folded key, so a
 * language nobody has thought about writes what it has always written.
 */
export function writeFor(alphabet: Alphabet): (raw: string) => string {
  return alphabet.write ?? (alphabet.fold as Fold).write ?? ((raw) => alphabet.fold(raw))
}
