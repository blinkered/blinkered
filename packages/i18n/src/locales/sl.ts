import type { Messages } from '../messages.js'

/**
 * Slovene. `poteza` for flips, the word a Slovene board game uses for a move.
 *
 * Slovene has a dual, which almost nothing else here does: two words is `dve besedi`, and it is
 * a form of its own rather than a plural used loosely. Getting it wrong is not a subtle error.
 */
export const sl: Messages = {
  tag: 'sl',

  readingDictionary: 'Berem slovar…',
  noWordList: 'Za »{language}« ni seznama besed. Ustvarite ga:  pnpm dictionary build',
  emptyWordList: 'Seznam besed za »{language}« je prazen.',

  flips: 'poteze',
  score: 'rezultat',
  words: 'besede',
  round: 'krog',
  ticksLeftLabel: 'Preostali čas v tem krogu',
  typeAWord: 'vpišite besedo',
  tapPrompt: 'tapnite črke za izbiro ali vrnitev, nato {action}',

  boardOfTiles: 'Igralna plošča s {n} ploščicami',
  faceDown: 'obrnjeno navzdol',
  wildCard: 'joker',
  wildKey: 'katera koli črka',
  letterReplaced: '{from} se je spremenil v {to}',
  letterSwap: 'ZAMENJAVA ČRK!',
  spentTile: 'porabljena ploščica',
  hiddenWhilePaused: 'skrito med premorom',
  letterInWord: '{letter}, {position}. črka besede',

  completeWord: 'Dokončaj besedo',

  completeShort: 'Dokončaj',
  reset: 'Počisti',
  pause: 'Premor',
  resume: 'Nadaljuj',
  newGame: 'Nova igra',
  paused: 'Ustavljeno',
  outOfFlips: 'Zmanjkalo je potez',
  finalResult: '{score} za {words} v {rounds}',
  playAgain: 'Igraj znova',
  share: 'Deli',
  shareCopied: 'Kopirano.',
  shareSelect: 'Kopirajte to:',

  lettersSelect: 'črke izbirajo',
  keysWild: 'vzame se, ko vpišete črko, ki je ni na plošči',
  clearsEvery: 'počisti vse izbrane {letter}',
  undoLastLetter: 'razveljavi zadnjo črko',
  noWordsYet: 'Zaenkrat ni besed.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'že najdeno',
  reasonTooShort: 'prekratko',
  reasonNotAWord: 'ni beseda',
  reasonAllFound: 'vse jih že imate',
  noSuchLetterUp: 'ni odkritega {letter}',
  nothingUp: 'nič ni odkrito',
  shuffled: 'premešano',
  shuffledAndBilled: 'premešano, zaračunanih {flips} neporabljenih',

  gameLanguage: 'jezik',
  interfaceLanguage: 'vmesnik',
  dictionarySize: '{common} vsakdanjih od {full} besed',
  filterLanguages: 'Iskanje jezika',
  noMatches: 'Ni zadetkov',

  nerdMode: 'način za navdušence',
  rules: 'Pravila',
  difficulty: 'težavnost',
  difficultyNames: { easy: 'lahka', medium: 'srednja', hard: 'težka', insane: 'nora' },
  tiles: 'ploščice (N)',
  secondsPerTick: 'sekunde / utrip',
  holdTicks: 'utripi zadržanja',
  minWord: 'najkrajša beseda',
  startingFlips: 'začetne poteze',
  wildChance: 'možnost jokerja',
  replaceChance: 'možnost zamenjave črk',
  wordCompleteMode: 'ko je beseda končana',
  wordCompleteNames: { shuffle: 'premešaj', spend: 'porabi', keep: 'obdrži' },
  flipEconomy: 'vračanje potez',
  flipEconomyNames: {
    none: 'brez',
    perLetter: 'na črko',
    fibonacci: 'fibonacci',
    overMinimum: 'nad najmanjšo',
  },
  repeatedLetterKey: 'tipka ponovljene črke',
  keySchemeNames: { cycle: 'krožno', advance: 'naprej' },
  keySchemeHelp: {
    cycle:
      'A vzame naslednji neuporabljeni A, in ko so vsi v besedi, jih počisti. ' +
      'Shift+A jih tudi počisti.',
    advance: 'A vzame naslednji neuporabljeni A. Shift+A počisti vse A v besedi.',
  },

  whatThatMeans: 'Kaj to pomeni',
  factRound: 'krog',
  factWholeBoardUp: 'vsa plošča odkrita za',
  factRoundCosts: 'krog stane',
  factFlipsBuy: 'začetne poteze kupijo',
  factThisBoard: 'ta plošča',
  factBoardHadToAdmit: 'plošča je morala dopustiti',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, najdaljša {longest}',
  wordsIncludingOneOf: '{words}, med njimi ena od {ceiling}',
  scorelessRounds: '{rounds} brez točk',

  whatAWordPays: 'Kaj prinese beseda',
  columnLetters: 'črke',
  columnCost: 'cena',
  columnPoints: 'točke',
  columnFlips: 'poteze',
  columnNet: 'razlika',

  canonicalRules: 'Standardna pravila za {difficulty}.',
  customRules: 'Spremenjeno od prednastavitve. Rezultati po lastnih pravilih se ne uvrščajo.',
  applyAndStart: 'Uporabi in začni novo igro',
  changesNextGame: 'Spremembe začnejo veljati z naslednjo igro.',
  presets: 'Prednastavitve:',

  start: 'Začni',
  restart: 'Znova',
  quit: 'Končaj',
  quitTitle: 'Končati to igro?',
  restartTitle: 'Začeti to igro znova?',
  restartConfirm: 'Znova',
  quitConfirm: 'Končaj',
  keepPlaying: 'Igraj naprej',
  personalBest: 'Vaše najboljše igre',
  thisGame: 'ta igra',
  newPersonalBest: 'Nov osebni rekord.',
  columnRank: '#',
  notRanked: 'Lastna pravila, zato se ta igra ne uvršča.',
  rankOfTotal: '{rank} od {total}',

  howToPlay: 'Kako igrati',

  backToGame: 'Nazaj v igro',
  welcomeTitle: 'Dobrodošli v Blinkered',
  tutorialSkip: 'Preskoči',
  tutorialNext: 'Naprej',
  tutorialBack: 'Nazaj',
  tutorialStart: 'Začni igrati',
  tutorialHideAgain: 'Tega ne kaži več',
  tutorialProgress: '{n} od {total}',
  tutorialSkipTitle: 'Preskočiti uvod?',
  tutPickLetters: 'Tapkajte črke po vrsti, da sestavite besedo.',
  tutMoreTurn: 'Ploščice se odkrivajo, medtem ko razmišljate, zato boljša črka morda še pride.',
  tutTapBack:
    'Ste vzeli črko, ki je niste želeli? Tapnite jo znova in se vrne. Katero koli, ne le zadnjo.',
  tutComplete: 'Ko je beseda pripravljena, pritisnite Dokončaj.',
  tutControlsTitle: 'Gumbi',
  tutReset: 'Počisti izbriše besedo, ki jo sestavljate. Ploščice ostanejo, kjer so.',
  tutPause: 'Premor ustavi uro in skrije ploščo, da odmor ne bi služil učenju na pamet.',
  tutRestart: 'Znova razdeli novo ploščo od začetka. Prej vpraša.',
  tutQuit: 'Končaj konča igro in pokaže rezultat. Prej vpraša.',
  tutDoneTitle: 'To je vsa igra',
  tutDoneBody: 'Izberite težavnost in igrajte. Kako igrati je vedno ob naslovu.',
  htBoardTitle: 'Plošča',
  htBoardBody:
    'Ploščice se odkrivajo ena za drugo, v smeri branja. Iz odkritih se sestavljajo besede.',
  htWordsTitle: 'Besede',
  htWordsBody: 'Besedo sestavite iz odkritih ploščic z vpisovanjem ali klikanjem črk po vrsti.',
  htFlipsTitle: 'Poteze',
  htFlipsBody:
    'Vsaka odkrita ploščica stane potezo. Dokončana beseda poteze vrne, daljše besede pa vrnejo več. Ko potez zmanjka, je igre konec.',
  htRoundTitle: 'Krog',
  htRoundBody:
    'Ko se odkrije zadnja ploščica kroga, vsa plošča za trenutek obstane. Nato se ploščice obrnejo in premešajo in začne se nov krog.',
  htLanguagesTitle: 'Jeziki',
  htLanguagesBody:
    'Toliko jih je: {n}. Vsako ploščo je mogoče rešiti z besedami, ki jih ljudje res uporabljajo. Nenavadna beseda šteje tudi, če jo slovar pozna.',
  htKeysTitle: 'Tipkovnica',
  htWildTitle: 'Jokerji',
  htWildBody:
    'Včasih se namesto črke pojavi joker. Joker velja za katero koli črko, ki tvori veljavno besedo. Že dokončana beseda ne šteje.',
  htSwapTitle: 'Menjava črk',
  htSwapBody:
    'Včasih se med krogi ena črka zamenja z drugo. Videli boste, katera je odšla in katera je prišla.',
  htLevelsTitle: 'Težavnosti',
  htLevelEasy:
    'Istih dvanajst črk vso igro, tako da se jih lahko naučite in nosite seznam besed v glavi. Ploščice se odkrivajo počasi, vsa plošča pa ostane vidna dovolj dolgo, da dokončate izbiro.',
  htLevelMedium:
    'Tu in tam se črka spremeni, zato si je težje zapomniti besede, prihranjene za pozneje. Manj časa za gledanje in manj za razmišljanje.',
  htLevelHard:
    'Tričrkovne besede nehajo šteti, črka pa se spremeni približno vsak drugi krog. Plošča se komaj pokaže, že se premeša.',
  htLevelInsane:
    'Vse hkrati in s polno hitrostjo. Plošča se premeša skoraj takoj po zadnji potezi.',
  htTouchTitle: 'Zaslon na dotik',
  htTouchBody:
    'Tapnite odkrito ploščico, da vzamete njeno črko. Tapnite vzeto črko, da jo vrnete. Dokončaj in Počisti sta pod ploščo.',

  plurals: {
    words: { one: '{n} beseda', two: '{n} besedi', few: '{n} besede', other: '{n} besed' },
    rounds: { one: '{n} krog', two: '{n} kroga', few: '{n} krogi', other: '{n} krogov' },
    flips: { one: '{n} poteza', two: '{n} potezi', few: '{n} poteze', other: '{n} potez' },
    ticks: { one: '{n} utrip', two: '{n} utripa', few: '{n} utripi', other: '{n} utripov' },
    points: { one: '{n} točka', two: '{n} točki', few: '{n} točke', other: '{n} točk' },
  },
}
