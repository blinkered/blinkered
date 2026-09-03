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
  wildCard: 'joker',
  wildKey: 'een willekeurige letter',
  letterReplaced: '{from} werd {to}',
  letterSwap: 'LETTERWISSEL!',
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
  share: 'Delen',
  shareCopied: 'Gekopieerd.',
  shareSelect: 'Kopieer dit:',

  lettersSelect: 'letters selecteren',
  keysWild: 'wordt genomen als je een letter typt die geen enkele steen toont',
  clearsEvery: 'wist alle geselecteerde {letter}',
  undoLastLetter: 'laatste letter terug',
  noWordsYet: 'Nog geen woorden.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'al gevonden',
  reasonTooShort: 'te kort',
  reasonNotAWord: 'geen woord',
  reasonAllFound: 'die heb je allemaal al',
  noSuchLetterUp: 'geen {letter} open',
  nothingUp: 'niets open',
  shuffled: 'geschud',
  shuffledAndBilled: 'geschud, {flips} ongebruikte zetten in rekening gebracht',

  gameLanguage: 'taal',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} gewone van {full} woorden',
  filterLanguages: 'Talen zoeken',
  noMatches: 'Geen resultaten',

  nerdMode: 'expertmodus',
  rules: 'Regels',
  difficulty: 'moeilijkheid',
  difficultyNames: { easy: 'makkelijk', medium: 'gemiddeld', hard: 'moeilijk', insane: 'moordend' },
  tiles: 'stenen (N)',
  secondsPerTick: 'seconden / tik',
  holdTicks: 'wachttikken',
  minWord: 'kortste woord',
  startingFlips: 'zetten bij start',
  wildChance: 'jokerkans',
  replaceChance: 'kans op letterwissel',
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
  restartTitle: 'Dit spel opnieuw starten?',
  restartConfirm: 'Opnieuw',
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
  welcomeTitle: 'Welkom bij Blinkered',
  tutorialSkip: 'Overslaan',
  tutorialNext: 'Volgende',
  tutorialBack: 'Terug',
  tutorialStart: 'Beginnen met spelen',
  tutorialHideAgain: 'Dit niet meer tonen',
  tutorialProgress: '{n} van {total}',
  tutorialSkipTitle: 'Rondleiding overslaan?',
  tutPickLetters: 'Tik de letters die je wilt op volgorde aan om een woord te vormen.',
  tutMoreTurn:
    'Er blijven tegels omdraaien terwijl je nadenkt, dus er kan nog een betere letter komen.',
  tutTapBack:
    'Per ongeluk een aangetikt? Tik hem nog eens aan om hem terug te geven. Elke letter, niet alleen de laatste.',
  tutComplete: 'Druk op Klaar als het woord af is.',
  tutControlsTitle: 'De knoppen',
  tutReset: 'Wissen maakt het woord leeg dat je aan het vormen bent. De tegels blijven liggen.',
  tutPause:
    'Pauze stopt de klok en verbergt het bord, zodat een pauze niet gebruikt kan worden om het te bestuderen.',
  tutRestart: 'Opnieuw deelt een nieuw bord vanaf het begin. Het vraagt eerst.',
  tutQuit: 'Stoppen beëindigt het spel en toont je score. Het vraagt eerst.',
  tutDoneTitle: 'Dat is het hele spel',
  tutDoneBody: 'Kies een niveau en speel. Spelregels staan altijd in de titelbalk.',
  htBoardTitle: 'Het bord',
  htBoardBody:
    'De stenen draaien één voor één om, in leesrichting. Met de open stenen vorm je woorden.',
  htWordsTitle: 'De woorden',
  htWordsBody:
    'Vorm een woord uit de open stenen door de letters op volgorde te typen of aan te klikken.',
  htFlipsTitle: 'De zetten',
  htFlipsBody:
    'Elke steen die draait kost een zet. Een afgemaakt woord schrijft zetten bij je totaal, en lange woorden geven meer. Zijn de zetten op, dan is het spel voorbij.',
  htRoundTitle: 'De ronde',
  htRoundBody:
    'Draait de laatste steen van een ronde, dan ligt het hele bord even open. Daarna worden de stenen omgedraaid en geschud, en begint een nieuwe ronde.',
  htLanguagesTitle: 'De talen',
  htLanguagesBody:
    '{n}. Elk bord is op te lossen met alledaagse woorden. Een ongewoon woord telt ook mee, als het woordenboek het kent.',
  htKeysTitle: 'Het toetsenbord',
  htWildTitle: 'Jokers',
  htWildBody:
    'Soms verschijnt er een joker in plaats van een letter. Een joker geldt als elke letter die een geldig woord maakt. Een woord dat je al af hebt telt niet.',
  htSwapTitle: 'Wisselende letters',
  htSwapBody:
    'Soms wordt tussen de rondes één letter door een andere vervangen. Je ziet welke letter weg is en welke erbij is gekomen.',
  htLevelsTitle: 'De niveaus',
  htLevelEasy:
    'Dezelfde twaalf letters de hele partij, dus je kunt ze leren en een lijstje met woorden in je hoofd houden. Stenen draaien langzaam en het volle bord blijft lang genoeg staan om je letters rustig te kiezen.',
  htLevelMedium:
    'Af en toe verandert er een letter, waardoor het lastiger wordt om woorden te onthouden die je later wilde spelen. Minder tijd om te kijken en minder om na te denken.',
  htLevelHard:
    'Woorden van drie letters tellen niet meer en ongeveer om de ronde verandert er een letter. Het bord staat er amper of het schudt alweer.',
  htLevelInsane:
    'Alles tegelijk, op volle snelheid. Het bord wordt bijna meteen na de laatste zet geschud.',
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
