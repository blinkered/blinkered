import type { Messages } from '../messages.js'

/**
 * Macedonian. `потег` for flips, the word a Macedonian board game uses for a move.
 *
 * Macedonian, like Bulgarian, has no cases and a postposed article, so the interface reads with
 * far fewer endings than the other Slavic languages here.
 */
export const mk: Messages = {
  tag: 'mk',

  readingDictionary: 'Го читам речникот…',
  noWordList: 'Нема список со зборови за „{language}“. Направете го:  pnpm dictionary build',
  emptyWordList: 'Списокот со зборови за „{language}“ е празен.',

  flips: 'потези',
  score: 'резултат',
  words: 'зборови',
  round: 'рунда',
  ticksLeftLabel: 'Преостанато време во оваа рунда',
  typeAWord: 'напишете збор',
  tapPrompt: 'допрете букви за да ги изберете или вратите, потоа {action}',

  boardOfTiles: 'Табла со {n} плочки',
  faceDown: 'свртено надолу',
  wildCard: 'џокер',
  wildKey: 'која било буква',
  letterReplaced: '{from} стана {to}',
  letterSwap: 'ЗАМЕНА НА БУКВИ!',
  spentTile: 'искористена плочка',
  hiddenWhilePaused: 'скриено додека е паузирано',
  letterInWord: '{letter}, {position}-та буква од зборот',

  completeWord: 'Заврши го зборот',

  completeShort: 'Заврши',
  reset: 'Исчисти',
  pause: 'Пауза',
  resume: 'Продолжи',
  newGame: 'Нова игра',
  paused: 'Паузирано',
  outOfFlips: 'Снема потези',
  finalResult: '{score} за {words} во {rounds}',
  playAgain: 'Играј повторно',
  share: 'Сподели',
  shareCopied: 'Копирано.',
  shareSelect: 'Копирајте го ова:',

  lettersSelect: 'буквите избираат',
  keysWild: 'се зема кога ќе напишете буква што ниту една плочка не ја покажува',
  clearsEvery: 'ги чисти сите избрани {letter}',
  undoLastLetter: 'врати ја последната буква',
  noWordsYet: 'Сè уште нема зборови.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'веќе е најден',
  reasonTooShort: 'премногу краток',
  reasonNotAWord: 'тоа не е збор',
  reasonAllFound: 'веќе ги имате сите',
  noSuchLetterUp: 'нема откриено {letter}',
  nothingUp: 'ништо не е откриено',
  shuffled: 'промешано',
  shuffledAndBilled: 'промешано, одбиени {flips} неискористени',

  gameLanguage: 'јазик',
  interfaceLanguage: 'изглед',
  dictionarySize: '{common} секојдневни од {full} зборови',
  filterLanguages: 'Барај јазик',
  noMatches: 'Нема совпаѓања',

  nerdMode: 'режим за познавачи',
  rules: 'Правила',
  difficulty: 'тежина',
  difficultyNames: { easy: 'лесна', medium: 'средна', hard: 'тешка', insane: 'луда' },
  tiles: 'плочки (N)',
  secondsPerTick: 'секунди / такт',
  holdTicks: 'тактови задржување',
  minWord: 'најкраток збор',
  startingFlips: 'почетни потези',
  wildChance: 'шанса за џокер',
  replaceChance: 'шанса за замена на буква',
  wordCompleteMode: 'кога зборот е завршен',
  wordCompleteNames: { shuffle: 'промешај', spend: 'потроши', keep: 'задржи' },
  flipEconomy: 'враќање потези',
  flipEconomyNames: {
    none: 'нема',
    perLetter: 'по буква',
    fibonacci: 'фибоначи',
    overMinimum: 'над минимумот',
  },
  repeatedLetterKey: 'копче за повторена буква',
  keySchemeNames: { cycle: 'круг', advance: 'напред' },
  keySchemeHelp: {
    cycle:
      'А го зема следното неискористено А, а кога сите се во зборот, ги чисти. ' +
      'Shift+А исто така ги чисти.',
    advance: 'А го зема следното неискористено А. Shift+А ги чисти сите А од зборот.',
  },

  whatThatMeans: 'Што значи тоа',
  factRound: 'рунда',
  factWholeBoardUp: 'целата табла откриена',
  factRoundCosts: 'една рунда чини',
  factFlipsBuy: 'почетните потези купуваат',
  factThisBoard: 'оваа табла',
  factBoardHadToAdmit: 'таблата мораше да прими',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, најдолг {longest}',
  wordsIncludingOneOf: '{words}, од кои еден од {ceiling}',
  scorelessRounds: '{rounds} без поени',

  whatAWordPays: 'Што носи еден збор',
  columnLetters: 'букви',
  columnCost: 'цена',
  columnPoints: 'поени',
  columnFlips: 'потези',
  columnNet: 'разлика',

  canonicalRules: 'Вообичаени правила за {difficulty}.',
  customRules:
    'Изменето од поставеното. Резултати по сопствени правила не влегуваат во ранг-листа.',
  applyAndStart: 'Примени и почни нова игра',
  changesNextGame: 'Промените важат од следната игра.',
  presets: 'Поставки:',

  start: 'Почни',
  restart: 'Од почеток',
  quit: 'Излези',
  quitTitle: 'Да излезете од оваа игра?',
  restartTitle: 'Да ја почнете оваа игра од почеток?',
  restartConfirm: 'Од почеток',
  quitConfirm: 'Излези',
  keepPlaying: 'Продолжи да играш',
  personalBest: 'Вашите најдобри игри',
  thisGame: 'оваа игра',
  newPersonalBest: 'Нов личен рекорд.',
  columnRank: '#',
  notRanked: 'Сопствени правила, па оваа игра не влегува во ранг-листа.',
  rankOfTotal: '{rank} од {total}',

  howToPlay: 'Како се игра',

  backToGame: 'Назад кон играта',
  welcomeTitle: 'Добредојдовте во Blinkered',
  tutorialSkip: 'Прескокни',
  tutorialNext: 'Натаму',
  tutorialBack: 'Назад',
  tutorialStart: 'Почни да играш',
  tutorialHideAgain: 'Не покажувај го ова повторно',
  tutorialProgress: '{n} од {total}',
  tutorialSkipTitle: 'Да го прескокнете запознавањето?',
  tutPickLetters: 'Допирајте ги буквите што ги сакате, по ред, за да составите збор.',
  tutMoreTurn:
    'Плочките продолжуваат да се вртат додека размислувате, па подобра буква сè уште може да дојде.',
  tutTapBack:
    'Зедовте буква што не ја сакавте? Допрете ја пак и ќе се врати. Која било, не само последната.',
  tutComplete: 'Кога зборот е готов, притиснете Заврши.',
  tutControlsTitle: 'Копчињата',
  tutReset: 'Исчисти го брише зборот што го составувате. Плочките остануваат каде што се.',
  tutPause: 'Паузата го сопира часовникот и ја крие таблата, за паузата да не послужи за учење.',
  tutRestart: 'Од почеток дели нова табла од самиот почеток. Прво прашува.',
  tutQuit: 'Излези ја завршува играта и го покажува резултатот. Прво прашува.',
  tutDoneTitle: 'Тоа е целата игра',
  tutDoneBody: 'Изберете тежина и играјте. Како се игра е секогаш до насловот.',
  htBoardTitle: 'Таблата',
  htBoardBody:
    'Плочките се откриваат една по една, по редот на читање. Од откриените се составуваат зборови.',
  htWordsTitle: 'Зборовите',
  htWordsBody: 'Составете збор од откриените плочки со пишување или кликање на буквите по ред.',
  htFlipsTitle: 'Потезите',
  htFlipsBody:
    'Секоја откриена плочка чини потег. Завршен збор враќа потези, а подолгите зборови враќаат повеќе. Кога потезите ќе снемаат, играта е готова.',
  htRoundTitle: 'Рундата',
  htRoundBody:
    'Кога ќе се открие последната плочка од рундата, целата табла застанува за миг. Потоа плочките се вртат и се мешаат, и почнува нова рунда.',
  htLanguagesTitle: 'Јазиците',
  htLanguagesBody:
    'Ги има {n}. Секоја табла може да се реши со зборови што луѓето навистина ги користат. Редок збор исто така носи поени, ако речникот го знае.',
  htKeysTitle: 'Тастатурата',
  htWildTitle: 'Џокерите',
  htWildBody:
    'Понекогаш наместо буква се појавува џокер. Џокерот важи за која било буква што прави исправен збор. Веќе најден збор не се брои.',
  htSwapTitle: 'Букви што се менуваат',
  htSwapBody:
    'Понекогаш меѓу рундите една буква се заменува со друга. Ќе видите која си отиде и која дојде.',
  htLevelsTitle: 'Нивоата',
  htLevelEasy:
    'Истите дванаесет букви цела игра, па можете да ги научите и да носите список зборови во главата. Плочките се откриваат бавно, а целата табла останува видлива доволно долго за да го довршите изборот.',
  htLevelMedium:
    'Одвреме-навреме една буква се менува, па потешко е да се памтат зборови оставени за подоцна. Помалку време за гледање и помалку за размислување.',
  htLevelHard:
    'Зборовите од три букви престануваат да се бројат, а буква се менува околу секоја втора рунда. Таблата едвај се покажува, а веќе се меша.',
  htLevelInsane: 'Сè одеднаш и со полна брзина. Таблата се меша речиси веднаш по последниот потег.',
  htTouchTitle: 'Екранот на допир',
  htTouchBody:
    'Допрете откриена плочка за да ја земете нејзината буква. Допрете земена буква за да ја вратите. Заврши и Исчисти се под таблата.',

  plurals: {
    words: { one: '{n} збор', other: '{n} зборови' },
    rounds: { one: '{n} рунда', other: '{n} рунди' },
    flips: { one: '{n} потег', other: '{n} потези' },
    ticks: { one: '{n} такт', other: '{n} тактови' },
    points: { one: '{n} поен', other: '{n} поени' },
  },
}
