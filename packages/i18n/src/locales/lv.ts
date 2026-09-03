import type { Messages } from '../messages.js'

/**
 * Latvian. `gājiens` for flips, the word a Latvian board game uses for a move.
 *
 * Three plural forms, and the odd one is `zero`: Latvian uses it for every number ending in
 * nought, so 10, 20 and 130 all take the same form as 0. It is a genitive plural, not an
 * absence — `20 vārdu`.
 */
export const lv: Messages = {
  tag: 'lv',

  readingDictionary: 'Lasa vārdnīcu…',
  noWordList: 'Nav vārdu saraksta valodai “{language}”. Izveidojiet to:  pnpm dictionary build',
  emptyWordList: 'Vārdu saraksts valodai “{language}” ir tukšs.',

  flips: 'gājieni',
  score: 'punkti',
  words: 'vārdi',
  round: 'raunds',
  ticksLeftLabel: 'Atlikušais laiks šajā raundā',
  typeAWord: 'ierakstiet vārdu',
  tapPrompt: 'pieskarieties burtiem, lai izvēlētos vai atdotu, tad {action}',

  boardOfTiles: 'Galdiņš ar {n} kauliņiem',
  faceDown: 'apgriezts',
  wildCard: 'džokers',
  wildKey: 'jebkurš burts',
  letterReplaced: '{from} kļuva par {to}',
  letterSwap: 'BURTU MAIŅA!',
  spentTile: 'izmantots kauliņš',
  hiddenWhilePaused: 'paslēpts pauzes laikā',
  letterInWord: '{letter}, vārda {position}. burts',

  completeWord: 'Pabeigt vārdu',

  completeShort: 'Pabeigt',
  reset: 'Notīrīt',
  pause: 'Pauze',
  resume: 'Turpināt',
  newGame: 'Jauna spēle',
  paused: 'Apturēts',
  outOfFlips: 'Gājieni beigušies',
  finalResult: '{score} par {words} {rounds} laikā',
  playAgain: 'Spēlēt vēlreiz',
  share: 'Kopīgot',
  shareCopied: 'Nokopēts.',
  shareSelect: 'Nokopējiet šo:',

  lettersSelect: 'burti izvēlas',
  keysWild: 'tiek paņemts, kad ierakstāt burtu, kura nav uz galdiņa',
  clearsEvery: 'notīra visus izvēlētos {letter}',
  undoLastLetter: 'atsaukt pēdējo burtu',
  noWordsYet: 'Vēl neviena vārda.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'jau atrasts',
  reasonTooShort: 'pārāk īss',
  reasonNotAWord: 'tas nav vārds',
  reasonAllFound: 'jums jau ir tie visi',
  noSuchLetterUp: 'nav atklāta {letter}',
  nothingUp: 'nekas nav atklāts',
  shuffled: 'sajaukts',
  shuffledAndBilled: 'sajaukts, ieskaitīti {flips} neizmantoti',

  gameLanguage: 'valoda',
  interfaceLanguage: 'saskarne',
  dictionarySize: '{common} ikdienas no {full} vārdiem',
  filterLanguages: 'Meklēt valodu',
  noMatches: 'Nav atbilstību',

  nerdMode: 'zinātāju režīms',
  rules: 'Noteikumi',
  difficulty: 'grūtība',
  difficultyNames: { easy: 'viegla', medium: 'vidēja', hard: 'grūta', insane: 'trakā' },
  tiles: 'kauliņi (N)',
  secondsPerTick: 'sekundes / takts',
  holdTicks: 'noturēšanas taktis',
  minWord: 'īsākais vārds',
  startingFlips: 'sākuma gājieni',
  wildChance: 'džokera iespēja',
  replaceChance: 'burtu maiņas iespēja',
  wordCompleteMode: 'kad vārds pabeigts',
  wordCompleteNames: { shuffle: 'sajaukt', spend: 'izlietot', keep: 'paturēt' },
  flipEconomy: 'gājienu atdeve',
  flipEconomyNames: {
    none: 'nav',
    perLetter: 'par burtu',
    fibonacci: 'fibonači',
    overMinimum: 'virs minimuma',
  },
  repeatedLetterKey: 'atkārtota burta taustiņš',
  keySchemeNames: { cycle: 'ciklis', advance: 'uz priekšu' },
  keySchemeHelp: {
    cycle:
      'A paņem nākamo neizmantoto A, un, kad tie visi ir vārdā, notīra tos. ' +
      'Shift+A tos arī notīra.',
    advance: 'A paņem nākamo neizmantoto A. Shift+A notīra no vārda visus A.',
  },

  whatThatMeans: 'Ko tas nozīmē',
  factRound: 'raunds',
  factWholeBoardUp: 'viss galdiņš atklāts',
  factRoundCosts: 'raunds maksā',
  factFlipsBuy: 'sākuma gājieni nopērk',
  factThisBoard: 'šis galdiņš',
  factBoardHadToAdmit: 'galdiņam bija jāatzīst',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, garākais {longest}',
  wordsIncludingOneOf: '{words}, no tiem viens no {ceiling}',
  scorelessRounds: '{rounds} bez punktiem',

  whatAWordPays: 'Ko dod vārds',
  columnLetters: 'burti',
  columnCost: 'cena',
  columnPoints: 'punkti',
  columnFlips: 'gājieni',
  columnNet: 'starpība',

  canonicalRules: 'Parastie {difficulty} noteikumi.',
  customRules: 'Mainīts no iepriekšiestatītā. Rezultāti pēc saviem noteikumiem netiek vērtēti.',
  applyAndStart: 'Lietot un sākt jaunu spēli',
  changesNextGame: 'Izmaiņas stāsies spēkā nākamajā spēlē.',
  presets: 'Iestatījumi:',

  start: 'Sākt',
  restart: 'No jauna',
  quit: 'Beigt',
  quitTitle: 'Vai beigt šo spēli?',
  restartTitle: 'Vai sākt šo spēli no jauna?',
  restartConfirm: 'No jauna',
  quitConfirm: 'Beigt',
  keepPlaying: 'Spēlēt tālāk',
  personalBest: 'Jūsu labākās spēles',
  thisGame: 'šī spēle',
  newPersonalBest: 'Jauns personiskais rekords.',
  columnRank: '#',
  notRanked: 'Savi noteikumi, tāpēc šī spēle netiek vērtēta.',
  rankOfTotal: '{rank} no {total}',

  howToPlay: 'Kā spēlēt',

  backToGame: 'Atpakaļ uz spēli',
  welcomeTitle: 'Laipni lūdzam Blinkered',
  tutorialSkip: 'Izlaist',
  tutorialNext: 'Tālāk',
  tutorialBack: 'Atpakaļ',
  tutorialStart: 'Sākt spēlēt',
  tutorialHideAgain: 'Vairs nerādīt',
  tutorialProgress: '{n} no {total}',
  tutorialSkipTitle: 'Vai izlaist ievadu?',
  tutPickLetters: 'Pieskarieties vēlamajiem burtiem pēc kārtas, lai izveidotu vārdu.',
  tutMoreTurn: 'Kauliņi turpina griezties, kamēr domājat, tāpēc labāks burts vēl var pienākt.',
  tutTapBack:
    'Paņēmāt burtu, kuru negribējāt? Pieskarieties tam vēlreiz, un tas atgriezīsies. Jebkuram, ne tikai pēdējam.',
  tutComplete: 'Kad vārds gatavs, nospiediet Pabeigt.',
  tutControlsTitle: 'Pogas',
  tutReset: 'Notīrīt izdzēš veidojamo vārdu. Kauliņi paliek savās vietās.',
  tutPause:
    'Pauze aptur pulksteni un paslēpj galdiņu, lai pārtraukumu neizmantotu tā iegaumēšanai.',
  tutRestart: 'No jauna izdala jaunu galdiņu no sākuma. Vispirms pajautā.',
  tutQuit: 'Beigt pabeidz spēli un parāda rezultātu. Vispirms pajautā.',
  tutDoneTitle: 'Tā ir visa spēle',
  tutDoneBody: 'Izvēlieties grūtību un spēlējiet. Kā spēlēt vienmēr ir pie nosaukuma.',
  htBoardTitle: 'Galdiņš',
  htBoardBody: 'Kauliņi atklājas pa vienam, lasīšanas secībā. No atklātajiem veido vārdus.',
  htWordsTitle: 'Vārdi',
  htWordsBody:
    'Izveidojiet vārdu no atklātajiem kauliņiem, rakstot vai klikšķinot burtus pēc kārtas.',
  htFlipsTitle: 'Gājieni',
  htFlipsBody:
    'Katrs atklātais kauliņš maksā gājienu. Pabeigts vārds atdod gājienus, un garāki vārdi atdod vairāk. Kad gājieni beidzas, spēle ir galā.',
  htRoundTitle: 'Raunds',
  htRoundBody:
    'Kad atklājas raunda pēdējais kauliņš, viss galdiņš uz mirkli paliek. Tad kauliņus apgriež un sajauc, un sākas jauns raunds.',
  htLanguagesTitle: 'Valodas',
  htLanguagesBody:
    'To ir {n}. Katru galdiņu var atrisināt ar vārdiem, ko cilvēki tiešām lieto. Rets vārds arī dod punktus, ja vārdnīca to zina.',
  htKeysTitle: 'Tastatūra',
  htWildTitle: 'Džokeri',
  htWildBody:
    'Reizēm burta vietā parādās džokers. Džokers skaitās par jebkuru burtu, kas veido derīgu vārdu. Jau atrasts vārds neskaitās.',
  htSwapTitle: 'Mainīgie burti',
  htSwapBody:
    'Reizēm starp raundiem viens burts tiek nomainīts pret citu. Redzēsiet, kurš pazuda un kurš pienāca.',
  htLevelsTitle: 'Līmeņi',
  htLevelEasy:
    'Tie paši divpadsmit burti visu spēli, tāpēc tos var iemācīties un nēsāt vārdu sarakstu galvā. Kauliņi atklājas lēni, un viss galdiņš paliek redzams pietiekami ilgi, lai pabeigtu izvēli.',
  htLevelMedium:
    'Ik pa laikam burts mainās, tāpēc grūtāk atcerēties vēlākam laikam atliktos vārdus. Mazāk laika skatīties un mazāk domāt.',
  htLevelHard:
    'Trīsburtu vārdi vairs neskaitās, un burts mainās aptuveni katru otro raundu. Galdiņš tikko paguvis parādīties, kad jau tiek sajaukts.',
  htLevelInsane:
    'Viss uzreiz un pilnā ātrumā. Galdiņš tiek sajaukts gandrīz tūlīt pēc pēdējā gājiena.',
  htTouchTitle: 'Skārienekrāns',
  htTouchBody:
    'Pieskarieties atklātam kauliņam, lai paņemtu tā burtu. Pieskarieties paņemtam burtam, lai to atdotu. Pabeigt un Notīrīt ir zem galdiņa.',

  plurals: {
    words: { zero: '{n} vārdu', one: '{n} vārds', other: '{n} vārdi' },
    rounds: { zero: '{n} raundu', one: '{n} raunds', other: '{n} raundi' },
    flips: { zero: '{n} gājienu', one: '{n} gājiens', other: '{n} gājieni' },
    ticks: { zero: '{n} taktu', one: '{n} takts', other: '{n} taktis' },
    points: { zero: '{n} punktu', one: '{n} punkts', other: '{n} punkti' },
  },
}
