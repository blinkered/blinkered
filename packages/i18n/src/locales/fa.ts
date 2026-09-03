import type { Messages } from '../messages.js'

/**
 * Persian, which reads right to left. `حرکت` for flips, the word a Persian board game uses for
 * a move.
 *
 * Persian has one plural form for counted nouns and it is the singular: after a number the noun
 * does not take ها, so it is `دو کلمه` and never `دو کلمه‌ها`. Both CLDR forms carry the same
 * string because that is what the language does.
 *
 * Written with the Persian letters throughout — ک and ی, not the Arabic ك and ي — which is the
 * same distinction the alphabet's fold exists to settle.
 */
export const fa: Messages = {
  tag: 'fa',

  readingDictionary: 'در حال خواندن واژه‌نامه…',
  noWordList: 'فهرست واژه‌ای برای «{language}» نیست. یکی بسازید:  pnpm dictionary build',
  emptyWordList: 'فهرست واژه‌های «{language}» خالی است.',

  flips: 'حرکت',
  score: 'امتیاز',
  words: 'واژه‌ها',
  round: 'دور',
  ticksLeftLabel: 'زمان باقی‌مانده در این دور',
  typeAWord: 'واژه‌ای بنویسید',
  tapPrompt: 'روی حرف‌ها بزنید تا انتخاب یا بازگردانید، سپس {action}',

  boardOfTiles: 'تخته‌ای با {n} مهره',
  faceDown: 'رو به پایین',
  wildCard: 'جوکر',
  wildKey: 'هر حرفی',
  letterReplaced: '{from} شد {to}',
  letterSwap: 'تعویض حرف!',
  spentTile: 'مهرهٔ مصرف‌شده',
  hiddenWhilePaused: 'در مکث پنهان است',
  letterInWord: '{letter}، حرف {position} واژه',

  completeWord: 'تکمیل واژه',

  completeShort: 'تکمیل',
  reset: 'پاک کردن',
  pause: 'مکث',
  resume: 'ادامه',
  newGame: 'بازی تازه',
  paused: 'متوقف',
  outOfFlips: 'حرکتی نمانده',
  finalResult: '{score} برای {words} در {rounds}',
  playAgain: 'بازی دوباره',
  share: 'هم‌رسانی',
  shareCopied: 'رونوشت شد.',
  shareSelect: 'این را رونویسی کنید:',

  lettersSelect: 'حرف‌ها انتخاب می‌کنند',
  keysWild: 'وقتی حرفی بنویسید که هیچ مهره‌ای نشان نمی‌دهد، برداشته می‌شود',
  clearsEvery: 'همهٔ {letter}های انتخاب‌شده را پاک می‌کند',
  undoLastLetter: 'واگرد آخرین حرف',
  noWordsYet: 'هنوز واژه‌ای نیست.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'پیش‌تر یافت شده',
  reasonTooShort: 'خیلی کوتاه',
  reasonNotAWord: 'واژه نیست',
  reasonAllFound: 'همه را دارید',
  noSuchLetterUp: 'هیچ {letter} رو نیست',
  nothingUp: 'چیزی رو نیست',
  shuffled: 'برزده شد',
  shuffledAndBilled: 'برزده شد، {flips} استفاده‌نشده کسر شد',

  gameLanguage: 'زبان',
  interfaceLanguage: 'نمایش',
  dictionarySize: '{common} واژهٔ روزمره از {full}',
  filterLanguages: 'جست‌وجوی زبان',
  noMatches: 'چیزی یافت نشد',

  nerdMode: 'حالت حرفه‌ای',
  rules: 'قواعد',
  difficulty: 'سختی',
  difficultyNames: { easy: 'آسان', medium: 'متوسط', hard: 'سخت', insane: 'دیوانه‌وار' },
  tiles: 'مهره‌ها (N)',
  secondsPerTick: 'ثانیه / ضرب',
  holdTicks: 'ضرب‌های مکث',
  minWord: 'کوتاه‌ترین واژه',
  startingFlips: 'حرکت‌های آغازین',
  wildChance: 'شانس جوکر',
  replaceChance: 'شانس تعویض حرف',
  wordCompleteMode: 'پس از تکمیل واژه',
  wordCompleteNames: { shuffle: 'برزدن', spend: 'مصرف', keep: 'نگه‌داشتن' },
  flipEconomy: 'بازگشت حرکت',
  flipEconomyNames: {
    none: 'هیچ',
    perLetter: 'به ازای هر حرف',
    fibonacci: 'فیبوناچی',
    overMinimum: 'بیش از کمینه',
  },
  repeatedLetterKey: 'کلید حرف تکراری',
  keySchemeNames: { cycle: 'چرخه', advance: 'پیشروی' },
  keySchemeHelp: {
    cycle:
      'ا حرف ا بعدی استفاده‌نشده را برمی‌دارد، و وقتی همه در واژه باشند، پاکشان می‌کند. ' +
      'Shift+ا هم پاکشان می‌کند.',
    advance: 'ا حرف ا بعدی استفاده‌نشده را برمی‌دارد. Shift+ا همهٔ اهای واژه را پاک می‌کند.',
  },

  whatThatMeans: 'یعنی چه',
  factRound: 'دور',
  factWholeBoardUp: 'تمام تخته رو به مدت',
  factRoundCosts: 'هر دور می‌ارزد',
  factFlipsBuy: 'حرکت‌های آغازین می‌خرند',
  factThisBoard: 'این تخته',
  factBoardHadToAdmit: 'تخته باید می‌پذیرفت',
  ticksAndSeconds: '{ticks}، {seconds}',
  wordsLongest: '{words}، بلندترین {longest}',
  wordsIncludingOneOf: '{words}، یکی از آن‌ها {ceiling}',
  scorelessRounds: '{rounds} بدون امتیاز',

  whatAWordPays: 'ارزش یک واژه',
  columnLetters: 'حرف‌ها',
  columnCost: 'هزینه',
  columnPoints: 'امتیاز',
  columnFlips: 'حرکت',
  columnNet: 'خالص',

  canonicalRules: 'قواعد استاندارد {difficulty}.',
  customRules: 'از پیش‌فرض تغییر کرده. امتیاز با قواعد دلخواه در رتبه‌بندی نمی‌آید.',
  applyAndStart: 'اعمال و آغاز بازی تازه',
  changesNextGame: 'تغییرها از بازی بعد اعمال می‌شوند.',
  presets: 'پیش‌فرض‌ها:',

  start: 'آغاز',
  restart: 'از نو',
  quit: 'پایان',
  quitTitle: 'این بازی تمام شود؟',
  restartTitle: 'این بازی از نو آغاز شود؟',
  restartConfirm: 'از نو',
  quitConfirm: 'پایان',
  keepPlaying: 'ادامهٔ بازی',
  personalBest: 'بهترین بازی‌های شما',
  thisGame: 'این بازی',
  newPersonalBest: 'رکورد تازهٔ شخصی.',
  columnRank: '#',
  notRanked: 'قواعد دلخواه، پس این بازی رتبه‌بندی نمی‌شود.',
  rankOfTotal: '{rank} از {total}',

  howToPlay: 'چگونه بازی کنیم',

  backToGame: 'بازگشت به بازی',
  welcomeTitle: 'به Blinkered خوش آمدید',
  tutorialSkip: 'رد کردن',
  tutorialNext: 'بعدی',
  tutorialBack: 'قبلی',
  tutorialStart: 'شروع بازی',
  tutorialHideAgain: 'دیگر نشان نده',
  tutorialProgress: '{n} از {total}',
  tutorialSkipTitle: 'معرفی رد شود؟',
  tutPickLetters: 'روی حرف‌های دلخواه به ترتیب بزنید تا واژه‌ای بسازید.',
  tutMoreTurn: 'مهره‌ها تا وقتی فکر می‌کنید رو می‌شوند، پس شاید حرف بهتری در راه باشد.',
  tutTapBack: 'حرفی برداشتید که نمی‌خواستید؟ دوباره رویش بزنید تا برگردد. هر کدام، نه فقط آخری.',
  tutComplete: 'وقتی واژه آماده شد، تکمیل را بزنید.',
  tutControlsTitle: 'دکمه‌ها',
  tutReset: 'پاک کردن واژه‌ای که می‌سازید را برمی‌دارد. مهره‌ها سر جایشان می‌مانند.',
  tutPause: 'مکث ساعت را می‌ایستاند و تخته را پنهان می‌کند، تا استراحت به حفظ کردن آن نگذرد.',
  tutRestart: 'از نو تخته‌ای تازه از ابتدا پخش می‌کند. اول می‌پرسد.',
  tutQuit: 'پایان بازی را تمام می‌کند و امتیاز را نشان می‌دهد. اول می‌پرسد.',
  tutDoneTitle: 'تمام بازی همین است',
  tutDoneBody: 'سطحی برگزینید و بازی کنید. راهنما همیشه کنار عنوان است.',
  htBoardTitle: 'تخته',
  htBoardBody: 'مهره‌ها یکی‌یکی و به ترتیب خواندن رو می‌شوند. با مهره‌های رو واژه ساخته می‌شود.',
  htWordsTitle: 'واژه‌ها',
  htWordsBody: 'با نوشتن یا کلیک بر حرف‌ها به ترتیب، از مهره‌های رو واژه بسازید.',
  htFlipsTitle: 'حرکت‌ها',
  htFlipsBody:
    'هر مهره‌ای که رو شود یک حرکت می‌برد. واژهٔ کامل حرکت برمی‌گرداند، و واژه‌های بلندتر بیشتر. وقتی حرکت‌ها تمام شود، بازی تمام است.',
  htRoundTitle: 'دور',
  htRoundBody:
    'وقتی آخرین مهرهٔ دور رو شود، تمام تخته لحظه‌ای می‌ماند. سپس مهره‌ها برگردانده و برزده می‌شوند و دوری تازه آغاز می‌شود.',
  htLanguagesTitle: 'زبان‌ها',
  htLanguagesBody:
    '{n} زبان. هر تخته با واژه‌هایی که مردم واقعاً به کار می‌برند حل می‌شود. واژهٔ کمیاب هم امتیاز دارد، اگر واژه‌نامه بشناسدش.',
  htKeysTitle: 'صفحه‌کلید',
  htWildTitle: 'جوکرها',
  htWildBody:
    'گاهی به جای حرف، جوکری می‌آید. جوکر به جای هر حرفی که واژهٔ درستی بسازد به شمار می‌آید. واژه‌ای که پیش‌تر ساخته‌اید به شمار نمی‌آید.',
  htSwapTitle: 'حرف‌هایی که عوض می‌شوند',
  htSwapBody: 'گاهی میان دو دور، یک حرف با حرفی دیگر عوض می‌شود. می‌بینید کدام رفت و کدام آمد.',
  htLevelsTitle: 'سطح‌ها',
  htLevelEasy:
    'همان دوازده حرف در تمام بازی، پس می‌توانید یادشان بگیرید و فهرستی از واژه‌ها را در ذهن نگه دارید. مهره‌ها آهسته رو می‌شوند و تمام تخته آن‌قدر می‌ماند که انتخابتان را تمام کنید.',
  htLevelMedium:
    'گاه‌گاهی حرفی عوض می‌شود، پس به یاد سپردن واژه‌هایی که برای بعد کنار گذاشته‌اید سخت‌تر می‌شود. زمان کمتری برای دیدن و کمتری برای اندیشیدن.',
  htLevelHard:
    'واژه‌های سه‌حرفی دیگر به شمار نمی‌آیند و حرفی تقریباً هر دو دور یک بار عوض می‌شود. تخته تازه پیدا شده که برزده می‌شود.',
  htLevelInsane: 'همه با هم و با تمام سرعت. تخته تقریباً بلافاصله پس از آخرین حرکت برزده می‌شود.',
  htTouchTitle: 'صفحهٔ لمسی',
  htTouchBody:
    'روی مهرهٔ رو بزنید تا حرفش را بردارید. روی حرف برداشته بزنید تا بازش گردانید. تکمیل و پاک کردن زیر تخته‌اند.',

  plurals: {
    words: { one: '{n} واژه', other: '{n} واژه' },
    rounds: { one: '{n} دور', other: '{n} دور' },
    flips: { one: '{n} حرکت', other: '{n} حرکت' },
    ticks: { one: '{n} ضرب', other: '{n} ضرب' },
    points: { one: '{n} امتیاز', other: '{n} امتیاز' },
  },
}
