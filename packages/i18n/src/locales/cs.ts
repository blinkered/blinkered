import type { Messages } from '../messages.js'

/**
 * Czech. `tah` for flips, the word a Czech board game uses for a move.
 *
 * Four plural forms, and `many` is not a bigger `few`: Czech uses it only for fractions, so
 * `1,5 slova` takes it while `5 slov` takes `other`.
 */
export const cs: Messages = {
  tag: 'cs',

  readingDictionary: 'Načítám slovník…',
  noWordList: 'Pro „{language}“ chybí seznam slov. Vytvořte jej:  pnpm dictionary build',
  emptyWordList: 'Seznam slov pro „{language}“ je prázdný.',

  flips: 'tahy',
  score: 'skóre',
  words: 'slova',
  round: 'kolo',
  ticksLeftLabel: 'Zbývající čas v tomto kole',
  typeAWord: 'napište slovo',
  tapPrompt: 'klepnutím vyberte nebo vraťte písmena, pak {action}',

  boardOfTiles: 'Hrací plocha z {n} kamenů',
  faceDown: 'lícem dolů',
  wildCard: 'žolík',
  wildKey: 'libovolné písmeno',
  letterReplaced: '{from} se změnilo na {to}',
  letterSwap: 'VÝMĚNA PÍSMEN!',
  spentTile: 'použitý kámen',
  hiddenWhilePaused: 'skryto během pauzy',
  letterInWord: '{letter}, {position}. písmeno slova',

  completeWord: 'Dokončit slovo',

  completeShort: 'Dokončit',
  reset: 'Smazat',
  pause: 'Pauza',
  resume: 'Pokračovat',
  newGame: 'Nová hra',
  paused: 'Pozastaveno',
  outOfFlips: 'Došly tahy',
  finalResult: '{score} za {words} ve {rounds}',
  playAgain: 'Hrát znovu',
  share: 'Sdílet',
  shareCopied: 'Zkopírováno.',
  shareSelect: 'Zkopírujte toto:',

  lettersSelect: 'písmena vybírají',
  keysWild: 'vezme se, když napíšete písmeno, které na ploše není',
  clearsEvery: 'smaže všechna vybraná {letter}',
  undoLastLetter: 'vrátit poslední písmeno',
  noWordsYet: 'Zatím žádná slova.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'už nalezeno',
  reasonTooShort: 'příliš krátké',
  reasonNotAWord: 'není to slovo',
  reasonAllFound: 'už je máte všechna',
  noSuchLetterUp: 'žádné odkryté {letter}',
  nothingUp: 'nic není odkryto',
  shuffled: 'zamícháno',
  shuffledAndBilled: 'zamícháno, započteno {flips} nevyužitých',

  gameLanguage: 'jazyk',
  interfaceLanguage: 'rozhraní',
  dictionarySize: '{common} běžných z {full} slov',
  filterLanguages: 'Hledat jazyk',
  noMatches: 'Žádná shoda',

  nerdMode: 'režim pro fajnšmekry',
  rules: 'Pravidla',
  difficulty: 'obtížnost',
  difficultyNames: { easy: 'snadná', medium: 'střední', hard: 'těžká', insane: 'šílená' },
  tiles: 'kameny (N)',
  secondsPerTick: 'sekundy / takt',
  holdTicks: 'takty výdrže',
  minWord: 'nejkratší slovo',
  startingFlips: 'tahy na začátku',
  wildChance: 'šance na žolíka',
  replaceChance: 'šance na výměnu písmen',
  wordCompleteMode: 'po dokončení slova',
  wordCompleteNames: { shuffle: 'zamíchat', spend: 'spotřebovat', keep: 'ponechat' },
  flipEconomy: 'návrat tahů',
  flipEconomyNames: {
    none: 'žádný',
    perLetter: 'za písmeno',
    fibonacci: 'fibonacci',
    overMinimum: 'nad minimum',
  },
  repeatedLetterKey: 'klávesa opakovaného písmene',
  keySchemeNames: { cycle: 'cyklus', advance: 'postup' },
  keySchemeHelp: {
    cycle:
      'A vezme další nepoužité A, a jakmile jsou všechna ve slově, smaže je. ' +
      'Shift+A je smaže také.',
    advance: 'A vezme další nepoužité A. Shift+A smaže ze slova všechna A.',
  },

  whatThatMeans: 'Co to znamená',
  factRound: 'kolo',
  factWholeBoardUp: 'celá plocha odkrytá na',
  factRoundCosts: 'kolo stojí',
  factFlipsBuy: 'počáteční tahy koupí',
  factThisBoard: 'tato plocha',
  factBoardHadToAdmit: 'plocha musela připustit',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, nejdelší {longest}',
  wordsIncludingOneOf: '{words}, z toho jedno z {ceiling}',
  scorelessRounds: '{rounds} bez bodů',

  whatAWordPays: 'Co slovo vynese',
  columnLetters: 'písmena',
  columnCost: 'cena',
  columnPoints: 'body',
  columnFlips: 'tahy',
  columnNet: 'rozdíl',

  canonicalRules: 'Standardní pravidla pro {difficulty}.',
  customRules: 'Změněno oproti přednastavení. Skóre podle vlastních pravidel se nezapočítává.',
  applyAndStart: 'Použít a začít novou hru',
  changesNextGame: 'Změny se projeví v příští hře.',
  presets: 'Přednastavení:',

  start: 'Začít',
  restart: 'Znovu',
  quit: 'Ukončit',
  quitTitle: 'Ukončit tuto hru?',
  restartTitle: 'Začít tuto hru znovu?',
  restartConfirm: 'Znovu',
  quitConfirm: 'Ukončit',
  keepPlaying: 'Hrát dál',
  personalBest: 'Vaše nejlepší hry',
  thisGame: 'tato hra',
  newPersonalBest: 'Nový osobní rekord.',
  columnRank: '#',
  notRanked: 'Vlastní pravidla, takže tato hra se nezapočítává.',
  rankOfTotal: '{rank} z {total}',

  howToPlay: 'Jak hrát',

  backToGame: 'Zpět do hry',
  welcomeTitle: 'Vítejte v Blinkered',
  tutorialSkip: 'Přeskočit',
  tutorialNext: 'Dále',
  tutorialBack: 'Zpět',
  tutorialStart: 'Začít hrát',
  tutorialHideAgain: 'Příště nezobrazovat',
  tutorialProgress: '{n} z {total}',
  tutorialSkipTitle: 'Přeskočit úvod?',
  tutPickLetters: 'Klepejte na písmena v pořadí, ve kterém chcete složit slovo.',
  tutMoreTurn: 'Kameny se odkrývají, i když přemýšlíte, takže lepší písmeno může teprve přijít.',
  tutTapBack:
    'Vzali jste písmeno, které jste nechtěli? Klepněte na ně znovu a vrátí se. Kterékoli, nejen poslední.',
  tutComplete: 'Až bude slovo hotové, stiskněte Dokončit.',
  tutControlsTitle: 'Tlačítka',
  tutReset: 'Smazat zruší skládané slovo. Kameny zůstanou, kde jsou.',
  tutPause: 'Pauza zastaví hodiny a skryje plochu, aby přestávka nesloužila k jejímu učení.',
  tutRestart: 'Znovu rozdá novou plochu od začátku. Nejprve se zeptá.',
  tutQuit: 'Ukončit hru zakončí a ukáže, kolik jste získali. Nejprve se zeptá.',
  tutDoneTitle: 'To je celá hra',
  tutDoneBody: 'Vyberte obtížnost a hrajte. Jak hrát najdete vždy u názvu.',
  htBoardTitle: 'Plocha',
  htBoardBody: 'Kameny se odkrývají po jednom, ve směru čtení. Z odkrytých se skládají slova.',
  htWordsTitle: 'Slova',
  htWordsBody: 'Slovo složíte z odkrytých kamenů psaním nebo klikáním na písmena v pořadí.',
  htFlipsTitle: 'Tahy',
  htFlipsBody:
    'Každý odkrytý kámen stojí tah. Dokončené slovo tahy vrátí, a delší slova vrátí více. Když tahy dojdou, hra končí.',
  htRoundTitle: 'Kolo',
  htRoundBody:
    'Když se odkryje poslední kámen kola, celá plocha na okamžik vydrží. Pak se kameny otočí a zamíchají a začne nové kolo.',
  htLanguagesTitle: 'Jazyky',
  htLanguagesBody:
    'Je jich {n}. Každou plochu lze vyřešit slovy, která lidé opravdu používají. Neobvyklé slovo boduje také, pokud je slovník zná.',
  htKeysTitle: 'Klávesnice',
  htWildTitle: 'Žolíci',
  htWildBody:
    'Občas se místo písmene objeví žolík. Žolík platí za kterékoli písmeno, které tvoří platné slovo. Už dokončené slovo se nepočítá.',
  htSwapTitle: 'Měnící se písmena',
  htSwapBody:
    'Občas se mezi koly jedno písmeno vymění za jiné. Uvidíte, které zmizelo a které přibylo.',
  htLevelsTitle: 'Obtížnosti',
  htLevelEasy:
    'Stejných dvanáct písmen po celou hru, takže se dají naučit a nosit seznam slov v hlavě. Kameny se odkrývají pomalu a celá plocha zůstává vidět dost dlouho na dokončení výběru.',
  htLevelMedium:
    'Tu a tam se písmeno změní, takže je těžší pamatovat si slova odložená na později. Méně času na dívání i na přemýšlení.',
  htLevelHard:
    'Třípísmenná slova přestanou platit a písmeno se mění zhruba každé druhé kolo. Plocha se sotva ukáže a už se míchá.',
  htLevelInsane: 'Všechno najednou a naplno. Plocha se zamíchá téměř hned po posledním tahu.',
  htTouchTitle: 'Dotyková obrazovka',
  htTouchBody:
    'Klepnutím na odkrytý kámen vezmete jeho písmeno. Klepnutím na vzaté písmeno je vrátíte. Dokončit a Smazat jsou pod plochou.',

  plurals: {
    words: { one: '{n} slovo', few: '{n} slova', many: '{n} slova', other: '{n} slov' },
    rounds: { one: '{n} kolo', few: '{n} kola', many: '{n} kola', other: '{n} kol' },
    flips: { one: '{n} tah', few: '{n} tahy', many: '{n} tahu', other: '{n} tahů' },
    ticks: { one: '{n} takt', few: '{n} takty', many: '{n} taktu', other: '{n} taktů' },
    points: { one: '{n} bod', few: '{n} body', many: '{n} bodu', other: '{n} bodů' },
  },
}
