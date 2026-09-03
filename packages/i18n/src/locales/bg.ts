import type { Messages } from '../messages.js'

/**
 * Bulgarian. `ход` for flips, the word a Bulgarian board game uses for a move.
 *
 * Bulgarian is the Slavic language that lost its cases and kept its definite article, so the
 * interface reads with far fewer endings than Russian or Polish here.
 */
export const bg: Messages = {
  tag: 'bg',

  readingDictionary: 'Чете се речникът…',
  noWordList: 'Няма списък с думи за „{language}“. Създайте го:  pnpm dictionary build',
  emptyWordList: 'Списъкът с думи за „{language}“ е празен.',

  flips: 'ходове',
  score: 'точки',
  words: 'думи',
  round: 'рунд',
  ticksLeftLabel: 'Оставащо време в този рунд',
  typeAWord: 'напишете дума',
  tapPrompt: 'докоснете букви, за да ги изберете или върнете, после {action}',

  boardOfTiles: 'Дъска с {n} плочки',
  faceDown: 'с лицето надолу',
  wildCard: 'жокер',
  wildKey: 'която и да е буква',
  letterReplaced: '{from} стана {to}',
  letterSwap: 'СМЯНА НА БУКВИ!',
  spentTile: 'използвана плочка',
  hiddenWhilePaused: 'скрито по време на пауза',
  letterInWord: '{letter}, {position}-та буква от думата',

  completeWord: 'Завърши думата',

  completeShort: 'Готово',
  reset: 'Изчисти',
  pause: 'Пауза',
  resume: 'Продължи',
  newGame: 'Нова игра',
  paused: 'На пауза',
  outOfFlips: 'Свършиха ходовете',
  finalResult: '{score} за {words} в {rounds}',
  playAgain: 'Играй пак',
  share: 'Сподели',
  shareCopied: 'Копирано.',
  shareSelect: 'Копирайте това:',

  lettersSelect: 'буквите избират',
  keysWild: 'взема се, когато напишете буква, която никоя плочка не показва',
  clearsEvery: 'изчиства всички избрани {letter}',
  undoLastLetter: 'върни последната буква',
  noWordsYet: 'Още няма думи.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'вече е намерена',
  reasonTooShort: 'твърде къса',
  reasonNotAWord: 'това не е дума',
  reasonAllFound: 'вече ги имате всички',
  noSuchLetterUp: 'няма отворена {letter}',
  nothingUp: 'нищо не е отворено',
  shuffled: 'разбъркано',
  shuffledAndBilled: 'разбъркано, приспаднати {flips} неизползвани',

  gameLanguage: 'език',
  interfaceLanguage: 'интерфейс',
  dictionarySize: '{common} всекидневни от {full} думи',
  filterLanguages: 'Търсене на език',
  noMatches: 'Няма съвпадения',

  nerdMode: 'режим за запалени',
  rules: 'Правила',
  difficulty: 'трудност',
  difficultyNames: { easy: 'лесна', medium: 'средна', hard: 'трудна', insane: 'безумна' },
  tiles: 'плочки (N)',
  secondsPerTick: 'секунди / такт',
  holdTicks: 'тактове задържане',
  minWord: 'най-къса дума',
  startingFlips: 'начални ходове',
  wildChance: 'шанс за жокер',
  replaceChance: 'шанс за смяна на буква',
  wordCompleteMode: 'при завършена дума',
  wordCompleteNames: { shuffle: 'разбъркай', spend: 'изразходвай', keep: 'запази' },
  flipEconomy: 'връщане на ходове',
  flipEconomyNames: {
    none: 'няма',
    perLetter: 'на буква',
    fibonacci: 'фибоначи',
    overMinimum: 'над минимума',
  },
  repeatedLetterKey: 'клавиш за повторена буква',
  keySchemeNames: { cycle: 'кръг', advance: 'напред' },
  keySchemeHelp: {
    cycle:
      'А взема следващото неизползвано А, а когато всички са в думата, ги изчиства. ' +
      'Shift+А също ги изчиства.',
    advance: 'А взема следващото неизползвано А. Shift+А изчиства всички А от думата.',
  },

  whatThatMeans: 'Какво значи това',
  factRound: 'рунд',
  factWholeBoardUp: 'цялата дъска отворена за',
  factRoundCosts: 'един рунд струва',
  factFlipsBuy: 'началните ходове купуват',
  factThisBoard: 'тази дъска',
  factBoardHadToAdmit: 'дъската трябваше да допусне',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, най-дълга {longest}',
  wordsIncludingOneOf: '{words}, от които една от {ceiling}',
  scorelessRounds: '{rounds} без точки',

  whatAWordPays: 'Какво носи една дума',
  columnLetters: 'букви',
  columnCost: 'цена',
  columnPoints: 'точки',
  columnFlips: 'ходове',
  columnNet: 'разлика',

  canonicalRules: 'Обичайните правила за {difficulty}.',
  customRules: 'Променено спрямо готовите. Резултати по собствени правила не влизат в класация.',
  applyAndStart: 'Приложи и започни нова игра',
  changesNextGame: 'Промените важат от следващата игра.',
  presets: 'Готови настройки:',

  start: 'Започни',
  restart: 'Отначало',
  quit: 'Излез',
  quitTitle: 'Да излезете ли от тази игра?',
  restartTitle: 'Да започнете ли тази игра отначало?',
  restartConfirm: 'Отначало',
  quitConfirm: 'Излез',
  keepPlaying: 'Продължи да играеш',
  personalBest: 'Вашите най-добри игри',
  thisGame: 'тази игра',
  newPersonalBest: 'Нов личен рекорд.',
  columnRank: '#',
  notRanked: 'Собствени правила, затова тази игра не влиза в класация.',
  rankOfTotal: '{rank} от {total}',

  howToPlay: 'Как се играе',

  backToGame: 'Обратно към играта',
  welcomeTitle: 'Добре дошли в Blinkered',
  tutorialSkip: 'Пропусни',
  tutorialNext: 'Напред',
  tutorialBack: 'Назад',
  tutorialStart: 'Започни да играеш',
  tutorialHideAgain: 'Не показвай това пак',
  tutorialProgress: '{n} от {total}',
  tutorialSkipTitle: 'Да пропуснете ли обиколката?',
  tutPickLetters: 'Докосвайте буквите, които искате, по ред, за да съставите дума.',
  tutMoreTurn:
    'Плочките продължават да се обръщат, докато мислите, така че по-добра буква още може да дойде.',
  tutTapBack:
    'Взехте буква, която не искахте? Докоснете я пак и ще се върне. Която и да е, не само последната.',
  tutComplete: 'Натиснете Готово, когато думата е готова.',
  tutControlsTitle: 'Бутоните',
  tutReset: 'Изчисти маха думата, която съставяте. Плочките си остават по местата.',
  tutPause: 'Паузата спира часовника и скрива дъската, за да не служи почивката за учене наизуст.',
  tutRestart: 'Отначало раздава нова дъска от самото начало. Пита първо.',
  tutQuit: 'Излез приключва играта и показва резултата. Пита първо.',
  tutDoneTitle: 'Това е цялата игра',
  tutDoneBody: 'Изберете трудност и играйте. Как се играе е винаги до заглавието.',
  htBoardTitle: 'Дъската',
  htBoardBody:
    'Плочките се обръщат една по една, по реда на четене. От отворените се съставят думи.',
  htWordsTitle: 'Думите',
  htWordsBody: 'Съставете дума от отворените плочки, като пишете или щракате буквите по ред.',
  htFlipsTitle: 'Ходовете',
  htFlipsBody:
    'Всяка обърната плочка струва ход. Завършена дума връща ходове, а по-дългите думи връщат повече. Когато ходовете свършат, играта приключва.',
  htRoundTitle: 'Рундът',
  htRoundBody:
    'Когато се обърне последната плочка от рунда, цялата дъска остава за миг. После плочките се обръщат и разбъркват, и започва нов рунд.',
  htLanguagesTitle: 'Езиците',
  htLanguagesBody:
    '{n} на брой. Всяка дъска може да се реши с думи, които хората наистина използват. Рядка дума също носи точки, ако речникът я знае.',
  htKeysTitle: 'Клавиатурата',
  htWildTitle: 'Жокерите',
  htWildBody:
    'Понякога вместо буква се появява жокер. Жокерът важи за всяка буква, която образува валидна дума. Вече намерена дума не се брои.',
  htSwapTitle: 'Букви, които се менят',
  htSwapBody:
    'Понякога между рундовете една буква се сменя с друга. Ще видите коя си отиде и коя дойде.',
  htLevelsTitle: 'Нивата',
  htLevelEasy:
    'Едни и същи дванадесет букви през цялата игра, така че можете да ги научите и да носите списък с думи в главата си. Плочките се обръщат бавно, а цялата дъска остава видима достатъчно дълго, за да довършите избора.',
  htLevelMedium:
    'От време на време една буква се сменя, така че е по-трудно да помните думи, оставени за после. По-малко време за гледане и по-малко за мислене.',
  htLevelHard:
    'Думите от три букви спират да се броят, а буква се сменя горе-долу през рунд. Дъската едва се показва и вече се разбърква.',
  htLevelInsane:
    'Всичко наведнъж, с пълна скорост. Дъската се разбърква почти веднага след последния ход.',
  htTouchTitle: 'Сензорният екран',
  htTouchBody:
    'Докоснете отворена плочка, за да вземете буквата ѝ. Докоснете взета буква, за да я върнете. Готово и Изчисти са под дъската.',

  plurals: {
    words: { one: '{n} дума', other: '{n} думи' },
    rounds: { one: '{n} рунд', other: '{n} рунда' },
    flips: { one: '{n} ход', other: '{n} хода' },
    ticks: { one: '{n} такт', other: '{n} такта' },
    points: { one: '{n} точка', other: '{n} точки' },
  },
}
