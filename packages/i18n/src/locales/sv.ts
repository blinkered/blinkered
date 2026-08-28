import type { Messages } from '../messages.js'

/** Swedish. `drag` for flips: a move you spend, and the same word in every Swedish board game. */
export const sv: Messages = {
  tag: 'sv',

  readingDictionary: 'Läser ordlistan…',
  noWordList: 'Ingen ordlista för ”{language}”. Bygg en:  pnpm dictionary build',
  emptyWordList: 'Ordlistan för ”{language}” är tom.',

  flips: 'drag',
  score: 'poäng',
  words: 'ord',
  round: 'omgång',
  ticksLeftLabel: 'Återstående tid i omgången',
  typeAWord: 'skriv ett ord',
  tapPrompt: 'tryck för att ta eller lämna tillbaka, sedan {action}',

  boardOfTiles: 'Bräde med {n} brickor',
  faceDown: 'nedåtvänd',
  spentTile: 'förbrukad bricka',
  hiddenWhilePaused: 'dold under pausen',
  letterInWord: '{letter}, bokstav {position} i ordet',

  completeWord: 'Lämna in ordet',
  completeShort: 'Lämna in',
  reset: 'Rensa',
  pause: 'Pausa',
  resume: 'Fortsätt',
  newGame: 'Nytt spel',
  paused: 'Pausat',
  outOfFlips: 'Inga drag kvar',
  finalResult: '{score} poäng på {words} under {rounds}',
  playAgain: 'Spela igen',

  lettersSelect: 'bokstäver väljer',
  clearsEvery: 'rensar alla valda {letter}',
  undoLastLetter: 'ångrar sista bokstaven',
  noWordsYet: 'Inga ord än.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'redan hittat',
  reasonTooShort: 'för kort',
  reasonNotAWord: 'inget ord',
  noSuchLetterUp: 'inget {letter} uppe',
  nothingUp: 'inget uppe',
  shuffled: 'blandat',
  shuffledAndBilled: 'blandat, {flips} oanvända drag debiterade',

  gameLanguage: 'språk',
  interfaceLanguage: 'gränssnitt',
  dictionarySize: '{common} vanliga av {full} ord',

  nerdMode: 'expertläge',
  rules: 'Regler',
  difficulty: 'svårighet',
  difficultyNames: { easy: 'lätt', medium: 'medel', hard: 'svårt', insane: 'brutalt' },
  tiles: 'brickor (N)',
  secondsPerTick: 'sekunder / takt',
  holdTicks: 'hålltakter',
  minWord: 'kortaste ord',
  startingFlips: 'drag vid start',
  wordCompleteMode: 'ordet klart',
  wordCompleteNames: { shuffle: 'blanda', spend: 'förbruka', keep: 'behåll' },
  flipEconomy: 'draghushållning',
  flipEconomyNames: {
    none: 'ingen',
    perLetter: 'per bokstav',
    fibonacci: 'fibonacci',
    overMinimum: 'över minimum',
  },
  repeatedLetterKey: 'tangent för dubbel bokstav',
  keySchemeNames: { cycle: 'växla', advance: 'gå vidare' },
  keySchemeHelp: {
    cycle:
      'A tar nästa lediga A, och när alla är i ordet rensar det dem. ' +
      'Skift+A rensar dem också.',
    advance: 'A tar nästa lediga A. Skift+A rensar varje A ur ordet.',
  },

  whatThatMeans: 'Vad det betyder',
  factRound: 'en omgång',
  factWholeBoardUp: 'hela brädet uppe',
  factRoundCosts: 'en omgång kostar',
  factFlipsBuy: 'startdragen räcker till',
  factThisBoard: 'detta bräde',
  factBoardHadToAdmit: 'brädet måste tillåta',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, längsta {longest}',
  wordsIncludingOneOf: '{words} varav ett på {ceiling}',
  scorelessRounds: '{rounds} utan poäng',

  whatAWordPays: 'Vad ett ord ger',
  columnLetters: 'bokstäver',
  columnCost: 'kostnad',
  columnPoints: 'poäng',
  columnFlips: 'drag',
  columnNet: 'netto',

  canonicalRules: 'Officiella regler för {difficulty}.',
  customRules: 'Ändrat från förvalet. Poäng med egna regler rankas inte.',
  applyAndStart: 'Tillämpa och starta nytt spel',
  changesNextGame: 'Ändringar gäller från nästa spel.',
  presets: 'Förval:',

  start: 'Starta',
  restart: 'Börja om',
  quit: 'Avsluta',
  quitTitle: 'Avsluta det här spelet?',
  restartTitle: 'Starta om det här spelet?',
  restartConfirm: 'Starta om',
  quitConfirm: 'Avsluta',
  keepPlaying: 'Fortsätt spela',
  personalBest: 'Dina bästa spel',
  thisGame: 'det här spelet',
  newPersonalBest: 'Nytt personbästa.',
  columnRank: '#',
  notRanked: 'Egna regler, så det här spelet rankas inte.',
  rankOfTotal: '{rank} av {total}',

  howToPlay: 'Så spelar du',

  backToGame: 'Tillbaka till spelet',
  htBoardTitle: 'Brädet',
  htBoardBody:
    'Brickorna vänds upp en i taget, i läsordning. En bokstav syns inte förrän dess bricka vänds.',
  htWordsTitle: 'Orden',
  htWordsBody:
    'Bilda ett ord av de uppvända brickorna. Skriv det, eller klicka på dem. Varje bricka räcker en gång, och först efter att den vänts.',
  htFlipsTitle: 'Dragen',
  htFlipsBody:
    'Varje bricka som vänds kostar ett drag. Ett ord ger drag tillbaka, och långa ord ger mer. När dragen tar slut är spelet över.',
  htRoundTitle: 'Omgången',
  htRoundBody:
    'När omgångens sista bricka vänds ligger hela brädet uppe. Det ligger så ett ögonblick. Sedan blandas det och delas ut igen.',
  htLanguagesTitle: 'Språken',
  htLanguagesBody:
    'Sexton. Varje bräde går att lösa med ord folk faktiskt använder. Ett ovanligt ord räknas ändå, om ordlistan kan det.',
  htKeysTitle: 'Tangentbordet',
  htTouchTitle: 'Pekskärmen',
  htTouchBody:
    'Tryck på en uppvänd bricka för att ta dess bokstav. Tryck på en bokstav du redan tagit för att lämna tillbaka den. Lämna in och Rensa ligger under brädet.',

  plurals: {
    words: { one: '{n} ord', other: '{n} ord' },
    rounds: { one: '{n} omgång', other: '{n} omgångar' },
    flips: { one: '{n} drag', other: '{n} drag' },
    ticks: { one: '{n} takt', other: '{n} takter' },
    points: { one: '{n} poäng', other: '{n} poäng' },
  },
}
