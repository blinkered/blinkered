import type { Messages } from '../messages.js'

/**
 * Estonian. `käik` for flips, the word an Estonian board game uses for a move.
 *
 * Estonian has two plural forms and they are not singular and plural: a number takes the
 * partitive, so it is 1 käik but 2 käiku and 20 käiku. For `sõna` the two happen to coincide,
 * which is why that pair looks like a mistake and is not.
 */
export const et: Messages = {
  tag: 'et',

  readingDictionary: 'Loen sõnaraamatut…',
  noWordList: '„{language}“ jaoks pole sõnaloendit. Koostage see:  pnpm dictionary build',
  emptyWordList: '„{language}“ sõnaloend on tühi.',

  flips: 'käigud',
  score: 'punktid',
  words: 'sõnad',
  round: 'voor',
  ticksLeftLabel: 'Selles voorus jäänud aeg',
  typeAWord: 'kirjutage sõna',
  tapPrompt: 'puudutage tähti valimiseks või tagasivõtmiseks, siis {action}',

  boardOfTiles: '{n} nupuga laud',
  faceDown: 'kummuli',
  wildCard: 'joker',
  wildKey: 'ükskõik milline täht',
  letterReplaced: '{from} sai {to}-ks',
  letterSwap: 'TÄHEVAHETUS!',
  spentTile: 'kasutatud nupp',
  hiddenWhilePaused: 'pausi ajal peidetud',
  letterInWord: '{letter}, sõna {position}. täht',

  completeWord: 'Lõpeta sõna',

  completeShort: 'Valmis',
  reset: 'Tühjenda',
  pause: 'Paus',
  resume: 'Jätka',
  newGame: 'Uus mäng',
  paused: 'Peatatud',
  outOfFlips: 'Käigud otsas',
  finalResult: '{score} {words} eest {rounds} jooksul',
  playAgain: 'Mängi uuesti',
  share: 'Jaga',
  shareCopied: 'Kopeeritud.',
  shareSelect: 'Kopeerige see:',

  lettersSelect: 'tähed valivad',
  keysWild: 'võetakse, kui kirjutate tähe, mida ükski nupp ei näita',
  clearsEvery: 'tühjendab kõik valitud {letter}',
  undoLastLetter: 'võta viimane täht tagasi',
  noWordsYet: 'Veel ühtegi sõna.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'juba leitud',
  reasonTooShort: 'liiga lühike',
  reasonNotAWord: 'see pole sõna',
  reasonAllFound: 'need on teil juba kõik',
  noSuchLetterUp: 'ühtegi {letter} pole lahti',
  nothingUp: 'midagi pole lahti',
  shuffled: 'segatud',
  shuffledAndBilled: 'segatud, arvestati {flips} kasutamata',

  gameLanguage: 'keel',
  interfaceLanguage: 'liides',
  dictionarySize: '{common} tavalist {full} sõnast',
  filterLanguages: 'Otsi keelt',
  noMatches: 'Vasteid pole',

  nerdMode: 'nohikurežiim',
  rules: 'Reeglid',
  difficulty: 'raskusaste',
  difficultyNames: { easy: 'lihtne', medium: 'keskmine', hard: 'raske', insane: 'hullumeelne' },
  tiles: 'nupud (N)',
  secondsPerTick: 'sekundid / takt',
  holdTicks: 'hoiutaktid',
  minWord: 'lühim sõna',
  startingFlips: 'algkäigud',
  wildChance: 'jokeri tõenäosus',
  replaceChance: 'tähevahetuse tõenäosus',
  wordCompleteMode: 'kui sõna on valmis',
  wordCompleteNames: { shuffle: 'sega', spend: 'kuluta', keep: 'jäta alles' },
  flipEconomy: 'käikude tagastus',
  flipEconomyNames: {
    none: 'puudub',
    perLetter: 'tähe kohta',
    fibonacci: 'fibonacci',
    overMinimum: 'üle miinimumi',
  },
  repeatedLetterKey: 'korduva tähe klahv',
  keySchemeNames: { cycle: 'ring', advance: 'edasi' },
  keySchemeHelp: {
    cycle:
      'A võtab järgmise kasutamata A, ja kui need kõik on sõnas, tühjendab need. ' +
      'Shift+A tühjendab need samuti.',
    advance: 'A võtab järgmise kasutamata A. Shift+A tühjendab sõnast kõik A-d.',
  },

  whatThatMeans: 'Mida see tähendab',
  factRound: 'voor',
  factWholeBoardUp: 'kogu laud lahti',
  factRoundCosts: 'voor maksab',
  factFlipsBuy: 'algkäigud ostavad',
  factThisBoard: 'see laud',
  factBoardHadToAdmit: 'laud pidi lubama',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, pikim {longest}',
  wordsIncludingOneOf: '{words}, neist üks {ceiling}',
  scorelessRounds: '{rounds} punktideta',

  whatAWordPays: 'Mida sõna toob',
  columnLetters: 'tähed',
  columnCost: 'hind',
  columnPoints: 'punktid',
  columnFlips: 'käigud',
  columnNet: 'vahe',

  canonicalRules: '{difficulty} tavareeglid.',
  customRules: 'Muudetud eelseadest. Omareeglitega tulemused edetabelisse ei lähe.',
  applyAndStart: 'Rakenda ja alusta uut mängu',
  changesNextGame: 'Muudatused jõustuvad järgmises mängus.',
  presets: 'Eelseaded:',

  start: 'Alusta',
  restart: 'Uuesti',
  quit: 'Lõpeta',
  quitTitle: 'Kas lõpetada see mäng?',
  restartTitle: 'Kas alustada see mäng uuesti?',
  restartConfirm: 'Uuesti',
  quitConfirm: 'Lõpeta',
  keepPlaying: 'Mängi edasi',
  personalBest: 'Teie parimad mängud',
  thisGame: 'see mäng',
  newPersonalBest: 'Uus isiklik rekord.',
  columnRank: '#',
  notRanked: 'Omareeglid, seega see mäng edetabelisse ei lähe.',
  rankOfTotal: '{rank} / {total}',

  howToPlay: 'Kuidas mängida',

  backToGame: 'Tagasi mängu',
  welcomeTitle: 'Tere tulemast Blinkeredisse',
  tutorialSkip: 'Jäta vahele',
  tutorialNext: 'Edasi',
  tutorialBack: 'Tagasi',
  tutorialStart: 'Hakka mängima',
  tutorialHideAgain: 'Ära seda enam näita',
  tutorialProgress: '{n} / {total}',
  tutorialSkipTitle: 'Kas jätta tutvustus vahele?',
  tutPickLetters: 'Puudutage soovitud tähti järjekorras, et moodustada sõna.',
  tutMoreTurn: 'Nupud pöörduvad ka mõtlemise ajal, nii et parem täht võib alles tulla.',
  tutTapBack:
    'Võtsite tähe, mida ei tahtnud? Puudutage seda uuesti ja see läheb tagasi. Ükskõik millise, mitte ainult viimase.',
  tutComplete: 'Kui sõna on valmis, vajutage Valmis.',
  tutControlsTitle: 'Nupud',
  tutReset: 'Tühjenda kustutab sõna, mida koostate. Nupud jäävad oma kohale.',
  tutPause: 'Paus peatab kella ja peidab laua, et vaheaega ei saaks selle õppimiseks kasutada.',
  tutRestart: 'Uuesti jagab uue laua algusest peale. Küsib enne.',
  tutQuit: 'Lõpeta lõpetab mängu ja näitab tulemust. Küsib enne.',
  tutDoneTitle: 'See ongi kogu mäng',
  tutDoneBody: 'Valige raskusaste ja mängige. Kuidas mängida on alati pealkirja juures.',
  htBoardTitle: 'Laud',
  htBoardBody:
    'Nupud pöörduvad ükshaaval, lugemise järjekorras. Lahtistest nuppudest moodustatakse sõnu.',
  htWordsTitle: 'Sõnad',
  htWordsBody: 'Moodustage lahtistest nuppudest sõna, kirjutades või klõpsates tähti järjekorras.',
  htFlipsTitle: 'Käigud',
  htFlipsBody:
    'Iga pöörduv nupp maksab käigu. Valmis sõna toob käike tagasi, ja pikemad sõnad toovad rohkem. Kui käigud otsa saavad, on mäng läbi.',
  htRoundTitle: 'Voor',
  htRoundBody:
    'Kui vooru viimane nupp pöördub, seisab kogu laud hetke paigal. Siis pööratakse nupud kummuli ja segatakse, ja algab uus voor.',
  htLanguagesTitle: 'Keeled',
  htLanguagesBody:
    'Neid on {n}. Iga laua saab lahendada sõnadega, mida inimesed tõesti kasutavad. Haruldane sõna annab samuti punkte, kui sõnaraamat seda teab.',
  htKeysTitle: 'Klaviatuur',
  htWildTitle: 'Jokerid',
  htWildBody:
    'Vahel ilmub tähe asemel joker. Joker läheb arvesse iga tähena, mis moodustab kehtiva sõna. Juba leitud sõna ei lähe arvesse.',
  htSwapTitle: 'Muutuvad tähed',
  htSwapBody:
    'Vahel vahetatakse voorude vahel üks täht teise vastu. Näete, milline kadus ja milline lisandus.',
  htLevelsTitle: 'Raskusastmed',
  htLevelEasy:
    'Samad kaksteist tähte terve mängu, nii et need saab selgeks õppida ja sõnade nimekirja peas kanda. Nupud pöörduvad aeglaselt ja kogu laud jääb piisavalt kauaks nähtavale, et valik lõpetada.',
  htLevelMedium:
    'Aeg-ajalt üks täht muutub, nii et hiljemaks hoitud sõnu on raskem meeles pidada. Vähem aega vaadata ja vähem mõelda.',
  htLevelHard:
    'Kolmetähelised sõnad ei loe enam, ja täht muutub umbes üle vooru. Laud jõuab vaevu näida, kui juba segatakse.',
  htLevelInsane: 'Kõik korraga, täiskiirusel. Laud segatakse peaaegu kohe pärast viimast käiku.',
  htTouchTitle: 'Puuteekraan',
  htTouchBody:
    'Puudutage lahtist nuppu, et selle täht võtta. Puudutage võetud tähte, et see tagasi anda. Valmis ja Tühjenda on laua all.',

  plurals: {
    words: { one: '{n} sõna', other: '{n} sõna' },
    rounds: { one: '{n} voor', other: '{n} vooru' },
    flips: { one: '{n} käik', other: '{n} käiku' },
    ticks: { one: '{n} takt', other: '{n} takti' },
    points: { one: '{n} punkt', other: '{n} punkti' },
  },
}
