import type { Messages } from '../messages.js'

/**
 * Ukrainian. `хід` for flips, the word a Ukrainian board game uses for a move.
 *
 * Four plural forms on the same pattern as Russian, and `many` is the genitive plural that
 * covers 5 to 20 and everything ending in 5 to 9: `5 слів`, not `5 слова`.
 */
export const uk: Messages = {
  tag: 'uk',

  readingDictionary: 'Читаю словник…',
  noWordList: 'Немає списку слів для «{language}». Створіть його:  pnpm dictionary build',
  emptyWordList: 'Список слів для «{language}» порожній.',

  flips: 'ходи',
  score: 'рахунок',
  words: 'слова',
  round: 'раунд',
  ticksLeftLabel: 'Час, що лишився в цьому раунді',
  typeAWord: 'уведіть слово',
  tapPrompt: 'торкайтеся літер, щоб обрати або повернути, потім {action}',

  boardOfTiles: 'Дошка з {n} фішок',
  faceDown: 'сорочкою догори',
  wildCard: 'джокер',
  wildKey: 'будь-яка літера',
  letterReplaced: '{from} стало {to}',
  letterSwap: 'ЗАМІНА ЛІТЕР!',
  spentTile: 'використана фішка',
  hiddenWhilePaused: 'приховано під час паузи',
  letterInWord: '{letter}, {position}-та літера слова',

  completeWord: 'Завершити слово',

  completeShort: 'Готово',
  reset: 'Очистити',
  pause: 'Пауза',
  resume: 'Продовжити',
  newGame: 'Нова гра',
  paused: 'Призупинено',
  outOfFlips: 'Ходи скінчилися',
  finalResult: '{score} за {words} протягом {rounds}',
  playAgain: 'Зіграти ще раз',
  share: 'Поділитися',
  shareCopied: 'Скопійовано.',
  shareSelect: 'Скопіюйте це:',

  lettersSelect: 'літери обирають',
  keysWild: 'береться, коли ви вводите літеру, якої немає на дошці',
  clearsEvery: 'очищає всі обрані {letter}',
  undoLastLetter: 'скасувати останню літеру',
  noWordsYet: 'Поки що жодного слова.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'уже знайдено',
  reasonTooShort: 'закоротке',
  reasonNotAWord: 'це не слово',
  reasonAllFound: 'у вас уже є всі',
  noSuchLetterUp: 'немає відкритої {letter}',
  nothingUp: 'нічого не відкрито',
  shuffled: 'перемішано',
  shuffledAndBilled: 'перемішано, зараховано {flips} невикористаних',

  gameLanguage: 'мова',
  interfaceLanguage: 'інтерфейс',
  dictionarySize: '{common} щоденних із {full} слів',
  filterLanguages: 'Пошук мови',
  noMatches: 'Нічого не знайдено',

  nerdMode: 'режим для знавців',
  rules: 'Правила',
  difficulty: 'складність',
  difficultyNames: { easy: 'легка', medium: 'середня', hard: 'важка', insane: 'божевільна' },
  tiles: 'фішки (N)',
  secondsPerTick: 'секунди / такт',
  holdTicks: 'такти утримання',
  minWord: 'найкоротше слово',
  startingFlips: 'початкові ходи',
  wildChance: 'шанс джокера',
  replaceChance: 'шанс заміни літери',
  wordCompleteMode: 'коли слово завершено',
  wordCompleteNames: { shuffle: 'перемішати', spend: 'витратити', keep: 'лишити' },
  flipEconomy: 'повернення ходів',
  flipEconomyNames: {
    none: 'немає',
    perLetter: 'за літеру',
    fibonacci: 'фібоначі',
    overMinimum: 'понад мінімум',
  },
  repeatedLetterKey: 'клавіша повтореної літери',
  keySchemeNames: { cycle: 'коло', advance: 'уперед' },
  keySchemeHelp: {
    cycle:
      'А бере наступну невикористану А, а коли всі вони в слові, очищає їх. ' +
      'Shift+А теж їх очищає.',
    advance: 'А бере наступну невикористану А. Shift+А очищає зі слова всі А.',
  },

  whatThatMeans: 'Що це означає',
  factRound: 'раунд',
  factWholeBoardUp: 'уся дошка відкрита на',
  factRoundCosts: 'раунд коштує',
  factFlipsBuy: 'початкові ходи купують',
  factThisBoard: 'ця дошка',
  factBoardHadToAdmit: 'дошка мала допустити',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, найдовше {longest}',
  wordsIncludingOneOf: '{words}, з них одне на {ceiling}',
  scorelessRounds: '{rounds} без очок',

  whatAWordPays: 'Скільки дає слово',
  columnLetters: 'літери',
  columnCost: 'ціна',
  columnPoints: 'очки',
  columnFlips: 'ходи',
  columnNet: 'різниця',

  canonicalRules: 'Звичайні правила для рівня {difficulty}.',
  customRules: 'Змінено від типових. Результати за власними правилами не потрапляють до таблиці.',
  applyAndStart: 'Застосувати й почати нову гру',
  changesNextGame: 'Зміни діятимуть із наступної гри.',
  presets: 'Типові набори:',

  start: 'Почати',
  restart: 'Спочатку',
  quit: 'Вийти',
  quitTitle: 'Вийти з цієї гри?',
  restartTitle: 'Почати цю гру спочатку?',
  restartConfirm: 'Спочатку',
  quitConfirm: 'Вийти',
  keepPlaying: 'Грати далі',
  personalBest: 'Ваші найкращі ігри',
  thisGame: 'ця гра',
  newPersonalBest: 'Новий особистий рекорд.',
  columnRank: '#',
  notRanked: 'Власні правила, тож ця гра не потрапляє до таблиці.',
  rankOfTotal: '{rank} з {total}',

  howToPlay: 'Як грати',

  backToGame: 'Назад до гри',
  welcomeTitle: 'Вітаємо в Blinkered',
  tutorialSkip: 'Пропустити',
  tutorialNext: 'Далі',
  tutorialBack: 'Назад',
  tutorialStart: 'Почати грати',
  tutorialHideAgain: 'Більше не показувати',
  tutorialProgress: '{n} з {total}',
  tutorialSkipTitle: 'Пропустити знайомство?',
  tutPickLetters: 'Торкайтеся потрібних літер по черзі, щоб скласти слово.',
  tutMoreTurn: 'Фішки відкриваються, поки ви думаєте, тож краща літера ще може прийти.',
  tutTapBack:
    'Узяли не ту літеру? Торкніться її ще раз, і вона повернеться. Будь-якої, не лише останньої.',
  tutComplete: 'Коли слово готове, натисніть Готово.',
  tutControlsTitle: 'Кнопки',
  tutReset: 'Очистити прибирає слово, яке ви складаєте. Фішки лишаються на місцях.',
  tutPause: 'Пауза спиняє годинник і ховає дошку, щоб перерва не пішла на її вивчення.',
  tutRestart: 'Спочатку роздає нову дошку з початку. Спершу запитає.',
  tutQuit: 'Вийти завершує гру й показує результат. Спершу запитає.',
  tutDoneTitle: 'Це вся гра',
  tutDoneBody: 'Оберіть складність і грайте. Як грати завжди поруч із назвою.',
  htBoardTitle: 'Дошка',
  htBoardBody: 'Фішки відкриваються по одній, у порядку читання. З відкритих складають слова.',
  htWordsTitle: 'Слова',
  htWordsBody: 'Складіть слово з відкритих фішок, уводячи або клацаючи літери по черзі.',
  htFlipsTitle: 'Ходи',
  htFlipsBody:
    'Кожна відкрита фішка коштує хід. Завершене слово повертає ходи, а довші слова повертають більше. Коли ходи скінчаться, гру завершено.',
  htRoundTitle: 'Раунд',
  htRoundBody:
    'Коли відкриється остання фішка раунду, вся дошка на мить завмирає. Потім фішки перевертають і перемішують, і починається новий раунд.',
  htLanguagesTitle: 'Мови',
  htLanguagesBody:
    'Їх {n}. Кожну дошку можна розв’язати словами, які люди справді вживають. Рідкісне слово теж дає очки, якщо словник його знає.',
  htKeysTitle: 'Клавіатура',
  htWildTitle: 'Джокери',
  htWildBody:
    'Іноді замість літери з’являється джокер. Джокер зараховують як будь-яку літеру, що утворює правильне слово. Уже знайдене слово не рахується.',
  htSwapTitle: 'Літери, що змінюються',
  htSwapBody:
    'Іноді між раундами одну літеру замінюють іншою. Ви побачите, яка зникла і яка з’явилася.',
  htLevelsTitle: 'Рівні',
  htLevelEasy:
    'Ті самі дванадцять літер усю гру, тож їх можна вивчити й тримати список слів у голові. Фішки відкриваються повільно, а вся дошка лишається на очах досить довго, щоб завершити вибір.',
  htLevelMedium:
    'Час від часу літера змінюється, тож важче пам’ятати слова, відкладені на потім. Менше часу дивитися і менше думати.',
  htLevelHard:
    'Слова з трьох літер перестають рахуватися, а літера змінюється приблизно щодругий раунд. Дошка щойно відкрилася — і вже перемішується.',
  htLevelInsane:
    'Усе водночас і на повній швидкості. Дошка перемішується майже одразу після останнього ходу.',
  htTouchTitle: 'Сенсорний екран',
  htTouchBody:
    'Торкніться відкритої фішки, щоб узяти її літеру. Торкніться взятої літери, щоб повернути її. Готово й Очистити — під дошкою.',

  plurals: {
    words: { one: '{n} слово', few: '{n} слова', many: '{n} слів', other: '{n} слова' },
    rounds: { one: '{n} раунд', few: '{n} раунди', many: '{n} раундів', other: '{n} раунду' },
    flips: { one: '{n} хід', few: '{n} ходи', many: '{n} ходів', other: '{n} ходу' },
    ticks: { one: '{n} такт', few: '{n} такти', many: '{n} тактів', other: '{n} такту' },
    points: { one: '{n} очко', few: '{n} очка', many: '{n} очок', other: '{n} очка' },
  },
}
