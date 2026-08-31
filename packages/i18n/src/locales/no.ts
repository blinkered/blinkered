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
  wildCard: 'joker',
  wildKey: 'hvilken som helst bokstav',
  letterReplaced: '{from} ble til {to}',
  letterSwap: 'BOKSTAVBYTTE!',
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
  share: 'Del',
  shareCopied: 'Kopiert.',
  shareSelect: 'Kopier dette:',

  lettersSelect: 'bokstaver velger',
  keysWild: 'tar et kort hvis ingen brikke viser bokstaven, og prøver å bli den',
  clearsEvery: 'fjerner alle valgte {letter}',
  undoLastLetter: 'angrer siste bokstav',
  noWordsYet: 'Ingen ord ennå.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'allerede funnet',
  reasonTooShort: 'for kort',
  reasonNotAWord: 'ikke et ord',
  reasonAllFound: 'du har alle allerede',
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
  wildChance: 'jokersjanse',
  replaceChance: 'sjanse for bokstavbytte',
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
  restartTitle: 'Starte dette spillet på nytt?',
  restartConfirm: 'Start på nytt',
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
  welcomeTitle: 'Velkommen til Blinkered',
  tutorialSkip: 'Hopp over',
  tutorialNext: 'Neste',
  tutorialBack: 'Tilbake',
  tutorialStart: 'Begynn å spille',
  tutorialHideAgain: 'Ikke vis igjen',
  tutorialProgress: '{n} av {total}',
  tutorialSkipTitle: 'Hoppe over introduksjonen?',
  tutPickLetters: 'Trykk på bokstavene du vil ha. De havner i ordet i den rekkefølgen du trykker.',
  tutMoreTurn: 'Brikkene fortsetter å snus mens du tenker, så en bedre bokstav kan være på vei.',
  tutTapBack:
    'Tok du feil? Trykk på den igjen for å levere den tilbake. Hvilken som helst, ikke bare den siste.',
  tutComplete: 'Trykk Ferdig når ordet er klart.',
  tutControlsTitle: 'Knappene',
  tutReset: 'Tøm rydder ordet du holder på med. Brikkene blir liggende.',
  tutPause:
    'Pause stopper klokken og skjuler brettet, slik at en pause ikke kan brukes til å studere det.',
  tutRestart: 'Start på nytt deler ut et nytt brett fra begynnelsen. Den spør først.',
  tutQuit: 'Avslutt avslutter partiet og viser poengsummen din. Den spør først.',
  tutDoneTitle: 'Det er hele spillet',
  tutDoneBody: 'Velg et nivå og spill. Slik spiller du ligger alltid i tittellinjen.',
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
  htWildTitle: 'Jokere',
  htWildBody:
    'Noen brikker snus som en joker i stedet for en bokstav. En joker teller som bokstaven som lager et ord, valgt blant dem som passer, og hvilken det ble ser du når ordet dukker opp i lista di. Et ord du allerede har funnet teller ikke.',
  htSwapTitle: 'Bokstaver som byttes',
  htSwapBody:
    'Av og til bytter en brikke bokstav mellom rundene. Du ser hvilken som går og hvilken som kommer, men ikke hvor den ligger. Bokstavene du husker, er kanskje ikke der lenger.',
  htLevelsTitle: 'Nivåene',
  htLevelEasy:
    'De samme tolv bokstavene hele partiet, så du rekker å lære dem og holde en ordliste i hodet. Brikkene snus sakte, og hele brettet blir stående lenge nok til å planlegge et ord.',
  htLevelMedium:
    'Nå og da byttes en bokstav, og listen du har holdt styr på stemmer ikke lenger. Mindre tid til å se og mindre til å tenke.',
  htLevelHard:
    'Ord på tre bokstaver teller ikke lenger, og en bokstav byttes omtrent annenhver runde. Brettet rekker knapt å vises før det stokkes om.',
  htLevelInsane:
    'Alt på én gang, i full fart. Brettet er borte nesten så snart det er helt, og det er ingen tid til å huske noe som helst.',
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
