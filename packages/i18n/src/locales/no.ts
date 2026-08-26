import type { Messages } from '../messages.js'

/** Norwegian Bokmål. `trekk` for flips: a move, and the same in both numbers. */
export const no: Messages = {
  tag: 'no',

  readingDictionary: 'Leser ordlisten…',
  noWordList: 'Ingen ordliste for «{language}». Bygg en:  pnpm dictionary build',
  emptyWordList: 'Ordlisten for «{language}» er tom.',

  flips: 'trekk',
  score: 'poeng',
  words: 'ord',
  round: 'runde',
  ticksLeftLabel: 'Gjenstående tid i runden',
  typeAWord: 'skriv et ord',

  boardOfTiles: 'Brett med {n} brikker',
  faceDown: 'med baksiden opp',
  spentTile: 'brukt brikke',
  hiddenWhilePaused: 'skjult under pause',
  letterInWord: '{letter}, bokstav {position} i ordet',

  completeWord: 'Lever ordet',
  reset: 'Tøm',
  pause: 'Pause',
  resume: 'Fortsett',
  newGame: 'Nytt spill',
  paused: 'Satt på pause',
  outOfFlips: 'Tom for trekk',
  finalResult: '{score} poeng på {words} over {rounds}',
  playAgain: 'Spill igjen',

  lettersSelect: 'bokstaver velger',
  clearsEvery: 'fjerner alle valgte {letter}',
  undoLastLetter: 'angrer siste bokstav',
  noWordsYet: 'Ingen ord ennå.',

  wordAccepted: '{word}  +{points} poeng, +{flips} trekk',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'allerede funnet',
  reasonTooShort: 'for kort',
  reasonNotAWord: 'ikke et ord',
  noSuchLetterUp: 'ingen {letter} oppe',
  nothingUp: 'ingenting oppe',
  shuffled: 'stokket',
  shuffledAndBilled: 'stokket, {flips} ubrukte trekk belastet',

  gameLanguage: 'språk',
  interfaceLanguage: 'grensesnitt',
  dictionarySize: '{common} vanlige av {full} ord',

  nerdMode: 'ekspertmodus',
  rules: 'Regler',
  difficulty: 'vanskelighet',
  difficultyNames: { easy: 'lett', medium: 'middels', hard: 'vanskelig', insane: 'brutalt' },
  tiles: 'brikker (N)',
  secondsPerTick: 'sekunder / takt',
  holdTicks: 'holdetakter',
  minWord: 'korteste ord',
  startingFlips: 'trekk ved start',
  wordCompleteMode: 'ordet ferdig',
  wordCompleteNames: { shuffle: 'stokk', spend: 'bruk opp', keep: 'behold' },
  flipEconomy: 'trekkøkonomi',
  flipEconomyNames: {
    none: 'ingen',
    perLetter: 'per bokstav',
    fibonacci: 'fibonacci',
    overMinimum: 'over minimum',
  },
  repeatedLetterKey: 'tast for gjentatt bokstav',
  keySchemeNames: { cycle: 'sykle', advance: 'gå videre' },
  keySchemeHelp: {
    cycle:
      'A tar neste ledige A, og når alle er i ordet, fjerner den dem. ' +
      'Skift+A fjerner dem også.',
    advance: 'A tar neste ledige A. Skift+A fjerner hver A fra ordet.',
  },

  whatThatMeans: 'Hva det betyr',
  factRound: 'en runde',
  factWholeBoardUp: 'hele brettet oppe',
  factRoundCosts: 'en runde koster',
  factFlipsBuy: 'starttrekkene rekker til',
  factThisBoard: 'dette brettet',
  factBoardHadToAdmit: 'brettet måtte tillate',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, lengste {longest}',
  wordsIncludingOneOf: '{words} hvorav ett på {ceiling}',
  scorelessRounds: '{rounds} uten poeng',

  whatAWordPays: 'Hva et ord gir',
  columnLetters: 'bokstaver',
  columnCost: 'kostnad',
  columnPoints: 'poeng',
  columnFlips: 'trekk',
  columnNet: 'netto',

  canonicalRules: 'Offisielle regler for {difficulty}.',
  customRules: 'Endret fra forvalget. Poeng med egne regler blir ikke rangert.',
  applyAndStart: 'Bruk og start nytt spill',
  changesNextGame: 'Endringer gjelder fra neste spill.',
  presets: 'Forvalg:',

  plurals: {
    words: { one: '{n} ord', other: '{n} ord' },
    rounds: { one: '{n} runde', other: '{n} runder' },
    flips: { one: '{n} trekk', other: '{n} trekk' },
    ticks: { one: '{n} takt', other: '{n} takter' },
    points: { one: '{n} poeng', other: '{n} poeng' },
  },
}
