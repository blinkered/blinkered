import type { Messages } from '../messages.js'

/**
 * Danish. `træk` for flips, the word a Danish board game uses for a move — and one of several
 * here that does not change in the plural: et træk, to træk, like ord and point.
 */
export const da: Messages = {
  tag: 'da',

  readingDictionary: 'Læser ordbogen…',
  noWordList: 'Ingen ordliste til "{language}". Byg en:  pnpm dictionary build',
  emptyWordList: 'Ordlisten til "{language}" er tom.',

  flips: 'træk',
  score: 'point',
  words: 'ord',
  round: 'runde',
  ticksLeftLabel: 'Tid tilbage i denne runde',
  typeAWord: 'skriv et ord',
  tapPrompt: 'tryk på bogstaver for at vælge eller fortryde, derefter {action}',

  boardOfTiles: 'Bræt med {n} brikker',
  faceDown: 'vendt nedad',
  wildCard: 'joker',
  wildKey: 'et hvilket som helst bogstav',
  letterReplaced: '{from} blev til {to}',
  letterSwap: 'BOGSTAVBYTTE!',
  spentTile: 'brugt brik',
  hiddenWhilePaused: 'skjult under pause',
  letterInWord: '{letter}, bogstav {position} i ordet',

  completeWord: 'Færdiggør ord',

  completeShort: 'Færdig',
  reset: 'Ryd',
  pause: 'Pause',
  resume: 'Fortsæt',
  newGame: 'Nyt spil',
  paused: 'Pauset',
  outOfFlips: 'Ikke flere træk',
  finalResult: '{score} for {words} over {rounds}',
  playAgain: 'Spil igen',
  share: 'Del',
  shareCopied: 'Kopieret.',
  shareSelect: 'Kopiér dette:',

  lettersSelect: 'bogstaver vælger',
  keysWild: 'tages når du skriver et bogstav, ingen brik viser',
  clearsEvery: 'rydder alle valgte {letter}',
  undoLastLetter: 'fortryd sidste bogstav',
  noWordsYet: 'Ingen ord endnu.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'allerede fundet',
  reasonTooShort: 'for kort',
  reasonNotAWord: 'ikke et ord',
  reasonAllFound: 'du har dem alle',
  noSuchLetterUp: 'intet {letter} vendt',
  nothingUp: 'intet vendt',
  shuffled: 'blandet',
  shuffledAndBilled: 'blandet, trak {flips} ubrugte',

  gameLanguage: 'sprog',
  interfaceLanguage: 'grænseflade',
  dictionarySize: '{common} almindelige af {full} ord',
  filterLanguages: 'Søg efter sprog',
  noMatches: 'Ingen træffere',

  nerdMode: 'nørdetilstand',
  rules: 'Regler',
  difficulty: 'sværhedsgrad',
  difficultyNames: { easy: 'let', medium: 'mellem', hard: 'svær', insane: 'vanvittig' },
  tiles: 'brikker (N)',
  secondsPerTick: 'sekunder / tik',
  holdTicks: 'holdetik',
  minWord: 'korteste ord',
  startingFlips: 'træk ved start',
  wildChance: 'chance for joker',
  replaceChance: 'chance for bogstavbytte',
  wordCompleteMode: 'når ordet er færdigt',
  wordCompleteNames: { shuffle: 'bland', spend: 'brug', keep: 'behold' },
  flipEconomy: 'trækøkonomi',
  flipEconomyNames: {
    none: 'ingen',
    perLetter: 'per bogstav',
    fibonacci: 'fibonacci',
    overMinimum: 'over minimum',
  },
  repeatedLetterKey: 'tast for gentaget bogstav',
  keySchemeNames: { cycle: 'cyklus', advance: 'fremad' },
  keySchemeHelp: {
    cycle:
      'A tager det næste ubrugte A, og når de alle er i ordet, rydder det dem. ' +
      'Shift+A rydder dem også.',
    advance: 'A tager det næste ubrugte A. Shift+A rydder alle A i ordet.',
  },

  whatThatMeans: 'Hvad det betyder',
  factRound: 'runde',
  factWholeBoardUp: 'hele brættet vendt i',
  factRoundCosts: 'en runde koster',
  factFlipsBuy: 'starttræk køber',
  factThisBoard: 'dette bræt',
  factBoardHadToAdmit: 'brættet skulle tillade',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, længste {longest}',
  wordsIncludingOneOf: '{words}, heraf et på {ceiling}',
  scorelessRounds: '{rounds} uden point',

  whatAWordPays: 'Hvad et ord giver',
  columnLetters: 'bogstaver',
  columnCost: 'pris',
  columnPoints: 'point',
  columnFlips: 'træk',
  columnNet: 'netto',

  canonicalRules: 'Almindelige regler for {difficulty}.',
  customRules: 'Ændret fra standarden. Point under egne regler kommer ikke på listen.',
  applyAndStart: 'Anvend og start et nyt spil',
  changesNextGame: 'Ændringerne gælder fra næste spil.',
  presets: 'Standarder:',

  start: 'Start',
  restart: 'Forfra',
  quit: 'Afslut',
  quitTitle: 'Afslutte dette spil?',
  restartTitle: 'Starte dette spil forfra?',
  restartConfirm: 'Forfra',
  quitConfirm: 'Afslut',
  keepPlaying: 'Spil videre',
  personalBest: 'Dine bedste spil',
  thisGame: 'dette spil',
  newPersonalBest: 'En ny personlig rekord.',
  columnRank: '#',
  notRanked: 'Egne regler, så dette spil kommer ikke på listen.',
  rankOfTotal: '{rank} af {total}',

  howToPlay: 'Sådan spiller du',

  backToGame: 'Tilbage til spillet',
  welcomeTitle: 'Velkommen til Blinkered',
  tutorialSkip: 'Spring over',
  tutorialNext: 'Næste',
  tutorialBack: 'Tilbage',
  tutorialStart: 'Begynd at spille',
  tutorialHideAgain: 'Vis ikke dette igen',
  tutorialProgress: '{n} af {total}',
  tutorialSkipTitle: 'Springe rundvisningen over?',
  tutPickLetters: 'Tryk på de bogstaver du vil have, i rækkefølge, for at danne et ord.',
  tutMoreTurn:
    'Brikker bliver ved med at vende mens du tænker, så et bedre bogstav kan være på vej.',
  tutTapBack:
    'Kom du til at tage et forkert? Tryk på det igen for at give det tilbage. Et hvilket som helst, ikke kun det sidste.',
  tutComplete: 'Tryk på Færdig når ordet er klart.',
  tutControlsTitle: 'Knapperne',
  tutReset: 'Ryd sletter det ord du er ved at danne. Brikkerne bliver hvor de er.',
  tutPause:
    'Pause stopper uret og skjuler brættet, så en pause ikke kan bruges til at studere det.',
  tutRestart: 'Forfra deler et nyt bræt fra begyndelsen. Den spørger først.',
  tutQuit: 'Afslut slutter spillet og viser hvad du fik. Den spørger først.',
  tutDoneTitle: 'Det er hele spillet',
  tutDoneBody: 'Vælg en sværhedsgrad og spil. Sådan spiller du står altid ved titlen.',
  htBoardTitle: 'Brættet',
  htBoardBody:
    'Brikkerne vendes én ad gangen, i læserækkefølge. Vendte brikker kan bruges til at danne ord.',
  htWordsTitle: 'Ordene',
  htWordsBody:
    'Dan et ord af de vendte brikker ved at skrive eller klikke bogstaverne i rækkefølge.',
  htFlipsTitle: 'Trækkene',
  htFlipsBody:
    'Hver brik der vendes koster et træk. Et færdigt ord giver træk tilbage, og længere ord giver flere. Når trækkene slipper op, er spillet forbi.',
  htRoundTitle: 'Runden',
  htRoundBody:
    'Når rundens sidste brik vendes, står hele brættet stille et øjeblik. Så vendes brikkerne om og blandes, og en ny runde begynder.',
  htLanguagesTitle: 'Sprogene',
  htLanguagesBody:
    '{n} af dem. Hvert bræt kan løses med ord folk faktisk bruger. Et usædvanligt ord giver også point, hvis ordbogen kender det.',
  htKeysTitle: 'Tastaturet',
  htWildTitle: 'Jokere',
  htWildBody:
    'Nogle gange dukker en joker op i stedet for et bogstav. En joker tæller som ethvert bogstav der danner et gyldigt ord. Et ord du allerede har fundet tæller ikke.',
  htSwapTitle: 'Bogstaver der skifter',
  htSwapBody:
    'Nogle gange bliver ét bogstav mellem runderne skiftet ud med et andet. Du får at se hvilket der forsvandt og hvilket der kom til.',
  htLevelsTitle: 'Niveauerne',
  htLevelEasy:
    'De samme tolv bogstaver hele spillet, så du kan lære dem og bære en liste af ord i hovedet. Brikkerne vendes langsomt, og hele brættet bliver stående længe nok til at gøre dit valg færdigt.',
  htLevelMedium:
    'Et bogstav skifter nu og da, så det bliver sværere at huske ord du har gemt til senere. Mindre tid til at kigge, og mindre til at tænke.',
  htLevelHard:
    'Ord på tre bogstaver tæller ikke længere, og et bogstav skifter omtrent hver anden runde. Brættet når knap at vise sig, før det blandes.',
  htLevelInsane:
    'Det hele på én gang, for fuld fart. Brættet blandes næsten lige efter sidste træk.',
  htTouchTitle: 'Berøringsskærmen',
  htTouchBody:
    'Tryk på en vendt brik for at tage dens bogstav. Tryk på et bogstav du har taget for at give det tilbage. Færdig og Ryd sidder under brættet.',

  plurals: {
    words: { one: '{n} ord', other: '{n} ord' },
    rounds: { one: '{n} runde', other: '{n} runder' },
    flips: { one: '{n} træk', other: '{n} træk' },
    ticks: { one: '{n} tik', other: '{n} tik' },
    points: { one: '{n} point', other: '{n} point' },
  },
}
