import type { Messages } from '../messages.js'

/** Norwegian Bokmål. `trekk` for flips: a move, and the same in both numbers. */
export const no: Messages = {
  tag: 'no',

  readingDictionary: 'Leser ordlisten…',
  noWordList: 'Ingen ordliste for «{language}». Bygg en:  pnpm dictionary build',
  emptyWordList: 'Ordlisten for «{language}» er tom.',

  flips: 'trekk',
  score: 'poeng',
  words: 'ord',
  round: 'runde',
  ticksLeftLabel: 'Gjenstående tid i runden',
  typeAWord: 'skriv et ord',
  tapPrompt: 'trykk for å ta eller gi tilbake, så {action}',

  boardOfTiles: 'Brett med {n} brikker',
  faceDown: 'med baksiden opp',
  spentTile: 'brukt brikke',
  hiddenWhilePaused: 'skjult under pause',
  letterInWord: '{letter}, bokstav {position} i ordet',

  completeWord: 'Lever ordet',
  completeShort: 'Lever',
  reset: 'Tøm',
  pause: 'Pause',
  resume: 'Fortsett',
  newGame: 'Nytt spill',
  paused: 'Satt på pause',
  outOfFlips: 'Tom for trekk',
  finalResult: '{score} poeng på {words} over {rounds}',
  playAgain: 'Spill igjen',

  lettersSelect: 'bokstaver velger',
  clearsEvery: 'fjerner alle valgte {letter}',
  undoLastLetter: 'angrer siste bokstav',
  noWordsYet: 'Ingen ord ennå.',

  wordAccepted: '{word}  +{points} poeng, +{flips} trekk',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'allerede funnet',
  reasonTooShort: 'for kort',
  reasonNotAWord: 'ikke et ord',
  noSuchLetterUp: 'ingen {letter} oppe',
  nothingUp: 'ingenting oppe',
  shuffled: 'stokket',
  shuffledAndBilled: 'stokket, {flips} ubrukte trekk belastet',

  gameLanguage: 'språk',
  interfaceLanguage: 'grensesnitt',
  dictionarySize: '{common} vanlige av {full} ord',

  nerdMode: 'ekspertmodus',
  rules: 'Regler',
  difficulty: 'vanskelighet',
  difficultyNames: { easy: 'lett', medium: 'middels', hard: 'vanskelig', insane: 'brutalt' },
  tiles: 'brikker (N)',
  secondsPerTick: 'sekunder / takt',
  holdTicks: 'holdetakter',
  minWord: 'korteste ord',
  startingFlips: 'trekk ved start',
  wordCompleteMode: 'ordet ferdig',
  wordCompleteNames: { shuffle: 'stokk', spend: 'bruk opp', keep: 'behold' },
  flipEconomy: 'trekkøkonomi',
  flipEconomyNames: {
    none: 'ingen',
    perLetter: 'per bokstav',
    fibonacci: 'fibonacci',
    overMinimum: 'over minimum',
  },
  repeatedLetterKey: 'tast for gjentatt bokstav',
  keySchemeNames: { cycle: 'sykle', advance: 'gå videre' },
  keySchemeHelp: {
    cycle:
      'A tar neste ledige A, og når alle er i ordet, fjerner den dem. ' +
      'Skift+A fjerner dem også.',
    advance: 'A tar neste ledige A. Skift+A fjerner hver A fra ordet.',
  },

  whatThatMeans: 'Hva det betyr',
  factRound: 'en runde',
  factWholeBoardUp: 'hele brettet oppe',
  factRoundCosts: 'en runde koster',
  factFlipsBuy: 'starttrekkene rekker til',
  factThisBoard: 'dette brettet',
  factBoardHadToAdmit: 'brettet måtte tillate',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, lengste {longest}',
  wordsIncludingOneOf: '{words} hvorav ett på {ceiling}',
  scorelessRounds: '{rounds} uten poeng',

  whatAWordPays: 'Hva et ord gir',
  columnLetters: 'bokstaver',
  columnCost: 'kostnad',
  columnPoints: 'poeng',
  columnFlips: 'trekk',
  columnNet: 'netto',

  canonicalRules: 'Offisielle regler for {difficulty}.',
  customRules: 'Endret fra forvalget. Poeng med egne regler blir ikke rangert.',
  applyAndStart: 'Bruk og start nytt spill',
  changesNextGame: 'Endringer gjelder fra neste spill.',
  presets: 'Forvalg:',

  start: 'Start',
  restart: 'Start på nytt',
  quit: 'Avslutt',
  quitTitle: 'Avslutte dette spillet?',
  quitConfirm: 'Avslutt',
  keepPlaying: 'Fortsett å spille',
  personalBest: 'Dine beste spill',
  thisGame: 'dette spillet',
  newPersonalBest: 'Ny personlig rekord.',
  columnRank: '#',
  notRanked: 'Egne regler, så dette spillet rangeres ikke.',
  rankOfTotal: '{rank} av {total}',

  howToPlay: 'Slik spiller du',

  backToGame: 'Tilbake til spillet',
  htBoardTitle: 'Brettet',
  htBoardBody:
    'Brikkene snus opp én om gangen, i leseretningen. En bokstav er ikke synlig før brikken snus.',
  htWordsTitle: 'Ordene',
  htWordsBody:
    'Lag et ord av brikkene som ligger åpne. Skriv det, eller klikk på dem. Hver brikke gjelder én gang, og først etter at den er snudd.',
  htFlipsTitle: 'Trekkene',
  htFlipsBody:
    'Hver brikke som snus koster ett trekk. Et ord gir trekk tilbake, og lange ord gir mer. Når trekkene er brukt opp, er spillet over.',
  htRoundTitle: 'Runden',
  htRoundBody:
    'Når rundens siste brikke snus, ligger hele brettet åpent. Det ligger slik et øyeblikk. Så stokkes det og deles ut på nytt.',
  htLanguagesTitle: 'Språkene',
  htLanguagesBody:
    'Seksten. Hvert brett kan løses med ord folk faktisk bruker. Et uvanlig ord teller likevel, hvis ordlisten kjenner det.',
  htKeysTitle: 'Tastaturet',
  htTouchTitle: 'Berøringsskjermen',
  htTouchBody:
    'Trykk på en brikke som ligger med forsiden opp for å ta bokstaven. Trykk på en bokstav du har tatt for å gi den tilbake. Lever og Tøm ligger under brettet.',

  plurals: {
    words: { one: '{n} ord', other: '{n} ord' },
    rounds: { one: '{n} runde', other: '{n} runder' },
    flips: { one: '{n} trekk', other: '{n} trekk' },
    ticks: { one: '{n} takt', other: '{n} takter' },
    points: { one: '{n} poeng', other: '{n} poeng' },
  },
}
