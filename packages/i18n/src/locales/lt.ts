import type { Messages } from '../messages.js'

/**
 * Lithuanian. `ėjimas` for flips, the word a Lithuanian board game uses for a move.
 *
 * Four plural forms, and the Lithuanian rule is about the last two digits rather than the last
 * one: 11 to 19 take `other` even though they end in 1 to 9, so `11 žodžių` is right and
 * `11 žodis` is not.
 */
export const lt: Messages = {
  tag: 'lt',

  readingDictionary: 'Skaitomas žodynas…',
  noWordList: 'Nėra „{language}“ žodžių sąrašo. Sukurkite jį:  pnpm dictionary build',
  emptyWordList: '„{language}“ žodžių sąrašas tuščias.',

  flips: 'ėjimai',
  score: 'taškai',
  words: 'žodžiai',
  round: 'raundas',
  ticksLeftLabel: 'Likęs laikas šiame raunde',
  typeAWord: 'įveskite žodį',
  tapPrompt: 'palieskite raides, kad pasirinktumėte ar grąžintumėte, tada {action}',

  boardOfTiles: 'Lenta iš {n} kauliukų',
  faceDown: 'apversta',
  wildCard: 'jokeris',
  wildKey: 'bet kuri raidė',
  letterReplaced: '{from} virto {to}',
  letterSwap: 'RAIDŽIŲ MAINAI!',
  spentTile: 'panaudotas kauliukas',
  hiddenWhilePaused: 'paslėpta per pauzę',
  letterInWord: '{letter}, {position}-oji žodžio raidė',

  completeWord: 'Užbaigti žodį',

  completeShort: 'Užbaigti',
  reset: 'Išvalyti',
  pause: 'Pauzė',
  resume: 'Tęsti',
  newGame: 'Naujas žaidimas',
  paused: 'Pristabdyta',
  outOfFlips: 'Baigėsi ėjimai',
  finalResult: '{score} už {words} per {rounds}',
  playAgain: 'Žaisti dar kartą',
  share: 'Dalytis',
  shareCopied: 'Nukopijuota.',
  shareSelect: 'Nukopijuokite tai:',

  lettersSelect: 'raidės renka',
  keysWild: 'paimamas, kai įvedate raidę, kurios nėra ant lentos',
  clearsEvery: 'išvalo visas pasirinktas {letter}',
  undoLastLetter: 'atšaukti paskutinę raidę',
  noWordsYet: 'Dar nė vieno žodžio.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'jau rasta',
  reasonTooShort: 'per trumpas',
  reasonNotAWord: 'tai ne žodis',
  reasonAllFound: 'jau turite juos visus',
  noSuchLetterUp: 'nėra atverstos {letter}',
  nothingUp: 'niekas neatversta',
  shuffled: 'sumaišyta',
  shuffledAndBilled: 'sumaišyta, nuskaityta {flips} nepanaudotų',

  gameLanguage: 'kalba',
  interfaceLanguage: 'sąsaja',
  dictionarySize: '{common} kasdienių iš {full} žodžių',
  filterLanguages: 'Ieškoti kalbos',
  noMatches: 'Atitikmenų nėra',

  nerdMode: 'žinovų režimas',
  rules: 'Taisyklės',
  difficulty: 'sudėtingumas',
  difficultyNames: { easy: 'lengvas', medium: 'vidutinis', hard: 'sunkus', insane: 'beprotiškas' },
  tiles: 'kauliukai (N)',
  secondsPerTick: 'sekundės / taktas',
  holdTicks: 'laikymo taktai',
  minWord: 'trumpiausias žodis',
  startingFlips: 'pradiniai ėjimai',
  wildChance: 'jokerio tikimybė',
  replaceChance: 'raidžių mainų tikimybė',
  wordCompleteMode: 'užbaigus žodį',
  wordCompleteNames: { shuffle: 'sumaišyti', spend: 'panaudoti', keep: 'palikti' },
  flipEconomy: 'ėjimų grąža',
  flipEconomyNames: {
    none: 'nėra',
    perLetter: 'už raidę',
    fibonacci: 'fibonacci',
    overMinimum: 'virš minimumo',
  },
  repeatedLetterKey: 'pasikartojančios raidės klavišas',
  keySchemeNames: { cycle: 'ratu', advance: 'pirmyn' },
  keySchemeHelp: {
    cycle:
      'A paima kitą nepanaudotą A, o kai visos jau žodyje, jas išvalo. ' +
      'Shift+A taip pat jas išvalo.',
    advance: 'A paima kitą nepanaudotą A. Shift+A išvalo iš žodžio visas A.',
  },

  whatThatMeans: 'Ką tai reiškia',
  factRound: 'raundas',
  factWholeBoardUp: 'visa lenta atversta',
  factRoundCosts: 'raundas kainuoja',
  factFlipsBuy: 'pradiniai ėjimai nuperka',
  factThisBoard: 'ši lenta',
  factBoardHadToAdmit: 'lenta turėjo leisti',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, ilgiausias {longest}',
  wordsIncludingOneOf: '{words}, iš jų vienas iš {ceiling}',
  scorelessRounds: '{rounds} be taškų',

  whatAWordPays: 'Kiek duoda žodis',
  columnLetters: 'raidės',
  columnCost: 'kaina',
  columnPoints: 'taškai',
  columnFlips: 'ėjimai',
  columnNet: 'skirtumas',

  canonicalRules: 'Įprastos {difficulty} taisyklės.',
  customRules: 'Pakeista nuo numatytųjų. Rezultatai pagal savas taisykles į lentelę nepatenka.',
  applyAndStart: 'Taikyti ir pradėti naują žaidimą',
  changesNextGame: 'Pakeitimai įsigalios kitame žaidime.',
  presets: 'Numatytieji:',

  start: 'Pradėti',
  restart: 'Iš naujo',
  quit: 'Baigti',
  quitTitle: 'Baigti šį žaidimą?',
  restartTitle: 'Pradėti šį žaidimą iš naujo?',
  restartConfirm: 'Iš naujo',
  quitConfirm: 'Baigti',
  keepPlaying: 'Žaisti toliau',
  personalBest: 'Jūsų geriausi žaidimai',
  thisGame: 'šis žaidimas',
  newPersonalBest: 'Naujas asmeninis rekordas.',
  columnRank: '#',
  notRanked: 'Savos taisyklės, tad šis žaidimas į lentelę nepatenka.',
  rankOfTotal: '{rank} iš {total}',

  howToPlay: 'Kaip žaisti',

  backToGame: 'Atgal į žaidimą',
  welcomeTitle: 'Sveiki atvykę į Blinkered',
  tutorialSkip: 'Praleisti',
  tutorialNext: 'Toliau',
  tutorialBack: 'Atgal',
  tutorialStart: 'Pradėti žaisti',
  tutorialHideAgain: 'Daugiau nerodyti',
  tutorialProgress: '{n} iš {total}',
  tutorialSkipTitle: 'Praleisti apžvalgą?',
  tutPickLetters: 'Lieskite norimas raides iš eilės, kad sudarytumėte žodį.',
  tutMoreTurn: 'Kauliukai verčiasi ir jums begalvojant, tad geresnė raidė gali dar ateiti.',
  tutTapBack:
    'Paėmėte ne tą raidę? Palieskite ją dar kartą ir ji grįš. Bet kurią, ne tik paskutinę.',
  tutComplete: 'Kai žodis parengtas, spauskite Užbaigti.',
  tutControlsTitle: 'Mygtukai',
  tutReset: 'Išvalyti ištrina kuriamą žodį. Kauliukai lieka savo vietose.',
  tutPause: 'Pauzė sustabdo laikrodį ir paslepia lentą, kad pertrauka nebūtų skirta jai mokytis.',
  tutRestart: 'Iš naujo išdalija naują lentą nuo pradžių. Pirma paklausia.',
  tutQuit: 'Baigti užbaigia žaidimą ir parodo rezultatą. Pirma paklausia.',
  tutDoneTitle: 'Štai ir visas žaidimas',
  tutDoneBody: 'Pasirinkite sudėtingumą ir žaiskite. Kaip žaisti visada rasite prie pavadinimo.',
  htBoardTitle: 'Lenta',
  htBoardBody: 'Kauliukai verčiasi po vieną, skaitymo tvarka. Iš atverstų sudaromi žodžiai.',
  htWordsTitle: 'Žodžiai',
  htWordsBody: 'Sudarykite žodį iš atverstų kauliukų rašydami arba spustelėdami raides iš eilės.',
  htFlipsTitle: 'Ėjimai',
  htFlipsBody:
    'Kiekvienas atsiverčiantis kauliukas kainuoja ėjimą. Užbaigtas žodis grąžina ėjimų, o ilgesni žodžiai grąžina daugiau. Kai ėjimai baigiasi, žaidimas baigtas.',
  htRoundTitle: 'Raundas',
  htRoundBody:
    'Kai atsiverčia paskutinis raundo kauliukas, visa lenta akimirką pastovi. Paskui kauliukai apverčiami ir sumaišomi, ir prasideda naujas raundas.',
  htLanguagesTitle: 'Kalbos',
  htLanguagesBody:
    'Jų yra {n}. Kiekvieną lentą galima išspręsti žodžiais, kuriuos žmonės iš tikrųjų vartoja. Retas žodis irgi duoda taškų, jei žodynas jį žino.',
  htKeysTitle: 'Klaviatūra',
  htWildTitle: 'Jokeriai',
  htWildBody:
    'Kartais vietoj raidės pasirodo jokeris. Jokeris skaitomas kaip bet kuri raidė, sudaranti taisyklingą žodį. Jau rastas žodis neskaitomas.',
  htSwapTitle: 'Besikeičiančios raidės',
  htSwapBody:
    'Kartais tarp raundų viena raidė pakeičiama kita. Pamatysite, kuri dingo ir kuri atsirado.',
  htLevelsTitle: 'Lygiai',
  htLevelEasy:
    'Tos pačios dvylika raidžių visą žaidimą, tad jas galima išmokti ir nešiotis žodžių sąrašą galvoje. Kauliukai verčiasi lėtai, o visa lenta matoma pakankamai ilgai, kad spėtumėte pasirinkti.',
  htLevelMedium:
    'Retkarčiais raidė pasikeičia, tad sunkiau atsiminti vėlesniam laikui atidėtus žodžius. Mažiau laiko žiūrėti ir mažiau galvoti.',
  htLevelHard:
    'Trijų raidžių žodžiai nebeskaičiuojami, o raidė keičiasi maždaug kas antrą raundą. Lenta vos spėja pasirodyti ir jau maišoma.',
  htLevelInsane:
    'Viskas iš karto ir visu greičiu. Lenta sumaišoma beveik iškart po paskutinio ėjimo.',
  htTouchTitle: 'Jutiklinis ekranas',
  htTouchBody:
    'Palieskite atverstą kauliuką, kad paimtumėte jo raidę. Palieskite paimtą raidę, kad ją grąžintumėte. Užbaigti ir Išvalyti yra po lenta.',

  plurals: {
    words: { one: '{n} žodis', few: '{n} žodžiai', many: '{n} žodžio', other: '{n} žodžių' },
    rounds: { one: '{n} raundas', few: '{n} raundai', many: '{n} raundo', other: '{n} raundų' },
    flips: { one: '{n} ėjimas', few: '{n} ėjimai', many: '{n} ėjimo', other: '{n} ėjimų' },
    ticks: { one: '{n} taktas', few: '{n} taktai', many: '{n} takto', other: '{n} taktų' },
    points: { one: '{n} taškas', few: '{n} taškai', many: '{n} taško', other: '{n} taškų' },
  },
}
