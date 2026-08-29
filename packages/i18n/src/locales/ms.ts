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
  tapPrompt: 'sentuh untuk ambil atau pulangkan, lalu {action}',

  boardOfTiles: 'Papan {n} jubin',
  faceDown: 'tertutup',
  wildCard: 'kad liar',
  wildKey: 'mana-mana huruf',
  letterReplaced: '{from} menjadi {to}',
  spentTile: 'jubin terpakai',
  hiddenWhilePaused: 'disembunyikan semasa henti',
  letterInWord: '{letter}, huruf ke-{position} dalam kata',

  completeWord: 'Hantar kata',
  completeShort: 'Hantar',
  reset: 'Kosongkan',
  pause: 'Henti',
  resume: 'Sambung',
  newGame: 'Permainan baharu',
  paused: 'Dihentikan',
  outOfFlips: 'Balikan habis',
  finalResult: '{score} mata daripada {words} dalam {rounds}',
  playAgain: 'Main lagi',
  share: 'Kongsi',
  shareCopied: 'Disalin.',
  shareSelect: 'Salin ini:',

  lettersSelect: 'huruf memilih',
  clearsEvery: 'membuang semua {letter} yang dipilih',
  undoLastLetter: 'membatalkan huruf terakhir',
  noWordsYet: 'Belum ada kata.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'sudah dijumpai',
  reasonTooShort: 'terlalu pendek',
  reasonNotAWord: 'bukan kata',
  reasonAllFound: 'anda sudah ada semua',
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
  wildChance: 'peluang kad liar',
  replaceChance: 'peluang tukar huruf',
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

  start: 'Mula',
  restart: 'Mula semula',
  quit: 'Keluar',
  quitTitle: 'Keluar dari permainan ini?',
  restartTitle: 'Mula semula permainan ini?',
  restartConfirm: 'Mula semula',
  quitConfirm: 'Keluar',
  keepPlaying: 'Terus bermain',
  personalBest: 'Permainan terbaik anda',
  thisGame: 'permainan ini',
  newPersonalBest: 'Rekod peribadi baharu.',
  columnRank: '#',
  notRanked: 'Peraturan sendiri, jadi permainan ini tidak diberi kedudukan.',
  rankOfTotal: '{rank} daripada {total}',

  howToPlay: 'Cara bermain',

  backToGame: 'Kembali ke permainan',
  htBoardTitle: 'Papan',
  htBoardBody:
    'Jubin dibuka satu demi satu, mengikut arah bacaan. Huruf tidak kelihatan sehingga jubinnya terbalik.',
  htWordsTitle: 'Perkataan',
  htWordsBody:
    'Bina perkataan daripada jubin yang terbuka. Taipkan perkataan itu, atau klik padanya. Setiap jubin digunakan sekali, dan hanya selepas ia terbalik.',
  htFlipsTitle: 'Balikan',
  htFlipsBody:
    'Setiap jubin yang terbalik memakan satu balikan. Satu perkataan memulangkannya, dan perkataan panjang memulangkan lebih. Apabila balikan habis, permainan tamat.',
  htRoundTitle: 'Pusingan',
  htRoundBody:
    'Apabila jubin terakhir sesuatu pusingan terbalik, seluruh papan terbuka. Ia kekal begitu seketika. Kemudian papan dikocak dan dibahagikan semula.',
  htLanguagesTitle: 'Bahasa',
  htLanguagesBody:
    'Enam belas. Setiap papan boleh diselesaikan dengan perkataan yang benar-benar digunakan. Perkataan luar biasa tetap dikira, jika kamus mengetahuinya.',
  htKeysTitle: 'Papan kekunci',
  htWildTitle: 'Kad liar',
  htWildBody:
    'Sesetengah jubin terbuka sebagai kad dan bukan huruf. Kad itu berfungsi sebagai huruf yang membentuk kata, dipilih daripada yang sesuai, dan anda tahu yang mana apabila kata itu muncul dalam senarai anda. Kata yang sudah ada tidak dikira.',
  htSwapTitle: 'Huruf yang bertukar',
  htSwapBody:
    'Antara pusingan, satu jubin boleh menukar hurufnya. Semasa papan diedarkan, anda ditunjukkan sekali jubin mana dan huruf apa yang ada padanya sebelum ini. Papan tidak pernah kekal sama lama, jadi senarai hurufnya cepat lapuk.',
  htTouchTitle: 'Skrin sentuh',
  htTouchBody:
    'Sentuh jubin yang terbuka untuk mengambil hurufnya. Sentuh mana-mana huruf yang diambil untuk memulangkannya. Hantar dan Kosongkan ada di bawah papan.',

  plurals: {
    words: { other: '{n} kata' },
    rounds: { other: '{n} pusingan' },
    flips: { other: '{n} balikan' },
    ticks: { other: '{n} denyut' },
    points: { other: '{n} mata' },
  },
}
