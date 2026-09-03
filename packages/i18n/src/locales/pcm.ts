import type { Messages } from '../messages.js'

/**
 * Nigerian Pidgin, written the way its own Wikipedia writes it.
 *
 * Naija is English-lexified and is not English, and the difference is grammar rather than
 * spelling: `dey` marks the ongoing, `go` marks the future, `no` negates, `wey` relativises,
 * and `na` is the copula. So `tiles dey turn` is not a typo for `tiles are turning` — it is how
 * the sentence is built. Anything here that reads like English with the endings knocked off has
 * been written wrong; the endings were never there.
 *
 * `move` for flips, which is the word the game already uses for the thing you spend.
 */
export const pcm: Messages = {
  tag: 'pcm',

  readingDictionary: 'Dey read di dictionary…',
  noWordList: 'No word list for "{language}". Build one:  pnpm dictionary build',
  emptyWordList: 'Di word list for "{language}" empty.',

  flips: 'moves',
  score: 'score',
  words: 'words',
  round: 'round',
  ticksLeftLabel: 'Time wey remain for dis round',
  typeAWord: 'type word',
  tapPrompt: 'tap letters make you pick or return dem, den {action}',

  boardOfTiles: 'Board wey get {n} tiles',
  faceDown: 'face down',
  wildCard: 'wild card',
  wildKey: 'any letter',
  letterReplaced: '{from} don turn {to}',
  letterSwap: 'LETTER SWAP!',
  spentTile: 'tile wey don spend',
  hiddenWhilePaused: 'dem hide am while e pause',
  letterInWord: '{letter}, letter {position} for di word',

  completeWord: 'Complete di word',

  completeShort: 'Complete',
  reset: 'Clear',
  pause: 'Pause',
  resume: 'Continue',
  newGame: 'New game',
  paused: 'E pause',
  outOfFlips: 'Moves don finish',
  finalResult: '{score} from {words} for {rounds}',
  playAgain: 'Play again',
  share: 'Share',
  shareCopied: 'E don copy.',
  shareSelect: 'Copy dis one:',

  lettersSelect: 'letters dey pick',
  keysWild: 'dem go take am when you type letter wey no tile dey show',
  clearsEvery: 'e go clear every {letter} wey you pick',
  undoLastLetter: 'undo di last letter',
  noWordsYet: 'No word yet.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'you don find am',
  reasonTooShort: 'e too short',
  reasonNotAWord: 'e no be word',
  reasonAllFound: 'you don get all of dem',
  noSuchLetterUp: 'no {letter} dey open',
  nothingUp: 'nothing dey open',
  shuffled: 'dem don shuffle am',
  shuffledAndBilled: 'dem shuffle am, and charge {flips} wey you no use',

  gameLanguage: 'language',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} everyday for inside {full} words',
  filterLanguages: 'Find language',
  noMatches: 'Nothing match',

  nerdMode: 'nerd mode',
  rules: 'Rules',
  difficulty: 'how e hard',
  difficultyNames: { easy: 'easy', medium: 'medium', hard: 'hard', insane: 'craze' },
  tiles: 'tiles (N)',
  secondsPerTick: 'seconds / tick',
  holdTicks: 'hold ticks',
  minWord: 'shortest word',
  startingFlips: 'moves wey you start with',
  wildChance: 'chance for wild card',
  replaceChance: 'chance for letter swap',
  wordCompleteMode: 'when word complete',
  wordCompleteNames: { shuffle: 'shuffle', spend: 'spend', keep: 'keep' },
  flipEconomy: 'how moves dey come back',
  flipEconomyNames: {
    none: 'none',
    perLetter: 'per letter',
    fibonacci: 'fibonacci',
    overMinimum: 'over di minimum',
  },
  repeatedLetterKey: 'key for letter wey repeat',
  keySchemeNames: { cycle: 'cycle', advance: 'advance' },
  keySchemeHelp: {
    cycle:
      'A go take di next A wey never use, and once all of dem enter di word, e go clear dem. ' +
      'Shift+A go clear dem too.',
    advance: 'A go take di next A wey never use. Shift+A go clear every A for di word.',
  },

  whatThatMeans: 'Wetin dat one mean',
  factRound: 'round',
  factWholeBoardUp: 'di whole board dey open for',
  factRoundCosts: 'one round dey cost',
  factFlipsBuy: 'di moves wey you start with dey buy',
  factThisBoard: 'dis board',
  factBoardHadToAdmit: 'di board suppose accept',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, di longest na {longest}',
  wordsIncludingOneOf: '{words}, and one of dem na {ceiling}',
  scorelessRounds: '{rounds} wey no score',

  whatAWordPays: 'Wetin one word dey pay',
  columnLetters: 'letters',
  columnCost: 'cost',
  columnPoints: 'points',
  columnFlips: 'moves',
  columnNet: 'net',

  canonicalRules: 'Di normal {difficulty} rules.',
  customRules: 'You don change am from di preset. Score wey use your own rules no go rank.',
  applyAndStart: 'Apply and start new game',
  changesNextGame: 'Di changes go work from di next game.',
  presets: 'Presets:',

  start: 'Start',
  restart: 'Start again',
  quit: 'Quit',
  quitTitle: 'You wan quit dis game?',
  restartTitle: 'You wan start dis game again?',
  restartConfirm: 'Start again',
  quitConfirm: 'Quit',
  keepPlaying: 'Continue to play',
  personalBest: 'Your best games',
  thisGame: 'dis game',
  newPersonalBest: 'New personal best.',
  columnRank: '#',
  notRanked: 'Your own rules, so dis game no go rank.',
  rankOfTotal: '{rank} out of {total}',

  howToPlay: 'How to play',

  backToGame: 'Go back to di game',
  welcomeTitle: 'Welcome to Blinkered',
  tutorialSkip: 'Skip',
  tutorialNext: 'Next',
  tutorialBack: 'Back',
  tutorialStart: 'Start to play',
  tutorialHideAgain: 'No show dis again',
  tutorialProgress: '{n} out of {total}',
  tutorialSkipTitle: 'You wan skip di tour?',
  tutPickLetters: 'Tap di letters wey you want, one after di other, make you form word.',
  tutMoreTurn: 'Tiles dey still turn while you dey think, so better letter fit still dey come.',
  tutTapBack:
    'You tap one wey you no want? Tap am again make e go back. Any one, no be only di last one.',
  tutComplete: 'Press Complete when di word ready.',
  tutControlsTitle: 'Di buttons',
  tutReset: 'Clear go remove di word wey you dey build. Di tiles go remain where dem dey.',
  tutPause: 'Pause go stop di clock and hide di board, so break no go help you study am.',
  tutRestart: 'Start again go deal new board from di beginning. E go ask you first.',
  tutQuit: 'Quit go end di game and show wetin you score. E go ask you first.',
  tutDoneTitle: 'Na dat be di whole game',
  tutDoneBody: 'Pick level make you play. How to play dey always for di title bar.',
  htBoardTitle: 'Di board',
  htBoardBody:
    'Tiles dey turn face up one by one, di way you dey read. You fit take di ones wey open form word.',
  htWordsTitle: 'Di words',
  htWordsBody:
    'Spell word from di tiles wey dey show, by typing or clicking di letters one after di other.',
  htFlipsTitle: 'Di moves',
  htFlipsBody:
    'Every tile wey turn dey cost one move. Word wey you complete dey add moves back, and long word dey pay pass. When di moves finish, di game don end.',
  htRoundTitle: 'Di round',
  htRoundBody:
    'When di last tile of di round turn, di whole board go hold small. Den dem go turn di tiles over and shuffle dem, and new round go start.',
  htLanguagesTitle: 'Di languages',
  htLanguagesBody:
    '{n} of dem. Any board you fit solve with words wey people dey really use. Word wey no common still dey score, if di dictionary sabi am.',
  htKeysTitle: 'Di keyboard',
  htWildTitle: 'Wild cards',
  htWildBody:
    'Sometimes wild card go show instead of letter. Wild card dey count as any letter wey go make correct word. Word wey you don complete before no dey count.',
  htSwapTitle: 'Letters wey dey change',
  htSwapBody:
    'Sometimes, between rounds, dem go replace one letter with another one. You go see which one comot and which one enter.',
  htLevelsTitle: 'Di levels',
  htLevelEasy:
    'Di same twelve letters throughout di game, so you fit learn dem and carry list of words for your head. Tiles dey turn slow, and di whole board dey show long enough make you finish your picking.',
  htLevelMedium:
    'Letter dey change now and den, so e hard to remember words wey you keep for later. Less time to look, and less time to think.',
  htLevelHard:
    'Three-letter words no dey count again, and letter dey change almost every other round. Di board barely show before e shuffle.',
  htLevelInsane:
    'Everything at once, full speed. Di board dey shuffle almost immediately after di last move.',
  htTouchTitle: 'Di touchscreen',
  htTouchBody:
    'Tap tile wey dey show make you take im letter. Tap any letter wey you don take make e go back. Complete and Clear dey under di board.',

  plurals: {
    words: { one: '{n} word', other: '{n} words' },
    rounds: { one: '{n} round', other: '{n} rounds' },
    flips: { one: '{n} move', other: '{n} moves' },
    ticks: { one: '{n} tick', other: '{n} ticks' },
    points: { one: '{n} point', other: '{n} points' },
  },
}
