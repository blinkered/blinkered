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
  /**
   * The next-to-last screen of the tour, which says the rules are covered and nothing more.
   *
   * It used to read "That is the whole game" over "Pick a level and play", and then the tour
   * showed another screen. Announcing the ending and then not ending is what Nick caught:
   * "then...brings you to another screen. Seems weird." So the heading now closes the *rules*
   * and the body keeps only the part that is a standing fact -- how to play is in the title bar.
   * The send-off is gone from here; `tutorialStart` on the last screen is the send-off.
   */
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
  /**
   * Placeholder in the box that narrows the language list.
   *
   * Fifty languages is past what anybody scans, so the list has a filter and this names it.
   * It matches on all four handles a reader might have for a language — what the language calls
   * itself, what the reader calls it, its English name, and its tag — so `greek`, `Ελληνικά`
   * and `el` all find the same row.
   */
  readonly filterLanguages: string
  /** When the filter matches none of them. */
  readonly noMatches: string

  // Nerd mode: the rules, and the arithmetic they produce.
  readonly nerdMode: string
  readonly rules: string
  readonly difficulty: string
  readonly difficultyNames: Readonly<Record<Difficulty, string>>
  /**
   * The palette, and the three it can be.
   *
   * One record rather than three keys, the same shape `difficultyNames` uses, because it is the
   * same kind of thing: a closed set of names for a row of chips. Adding a fourth theme then
   * fails to compile in fifty-one files at once, which is the behaviour worth having.
   *
   * The names describe what each is *for* rather than what it looks like. "Dark" and "light" would
   * be the obvious pair and would leave the third one nameless -- and a reader choosing between
   * them is choosing a room and a pair of eyes, not a colour.
   */
  /**
   * "About", which is the label on two links and the heading of the page they open.
   *
   * The page's prose is English and stays English -- it is one person's account of a shower
   * thought, with his name and his address in it, and a machine translation of that into fifty-one
   * languages would be putting words in his mouth. The chrome around it is localised like every
   * other page: the heading, the way back, and the two links that lead to it.
   */
  /**
   * What a stopped clock costs, said on the veil that covers a paused board.
   *
   * Said *while* paused rather than afterwards, because afterwards it is a penalty somebody was
   * not told about. The veil is also where the tab going away lands, so somebody who took a call
   * mid-game finds out here rather than on the game-over panel.
   *
   * It says the game will not be ranked, not that it will not be kept: a paused game is still
   * stored, still in a history, still worth opening. Only the board is closed to it.
   */
  readonly pausedNoBoard: string
  readonly about: string
  readonly themeLabel: string
  readonly themeNames: Readonly<Record<'traditional' | 'light' | 'contrast', string>>
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

  /*
   * Accounts: the menu, the profile screen, signing in, and one game's history.
   *
   * Everything a player reads once they have an account. It arrived last and in English, which
   * is why it sits in a block of its own rather than beside the words it is nearest to.
   *
   * Two of these are templates rather than sentences, and deliberately. `bioHint` carries both
   * numbers so no language has to make "characters" agree with a count, which would need a
   * plural set for a string nobody reads twice. And the three `change*` lines are whole
   * sentences rather than the fragments they replaced: the screen used to assemble
   * "{letter}" + "replaced in" + "slot {n}", which is three words in an order only English uses.
   */

  /** The account menu, hanging off the avatar. */
  readonly accountTitle: string
  readonly menuProfile: string
  readonly menuGames: string
  readonly menuPublicPage: string
  readonly menuSignedInAs: string
  readonly signIn: string
  readonly signOut: string

  /** The sign-in dialog. */
  readonly signInTitle: string
  readonly signInLead: string
  /** Shown instead of the lead when the dialog opens over a finished game. */
  readonly signInKeepGame: string
  readonly continueWithApple: string
  readonly continueWithGoogle: string
  /** Between the provider buttons and the email form. Lowercase on purpose. */
  readonly signInOr: string
  readonly emailLabel: string
  readonly codeLabel: string
  readonly emailMeACode: string
  readonly working: string
  readonly sendNewCode: string
  readonly codeSent: string
  readonly notNow: string
  readonly badEmail: string
  readonly badCode: string
  /** Reachable again if they wait; said where there is something to retry. */
  readonly serverBusy: string
  /** Not reachable now; said where a screen simply has nothing to show. */
  readonly serverDown: string
  /**
   * This device has no connection, as a badge beside the account rather than a sentence.
   *
   * The only string the offline work needed. A blocked write already says the right thing:
   * `serverBusy` is "Could not reach the server. Try again in a moment.", which is exactly true
   * with no network, and `AccountScreen` already renders it for every refused save. A second key
   * saying the same thing in fifty-one languages would be the duplication the note on
   * `deleteAccount` argues against.
   *
   * Short, because it sits next to an avatar. It is also what a screen reader says instead of
   * the bare username, so it has to read as a state and not as part of somebody's name.
   */
  readonly offline: string

  /**
   * The board at `/l/<language>/<difficulty>`.
   *
   * Two strings, because everything else a board needs already exists in every language and is
   * reused rather than restated: `gameLanguage` and `difficulty` label the two selectors,
   * `difficultyNames` fills one of them, `score` and `columnRounds` head the columns,
   * `gamesLoading` covers the wait, and `backToGame` is the way out.
   *
   * `leaderboardEmpty` answers both an empty board and a board that does not exist. A language
   * with no word list has no board and never will, and saying so differently would make the page
   * report which boards exist.
   */
  readonly leaderboardTitle: string
  readonly leaderboardEmpty: string
  /**
   * The heading over the projected board on the game-over panel.
   *
   * A projected row is not a real one, and this is what keeps it honest: the row is drawn in the
   * board's own shape, among real players, so without a heading in the conditional it would read
   * as a result that already counts. "Would" is doing the work in every language here.
   *
   * The call to action beneath it is `signInKeepGame`, which already reads "Sign in to keep this
   * game, and every one after it." in all fifty-one.
   */
  readonly leaderboardWouldBe: string
  /**
   * The name on the projected row, for a reader who does not have one yet.
   *
   * A guest's row cannot carry a username because a guest has none, and an empty name slot reads
   * as a broken row rather than as an invitation. A signed-in reader sees their own name there
   * instead, because they have one.
   */
  readonly leaderboardThisGame: string

  /**
   * The last screen of the tour, which exists because of a number rather than a design.
   *
   * One signup in production besides Nick's own, which says the offer of an account is not
   * reaching anybody. The tour is the one place every player passes through, so the last thing
   * before Start playing says what an account is for.
   *
   * Two strings, on a screen of its own. Folding them onto the rules screen instead made that
   * screen carry a board, a closing line, a pitch, a button, a checkbox and the navigation at
   * once, which is crowded; the answer to a false ending is to stop announcing the ending, not
   * to lose the screen.
   *
   * The button reuses `signInTitle`, already "Sign in or sign up" in every language, and opens
   * the same `SignInDialog` the rest of the app uses rather than a second sign-in surface with
   * its own validation, its own code step and its own way to fail.
   */
  readonly tutAccountTitle: string
  readonly tutAccountBody: string

  /** Coming back from Apple or Google. Vague on purpose about which check failed. */
  readonly ssoCancelled: string
  readonly ssoExpired: string
  readonly ssoNoUsername: string
  readonly ssoFailed: string

  /** The profile form. */
  /** The two tabs on the account screen; the other is `gamesHeading`. */
  readonly tabProfile: string
  /** The country a player has not given, which is the default and is not an error. */
  readonly countryAny: string
  readonly findCountry: string
  readonly usernameLabel: string
  readonly bioLabel: string
  readonly countryLabel: string
  /** `{left}` of `{max}`, and a reminder that links are refused before the save rather than after. */
  readonly bioHint: string
  readonly save: string
  readonly saving: string
  readonly saved: string
  readonly nameTaken: string
  readonly nameTooShort: string
  readonly nameTooLong: string
  readonly nameBadCharacters: string
  readonly nameBadEdges: string
  readonly nameMixedScripts: string
  readonly nameReserved: string
  /** When the server refuses a name for a reason this version does not know about. */
  readonly nameUnusable: string
  /** `{max}` characters. */
  readonly bioTooLong: string
  readonly bioHasLink: string
  readonly bioHasControl: string
  readonly bioUnusable: string

  /** Listings, yours and somebody else's. */
  readonly gamesHeading: string
  readonly gamesEmpty: string
  readonly gamesEmptyShort: string
  readonly gamesLoading: string
  readonly theirGamesLoading: string
  readonly profileLoading: string
  readonly playerNotFound: string
  readonly columnWhen: string
  readonly columnGame: string
  /**
   * The count-of-rounds column. `round` next to it is the singular the HUD uses, so this is
   * its own key rather than a reuse, and it is taken from the plural form each locale already
   * chose rather than invented a second time.
   */
  readonly columnRounds: string

  /** One game, round by round. */
  readonly gameLoading: string
  readonly gameUnreadable: string
  readonly gameNotRanked: string
  readonly detailNotKept: string
  readonly openingBoard: string
  readonly roundByRound: string
  readonly roundNothing: string
  /** `{letter}` and `{slot}`. Whole sentences: see the note at the top of this block. */
  readonly changeReplaced: string
  readonly changeWildOn: string
  readonly changeWildOff: string

  /** Keeping a game that was played signed out. */
  readonly keepThisGame: string
  readonly savedToYourGames: string

  /**
   * Objecting to something somebody wrote or scored.
   *
   * Translated, unlike the panel that reads these reports, and the asymmetry is deliberate. The
   * queue has one audience and it is us; the button has fifty-one, and docs/ACCOUNTS.md is
   * explicit that this button is what a blocklist cannot be: "a blocklist is not going to work
   * across this many languages and pretending otherwise is worse than not having one. What works
   * is a report button and the power to rename an account and tell its owner why." A button that
   * only worked in English would be a blocklist with extra steps.
   *
   * `reportSent` answers a duplicate as well as a first report, on purpose: from where the
   * reader is standing they reported it and it is reported, and saying "you already did that"
   * only invites a third attempt.
   */
  readonly reportThis: string
  readonly reportHeading: string
  /** The three things there are to object to, which are the three free-text surfaces. */
  readonly reportTheName: string
  readonly reportTheBio: string
  readonly reportTheScore: string
  readonly reportWhy: string
  readonly reportSend: string
  readonly reportSent: string
  /** Reporting is behind the session, so a signed-out reader is told rather than left waiting. */
  readonly reportSignIn: string
  readonly reportGone: string
  readonly reportCancel: string

  /**
   * Deleting your own account, which App Store guideline 5.1.1(v) requires of anything offering
   * account creation and which is owed regardless.
   *
   * Translated like the rest of the account surface. Four of the strings this flow needs already
   * exist and are reused rather than duplicated: `codeLabel` and `codeSent` from signing in,
   * because it is the same six-digit code and the same ten minutes; `reportCancel` for the way
   * out; and `serverBusy` for a server that did not answer.
   */
  readonly deleteAccount: string
  readonly deleteAccountWhat: string
  readonly deleteAccountAsk: string
  readonly deleteConfirm: string
  readonly deleteGone: string
  /** For an account with no confirmed address, which a provider is under no obligation to give. */
  readonly deleteNoAddress: string
  /*
   * There is no `reportSending` and no `reportFailed`. The dialog uses `saving` and `serverBusy`,
   * which already say exactly those two things in fifty-one languages -- "Saving…" and "Could not
   * reach the server. Try again in a moment." A second key per locale holding the same sentence
   * would be fifty-one more strings to keep in step for no new words.
   */

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
