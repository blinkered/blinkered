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

  lettersSelect: 'letters select',
  clearsEvery: 'clears all selected {letter}s',
  undoLastLetter: 'undo last letter',
  noWordsYet: 'No words yet.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'already found',
  reasonTooShort: 'too short',
  reasonNotAWord: 'not a word',
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
  htBoardTitle: 'The board',
  htBoardBody:
    'Tiles turn face up one at a time, in reading order. You cannot see a letter until its tile turns.',
  htWordsTitle: 'The words',
  htWordsBody:
    'Spell a word from the tiles that are showing. Type it, or click them. Each tile can be used once, and only after it has turned.',
  htFlipsTitle: 'The flips',
  htFlipsBody:
    'Every tile that turns costs a flip. A word pays flips back, and longer words pay more. When the flips run out, the game is over.',
  htRoundTitle: 'The round',
  htRoundBody:
    'When the last tile of a round turns, the whole board is showing. It holds there for a moment. Then it shuffles and deals again.',
  htLanguagesTitle: 'The languages',
  htLanguagesBody:
    'Sixteen of them. Every board can be solved from words people actually use. An unusual word still scores, if the dictionary knows it.',
  htKeysTitle: 'The keyboard',
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
