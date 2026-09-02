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
  letterSwap: 'TUKAR HURUF!',
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
  keysWild: 'diambil apabila anda menaip huruf yang tiada pada mana-mana jubin',
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
  welcomeTitle: 'Selamat datang ke Blinkered',
  tutorialSkip: 'Langkau',
  tutorialNext: 'Seterusnya',
  tutorialBack: 'Kembali',
  tutorialStart: 'Mula bermain',
  tutorialHideAgain: 'Jangan tunjuk lagi',
  tutorialProgress: '{n} daripada {total}',
  tutorialSkipTitle: 'Langkau pengenalan?',
  tutPickLetters: 'Ketik huruf yang anda mahu mengikut urutan untuk membina perkataan.',
  tutMoreTurn:
    'Jubin terus terbalik semasa anda berfikir, jadi huruf yang lebih baik mungkin masih akan datang.',
  tutTapBack:
    'Tersalah ketik? Ketik sekali lagi untuk memulangkannya. Mana-mana huruf, bukan yang terakhir sahaja.',
  tutComplete: 'Tekan Selesai apabila perkataan sudah siap.',
  tutControlsTitle: 'Butang',
  tutReset: 'Set semula mengosongkan perkataan yang sedang anda bina. Jubin kekal di tempatnya.',
  tutPause:
    'Jeda menghentikan jam dan menyembunyikan papan, supaya rehat tidak boleh digunakan untuk mengkajinya.',
  tutRestart: 'Mula semula mengedar papan baharu dari awal. Ia bertanya dahulu.',
  tutQuit: 'Keluar menamatkan permainan dan menunjukkan markah anda. Ia bertanya dahulu.',
  tutDoneTitle: 'Itulah keseluruhan permainan',
  tutDoneBody: 'Pilih satu tahap dan bermain. Cara bermain sentiasa ada pada bar tajuk.',
  htBoardTitle: 'Papan',
  htBoardBody:
    'Jubin dibuka satu demi satu, mengikut arah bacaan. Daripada jubin yang terbuka anda membina perkataan.',
  htWordsTitle: 'Perkataan',
  htWordsBody:
    'Bina perkataan daripada jubin yang terbuka dengan menaip atau mengklik hurufnya mengikut urutan.',
  htFlipsTitle: 'Balikan',
  htFlipsBody:
    'Setiap jubin yang terbalik memakan satu balikan. Perkataan yang siap menambah balikan kepada jumlah anda, dan perkataan panjang memberi lebih. Apabila balikan habis, permainan tamat.',
  htRoundTitle: 'Pusingan',
  htRoundBody:
    'Apabila jubin terakhir sesuatu pusingan terbalik, seluruh papan terbuka seketika. Kemudian jubin dibalikkan tertutup dan dikocak, dan pusingan baharu bermula.',
  htLanguagesTitle: 'Bahasa',
  htLanguagesBody:
    'Enam belas. Setiap papan boleh diselesaikan dengan perkataan yang benar-benar digunakan. Perkataan luar biasa tetap dikira, jika kamus mengetahuinya.',
  htKeysTitle: 'Papan kekunci',
  htWildTitle: 'Kad liar',
  htWildBody:
    'Kadangkala kad liar muncul menggantikan huruf. Kad liar berfungsi sebagai apa-apa huruf yang membentuk perkataan yang sah. Perkataan yang sudah siap tidak dikira.',
  htSwapTitle: 'Huruf yang bertukar',
  htSwapBody:
    'Kadangkala, antara pusingan, satu huruf diganti dengan huruf lain. Anda akan nampak huruf mana yang dibuang dan mana yang ditambah.',
  htLevelsTitle: 'Tahap kesukaran',
  htLevelEasy:
    'Dua belas huruf yang sama sepanjang permainan, jadi anda boleh menghafalnya dan menyimpan senarai perkataan dalam kepala. Jubin terbalik perlahan dan papan penuh kekal kelihatan cukup lama untuk anda selesai memilih huruf.',
  htLevelMedium:
    'Sekali-sekala satu huruf bertukar, jadi lebih sukar mengingati perkataan yang anda ingin mainkan kemudian. Kurang masa untuk melihat dan kurang untuk berfikir.',
  htLevelHard:
    'Perkataan tiga huruf tidak lagi dikira, dan satu huruf bertukar kira-kira setiap dua pusingan. Papan baru sahaja kelihatan sebelum ia dikocak semula.',
  htLevelInsane:
    'Semuanya serentak, pada kelajuan penuh. Papan dikocak hampir sebaik sahaja balikan terakhir selesai.',
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
