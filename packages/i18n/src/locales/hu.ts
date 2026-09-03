import type { Messages } from '../messages.js'

/**
 * Hungarian. `lépés` for flips, the word a Hungarian board game uses for a move.
 *
 * Every plural here is written in the singular, which is not an oversight: after a number
 * Hungarian takes the singular, so it is `két szó` and `húsz szó`, never `két szavak`. The two
 * CLDR forms exist and carry the same string, because that is what the language does.
 */
export const hu: Messages = {
  tag: 'hu',

  readingDictionary: 'Szótár betöltése…',
  noWordList: 'Nincs szólista ehhez: „{language}”. Készítsen egyet:  pnpm dictionary build',
  emptyWordList: 'A(z) „{language}” szólistája üres.',

  flips: 'lépés',
  score: 'pontszám',
  words: 'szavak',
  round: 'kör',
  ticksLeftLabel: 'Hátralévő idő ebben a körben',
  typeAWord: 'írjon be egy szót',
  tapPrompt: 'érintse meg a betűket a kiválasztáshoz vagy visszavételhez, majd {action}',

  boardOfTiles: 'Tábla {n} lapkával',
  faceDown: 'lefordítva',
  wildCard: 'joker',
  wildKey: 'bármelyik betű',
  letterReplaced: '{from} helyére {to} került',
  letterSwap: 'BETŰCSERE!',
  spentTile: 'elhasznált lapka',
  hiddenWhilePaused: 'szünet alatt rejtve',
  letterInWord: '{letter}, a szó {position}. betűje',

  completeWord: 'Szó befejezése',

  completeShort: 'Kész',
  reset: 'Törlés',
  pause: 'Szünet',
  resume: 'Folytatás',
  newGame: 'Új játék',
  paused: 'Szüneteltetve',
  outOfFlips: 'Elfogytak a lépések',
  finalResult: '{score} ennyiért: {words}, {rounds} alatt',
  playAgain: 'Új játék',
  share: 'Megosztás',
  shareCopied: 'Másolva.',
  shareSelect: 'Másolja ki ezt:',

  lettersSelect: 'a betűk választanak',
  keysWild: 'akkor veszi el, ha olyan betűt ír, amit egy lapka sem mutat',
  clearsEvery: 'törli az összes kiválasztott {letter} betűt',
  undoLastLetter: 'utolsó betű visszavonása',
  noWordsYet: 'Még nincs szó.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'már megvan',
  reasonTooShort: 'túl rövid',
  reasonNotAWord: 'ez nem szó',
  reasonAllFound: 'már mind megvan',
  noSuchLetterUp: 'nincs felfordított {letter}',
  nothingUp: 'semmi sincs felfordítva',
  shuffled: 'megkeverve',
  shuffledAndBilled: 'megkeverve, {flips} felhasználatlan levonva',

  gameLanguage: 'nyelv',
  interfaceLanguage: 'felület',
  dictionarySize: '{common} hétköznapi a(z) {full} szóból',
  filterLanguages: 'Nyelv keresése',
  noMatches: 'Nincs találat',

  nerdMode: 'kockamód',
  rules: 'Szabályok',
  difficulty: 'nehézség',
  difficultyNames: { easy: 'könnyű', medium: 'közepes', hard: 'nehéz', insane: 'őrült' },
  tiles: 'lapkák (N)',
  secondsPerTick: 'másodperc / ütem',
  holdTicks: 'tartás üteme',
  minWord: 'legrövidebb szó',
  startingFlips: 'kezdő lépések',
  wildChance: 'joker esélye',
  replaceChance: 'betűcsere esélye',
  wordCompleteMode: 'ha a szó elkészült',
  wordCompleteNames: { shuffle: 'keverés', spend: 'elhasználás', keep: 'megtartás' },
  flipEconomy: 'lépések visszatérülése',
  flipEconomyNames: {
    none: 'nincs',
    perLetter: 'betűnként',
    fibonacci: 'fibonacci',
    overMinimum: 'minimum felett',
  },
  repeatedLetterKey: 'ismételt betű billentyűje',
  keySchemeNames: { cycle: 'körben', advance: 'előre' },
  keySchemeHelp: {
    cycle:
      'Az A a következő szabad A-t veszi el, és ha már mind a szóban van, törli őket. ' +
      'A Shift+A is törli őket.',
    advance: 'Az A a következő szabad A-t veszi el. A Shift+A a szó összes A-ját törli.',
  },

  whatThatMeans: 'Mit jelent ez',
  factRound: 'kör',
  factWholeBoardUp: 'az egész tábla látszik',
  factRoundCosts: 'egy kör ennyibe kerül',
  factFlipsBuy: 'a kezdő lépések ennyit vesznek',
  factThisBoard: 'ez a tábla',
  factBoardHadToAdmit: 'a táblának ennyit kellett megengednie',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, a leghosszabb {longest}',
  wordsIncludingOneOf: '{words}, köztük egy {ceiling}',
  scorelessRounds: '{rounds} pont nélkül',

  whatAWordPays: 'Mit ér egy szó',
  columnLetters: 'betűk',
  columnCost: 'ár',
  columnPoints: 'pont',
  columnFlips: 'lépés',
  columnNet: 'egyenleg',

  canonicalRules: 'Szokásos {difficulty} szabályok.',
  customRules: 'Eltér az alapbeállítástól. Saját szabályokkal elért pont nem kerül a listára.',
  applyAndStart: 'Alkalmazás és új játék',
  changesNextGame: 'A változások a következő játéktól érvényesek.',
  presets: 'Alapbeállítások:',

  start: 'Indítás',
  restart: 'Újrakezdés',
  quit: 'Kilépés',
  quitTitle: 'Kilép ebből a játékból?',
  restartTitle: 'Újrakezdi ezt a játékot?',
  restartConfirm: 'Újrakezdés',
  quitConfirm: 'Kilépés',
  keepPlaying: 'Játék folytatása',
  personalBest: 'Az ön legjobb játékai',
  thisGame: 'ez a játék',
  newPersonalBest: 'Új egyéni csúcs.',
  columnRank: '#',
  notRanked: 'Saját szabályok, ezért ez a játék nem kerül a listára.',
  rankOfTotal: '{rank} / {total}',

  howToPlay: 'Hogyan kell játszani',

  backToGame: 'Vissza a játékhoz',
  welcomeTitle: 'Üdvözöljük a Blinkeredben',
  tutorialSkip: 'Kihagyás',
  tutorialNext: 'Tovább',
  tutorialBack: 'Vissza',
  tutorialStart: 'Kezdjük a játékot',
  tutorialHideAgain: 'Ne mutassa ezt újra',
  tutorialProgress: '{n} / {total}',
  tutorialSkipTitle: 'Kihagyja a bemutatót?',
  tutPickLetters: 'Érintse meg a kívánt betűket sorban, hogy szót alkosson.',
  tutMoreTurn: 'A lapkák akkor is fordulnak, amíg gondolkodik, így még jöhet jobb betű.',
  tutTapBack:
    'Olyat vett el, amit nem akart? Érintse meg újra, és visszakerül. Bármelyiket, nem csak az utolsót.',
  tutComplete: 'Ha a szó kész, nyomja meg a Kész gombot.',
  tutControlsTitle: 'A gombok',
  tutReset: 'A Törlés eltünteti az épp készülő szót. A lapkák a helyükön maradnak.',
  tutPause:
    'A Szünet megállítja az órát és elrejti a táblát, hogy a pihenő ne tanulásra menjen el.',
  tutRestart: 'Az Újrakezdés új táblát oszt az elejéről. Előbb rákérdez.',
  tutQuit: 'A Kilépés befejezi a játékot és megmutatja az eredményt. Előbb rákérdez.',
  tutDoneTitle: 'Ennyi az egész játék',
  tutDoneBody: 'Válasszon nehézséget és játsszon. A leírás mindig ott van a cím mellett.',
  htBoardTitle: 'A tábla',
  htBoardBody:
    'A lapkák egyesével fordulnak fel, olvasási sorrendben. A felfordítottakból lehet szót alkotni.',
  htWordsTitle: 'A szavak',
  htWordsBody:
    'Alkosson szót a látható lapkákból: gépelje be vagy kattintson a betűkre sorrendben.',
  htFlipsTitle: 'A lépések',
  htFlipsBody:
    'Minden felforduló lapka egy lépésbe kerül. Az elkészült szó lépéseket ad vissza, a hosszabb szó többet. Ha elfogynak a lépések, vége a játéknak.',
  htRoundTitle: 'A kör',
  htRoundBody:
    'Amikor a kör utolsó lapkája felfordul, az egész tábla egy pillanatra megáll. Utána a lapkákat lefordítják és megkeverik, és új kör kezdődik.',
  htLanguagesTitle: 'A nyelvek',
  htLanguagesBody:
    '{n} nyelv. Minden tábla megoldható olyan szavakkal, amelyeket az emberek tényleg használnak. A ritka szó is pontot ér, ha a szótár ismeri.',
  htKeysTitle: 'A billentyűzet',
  htWildTitle: 'A jokerek',
  htWildBody:
    'Néha betű helyett joker jelenik meg. A joker bármelyik betűnek számít, amivel érvényes szó lesz. A már meglévő szó nem számít.',
  htSwapTitle: 'Változó betűk',
  htSwapBody:
    'Néha két kör között egy betű helyére másik kerül. Látni fogja, melyik tűnt el és melyik jött.',
  htLevelsTitle: 'A szintek',
  htLevelEasy:
    'Ugyanaz a tizenkét betű az egész játékban, így meg lehet tanulni és fejben tartani egy szólistát. A lapkák lassan fordulnak, és az egész tábla elég sokáig látszik ahhoz, hogy befejezze a válogatást.',
  htLevelMedium:
    'Időnként megváltozik egy betű, így nehezebb fejben tartani a későbbre félretett szavakat. Kevesebb idő nézni, és kevesebb gondolkodni.',
  htLevelHard:
    'A hárombetűs szavak már nem számítanak, és nagyjából minden második körben cserélődik egy betű. A tábla alig mutatkozik meg, máris keveredik.',
  htLevelInsane:
    'Minden egyszerre, teljes sebességgel. A tábla szinte azonnal keveredik az utolsó lépés után.',
  htTouchTitle: 'Az érintőképernyő',
  htTouchBody:
    'Érintsen meg egy látható lapkát, hogy elvegye a betűjét. Érintse meg az elvett betűt, hogy visszaadja. A Kész és a Törlés a tábla alatt van.',

  plurals: {
    words: { one: '{n} szó', other: '{n} szó' },
    rounds: { one: '{n} kör', other: '{n} kör' },
    flips: { one: '{n} lépés', other: '{n} lépés' },
    ticks: { one: '{n} ütem', other: '{n} ütem' },
    points: { one: '{n} pont', other: '{n} pont' },
  },
}
