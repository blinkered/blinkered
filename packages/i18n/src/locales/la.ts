import type { Messages } from '../messages.js'

/**
 * Latin. `tessera` for a tile, which is the word for exactly this object: the Romans played
 * with them. `versus`, a turning, for a flip.
 *
 * Written without macrons, to match the tiles. Length marks are a teaching aid rather than
 * spelling, no Roman wrote them, and a page that marked them while the board did not would be
 * telling the player that AMĀRE and AMARE are different words. They are not, here or anywhere.
 *
 * `versus`, `ambitus` and `ictus` are fourth declension, so their nominative is the same in
 * both numbers, which is why those plural forms look unchanged.
 */
export const la: Messages = {
  tag: 'la',

  readingDictionary: 'Lexicon legitur…',
  noWordList: 'Nullus index verborum pro "{language}". Fac unum:  pnpm dictionary build',
  emptyWordList: 'Index verborum pro "{language}" vacuus est.',

  flips: 'versus',
  score: 'puncta',
  words: 'verba',
  round: 'ambitus',
  ticksLeftLabel: 'Tempus in hoc ambitu reliquum',
  typeAWord: 'verbum scribe',
  tapPrompt: 'litteras tange ut sumas aut reddas, deinde {action}',

  boardOfTiles: 'Tabula tesserarum {n}',
  faceDown: 'aversa',
  wildCard: 'tessera vaga',
  wildKey: 'quaelibet littera',
  letterReplaced: '{from} facta est {to}',
  letterSwap: 'LITTERA MUTATA!',
  spentTile: 'tessera consumpta',
  hiddenWhilePaused: 'occulta dum intermissum est',
  letterInWord: '{letter}, littera verbi {position}',

  completeWord: 'Verbum perfice',

  completeShort: 'Perfice',
  reset: 'Dele',
  pause: 'Intermitte',
  resume: 'Perge',
  newGame: 'Novus ludus',
  paused: 'Intermissum',
  outOfFlips: 'Versus consumpti',
  finalResult: 'puncta {score} ex {words} per {rounds}',
  playAgain: 'Iterum lude',
  share: 'Communica',
  shareCopied: 'Descriptum.',
  shareSelect: 'Hoc describe:',

  lettersSelect: 'litterae sumunt',
  keysWild: 'sumitur cum litteram scribis quam nulla tessera ostendit',
  clearsEvery: 'omnes litteras {letter} lectas delet',
  undoLastLetter: 'ultimam litteram redde',
  noWordsYet: 'Nondum ulla verba.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'iam inventum',
  reasonTooShort: 'nimis breve',
  reasonNotAWord: 'non verbum',
  reasonAllFound: 'omnia iam habes',
  noSuchLetterUp: 'nulla {letter} aperta',
  nothingUp: 'non aperta',
  shuffled: 'permixtae',
  shuffledAndBilled: 'permixtae, versus {flips} non usi exacti',

  gameLanguage: 'lingua',
  interfaceLanguage: 'interfacies',
  dictionarySize: 'verba usitata {common} ex {full}',

  nerdMode: 'modus subtilis',
  rules: 'Regulae',
  difficulty: 'difficultas',
  difficultyNames: { easy: 'facilis', medium: 'medius', hard: 'difficilis', insane: 'insanus' },
  tiles: 'tesserae (N)',
  secondsPerTick: 'secunda / ictus',
  holdTicks: 'ictus morae',
  minWord: 'verbum brevissimum',
  startingFlips: 'versus initiales',
  wildChance: 'sors tesserae vagae',
  replaceChance: 'sors litterae mutandae',
  wordCompleteMode: 'verbo perfecto',
  wordCompleteNames: { shuffle: 'permisce', spend: 'consume', keep: 'serva' },
  flipEconomy: 'ratio versuum',
  flipEconomyNames: {
    none: 'nulla',
    perLetter: 'per litteram',
    fibonacci: 'fibonacci',
    overMinimum: 'supra minimum',
  },
  repeatedLetterKey: 'clavis litterae repetitae',
  keySchemeNames: { cycle: 'orbis', advance: 'progressus' },
  keySchemeHelp: {
    cycle:
      'A proximam A non usurpatam sumit, et cum omnes in verbo sunt, eas delet. ' +
      'Shift+A quoque eas delet.',
    advance: 'A proximam A non usurpatam sumit. Shift+A omnem A in verbo delet.',
  },

  whatThatMeans: 'Quid hoc significet',
  factRound: 'ambitus',
  factWholeBoardUp: 'tota tabula aperta per',
  factRoundCosts: 'ambitus constat',
  factFlipsBuy: 'versus initiales emunt',
  factThisBoard: 'haec tabula',
  factBoardHadToAdmit: 'tabula admittere debuit',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, longissimum {longest}',
  wordsIncludingOneOf: '{words}, inter quae unum ex {ceiling}',
  scorelessRounds: '{rounds} sine punctis',

  whatAWordPays: 'Quantum verbum reddat',
  columnLetters: 'litterae',
  columnCost: 'pretium',
  columnPoints: 'puncta',
  columnFlips: 'versus',
  columnNet: 'lucrum',

  canonicalRules: 'Regulae solitae difficultatis {difficulty}.',
  customRules: 'Ex forma mutatum. Puncta sub regulis tuis in ordinem non redigentur.',
  applyAndStart: 'Adhibe et novum ludum incipe',
  changesNextGame: 'Mutationes ludo proximo valebunt.',
  presets: 'Formae:',

  start: 'Incipe',
  restart: 'Redintegra',
  quit: 'Desiste',
  quitTitle: 'Ab hoc ludo desistis?',
  restartTitle: 'Hunc ludum redintegras?',
  restartConfirm: 'Redintegra',
  quitConfirm: 'Desiste',
  keepPlaying: 'Perge ludere',
  personalBest: 'Ludi tui optimi',
  thisGame: 'hic ludus',
  newPersonalBest: 'Novum tuum optimum.',
  columnRank: '#',
  notRanked: 'Regulae tuae, itaque hic ludus in ordinem non redigitur.',
  rankOfTotal: '{rank} ex {total}',

  howToPlay: 'Quomodo ludendum sit',

  backToGame: 'Ad ludum redi',
  welcomeTitle: 'Blinkered te salutat',
  tutorialSkip: 'Omitte',
  tutorialNext: 'Porro',
  tutorialBack: 'Retro',
  tutorialStart: 'Incipe ludere',
  tutorialHideAgain: 'Ne iterum monstretur',
  tutorialProgress: '{n} ex {total}',
  tutorialSkipTitle: 'Institutionem omittis?',
  tutPickLetters: 'Litteras quas vis ordine tange, ut verbum facias.',
  tutMoreTurn: 'Tesserae dum cogitas verti pergunt, itaque littera melior adhuc venire potest.',
  tutTapBack:
    'Unam tetigisti quam nolebas? Tange iterum ut reddas. Quamlibet earum, non modo ultimam.',
  tutComplete: 'Preme Perfice cum verbum paratum est.',
  tutControlsTitle: 'Pulsatoria',
  tutReset: 'Dele verbum quod facis tollit. Tesserae ubi sunt manent.',
  tutPause:
    'Intermitte horologium sistit et tabulam occultat, ne quies ad eam ediscendam adhibeatur.',
  tutRestart: 'Redintegra novam tabulam ab initio distribuit. Prius rogat.',
  tutQuit: 'Desiste ludum finit et ostendit quantum tuleris. Prius rogat.',
  tutDoneTitle: 'Hic est totus ludus',
  tutDoneBody: 'Gradum elige et lude. Quomodo ludendum sit semper in titulo est, si iterum vis.',
  htBoardTitle: 'Tabula',
  htBoardBody: 'Tesserae singulae vertuntur, ordine legendi. Ex tesseris apertis verba facis.',
  htWordsTitle: 'Verba',
  htWordsBody: 'Verbum ex tesseris apertis fac litteras ordine scribendo aut pulsando.',
  htFlipsTitle: 'Versus',
  htFlipsBody:
    'Quaeque tessera quae vertitur unum versum constat. Verbum perfectum versus summae tuae reddit, et verba longiora plus reddunt. Versibus consumptis ludus finitur.',
  htRoundTitle: 'Ambitus',
  htRoundBody:
    'Cum ultima tessera ambitus vertitur, tota tabula paulisper aperta manet. Deinde tesserae avertuntur et permiscentur, et novus ambitus incipit.',
  htLanguagesTitle: 'Linguae',
  htLanguagesBody:
    'Linguae {n}. Quaeque tabula verbis solvi potest quibus homines re vera utuntur. Verbum rarum tamen puncta fert, si lexicon id novit.',
  htKeysTitle: 'Claviatura',
  htWildTitle: 'Tesserae vagae',
  htWildBody:
    'Interdum pro littera tessera vaga apparet. Tessera vaga pro qualibet littera valet quae verbum iustum facit. Verbum iam perfectum non valet.',
  htSwapTitle: 'Litterae mutatae',
  htSwapBody:
    'Interdum, inter ambitus, una littera alia substituitur. Videbis quae littera sublata sit et quae addita.',
  htLevelsTitle: 'Gradus',
  htLevelEasy:
    'Eaedem duodecim litterae per totum ludum, ut eas discere et indicem verborum in animo tenere possis. Tesserae tarde vertuntur, et tabula plena satis diu apparet ut litteras tuas otiose eligas.',
  htLevelMedium:
    'Interdum littera mutatur, ita ut difficilius sit verba tenere quae postea ludere volebas. Minus temporis ad spectandum, minus ad cogitandum.',
  htLevelHard:
    'Verba trium litterarum non iam valent, et fere alterno ambitu littera mutatur. Tabula vix aperta est cum iam permiscetur.',
  htLevelInsane:
    'Omnia simul, summa celeritate. Tabula paene statim post ultimum versum permiscetur.',
  htTouchTitle: 'Quadrum tactile',
  htTouchBody:
    'Tange tesseram apertam ut litteram eius sumas. Tange quamlibet litteram quam sumpsisti ut reddas. Perfice et Dele infra tabulam sunt.',

  plurals: {
    words: { one: 'verbum {n}', other: 'verba {n}' },
    rounds: { one: 'ambitus {n}', other: 'ambitus {n}' },
    flips: { one: 'versus {n}', other: 'versus {n}' },
    ticks: { one: 'ictus {n}', other: 'ictus {n}' },
    points: { one: 'punctum {n}', other: 'puncta {n}' },
  },
}
