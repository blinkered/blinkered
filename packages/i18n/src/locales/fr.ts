import type { Messages } from '../messages.js'

/**
 * French. `coups` for flips: the literal `retournements` is accurate and four times too long
 * for a meter, and a currency of actions is a `coup` in every French game there is.
 */
export const fr: Messages = {
  tag: 'fr',

  readingDictionary: 'Lecture du dictionnaire…',
  noWordList: 'Aucune liste de mots pour « {language} ». Générez-la :  pnpm dictionary build',
  emptyWordList: 'La liste de mots pour « {language} » est vide.',

  flips: 'coups',
  score: 'points',
  words: 'mots',
  round: 'manche',
  ticksLeftLabel: 'Temps restant dans la manche',
  typeAWord: 'tapez un mot',
  tapPrompt: 'touchez pour prendre ou rendre, puis {action}',

  boardOfTiles: 'Plateau de {n} tuiles',
  faceDown: 'face cachée',
  wildCard: 'joker',
  wildKey: 'une lettre au choix',
  letterReplaced: '{from} est devenu {to}',
  letterSwap: 'CHANGEMENT DE LETTRE !',
  spentTile: 'tuile utilisée',
  hiddenWhilePaused: 'masquée pendant la pause',
  letterInWord: '{letter}, lettre {position} du mot',

  completeWord: 'Valider le mot',

  completeShort: 'Valider',
  reset: 'Effacer',
  pause: 'Pause',
  resume: 'Reprendre',
  newGame: 'Nouvelle partie',
  paused: 'En pause',
  outOfFlips: 'Plus de coups',
  finalResult: '{score} points, {words} en {rounds}',
  playAgain: 'Rejouer',
  share: 'Partager',
  shareCopied: 'Copié.',
  shareSelect: 'Copiez ceci :',

  lettersSelect: 'les lettres sélectionnent',
  keysWild: 'prise quand vous tapez une lettre qu’aucune tuile ne montre',
  clearsEvery: 'retire tous les {letter} sélectionnés',
  undoLastLetter: 'annule la dernière lettre',
  noWordsYet: 'Aucun mot pour le moment.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'déjà trouvé',
  reasonTooShort: 'trop court',
  reasonNotAWord: "n'est pas un mot",
  reasonAllFound: 'vous les avez déjà tous',
  noSuchLetterUp: 'aucun {letter} retourné',
  nothingUp: 'rien de retourné',
  shuffled: 'mélangé',
  shuffledAndBilled: 'mélangé, {flips} coups inutilisés facturés',

  gameLanguage: 'langue',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} courants sur {full} mots',
  filterLanguages: 'Rechercher une langue',
  noMatches: 'Aucun résultat',

  nerdMode: 'mode expert',
  rules: 'Règles',
  difficulty: 'difficulté',
  difficultyNames: { easy: 'facile', medium: 'moyen', hard: 'difficile', insane: 'infernal' },
  tiles: 'tuiles (N)',
  secondsPerTick: 'secondes / temps',
  holdTicks: 'temps de maintien',
  minWord: 'mot minimum',
  startingFlips: 'coups au départ',
  wildChance: 'probabilité de joker',
  replaceChance: 'chance de changement de lettre',
  wordCompleteMode: 'mot validé',
  wordCompleteNames: { shuffle: 'mélanger', spend: 'consommer', keep: 'conserver' },
  flipEconomy: 'économie des coups',
  flipEconomyNames: {
    none: 'aucune',
    perLetter: 'par lettre',
    fibonacci: 'fibonacci',
    overMinimum: 'au-delà du minimum',
  },
  repeatedLetterKey: 'touche lettre répétée',
  keySchemeNames: { cycle: 'cycler', advance: 'avancer' },
  keySchemeHelp: {
    cycle:
      'A prend le prochain A libre, et une fois tous dans le mot, les retire. ' +
      'Maj+A les retire aussi.',
    advance: 'A prend le prochain A libre. Maj+A retire tous les A du mot.',
  },

  whatThatMeans: 'Ce que cela donne',
  factRound: 'une manche',
  factWholeBoardUp: 'plateau entier visible',
  factRoundCosts: 'une manche coûte',
  factFlipsBuy: 'les coups initiaux valent',
  factThisBoard: 'ce plateau',
  factBoardHadToAdmit: 'le plateau devait admettre',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, le plus long {longest}',
  wordsIncludingOneOf: '{words} dont un de {ceiling}',
  scorelessRounds: '{rounds} sans marquer',

  whatAWordPays: 'Ce que rapporte un mot',
  columnLetters: 'lettres',
  columnCost: 'coût',
  columnPoints: 'points',
  columnFlips: 'coups',
  columnNet: 'net',

  canonicalRules: 'Règles {difficulty} officielles.',
  customRules: 'Réglages modifiés. Les scores sur règles personnalisées ne sont pas classés.',
  applyAndStart: 'Appliquer et lancer une partie',
  changesNextGame: 'Les changements prennent effet à la prochaine partie.',
  presets: 'Préréglages :',

  start: 'Commencer',
  restart: 'Recommencer',
  quit: 'Quitter',
  quitTitle: 'Quitter cette partie ?',
  restartTitle: 'Recommencer cette partie ?',
  restartConfirm: 'Recommencer',
  quitConfirm: 'Quitter',
  keepPlaying: 'Continuer',
  personalBest: 'Vos meilleures parties',
  thisGame: 'cette partie',
  newPersonalBest: 'Nouveau record personnel.',
  columnRank: '#',
  notRanked: 'Règles personnalisées : cette partie n’est pas classée.',
  rankOfTotal: '{rank} sur {total}',

  howToPlay: 'Comment jouer',

  backToGame: 'Retour au jeu',
  welcomeTitle: 'Bienvenue dans Blinkered',
  tutorialSkip: 'Passer',
  tutorialNext: 'Suivant',
  tutorialBack: 'Retour',
  tutorialStart: 'Commencer à jouer',
  tutorialHideAgain: 'Ne plus afficher',
  tutorialProgress: '{n} sur {total}',
  tutorialSkipTitle: 'Passer la visite ?',
  tutPickLetters: 'Touchez les lettres voulues, dans l’ordre, pour former un mot.',
  tutMoreTurn:
    'Les tuiles continuent de se retourner pendant que vous réfléchissez : une meilleure lettre peut encore arriver.',
  tutTapBack:
    "Vous en avez pris une par erreur ? Touchez-la de nouveau pour la rendre. N'importe laquelle, pas seulement la dernière.",
  tutComplete: 'Appuyez sur Terminer quand le mot est prêt.',
  tutControlsTitle: 'Les boutons',
  tutReset: 'Effacer vide le mot en cours. Les tuiles restent en place.',
  tutPause:
    "Pause arrête le chronomètre et cache le plateau, pour qu'une pause ne serve pas à l'étudier.",
  tutRestart:
    'Recommencer distribue un nouveau plateau depuis le début. Une confirmation est demandée.',
  tutQuit: 'Quitter met fin à la partie et affiche votre score. Une confirmation est demandée.',
  tutDoneTitle: 'Voilà tout le jeu',
  tutDoneBody:
    'Choisissez un niveau et jouez. Comment jouer reste accessible dans la barre de titre.',
  htBoardTitle: 'Le plateau',
  htBoardBody:
    'Les tuiles se retournent une à une, dans le sens de la lecture. Les tuiles visibles servent à former des mots.',
  htWordsTitle: 'Les mots',
  htWordsBody:
    'Composez un mot avec les tuiles visibles, en tapant ou en cliquant les lettres dans l’ordre.',
  htFlipsTitle: 'Les coups',
  htFlipsBody:
    'Chaque tuile retournée coûte un coup. Un mot terminé rend des coups à votre total, et les mots longs en rendent davantage. Quand les coups sont épuisés, la partie est terminée.',
  htRoundTitle: 'La manche',
  htRoundBody:
    'Quand la dernière tuile d’une manche se retourne, tout le plateau reste visible un instant. Puis les tuiles sont retournées face cachée et mélangées, et une nouvelle manche commence.',
  htLanguagesTitle: 'Les langues',
  htLanguagesBody:
    '{n} langues. Chaque plateau peut être résolu avec des mots réellement employés. Un mot rare compte quand même, si le dictionnaire le connaît.',
  htKeysTitle: 'Le clavier',
  htWildTitle: 'Les jokers',
  htWildBody:
    'Parfois un joker apparaît à la place d’une lettre. Un joker vaut n’importe quelle lettre qui forme un mot valide. Un mot déjà terminé ne compte pas.',
  htSwapTitle: 'Les lettres changent',
  htSwapBody:
    'Parfois, entre deux manches, une lettre est remplacée par une autre. Vous verrez quelle lettre est partie et laquelle est arrivée.',
  htLevelsTitle: 'Les niveaux',
  htLevelEasy:
    'Les mêmes douze lettres pendant toute la partie : vous pouvez les apprendre et garder une liste de mots en tête. Les tuiles se retournent lentement et le plateau complet reste visible assez longtemps pour finir de choisir vos lettres.',
  htLevelMedium:
    'Une lettre change de temps en temps, ce qui rend plus difficile de retenir les mots que vous comptiez jouer plus tard. Moins de temps pour regarder, et moins pour réfléchir.',
  htLevelHard:
    "Les mots de trois lettres ne comptent plus, et une lettre change environ une manche sur deux. Le plateau est à peine visible qu'il se remélange déjà.",
  htLevelInsane:
    'Tout à la fois, à toute vitesse. Le plateau est mélangé presque aussitôt après le dernier retournement.',
  htTouchTitle: 'L’écran tactile',
  htTouchBody:
    'Touchez une tuile retournée pour prendre sa lettre. Touchez une lettre déjà prise pour la rendre. Valider et Effacer sont sous le plateau.',

  plurals: {
    words: { one: '{n} mot', other: '{n} mots' },
    rounds: { one: '{n} manche', other: '{n} manches' },
    flips: { one: '{n} coup', other: '{n} coups' },
    ticks: { one: '{n} temps', other: '{n} temps' },
    points: { one: '{n} point', other: '{n} points' },
  },
}
