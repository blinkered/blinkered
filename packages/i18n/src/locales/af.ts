import type { Messages } from '../messages.js'

/**
 * Afrikaans. `skuiwe` for flips, the way Dutch takes `zetten`: a move you pay for, which is
 * what the meter counts, rather than the physical turning of a tile.
 *
 * `blokkies` for tiles, which is what an Afrikaans board game calls them.
 */
export const af: Messages = {
  tag: 'af',

  readingDictionary: 'Woordeboek word gelees…',
  noWordList: 'Geen woordelys vir "{language}" nie. Bou een:  pnpm dictionary build',
  emptyWordList: 'Die woordelys vir "{language}" is leeg.',

  flips: 'skuiwe',
  score: 'punte',
  words: 'woorde',
  round: 'rondte',
  ticksLeftLabel: 'Tyd oor in hierdie rondte',
  typeAWord: 'tik ’n woord',
  tapPrompt: 'tik letters om te kies of terug te gee, dan {action}',

  boardOfTiles: 'Bord van {n} blokkies',
  faceDown: 'omgedraai',
  wildCard: 'joker',
  wildKey: 'enige letter',
  letterReplaced: '{from} het {to} geword',
  letterSwap: 'LETTER RUIL!',
  spentTile: 'gebruikte blokkie',
  hiddenWhilePaused: 'weggesteek terwyl gepouseer',
  letterInWord: '{letter}, letter {position} van die woord',

  completeWord: 'Voltooi woord',

  completeShort: 'Voltooi',
  reset: 'Herstel',
  pause: 'Pouse',
  resume: 'Gaan voort',
  newGame: 'Nuwe spel',
  paused: 'Gepouseer',
  outOfFlips: 'Skuiwe op',
  finalResult: '{score} punte uit {words} oor {rounds}',
  playAgain: 'Speel weer',
  share: 'Deel',
  shareCopied: 'Gekopieer.',
  shareSelect: 'Kopieer dit:',

  lettersSelect: 'letters kies',
  keysWild: 'word geneem wanneer jy ’n letter tik wat geen blokkie wys nie',
  clearsEvery: 'wis al die gekose {letter}’s',
  undoLastLetter: 'laaste letter terug',
  noWordsYet: 'Nog geen woorde nie.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'reeds gevind',
  reasonTooShort: 'te kort',
  reasonNotAWord: 'nie ’n woord nie',
  reasonAllFound: 'jy het hulle almal al',
  noSuchLetterUp: 'geen {letter} oop nie',
  nothingUp: 'nie oop nie',
  shuffled: 'geskommel',
  shuffledAndBilled: 'geskommel, {flips} ongebruikte skuiwe gehef',

  gameLanguage: 'taal',
  interfaceLanguage: 'koppelvlak',
  dictionarySize: '{common} algemene van {full} woorde',
  filterLanguages: 'Soek tale',
  noMatches: 'Geen resultate',

  nerdMode: 'nerd-modus',
  rules: 'Reëls',
  difficulty: 'moeilikheid',
  difficultyNames: { easy: 'maklik', medium: 'middel', hard: 'moeilik', insane: 'waansinnig' },
  tiles: 'blokkies (N)',
  secondsPerTick: 'sekondes / tik',
  holdTicks: 'houtikke',
  minWord: 'kortste woord',
  startingFlips: 'beginskuiwe',
  wildChance: 'kans op joker',
  replaceChance: 'kans op letterruil',
  wordCompleteMode: 'woord voltooi',
  wordCompleteNames: { shuffle: 'skommel', spend: 'gebruik', keep: 'hou' },
  flipEconomy: 'skuifekonomie',
  flipEconomyNames: {
    none: 'geen',
    perLetter: 'per letter',
    fibonacci: 'fibonacci',
    overMinimum: 'bo die minimum',
  },
  repeatedLetterKey: 'herhaalde letter-sleutel',
  keySchemeNames: { cycle: 'siklus', advance: 'vorentoe' },
  keySchemeHelp: {
    cycle:
      'A neem die volgende ongebruikte A, en sodra hulle almal in die woord is, wis dit hulle. ' +
      'Shift+A wis hulle ook.',
    advance: 'A neem die volgende ongebruikte A. Shift+A wis elke A in die woord.',
  },

  whatThatMeans: 'Wat dit beteken',
  factRound: 'rondte',
  factWholeBoardUp: 'hele bord oop vir',
  factRoundCosts: '’n rondte kos',
  factFlipsBuy: 'beginskuiwe koop',
  factThisBoard: 'hierdie bord',
  factBoardHadToAdmit: 'bord moes toelaat',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, langste {longest}',
  wordsIncludingOneOf: '{words} ins. een van {ceiling}',
  scorelessRounds: '{rounds} sonder punte',

  whatAWordPays: 'Wat ’n woord betaal',
  columnLetters: 'letters',
  columnCost: 'koste',
  columnPoints: 'punte',
  columnFlips: 'skuiwe',
  columnNet: 'netto',

  canonicalRules: 'Standaardreëls vir {difficulty}.',
  customRules: 'Van die voorinstelling verander. Punte onder eie reëls word nie gerangskik nie.',
  applyAndStart: 'Pas toe en begin ’n nuwe spel',
  changesNextGame: 'Veranderinge geld vanaf die volgende spel.',
  presets: 'Voorinstellings:',

  start: 'Begin',
  restart: 'Herbegin',
  quit: 'Stop',
  quitTitle: 'Hierdie spel stop?',
  restartTitle: 'Hierdie spel herbegin?',
  restartConfirm: 'Herbegin',
  quitConfirm: 'Stop',
  keepPlaying: 'Speel verder',
  personalBest: 'Jou beste spele',
  thisGame: 'hierdie spel',
  newPersonalBest: '’n Nuwe persoonlike beste.',
  columnRank: '#',
  notRanked: 'Eie reëls, so hierdie spel word nie gerangskik nie.',
  rankOfTotal: '{rank} van {total}',

  howToPlay: 'Hoe om te speel',

  backToGame: 'Terug na die spel',
  welcomeTitle: 'Welkom by Blinkered',
  tutorialSkip: 'Slaan oor',
  tutorialNext: 'Volgende',
  tutorialBack: 'Terug',
  tutorialStart: 'Begin speel',
  tutorialHideAgain: 'Moenie dit weer wys nie',
  tutorialProgress: '{n} van {total}',
  tutorialSkipTitle: 'Die rondleiding oorslaan?',
  tutPickLetters: 'Tik die letters wat jy wil hê, in volgorde, om ’n woord te vorm.',
  tutMoreTurn: 'Blokkies draai aan terwyl jy dink, so ’n beter letter kan nog kom.',
  tutTapBack:
    'Een getik wat jy nie wou hê nie? Tik dit weer om dit terug te gee. Enigeen, nie net die ' +
    'laaste een nie.',
  tutComplete: 'Druk Voltooi wanneer die woord gereed is.',
  tutControlsTitle: 'Die knoppies',
  tutReset: 'Herstel wis die woord wat jy bou. Die blokkies bly waar hulle is.',
  tutPause:
    'Pouse stop die klok en steek die bord weg, sodat ’n blaaskans nie gebruik kan word om dit ' +
    'te bestudeer nie.',
  tutRestart: 'Herbegin deel ’n nuwe bord van voor af. Dit vra eers.',
  tutQuit: 'Stop beëindig die spel en wys wat jy behaal het. Dit vra eers.',
  tutDoneTitle: 'Dis die hele spel',
  tutDoneBody:
    'Kies ’n vlak en speel. Hoe om te speel is altyd in die titelbalk as jy dit weer wil hê.',
  htBoardTitle: 'Die bord',
  htBoardBody:
    'Blokkies draai een vir een oop, in leesrigting. Met die oop blokkies vorm jy woorde.',
  htWordsTitle: 'Die woorde',
  htWordsBody: 'Vorm ’n woord uit die oop blokkies deur die letters in volgorde te tik of te klik.',
  htFlipsTitle: 'Die skuiwe',
  htFlipsBody:
    'Elke blokkie wat draai kos een skuif. ’n Voltooide woord gee skuiwe terug op jou telling, en lang woorde gee meer. Wanneer die skuiwe op is, is die spel verby.',
  htRoundTitle: 'Die rondte',
  htRoundBody:
    'Wanneer die laaste blokkie van ’n rondte draai, bly die hele bord ’n oomblik lank oop. Dan word die blokkies omgedraai en geskommel, en ’n nuwe rondte begin.',
  htLanguagesTitle: 'Die tale',
  htLanguagesBody:
    '{n}. Elke bord is oplosbaar met woorde wat mense werklik gebruik. ’n Ongewone woord tel ook, as die woordeboek dit ken.',
  htKeysTitle: 'Die sleutelbord',
  htWildTitle: 'Jokers',
  htWildBody:
    'Soms verskyn ’n joker in plaas van ’n letter. ’n Joker geld as enige letter wat ’n geldige woord maak. ’n Woord wat jy reeds voltooi het, tel nie.',
  htSwapTitle: 'Letters wat verander',
  htSwapBody:
    'Soms word tussen die rondtes een letter deur ’n ander vervang. Jy sien watter letter weg is en watter bygekom het.',
  htLevelsTitle: 'Die vlakke',
  htLevelEasy:
    'Dieselfde twaalf letters die hele spel lank, sodat jy hulle kan leer en ’n lys woorde in jou kop kan hou. Blokkies draai stadig, en die vol bord bly lank genoeg sigbaar om rustig klaar te kies.',
  htLevelMedium:
    'Nou en dan verander ’n letter, en dan is dit moeiliker om woorde te onthou wat jy later wou speel. Minder tyd om te kyk en minder om te dink.',
  htLevelHard:
    'Woorde van drie letters tel nie meer nie, en omtrent elke tweede rondte verander ’n letter. Die bord is skaars oop of dit skommel weer.',
  htLevelInsane:
    'Alles gelyktydig, teen volle spoed. Die bord skommel byna dadelik ná die laaste skuif.',
  htTouchTitle: 'Die raakskerm',
  htTouchBody:
    'Tik ’n oop blokkie om sy letter te neem. Tik enige letter wat jy geneem het om dit terug te gee. Voltooi en Herstel sit onder die bord.',

  plurals: {
    words: { one: '{n} woord', other: '{n} woorde' },
    rounds: { one: '{n} rondte', other: '{n} rondtes' },
    flips: { one: '{n} skuif', other: '{n} skuiwe' },
    ticks: { one: '{n} tik', other: '{n} tikke' },
    points: { one: '{n} punt', other: '{n} punte' },
  },
}
