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

  boardOfTiles: 'Plateau de {n} tuiles',
  faceDown: 'face cachée',
  spentTile: 'tuile utilisée',
  hiddenWhilePaused: 'masquée pendant la pause',
  letterInWord: '{letter}, lettre {position} du mot',

  completeWord: 'Valider le mot',
  reset: 'Effacer',
  pause: 'Pause',
  resume: 'Reprendre',
  newGame: 'Nouvelle partie',
  paused: 'En pause',
  outOfFlips: 'Plus de coups',
  finalResult: '{score} points, {words} en {rounds}',
  playAgain: 'Rejouer',

  lettersSelect: 'les lettres sélectionnent',
  clearsEvery: 'retire tous les {letter} sélectionnés',
  undoLastLetter: 'annule la dernière lettre',
  noWordsYet: 'Aucun mot pour le moment.',

  wordAccepted: '{word}  +{points} points, +{flips} coups',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'déjà trouvé',
  reasonTooShort: 'trop court',
  reasonNotAWord: "n'est pas un mot",
  noSuchLetterUp: 'aucun {letter} retourné',
  nothingUp: 'rien de retourné',
  shuffled: 'mélangé',
  shuffledAndBilled: 'mélangé, {flips} coups inutilisés facturés',

  gameLanguage: 'langue',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} courants sur {full} mots',

  nerdMode: 'mode expert',
  rules: 'Règles',
  difficulty: 'difficulté',
  difficultyNames: { easy: 'facile', medium: 'moyen', hard: 'difficile', insane: 'infernal' },
  tiles: 'tuiles (N)',
  secondsPerTick: 'secondes / temps',
  holdTicks: 'temps de maintien',
  minWord: 'mot minimum',
  startingFlips: 'coups au départ',
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

  plurals: {
    words: { one: '{n} mot', other: '{n} mots' },
    rounds: { one: '{n} manche', other: '{n} manches' },
    flips: { one: '{n} coup', other: '{n} coups' },
    ticks: { one: '{n} temps', other: '{n} temps' },
    points: { one: '{n} point', other: '{n} points' },
  },
}
