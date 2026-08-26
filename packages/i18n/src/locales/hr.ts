import type { Messages } from '../messages.js'

/**
 * Croatian. Three plural forms, and `Intl.PluralRules` picks between them: one for 1, 21, 31,
 * few for 2 to 4, other for the rest. Writing that by hand is how it gets written wrong.
 */
export const hr: Messages = {
  tag: 'hr',

  readingDictionary: 'Čitanje rječnika…',
  noWordList: 'Nema popisa riječi za „{language}“. Izgradi ga:  pnpm dictionary build',
  emptyWordList: 'Popis riječi za „{language}“ je prazan.',

  flips: 'okreti',
  score: 'bodovi',
  words: 'riječi',
  round: 'runda',
  ticksLeftLabel: 'Preostalo vrijeme u rundi',
  typeAWord: 'upiši riječ',

  boardOfTiles: 'Ploča od {n} pločica',
  faceDown: 'okrenuta',
  spentTile: 'potrošena pločica',
  hiddenWhilePaused: 'skrivena tijekom pauze',
  letterInWord: '{letter}, {position}. slovo riječi',

  completeWord: 'Potvrdi riječ',
  reset: 'Očisti',
  pause: 'Pauza',
  resume: 'Nastavi',
  newGame: 'Nova igra',
  paused: 'Pauzirano',
  outOfFlips: 'Nema više okreta',
  finalResult: '{score} bodova, {words} u {rounds}',
  playAgain: 'Igraj ponovno',

  lettersSelect: 'slova označavaju',
  clearsEvery: 'briše sva označena {letter}',
  undoLastLetter: 'briše zadnje slovo',
  noWordsYet: 'Još nema riječi.',

  wordAccepted: '{word}  +{points} bodova, +{flips} okreta',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'već nađena',
  reasonTooShort: 'previše kratka',
  reasonNotAWord: 'nije riječ',
  noSuchLetterUp: 'nema otkrivenog {letter}',
  nothingUp: 'ništa otkriveno',
  shuffled: 'promiješano',
  shuffledAndBilled: 'promiješano, naplaćeno {flips} neiskorištenih okreta',

  gameLanguage: 'jezik',
  interfaceLanguage: 'sučelje',
  dictionarySize: '{common} čestih od {full} riječi',

  nerdMode: 'stručni prikaz',
  rules: 'Pravila',
  difficulty: 'težina',
  difficultyNames: { easy: 'lako', medium: 'srednje', hard: 'teško', insane: 'brutalno' },
  tiles: 'pločice (N)',
  secondsPerTick: 'sekundi / takt',
  holdTicks: 'taktovi držanja',
  minWord: 'najkraća riječ',
  startingFlips: 'početni okreti',
  wordCompleteMode: 'riječ dovršena',
  wordCompleteNames: { shuffle: 'promiješaj', spend: 'potroši', keep: 'zadrži' },
  flipEconomy: 'ekonomija okreta',
  flipEconomyNames: {
    none: 'nikakva',
    perLetter: 'po slovu',
    fibonacci: 'fibonacci',
    overMinimum: 'iznad minimuma',
  },
  repeatedLetterKey: 'tipka za ponovljeno slovo',
  keySchemeNames: { cycle: 'kruži', advance: 'napreduj' },
  keySchemeHelp: {
    cycle:
      'A uzima sljedeći slobodni A, a kad su svi u riječi, briše ih. ' +
      'Shift+A ih također briše.',
    advance: 'A uzima sljedeći slobodni A. Shift+A briše svaki A iz riječi.',
  },

  whatThatMeans: 'Što to znači',
  factRound: 'runda',
  factWholeBoardUp: 'cijela ploča otkrivena',
  factRoundCosts: 'runda košta',
  factFlipsBuy: 'početni okreti vrijede',
  factThisBoard: 'ova ploča',
  factBoardHadToAdmit: 'ploča je morala dopustiti',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, najduža {longest}',
  wordsIncludingOneOf: '{words}, uključujući jednu od {ceiling}',
  scorelessRounds: '{rounds} bez bodova',

  whatAWordPays: 'Što riječ donosi',
  columnLetters: 'slova',
  columnCost: 'cijena',
  columnPoints: 'bodovi',
  columnFlips: 'okreti',
  columnNet: 'neto',

  canonicalRules: 'Službena pravila za {difficulty}.',
  customRules: 'Promijenjeno od zadanog. Rezultati s vlastitim pravilima se ne rangiraju.',
  applyAndStart: 'Primijeni i započni novu igru',
  changesNextGame: 'Promjene vrijede od sljedeće igre.',
  presets: 'Postavke:',

  start: 'Počni',
  restart: 'Ponovi',
  quit: 'Izađi',
  quitTitle: 'Izaći iz ove igre?',
  quitConfirm: 'Izađi',
  keepPlaying: 'Nastavi igrati',
  personalBest: 'Tvoje najbolje igre',
  noScoresYet: 'Još nema završenih igara. Ova će biti prva.',
  thisGame: 'ova igra',
  newPersonalBest: 'Novi osobni rekord.',
  columnRank: '#',
  notRanked: 'Vlastita pravila, pa se ova igra ne rangira.',
  rankOfTotal: '{rank} od {total}',

  howToPlay: 'Kako se igra',
  htBoardTitle: 'Ploča',
  htBoardBody:
    'Pločice se otkrivaju jedna po jedna, u smjeru čitanja. Slovo se ne vidi dok se njegova pločica ne okrene.',
  htWordsTitle: 'Riječi',
  htWordsBody:
    'Sastavi riječ od otkrivenih pločica. Upiši je, ili klikni po njima. Svaka pločica vrijedi jednom, i to samo nakon što se okrenula.',
  htFlipsTitle: 'Okreti',
  htFlipsBody:
    'Svaka pločica koja se okrene troši jedan okret. Riječ ih vraća, a duge riječi vraćaju više. Kad okreti nestanu, igra je gotova.',
  htRoundTitle: 'Runda',
  htRoundBody:
    'Kad se okrene zadnja pločica runde, cijela je ploča otkrivena. Tako ostaje na trenutak. Zatim se promiješa i podijeli iznova.',
  htLanguagesTitle: 'Jezici',
  htLanguagesBody:
    'Šesnaest. Svaka se ploča može riješiti riječima koje se stvarno koriste. Neobična riječ ipak vrijedi, ako je rječnik zna.',
  htKeysTitle: 'Tipkovnica',

  plurals: {
    words: { one: '{n} riječ', few: '{n} riječi', other: '{n} riječi' },
    rounds: { one: '{n} runda', few: '{n} runde', other: '{n} rundi' },
    flips: { one: '{n} okret', few: '{n} okreta', other: '{n} okreta' },
    ticks: { one: '{n} takt', few: '{n} takta', other: '{n} taktova' },
    points: { one: '{n} bod', few: '{n} boda', other: '{n} bodova' },
  },
}
