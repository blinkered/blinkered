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
  wildCard: 'joker',
  wildKey: 'vilken bokstav som helst',
  letterReplaced: '{from} blev {to}',
  letterSwap: 'BOKSTAVSBYTE!',
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
  share: 'Dela',
  shareCopied: 'Kopierat.',
  shareSelect: 'Kopiera detta:',

  lettersSelect: 'bokstäver väljer',
  keysWild: 'tar ett kort om ingen bricka visar bokstaven, och försöker bli den',
  clearsEvery: 'rensar alla valda {letter}',
  undoLastLetter: 'ångrar sista bokstaven',
  noWordsYet: 'Inga ord än.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'redan hittat',
  reasonTooShort: 'för kort',
  reasonNotAWord: 'inget ord',
  reasonAllFound: 'du har redan alla',
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
  wildChance: 'jokerchans',
  replaceChance: 'chans för bokstavsbyte',
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
  welcomeTitle: 'Välkommen till Blinkered',
  tutorialSkip: 'Hoppa över',
  tutorialNext: 'Nästa',
  tutorialBack: 'Tillbaka',
  tutorialStart: 'Börja spela',
  tutorialHideAgain: 'Visa inte igen',
  tutorialProgress: '{n} av {total}',
  tutorialSkipTitle: 'Hoppa över introduktionen?',
  tutPickLetters: 'Tryck på de bokstäver du vill ha, i ordning, för att bilda ett ord.',
  tutMoreTurn: 'Brickorna fortsätter vändas medan du tänker, så en bättre bokstav kan vara på väg.',
  tutTapBack:
    'Tog du fel? Tryck på den igen för att lämna tillbaka den. Vilken som helst, inte bara den sista.',
  tutComplete: 'Tryck på Klar när ordet är färdigt.',
  tutControlsTitle: 'Knapparna',
  tutReset: 'Rensa tömmer ordet du håller på med. Brickorna ligger kvar.',
  tutPause:
    'Paus stoppar klockan och döljer brädet, så att en paus inte går att använda för att studera det.',
  tutRestart: 'Börja om delar ut ett nytt bräde från början. Den frågar först.',
  tutQuit: 'Avsluta avslutar partiet och visar din poäng. Den frågar först.',
  tutDoneTitle: 'Det är hela spelet',
  tutDoneBody: 'Välj en nivå och spela. Så spelar du finns alltid i titelraden.',
  htBoardTitle: 'Brädet',
  htBoardBody:
    'Brickorna vänds upp en i taget, i läsordning. Av de uppvända brickorna bildar du ord.',
  htWordsTitle: 'Orden',
  htWordsBody:
    'Bilda ett ord av de uppvända brickorna genom att skriva eller klicka på bokstäverna i ordning.',
  htFlipsTitle: 'Dragen',
  htFlipsBody:
    'Varje bricka som vänds kostar ett drag. Ett färdigt ord lägger tillbaka drag till ditt saldo, och långa ord ger mer. När dragen tar slut är spelet över.',
  htRoundTitle: 'Omgången',
  htRoundBody:
    'När omgångens sista bricka vänds ligger hela brädet uppe ett ögonblick. Sedan vänds brickorna ned och blandas, och en ny omgång börjar.',
  htLanguagesTitle: 'Språken',
  htLanguagesBody:
    'Sexton. Varje bräde går att lösa med ord folk faktiskt använder. Ett ovanligt ord räknas ändå, om ordlistan kan det.',
  htKeysTitle: 'Tangentbordet',
  htWildTitle: 'Jokrar',
  htWildBody:
    'Ibland dyker det upp en joker i stället för en bokstav. En joker gäller som vilken bokstav som helst som bildar ett giltigt ord. Ett ord du redan gjort räknas inte.',
  htSwapTitle: 'Bokstäver som byts',
  htSwapBody:
    'Ibland byts en bokstav ut mot en annan mellan omgångarna. Du ser vilken bokstav som togs bort och vilken som lades till.',
  htLevelsTitle: 'Nivåerna',
  htLevelEasy:
    'Samma tolv bokstäver hela partiet, så du hinner lära dig dem och hålla en ordlista i huvudet. Brickorna vänds långsamt och hela brädet syns tillräckligt länge för att du ska hinna välja klart dina bokstäver.',
  htLevelMedium:
    'Då och då byts en bokstav, och då blir det svårare att hålla reda på ord du tänkt lägga senare. Mindre tid att titta och mindre att tänka.',
  htLevelHard:
    'Ord på tre bokstäver räknas inte längre, och en bokstav byts ungefär varannan omgång. Brädet hinner knappt synas innan det blandas om.',
  htLevelInsane:
    'Allt på en gång, i full fart. Brädet blandas nästan direkt efter det sista draget.',
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
