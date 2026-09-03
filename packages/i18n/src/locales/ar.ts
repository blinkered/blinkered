import type { Messages } from '../messages.js'

/**
 * Arabic. `نقلات` for flips, the move you spend, which is the shape Dutch set with `zetten`.
 * `قطع` for tiles and `لوحة` for the board.
 *
 * Written without harakat, as the tiles are and as ordinary Arabic prose is: the short vowels
 * are marks rather than letters, the alphabet strips them, and a vowelled interface over an
 * unvowelled board would be two spellings of the same game.
 *
 * The only locale using more than three plural forms. Arabic agrees a counted noun six
 * different ways and CLDR names all six, so they are all here: the dual for two, the sound
 * plural for three to ten, and the singular again from eleven up, which looks like a mistake
 * and is the rule.
 */
export const ar: Messages = {
  tag: 'ar',

  readingDictionary: 'جارٍ قراءة القاموس…',
  noWordList: 'لا توجد قائمة كلمات لـ"{language}". أنشئ واحدة:  pnpm dictionary build',
  emptyWordList: 'قائمة الكلمات لـ"{language}" فارغة.',

  flips: 'نقلات',
  score: 'نقاط',
  words: 'كلمات',
  round: 'جولة',
  ticksLeftLabel: 'الوقت المتبقي في هذه الجولة',
  typeAWord: 'اكتب كلمة',
  tapPrompt: 'المس الحروف لأخذها أو إعادتها، ثم {action}',

  boardOfTiles: 'لوحة من {n} قطعة',
  faceDown: 'مقلوبة',
  wildCard: 'جوكر',
  wildKey: 'أي حرف',
  letterReplaced: 'صار {from} هو {to}',
  letterSwap: 'تبدّل حرف!',
  spentTile: 'قطعة مستهلكة',
  hiddenWhilePaused: 'مخفية أثناء الإيقاف',
  letterInWord: '{letter}، الحرف {position} من الكلمة',

  completeWord: 'أكمل الكلمة',

  completeShort: 'أكمل',
  reset: 'امسح',
  pause: 'إيقاف مؤقت',
  resume: 'متابعة',
  newGame: 'لعبة جديدة',
  paused: 'متوقفة مؤقتًا',
  outOfFlips: 'نفدت النقلات',
  finalResult: '{score} نقطة من {words} خلال {rounds}',
  playAgain: 'العب مرة أخرى',
  share: 'شارك',
  shareCopied: 'تم النسخ.',
  shareSelect: 'انسخ هذا:',

  lettersSelect: 'الحروف تختار',
  keysWild: 'يُؤخذ عندما تكتب حرفًا لا تُظهره أي قطعة',
  clearsEvery: 'يمسح كل حروف {letter} المختارة',
  undoLastLetter: 'تراجع عن آخر حرف',
  noWordsYet: 'لا كلمات بعد.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'وُجدت من قبل',
  reasonTooShort: 'قصيرة جدًا',
  reasonNotAWord: 'ليست كلمة',
  reasonAllFound: 'حصلت عليها كلها بالفعل',
  noSuchLetterUp: 'لا يوجد {letter} مكشوف',
  nothingUp: 'غير مكشوفة',
  shuffled: 'خُلطت',
  shuffledAndBilled: 'خُلطت، وحُسبت عليك {flips} لم تُستخدم',

  gameLanguage: 'اللغة',
  interfaceLanguage: 'الواجهة',
  dictionarySize: '{common} كلمة شائعة من {full}',
  filterLanguages: 'ابحث عن لغة',
  noMatches: 'لا نتائج',

  nerdMode: 'وضع الخبراء',
  rules: 'القواعد',
  difficulty: 'الصعوبة',
  difficultyNames: { easy: 'سهل', medium: 'متوسط', hard: 'صعب', insane: 'جنوني' },
  tiles: 'قطع (N)',
  secondsPerTick: 'ثوانٍ / نبضة',
  holdTicks: 'نبضات الانتظار',
  minWord: 'أقصر كلمة',
  startingFlips: 'نقلات البداية',
  wildChance: 'احتمال الجوكر',
  replaceChance: 'احتمال تبدّل الحرف',
  wordCompleteMode: 'عند اكتمال الكلمة',
  wordCompleteNames: { shuffle: 'اخلط', spend: 'استهلك', keep: 'احتفظ' },
  flipEconomy: 'اقتصاد النقلات',
  flipEconomyNames: {
    none: 'بلا',
    perLetter: 'لكل حرف',
    fibonacci: 'فيبوناتشي',
    overMinimum: 'فوق الحد الأدنى',
  },
  repeatedLetterKey: 'مفتاح الحرف المكرر',
  keySchemeNames: { cycle: 'دوري', advance: 'تقدّمي' },
  keySchemeHelp: {
    cycle:
      'يأخذ الحرف أ التالية غير المستخدمة، وحين تدخل كلها في الكلمة يمسحها. ' +
      'وShift+أ يمسحها أيضًا.',
    advance: 'يأخذ الحرف أ التالية غير المستخدمة. وShift+أ يمسح كل أ في الكلمة.',
  },

  whatThatMeans: 'ماذا يعني ذلك',
  factRound: 'جولة',
  factWholeBoardUp: 'اللوحة كاملة مكشوفة لمدة',
  factRoundCosts: 'تكلفة الجولة',
  factFlipsBuy: 'نقلات البداية تشتري',
  factThisBoard: 'هذه اللوحة',
  factBoardHadToAdmit: 'كان على اللوحة أن تقبل',
  ticksAndSeconds: '{ticks}، {seconds}',
  wordsLongest: '{words}، أطولها {longest}',
  wordsIncludingOneOf: '{words} منها واحدة من {ceiling}',
  scorelessRounds: '{rounds} بلا نقاط',

  whatAWordPays: 'ماذا تدفع الكلمة',
  columnLetters: 'الحروف',
  columnCost: 'التكلفة',
  columnPoints: 'النقاط',
  columnFlips: 'النقلات',
  columnNet: 'الصافي',

  canonicalRules: 'قواعد {difficulty} المعتادة.',
  customRules: 'مغيّرة عن الإعداد. النقاط بقواعدك الخاصة لا تُرتَّب.',
  applyAndStart: 'طبّق وابدأ لعبة جديدة',
  changesNextGame: 'تسري التغييرات في اللعبة القادمة.',
  presets: 'الإعدادات:',

  start: 'ابدأ',
  restart: 'أعد البدء',
  quit: 'اخرج',
  quitTitle: 'الخروج من هذه اللعبة؟',
  restartTitle: 'إعادة بدء هذه اللعبة؟',
  restartConfirm: 'أعد البدء',
  quitConfirm: 'اخرج',
  keepPlaying: 'تابع اللعب',
  personalBest: 'أفضل ألعابك',
  thisGame: 'هذه اللعبة',
  newPersonalBest: 'رقم شخصي جديد.',
  columnRank: '#',
  notRanked: 'قواعد خاصة بك، لذا لا تُرتَّب هذه اللعبة.',
  rankOfTotal: '{rank} من {total}',

  howToPlay: 'كيفية اللعب',

  backToGame: 'العودة إلى اللعبة',
  welcomeTitle: 'أهلًا بك في Blinkered',
  tutorialSkip: 'تخطٍ',
  tutorialNext: 'التالي',
  tutorialBack: 'رجوع',
  tutorialStart: 'ابدأ اللعب',
  tutorialHideAgain: 'لا تعرض هذا مرة أخرى',
  tutorialProgress: '{n} من {total}',
  tutorialSkipTitle: 'تخطي الجولة التعريفية؟',
  tutPickLetters: 'المس الحروف التي تريدها، بالترتيب، لتكوّن كلمة.',
  tutMoreTurn: 'تستمر القطع في الانكشاف بينما تفكر، فقد يأتي حرف أفضل بعد.',
  tutTapBack: 'لمست واحدة لم تردها؟ المسها ثانيةً لتعيدها. أيًّا منها، لا الأخيرة فقط.',
  tutComplete: 'اضغط أكمل حين تجهز الكلمة.',
  tutControlsTitle: 'الأزرار',
  tutReset: 'يمسح زر امسح الكلمة التي تكوّنها. وتبقى القطع في أماكنها.',
  tutPause: 'يوقف زر الإيقاف المؤقت الساعة ويخفي اللوحة، كي لا تُستغل الاستراحة في دراستها.',
  tutRestart: 'يوزّع زر إعادة البدء لوحة جديدة من أولها. ويسأل أولًا.',
  tutQuit: 'ينهي زر الخروج اللعبة ويعرض ما أحرزته. ويسأل أولًا.',
  tutDoneTitle: 'هذه هي اللعبة كلها',
  tutDoneBody: 'اختر مستوى والعب. كيفية اللعب دائمًا في شريط العنوان إن أردتها ثانيةً.',
  htBoardTitle: 'اللوحة',
  htBoardBody: 'تنكشف القطع واحدة تلو الأخرى، بترتيب القراءة. ومن القطع المكشوفة تكوّن الكلمات.',
  htWordsTitle: 'الكلمات',
  htWordsBody: 'كوّن كلمة من القطع المكشوفة بكتابة الحروف أو النقر عليها بالترتيب.',
  htFlipsTitle: 'النقلات',
  htFlipsBody:
    'كل قطعة تنكشف تكلّف نقلة واحدة. والكلمة المكتملة تعيد نقلات إلى رصيدك، والكلمات الطويلة تدفع أكثر. وحين تنفد النقلات تنتهي اللعبة.',
  htRoundTitle: 'الجولة',
  htRoundBody:
    'حين تنكشف آخر قطعة في الجولة، تبقى اللوحة كلها مكشوفة لحظة. ثم تُقلب القطع وتُخلط، وتبدأ جولة جديدة.',
  htLanguagesTitle: 'اللغات',
  htLanguagesBody:
    '{n} لغة. كل لوحة يمكن حلّها بكلمات يستعملها الناس فعلًا. والكلمة غير المألوفة تُحرز نقاطًا كذلك، إن عرفها القاموس.',
  htKeysTitle: 'لوحة المفاتيح',
  htWildTitle: 'الجوكر',
  htWildBody:
    'أحيانًا يظهر جوكر بدل حرف. والجوكر يُحسب أي حرف يكوّن كلمة صحيحة. أما كلمة أكملتها من قبل فلا تُحسب.',
  htSwapTitle: 'الحروف المتبدلة',
  htSwapBody: 'أحيانًا، بين الجولات، يُستبدل حرف بآخر. وسترى أي حرف أُزيل وأيّها أُضيف.',
  htLevelsTitle: 'المستويات',
  htLevelEasy:
    'الحروف الاثنا عشر نفسها طوال اللعبة، فتستطيع حفظها وحمل قائمة كلمات في رأسك. تنكشف القطع ببطء، وتبقى اللوحة الكاملة ظاهرة مدة تكفي لإتمام اختيار حروفك.',
  htLevelMedium:
    'بين حين وآخر يتبدّل حرف، فيصعب تذكّر كلمات كنت تنوي لعبها لاحقًا. وقت أقل للنظر وأقل للتفكير.',
  htLevelHard:
    'الكلمات من ثلاثة حروف لم تعد تُحسب، ويتبدّل حرف كل جولتين تقريبًا. تكاد اللوحة لا تنكشف حتى تُخلط.',
  htLevelInsane: 'كل شيء معًا، بأقصى سرعة. تُخلط اللوحة فور آخر نقلة تقريبًا.',
  htTouchTitle: 'شاشة اللمس',
  htTouchBody:
    'المس قطعة مكشوفة لتأخذ حرفها. والمس أي حرف أخذته لتعيده. وزرّا أكمل وامسح أسفل اللوحة.',

  plurals: {
    words: {
      zero: '{n} كلمة',
      one: '{n} كلمة',
      two: '{n} كلمتان',
      few: '{n} كلمات',
      many: '{n} كلمة',
      other: '{n} كلمة',
    },
    rounds: {
      zero: '{n} جولة',
      one: '{n} جولة',
      two: '{n} جولتان',
      few: '{n} جولات',
      many: '{n} جولة',
      other: '{n} جولة',
    },
    flips: {
      zero: '{n} نقلة',
      one: '{n} نقلة',
      two: '{n} نقلتان',
      few: '{n} نقلات',
      many: '{n} نقلة',
      other: '{n} نقلة',
    },
    ticks: {
      zero: '{n} نبضة',
      one: '{n} نبضة',
      two: '{n} نبضتان',
      few: '{n} نبضات',
      many: '{n} نبضة',
      other: '{n} نبضة',
    },
    points: {
      zero: '{n} نقطة',
      one: '{n} نقطة',
      two: '{n} نقطتان',
      few: '{n} نقاط',
      many: '{n} نقطة',
      other: '{n} نقطة',
    },
  },
}
