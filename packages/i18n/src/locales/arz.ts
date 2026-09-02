import type { Messages } from '../messages.js'

/**
 * Egyptian Arabic, written the way it is spoken rather than as Modern Standard Arabic with a
 * different flag. If it read like the `ar` locale there would be no reason for it to exist.
 *
 * So the negation is مش and م…ش rather than ليس and لا, "how" is إزاي, "this" is ده, "very" is
 * أوي, and the present tense takes its بـ. `howToPlay` is إزاي تلعب, which is the sentence an
 * Egyptian would actually write at the top of a rules page.
 *
 * The letters, the folding and the plural agreement are the standard language's, because those
 * are facts about the script and Egyptian shares all of them.
 */
export const arz: Messages = {
  tag: 'arz',

  readingDictionary: 'بيقرا القاموس…',
  noWordList: 'مفيش قايمة كلمات لـ"{language}". اعمل واحدة:  pnpm dictionary build',
  emptyWordList: 'قايمة الكلمات بتاعة "{language}" فاضية.',

  flips: 'نقلات',
  score: 'نقط',
  words: 'كلمات',
  round: 'جولة',
  ticksLeftLabel: 'الوقت الفاضل في الجولة دي',
  typeAWord: 'اكتب كلمة',
  tapPrompt: 'المس الحروف علشان تاخدها أو ترجعها، وبعدين {action}',

  boardOfTiles: 'لوحة من {n} قطعة',
  faceDown: 'مقلوبة',
  wildCard: 'جوكر',
  wildKey: 'أي حرف',
  letterReplaced: '{from} بقى {to}',
  letterSwap: 'الحرف اتغيّر!',
  spentTile: 'قطعة اتستعملت',
  hiddenWhilePaused: 'مخبيّة وانت واقف',
  letterInWord: '{letter}، الحرف {position} في الكلمة',

  completeWord: 'خلّص الكلمة',

  completeShort: 'خلّص',
  reset: 'امسح',
  pause: 'وقّف',
  resume: 'كمّل',
  newGame: 'لعبة جديدة',
  paused: 'واقفة',
  outOfFlips: 'النقلات خلصت',
  finalResult: '{score} من {words} على مدار {rounds}',
  playAgain: 'العب تاني',
  share: 'شارك',
  shareCopied: 'اتنسخت.',
  shareSelect: 'انسخ ده:',

  lettersSelect: 'الحروف بتختار',
  keysWild: 'بيتاخد لما تكتب حرف مش موجود على أي قطعة',
  clearsEvery: 'بيمسح كل حروف {letter} اللي اخترتها',
  undoLastLetter: 'رجّع آخر حرف',
  noWordsYet: 'لسه مفيش كلمات.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'لقيتها قبل كده',
  reasonTooShort: 'قصيرة أوي',
  reasonNotAWord: 'مش كلمة',
  reasonAllFound: 'معاك كلهم خلاص',
  noSuchLetterUp: 'مفيش {letter} مكشوف',
  nothingUp: 'مش مكشوفة',
  shuffled: 'اتخلطت',
  shuffledAndBilled: 'اتخلطت، واتحسب عليك {flips} ماستعملتهاش',

  gameLanguage: 'اللغة',
  interfaceLanguage: 'الشاشة',
  dictionarySize: '{common} كلمة على السنة الناس من {full}',

  nerdMode: 'وضع الخبراء',
  rules: 'القواعد',
  difficulty: 'الصعوبة',
  difficultyNames: { easy: 'سهل', medium: 'متوسط', hard: 'صعب', insane: 'جنان' },
  tiles: 'قطع (N)',
  secondsPerTick: 'ثانية / نبضة',
  holdTicks: 'نبضات الاستنى',
  minWord: 'أقصر كلمة',
  startingFlips: 'نقلات البداية',
  wildChance: 'احتمال الجوكر',
  replaceChance: 'احتمال تغيير الحرف',
  wordCompleteMode: 'لما الكلمة تخلص',
  wordCompleteNames: { shuffle: 'اخلط', spend: 'استعمل', keep: 'سيب' },
  flipEconomy: 'حساب النقلات',
  flipEconomyNames: {
    none: 'مفيش',
    perLetter: 'لكل حرف',
    fibonacci: 'فيبوناتشي',
    overMinimum: 'فوق الحد الأدنى',
  },
  repeatedLetterKey: 'زرار الحرف المتكرر',
  keySchemeNames: { cycle: 'دوري', advance: 'قدّام' },
  keySchemeHelp: {
    cycle:
      'الحرف أ بياخد أ اللي بعدها من اللي لسه مااستعملتش، ولما يدخلوا كلهم في الكلمة بيمسحهم. ' +
      'وShift+أ بيمسحهم برضه.',
    advance: 'الحرف أ بياخد أ اللي بعدها من اللي لسه مااستعملتش. وShift+أ بيمسح كل أ في الكلمة.',
  },

  whatThatMeans: 'يعني إيه',
  factRound: 'جولة',
  factWholeBoardUp: 'اللوحة كلها مكشوفة لمدة',
  factRoundCosts: 'الجولة بتكلّف',
  factFlipsBuy: 'نقلات البداية بتشتري',
  factThisBoard: 'اللوحة دي',
  factBoardHadToAdmit: 'اللوحة كان لازم تقبل',
  ticksAndSeconds: '{ticks}، {seconds}',
  wordsLongest: '{words}، أطولها {longest}',
  wordsIncludingOneOf: '{words} فيهم واحدة من {ceiling}',
  scorelessRounds: '{rounds} من غير نقط',

  whatAWordPays: 'الكلمة بتجيب كام',
  columnLetters: 'الحروف',
  columnCost: 'التكلفة',
  columnPoints: 'النقط',
  columnFlips: 'النقلات',
  columnNet: 'الصافي',

  canonicalRules: 'قواعد {difficulty} العادية.',
  customRules: 'اتغيّرت عن الإعداد. النقط بقواعدك انت مش هتتحسب في الترتيب.',
  applyAndStart: 'طبّق وابدأ لعبة جديدة',
  changesNextGame: 'التغييرات هتشتغل في اللعبة الجاية.',
  presets: 'الإعدادات:',

  start: 'ابدأ',
  restart: 'ابدأ من الأول',
  quit: 'اخرج',
  quitTitle: 'تخرج من اللعبة دي؟',
  restartTitle: 'تبدأ اللعبة دي من الأول؟',
  restartConfirm: 'من الأول',
  quitConfirm: 'اخرج',
  keepPlaying: 'كمّل لعب',
  personalBest: 'أحسن لعبات ليك',
  thisGame: 'اللعبة دي',
  newPersonalBest: 'رقم شخصي جديد.',
  columnRank: '#',
  notRanked: 'قواعد بتاعتك انت، فاللعبة دي مش هتتحسب في الترتيب.',
  rankOfTotal: '{rank} من {total}',

  howToPlay: 'إزاي تلعب',

  backToGame: 'ارجع للعبة',
  welcomeTitle: 'أهلاً بيك في Blinkered',
  tutorialSkip: 'عدّي',
  tutorialNext: 'التالي',
  tutorialBack: 'رجوع',
  tutorialStart: 'ابدأ اللعب',
  tutorialHideAgain: 'متعرضش ده تاني',
  tutorialProgress: '{n} من {total}',
  tutorialSkipTitle: 'تعدّي الشرح؟',
  tutPickLetters: 'المس الحروف اللي عايزها، بالترتيب، علشان تعمل كلمة.',
  tutMoreTurn: 'القطع بتفضل تتكشف وانت بتفكر، يمكن ييجي حرف أحسن.',
  tutTapBack: 'لمست واحدة مش عايزها؟ المسها تاني ترجعلك. أي واحدة، مش الأخيرة بس.',
  tutComplete: 'اضغط خلّص لما الكلمة تبقى جاهزة.',
  tutControlsTitle: 'الزراير',
  tutReset: 'زرار امسح بيمسح الكلمة اللي بتعملها. والقطع بتفضل مكانها.',
  tutPause: 'زرار وقّف بيوقّف الساعة ويخبي اللوحة، علشان الاستراحة ماتتستعملش في حفظها.',
  tutRestart: 'زرار ابدأ من الأول بيوزّع لوحة جديدة من أولها. وبيسأل الأول.',
  tutQuit: 'زرار اخرج بينهي اللعبة ويوريك جبت كام. وبيسأل الأول.',
  tutDoneTitle: 'دي اللعبة كلها',
  tutDoneBody: 'اختار مستوى والعب. إزاي تلعب موجودة دايماً فوق لو عايزها تاني.',
  htBoardTitle: 'اللوحة',
  htBoardBody: 'القطع بتتكشف واحدة ورا التانية، بترتيب القراية. ومن القطع المكشوفة بتعمل كلمات.',
  htWordsTitle: 'الكلمات',
  htWordsBody: 'اعمل كلمة من القطع المكشوفة وانت بتكتب الحروف أو بتدوس عليها بالترتيب.',
  htFlipsTitle: 'النقلات',
  htFlipsBody:
    'كل قطعة بتتكشف بتكلّف نقلة. والكلمة اللي بتخلص بترجعلك نقلات، والكلمات الطويلة بتدفع أكتر. ولما النقلات تخلص اللعبة تخلص.',
  htRoundTitle: 'الجولة',
  htRoundBody:
    'لما آخر قطعة في الجولة تتكشف، اللوحة كلها بتفضل مكشوفة لحظة. وبعدين القطع بتتقلب وتتخلط، وتبدأ جولة جديدة.',
  htLanguagesTitle: 'اللغات',
  htLanguagesBody:
    '{n} لغة. أي لوحة تقدر تحلها بكلمات الناس بتقولها فعلاً. والكلمة الغريبة بتجيب نقط برضه، لو القاموس يعرفها.',
  htKeysTitle: 'الكيبورد',
  htWildTitle: 'الجوكر',
  htWildBody:
    'ساعات بيطلع جوكر بدل الحرف. والجوكر بيتحسب أي حرف يعمل كلمة صح. أما الكلمة اللي خلصتها قبل كده فمش بتتحسب.',
  htSwapTitle: 'الحروف اللي بتتغيّر',
  htSwapBody: 'ساعات، بين الجولات، حرف بيتغيّر بحرف تاني. وهتشوف أنهي حرف راح وأنهي حرف جه.',
  htLevelsTitle: 'المستويات',
  htLevelEasy:
    'نفس الاتناشر حرف طول اللعبة، يعني تقدر تحفظهم وتشيل قايمة كلمات في دماغك. القطع بتتكشف بالراحة، واللوحة الكاملة بتفضل باينة مدة تكفي علشان تخلص اختيار حروفك.',
  htLevelMedium:
    'كل شوية حرف بيتغيّر، فبيبقى أصعب تفتكر كلمات كنت ناوي تلعبها بعدين. وقت أقل للنظر وأقل للتفكير.',
  htLevelHard:
    'كلمات التلات حروف مابقتش تتحسب، والحرف بيتغيّر كل جولتين تقريباً. اللوحة تقريباً ماتتكشفش وتتخلط.',
  htLevelInsane: 'كل حاجة مع بعض، بأقصى سرعة. اللوحة بتتخلط بعد آخر نقلة على طول.',
  htTouchTitle: 'شاشة اللمس',
  htTouchBody:
    'المس قطعة مكشوفة تاخد حرفها. والمس أي حرف خدته يرجعلك. وزراير خلّص وامسح تحت اللوحة.',

  plurals: {
    words: {
      zero: '{n} كلمة',
      one: '{n} كلمة',
      two: '{n} كلمتين',
      few: '{n} كلمات',
      many: '{n} كلمة',
      other: '{n} كلمة',
    },
    rounds: {
      zero: '{n} جولة',
      one: '{n} جولة',
      two: '{n} جولتين',
      few: '{n} جولات',
      many: '{n} جولة',
      other: '{n} جولة',
    },
    flips: {
      zero: '{n} نقلة',
      one: '{n} نقلة',
      two: '{n} نقلتين',
      few: '{n} نقلات',
      many: '{n} نقلة',
      other: '{n} نقلة',
    },
    ticks: {
      zero: '{n} نبضة',
      one: '{n} نبضة',
      two: '{n} نبضتين',
      few: '{n} نبضات',
      many: '{n} نبضة',
      other: '{n} نبضة',
    },
    points: {
      zero: '{n} نقطة',
      one: '{n} نقطة',
      two: '{n} نقطتين',
      few: '{n} نقط',
      many: '{n} نقطة',
      other: '{n} نقطة',
    },
  },
}
