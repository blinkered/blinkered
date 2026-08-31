import type { Messages } from '../messages.js'

/** Italian. `giri` for flips: what a tile does, and short enough for a meter. */
export const it: Messages = {
  tag: 'it',

  readingDictionary: 'Lettura del dizionario…',
  noWordList: 'Nessun elenco di parole per «{language}». Generalo:  pnpm dictionary build',
  emptyWordList: "L'elenco di parole per «{language}» è vuoto.",

  flips: 'giri',
  score: 'punti',
  words: 'parole',
  round: 'turno',
  ticksLeftLabel: 'Tempo restante nel turno',
  typeAWord: 'scrivi una parola',
  tapPrompt: 'tocca per prendere o restituire, poi {action}',

  boardOfTiles: 'Tabellone di {n} tessere',
  faceDown: 'coperta',
  wildCard: 'jolly',
  wildKey: 'una lettera qualsiasi',
  letterReplaced: '{from} è diventata {to}',
  letterSwap: 'CAMBIO DI LETTERA!',
  spentTile: 'tessera usata',
  hiddenWhilePaused: 'nascosta in pausa',
  letterInWord: '{letter}, lettera {position} della parola',

  completeWord: 'Completa parola',

  completeShort: 'Completa',
  reset: 'Cancella',
  pause: 'Pausa',
  resume: 'Riprendi',
  newGame: 'Nuova partita',
  paused: 'In pausa',
  outOfFlips: 'Giri esauriti',
  finalResult: '{score} punti con {words} in {rounds}',
  playAgain: 'Gioca ancora',
  share: 'Condividi',
  shareCopied: 'Copiato.',
  shareSelect: 'Copia questo:',

  lettersSelect: 'le lettere selezionano',
  clearsEvery: 'togle tutte le {letter} selezionate',
  undoLastLetter: 'annulla ultima lettera',
  noWordsYet: 'Nessuna parola per ora.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'già trovata',
  reasonTooShort: 'troppo corta',
  reasonNotAWord: 'non è una parola',
  reasonAllFound: 'li hai già tutti',
  noSuchLetterUp: 'nessuna {letter} scoperta',
  nothingUp: 'niente scoperto',
  shuffled: 'mescolato',
  shuffledAndBilled: 'mescolato, addebitati {flips} giri non usati',

  gameLanguage: 'lingua',
  interfaceLanguage: 'interfaccia',
  dictionarySize: '{common} comuni su {full} parole',

  nerdMode: 'modo tecnico',
  rules: 'Regole',
  difficulty: 'difficoltà',
  difficultyNames: { easy: 'facile', medium: 'medio', hard: 'difficile', insane: 'infernale' },
  tiles: 'tessere (N)',
  secondsPerTick: 'secondi / tempo',
  holdTicks: 'tempi di attesa',
  minWord: 'parola minima',
  startingFlips: 'giri iniziali',
  wildChance: 'probabilità di jolly',
  replaceChance: 'probabilità di cambio lettera',
  wordCompleteMode: 'parola completata',
  wordCompleteNames: { shuffle: 'mescola', spend: 'consuma', keep: 'mantieni' },
  flipEconomy: 'economia dei giri',
  flipEconomyNames: {
    none: 'nessuna',
    perLetter: 'per lettera',
    fibonacci: 'fibonacci',
    overMinimum: 'oltre il minimo',
  },
  repeatedLetterKey: 'tasto lettera ripetuta',
  keySchemeNames: { cycle: 'ciclo', advance: 'avanza' },
  keySchemeHelp: {
    cycle:
      'A prende la prossima A libera e, quando sono tutte nella parola, le toglie. ' +
      'Maiusc+A le toglie anche.',
    advance: 'A prende la prossima A libera. Maiusc+A toglie tutte le A dalla parola.',
  },

  whatThatMeans: 'Cosa significa',
  factRound: 'un turno',
  factWholeBoardUp: 'tabellone intero visibile',
  factRoundCosts: 'un turno costa',
  factFlipsBuy: 'i giri iniziali valgono',
  factThisBoard: 'questo tabellone',
  factBoardHadToAdmit: 'il tabellone doveva ammettere',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, la più lunga {longest}',
  wordsIncludingOneOf: '{words} inclusa una di {ceiling}',
  scorelessRounds: '{rounds} senza punti',

  whatAWordPays: 'Quanto rende una parola',
  columnLetters: 'lettere',
  columnCost: 'costo',
  columnPoints: 'punti',
  columnFlips: 'giri',
  columnNet: 'netto',

  canonicalRules: 'Regole {difficulty} ufficiali.',
  customRules:
    'Modificato dal preset. I punteggi con regole personalizzate non entrano in classifica.',
  applyAndStart: 'Applica e inizia una partita',
  changesNextGame: 'Le modifiche valgono dalla prossima partita.',
  presets: 'Preset:',

  start: 'Inizia',
  restart: 'Ricomincia',
  quit: 'Esci',
  quitTitle: 'Uscire da questa partita?',
  restartTitle: 'Ricominciare questa partita?',
  restartConfirm: 'Ricomincia',
  quitConfirm: 'Esci',
  keepPlaying: 'Continua',
  personalBest: 'Le tue migliori partite',
  thisGame: 'questa partita',
  newPersonalBest: 'Nuovo record personale.',
  columnRank: '#',
  notRanked: 'Regole personalizzate: questa partita non entra in classifica.',
  rankOfTotal: '{rank} di {total}',

  howToPlay: 'Come si gioca',

  backToGame: 'Torna al gioco',
  welcomeTitle: 'Benvenuto in Blinkered',
  tutorialSkip: 'Salta',
  tutorialNext: 'Avanti',
  tutorialBack: 'Indietro',
  tutorialStart: 'Inizia a giocare',
  tutorialHideAgain: 'Non mostrare più',
  tutorialProgress: '{n} di {total}',
  tutorialSkipTitle: 'Saltare la presentazione?',
  tutPickLetters: "Tocca le lettere che vuoi. Entrano nella parola nell'ordine in cui le tocchi.",
  tutMoreTurn:
    'Le tessere continuano a girarsi mentre pensi, quindi può ancora arrivare una lettera migliore.',
  tutTapBack:
    "Ne hai presa una per sbaglio? Toccala di nuovo per restituirla. Una qualsiasi, non solo l'ultima.",
  tutComplete: 'Premi Completa quando la parola è pronta.',
  tutControlsTitle: 'I pulsanti',
  tutReset: 'Azzera svuota la parola che stai formando. Le tessere restano dove sono.',
  tutPause: 'Pausa ferma il tempo e nasconde il tabellone, così una pausa non serve a studiarlo.',
  tutRestart: "Ricomincia distribuisce un tabellone nuovo dall'inizio. Chiede conferma.",
  tutQuit: 'Esci chiude la partita e mostra il punteggio. Chiede conferma.',
  tutDoneTitle: 'Il gioco è tutto qui',
  tutDoneBody: 'Scegli un livello e gioca. Come si gioca resta sempre nella barra del titolo.',
  htBoardTitle: 'Il tabellone',
  htBoardBody:
    'Le tessere si girano una alla volta, in ordine di lettura. Una lettera non si vede finché la sua tessera non si gira.',
  htWordsTitle: 'Le parole',
  htWordsBody:
    'Componi una parola con le tessere scoperte. Scrivila, oppure cliccale. Ogni tessera si usa una volta sola, e solo dopo essersi girata.',
  htFlipsTitle: 'I giri',
  htFlipsBody:
    'Ogni tessera che si gira costa un giro. Una parola ne restituisce, e le parole lunghe rendono di più. Quando i giri finiscono, la partita è chiusa.',
  htRoundTitle: 'Il turno',
  htRoundBody:
    'Quando si gira l’ultima tessera del turno, il tabellone è tutto scoperto. Resta così per un momento. Poi viene mescolato e distribuito di nuovo.',
  htLanguagesTitle: 'Le lingue',
  htLanguagesBody:
    'Sedici. Ogni tabellone si può risolvere con parole di uso reale. Una parola insolita vale comunque, se il dizionario la conosce.',
  htKeysTitle: 'La tastiera',
  htWildTitle: 'I jolly',
  htWildBody:
    'Alcune tessere si scoprono come jolly invece che come lettera. Un jolly vale la lettera che forma una parola, scelta fra quelle possibili, e scopri quale quando la parola compare nella tua lista. Una parola già trovata non conta.',
  htSwapTitle: 'Le lettere cambiano',
  htSwapBody:
    "A volte, tra un turno e l'altro, una tessera cambia lettera. Vedi quale se ne va e quale arriva, ma non dove si trova. Le lettere che ricordi potrebbero non esserci più.",
  htLevelsTitle: 'I livelli',
  htLevelEasy:
    'Le stesse dodici lettere per tutta la partita: puoi impararle e tenere a mente un elenco di parole. Le tessere si girano piano e il tabellone completo resta in vista abbastanza a lungo per prepararne una.',
  htLevelMedium:
    "Ogni tanto una lettera cambia, e l'elenco che stavi tenendo non è più valido. Meno tempo per guardare e meno per pensare.",
  htLevelHard:
    'Le parole di tre lettere non contano più e una lettera cambia circa un turno sì e uno no. Il tabellone si vede appena prima di rimescolarsi.',
  htLevelInsane:
    "Tutto insieme, alla massima velocità. Il tabellone sparisce quasi appena è completo e non c'è tempo per tenere a mente niente.",
  htTouchTitle: 'Lo schermo a sfioramento',
  htTouchBody:
    'Tocca una tessera scoperta per prendere la sua lettera. Tocca una lettera già presa per restituirla. Completa e Cancella stanno sotto il tavoliere.',

  plurals: {
    words: { one: '{n} parola', other: '{n} parole' },
    rounds: { one: '{n} turno', other: '{n} turni' },
    flips: { one: '{n} giro', other: '{n} giri' },
    ticks: { one: '{n} tempo', other: '{n} tempi' },
    points: { one: '{n} punto', other: '{n} punti' },
  },
}
