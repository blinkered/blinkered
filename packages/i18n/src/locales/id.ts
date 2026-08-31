import type { Messages } from '../messages.js'

/**
 * Indonesian. Shares Malay's alphabet and its lack of plural inflection, and differs in
 * vocabulary: the Dutch borrowings against Malaysian's English ones show up in the wording as
 * clearly as they do in the letter distribution.
 */
export const id: Messages = {
  tag: 'id',

  readingDictionary: 'Membaca kamus…',
  noWordList: 'Tidak ada daftar kata untuk "{language}". Buat satu:  pnpm dictionary build',
  emptyWordList: 'Daftar kata untuk "{language}" kosong.',

  flips: 'balikan',
  score: 'skor',
  words: 'kata',
  round: 'putaran',
  ticksLeftLabel: 'Waktu tersisa di putaran ini',
  typeAWord: 'ketik sebuah kata',
  tapPrompt: 'sentuh untuk ambil atau kembalikan, lalu {action}',

  boardOfTiles: 'Papan {n} kartu',
  faceDown: 'tertutup',
  wildCard: 'kartu liar',
  wildKey: 'huruf apa saja',
  letterReplaced: '{from} menjadi {to}',
  letterSwap: 'GANTI HURUF!',
  spentTile: 'kartu terpakai',
  hiddenWhilePaused: 'disembunyikan saat jeda',
  letterInWord: '{letter}, huruf ke-{position} dari kata',

  completeWord: 'Kirim kata',
  completeShort: 'Kirim',
  reset: 'Hapus',
  pause: 'Jeda',
  resume: 'Lanjutkan',
  newGame: 'Permainan baru',
  paused: 'Dijeda',
  outOfFlips: 'Balikan habis',
  finalResult: '{score} poin dari {words} dalam {rounds}',
  playAgain: 'Main lagi',
  share: 'Bagikan',
  shareCopied: 'Tersalin.',
  shareSelect: 'Salin ini:',

  lettersSelect: 'huruf memilih',
  clearsEvery: 'menghapus semua {letter} terpilih',
  undoLastLetter: 'membatalkan huruf terakhir',
  noWordsYet: 'Belum ada kata.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'sudah ditemukan',
  reasonTooShort: 'terlalu pendek',
  reasonNotAWord: 'bukan kata',
  reasonAllFound: 'kamu sudah punya semua',
  noSuchLetterUp: 'tidak ada {letter} terbuka',
  nothingUp: 'tidak ada yang terbuka',
  shuffled: 'diacak',
  shuffledAndBilled: 'diacak, {flips} balikan tak terpakai ditagih',

  gameLanguage: 'bahasa',
  interfaceLanguage: 'antarmuka',
  dictionarySize: '{common} umum dari {full} kata',

  nerdMode: 'mode rinci',
  rules: 'Aturan',
  difficulty: 'kesulitan',
  difficultyNames: { easy: 'mudah', medium: 'sedang', hard: 'sulit', insane: 'brutal' },
  tiles: 'kartu (N)',
  secondsPerTick: 'detik / ketukan',
  holdTicks: 'ketukan tahan',
  minWord: 'kata terpendek',
  startingFlips: 'balikan awal',
  wildChance: 'peluang kartu liar',
  replaceChance: 'peluang penggantian huruf',
  wordCompleteMode: 'kata selesai',
  wordCompleteNames: { shuffle: 'acak', spend: 'pakai', keep: 'simpan' },
  flipEconomy: 'ekonomi balikan',
  flipEconomyNames: {
    none: 'tidak ada',
    perLetter: 'per huruf',
    fibonacci: 'fibonacci',
    overMinimum: 'di atas minimum',
  },
  repeatedLetterKey: 'tombol huruf berulang',
  keySchemeNames: { cycle: 'putar', advance: 'maju' },
  keySchemeHelp: {
    cycle:
      'A mengambil A bebas berikutnya, dan begitu semuanya ada dalam kata, ia menghapusnya. ' +
      'Shift+A juga menghapusnya.',
    advance: 'A mengambil A bebas berikutnya. Shift+A menghapus setiap A dari kata.',
  },

  whatThatMeans: 'Apa artinya',
  factRound: 'satu putaran',
  factWholeBoardUp: 'seluruh papan terbuka',
  factRoundCosts: 'satu putaran memakan',
  factFlipsBuy: 'balikan awal memberi',
  factThisBoard: 'papan ini',
  factBoardHadToAdmit: 'papan harus mengizinkan',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, terpanjang {longest}',
  wordsIncludingOneOf: '{words} termasuk satu dari {ceiling}',
  scorelessRounds: '{rounds} tanpa poin',

  whatAWordPays: 'Hasil sebuah kata',
  columnLetters: 'huruf',
  columnCost: 'biaya',
  columnPoints: 'poin',
  columnFlips: 'balikan',
  columnNet: 'neto',

  canonicalRules: 'Aturan {difficulty} resmi.',
  customRules: 'Diubah dari praatur. Skor dengan aturan sendiri tidak diperingkat.',
  applyAndStart: 'Terapkan dan mulai permainan baru',
  changesNextGame: 'Perubahan berlaku pada permainan berikutnya.',
  presets: 'Praatur:',

  start: 'Mulai',
  restart: 'Mulai ulang',
  quit: 'Keluar',
  quitTitle: 'Keluar dari permainan ini?',
  restartTitle: 'Mulai ulang permainan ini?',
  restartConfirm: 'Mulai ulang',
  quitConfirm: 'Keluar',
  keepPlaying: 'Lanjut bermain',
  personalBest: 'Permainan terbaik Anda',
  thisGame: 'permainan ini',
  newPersonalBest: 'Rekor pribadi baru.',
  columnRank: '#',
  notRanked: 'Aturan sendiri, jadi permainan ini tidak diperingkat.',
  rankOfTotal: '{rank} dari {total}',

  howToPlay: 'Cara bermain',

  backToGame: 'Kembali ke permainan',
  welcomeTitle: 'Selamat datang di Blinkered',
  tutorialSkip: 'Lewati',
  tutorialNext: 'Berikutnya',
  tutorialBack: 'Kembali',
  tutorialStart: 'Mulai bermain',
  tutorialHideAgain: 'Jangan tampilkan lagi',
  tutorialProgress: '{n} dari {total}',
  tutorialSkipTitle: 'Lewati pengenalan?',
  tutPickLetters: 'Ketuk huruf yang Anda inginkan. Huruf masuk ke kata sesuai urutan ketukan Anda.',
  tutMoreTurn:
    'Ubin terus terbuka selagi Anda berpikir, jadi huruf yang lebih baik mungkin masih datang.',
  tutTapBack:
    'Salah ketuk? Ketuk lagi untuk mengembalikannya. Huruf mana pun, bukan hanya yang terakhir.',
  tutComplete: 'Tekan Selesai saat kata sudah siap.',
  tutControlsTitle: 'Tombol',
  tutReset: 'Atur ulang mengosongkan kata yang sedang Anda susun. Ubin tetap di tempatnya.',
  tutPause:
    'Jeda menghentikan waktu dan menyembunyikan papan, agar istirahat tidak dipakai untuk mempelajarinya.',
  tutRestart: 'Ulangi membagikan papan baru dari awal. Ia bertanya dahulu.',
  tutQuit: 'Keluar mengakhiri permainan dan menampilkan skor Anda. Ia bertanya dahulu.',
  tutDoneTitle: 'Itulah seluruh permainannya',
  tutDoneBody: 'Pilih tingkat lalu bermain. Cara bermain selalu ada di bilah judul.',
  htBoardTitle: 'Papan',
  htBoardBody:
    'Kartu dibuka satu per satu, mengikuti arah baca. Huruf tidak terlihat sampai kartunya berbalik.',
  htWordsTitle: 'Kata',
  htWordsBody:
    'Susun kata dari kartu yang terbuka. Ketik kata itu, atau klik kartunya. Setiap kartu dipakai sekali, dan hanya setelah berbalik.',
  htFlipsTitle: 'Balikan',
  htFlipsBody:
    'Setiap kartu yang berbalik memakan satu balikan. Sebuah kata mengembalikannya, dan kata panjang mengembalikan lebih banyak. Ketika balikan habis, permainan berakhir.',
  htRoundTitle: 'Putaran',
  htRoundBody:
    'Ketika kartu terakhir suatu putaran berbalik, seluruh papan terbuka. Papan bertahan begitu sesaat. Lalu diacak dan dibagikan lagi.',
  htLanguagesTitle: 'Bahasa',
  htLanguagesBody:
    'Enam belas. Setiap papan bisa diselesaikan dengan kata yang benar-benar dipakai. Kata yang tidak umum tetap dihitung, jika kamus mengenalnya.',
  htKeysTitle: 'Papan tik',
  htWildTitle: 'Kartu liar',
  htWildBody:
    'Beberapa kartu terbuka sebagai kartu liar, bukan huruf. Kartu liar berlaku sebagai huruf yang membentuk kata, dipilih dari yang cocok, dan kamu tahu yang mana saat kata itu muncul di daftarmu. Kata yang sudah ada tidak dihitung.',
  htSwapTitle: 'Huruf yang berubah',
  htSwapBody:
    'Di antara ronde, satu ubin berganti huruf. Anda melihat huruf mana yang pergi dan mana yang datang, tetapi bukan di mana letaknya. Hafalkan papan dan papan akan menjebak Anda.',
  htLevelsTitle: 'Tingkat kesulitan',
  htLevelEasy:
    'Dua belas huruf yang sama sepanjang permainan, jadi Anda bisa menghafalnya dan menyimpan daftar kata di kepala. Ubin terbuka perlahan dan papan penuh tetap terlihat cukup lama untuk menyusun satu kata.',
  htLevelMedium:
    'Sesekali satu huruf berubah, sehingga daftar yang Anda simpan tidak lagi tepat. Lebih sedikit waktu untuk melihat dan berpikir.',
  htLevelHard:
    'Kata tiga huruf tidak lagi dihitung, dan satu huruf berubah kira-kira setiap dua ronde. Papan baru saja terlihat sebelum diacak lagi.',
  htLevelInsane:
    'Semuanya sekaligus, dengan kecepatan penuh. Papan lenyap hampir begitu lengkap, dan tidak ada waktu untuk mengingat daftar apa pun.',
  htTouchTitle: 'Layar sentuh',
  htTouchBody:
    'Sentuh kartu yang terbuka untuk mengambil hurufnya. Sentuh huruf mana pun yang sudah diambil untuk mengembalikannya. Kirim dan Hapus ada di bawah papan.',

  plurals: {
    words: { other: '{n} kata' },
    rounds: { other: '{n} putaran' },
    flips: { other: '{n} balikan' },
    ticks: { other: '{n} ketukan' },
    points: { other: '{n} poin' },
  },
}
