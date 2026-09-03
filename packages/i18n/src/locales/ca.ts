import type { Messages } from '../messages.js'

/**
 * Catalan. `jugada` for flips, the word a Catalan board game uses for a move.
 *
 * Written in the standard of the Institut d'Estudis Catalans. The one place it shows is the
 * ela geminada, which the interface has no occasion to use but the tiles do: COL·LEGI is played
 * as two Ls, since the interpunct is punctuation rather than a letter.
 */
export const ca: Messages = {
  tag: 'ca',

  readingDictionary: 'S’està llegint el diccionari…',
  noWordList: 'No hi ha llista de mots per a «{language}». Creeu-ne una:  pnpm dictionary build',
  emptyWordList: 'La llista de mots per a «{language}» és buida.',

  flips: 'jugades',
  score: 'punts',
  words: 'mots',
  round: 'ronda',
  ticksLeftLabel: 'Temps que queda en aquesta ronda',
  typeAWord: 'escriviu un mot',
  tapPrompt: 'toqueu lletres per triar-les o tornar-les, i després {action}',

  boardOfTiles: 'Tauler de {n} fitxes',
  faceDown: 'de cara avall',
  wildCard: 'escarràs',
  wildKey: 'qualsevol lletra',
  letterReplaced: '{from} ha esdevingut {to}',
  letterSwap: 'CANVI DE LLETRES!',
  spentTile: 'fitxa gastada',
  hiddenWhilePaused: 'amagat mentre està en pausa',
  letterInWord: '{letter}, lletra {position} del mot',

  completeWord: 'Completa el mot',

  completeShort: 'Completa',
  reset: 'Neteja',
  pause: 'Pausa',
  resume: 'Reprèn',
  newGame: 'Partida nova',
  paused: 'En pausa',
  outOfFlips: 'Sense jugades',
  finalResult: '{score} per {words} en {rounds}',
  playAgain: 'Torna-hi',
  share: 'Comparteix',
  shareCopied: 'Copiat.',
  shareSelect: 'Copieu això:',

  lettersSelect: 'les lletres trien',
  keysWild: 'es pren quan escriviu una lletra que cap fitxa no mostra',
  clearsEvery: 'neteja totes les {letter} triades',
  undoLastLetter: 'desfés l’última lletra',
  noWordsYet: 'Encara cap mot.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'ja trobat',
  reasonTooShort: 'massa curt',
  reasonNotAWord: 'no és un mot',
  reasonAllFound: 'ja els teniu tots',
  noSuchLetterUp: 'cap {letter} destapada',
  nothingUp: 'res destapat',
  shuffled: 'barrejat',
  shuffledAndBilled: 'barrejat, s’han cobrat {flips} sense usar',

  gameLanguage: 'llengua',
  interfaceLanguage: 'interfície',
  dictionarySize: '{common} d’ús corrent de {full} mots',
  filterLanguages: 'Cerca una llengua',
  noMatches: 'Cap coincidència',

  nerdMode: 'mode per a entesos',
  rules: 'Regles',
  difficulty: 'dificultat',
  difficultyNames: { easy: 'fàcil', medium: 'mitjana', hard: 'difícil', insane: 'demencial' },
  tiles: 'fitxes (N)',
  secondsPerTick: 'segons / batec',
  holdTicks: 'batecs d’aturada',
  minWord: 'mot més curt',
  startingFlips: 'jugades inicials',
  wildChance: 'probabilitat d’escarràs',
  replaceChance: 'probabilitat de canvi de lletra',
  wordCompleteMode: 'en completar un mot',
  wordCompleteNames: { shuffle: 'barreja', spend: 'gasta', keep: 'conserva' },
  flipEconomy: 'retorn de jugades',
  flipEconomyNames: {
    none: 'cap',
    perLetter: 'per lletra',
    fibonacci: 'fibonacci',
    overMinimum: 'sobre el mínim',
  },
  repeatedLetterKey: 'tecla de lletra repetida',
  keySchemeNames: { cycle: 'cicle', advance: 'avança' },
  keySchemeHelp: {
    cycle:
      'A pren la següent A sense usar, i quan ja hi són totes al mot, les neteja. ' +
      'Maj+A també les neteja.',
    advance: 'A pren la següent A sense usar. Maj+A neteja totes les A del mot.',
  },

  whatThatMeans: 'Què vol dir això',
  factRound: 'ronda',
  factWholeBoardUp: 'tot el tauler destapat durant',
  factRoundCosts: 'una ronda costa',
  factFlipsBuy: 'les jugades inicials compren',
  factThisBoard: 'aquest tauler',
  factBoardHadToAdmit: 'el tauler havia d’admetre',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, el més llarg {longest}',
  wordsIncludingOneOf: '{words}, un dels quals de {ceiling}',
  scorelessRounds: '{rounds} sense punts',

  whatAWordPays: 'Què paga un mot',
  columnLetters: 'lletres',
  columnCost: 'cost',
  columnPoints: 'punts',
  columnFlips: 'jugades',
  columnNet: 'net',

  canonicalRules: 'Regles canòniques de {difficulty}.',
  customRules: 'Canviat respecte del predefinit. Els punts amb regles pròpies no es classifiquen.',
  applyAndStart: 'Aplica i comença una partida nova',
  changesNextGame: 'Els canvis s’apliquen a la partida següent.',
  presets: 'Predefinits:',

  start: 'Comença',
  restart: 'Reinicia',
  quit: 'Deixa-ho',
  quitTitle: 'Voleu deixar aquesta partida?',
  restartTitle: 'Voleu reiniciar aquesta partida?',
  restartConfirm: 'Reinicia',
  quitConfirm: 'Deixa-ho',
  keepPlaying: 'Continua jugant',
  personalBest: 'Les vostres millors partides',
  thisGame: 'aquesta partida',
  newPersonalBest: 'Un rècord personal nou.',
  columnRank: '#',
  notRanked: 'Regles pròpies, així que aquesta partida no es classifica.',
  rankOfTotal: '{rank} de {total}',

  howToPlay: 'Com s’hi juga',

  backToGame: 'Torna a la partida',
  welcomeTitle: 'Us donem la benvinguda a Blinkered',
  tutorialSkip: 'Omet',
  tutorialNext: 'Següent',
  tutorialBack: 'Enrere',
  tutorialStart: 'Comença a jugar',
  tutorialHideAgain: 'No ho tornis a mostrar',
  tutorialProgress: '{n} de {total}',
  tutorialSkipTitle: 'Voleu ometre la presentació?',
  tutPickLetters: 'Toqueu les lletres que voleu, en ordre, per formar un mot.',
  tutMoreTurn: 'Les fitxes continuen girant mentre penseu, i encara pot venir una lletra millor.',
  tutTapBack:
    'N’heu pres una que no volíeu? Torneu-la a tocar per retornar-la. Qualsevol, no només l’última.',
  tutComplete: 'Premeu Completa quan el mot sigui a punt.',
  tutControlsTitle: 'Els botons',
  tutReset: 'Neteja esborra el mot que esteu formant. Les fitxes es queden on són.',
  tutPause:
    'Pausa atura el rellotge i amaga el tauler, perquè un descans no serveixi per estudiar-lo.',
  tutRestart: 'Reinicia reparteix un tauler nou des del principi. Ho pregunta abans.',
  tutQuit: 'Deixa-ho acaba la partida i mostra els punts. Ho pregunta abans.',
  tutDoneTitle: 'Això és tot el joc',
  tutDoneBody: 'Trieu un nivell i jugueu. Com s’hi juga sempre és a la barra del títol.',
  htBoardTitle: 'El tauler',
  htBoardBody:
    'Les fitxes es giren d’una en una, en ordre de lectura. Amb les destapades es formen mots.',
  htWordsTitle: 'Els mots',
  htWordsBody: 'Formeu un mot amb les fitxes destapades escrivint o clicant les lletres en ordre.',
  htFlipsTitle: 'Les jugades',
  htFlipsBody:
    'Cada fitxa que es gira costa una jugada. Un mot completat en retorna, i els mots llargs en retornen més. Quan s’acaben, la partida s’acaba.',
  htRoundTitle: 'La ronda',
  htRoundBody:
    'Quan es gira l’última fitxa de la ronda, tot el tauler s’atura un moment. Després les fitxes es giren i es barregen, i comença una ronda nova.',
  htLanguagesTitle: 'Les llengües',
  htLanguagesBody:
    'N’hi ha {n}. Tot tauler es pot resoldre amb mots que la gent fa servir de debò. Un mot poc corrent també puntua, si el diccionari el coneix.',
  htKeysTitle: 'El teclat',
  htWildTitle: 'Els escarrassos',
  htWildBody:
    'De tant en tant surt un escarràs en lloc d’una lletra. L’escarràs val per qualsevol lletra que faci un mot vàlid. Un mot ja completat no compta.',
  htSwapTitle: 'Lletres que canvien',
  htSwapBody:
    'De tant en tant, entre rondes, una lletra és substituïda per una altra. Veureu quina ha marxat i quina ha arribat.',
  htLevelsTitle: 'Els nivells',
  htLevelEasy:
    'Les mateixes dotze lletres tota la partida, de manera que us les podeu aprendre i portar una llista de mots al cap. Les fitxes es giren a poc a poc, i el tauler sencer es veu prou estona per acabar la tria.',
  htLevelMedium:
    'De tant en tant una lletra canvia, i costa més recordar els mots que guardàveu per a més tard. Menys temps per mirar i menys per pensar.',
  htLevelHard:
    'Els mots de tres lletres deixen de comptar, i una lletra canvia gairebé cada dues rondes. El tauler tot just s’ensenya i ja es barreja.',
  htLevelInsane:
    'Tot alhora i a tota velocitat. El tauler es barreja gairebé just després de l’última jugada.',
  htTouchTitle: 'La pantalla tàctil',
  htTouchBody:
    'Toqueu una fitxa destapada per prendre’n la lletra. Toqueu una lletra presa per retornar-la. Completa i Neteja són sota el tauler.',

  plurals: {
    words: { one: '{n} mot', other: '{n} mots' },
    rounds: { one: '{n} ronda', other: '{n} rondes' },
    flips: { one: '{n} jugada', other: '{n} jugades' },
    ticks: { one: '{n} batec', other: '{n} batecs' },
    points: { one: '{n} punt', other: '{n} punts' },
  },
}
