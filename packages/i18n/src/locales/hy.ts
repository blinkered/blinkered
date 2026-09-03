import type { Messages } from '../messages.js'

/**
 * Armenian. `քայլ` for flips, the word an Armenian board game uses for a move.
 *
 * After a numeral Armenian keeps the noun singular — `2 բառ`, not `2 բառեր` — so both plural
 * forms carry the same string.
 *
 * Written in Eastern Armenian, which is what hy.wikipedia and hy.wiktionary are written in and
 * therefore what the word list is drawn from.
 */
export const hy: Messages = {
  tag: 'hy',

  readingDictionary: 'Բառարանը կարդացվում է…',
  noWordList: '«{language}»-ի համար բառացանկ չկա։ Ստեղծեք այն՝  pnpm dictionary build',
  emptyWordList: '«{language}»-ի բառացանկը դատարկ է։',

  flips: 'քայլեր',
  score: 'միավոր',
  words: 'բառեր',
  round: 'փուլ',
  ticksLeftLabel: 'Այս փուլում մնացած ժամանակը',
  typeAWord: 'մուտքագրեք բառ',
  tapPrompt: 'հպեք տառերին՝ ընտրելու կամ վերադարձնելու համար, ապա {action}',

  boardOfTiles: '{n} սալիկից տախտակ',
  faceDown: 'շրջված',
  wildCard: 'ջոկեր',
  wildKey: 'ցանկացած տառ',
  letterReplaced: '{from}-ը դարձավ {to}',
  letterSwap: 'ՏԱՌԵՐԻ ՓՈԽԱՆԱԿՈՒՄ',
  spentTile: 'օգտագործված սալիկ',
  hiddenWhilePaused: 'թաքցված է դադարի ընթացքում',
  letterInWord: '{letter}, բառի {position}-րդ տառը',

  completeWord: 'Ավարտել բառը',

  completeShort: 'Ավարտել',
  reset: 'Մաքրել',
  pause: 'Դադար',
  resume: 'Շարունակել',
  newGame: 'Նոր խաղ',
  paused: 'Դադարեցված',
  outOfFlips: 'Քայլերը սպառվեցին',
  finalResult: '{score}՝ {words}-ի համար, {rounds}-ում',
  playAgain: 'Խաղալ նորից',
  share: 'Կիսվել',
  shareCopied: 'Պատճենվեց։',
  shareSelect: 'Պատճենեք սա՝',

  lettersSelect: 'տառերն ընտրում են',
  keysWild: 'վերցվում է, երբ մուտքագրում եք տառ, որը ոչ մի սալիկ չի ցույց տալիս',
  clearsEvery: 'մաքրում է բոլոր ընտրված {letter}-երը',
  undoLastLetter: 'հետարկել վերջին տառը',
  noWordsYet: 'Դեռ բառեր չկան։',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'արդեն գտնված է',
  reasonTooShort: 'շատ կարճ է',
  reasonNotAWord: 'բառ չէ',
  reasonAllFound: 'արդեն բոլորն ունեք',
  noSuchLetterUp: 'բացված {letter} չկա',
  nothingUp: 'ոչինչ բացված չէ',
  shuffled: 'խառնվեց',
  shuffledAndBilled: 'խառնվեց, հաշվարկվեց {flips} չօգտագործված',

  gameLanguage: 'լեզու',
  interfaceLanguage: 'միջերես',
  dictionarySize: '{full} բառից {common} առօրյա',
  filterLanguages: 'Փնտրել լեզու',
  noMatches: 'Համընկնում չկա',

  nerdMode: 'գիտակների ռեժիմ',
  rules: 'Կանոններ',
  difficulty: 'բարդություն',
  difficultyNames: { easy: 'հեշտ', medium: 'միջին', hard: 'դժվար', insane: 'խելագար' },
  tiles: 'սալիկներ (N)',
  secondsPerTick: 'վայրկյան / տակտ',
  holdTicks: 'պահման տակտեր',
  minWord: 'ամենակարճ բառը',
  startingFlips: 'սկզբնական քայլեր',
  wildChance: 'ջոկերի հավանականություն',
  replaceChance: 'տառի փոխանակման հավանականություն',
  wordCompleteMode: 'բառն ավարտելիս',
  wordCompleteNames: { shuffle: 'խառնել', spend: 'ծախսել', keep: 'պահել' },
  flipEconomy: 'քայլերի վերադարձ',
  flipEconomyNames: {
    none: 'ոչ մեկը',
    perLetter: 'ըստ տառի',
    fibonacci: 'ֆիբոնաչի',
    overMinimum: 'նվազագույնից ավելի',
  },
  repeatedLetterKey: 'կրկնվող տառի ստեղն',
  keySchemeNames: { cycle: 'շրջան', advance: 'առաջ' },
  keySchemeHelp: {
    cycle:
      'Ա-ն վերցնում է հաջորդ չօգտագործված Ա-ն, և երբ բոլորը բառում են, մաքրում է դրանք։ ' +
      'Shift+Ա-ն նույնպես մաքրում է։',
    advance: 'Ա-ն վերցնում է հաջորդ չօգտագործված Ա-ն։ Shift+Ա-ն մաքրում է բառի բոլոր Ա-երը։',
  },

  whatThatMeans: 'Ինչ է դա նշանակում',
  factRound: 'փուլ',
  factWholeBoardUp: 'ամբողջ տախտակը բաց է',
  factRoundCosts: 'մեկ փուլն արժե',
  factFlipsBuy: 'սկզբնական քայլերը գնում են',
  factThisBoard: 'այս տախտակը',
  factBoardHadToAdmit: 'տախտակը պետք է թույլ տար',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, ամենաերկարը՝ {longest}',
  wordsIncludingOneOf: '{words}, որոնցից մեկը՝ {ceiling}',
  scorelessRounds: '{rounds}՝ առանց միավորի',

  whatAWordPays: 'Ինչ է տալիս բառը',
  columnLetters: 'տառեր',
  columnCost: 'արժեք',
  columnPoints: 'միավոր',
  columnFlips: 'քայլեր',
  columnNet: 'տարբերություն',

  canonicalRules: '{difficulty} մակարդակի սովորական կանոնները։',
  customRules: 'Փոխված է կանխադրվածից։ Սեփական կանոններով միավորները վարկանիշում չեն մտնում։',
  applyAndStart: 'Կիրառել և սկսել նոր խաղ',
  changesNextGame: 'Փոփոխությունները կգործեն հաջորդ խաղից։',
  presets: 'Կանխադրվածներ՝',

  start: 'Սկսել',
  restart: 'Նորից',
  quit: 'Դուրս գալ',
  quitTitle: 'Ավարտե՞լ այս խաղը։',
  restartTitle: 'Նորի՞ց սկսել այս խաղը։',
  restartConfirm: 'Նորից',
  quitConfirm: 'Դուրս գալ',
  keepPlaying: 'Շարունակել խաղը',
  personalBest: 'Ձեր լավագույն խաղերը',
  thisGame: 'այս խաղը',
  newPersonalBest: 'Նոր անձնական ռեկորդ։',
  columnRank: '#',
  notRanked: 'Սեփական կանոններ, ուստի այս խաղը վարկանիշում չի մտնում։',
  rankOfTotal: '{total}-ից {rank}',

  howToPlay: 'Ինչպես խաղալ',

  backToGame: 'Վերադառնալ խաղին',
  welcomeTitle: 'Բարի գալուստ Blinkered',
  tutorialSkip: 'Բաց թողնել',
  tutorialNext: 'Հաջորդ',
  tutorialBack: 'Հետ',
  tutorialStart: 'Սկսել խաղալ',
  tutorialHideAgain: 'Այլևս ցույց չտալ',
  tutorialProgress: '{total}-ից {n}',
  tutorialSkipTitle: 'Բաց թողնե՞լ ծանոթացումը։',
  tutPickLetters: 'Հպեք ցանկալի տառերին հերթականությամբ՝ բառ կազմելու համար։',
  tutMoreTurn:
    'Սալիկները շարունակում են բացվել, մինչ մտածում եք, այնպես որ ավելի լավ տառ դեռ կարող է գալ։',
  tutTapBack:
    'Վերցրե՞լ եք տառ, որը չէիք ուզում։ Կրկին հպեք, և այն կվերադառնա։ Ցանկացածը, ոչ միայն վերջինը։',
  tutComplete: 'Երբ բառը պատրաստ է, սեղմեք Ավարտել։',
  tutControlsTitle: 'Կոճակները',
  tutReset: 'Մաքրելը ջնջում է կազմվող բառը։ Սալիկները մնում են իրենց տեղում։',
  tutPause:
    'Դադարը կանգնեցնում է ժամացույցը և թաքցնում տախտակը, որ ընդմիջումը դրա անգիր անելուն չծառայի։',
  tutRestart: 'Նորից բաժանում է նոր տախտակ սկզբից։ Նախ հարցնում է։',
  tutQuit: 'Դուրս գալը ավարտում է խաղը և ցույց տալիս միավորները։ Նախ հարցնում է։',
  tutDoneTitle: 'Սա ամբողջ խաղն է',
  tutDoneBody: 'Ընտրեք մակարդակ և խաղացեք։ Ինչպես խաղալ միշտ վերնագրի կողքին է։',
  htBoardTitle: 'Տախտակը',
  htBoardBody:
    'Սալիկները բացվում են մեկ առ մեկ, ընթերցման հերթականությամբ։ Բացվածներից բառեր են կազմվում։',
  htWordsTitle: 'Բառերը',
  htWordsBody: 'Կազմեք բառ բացված սալիկներից՝ մուտքագրելով կամ սեղմելով տառերը հերթականությամբ։',
  htFlipsTitle: 'Քայլերը',
  htFlipsBody:
    'Ամեն բացվող սալիկ մեկ քայլ արժե։ Ավարտված բառը քայլեր է վերադարձնում, իսկ ավելի երկար բառերն ավելին։ Երբ քայլերը սպառվեն, խաղն ավարտվում է։',
  htRoundTitle: 'Փուլը',
  htRoundBody:
    'Երբ փուլի վերջին սալիկը բացվի, ամբողջ տախտակը մի պահ կանգ է առնում։ Ապա սալիկները շրջվում և խառնվում են, և սկսվում է նոր փուլ։',
  htLanguagesTitle: 'Լեզուները',
  htLanguagesBody:
    '{n} լեզու։ Յուրաքանչյուր տախտակ լուծվում է բառերով, որոնք մարդիկ իրոք գործածում են։ Հազվադեպ բառը նույնպես միավոր է տալիս, եթե բառարանը գիտի այն։',
  htKeysTitle: 'Ստեղնաշարը',
  htWildTitle: 'Ջոկերները',
  htWildBody:
    'Երբեմն տառի փոխարեն ջոկեր է հայտնվում։ Ջոկերը հաշվվում է որպես ցանկացած տառ, որը ճիշտ բառ է կազմում։ Արդեն գտնված բառը չի հաշվվում։',
  htSwapTitle: 'Փոխվող տառեր',
  htSwapBody:
    'Երբեմն փուլերի միջև մեկ տառը փոխարինվում է մյուսով։ Կտեսնեք, որն է հեռացել և որն է եկել։',
  htLevelsTitle: 'Մակարդակները',
  htLevelEasy:
    'Նույն տասներկու տառը ողջ խաղի ընթացքում, այնպես որ կարող եք սովորել դրանք և բառերի ցանկը գլխում պահել։ Սալիկները դանդաղ են բացվում, և ամբողջ տախտակը բավական երկար է երևում, որ ընտրությունն ավարտեք։',
  htLevelMedium:
    'Ժամանակ առ ժամանակ մի տառ փոխվում է, ուստի դժվարանում է հիշել հետո օգտագործելու համար պահված բառերը։ Ավելի քիչ ժամանակ նայելու և ավելի քիչ մտածելու։',
  htLevelHard:
    'Երեք տառանոց բառերն այլևս չեն հաշվվում, և տառը փոխվում է մոտավորապես ամեն երկրորդ փուլում։ Տախտակը հազիվ է երևում, արդեն խառնվում է։',
  htLevelInsane:
    'Ամեն ինչ միաժամանակ, ամբողջ արագությամբ։ Տախտակը խառնվում է վերջին քայլից գրեթե անմիջապես հետո։',
  htTouchTitle: 'Հպէկրանը',
  htTouchBody:
    'Հպեք բացված սալիկին՝ նրա տառը վերցնելու համար։ Հպեք վերցրած տառին՝ վերադարձնելու համար։ Ավարտել և Մաքրել տախտակի տակ են։',

  plurals: {
    words: { one: '{n} բառ', other: '{n} բառ' },
    rounds: { one: '{n} փուլ', other: '{n} փուլ' },
    flips: { one: '{n} քայլ', other: '{n} քայլ' },
    ticks: { one: '{n} տակտ', other: '{n} տակտ' },
    points: { one: '{n} միավոր', other: '{n} միավոր' },
  },
}
