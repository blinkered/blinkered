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
  wildCard: 'comodín',
  wildKey: 'cualquier letra',
  letterReplaced: '{from} pasó a ser {to}',
  letterSwap: '¡CAMBIO DE LETRA!',
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
  share: 'Compartir',
  shareCopied: 'Copiado.',
  shareSelect: 'Copia esto:',

  lettersSelect: 'las letras seleccionan',
  keysWild: 'se toma al escribir una letra que ninguna ficha muestra',
  clearsEvery: 'quita todas las {letter} seleccionadas',
  undoLastLetter: 'deshace la última letra',
  noWordsYet: 'Todavía ninguna palabra.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'ya encontrada',
  reasonTooShort: 'demasiado corta',
  reasonNotAWord: 'no es una palabra',
  reasonAllFound: 'ya los tienes todos',
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
  wildChance: 'probabilidad de comodín',
  replaceChance: 'probabilidad de cambio de letra',
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
  restartTitle: '¿Reiniciar esta partida?',
  restartConfirm: 'Reiniciar',
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
  welcomeTitle: 'Te damos la bienvenida a Blinkered',
  tutorialSkip: 'Saltar',
  tutorialNext: 'Siguiente',
  tutorialBack: 'Atrás',
  tutorialStart: 'Empezar a jugar',
  tutorialHideAgain: 'No volver a mostrar',
  tutorialProgress: '{n} de {total}',
  tutorialSkipTitle: '¿Saltar la introducción?',
  tutPickLetters: 'Toca las letras que quieras, en orden, para formar una palabra.',
  tutMoreTurn:
    'Las fichas siguen girándose mientras piensas, así que aún puede llegar una letra mejor.',
  tutTapBack:
    '¿Has tocado una que no querías? Tócala otra vez para devolverla. Cualquiera, no solo la última.',
  tutComplete: 'Pulsa Completar cuando la palabra esté lista.',
  tutControlsTitle: 'Los botones',
  tutReset: 'Borrar vacía la palabra que estás formando. Las fichas se quedan donde están.',
  tutPause:
    'Pausa detiene el reloj y oculta el tablero, para que un descanso no sirva para estudiarlo.',
  tutRestart: 'Reiniciar reparte un tablero nuevo desde el principio. Pide confirmación.',
  tutQuit: 'Salir termina la partida y muestra tu puntuación. Pide confirmación.',
  tutDoneTitle: 'Eso es todo el juego',
  tutDoneBody: 'Elige un nivel y juega. Cómo jugar está siempre en la barra de título.',
  htBoardTitle: 'El tablero',
  htBoardBody:
    'Las fichas se descubren una a una, en orden de lectura. Las fichas descubiertas sirven para formar palabras.',
  htWordsTitle: 'Las palabras',
  htWordsBody:
    'Forma una palabra con las fichas descubiertas, escribiendo o pulsando las letras en orden.',
  htFlipsTitle: 'Los giros',
  htFlipsBody:
    'Cada ficha que gira cuesta un giro. Una palabra completada suma giros a tu total, y las palabras largas dan más. Cuando se acaban los giros, la partida termina.',
  htRoundTitle: 'La ronda',
  htRoundBody:
    'Cuando gira la última ficha de una ronda, el tablero entero se queda a la vista un momento. Después las fichas se giran boca abajo y se mezclan, y empieza una ronda nueva.',
  htLanguagesTitle: 'Los idiomas',
  htLanguagesBody:
    '{n}. Cada tablero se puede resolver con palabras de uso real. Una palabra poco común también puntúa, si el diccionario la conoce.',
  htKeysTitle: 'El teclado',
  htWildTitle: 'Los comodines',
  htWildBody:
    'A veces aparece un comodín en lugar de una letra. Un comodín vale cualquier letra que forme una palabra válida. Una palabra ya completada no cuenta.',
  htSwapTitle: 'Las letras cambian',
  htSwapBody:
    'A veces, entre rondas, una letra se sustituye por otra. Verás qué letra se ha quitado y cuál se ha añadido.',
  htLevelsTitle: 'Los niveles',
  htLevelEasy:
    'Las mismas doce letras durante toda la partida: puedes aprendértelas y llevar una lista de palabras en la cabeza. Las fichas se giran despacio y el tablero completo se queda a la vista el tiempo suficiente para terminar de elegir tus letras.',
  htLevelMedium:
    'Una letra cambia de vez en cuando, así que cuesta más recordar las palabras que querías jugar más adelante. Menos tiempo para mirar y menos para pensar.',
  htLevelHard:
    'Las palabras de tres letras dejan de contar y una letra cambia más o menos cada dos rondas. El tablero apenas se ve antes de barajarse.',
  htLevelInsane:
    'Todo a la vez y a toda velocidad. El tablero se mezcla casi justo después del último giro.',
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
