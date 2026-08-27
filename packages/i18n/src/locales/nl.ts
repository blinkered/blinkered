import type { Messages } from '../messages.js'

/** Dutch. `zetten` for flips: a move you pay for, which is what the meter counts. */
export const nl: Messages = {
  tag: 'nl',

  readingDictionary: 'Woordenboek wordt gelezen…',
  noWordList: 'Geen woordenlijst voor "{language}". Genereer er een:  pnpm dictionary build',
  emptyWordList: 'De woordenlijst voor "{language}" is leeg.',

  flips: 'zetten',
  score: 'punten',
  words: 'woorden',
  round: 'ronde',
  ticksLeftLabel: 'Resterende tijd in deze ronde',
  typeAWord: 'typ een woord',
  tapPrompt: 'tik om te nemen of terug te geven, dan {action}',

  boardOfTiles: 'Bord van {n} stenen',
  faceDown: 'omgedraaid',
  spentTile: 'gebruikte steen',
  hiddenWhilePaused: 'verborgen tijdens pauze',
  letterInWord: '{letter}, letter {position} van het woord',

  completeWord: 'Woord inleveren',
  completeShort: 'Inleveren',
  reset: 'Wissen',
  pause: 'Pauze',
  resume: 'Doorgaan',
  newGame: 'Nieuw spel',
  paused: 'Gepauzeerd',
  outOfFlips: 'Geen zetten meer',
  finalResult: '{score} punten met {words} in {rounds}',
  playAgain: 'Opnieuw spelen',

  lettersSelect: 'letters selecteren',
  clearsEvery: 'wist alle geselecteerde {letter}',
  undoLastLetter: 'laatste letter terug',
  noWordsYet: 'Nog geen woorden.',

  wordAccepted: '{word}  +{points} punten, +{flips} zetten',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'al gevonden',
  reasonTooShort: 'te kort',
  reasonNotAWord: 'geen woord',
  noSuchLetterUp: 'geen {letter} open',
  nothingUp: 'niets open',
  shuffled: 'geschud',
  shuffledAndBilled: 'geschud, {flips} ongebruikte zetten in rekening gebracht',

  gameLanguage: 'taal',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} gewone van {full} woorden',

  nerdMode: 'expertmodus',
  rules: 'Regels',
  difficulty: 'moeilijkheid',
  difficultyNames: { easy: 'makkelijk', medium: 'gemiddeld', hard: 'moeilijk', insane: 'moordend' },
  tiles: 'stenen (N)',
  secondsPerTick: 'seconden / tik',
  holdTicks: 'wachttikken',
  minWord: 'kortste woord',
  startingFlips: 'zetten bij start',
  wordCompleteMode: 'woord af',
  wordCompleteNames: { shuffle: 'schudden', spend: 'opgebruiken', keep: 'houden' },
  flipEconomy: 'zettenhuishouding',
  flipEconomyNames: {
    none: 'geen',
    perLetter: 'per letter',
    fibonacci: 'fibonacci',
    overMinimum: 'boven minimum',
  },
  repeatedLetterKey: 'toets bij dubbele letter',
  keySchemeNames: { cycle: 'doorlopen', advance: 'opschuiven' },
  keySchemeHelp: {
    cycle:
      'A pakt de volgende vrije A, en zodra ze alle in het woord staan, wist het ze. ' +
      'Shift+A wist ze ook.',
    advance: 'A pakt de volgende vrije A. Shift+A wist elke A uit het woord.',
  },

  whatThatMeans: 'Wat dat betekent',
  factRound: 'een ronde',
  factWholeBoardUp: 'hele bord open',
  factRoundCosts: 'een ronde kost',
  factFlipsBuy: 'startzetten leveren',
  factThisBoard: 'dit bord',
  factBoardHadToAdmit: 'bord moest toelaten',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, langste {longest}',
  wordsIncludingOneOf: '{words} waarvan één van {ceiling}',
  scorelessRounds: '{rounds} zonder punten',

  whatAWordPays: 'Wat een woord oplevert',
  columnLetters: 'letters',
  columnCost: 'kosten',
  columnPoints: 'punten',
  columnFlips: 'zetten',
  columnNet: 'netto',

  canonicalRules: 'Officiële regels voor {difficulty}.',
  customRules: 'Afgeweken van de voorinstelling. Scores met eigen regels tellen niet mee.',
  applyAndStart: 'Toepassen en nieuw spel starten',
  changesNextGame: 'Wijzigingen gelden vanaf het volgende spel.',
  presets: 'Voorinstellingen:',

  start: 'Starten',
  restart: 'Opnieuw',
  quit: 'Stoppen',
  quitTitle: 'Dit spel stoppen?',
  quitConfirm: 'Stoppen',
  keepPlaying: 'Doorspelen',
  personalBest: 'Je beste spellen',
  thisGame: 'dit spel',
  newPersonalBest: 'Nieuw persoonlijk record.',
  columnRank: '#',
  notRanked: 'Eigen regels, dus dit spel telt niet mee.',
  rankOfTotal: '{rank} van {total}',

  howToPlay: 'Hoe je speelt',

  backToGame: 'Terug naar het spel',
  htBoardTitle: 'Het bord',
  htBoardBody:
    'De stenen draaien één voor één om, in leesrichting. Een letter is niet te zien tot zijn steen draait.',
  htWordsTitle: 'De woorden',
  htWordsBody:
    'Vorm een woord uit de open stenen. Typ het, of klik erop. Elke steen gaat één keer mee, en pas nadat hij is gedraaid.',
  htFlipsTitle: 'De zetten',
  htFlipsBody:
    'Elke steen die draait kost een zet. Een woord geeft zetten terug, en lange woorden geven meer. Zijn de zetten op, dan is het spel voorbij.',
  htRoundTitle: 'De ronde',
  htRoundBody:
    'Draait de laatste steen van een ronde, dan ligt het hele bord open. Zo blijft het even. Daarna wordt het geschud en opnieuw gelegd.',
  htLanguagesTitle: 'De talen',
  htLanguagesBody:
    'Zestien. Elk bord is op te lossen met alledaagse woorden. Een ongewoon woord telt ook mee, als het woordenboek het kent.',
  htKeysTitle: 'Het toetsenbord',
  htTouchTitle: 'Het aanraakscherm',
  htTouchBody:
    'Tik op een omgedraaide steen om zijn letter te nemen. Tik op een genomen letter om hem terug te geven. Inleveren en Wissen staan onder het bord.',

  plurals: {
    words: { one: '{n} woord', other: '{n} woorden' },
    rounds: { one: '{n} ronde', other: '{n} rondes' },
    flips: { one: '{n} zet', other: '{n} zetten' },
    ticks: { one: '{n} tik', other: '{n} tikken' },
    points: { one: '{n} punt', other: '{n} punten' },
  },
}
