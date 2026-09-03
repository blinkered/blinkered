import type { Messages } from '../messages.js'

/**
 * Georgian. `სვლა` for flips, the word a Georgian board game uses for a move.
 *
 * Georgian has no capital letters, which is the thing the alphabet's fold exists to protect:
 * Unicode gave Mkhedruli an upper case for headings and `toUpperCase` will use it, so anything
 * that upper-cases Georgian ends up shouting in Mtavruli. Nothing here is upper-cased.
 *
 * After a numeral the noun stays singular — `2 სიტყვა`, not `2 სიტყვები` — so both plural forms
 * carry the same string.
 */
export const ka: Messages = {
  tag: 'ka',

  readingDictionary: 'იკითხება ლექსიკონი…',
  noWordList: '„{language}“-სთვის სიტყვების სია არ არის. შექმენით:  pnpm dictionary build',
  emptyWordList: '„{language}“-ის სიტყვების სია ცარიელია.',

  flips: 'სვლები',
  score: 'ქულები',
  words: 'სიტყვები',
  round: 'რაუნდი',
  ticksLeftLabel: 'ამ რაუნდში დარჩენილი დრო',
  typeAWord: 'აკრიფეთ სიტყვა',
  tapPrompt: 'შეეხეთ ასოებს ასარჩევად ან დასაბრუნებლად, შემდეგ {action}',

  boardOfTiles: 'დაფა {n} კრამიტით',
  faceDown: 'პირქვე',
  wildCard: 'ჯოკერი',
  wildKey: 'ნებისმიერი ასო',
  letterReplaced: '{from} გახდა {to}',
  letterSwap: 'ასოების გაცვლა!',
  spentTile: 'გამოყენებული კრამიტი',
  hiddenWhilePaused: 'პაუზისას დამალულია',
  letterInWord: '{letter}, სიტყვის {position}-ე ასო',

  completeWord: 'სიტყვის დასრულება',

  completeShort: 'დასრულება',
  reset: 'გასუფთავება',
  pause: 'პაუზა',
  resume: 'გაგრძელება',
  newGame: 'ახალი თამაში',
  paused: 'შეჩერებულია',
  outOfFlips: 'სვლები ამოიწურა',
  finalResult: '{score} {words}-ისთვის {rounds}-ში',
  playAgain: 'ისევ თამაში',
  share: 'გაზიარება',
  shareCopied: 'დაკოპირდა.',
  shareSelect: 'დააკოპირეთ ეს:',

  lettersSelect: 'ასოები ირჩევენ',
  keysWild: 'აიღება, როცა აკრეფთ ასოს, რომელიც არცერთ კრამიტზე არ ჩანს',
  clearsEvery: 'ასუფთავებს ყველა არჩეულ {letter}-ს',
  undoLastLetter: 'ბოლო ასოს დაბრუნება',
  noWordsYet: 'ჯერ სიტყვები არ არის.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'უკვე ნაპოვნია',
  reasonTooShort: 'ძალიან მოკლეა',
  reasonNotAWord: 'ეს სიტყვა არ არის',
  reasonAllFound: 'უკვე ყველა გაქვთ',
  noSuchLetterUp: 'გადმობრუნებული {letter} არ არის',
  nothingUp: 'არაფერია გადმობრუნებული',
  shuffled: 'აირია',
  shuffledAndBilled: 'აირია, ჩამოგეჭრათ {flips} გამოუყენებელი',

  gameLanguage: 'ენა',
  interfaceLanguage: 'ინტერფეისი',
  dictionarySize: '{full} სიტყვიდან {common} ყოველდღიური',
  filterLanguages: 'ენის ძებნა',
  noMatches: 'დამთხვევა არ არის',

  nerdMode: 'მცოდნეთა რეჟიმი',
  rules: 'წესები',
  difficulty: 'სირთულე',
  difficultyNames: { easy: 'მარტივი', medium: 'საშუალო', hard: 'რთული', insane: 'გიჟური' },
  tiles: 'კრამიტები (N)',
  secondsPerTick: 'წამი / ტაქტი',
  holdTicks: 'შეჩერების ტაქტები',
  minWord: 'უმოკლესი სიტყვა',
  startingFlips: 'საწყისი სვლები',
  wildChance: 'ჯოკერის შანსი',
  replaceChance: 'ასოს გაცვლის შანსი',
  wordCompleteMode: 'სიტყვის დასრულებისას',
  wordCompleteNames: { shuffle: 'არევა', spend: 'დახარჯვა', keep: 'დატოვება' },
  flipEconomy: 'სვლების დაბრუნება',
  flipEconomyNames: {
    none: 'არცერთი',
    perLetter: 'ასოზე',
    fibonacci: 'ფიბონაჩი',
    overMinimum: 'მინიმუმზე მეტი',
  },
  repeatedLetterKey: 'გამეორებული ასოს კლავიში',
  keySchemeNames: { cycle: 'ციკლი', advance: 'წინსვლა' },
  keySchemeHelp: {
    cycle:
      'ა იღებს შემდეგ გამოუყენებელ ა-ს, და როცა ყველა სიტყვაშია, ასუფთავებს მათ. ' +
      'Shift+ა ასევე ასუფთავებს.',
    advance: 'ა იღებს შემდეგ გამოუყენებელ ა-ს. Shift+ა ასუფთავებს სიტყვაში ყველა ა-ს.',
  },

  whatThatMeans: 'რას ნიშნავს ეს',
  factRound: 'რაუნდი',
  factWholeBoardUp: 'მთელი დაფა ღიაა',
  factRoundCosts: 'ერთი რაუნდი ღირს',
  factFlipsBuy: 'საწყისი სვლები ყიდულობს',
  factThisBoard: 'ეს დაფა',
  factBoardHadToAdmit: 'დაფას უნდა დაეშვა',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, უგრძესი {longest}',
  wordsIncludingOneOf: '{words}, მათ შორის ერთი {ceiling}',
  scorelessRounds: '{rounds} ქულის გარეშე',

  whatAWordPays: 'რას აძლევს სიტყვა',
  columnLetters: 'ასოები',
  columnCost: 'ფასი',
  columnPoints: 'ქულები',
  columnFlips: 'სვლები',
  columnNet: 'სხვაობა',

  canonicalRules: '{difficulty} დონის ჩვეული წესები.',
  customRules: 'შეცვლილია ნაგულისხმევიდან. საკუთარი წესებით ქულები რეიტინგში არ ხვდება.',
  applyAndStart: 'გამოყენება და ახალი თამაშის დაწყება',
  changesNextGame: 'ცვლილებები შემდეგი თამაშიდან ამოქმედდება.',
  presets: 'ნაგულისხმევები:',

  start: 'დაწყება',
  restart: 'თავიდან',
  quit: 'გასვლა',
  quitTitle: 'დატოვებთ ამ თამაშს?',
  restartTitle: 'თავიდან დაიწყებთ ამ თამაშს?',
  restartConfirm: 'თავიდან',
  quitConfirm: 'გასვლა',
  keepPlaying: 'თამაშის გაგრძელება',
  personalBest: 'თქვენი საუკეთესო თამაშები',
  thisGame: 'ეს თამაში',
  newPersonalBest: 'ახალი პირადი რეკორდი.',
  columnRank: '#',
  notRanked: 'საკუთარი წესები, ამიტომ ეს თამაში რეიტინგში არ ხვდება.',
  rankOfTotal: '{total}-დან {rank}',

  howToPlay: 'როგორ ვითამაშოთ',

  backToGame: 'თამაშში დაბრუნება',
  welcomeTitle: 'კეთილი იყოს თქვენი მობრძანება Blinkered-ში',
  tutorialSkip: 'გამოტოვება',
  tutorialNext: 'შემდეგი',
  tutorialBack: 'უკან',
  tutorialStart: 'თამაშის დაწყება',
  tutorialHideAgain: 'აღარ მაჩვენო',
  tutorialProgress: '{total}-დან {n}',
  tutorialSkipTitle: 'გამოტოვებთ გაცნობას?',
  tutPickLetters: 'შეეხეთ სასურველ ასოებს რიგის მიხედვით, რომ სიტყვა შეადგინოთ.',
  tutMoreTurn: 'კრამიტები ფიქრის დროსაც ბრუნდება, ასე რომ უკეთესი ასო ჯერ კიდევ შეიძლება მოვიდეს.',
  tutTapBack:
    'აიღეთ ასო, რომელიც არ გინდოდათ? კიდევ ერთხელ შეეხეთ და დაბრუნდება. ნებისმიერი, არა მხოლოდ ბოლო.',
  tutComplete: 'როცა სიტყვა მზადაა, დააჭირეთ დასრულებას.',
  tutControlsTitle: 'ღილაკები',
  tutReset: 'გასუფთავება შლის სიტყვას, რომელსაც ადგენთ. კრამიტები თავის ადგილას რჩება.',
  tutPause:
    'პაუზა აჩერებს საათს და მალავს დაფას, რომ შესვენება მის დასამახსოვრებლად არ გამოიყენოთ.',
  tutRestart: 'თავიდან არიგებს ახალ დაფას თავიდან. ჯერ იკითხავს.',
  tutQuit: 'გასვლა ასრულებს თამაშს და აჩვენებს ქულებს. ჯერ იკითხავს.',
  tutDoneTitle: 'ეს არის მთელი თამაში',
  tutDoneBody: 'აირჩიეთ დონე და ითამაშეთ. როგორ ვითამაშოთ ყოველთვის სათაურთანაა.',
  htBoardTitle: 'დაფა',
  htBoardBody:
    'კრამიტები სათითაოდ ბრუნდება, კითხვის მიმდევრობით. გადმობრუნებულებისგან სიტყვები იდგმება.',
  htWordsTitle: 'სიტყვები',
  htWordsBody:
    'შეადგინეთ სიტყვა გადმობრუნებული კრამიტებისგან ასოების რიგით აკრეფით ან დაწკაპუნებით.',
  htFlipsTitle: 'სვლები',
  htFlipsBody:
    'ყოველი გადმობრუნებული კრამიტი ერთ სვლას ღირს. დასრულებული სიტყვა სვლებს აბრუნებს, გრძელი სიტყვები კი მეტს. როცა სვლები ამოიწურება, თამაში მთავრდება.',
  htRoundTitle: 'რაუნდი',
  htRoundBody:
    'როცა რაუნდის ბოლო კრამიტი გადმობრუნდება, მთელი დაფა წამით ჩერდება. შემდეგ კრამიტები უკუბრუნდება და აირევა, და ახალი რაუნდი იწყება.',
  htLanguagesTitle: 'ენები',
  htLanguagesBody:
    '{n} ენა. ყოველი დაფა იხსნება სიტყვებით, რომლებსაც ხალხი ნამდვილად იყენებს. იშვიათი სიტყვაც ქულას იძლევა, თუ ლექსიკონმა იცის.',
  htKeysTitle: 'კლავიატურა',
  htWildTitle: 'ჯოკერები',
  htWildBody:
    'ზოგჯერ ასოს ნაცვლად ჯოკერი ჩნდება. ჯოკერი ჩაითვლება ნებისმიერ ასოდ, რომელიც სწორ სიტყვას ქმნის. უკვე ნაპოვნი სიტყვა არ ითვლება.',
  htSwapTitle: 'ასოები, რომლებიც იცვლება',
  htSwapBody:
    'ზოგჯერ რაუნდებს შორის ერთი ასო სხვით იცვლება. დაინახავთ, რომელი წავიდა და რომელი მოვიდა.',
  htLevelsTitle: 'დონეები',
  htLevelEasy:
    'იგივე თორმეტი ასო მთელი თამაშის განმავლობაში, ასე რომ შეგიძლიათ დაისწავლოთ და სიტყვების სია თავში ატაროთ. კრამიტები ნელა ბრუნდება და მთელი დაფა საკმარისად დიდხანს ჩანს, რომ არჩევანი დაასრულოთ.',
  htLevelMedium:
    'დროდადრო ერთი ასო იცვლება, ასე რომ უფრო ძნელია გახსოვდეთ სიტყვები, რომლებიც მოგვიანებისთვის გადადეთ. ნაკლები დრო საყურებლად და ნაკლები საფიქრალად.',
  htLevelHard:
    'სამასოიანი სიტყვები აღარ ითვლება, და ასო დაახლოებით ყოველ მეორე რაუნდში იცვლება. დაფა ძლივს ჩნდება, უკვე ირევა.',
  htLevelInsane:
    'ყველაფერი ერთდროულად, სრული სისწრაფით. დაფა თითქმის მაშინვე ირევა ბოლო სვლის შემდეგ.',
  htTouchTitle: 'სენსორული ეკრანი',
  htTouchBody:
    'შეეხეთ გადმობრუნებულ კრამიტს, რომ მისი ასო აიღოთ. შეეხეთ აღებულ ასოს, რომ დააბრუნოთ. დასრულება და გასუფთავება დაფის ქვეშაა.',

  plurals: {
    words: { one: '{n} სიტყვა', other: '{n} სიტყვა' },
    rounds: { one: '{n} რაუნდი', other: '{n} რაუნდი' },
    flips: { one: '{n} სვლა', other: '{n} სვლა' },
    ticks: { one: '{n} ტაქტი', other: '{n} ტაქტი' },
    points: { one: '{n} ქულა', other: '{n} ქულა' },
  },
}
