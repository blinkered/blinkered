import type { Difficulty, FlipEconomy, KeyScheme, WordCompleteMode } from '@blinkered/engine'

/**
 * Every word Blinkered says, in one shape.
 *
 * Two rules keep this honest. Templates carry `{named}` placeholders rather than positional
 * ones, because a translator has to be free to reorder them and a positional `%s` forbids it.
 * And anything that varies with a number goes through `plurals`, not through a template with
 * an `s` bolted on: Russian has four forms and Croatian three, so a translation that assumes
 * two is wrong before anyone reads it.
 *
 * The game language and the interface language are separate. Nothing here assumes they match,
 * so playing French with an English interface stays possible.
 */

/** A plural set. `other` is required because every language has it; the rest as needed. */
export type PluralForms = { readonly other: string } & Partial<Record<Intl.LDMLPluralRule, string>>

export interface Plurals {
  readonly words: PluralForms
  readonly rounds: PluralForms
  readonly flips: PluralForms
  readonly ticks: PluralForms
  readonly points: PluralForms
}

export interface Messages {
  /** BCP 47 tag this set is written in. */
  readonly tag: string

  // Getting started, and failing to.
  readonly readingDictionary: string
  /** `{language}` */
  readonly noWordList: string
  /** `{language}` */
  readonly emptyWordList: string

  // The meters.
  readonly flips: string
  readonly score: string
  readonly words: string
  readonly round: string
  readonly ticksLeftLabel: string
  readonly typeAWord: string

  // The board, mostly for a screen reader.
  /** `{n}` */
  readonly boardOfTiles: string
  readonly faceDown: string
  readonly spentTile: string
  readonly hiddenWhilePaused: string
  /** `{letter}` `{position}` */
  readonly letterInWord: string

  // The rules, on their own page, in whatever language the interface is in.
  readonly howToPlay: string
  readonly htBoardTitle: string
  readonly htBoardBody: string
  readonly htWordsTitle: string
  readonly htWordsBody: string
  readonly htFlipsTitle: string
  readonly htFlipsBody: string
  readonly htRoundTitle: string
  readonly htRoundBody: string
  readonly htLanguagesTitle: string
  readonly htLanguagesBody: string
  readonly htKeysTitle: string

  // Setting a game up, and stopping one.
  readonly start: string
  readonly restart: string
  readonly quit: string
  readonly quitTitle: string
  readonly quitConfirm: string
  readonly keepPlaying: string

  // The personal leaderboard, shown when a game finishes.
  readonly personalBest: string
  readonly noScoresYet: string
  readonly thisGame: string
  readonly newPersonalBest: string
  readonly columnRank: string
  readonly notRanked: string
  /** `{rank}` `{total}` */
  readonly rankOfTotal: string

  // The buttons.
  readonly completeWord: string
  readonly reset: string
  readonly pause: string
  readonly resume: string
  readonly newGame: string
  readonly paused: string
  readonly outOfFlips: string
  /** `{score}` `{words}` `{rounds}` */
  readonly finalResult: string
  readonly playAgain: string

  // The keyboard legend. Only the bindings the buttons cannot advertise themselves.
  readonly lettersSelect: string
  /** `{letter}`, shown as the literal X of "shift-X clears all selected Xs". */
  readonly clearsEvery: string
  readonly undoLastLetter: string
  readonly noWordsYet: string

  // What the game says back.
  /** `{word}` `{points}` `{flips}` */
  readonly wordAccepted: string
  /** `{word}` `{reason}` */
  readonly wordRejected: string
  readonly reasonDuplicate: string
  readonly reasonTooShort: string
  readonly reasonNotAWord: string
  /** `{letter}` */
  readonly noSuchLetterUp: string
  readonly nothingUp: string
  readonly shuffled: string
  /** `{flips}` */
  readonly shuffledAndBilled: string

  // Choosing a language.
  readonly gameLanguage: string
  readonly interfaceLanguage: string
  /** `{common}` `{full}` */
  readonly dictionarySize: string

  // Nerd mode: the rules, and the arithmetic they produce.
  readonly nerdMode: string
  readonly rules: string
  readonly difficulty: string
  readonly difficultyNames: Readonly<Record<Difficulty, string>>
  readonly tiles: string
  readonly secondsPerTick: string
  readonly holdTicks: string
  readonly minWord: string
  readonly startingFlips: string
  readonly wordCompleteMode: string
  readonly wordCompleteNames: Readonly<Record<WordCompleteMode, string>>
  readonly flipEconomy: string
  readonly flipEconomyNames: Readonly<Record<FlipEconomy, string>>
  readonly repeatedLetterKey: string
  readonly keySchemeNames: Readonly<Record<KeyScheme, string>>
  readonly keySchemeHelp: Readonly<Record<KeyScheme, string>>

  readonly whatThatMeans: string
  readonly factRound: string
  readonly factWholeBoardUp: string
  readonly factRoundCosts: string
  readonly factFlipsBuy: string
  readonly factThisBoard: string
  readonly factBoardHadToAdmit: string
  /** `{ticks}` `{seconds}` */
  readonly ticksAndSeconds: string
  /** `{words}` `{longest}` */
  readonly wordsLongest: string
  /** `{words}` `{ceiling}` */
  readonly wordsIncludingOneOf: string
  /** `{rounds}` */
  readonly scorelessRounds: string

  readonly whatAWordPays: string
  readonly columnLetters: string
  readonly columnCost: string
  readonly columnPoints: string
  readonly columnFlips: string
  readonly columnNet: string

  /** `{difficulty}` */
  readonly canonicalRules: string
  readonly customRules: string
  readonly applyAndStart: string
  readonly changesNextGame: string
  readonly presets: string

  readonly plurals: Plurals
}

export type Replacements = Readonly<Record<string, string | number>>

/**
 * Fills `{named}` placeholders. An unknown placeholder is left as written rather than
 * replaced with "undefined", so a mistake in a translation shows up as a mistake.
 */
export function format(template: string, values: Replacements = {}): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = values[name]
    return value === undefined ? whole : String(value)
  })
}

/**
 * Picks the plural form for a count and fills `{n}` with it.
 *
 * `Intl.PluralRules` decides which form applies, which is the only sane way to do this: the
 * rule for Russian is a three-branch test on the last two digits, and nobody should be
 * writing that by hand in sixteen files.
 */
export function plural(tag: string, forms: PluralForms, count: number): string {
  const rule = new Intl.PluralRules(tag).select(count)
  return format(forms[rule] ?? forms.other, { n: count })
}
