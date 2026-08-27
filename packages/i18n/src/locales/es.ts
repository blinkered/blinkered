import type { Messages } from '../messages.js'

/** Spanish. `giros` for flips, which is what a tile does and what the meter counts. */
export const es: Messages = {
  tag: 'es',

  readingDictionary: 'Leyendo el diccionario…',
  noWordList: 'No hay lista de palabras para «{language}». Genérala:  pnpm dictionary build',
  emptyWordList: 'La lista de palabras para «{language}» está vacía.',

  flips: 'giros',
  score: 'puntos',
  words: 'palabras',
  round: 'ronda',
  ticksLeftLabel: 'Tiempo restante en la ronda',
  typeAWord: 'escribe una palabra',
  tapPrompt: 'toca para elegir o soltar, luego {action}',

  boardOfTiles: 'Tablero de {n} fichas',
  faceDown: 'boca abajo',
  spentTile: 'ficha gastada',
  hiddenWhilePaused: 'oculta en pausa',
  letterInWord: '{letter}, letra {position} de la palabra',

  completeWord: 'Completar palabra',

  completeShort: 'Completar',
  reset: 'Borrar',
  pause: 'Pausa',
  resume: 'Continuar',
  newGame: 'Nueva partida',
  paused: 'En pausa',
  outOfFlips: 'Sin giros',
  finalResult: '{score} puntos con {words} en {rounds}',
  playAgain: 'Jugar otra vez',

  lettersSelect: 'las letras seleccionan',
  clearsEvery: 'quita todas las {letter} seleccionadas',
  undoLastLetter: 'deshace la última letra',
  noWordsYet: 'Todavía ninguna palabra.',

  wordAccepted: '{word}  +{points} puntos, +{flips} giros',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'ya encontrada',
  reasonTooShort: 'demasiado corta',
  reasonNotAWord: 'no es una palabra',
  noSuchLetterUp: 'ninguna {letter} descubierta',
  nothingUp: 'nada descubierto',
  shuffled: 'mezclado',
  shuffledAndBilled: 'mezclado, {flips} giros sin usar cobrados',

  gameLanguage: 'idioma',
  interfaceLanguage: 'interfaz',
  dictionarySize: '{common} comunes de {full} palabras',

  nerdMode: 'modo detallado',
  rules: 'Reglas',
  difficulty: 'dificultad',
  difficultyNames: { easy: 'fácil', medium: 'medio', hard: 'difícil', insane: 'brutal' },
  tiles: 'fichas (N)',
  secondsPerTick: 'segundos / tiempo',
  holdTicks: 'tiempos de espera',
  minWord: 'palabra mínima',
  startingFlips: 'giros iniciales',
  wordCompleteMode: 'palabra completada',
  wordCompleteNames: { shuffle: 'mezclar', spend: 'gastar', keep: 'conservar' },
  flipEconomy: 'economía de giros',
  flipEconomyNames: {
    none: 'ninguna',
    perLetter: 'por letra',
    fibonacci: 'fibonacci',
    overMinimum: 'sobre el mínimo',
  },
  repeatedLetterKey: 'tecla de letra repetida',
  keySchemeNames: { cycle: 'ciclar', advance: 'avanzar' },
  keySchemeHelp: {
    cycle:
      'A toma la siguiente A libre y, cuando ya están todas en la palabra, las quita. ' +
      'Mayús+A también las quita.',
    advance: 'A toma la siguiente A libre. Mayús+A quita todas las A de la palabra.',
  },

  whatThatMeans: 'Qué significa eso',
  factRound: 'una ronda',
  factWholeBoardUp: 'tablero entero visible',
  factRoundCosts: 'una ronda cuesta',
  factFlipsBuy: 'los giros iniciales dan',
  factThisBoard: 'este tablero',
  factBoardHadToAdmit: 'el tablero debía admitir',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, la más larga {longest}',
  wordsIncludingOneOf: '{words} incluida una de {ceiling}',
  scorelessRounds: '{rounds} sin puntuar',

  whatAWordPays: 'Lo que paga una palabra',
  columnLetters: 'letras',
  columnCost: 'coste',
  columnPoints: 'puntos',
  columnFlips: 'giros',
  columnNet: 'neto',

  canonicalRules: 'Reglas {difficulty} oficiales.',
  customRules: 'Cambiado del preajuste. Las puntuaciones con reglas propias no se clasifican.',
  applyAndStart: 'Aplicar y empezar una partida',
  changesNextGame: 'Los cambios se aplican en la próxima partida.',
  presets: 'Preajustes:',

  start: 'Empezar',
  restart: 'Reiniciar',
  quit: 'Salir',
  quitTitle: '¿Salir de esta partida?',
  quitConfirm: 'Salir',
  keepPlaying: 'Seguir jugando',
  personalBest: 'Tus mejores partidas',
  thisGame: 'esta partida',
  newPersonalBest: 'Nuevo récord personal.',
  columnRank: '#',
  notRanked: 'Reglas propias: esta partida no se clasifica.',
  rankOfTotal: '{rank} de {total}',

  howToPlay: 'Cómo jugar',

  backToGame: 'Volver al juego',
  htBoardTitle: 'El tablero',
  htBoardBody:
    'Las fichas se descubren una a una, en orden de lectura. No se ve una letra hasta que gira su ficha.',
  htWordsTitle: 'Las palabras',
  htWordsBody:
    'Forma una palabra con las fichas descubiertas. Escríbela, o púlsalas. Cada ficha sirve una vez, y solo después de girar.',
  htFlipsTitle: 'Los giros',
  htFlipsBody:
    'Cada ficha que gira cuesta un giro. Una palabra devuelve giros, y las palabras largas devuelven más. Cuando se acaban los giros, la partida termina.',
  htRoundTitle: 'La ronda',
  htRoundBody:
    'Cuando gira la última ficha de una ronda, el tablero está entero a la vista. Se queda así un momento. Después se mezcla y se reparte de nuevo.',
  htLanguagesTitle: 'Los idiomas',
  htLanguagesBody:
    'Dieciséis. Cada tablero se puede resolver con palabras de uso real. Una palabra poco común también puntúa, si el diccionario la conoce.',
  htKeysTitle: 'El teclado',
  htTouchTitle: 'La pantalla táctil',
  htTouchBody:
    'Toca una ficha destapada para tomar su letra. Toca cualquier letra ya tomada para soltarla. Completar y Borrar están debajo del tablero.',

  plurals: {
    words: { one: '{n} palabra', other: '{n} palabras' },
    rounds: { one: '{n} ronda', other: '{n} rondas' },
    flips: { one: '{n} giro', other: '{n} giros' },
    ticks: { one: '{n} tiempo', other: '{n} tiempos' },
    points: { one: '{n} punto', other: '{n} puntos' },
  },
}
