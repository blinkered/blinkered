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

  lettersSelect: 'буквы выбирают',
  clearsEvery: 'снимает все выбранные {letter}',
  undoLastLetter: 'отменяет последнюю букву',
  noWordsYet: 'Слов пока нет.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'уже найдено',
  reasonTooShort: 'слишком короткое',
  reasonNotAWord: 'не слово',
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
  htBoardTitle: 'Поле',
  htBoardBody:
    'Плитки открываются по одной, в порядке чтения. Букву не видно, пока её плитка не перевернётся.',
  htWordsTitle: 'Слова',
  htWordsBody:
    'Составьте слово из открытых плиток. Наберите его или щёлкните по ним. Каждая плитка идёт в дело один раз, и только после того, как открылась.',
  htFlipsTitle: 'Ходы',
  htFlipsBody:
    'Каждая открытая плитка стоит один ход. Слово возвращает ходы, а длинные слова возвращают больше. Когда ходы кончаются, игра заканчивается.',
  htRoundTitle: 'Раунд',
  htRoundBody:
    'Когда открывается последняя плитка раунда, всё поле видно целиком. Оно держится так мгновение. Затем перемешивается и раздаётся заново.',
  htLanguagesTitle: 'Языки',
  htLanguagesBody:
    'Шестнадцать. Любое поле решается обиходными словами. Редкое слово тоже считается, если словарь его знает.',
  htKeysTitle: 'Клавиатура',
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
