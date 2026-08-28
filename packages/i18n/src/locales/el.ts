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
  tapPrompt: 'αγγίξτε για να πάρετε ή να δώσετε, μετά {action}',

  boardOfTiles: 'Ταμπλό με {n} πλακίδια',
  faceDown: 'κλειστό',
  spentTile: 'χρησιμοποιημένο πλακίδιο',
  hiddenWhilePaused: 'κρυμμένο στην παύση',
  letterInWord: '{letter}, {position}ο γράμμα της λέξης',

  completeWord: 'Υποβολή λέξης',
  completeShort: 'Υποβολή',
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

  start: 'Έναρξη',
  restart: 'Από την αρχή',
  quit: 'Έξοδος',
  quitTitle: 'Έξοδος από αυτό το παιχνίδι;',
  restartTitle: 'Επανεκκίνηση αυτού του παιχνιδιού;',
  restartConfirm: 'Επανεκκίνηση',
  quitConfirm: 'Έξοδος',
  keepPlaying: 'Συνέχεια',
  personalBest: 'Τα καλύτερά σας παιχνίδια',
  thisGame: 'αυτό το παιχνίδι',
  newPersonalBest: 'Νέο προσωπικό ρεκόρ.',
  columnRank: '#',
  notRanked: 'Δικοί σας κανόνες, οπότε αυτό το παιχνίδι δεν κατατάσσεται.',
  rankOfTotal: '{rank} από {total}',

  howToPlay: 'Πώς παίζεται',

  backToGame: 'Επιστροφή στο παιχνίδι',
  htBoardTitle: 'Το ταμπλό',
  htBoardBody:
    'Τα πλακίδια γυρίζουν ένα κάθε φορά, με τη σειρά ανάγνωσης. Ένα γράμμα δεν φαίνεται ώσπου να γυρίσει το πλακίδιό του.',
  htWordsTitle: 'Οι λέξεις',
  htWordsBody:
    'Σχηματίστε μια λέξη από τα ανοιχτά πλακίδια. Γράψτε τη, ή κάντε κλικ πάνω τους. Κάθε πλακίδιο μετράει μία φορά, και μόνο αφού γυρίσει.',
  htFlipsTitle: 'Οι κινήσεις',
  htFlipsBody:
    'Κάθε πλακίδιο που γυρίζει κοστίζει μία κίνηση. Μια λέξη επιστρέφει κινήσεις, και οι μεγάλες λέξεις επιστρέφουν περισσότερες. Όταν οι κινήσεις τελειώσουν, το παιχνίδι τελειώνει.',
  htRoundTitle: 'Ο γύρος',
  htRoundBody:
    'Όταν γυρίσει το τελευταίο πλακίδιο του γύρου, όλο το ταμπλό είναι ανοιχτό. Μένει έτσι για μια στιγμή. Μετά ανακατεύεται και μοιράζεται ξανά.',
  htLanguagesTitle: 'Οι γλώσσες',
  htLanguagesBody:
    'Δεκαέξι. Κάθε ταμπλό λύνεται με λέξεις που χρησιμοποιούνται στην πράξη. Μια ασυνήθιστη λέξη μετράει κι αυτή, αν τη γνωρίζει το λεξικό.',
  htKeysTitle: 'Το πληκτρολόγιο',
  htTouchTitle: 'Η οθόνη αφής',
  htTouchBody:
    'Αγγίξτε ένα αναποδογυρισμένο πλακίδιο για να πάρετε το γράμμα του. Αγγίξτε οποιοδήποτε γράμμα έχετε πάρει για να το δώσετε πίσω. Η Υποβολή και ο Καθαρισμός βρίσκονται κάτω από το ταμπλό.',

  plurals: {
    words: { one: '{n} λέξη', other: '{n} λέξεις' },
    rounds: { one: '{n} γύρος', other: '{n} γύροι' },
    flips: { one: '{n} κίνηση', other: '{n} κινήσεις' },
    ticks: { one: '{n} χτύπος', other: '{n} χτύποι' },
    points: { one: '{n} βαθμός', other: '{n} βαθμοί' },
  },
}
