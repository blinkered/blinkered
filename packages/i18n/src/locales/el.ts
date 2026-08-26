import type { Messages } from '../messages.js'

/** Greek. `κινήσεις` for flips, because the meter counts what an action costs you. */
export const el: Messages = {
  tag: 'el',

  readingDictionary: 'Ανάγνωση λεξικού…',
  noWordList: 'Δεν υπάρχει λίστα λέξεων για «{language}». Δημιουργήστε την:  pnpm dictionary build',
  emptyWordList: 'Η λίστα λέξεων για «{language}» είναι κενή.',

  flips: 'κινήσεις',
  score: 'βαθμοί',
  words: 'λέξεις',
  round: 'γύρος',
  ticksLeftLabel: 'Χρόνος που απομένει στον γύρο',
  typeAWord: 'γράψτε μια λέξη',

  boardOfTiles: 'Ταμπλό με {n} πλακίδια',
  faceDown: 'κλειστό',
  spentTile: 'χρησιμοποιημένο πλακίδιο',
  hiddenWhilePaused: 'κρυμμένο στην παύση',
  letterInWord: '{letter}, {position}ο γράμμα της λέξης',

  completeWord: 'Υποβολή λέξης',
  reset: 'Καθαρισμός',
  pause: 'Παύση',
  resume: 'Συνέχεια',
  newGame: 'Νέο παιχνίδι',
  paused: 'Σε παύση',
  outOfFlips: 'Τέλος οι κινήσεις',
  finalResult: '{score} βαθμοί από {words} σε {rounds}',
  playAgain: 'Ξανά',

  lettersSelect: 'τα γράμματα επιλέγουν',
  clearsEvery: 'αφαιρεί όλα τα επιλεγμένα {letter}',
  undoLastLetter: 'αναιρεί το τελευταίο γράμμα',
  noWordsYet: 'Καμία λέξη ακόμη.',

  wordAccepted: '{word}  +{points} βαθμοί, +{flips} κινήσεις',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'βρέθηκε ήδη',
  reasonTooShort: 'πολύ μικρή',
  reasonNotAWord: 'δεν είναι λέξη',
  noSuchLetterUp: 'κανένα {letter} ανοιχτό',
  nothingUp: 'τίποτα ανοιχτό',
  shuffled: 'ανακατεύτηκε',
  shuffledAndBilled: 'ανακατεύτηκε, χρεώθηκαν {flips} αχρησιμοποίητες κινήσεις',

  gameLanguage: 'γλώσσα',
  interfaceLanguage: 'περιβάλλον',
  dictionarySize: '{common} κοινές από {full} λέξεις',

  nerdMode: 'λειτουργία λεπτομερειών',
  rules: 'Κανόνες',
  difficulty: 'δυσκολία',
  difficultyNames: { easy: 'εύκολο', medium: 'μέτριο', hard: 'δύσκολο', insane: 'εξοντωτικό' },
  tiles: 'πλακίδια (N)',
  secondsPerTick: 'δευτερόλεπτα / χτύπος',
  holdTicks: 'χτύποι αναμονής',
  minWord: 'ελάχιστη λέξη',
  startingFlips: 'αρχικές κινήσεις',
  wordCompleteMode: 'λέξη ολοκληρώθηκε',
  wordCompleteNames: { shuffle: 'ανακάτεμα', spend: 'κατανάλωση', keep: 'διατήρηση' },
  flipEconomy: 'οικονομία κινήσεων',
  flipEconomyNames: {
    none: 'καμία',
    perLetter: 'ανά γράμμα',
    fibonacci: 'φιμπονάτσι',
    overMinimum: 'πάνω από το ελάχιστο',
  },
  repeatedLetterKey: 'πλήκτρο επαναλαμβανόμενου γράμματος',
  keySchemeNames: { cycle: 'κύκλος', advance: 'προώθηση' },
  keySchemeHelp: {
    cycle:
      'Το Α παίρνει το επόμενο ελεύθερο Α και, όταν μπουν όλα στη λέξη, τα αφαιρεί. ' +
      'Shift+Α τα αφαιρεί επίσης.',
    advance: 'Το Α παίρνει το επόμενο ελεύθερο Α. Shift+Α αφαιρεί κάθε Α από τη λέξη.',
  },

  whatThatMeans: 'Τι σημαίνει αυτό',
  factRound: 'ένας γύρος',
  factWholeBoardUp: 'όλο το ταμπλό ανοιχτό',
  factRoundCosts: 'ένας γύρος κοστίζει',
  factFlipsBuy: 'οι αρχικές κινήσεις φτάνουν για',
  factThisBoard: 'αυτό το ταμπλό',
  factBoardHadToAdmit: 'το ταμπλό έπρεπε να επιτρέπει',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, μεγαλύτερη {longest}',
  wordsIncludingOneOf: '{words} με μία από {ceiling}',
  scorelessRounds: '{rounds} χωρίς βαθμούς',

  whatAWordPays: 'Τι αποδίδει μια λέξη',
  columnLetters: 'γράμματα',
  columnCost: 'κόστος',
  columnPoints: 'βαθμοί',
  columnFlips: 'κινήσεις',
  columnNet: 'καθαρό',

  canonicalRules: 'Επίσημοι κανόνες: {difficulty}.',
  customRules: 'Αλλαγή από την προεπιλογή. Τα σκορ με δικούς σας κανόνες δεν κατατάσσονται.',
  applyAndStart: 'Εφαρμογή και νέο παιχνίδι',
  changesNextGame: 'Οι αλλαγές ισχύουν από το επόμενο παιχνίδι.',
  presets: 'Προεπιλογές:',

  plurals: {
    words: { one: '{n} λέξη', other: '{n} λέξεις' },
    rounds: { one: '{n} γύρος', other: '{n} γύροι' },
    flips: { one: '{n} κίνηση', other: '{n} κινήσεις' },
    ticks: { one: '{n} χτύπος', other: '{n} χτύποι' },
    points: { one: '{n} βαθμός', other: '{n} βαθμοί' },
  },
}
