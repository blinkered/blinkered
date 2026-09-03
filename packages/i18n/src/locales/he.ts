import type { Messages } from '../messages.js'

/**
 * Hebrew, and the first locale that reads right to left.
 *
 * `מהלכים` for flips, the move you spend, which is the shape Dutch set with `zetten`.
 * `אריחים` for tiles and `לוח` for the board.
 *
 * Written unpointed, as Hebrew has been for centuries and as the tiles are: niqqud are marks
 * rather than letters and the alphabet strips them, so a pointed interface over an unpointed
 * board would be two spellings of the same game.
 */
export const he: Messages = {
  tag: 'he',

  readingDictionary: 'קורא את המילון…',
  noWordList: 'אין רשימת מילים ל־"{language}". צרו אחת:  pnpm dictionary build',
  emptyWordList: 'רשימת המילים ל־"{language}" ריקה.',

  flips: 'מהלכים',
  score: 'ניקוד',
  words: 'מילים',
  round: 'סיבוב',
  ticksLeftLabel: 'הזמן שנותר בסיבוב הזה',
  typeAWord: 'הקלידו מילה',
  tapPrompt: 'הקישו על אותיות כדי לבחור או להחזיר, ואז {action}',

  boardOfTiles: 'לוח של {n} אריחים',
  faceDown: 'הפוך',
  wildCard: "ג'וקר",
  wildKey: 'כל אות',
  letterReplaced: '{from} הפכה ל־{to}',
  letterSwap: 'החלפת אות!',
  spentTile: 'אריח מנוצל',
  hiddenWhilePaused: 'מוסתר בזמן השהיה',
  letterInWord: '{letter}, אות {position} במילה',

  completeWord: 'השלימו את המילה',

  completeShort: 'השלם',
  reset: 'נקה',
  pause: 'השהה',
  resume: 'המשך',
  newGame: 'משחק חדש',
  paused: 'מושהה',
  outOfFlips: 'נגמרו המהלכים',
  finalResult: '{score} נקודות מתוך {words} במהלך {rounds}',
  playAgain: 'שחקו שוב',
  share: 'שתפו',
  shareCopied: 'הועתק.',
  shareSelect: 'העתיקו את זה:',

  lettersSelect: 'אותיות בוחרות',
  keysWild: 'נלקח כשמקלידים אות שאף אריח אינו מציג',
  clearsEvery: 'מנקה את כל האותיות {letter} שנבחרו',
  undoLastLetter: 'ביטול האות האחרונה',
  noWordsYet: 'עדיין אין מילים.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'כבר נמצאה',
  reasonTooShort: 'קצרה מדי',
  reasonNotAWord: 'אינה מילה',
  reasonAllFound: 'כבר מצאתם את כולן',
  noSuchLetterUp: 'אין {letter} גלויה',
  nothingUp: 'לא גלוי',
  shuffled: 'עורבב',
  shuffledAndBilled: 'עורבב, חויבתם ב־{flips} מהלכים שלא נוצלו',

  gameLanguage: 'שפה',
  interfaceLanguage: 'ממשק',
  dictionarySize: '{common} מילים שכיחות מתוך {full}',
  filterLanguages: 'חיפוש שפות',
  noMatches: 'אין תוצאות',

  nerdMode: 'מצב חנון',
  rules: 'חוקים',
  difficulty: 'רמת קושי',
  difficultyNames: { easy: 'קל', medium: 'בינוני', hard: 'קשה', insane: 'מטורף' },
  tiles: 'אריחים (N)',
  secondsPerTick: 'שניות / פעימה',
  holdTicks: 'פעימות המתנה',
  minWord: 'המילה הקצרה ביותר',
  startingFlips: 'מהלכי פתיחה',
  wildChance: "סיכוי לג'וקר",
  replaceChance: 'סיכוי להחלפת אות',
  wordCompleteMode: 'בסיום מילה',
  wordCompleteNames: { shuffle: 'ערבב', spend: 'נצל', keep: 'שמור' },
  flipEconomy: 'כלכלת המהלכים',
  flipEconomyNames: {
    none: 'ללא',
    perLetter: 'לפי אות',
    fibonacci: 'פיבונאצ׳י',
    overMinimum: 'מעל המינימום',
  },
  repeatedLetterKey: 'מקש לאות חוזרת',
  keySchemeNames: { cycle: 'מחזורי', advance: 'מתקדם' },
  keySchemeHelp: {
    cycle:
      'א׳ לוקחת את הא׳ הפנויה הבאה, וכשכולן כבר במילה היא מנקה אותן. ' + 'גם Shift+א׳ מנקה אותן.',
    advance: 'א׳ לוקחת את הא׳ הפנויה הבאה. Shift+א׳ מנקה כל א׳ שבמילה.',
  },

  whatThatMeans: 'מה זה אומר',
  factRound: 'סיבוב',
  factWholeBoardUp: 'הלוח כולו גלוי למשך',
  factRoundCosts: 'סיבוב עולה',
  factFlipsBuy: 'מהלכי הפתיחה קונים',
  factThisBoard: 'הלוח הזה',
  factBoardHadToAdmit: 'הלוח היה חייב להתיר',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, הארוכה ביותר {longest}',
  wordsIncludingOneOf: '{words} ובהן אחת מתוך {ceiling}',
  scorelessRounds: '{rounds} ללא ניקוד',

  whatAWordPays: 'כמה שווה מילה',
  columnLetters: 'אותיות',
  columnCost: 'עלות',
  columnPoints: 'נקודות',
  columnFlips: 'מהלכים',
  columnNet: 'נטו',

  canonicalRules: 'חוקים רגילים לרמת {difficulty}.',
  customRules: 'שונה מהברירה. ניקוד תחת חוקים משלכם לא ידורג.',
  applyAndStart: 'החילו והתחילו משחק חדש',
  changesNextGame: 'השינויים ייכנסו לתוקף במשחק הבא.',
  presets: 'ברירות:',

  start: 'התחילו',
  restart: 'התחילו מחדש',
  quit: 'צאו',
  quitTitle: 'לצאת מהמשחק הזה?',
  restartTitle: 'להתחיל את המשחק הזה מחדש?',
  restartConfirm: 'התחל מחדש',
  quitConfirm: 'צא',
  keepPlaying: 'המשיכו לשחק',
  personalBest: 'המשחקים הטובים שלכם',
  thisGame: 'המשחק הזה',
  newPersonalBest: 'שיא אישי חדש.',
  columnRank: '#',
  notRanked: 'חוקים משלכם, ולכן המשחק הזה אינו מדורג.',
  rankOfTotal: '{rank} מתוך {total}',

  howToPlay: 'איך משחקים',

  backToGame: 'חזרה למשחק',
  welcomeTitle: 'ברוכים הבאים ל־Blinkered',
  tutorialSkip: 'דלג',
  tutorialNext: 'הבא',
  tutorialBack: 'חזרה',
  tutorialStart: 'התחילו לשחק',
  tutorialHideAgain: 'אל תציגו שוב',
  tutorialProgress: '{n} מתוך {total}',
  tutorialSkipTitle: 'לדלג על ההדרכה?',
  tutPickLetters: 'הקישו על האותיות שאתם רוצים, לפי הסדר, כדי להרכיב מילה.',
  tutMoreTurn: 'האריחים ממשיכים להתהפך בזמן שאתם חושבים, אז אות טובה יותר עוד עשויה להגיע.',
  tutTapBack: 'הקשתם על אחת שלא רציתם? הקישו עליה שוב כדי להחזיר. על כל אחת, לא רק על האחרונה.',
  tutComplete: 'לחצו על השלם כשהמילה מוכנה.',
  tutControlsTitle: 'הכפתורים',
  tutReset: 'נקה מוחק את המילה שאתם מרכיבים. האריחים נשארים במקומם.',
  tutPause: 'השהה עוצר את השעון ומסתיר את הלוח, כדי שהפסקה לא תשמש ללימוד שלו.',
  tutRestart: 'התחל מחדש מחלק לוח חדש מההתחלה. הוא שואל קודם.',
  tutQuit: 'צא מסיים את המשחק ומראה כמה צברתם. הוא שואל קודם.',
  tutDoneTitle: 'זה כל המשחק',
  tutDoneBody: 'בחרו רמה ושחקו. איך משחקים תמיד בשורת הכותרת, אם תרצו שוב.',
  htBoardTitle: 'הלוח',
  htBoardBody: 'האריחים נחשפים אחד אחרי השני, לפי סדר הקריאה. מהאריחים הגלויים אתם מרכיבים מילים.',
  htWordsTitle: 'המילים',
  htWordsBody: 'הרכיבו מילה מהאריחים הגלויים בהקלדה או בלחיצה על האותיות לפי הסדר.',
  htFlipsTitle: 'המהלכים',
  htFlipsBody:
    'כל אריח שמתהפך עולה מהלך אחד. מילה שהושלמה מחזירה מהלכים לסך שלכם, ומילים ארוכות משלמות יותר. כשהמהלכים נגמרים, המשחק נגמר.',
  htRoundTitle: 'הסיבוב',
  htRoundBody:
    'כשהאריח האחרון של הסיבוב מתהפך, הלוח כולו נשאר גלוי לרגע. אחר כך האריחים מתהפכים בחזרה ומעורבבים, וסיבוב חדש מתחיל.',
  htLanguagesTitle: 'השפות',
  htLanguagesBody:
    '{n} שפות. כל לוח ניתן לפתרון במילים שאנשים באמת משתמשים בהן. מילה חריגה עדיין מזכה בניקוד, אם המילון מכיר אותה.',
  htKeysTitle: 'המקלדת',
  htWildTitle: "ג'וקרים",
  htWildBody:
    "לפעמים מופיע ג'וקר במקום אות. ג'וקר נחשב לכל אות שמרכיבה מילה תקינה. מילה שכבר השלמתם אינה נחשבת.",
  htSwapTitle: 'אותיות מתחלפות',
  htSwapBody: 'לפעמים, בין הסיבובים, אות אחת מוחלפת באחרת. תראו איזו אות הוסרה ואיזו נוספה.',
  htLevelsTitle: 'הרמות',
  htLevelEasy:
    'אותן שתים עשרה אותיות לאורך כל המשחק, כך שאפשר ללמוד אותן ולהחזיק רשימת מילים בראש. האריחים מתהפכים לאט, והלוח המלא נשאר גלוי מספיק זמן כדי לסיים לבחור את האותיות.',
  htLevelMedium:
    'מדי פעם אות משתנה, וקשה יותר לזכור מילים שתכננתם לשחק בהמשך. פחות זמן להסתכל ופחות זמן לחשוב.',
  htLevelHard:
    'מילים בנות שלוש אותיות כבר לא נחשבות, ואות משתנה בערך בכל סיבוב שני. הלוח בקושי נחשף לפני שהוא מתערבב.',
  htLevelInsane: 'הכול ביחד, במהירות מלאה. הלוח מתערבב כמעט מיד אחרי המהלך האחרון.',
  htTouchTitle: 'מסך המגע',
  htTouchBody:
    'הקישו על אריח גלוי כדי לקחת את האות שלו. הקישו על כל אות שלקחתם כדי להחזיר אותה. השלם ונקה נמצאים מתחת ללוח.',

  /*
   * The numeral goes after the noun for one and before it for everything else, which is
   * Hebrew rather than a slip: מילה אחת is "one word" and 3 מילים is "3 words". Reading the
   * source is no help either way, since a terminal renders these lines right to left.
   */
  plurals: {
    words: { one: 'מילה {n}', two: '{n} מילים', other: '{n} מילים' },
    rounds: { one: 'סיבוב {n}', two: '{n} סיבובים', other: '{n} סיבובים' },
    flips: { one: 'מהלך {n}', two: '{n} מהלכים', other: '{n} מהלכים' },
    ticks: { one: 'פעימה {n}', two: '{n} פעימות', other: '{n} פעימות' },
    points: { one: 'נקודה {n}', two: '{n} נקודות', other: '{n} נקודות' },
  },
}
