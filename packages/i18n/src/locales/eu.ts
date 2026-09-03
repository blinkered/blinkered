import type { Messages } from '../messages.js'

/**
 * Basque. `jokaldi` for flips, the word a Basque board game uses for a move.
 *
 * Basque is not related to anything else in this file, and it shows in the word order: the verb
 * comes last, so several of these read back to front against their neighbours here. `Hitz bat
 * osatzeko` is `to make up a word`, in that order.
 */
export const eu: Messages = {
  tag: 'eu',

  readingDictionary: 'Hiztegia irakurtzen…',
  noWordList: '"{language}" hizkuntzarako hitz-zerrendarik ez. Sortu bat:  pnpm dictionary build',
  emptyWordList: '"{language}" hizkuntzaren hitz-zerrenda hutsik dago.',

  flips: 'jokaldiak',
  score: 'puntuak',
  words: 'hitzak',
  round: 'txanda',
  ticksLeftLabel: 'Txanda honetan geratzen den denbora',
  typeAWord: 'idatzi hitz bat',
  tapPrompt: 'ukitu letrak hautatzeko edo itzultzeko, gero {action}',

  boardOfTiles: '{n} fitxako taula',
  faceDown: 'ahoz behera',
  wildCard: 'komodina',
  wildKey: 'edozein letra',
  letterReplaced: '{from} {to} bihurtu da',
  letterSwap: 'LETRA-ALDAKETA!',
  spentTile: 'erabilitako fitxa',
  hiddenWhilePaused: 'etenaldian ezkutatuta',
  letterInWord: '{letter}, hitzaren {position}. letra',

  completeWord: 'Osatu hitza',

  completeShort: 'Osatu',
  reset: 'Garbitu',
  pause: 'Eten',
  resume: 'Jarraitu',
  newGame: 'Partida berria',
  paused: 'Etenda',
  outOfFlips: 'Jokaldirik gabe',
  finalResult: '{score} {words} egiteagatik, {rounds} bitartean',
  playAgain: 'Jokatu berriro',
  share: 'Partekatu',
  shareCopied: 'Kopiatuta.',
  shareSelect: 'Kopiatu hau:',

  lettersSelect: 'letrek hautatzen dute',
  keysWild: 'hartzen da fitxa batek erakusten ez duen letra bat idazten duzunean',
  clearsEvery: 'hautatutako {letter} guztiak garbitzen ditu',
  undoLastLetter: 'desegin azken letra',
  noWordsYet: 'Oraindik hitzik ez.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'jada aurkituta',
  reasonTooShort: 'laburregia',
  reasonNotAWord: 'ez da hitza',
  reasonAllFound: 'guztiak dituzu jada',
  noSuchLetterUp: 'ez dago {letter} agerian',
  nothingUp: 'ez dago ezer agerian',
  shuffled: 'nahastuta',
  shuffledAndBilled: 'nahastuta, {flips} erabili gabe kobratuta',

  gameLanguage: 'hizkuntza',
  interfaceLanguage: 'interfazea',
  dictionarySize: '{full} hitzetatik {common} eguneroko',
  filterLanguages: 'Bilatu hizkuntza',
  noMatches: 'Bat ere ez',

  nerdMode: 'zaleen modua',
  rules: 'Arauak',
  difficulty: 'zailtasuna',
  difficultyNames: { easy: 'erraza', medium: 'ertaina', hard: 'zaila', insane: 'eroa' },
  tiles: 'fitxak (N)',
  secondsPerTick: 'segundo / taupada',
  holdTicks: 'eusteko taupadak',
  minWord: 'hitzik laburrena',
  startingFlips: 'hasierako jokaldiak',
  wildChance: 'komodinaren aukera',
  replaceChance: 'letra-aldaketaren aukera',
  wordCompleteMode: 'hitza osatzean',
  wordCompleteNames: { shuffle: 'nahastu', spend: 'gastatu', keep: 'gorde' },
  flipEconomy: 'jokaldien itzulera',
  flipEconomyNames: {
    none: 'bat ere ez',
    perLetter: 'letra bakoitzeko',
    fibonacci: 'fibonacci',
    overMinimum: 'gutxienekotik gora',
  },
  repeatedLetterKey: 'errepikatutako letraren tekla',
  keySchemeNames: { cycle: 'zikloa', advance: 'aurrera' },
  keySchemeHelp: {
    cycle:
      'A-k erabili gabeko hurrengo A hartzen du, eta denak hitzean daudenean, garbitu egiten ditu. ' +
      'Shift+A-k ere garbitzen ditu.',
    advance:
      'A-k erabili gabeko hurrengo A hartzen du. Shift+A-k hitzeko A guztiak garbitzen ditu.',
  },

  whatThatMeans: 'Zer esan nahi duen',
  factRound: 'txanda',
  factWholeBoardUp: 'taula osoa agerian',
  factRoundCosts: 'txanda batek balio du',
  factFlipsBuy: 'hasierako jokaldiek erosten dute',
  factThisBoard: 'taula hau',
  factBoardHadToAdmit: 'taulak onartu behar zuen',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, luzeena {longest}',
  wordsIncludingOneOf: '{words}, horietako bat {ceiling}',
  scorelessRounds: '{rounds} punturik gabe',

  whatAWordPays: 'Zenbat balio duen hitz batek',
  columnLetters: 'letrak',
  columnCost: 'kostua',
  columnPoints: 'puntuak',
  columnFlips: 'jokaldiak',
  columnNet: 'garbia',

  canonicalRules: '{difficulty} mailako arau arruntak.',
  customRules: 'Aurrezarpenetik aldatuta. Arau propioekin lortutako puntuak ez dira sailkatzen.',
  applyAndStart: 'Aplikatu eta hasi partida berria',
  changesNextGame: 'Aldaketak hurrengo partidan sartuko dira indarrean.',
  presets: 'Aurrezarpenak:',

  start: 'Hasi',
  restart: 'Berrabiarazi',
  quit: 'Utzi',
  quitTitle: 'Partida hau utzi nahi duzu?',
  restartTitle: 'Partida hau berrabiarazi nahi duzu?',
  restartConfirm: 'Berrabiarazi',
  quitConfirm: 'Utzi',
  keepPlaying: 'Jarraitu jokatzen',
  personalBest: 'Zure partidarik onenak',
  thisGame: 'partida hau',
  newPersonalBest: 'Marka pertsonal berria.',
  columnRank: '#',
  notRanked: 'Arau propioak, beraz partida hau ez da sailkatzen.',
  rankOfTotal: '{total}(e)tik {rank}.',

  howToPlay: 'Nola jokatu',

  backToGame: 'Itzuli partidara',
  welcomeTitle: 'Ongi etorri Blinkered-era',
  tutorialSkip: 'Saltatu',
  tutorialNext: 'Hurrengoa',
  tutorialBack: 'Atzera',
  tutorialStart: 'Hasi jokatzen',
  tutorialHideAgain: 'Ez erakutsi hau berriro',
  tutorialProgress: '{total}(e)tik {n}.',
  tutorialSkipTitle: 'Aurkezpena saltatu?',
  tutPickLetters: 'Ukitu nahi dituzun letrak, ordenan, hitz bat osatzeko.',
  tutMoreTurn:
    'Fitxak biratzen jarraitzen dute pentsatzen ari zaren bitartean, beraz letra hobea etor daiteke oraindik.',
  tutTapBack:
    'Nahi ez zenuen bat hartu duzu? Ukitu berriro itzultzeko. Edozein, ez azkena bakarrik.',
  tutComplete: 'Sakatu Osatu hitza prest dagoenean.',
  tutControlsTitle: 'Botoiak',
  tutReset:
    'Garbitu botoiak osatzen ari zaren hitza ezabatzen du. Fitxak dauden tokian geratzen dira.',
  tutPause:
    'Etenak erlojua gelditzen du eta taula ezkutatzen, atsedena hura ikasteko erabil ez dadin.',
  tutRestart: 'Berrabiarazi taula berri bat banatzen du hasieratik. Lehenik galdetzen du.',
  tutQuit: 'Utzi partida amaitzen du eta puntuak erakusten. Lehenik galdetzen du.',
  tutDoneTitle: 'Hori da jokoa osorik',
  tutDoneBody: 'Aukeratu maila bat eta jokatu. Nola jokatu beti dago izenburuaren ondoan.',
  htBoardTitle: 'Taula',
  htBoardBody:
    'Fitxak banaka biratzen dira, irakurtzeko ordenan. Agerian daudenekin hitzak osatzen dira.',
  htWordsTitle: 'Hitzak',
  htWordsBody: 'Osatu hitz bat agerian dauden fitxekin, letrak ordenan idatziz edo sakatuz.',
  htFlipsTitle: 'Jokaldiak',
  htFlipsBody:
    'Biratzen den fitxa bakoitzak jokaldi bat balio du. Osatutako hitz batek jokaldiak itzultzen ditu, eta hitz luzeagoek gehiago. Jokaldiak amaitzean, partida amaitu da.',
  htRoundTitle: 'Txanda',
  htRoundBody:
    'Txandako azken fitxa biratzean, taula osoa une batez geratzen da. Gero fitxak itzuli eta nahasten dira, eta txanda berri bat hasten da.',
  htLanguagesTitle: 'Hizkuntzak',
  htLanguagesBody:
    '{n} dira. Taula oro ebatz daiteke jendeak benetan erabiltzen dituen hitzekin. Hitz arraro batek ere puntuak ematen ditu, hiztegiak ezagutzen badu.',
  htKeysTitle: 'Teklatua',
  htWildTitle: 'Komodinak',
  htWildBody:
    'Batzuetan komodin bat agertzen da letra baten ordez. Komodinak hitz zuzena osatzen duen edozein letra balio du. Jada osatutako hitz batek ez du balio.',
  htSwapTitle: 'Aldatzen diren letrak',
  htSwapBody:
    'Batzuetan, txanden artean, letra bat beste batekin ordezkatzen da. Zein joan den eta zein etorri den ikusiko duzu.',
  htLevelsTitle: 'Mailak',
  htLevelEasy:
    'Hamabi letra berberak partida osoan, beraz ikas ditzakezu eta hitz-zerrenda bat buruan eraman. Fitxak astiro biratzen dira, eta taula osoa nahikoa denboran ikusgai geratzen da aukeraketa bukatzeko.',
  htLevelMedium:
    'Noizean behin letra bat aldatzen da, beraz zailagoa da geroko gordetako hitzak gogoratzea. Denbora gutxiago begiratzeko eta gutxiago pentsatzeko.',
  htLevelHard:
    'Hiru letrako hitzek ez dute gehiago balio, eta letra bat txandaz txanda aldatzen da gutxi gorabehera. Taula erakutsi orduko nahasten da.',
  htLevelInsane:
    'Dena batera, abiadura betean. Taula azken jokaldiaren ondoren berehala nahasten da.',
  htTouchTitle: 'Ukipen-pantaila',
  htTouchBody:
    'Ukitu agerian dagoen fitxa bat bere letra hartzeko. Ukitu hartutako letra bat itzultzeko. Osatu eta Garbitu taularen azpian daude.',

  plurals: {
    words: { one: 'hitz {n}', other: '{n} hitz' },
    rounds: { one: 'txanda {n}', other: '{n} txanda' },
    flips: { one: 'jokaldi {n}', other: '{n} jokaldi' },
    ticks: { one: 'taupada {n}', other: '{n} taupada' },
    points: { one: 'puntu {n}', other: '{n} puntu' },
  },
}
