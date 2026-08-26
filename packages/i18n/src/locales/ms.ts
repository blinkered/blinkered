import type { Messages } from '../messages.js'

/** Malay. No plural inflection at all, so every count uses one form. */
export const ms: Messages = {
  tag: 'ms',

  readingDictionary: 'Membaca kamus…',
  noWordList: 'Tiada senarai kata untuk "{language}". Bina satu:  pnpm dictionary build',
  emptyWordList: 'Senarai kata untuk "{language}" kosong.',

  flips: 'balikan',
  score: 'mata',
  words: 'kata',
  round: 'pusingan',
  ticksLeftLabel: 'Masa berbaki dalam pusingan ini',
  typeAWord: 'taip satu kata',

  boardOfTiles: 'Papan {n} jubin',
  faceDown: 'tertutup',
  spentTile: 'jubin terpakai',
  hiddenWhilePaused: 'disembunyikan semasa henti',
  letterInWord: '{letter}, huruf ke-{position} dalam kata',

  completeWord: 'Hantar kata',
  reset: 'Kosongkan',
  pause: 'Henti',
  resume: 'Sambung',
  newGame: 'Permainan baharu',
  paused: 'Dihentikan',
  outOfFlips: 'Balikan habis',
  finalResult: '{score} mata daripada {words} dalam {rounds}',
  playAgain: 'Main lagi',

  lettersSelect: 'huruf memilih',
  clearsEvery: 'membuang semua {letter} yang dipilih',
  undoLastLetter: 'membatalkan huruf terakhir',
  noWordsYet: 'Belum ada kata.',

  wordAccepted: '{word}  +{points} mata, +{flips} balikan',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'sudah dijumpai',
  reasonTooShort: 'terlalu pendek',
  reasonNotAWord: 'bukan kata',
  noSuchLetterUp: 'tiada {letter} terbuka',
  nothingUp: 'tiada yang terbuka',
  shuffled: 'dikocak',
  shuffledAndBilled: 'dikocak, {flips} balikan tidak digunakan dicaj',

  gameLanguage: 'bahasa',
  interfaceLanguage: 'antara muka',
  dictionarySize: '{common} biasa daripada {full} kata',

  nerdMode: 'mod terperinci',
  rules: 'Peraturan',
  difficulty: 'kesukaran',
  difficultyNames: { easy: 'mudah', medium: 'sedang', hard: 'sukar', insane: 'ganas' },
  tiles: 'jubin (N)',
  secondsPerTick: 'detik / denyut',
  holdTicks: 'denyut tahan',
  minWord: 'kata terpendek',
  startingFlips: 'balikan permulaan',
  wordCompleteMode: 'kata selesai',
  wordCompleteNames: { shuffle: 'kocak', spend: 'guna', keep: 'simpan' },
  flipEconomy: 'ekonomi balikan',
  flipEconomyNames: {
    none: 'tiada',
    perLetter: 'per huruf',
    fibonacci: 'fibonacci',
    overMinimum: 'melebihi minimum',
  },
  repeatedLetterKey: 'kekunci huruf berulang',
  keySchemeNames: { cycle: 'kitar', advance: 'maju' },
  keySchemeHelp: {
    cycle:
      'A mengambil A bebas yang seterusnya, dan apabila semuanya dalam kata, ia membuangnya. ' +
      'Shift+A juga membuangnya.',
    advance: 'A mengambil A bebas yang seterusnya. Shift+A membuang setiap A daripada kata.',
  },

  whatThatMeans: 'Apa maksudnya',
  factRound: 'satu pusingan',
  factWholeBoardUp: 'seluruh papan terbuka',
  factRoundCosts: 'satu pusingan berharga',
  factFlipsBuy: 'balikan permulaan memberi',
  factThisBoard: 'papan ini',
  factBoardHadToAdmit: 'papan perlu membenarkan',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, terpanjang {longest}',
  wordsIncludingOneOf: '{words} termasuk satu daripada {ceiling}',
  scorelessRounds: '{rounds} tanpa mata',

  whatAWordPays: 'Bayaran sepatah kata',
  columnLetters: 'huruf',
  columnCost: 'kos',
  columnPoints: 'mata',
  columnFlips: 'balikan',
  columnNet: 'bersih',

  canonicalRules: 'Peraturan {difficulty} yang rasmi.',
  customRules: 'Diubah daripada praset. Skor dengan peraturan sendiri tidak diberi kedudukan.',
  applyAndStart: 'Guna dan mulakan permainan baharu',
  changesNextGame: 'Perubahan berkuat kuasa pada permainan berikutnya.',
  presets: 'Praset:',

  plurals: {
    words: { other: '{n} kata' },
    rounds: { other: '{n} pusingan' },
    flips: { other: '{n} balikan' },
    ticks: { other: '{n} denyut' },
    points: { other: '{n} mata' },
  },
}
