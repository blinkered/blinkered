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

  boardOfTiles: 'Tabellone di {n} tessere',
  faceDown: 'coperta',
  spentTile: 'tessera usata',
  hiddenWhilePaused: 'nascosta in pausa',
  letterInWord: '{letter}, lettera {position} della parola',

  completeWord: 'Completa parola',
  reset: 'Cancella',
  pause: 'Pausa',
  resume: 'Riprendi',
  newGame: 'Nuova partita',
  paused: 'In pausa',
  outOfFlips: 'Giri esauriti',
  finalResult: '{score} punti con {words} in {rounds}',
  playAgain: 'Gioca ancora',

  lettersSelect: 'le lettere selezionano',
  clearsEvery: 'togle tutte le {letter} selezionate',
  undoLastLetter: 'annulla ultima lettera',
  noWordsYet: 'Nessuna parola per ora.',

  wordAccepted: '{word}  +{points} punti, +{flips} giri',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'già trovata',
  reasonTooShort: 'troppo corta',
  reasonNotAWord: 'non è una parola',
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

  plurals: {
    words: { one: '{n} parola', other: '{n} parole' },
    rounds: { one: '{n} turno', other: '{n} turni' },
    flips: { one: '{n} giro', other: '{n} giri' },
    ticks: { one: '{n} tempo', other: '{n} tempi' },
    points: { one: '{n} punto', other: '{n} punti' },
  },
}
