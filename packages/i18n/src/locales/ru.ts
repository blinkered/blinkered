import type { Messages } from '../messages.js'

/**
 * Russian. `ходы` for flips, because a `переворот` is four syllables and this is a meter.
 *
 * Four plural forms: one for 1, 21, 31, few for 2 to 4, many for 5 to 20 and for 0, other for
 * fractions. This is the locale that makes hand-written plural logic indefensible.
 */
export const ru: Messages = {
  tag: 'ru',

  readingDictionary: 'Чтение словаря…',
  noWordList: 'Нет списка слов для «{language}». Создайте его:  pnpm dictionary build',
  emptyWordList: 'Список слов для «{language}» пуст.',

  flips: 'ходы',
  score: 'очки',
  words: 'слова',
  round: 'раунд',
  ticksLeftLabel: 'Оставшееся время в раунде',
  typeAWord: 'наберите слово',
  tapPrompt: 'касание: взять или вернуть, затем {action}',

  boardOfTiles: 'Поле из {n} плиток',
  faceDown: 'закрыта',
  wildCard: 'джокер',
  wildKey: 'любая буква',
  letterReplaced: '{from} стала {to}',
  letterSwap: 'ЗАМЕНА БУКВЫ!',
  spentTile: 'использованная плитка',
  hiddenWhilePaused: 'скрыта на паузе',
  letterInWord: '{letter}, буква {position} в слове',

  completeWord: 'Принять слово',
  completeShort: 'Принять',
  reset: 'Сбросить',
  pause: 'Пауза',
  resume: 'Продолжить',
  newGame: 'Новая игра',
  paused: 'Пауза',
  outOfFlips: 'Ходы закончились',
  finalResult: '{score} очков, {words} за {rounds}',
  playAgain: 'Играть снова',
  share: 'Поделиться',
  shareCopied: 'Скопировано.',
  shareSelect: 'Скопируйте это:',

  lettersSelect: 'буквы выбирают',
  keysWild: 'берётся, когда вы набираете букву, которой нет ни на одной плитке',
  clearsEvery: 'снимает все выбранные {letter}',
  undoLastLetter: 'отменяет последнюю букву',
  noWordsYet: 'Слов пока нет.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'уже найдено',
  reasonTooShort: 'слишком короткое',
  reasonNotAWord: 'не слово',
  reasonAllFound: 'они у вас уже все есть',
  noSuchLetterUp: 'нет открытой {letter}',
  nothingUp: 'ничего не открыто',
  shuffled: 'перемешано',
  shuffledAndBilled: 'перемешано, списано {flips} неиспользованных ходов',

  gameLanguage: 'язык',
  interfaceLanguage: 'интерфейс',
  dictionarySize: '{common} частых из {full} слов',

  nerdMode: 'подробный режим',
  rules: 'Правила',
  difficulty: 'сложность',
  difficultyNames: { easy: 'легко', medium: 'средне', hard: 'сложно', insane: 'жестоко' },
  tiles: 'плитки (N)',
  secondsPerTick: 'секунд / такт',
  holdTicks: 'такты удержания',
  minWord: 'мин. слово',
  startingFlips: 'ходов на старте',
  wildChance: 'вероятность джокера',
  replaceChance: 'вероятность замены буквы',
  wordCompleteMode: 'слово готово',
  wordCompleteNames: { shuffle: 'перемешать', spend: 'потратить', keep: 'оставить' },
  flipEconomy: 'экономика ходов',
  flipEconomyNames: {
    none: 'никакая',
    perLetter: 'по букве',
    fibonacci: 'фибоначчи',
    overMinimum: 'сверх минимума',
  },
  repeatedLetterKey: 'клавиша повторной буквы',
  keySchemeNames: { cycle: 'цикл', advance: 'вперёд' },
  keySchemeHelp: {
    cycle:
      'А берёт следующую свободную А, а когда все они в слове, снимает их. ' +
      'Shift+А тоже снимает.',
    advance: 'А берёт следующую свободную А. Shift+А снимает все А из слова.',
  },

  whatThatMeans: 'Что это значит',
  factRound: 'раунд',
  factWholeBoardUp: 'всё поле открыто',
  factRoundCosts: 'раунд стоит',
  factFlipsBuy: 'начальных ходов хватит на',
  factThisBoard: 'это поле',
  factBoardHadToAdmit: 'поле должно было допускать',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, самое длинное {longest}',
  wordsIncludingOneOf: '{words}, включая одно из {ceiling}',
  scorelessRounds: '{rounds} без очков',

  whatAWordPays: 'Что даёт слово',
  columnLetters: 'буквы',
  columnCost: 'цена',
  columnPoints: 'очки',
  columnFlips: 'ходы',
  columnNet: 'итог',

  canonicalRules: 'Стандартные правила: {difficulty}.',
  customRules: 'Изменено от предустановки. Результаты со своими правилами не ранжируются.',
  applyAndStart: 'Применить и начать игру',
  changesNextGame: 'Изменения вступят в силу со следующей игры.',
  presets: 'Предустановки:',

  start: 'Начать',
  restart: 'Заново',
  quit: 'Выйти',
  quitTitle: 'Выйти из этой игры?',
  restartTitle: 'Начать игру заново?',
  restartConfirm: 'Заново',
  quitConfirm: 'Выйти',
  keepPlaying: 'Продолжить',
  personalBest: 'Ваши лучшие игры',
  thisGame: 'эта игра',
  newPersonalBest: 'Новый личный рекорд.',
  columnRank: '№',
  notRanked: 'Свои правила, поэтому игра не ранжируется.',
  rankOfTotal: '{rank} из {total}',

  howToPlay: 'Как играть',

  backToGame: 'Вернуться к игре',
  welcomeTitle: 'Добро пожаловать в Blinkered',
  tutorialSkip: 'Пропустить',
  tutorialNext: 'Далее',
  tutorialBack: 'Назад',
  tutorialStart: 'Начать игру',
  tutorialHideAgain: 'Больше не показывать',
  tutorialProgress: '{n} из {total}',
  tutorialSkipTitle: 'Пропустить знакомство?',
  tutPickLetters: 'Нажимайте нужные буквы по порядку, чтобы составить слово.',
  tutMoreTurn:
    'Пока вы думаете, фишки продолжают открываться, так что может появиться буква получше.',
  tutTapBack:
    'Нажали не ту? Нажмите на неё ещё раз, чтобы вернуть. На любую, не только на последнюю.',
  tutComplete: 'Нажмите «Готово», когда слово собрано.',
  tutControlsTitle: 'Кнопки',
  tutReset: '«Сбросить» очищает слово, которое вы собираете. Фишки остаются на месте.',
  tutPause:
    '«Пауза» останавливает часы и прячет поле, чтобы перерыв нельзя было потратить на его изучение.',
  tutRestart: '«Заново» раздаёт новое поле с начала. Сначала спрашивает.',
  tutQuit: '«Выйти» завершает игру и показывает счёт. Сначала спрашивает.',
  tutDoneTitle: 'Вот и вся игра',
  tutDoneBody: 'Выберите уровень и играйте. Правила всегда есть в заголовке.',
  htBoardTitle: 'Поле',
  htBoardBody:
    'Плитки открываются по одной, в порядке чтения. Из открытых плиток вы составляете слова.',
  htWordsTitle: 'Слова',
  htWordsBody: 'Составьте слово из открытых плиток, набирая или щёлкая буквы по порядку.',
  htFlipsTitle: 'Ходы',
  htFlipsBody:
    'Каждая открытая плитка стоит один ход. Законченное слово возвращает ходы в ваш запас, а длинные слова возвращают больше. Когда ходы кончаются, игра заканчивается.',
  htRoundTitle: 'Раунд',
  htRoundBody:
    'Когда открывается последняя плитка раунда, всё поле на мгновение видно целиком. Затем плитки переворачиваются и перемешиваются, и начинается новый раунд.',
  htLanguagesTitle: 'Языки',
  htLanguagesBody:
    'Шестнадцать. Любое поле решается обиходными словами. Редкое слово тоже считается, если словарь его знает.',
  htKeysTitle: 'Клавиатура',
  htWildTitle: 'Джокеры',
  htWildBody:
    'Иногда вместо буквы появляется джокер. Джокер считается любой буквой, которая складывает допустимое слово. Уже составленное слово не считается.',
  htSwapTitle: 'Буквы меняются',
  htSwapBody:
    'Иногда между раундами одна буква заменяется другой. Вы увидите, какая буква убрана и какая добавлена.',
  htLevelsTitle: 'Уровни',
  htLevelEasy:
    'Одни и те же двенадцать букв всю игру, так что их можно выучить и держать список слов в голове. Плитки открываются медленно, а полное поле остаётся на виду достаточно долго, чтобы спокойно выбрать буквы.',
  htLevelMedium:
    'Время от времени одна буква меняется, и становится труднее удерживать в голове слова, которые вы собирались составить позже. Меньше времени смотреть и меньше думать.',
  htLevelHard:
    'Слова из трёх букв перестают засчитываться, а буква меняется примерно каждый второй раунд. Поле едва успевает показаться, как уже перемешивается.',
  htLevelInsane:
    'Всё сразу и на полной скорости. Поле перемешивается почти сразу после последнего хода.',
  htTouchTitle: 'Сенсорный экран',
  htTouchBody:
    'Коснитесь открытой плитки, чтобы взять её букву. Коснитесь любой взятой буквы, чтобы вернуть её. Принять и Сбросить находятся под доской.',

  plurals: {
    words: { one: '{n} слово', few: '{n} слова', many: '{n} слов', other: '{n} слова' },
    rounds: { one: '{n} раунд', few: '{n} раунда', many: '{n} раундов', other: '{n} раунда' },
    flips: { one: '{n} ход', few: '{n} хода', many: '{n} ходов', other: '{n} хода' },
    ticks: { one: '{n} такт', few: '{n} такта', many: '{n} тактов', other: '{n} такта' },
    points: { one: '{n} очко', few: '{n} очка', many: '{n} очков', other: '{n} очка' },
  },
}
