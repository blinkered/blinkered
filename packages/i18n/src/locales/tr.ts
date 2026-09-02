import type { Messages } from '../messages.js'

/**
 * Turkish. `taş` for tiles, which is what a Turkish board game calls them, and `çevirme` for
 * flips: the act of turning one, which is what the meter charges for.
 *
 * The plural forms are deliberately identical. Turkish keeps a noun singular after a numeral,
 * so `3 kelime` is right and `3 kelimeler` is a mistake a translator makes once.
 */
export const tr: Messages = {
  tag: 'tr',

  readingDictionary: 'Sözlük okunuyor…',
  noWordList: '"{language}" için kelime listesi yok. Bir tane oluşturun:  pnpm dictionary build',
  emptyWordList: '"{language}" için kelime listesi boş.',

  flips: 'çevirme',
  score: 'puan',
  words: 'kelime',
  round: 'tur',
  ticksLeftLabel: 'Bu turda kalan süre',
  typeAWord: 'bir kelime yazın',
  tapPrompt: 'harfleri seçmek veya geri vermek için dokunun, sonra {action}',

  boardOfTiles: '{n} taşlık tahta',
  faceDown: 'kapalı',
  wildCard: 'joker',
  wildKey: 'herhangi bir harf',
  letterReplaced: '{from} yerine {to} geldi',
  letterSwap: 'HARF DEĞİŞTİ!',
  spentTile: 'kullanılmış taş',
  hiddenWhilePaused: 'duraklatıldığı için gizli',
  letterInWord: '{letter}, kelimenin {position}. harfi',

  completeWord: 'Kelimeyi tamamla',

  completeShort: 'Tamamla',
  reset: 'Sıfırla',
  pause: 'Duraklat',
  resume: 'Sürdür',
  newGame: 'Yeni oyun',
  paused: 'Duraklatıldı',
  outOfFlips: 'Çevirme kalmadı',
  finalResult: '{rounds} boyunca {words} ile {score} puan',
  playAgain: 'Tekrar oyna',
  share: 'Paylaş',
  shareCopied: 'Kopyalandı.',
  shareSelect: 'Şunu kopyalayın:',

  lettersSelect: 'harfler seçer',
  keysWild: 'hiçbir taşta olmayan bir harf yazdığınızda alınır',
  clearsEvery: 'seçili bütün {letter} harflerini siler',
  undoLastLetter: 'son harfi geri al',
  noWordsYet: 'Henüz kelime yok.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'zaten bulundu',
  reasonTooShort: 'çok kısa',
  reasonNotAWord: 'kelime değil',
  reasonAllFound: 'hepsini zaten buldunuz',
  noSuchLetterUp: 'açık {letter} yok',
  nothingUp: 'açık değil',
  shuffled: 'karıldı',
  shuffledAndBilled: 'karıldı, kullanılmayan {flips} çevirme düşüldü',

  gameLanguage: 'dil',
  interfaceLanguage: 'arayüz',
  dictionarySize: '{full} kelimenin {common} tanesi gündelik',

  nerdMode: 'inek modu',
  rules: 'Kurallar',
  difficulty: 'zorluk',
  difficultyNames: { easy: 'kolay', medium: 'orta', hard: 'zor', insane: 'çılgın' },
  tiles: 'taş (N)',
  secondsPerTick: 'saniye / vuruş',
  holdTicks: 'bekleme vuruşu',
  minWord: 'en kısa kelime',
  startingFlips: 'başlangıç çevirmesi',
  wildChance: 'joker olasılığı',
  replaceChance: 'harf değişme olasılığı',
  wordCompleteMode: 'kelime bitince',
  wordCompleteNames: { shuffle: 'karıştır', spend: 'harca', keep: 'sakla' },
  flipEconomy: 'çevirme ekonomisi',
  flipEconomyNames: {
    none: 'yok',
    perLetter: 'harf başına',
    fibonacci: 'fibonacci',
    overMinimum: 'asgarinin üstü',
  },
  repeatedLetterKey: 'tekrar eden harf tuşu',
  keySchemeNames: { cycle: 'döngü', advance: 'ilerle' },
  keySchemeHelp: {
    cycle:
      'A bir sonraki boş A’yı alır, hepsi kelimeye girdikten sonra da onları siler. ' +
      'Shift+A da siler.',
    advance: 'A bir sonraki boş A’yı alır. Shift+A kelimedeki bütün A’ları siler.',
  },

  whatThatMeans: 'Bu ne demek',
  factRound: 'tur',
  factWholeBoardUp: 'tahtanın tamamı açık',
  factRoundCosts: 'bir turun bedeli',
  factFlipsBuy: 'başlangıç çevirmeleri şunu alır',
  factThisBoard: 'bu tahta',
  factBoardHadToAdmit: 'tahtanın kabul etmesi gereken',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, en uzunu {longest}',
  wordsIncludingOneOf: '{words}, biri {ceiling} dahil',
  scorelessRounds: '{rounds} puansız',

  whatAWordPays: 'Bir kelime ne kazandırır',
  columnLetters: 'harf',
  columnCost: 'bedel',
  columnPoints: 'puan',
  columnFlips: 'çevirme',
  columnNet: 'net',

  canonicalRules: 'Standart {difficulty} kuralları.',
  customRules: 'Hazır ayardan değiştirildi. Kendi kurallarınızla alınan puanlar sıralanmaz.',
  applyAndStart: 'Uygula ve yeni oyun başlat',
  changesNextGame: 'Değişiklikler sonraki oyunda geçerli olur.',
  presets: 'Hazır ayarlar:',

  start: 'Başla',
  restart: 'Yeniden başlat',
  quit: 'Çık',
  quitTitle: 'Bu oyundan çıkılsın mı?',
  restartTitle: 'Bu oyun yeniden başlatılsın mı?',
  restartConfirm: 'Yeniden başlat',
  quitConfirm: 'Çık',
  keepPlaying: 'Oynamaya devam et',
  personalBest: 'En iyi oyunlarınız',
  thisGame: 'bu oyun',
  newPersonalBest: 'Yeni bir kişisel rekor.',
  columnRank: '#',
  notRanked: 'Kendi kurallarınız, bu yüzden bu oyun sıralanmaz.',
  rankOfTotal: '{total} içinde {rank}',

  howToPlay: 'Nasıl oynanır',

  backToGame: 'Oyuna dön',
  welcomeTitle: 'Blinkered’a hoş geldiniz',
  tutorialSkip: 'Atla',
  tutorialNext: 'İleri',
  tutorialBack: 'Geri',
  tutorialStart: 'Oynamaya başla',
  tutorialHideAgain: 'Bunu bir daha gösterme',
  tutorialProgress: '{total} içinde {n}',
  tutorialSkipTitle: 'Tanıtım atlansın mı?',
  tutPickLetters: 'İstediğiniz harflere sırayla dokunarak bir kelime kurun.',
  tutMoreTurn: 'Siz düşünürken taşlar dönmeye devam eder, daha iyi bir harf hâlâ gelebilir.',
  tutTapBack:
    'İstemediğiniz birine mi dokundunuz? Geri vermek için tekrar dokunun. Sonuncusu değil, ' +
    'herhangi biri.',
  tutComplete: 'Kelime hazır olunca Tamamla’ya basın.',
  tutControlsTitle: 'Düğmeler',
  tutReset: 'Sıfırla kurmakta olduğunuz kelimeyi siler. Taşlar yerinde kalır.',
  tutPause:
    'Duraklat saati durdurur ve tahtayı gizler, böylece mola tahtayı incelemek için ' +
    'kullanılamaz.',
  tutRestart: 'Yeniden başlat baştan yeni bir tahta dağıtır. Önce sorar.',
  tutQuit: 'Çık oyunu bitirir ve kaç puan aldığınızı gösterir. Önce sorar.',
  tutDoneTitle: 'Oyunun tamamı bu',
  tutDoneBody:
    'Bir seviye seçin ve oynayın. Nasıl oynanır her zaman başlık çubuğunda, tekrar isterseniz.',
  htBoardTitle: 'Tahta',
  htBoardBody: 'Taşlar okuma yönünde, teker teker açılır. Açılan taşlardan kelime kurarsınız.',
  htWordsTitle: 'Kelimeler',
  htWordsBody: 'Açık taşlardan bir kelime kurmak için harfleri sırayla yazın veya tıklayın.',
  htFlipsTitle: 'Çevirmeler',
  htFlipsBody:
    'Dönen her taş bir çevirmeye mal olur. Tamamlanan bir kelime toplamınıza çevirme ekler, uzun kelimeler daha çok verir. Çevirmeler bitince oyun biter.',
  htRoundTitle: 'Tur',
  htRoundBody:
    'Turun son taşı döndüğünde bütün tahta bir an açık kalır. Sonra taşlar kapatılıp karılır ve yeni bir tur başlar.',
  htLanguagesTitle: 'Diller',
  htLanguagesBody:
    '{n} dil. Her tahta, insanların gerçekten kullandığı kelimelerle çözülebilir. Sıra dışı bir kelime de puan getirir, yeter ki sözlük onu bilsin.',
  htKeysTitle: 'Klavye',
  htWildTitle: 'Jokerler',
  htWildBody:
    'Bazen harf yerine bir joker çıkar. Joker, geçerli bir kelime kuran herhangi bir harf sayılır. Daha önce tamamladığınız bir kelime sayılmaz.',
  htSwapTitle: 'Değişen harfler',
  htSwapBody:
    'Bazen turlar arasında bir harfin yerine başka bir harf gelir. Hangi harfin kaldırıldığını ve hangisinin eklendiğini görürsünüz.',
  htLevelsTitle: 'Seviyeler',
  htLevelEasy:
    'Oyun boyunca aynı on iki harf, yani onları öğrenip aklınızda bir kelime listesi tutabilirsiniz. Taşlar yavaş döner ve dolu tahta, harflerinizi rahatça seçmeye yetecek kadar açık kalır.',
  htLevelMedium:
    'Ara sıra bir harf değişir, böylece sonraya sakladığınız kelimeleri akılda tutmak zorlaşır. Bakmaya da düşünmeye de daha az vakit.',
  htLevelHard:
    'Üç harfli kelimeler artık saymaz ve iki turda bir harf değişir. Tahta daha yeni açılmışken karılır.',
  htLevelInsane: 'Hepsi bir arada, tam hızda. Tahta, son çevirmeden hemen sonra karılır.',
  htTouchTitle: 'Dokunmatik ekran',
  htTouchBody:
    'Açık bir taşa dokunarak harfini alın. Aldığınız bir harfe dokunarak geri verin. Tamamla ve Sıfırla tahtanın altında.',

  plurals: {
    words: { one: '{n} kelime', other: '{n} kelime' },
    rounds: { one: '{n} tur', other: '{n} tur' },
    flips: { one: '{n} çevirme', other: '{n} çevirme' },
    ticks: { one: '{n} vuruş', other: '{n} vuruş' },
    points: { one: '{n} puan', other: '{n} puan' },
  },
}
