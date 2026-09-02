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
  /**
   * The whole of the touch instructions, and the only place they appear.
   *
   * `{action}` is `completeShort`, so the words name the button that is actually on screen
   * rather than a label somebody has to go and match up themselves.
   */
  readonly tapPrompt: string

  // The board, mostly for a screen reader.
  /** `{n}` */
  readonly boardOfTiles: string
  readonly faceDown: string
  /** What a wild tile is called, for a screen reader and for the key under the board. */
  readonly wildCard: string
  /** The key: what the symbol on the board means. Kept to a few words; it shares a tight row. */
  readonly wildKey: string
  /**
   * `{from}` `{to}` -- one tile's letter having become another.
   *
   * Read aloud rather than shown. On screen the swap is written `R -> S`, which needs no
   * translating and fits a row that has none to spare, but an arrow is not a sentence and a
   * screen reader would announce a shape. This is what it says instead.
   */
  readonly letterReplaced: string
  /**
   * Heading on the interstitial that announces a letter change. Shouted, and short.
   *
   * It has to read as an event at a glance, which is the whole reason the announcement moved off
   * the tile and off the message bar: both were too small and too brief to notice.
   */
  readonly letterSwap: string
  readonly spentTile: string
  readonly hiddenWhilePaused: string
  /** `{letter}` `{position}` */
  readonly letterInWord: string

  // The rules, on their own page, in whatever language the interface is in.
  readonly howToPlay: string
  /** Leaves the in-app rules in the native shell, which has no tab to close. */
  readonly backToGame: string
  // The first-run tour. Shown once, over the setup screen, until it is dismissed for good.
  readonly welcomeTitle: string
  readonly tutorialSkip: string
  readonly tutorialNext: string
  readonly tutorialBack: string
  readonly tutorialStart: string
  readonly tutorialHideAgain: string
  /** `{n}` `{total}` */
  readonly tutorialProgress: string
  readonly tutorialSkipTitle: string
  readonly tutPickLetters: string
  readonly tutMoreTurn: string
  readonly tutTapBack: string
  readonly tutComplete: string
  readonly tutControlsTitle: string
  readonly tutReset: string
  readonly tutPause: string
  readonly tutRestart: string
  readonly tutQuit: string
  readonly tutDoneTitle: string
  readonly tutDoneBody: string

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
  readonly htWildTitle: string
  readonly htWildBody: string
  readonly htSwapTitle: string
  readonly htSwapBody: string
  /**
   * What separates the four difficulty levels, one short line each.
   *
   * Qualities, never numbers. "1.2 seconds a tile" means nothing to somebody who has not played
   * the game yet; "the board is barely showing before it shuffles" means something at once. The
   * numbers are all in nerd mode for anyone who wants them. The level *names* are not here: they
   * come from `difficultyNames`, which the setup panel already uses, so the page and the chips
   * cannot end up calling the same level two different things.
   */
  readonly htLevelsTitle: string
  readonly htLevelEasy: string
  readonly htLevelMedium: string
  readonly htLevelHard: string
  readonly htLevelInsane: string
  readonly htTouchTitle: string
  readonly htTouchBody: string

  // Setting a game up, and stopping one.
  readonly start: string
  readonly restart: string
  readonly quit: string
  readonly quitTitle: string
  readonly restartTitle: string
  readonly restartConfirm: string
  readonly quitConfirm: string
  readonly keepPlaying: string

  // The personal leaderboard, shown when a game finishes.
  readonly personalBest: string
  readonly thisGame: string
  readonly newPersonalBest: string
  readonly columnRank: string
  readonly notRanked: string
  /** `{rank}` `{total}` */
  readonly rankOfTotal: string

  // The buttons.
  readonly completeWord: string
  /**
   * The button. Short enough that five controls fit one row on a 320px screen, in every
   * language; `completeWord` stays the full name, for prose and for the accessible label.
   */
  readonly completeShort: string
  readonly reset: string
  readonly pause: string
  readonly resume: string
  readonly newGame: string
  readonly paused: string
  readonly outOfFlips: string
  /** `{score}` `{words}` `{rounds}` */
  readonly finalResult: string
  readonly playAgain: string
  /** The button offered once a game is over. */
  readonly share: string
  /** Shown instead when there is no share sheet, so the synopsis went to the clipboard. */
  readonly shareCopied: string
  /** And when there is no clipboard either, so the text is on screen to be selected. */
  readonly shareSelect: string

  // The keyboard legend. Only the bindings the buttons cannot advertise themselves.
  readonly lettersSelect: string
  /**
   * What a letter key does when the board is not showing that letter: it takes a wild.
   *
   * In the keyboard list rather than with the wild-card rules, because it is the one part of the
   * mechanic that is about the keyboard. A thumb takes a card by tapping it and says nothing
   * about which letter it wanted; a key can say, and this is where that is written down.
   */
  readonly keysWild: string
  /** `{letter}`, shown as the literal X of "shift-X clears all selected Xs". */
  readonly clearsEvery: string
  readonly undoLastLetter: string
  readonly noWordsYet: string

  // What the game says back.
  /** `{word}` `{reason}` */
  readonly wordRejected: string
  readonly reasonDuplicate: string
  readonly reasonTooShort: string
  readonly reasonNotAWord: string
  /** Every letter the wild could have been makes a word already found. */
  readonly reasonAllFound: string
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
  readonly wildChance: string
  readonly replaceChance: string
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
 * writing that by hand in one file per locale.
 */
export function plural(tag: string, forms: PluralForms, count: number): string {
  const rule = new Intl.PluralRules(tag).select(count)
  return format(forms[rule] ?? forms.other, { n: count })
}
