import type { Messages } from '../messages.js'

/**
 * Slovak. `ťah` for flips, the word a Slovak board game uses for a move.
 *
 * Same four plural forms as Czech and the same trap: `many` is for fractions, not for large
 * numbers, so `1,5 slova` takes it and `5 slov` does not.
 */
export const sk: Messages = {
  tag: 'sk',

  readingDictionary: 'Načítavam slovník…',
  noWordList: 'Pre „{language}“ chýba zoznam slov. Vytvorte ho:  pnpm dictionary build',
  emptyWordList: 'Zoznam slov pre „{language}“ je prázdny.',

  flips: 'ťahy',
  score: 'skóre',
  words: 'slová',
  round: 'kolo',
  ticksLeftLabel: 'Zostávajúci čas v tomto kole',
  typeAWord: 'napíšte slovo',
  tapPrompt: 'ťuknutím vyberte alebo vráťte písmená, potom {action}',

  boardOfTiles: 'Hracia plocha z {n} kameňov',
  faceDown: 'lícom nadol',
  wildCard: 'žolík',
  wildKey: 'ľubovoľné písmeno',
  letterReplaced: '{from} sa zmenilo na {to}',
  letterSwap: 'VÝMENA PÍSMEN!',
  spentTile: 'použitý kameň',
  hiddenWhilePaused: 'skryté počas prestávky',
  letterInWord: '{letter}, {position}. písmeno slova',

  completeWord: 'Dokončiť slovo',

  completeShort: 'Dokončiť',
  reset: 'Vymazať',
  pause: 'Prestávka',
  resume: 'Pokračovať',
  newGame: 'Nová hra',
  paused: 'Pozastavené',
  outOfFlips: 'Minuli sa ťahy',
  finalResult: '{score} za {words} v {rounds}',
  playAgain: 'Hrať znova',
  share: 'Zdieľať',
  shareCopied: 'Skopírované.',
  shareSelect: 'Skopírujte toto:',

  lettersSelect: 'písmená vyberajú',
  keysWild: 'vezme sa, keď napíšete písmeno, ktoré na ploche nie je',
  clearsEvery: 'vymaže všetky vybrané {letter}',
  undoLastLetter: 'vrátiť posledné písmeno',
  noWordsYet: 'Zatiaľ žiadne slová.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'už nájdené',
  reasonTooShort: 'príliš krátke',
  reasonNotAWord: 'nie je to slovo',
  reasonAllFound: 'už ich máte všetky',
  noSuchLetterUp: 'žiadne odkryté {letter}',
  nothingUp: 'nič nie je odkryté',
  shuffled: 'zamiešané',
  shuffledAndBilled: 'zamiešané, započítaných {flips} nevyužitých',

  gameLanguage: 'jazyk',
  interfaceLanguage: 'rozhranie',
  dictionarySize: '{common} bežných z {full} slov',
  filterLanguages: 'Hľadať jazyk',
  noMatches: 'Žiadna zhoda',

  nerdMode: 'režim pre nadšencov',
  rules: 'Pravidlá',
  difficulty: 'obťažnosť',
  difficultyNames: { easy: 'ľahká', medium: 'stredná', hard: 'ťažká', insane: 'šialená' },
  tiles: 'kamene (N)',
  secondsPerTick: 'sekundy / takt',
  holdTicks: 'takty výdrže',
  minWord: 'najkratšie slovo',
  startingFlips: 'ťahy na začiatku',
  wildChance: 'šanca na žolíka',
  replaceChance: 'šanca na výmenu písmen',
  wordCompleteMode: 'po dokončení slova',
  wordCompleteNames: { shuffle: 'zamiešať', spend: 'minúť', keep: 'ponechať' },
  flipEconomy: 'návrat ťahov',
  flipEconomyNames: {
    none: 'žiadny',
    perLetter: 'za písmeno',
    fibonacci: 'fibonacci',
    overMinimum: 'nad minimum',
  },
  repeatedLetterKey: 'kláves opakovaného písmena',
  keySchemeNames: { cycle: 'cyklus', advance: 'postup' },
  keySchemeHelp: {
    cycle:
      'A vezme ďalšie nepoužité A, a keď sú všetky v slove, vymaže ich. ' +
      'Shift+A ich vymaže tiež.',
    advance: 'A vezme ďalšie nepoužité A. Shift+A vymaže zo slova všetky A.',
  },

  whatThatMeans: 'Čo to znamená',
  factRound: 'kolo',
  factWholeBoardUp: 'celá plocha odkrytá na',
  factRoundCosts: 'kolo stojí',
  factFlipsBuy: 'počiatočné ťahy kúpia',
  factThisBoard: 'táto plocha',
  factBoardHadToAdmit: 'plocha musela pripustiť',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, najdlhšie {longest}',
  wordsIncludingOneOf: '{words}, z toho jedno z {ceiling}',
  scorelessRounds: '{rounds} bez bodov',

  whatAWordPays: 'Čo slovo vynesie',
  columnLetters: 'písmená',
  columnCost: 'cena',
  columnPoints: 'body',
  columnFlips: 'ťahy',
  columnNet: 'rozdiel',

  canonicalRules: 'Štandardné pravidlá pre {difficulty}.',
  customRules: 'Zmenené oproti prednastaveniu. Skóre podľa vlastných pravidiel sa nezapočítava.',
  applyAndStart: 'Použiť a začať novú hru',
  changesNextGame: 'Zmeny sa prejavia v ďalšej hre.',
  presets: 'Prednastavenia:',

  start: 'Začať',
  restart: 'Znova',
  quit: 'Ukončiť',
  quitTitle: 'Ukončiť túto hru?',
  restartTitle: 'Začať túto hru znova?',
  restartConfirm: 'Znova',
  quitConfirm: 'Ukončiť',
  keepPlaying: 'Hrať ďalej',
  personalBest: 'Vaše najlepšie hry',
  thisGame: 'táto hra',
  newPersonalBest: 'Nový osobný rekord.',
  columnRank: '#',
  notRanked: 'Vlastné pravidlá, takže táto hra sa nezapočítava.',
  rankOfTotal: '{rank} z {total}',

  howToPlay: 'Ako hrať',

  backToGame: 'Späť do hry',
  welcomeTitle: 'Vitajte v Blinkered',
  tutorialSkip: 'Preskočiť',
  tutorialNext: 'Ďalej',
  tutorialBack: 'Späť',
  tutorialStart: 'Začať hrať',
  tutorialHideAgain: 'Nabudúce nezobrazovať',
  tutorialProgress: '{n} z {total}',
  tutorialSkipTitle: 'Preskočiť úvod?',
  tutPickLetters: 'Ťukajte na písmená v poradí, v akom chcete zložiť slovo.',
  tutMoreTurn: 'Kamene sa odkrývajú, aj kým premýšľate, takže lepšie písmeno môže ešte prísť.',
  tutTapBack:
    'Vzali ste písmeno, ktoré ste nechceli? Ťuknite naň znova a vráti sa. Ktorékoľvek, nielen posledné.',
  tutComplete: 'Keď je slovo hotové, stlačte Dokončiť.',
  tutControlsTitle: 'Tlačidlá',
  tutReset: 'Vymazať zruší skladané slovo. Kamene zostanú tam, kde sú.',
  tutPause: 'Prestávka zastaví hodiny a skryje plochu, aby prestávka neslúžila na jej učenie.',
  tutRestart: 'Znova rozdá novú plochu od začiatku. Najprv sa opýta.',
  tutQuit: 'Ukončiť hru zakončí a ukáže, koľko ste získali. Najprv sa opýta.',
  tutDoneTitle: 'To je celá hra',
  tutDoneBody: 'Vyberte obťažnosť a hrajte. Ako hrať nájdete vždy pri názve.',
  htBoardTitle: 'Plocha',
  htBoardBody: 'Kamene sa odkrývajú po jednom, v smere čítania. Z odkrytých sa skladajú slová.',
  htWordsTitle: 'Slová',
  htWordsBody: 'Slovo zložíte z odkrytých kameňov písaním alebo klikaním na písmená v poradí.',
  htFlipsTitle: 'Ťahy',
  htFlipsBody:
    'Každý odkrytý kameň stojí ťah. Dokončené slovo ťahy vráti, a dlhšie slová vrátia viac. Keď sa ťahy minú, hra sa končí.',
  htRoundTitle: 'Kolo',
  htRoundBody:
    'Keď sa odkryje posledný kameň kola, celá plocha na chvíľu vydrží. Potom sa kamene otočia a zamiešajú a začne nové kolo.',
  htLanguagesTitle: 'Jazyky',
  htLanguagesBody:
    'Je ich {n}. Každú plochu možno vyriešiť slovami, ktoré ľudia naozaj používajú. Nezvyčajné slovo boduje tiež, ak ho slovník pozná.',
  htKeysTitle: 'Klávesnica',
  htWildTitle: 'Žolíci',
  htWildBody:
    'Občas sa namiesto písmena objaví žolík. Žolík platí za ktorékoľvek písmeno, ktoré tvorí platné slovo. Už dokončené slovo sa nepočíta.',
  htSwapTitle: 'Meniace sa písmená',
  htSwapBody:
    'Občas sa medzi kolami jedno písmeno vymení za iné. Uvidíte, ktoré zmizlo a ktoré pribudlo.',
  htLevelsTitle: 'Obťažnosti',
  htLevelEasy:
    'Rovnakých dvanásť písmen po celú hru, takže sa dajú naučiť a nosiť zoznam slov v hlave. Kamene sa odkrývajú pomaly a celá plocha zostáva vidieť dosť dlho na dokončenie výberu.',
  htLevelMedium:
    'Tu a tam sa písmeno zmení, takže je ťažšie pamätať si slová odložené na neskôr. Menej času na pozeranie aj na premýšľanie.',
  htLevelHard:
    'Trojpísmenové slová prestanú platiť a písmeno sa mení približne každé druhé kolo. Plocha sa sotva ukáže a už sa mieša.',
  htLevelInsane: 'Všetko naraz a naplno. Plocha sa zamieša takmer hneď po poslednom ťahu.',
  htTouchTitle: 'Dotyková obrazovka',
  htTouchBody:
    'Ťuknutím na odkrytý kameň vezmete jeho písmeno. Ťuknutím na vzaté písmeno ho vrátite. Dokončiť a Vymazať sú pod plochou.',

  plurals: {
    words: { one: '{n} slovo', few: '{n} slová', many: '{n} slova', other: '{n} slov' },
    rounds: { one: '{n} kolo', few: '{n} kolá', many: '{n} kola', other: '{n} kôl' },
    flips: { one: '{n} ťah', few: '{n} ťahy', many: '{n} ťahu', other: '{n} ťahov' },
    ticks: { one: '{n} takt', few: '{n} takty', many: '{n} taktu', other: '{n} taktov' },
    points: { one: '{n} bod', few: '{n} body', many: '{n} bodu', other: '{n} bodov' },
  },
}
