import type { Messages } from '../messages.js'

/**
 * Galician. `xogada` for flips, the word a Galician board game uses for a move.
 *
 * Written in the standard of the Real Academia Galega, which is the spelling the Wikipedia the
 * word list is drawn from uses.
 */
export const gl: Messages = {
  tag: 'gl',

  readingDictionary: 'Lendo o dicionario…',
  noWordList: 'Non hai lista de palabras para «{language}». Cree unha:  pnpm dictionary build',
  emptyWordList: 'A lista de palabras de «{language}» está baleira.',

  flips: 'xogadas',
  score: 'puntuación',
  words: 'palabras',
  round: 'rolda',
  ticksLeftLabel: 'Tempo restante nesta rolda',
  typeAWord: 'escriba unha palabra',
  tapPrompt: 'toque as letras para escollelas ou devolvelas, e logo {action}',

  boardOfTiles: 'Taboleiro de {n} fichas',
  faceDown: 'boca abaixo',
  wildCard: 'comodín',
  wildKey: 'calquera letra',
  letterReplaced: '{from} converteuse en {to}',
  letterSwap: 'CAMBIO DE LETRAS!',
  spentTile: 'ficha usada',
  hiddenWhilePaused: 'agochado mentres está en pausa',
  letterInWord: '{letter}, letra {position} da palabra',

  completeWord: 'Completar palabra',

  completeShort: 'Completar',
  reset: 'Limpar',
  pause: 'Pausa',
  resume: 'Retomar',
  newGame: 'Partida nova',
  paused: 'En pausa',
  outOfFlips: 'Sen xogadas',
  finalResult: '{score} por {words} en {rounds}',
  playAgain: 'Xogar outra vez',
  share: 'Compartir',
  shareCopied: 'Copiado.',
  shareSelect: 'Copie isto:',

  lettersSelect: 'as letras escollen',
  keysWild: 'tómase cando escribe unha letra que ningunha ficha amosa',
  clearsEvery: 'limpa todas as {letter} escollidas',
  undoLastLetter: 'desfacer a última letra',
  noWordsYet: 'Aínda ningunha palabra.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'xa atopada',
  reasonTooShort: 'curta de máis',
  reasonNotAWord: 'non é unha palabra',
  reasonAllFound: 'xa as ten todas',
  noSuchLetterUp: 'ningunha {letter} descuberta',
  nothingUp: 'nada descuberto',
  shuffled: 'barallado',
  shuffledAndBilled: 'barallado, cobráronse {flips} sen usar',

  gameLanguage: 'lingua',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} de uso común de {full} palabras',
  filterLanguages: 'Buscar unha lingua',
  noMatches: 'Sen coincidencias',

  nerdMode: 'modo para entendidos',
  rules: 'Regras',
  difficulty: 'dificultade',
  difficultyNames: { easy: 'fácil', medium: 'media', hard: 'difícil', insane: 'demencial' },
  tiles: 'fichas (N)',
  secondsPerTick: 'segundos / batida',
  holdTicks: 'batidas de espera',
  minWord: 'palabra máis curta',
  startingFlips: 'xogadas iniciais',
  wildChance: 'probabilidade de comodín',
  replaceChance: 'probabilidade de cambio de letra',
  wordCompleteMode: 'ao completar unha palabra',
  wordCompleteNames: { shuffle: 'barallar', spend: 'gastar', keep: 'conservar' },
  flipEconomy: 'retorno de xogadas',
  flipEconomyNames: {
    none: 'ningún',
    perLetter: 'por letra',
    fibonacci: 'fibonacci',
    overMinimum: 'sobre o mínimo',
  },
  repeatedLetterKey: 'tecla de letra repetida',
  keySchemeNames: { cycle: 'ciclo', advance: 'avanzar' },
  keySchemeHelp: {
    cycle:
      'A colle o seguinte A sen usar, e cando xa están todos na palabra, límpaos. ' +
      'Maiús+A tamén os limpa.',
    advance: 'A colle o seguinte A sen usar. Maiús+A limpa todos os A da palabra.',
  },

  whatThatMeans: 'Que quere dicir isto',
  factRound: 'rolda',
  factWholeBoardUp: 'todo o taboleiro descuberto durante',
  factRoundCosts: 'unha rolda custa',
  factFlipsBuy: 'as xogadas iniciais mercan',
  factThisBoard: 'este taboleiro',
  factBoardHadToAdmit: 'o taboleiro tiña que admitir',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, a máis longa {longest}',
  wordsIncludingOneOf: '{words}, unha delas de {ceiling}',
  scorelessRounds: '{rounds} sen puntos',

  whatAWordPays: 'Canto paga unha palabra',
  columnLetters: 'letras',
  columnCost: 'custo',
  columnPoints: 'puntos',
  columnFlips: 'xogadas',
  columnNet: 'neto',

  canonicalRules: 'Regras canónicas de {difficulty}.',
  customRules:
    'Cambiado respecto do predefinido. As puntuacións con regras propias non se clasifican.',
  applyAndStart: 'Aplicar e comezar unha partida nova',
  changesNextGame: 'Os cambios aplícanse na seguinte partida.',
  presets: 'Predefinidos:',

  start: 'Comezar',
  restart: 'Reiniciar',
  quit: 'Deixalo',
  quitTitle: 'Quere deixar esta partida?',
  restartTitle: 'Quere reiniciar esta partida?',
  restartConfirm: 'Reiniciar',
  quitConfirm: 'Deixalo',
  keepPlaying: 'Seguir xogando',
  personalBest: 'As súas mellores partidas',
  thisGame: 'esta partida',
  newPersonalBest: 'Un novo récord persoal.',
  columnRank: '#',
  notRanked: 'Regras propias, así que esta partida non se clasifica.',
  rankOfTotal: '{rank} de {total}',

  howToPlay: 'Como se xoga',

  backToGame: 'Volver á partida',
  welcomeTitle: 'Benvido a Blinkered',
  tutorialSkip: 'Omitir',
  tutorialNext: 'Seguinte',
  tutorialBack: 'Atrás',
  tutorialStart: 'Comezar a xogar',
  tutorialHideAgain: 'Non amosar isto outra vez',
  tutorialProgress: '{n} de {total}',
  tutorialSkipTitle: 'Omitir a presentación?',
  tutPickLetters: 'Toque as letras que queira, en orde, para formar unha palabra.',
  tutMoreTurn: 'As fichas seguen a virar mentres pensa, así que aínda pode vir unha letra mellor.',
  tutTapBack:
    'Colleu unha que non quería? Tóquea outra vez para devolvela. Calquera, non só a última.',
  tutComplete: 'Prema Completar cando a palabra estea lista.',
  tutControlsTitle: 'Os botóns',
  tutReset: 'Limpar borra a palabra que está a formar. As fichas quedan onde están.',
  tutPause:
    'A pausa detén o reloxo e agocha o taboleiro, para que un descanso non sirva para estudalo.',
  tutRestart: 'Reiniciar reparte un taboleiro novo desde o principio. Pregunta antes.',
  tutQuit: 'Deixalo remata a partida e amosa o que puntuou. Pregunta antes.',
  tutDoneTitle: 'Iso é todo o xogo',
  tutDoneBody: 'Escolla un nivel e xogue. Como se xoga está sempre na barra do título.',
  htBoardTitle: 'O taboleiro',
  htBoardBody:
    'As fichas viran unha a unha, en orde de lectura. Coas descubertas fórmanse palabras.',
  htWordsTitle: 'As palabras',
  htWordsBody:
    'Forme unha palabra coas fichas descubertas escribindo ou premendo as letras en orde.',
  htFlipsTitle: 'As xogadas',
  htFlipsBody:
    'Cada ficha que vira custa unha xogada. Unha palabra completada devolve xogadas, e as palabras longas devolven máis. Cando as xogadas se esgotan, a partida remata.',
  htRoundTitle: 'A rolda',
  htRoundBody:
    'Cando vira a última ficha da rolda, todo o taboleiro queda un intre. Despois as fichas vólvense e barállanse, e comeza unha rolda nova.',
  htLanguagesTitle: 'As linguas',
  htLanguagesBody:
    'Hai {n}. Calquera taboleiro pode resolverse con palabras que a xente usa de verdade. Unha palabra pouco común tamén puntúa, se o dicionario a coñece.',
  htKeysTitle: 'O teclado',
  htWildTitle: 'Os comodíns',
  htWildBody:
    'Ás veces aparece un comodín no canto dunha letra. O comodín conta como calquera letra que faga unha palabra válida. Unha palabra xa completada non conta.',
  htSwapTitle: 'Letras que cambian',
  htSwapBody:
    'Ás veces, entre roldas, unha letra é substituída por outra. Verá cal marchou e cal chegou.',
  htLevelsTitle: 'Os niveis',
  htLevelEasy:
    'As mesmas doce letras toda a partida, así que pode aprendelas e levar unha lista de palabras na cabeza. As fichas viran devagar, e o taboleiro enteiro vese abondo tempo para rematar a escolla.',
  htLevelMedium:
    'De cando en vez unha letra cambia, así que custa máis lembrar as palabras gardadas para despois. Menos tempo para mirar e menos para pensar.',
  htLevelHard:
    'As palabras de tres letras deixan de contar, e unha letra cambia case cada dúas roldas. O taboleiro apenas se amosa e xa se baralla.',
  htLevelInsane:
    'Todo á vez, a toda velocidade. O taboleiro baralla case xusto despois da última xogada.',
  htTouchTitle: 'A pantalla táctil',
  htTouchBody:
    'Toque unha ficha descuberta para coller a súa letra. Toque unha letra collida para devolvela. Completar e Limpar están debaixo do taboleiro.',

  plurals: {
    words: { one: '{n} palabra', other: '{n} palabras' },
    rounds: { one: '{n} rolda', other: '{n} roldas' },
    flips: { one: '{n} xogada', other: '{n} xogadas' },
    ticks: { one: '{n} batida', other: '{n} batidas' },
    points: { one: '{n} punto', other: '{n} puntos' },
  },
}
