import type { Messages } from '../messages.js'

/**
 * English, and the reference every other locale is checked against.
 *
 * A few of these are load-bearing rather than decorative. `noSuchLetterUp` has to be loud,
 * because a player typing ALIAS cannot see how many A tiles the board holds, and silently
 * building ALIS is how a word gets submitted that nobody meant. `hiddenWhilePaused` is what
 * a screen reader says instead of reading out a concealed board.
 */
export const en: Messages = {
  tag: 'en',

  readingDictionary: 'Reading the dictionary…',
  noWordList: 'No word list for "{language}". Build one with:  pnpm dictionary build',
  emptyWordList: 'The word list for "{language}" is empty.',

  flips: 'flips',
  score: 'score',
  words: 'words',
  round: 'round',
  ticksLeftLabel: 'Ticks left in this round',
  typeAWord: 'type a word',
  tapPrompt: 'tap letters to select/unselect, then {action}',

  boardOfTiles: 'Board of {n} tiles',
  faceDown: 'face down',
  wildCard: 'wild card',
  wildKey: 'any letter',
  letterReplaced: '{from} became {to}',
  letterSwap: 'LETTER SWAP!',
  spentTile: 'spent tile',
  hiddenWhilePaused: 'hidden while paused',
  letterInWord: '{letter}, letter {position} of the word',

  completeWord: 'Complete word',

  completeShort: 'Complete',
  reset: 'Reset',
  pause: 'Pause',
  resume: 'Resume',
  newGame: 'New game',
  paused: 'Paused',
  outOfFlips: 'Out of flips',
  finalResult: '{score} points from {words} over {rounds}',
  playAgain: 'Play again',
  share: 'Share',
  shareCopied: 'Copied.',
  shareSelect: 'Copy this:',

  lettersSelect: 'letters select',
  keysWild: 'takes a card when no tile shows it, and tries to be that letter',
  clearsEvery: 'clears all selected {letter}s',
  undoLastLetter: 'undo last letter',
  noWordsYet: 'No words yet.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'already found',
  reasonTooShort: 'too short',
  reasonNotAWord: 'not a word',
  reasonAllFound: 'you already have them all',
  noSuchLetterUp: 'no {letter} up',
  nothingUp: 'not up',
  shuffled: 'shuffled',
  shuffledAndBilled: 'shuffled, billed {flips} unused flips',

  gameLanguage: 'language',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} common of {full} words',

  nerdMode: 'nerd mode',
  rules: 'Rules',
  difficulty: 'difficulty',
  difficultyNames: { easy: 'easy', medium: 'medium', hard: 'hard', insane: 'insane' },
  tiles: 'tiles (N)',
  secondsPerTick: 'seconds / tick',
  holdTicks: 'hold ticks',
  minWord: 'min word',
  startingFlips: 'starting flips',
  wildChance: 'wild card chance',
  replaceChance: 'letter swap chance',
  wordCompleteMode: 'word complete',
  wordCompleteNames: { shuffle: 'shuffle', spend: 'spend', keep: 'keep' },
  flipEconomy: 'flip economy',
  flipEconomyNames: {
    none: 'none',
    perLetter: 'per letter',
    fibonacci: 'fibonacci',
    overMinimum: 'over minimum',
  },
  repeatedLetterKey: 'repeated letter key',
  keySchemeNames: { cycle: 'cycle', advance: 'advance' },
  keySchemeHelp: {
    cycle:
      'A takes the next unused A, and once they are all in the word, clears them. ' +
      'Shift+A clears them too.',
    advance: 'A takes the next unused A. Shift+A clears every A in the word.',
  },

  whatThatMeans: 'What that means',
  factRound: 'round',
  factWholeBoardUp: 'whole board up for',
  factRoundCosts: 'a round costs',
  factFlipsBuy: 'starting flips buy',
  factThisBoard: 'this board',
  factBoardHadToAdmit: 'board had to admit',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, longest {longest}',
  wordsIncludingOneOf: '{words} incl. one of {ceiling}',
  scorelessRounds: '{rounds} scoreless',

  whatAWordPays: 'What a word pays',
  columnLetters: 'letters',
  columnCost: 'cost',
  columnPoints: 'points',
  columnFlips: 'flips',
  columnNet: 'net',

  canonicalRules: 'Canonical {difficulty} rules.',
  customRules: 'Changed from the preset. Scores under custom rules will not be ranked.',
  applyAndStart: 'Apply and start a new game',
  changesNextGame: 'Changes take effect on the next game.',
  presets: 'Presets:',

  start: 'Start',
  restart: 'Restart',
  quit: 'Quit',
  quitTitle: 'Quit this game?',
  restartTitle: 'Restart this game?',
  restartConfirm: 'Restart',
  quitConfirm: 'Quit',
  keepPlaying: 'Keep playing',
  personalBest: 'Your best games',
  thisGame: 'this game',
  newPersonalBest: 'A new personal best.',
  columnRank: '#',
  notRanked: 'Custom rules, so this game is not ranked.',
  rankOfTotal: '{rank} of {total}',

  howToPlay: 'How to play',

  backToGame: 'Back to the game',
  welcomeTitle: 'Welcome to Blinkered',
  tutorialSkip: 'Skip',
  tutorialNext: 'Next',
  tutorialBack: 'Back',
  tutorialStart: 'Start playing',
  tutorialHideAgain: "Don't show this again",
  tutorialProgress: '{n} of {total}',
  tutorialSkipTitle: 'Skip the tour?',
  tutPickLetters: 'Tap the letters you want, in order, to form a word.',
  tutMoreTurn: 'Tiles keep turning while you think, so a better letter may still be coming.',
  tutTapBack:
    'Tapped one you did not want? Tap it again to give it back. Any of them, not just the last.',
  tutComplete: 'Press Complete when the word is ready.',
  tutControlsTitle: 'The buttons',
  tutReset: 'Reset clears the word you are building. The tiles stay where they are.',
  tutPause: 'Pause stops the clock and hides the board, so a break cannot be used to study it.',
  tutRestart: 'Restart deals a new board from the beginning. It asks first.',
  tutQuit: 'Quit ends the game and shows what you scored. It asks first.',
  tutDoneTitle: 'That is the whole game',
  tutDoneBody:
    'Pick a level and play. How to play is always in the title bar if you want it again.',
  htBoardTitle: 'The board',
  htBoardBody:
    'Tiles turn face up one at a time, in reading order. Exposed tiles can be used to form words.',
  htWordsTitle: 'The words',
  htWordsBody:
    'Spell a word from the tiles that are showing by typing or clicking the letters in order.',
  htFlipsTitle: 'The flips',
  htFlipsBody:
    'Every tile that turns costs a flip. A completed word adds flips back to your total, and longer words pay more. When the flips run out, the game is over.',
  htRoundTitle: 'The round',
  htRoundBody:
    'When the last tile of a round turns, the whole board holds for a moment. Then the tiles are turned over and shuffled, and a new round begins.',
  htLanguagesTitle: 'The languages',
  htLanguagesBody:
    'Sixteen of them. Every board can be solved from words people actually use. An unusual word still scores, if the dictionary knows it.',
  htKeysTitle: 'The keyboard',
  htWildTitle: 'Wild cards',
  htWildBody:
    'Sometimes a wild card will appear instead of a letter. A wild card counts as any letter that makes a valid word. A previously-completed word does not count.',
  htSwapTitle: 'Changing letters',
  htSwapBody:
    'Sometimes, between rounds, one letter gets replaced with a different one. You will see which letter was removed and which was added.',
  htLevelsTitle: 'The levels',
  htLevelEasy:
    'The same twelve letters all game, so you can learn them and carry a list of words in your head. Tiles turn slowly, and the full board stays in view long enough to finish your word selections.',
  htLevelMedium:
    'A letter changes now and then, so it becomes harder to keep track of words you want to play in the future. Less time to look, and less time to think.',
  htLevelHard:
    'Three-letter words stop counting, and a letter changes about every other round. The board is barely showing before it shuffles.',
  htLevelInsane:
    'Everything at once, at speed. The board shuffles almost immediately after the last flip.',
  htTouchTitle: 'The touchscreen',
  htTouchBody:
    'Tap a tile that is showing to take its letter. Tap any letter you have taken to give it back. Complete and Reset sit under the board.',

  plurals: {
    words: { one: '{n} word', other: '{n} words' },
    rounds: { one: '{n} round', other: '{n} rounds' },
    flips: { one: '{n} flip', other: '{n} flips' },
    ticks: { one: '{n} tick', other: '{n} ticks' },
    points: { one: '{n} point', other: '{n} points' },
  },
}
