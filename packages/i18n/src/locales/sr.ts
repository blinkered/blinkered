import type { Messages } from '../messages.js'

/**
 * Serbian, in Cyrillic. `потез` for flips, the word a Serbian board game uses for a move.
 *
 * Serbian is written in two alphabets and this is the official one. The Latin spelling is the
 * same words letter for letter, so it would be a second language here rather than a second
 * spelling of this one.
 */
export const sr: Messages = {
  tag: 'sr',

  readingDictionary: 'Читам речник…',
  noWordList: 'Нема списка речи за „{language}“. Направите га:  pnpm dictionary build',
  emptyWordList: 'Списак речи за „{language}“ је празан.',

  flips: 'потези',
  score: 'резултат',
  words: 'речи',
  round: 'рунда',
  ticksLeftLabel: 'Преостало време у овој рунди',
  typeAWord: 'укуцајте реч',
  tapPrompt: 'додирните слова да их изаберете или вратите, па {action}',

  boardOfTiles: 'Табла од {n} плочица',
  faceDown: 'окренуто наопако',
  wildCard: 'џокер',
  wildKey: 'било које слово',
  letterReplaced: '{from} је постало {to}',
  letterSwap: 'ЗАМЕНА СЛОВА!',
  spentTile: 'искоришћена плочица',
  hiddenWhilePaused: 'скривено током паузе',
  letterInWord: '{letter}, {position}. слово речи',

  completeWord: 'Заврши реч',

  completeShort: 'Заврши',
  reset: 'Обриши',
  pause: 'Пауза',
  resume: 'Настави',
  newGame: 'Нова игра',
  paused: 'Паузирано',
  outOfFlips: 'Нестало потеза',
  finalResult: '{score} за {words} кроз {rounds}',
  playAgain: 'Играј поново',
  share: 'Подели',
  shareCopied: 'Копирано.',
  shareSelect: 'Копирајте ово:',

  lettersSelect: 'слова бирају',
  keysWild: 'узима се када укуцате слово које ниједна плочица не показује',
  clearsEvery: 'брише сва изабрана {letter}',
  undoLastLetter: 'поништи последње слово',
  noWordsYet: 'Још ниједна реч.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'већ пронађено',
  reasonTooShort: 'прекратко',
  reasonNotAWord: 'то није реч',
  reasonAllFound: 'већ их имате све',
  noSuchLetterUp: 'нема откривеног {letter}',
  nothingUp: 'ништа није откривено',
  shuffled: 'промешано',
  shuffledAndBilled: 'промешано, наплаћено {flips} неискоришћених',

  gameLanguage: 'језик',
  interfaceLanguage: 'сучеље',
  dictionarySize: '{common} свакодневних од {full} речи',
  filterLanguages: 'Тражи језик',
  noMatches: 'Нема поклапања',

  nerdMode: 'режим за зналце',
  rules: 'Правила',
  difficulty: 'тежина',
  difficultyNames: { easy: 'лака', medium: 'средња', hard: 'тешка', insane: 'луда' },
  tiles: 'плочице (N)',
  secondsPerTick: 'секунде / такт',
  holdTicks: 'тактови задржавања',
  minWord: 'најкраћа реч',
  startingFlips: 'почетни потези',
  wildChance: 'шанса за џокера',
  replaceChance: 'шанса за замену слова',
  wordCompleteMode: 'када је реч готова',
  wordCompleteNames: { shuffle: 'промешај', spend: 'потроши', keep: 'задржи' },
  flipEconomy: 'повраћај потеза',
  flipEconomyNames: {
    none: 'нема',
    perLetter: 'по слову',
    fibonacci: 'фибоначи',
    overMinimum: 'преко минимума',
  },
  repeatedLetterKey: 'тастер поновљеног слова',
  keySchemeNames: { cycle: 'круг', advance: 'напред' },
  keySchemeHelp: {
    cycle:
      'А узима следеће неискоришћено А, а када су сва у речи, брише их. ' +
      'Shift+А их такође брише.',
    advance: 'А узима следеће неискоришћено А. Shift+А брише из речи сва А.',
  },

  whatThatMeans: 'Шта то значи',
  factRound: 'рунда',
  factWholeBoardUp: 'цела табла откривена',
  factRoundCosts: 'рунда кошта',
  factFlipsBuy: 'почетни потези купују',
  factThisBoard: 'ова табла',
  factBoardHadToAdmit: 'табла је морала да прими',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, најдужа {longest}',
  wordsIncludingOneOf: '{words}, од тога једна од {ceiling}',
  scorelessRounds: '{rounds} без поена',

  whatAWordPays: 'Шта доноси реч',
  columnLetters: 'слова',
  columnCost: 'цена',
  columnPoints: 'поени',
  columnFlips: 'потези',
  columnNet: 'разлика',

  canonicalRules: 'Уобичајена правила за {difficulty}.',
  customRules: 'Измењено у односу на подешено. Резултати по сопственим правилима се не рангирају.',
  applyAndStart: 'Примени и почни нову игру',
  changesNextGame: 'Измене важе од следеће игре.',
  presets: 'Подешавања:',

  start: 'Почни',
  restart: 'Испочетка',
  quit: 'Заврши',
  quitTitle: 'Завршити ову игру?',
  restartTitle: 'Почети ову игру испочетка?',
  restartConfirm: 'Испочетка',
  quitConfirm: 'Заврши',
  keepPlaying: 'Настави да играш',
  personalBest: 'Ваше најбоље игре',
  thisGame: 'ова игра',
  newPersonalBest: 'Нов лични рекорд.',
  columnRank: '#',
  notRanked: 'Сопствена правила, па се ова игра не рангира.',
  rankOfTotal: '{rank} од {total}',

  howToPlay: 'Како се игра',

  backToGame: 'Назад на игру',
  welcomeTitle: 'Добро дошли у Blinkered',
  tutorialSkip: 'Прескочи',
  tutorialNext: 'Даље',
  tutorialBack: 'Назад',
  tutorialStart: 'Почни да играш',
  tutorialHideAgain: 'Не приказуј ово поново',
  tutorialProgress: '{n} од {total}',
  tutorialSkipTitle: 'Прескочити упознавање?',
  tutPickLetters: 'Додирујте слова која желите, редом, да саставите реч.',
  tutMoreTurn: 'Плочице се окрећу и док размишљате, па боље слово можда тек долази.',
  tutTapBack:
    'Узели сте слово које нисте желели? Додирните га поново и вратиће се. Било које, не само последње.',
  tutComplete: 'Када је реч спремна, притисните Заврши.',
  tutControlsTitle: 'Дугмад',
  tutReset: 'Обриши брише реч коју састављате. Плочице остају где су.',
  tutPause: 'Пауза зауставља сат и скрива таблу, да пауза не послужи за њено учење.',
  tutRestart: 'Испочетка дели нову таблу од почетка. Прво пита.',
  tutQuit: 'Заврши завршава игру и показује резултат. Прво пита.',
  tutDoneTitle: 'То је цела игра',
  tutDoneBody: 'Изаберите тежину и играјте. Како се игра увек стоји уз наслов.',
  htBoardTitle: 'Табла',
  htBoardBody:
    'Плочице се откривају једна по једна, редом читања. Од откривених се састављају речи.',
  htWordsTitle: 'Речи',
  htWordsBody: 'Саставите реч од откривених плочица куцањем или кликом на слова редом.',
  htFlipsTitle: 'Потези',
  htFlipsBody:
    'Свака откривена плочица кошта потез. Завршена реч враћа потезе, а дуже речи враћају више. Када потези нестану, игра је готова.',
  htRoundTitle: 'Рунда',
  htRoundBody:
    'Када се открије последња плочица рунде, цела табла на тренутак стоји. Затим се плочице окрећу и мешају, и почиње нова рунда.',
  htLanguagesTitle: 'Језици',
  htLanguagesBody:
    'Има их {n}. Свака табла се може решити речима које људи стварно користе. Ретка реч такође доноси поене, ако је речник зна.',
  htKeysTitle: 'Тастатура',
  htWildTitle: 'Џокери',
  htWildBody:
    'Понекад се уместо слова појави џокер. Џокер важи као било које слово које чини исправну реч. Већ завршена реч се не рачуна.',
  htSwapTitle: 'Слова која се мењају',
  htSwapBody:
    'Понекад се између рунди једно слово замени другим. Видећете које је отишло и које је дошло.',
  htLevelsTitle: 'Нивои',
  htLevelEasy:
    'Истих дванаест слова целу игру, па се могу научити и носити списак речи у глави. Плочице се откривају споро, а цела табла остаје видљива довољно дуго да завршите избор.',
  htLevelMedium:
    'С времена на време слово се промени, па је теже памтити речи остављене за касније. Мање времена за гледање и мање за размишљање.',
  htLevelHard:
    'Речи од три слова престају да се рачунају, а слово се мења отприлике сваку другу рунду. Табла једва да се покаже, а већ се меша.',
  htLevelInsane: 'Све одједном и пуном брзином. Табла се меша готово одмах после последњег потеза.',
  htTouchTitle: 'Екран на додир',
  htTouchBody:
    'Додирните откривену плочицу да узмете њено слово. Додирните узето слово да га вратите. Заврши и Обриши су испод табле.',

  plurals: {
    words: { one: '{n} реч', few: '{n} речи', other: '{n} речи' },
    rounds: { one: '{n} рунда', few: '{n} рунде', other: '{n} рунди' },
    flips: { one: '{n} потез', few: '{n} потеза', other: '{n} потеза' },
    ticks: { one: '{n} такт', few: '{n} такта', other: '{n} тактова' },
    points: { one: '{n} поен', few: '{n} поена', other: '{n} поена' },
  },
}
