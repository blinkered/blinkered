import type { Messages } from '../messages.js'

/**
 * Icelandic. `leikur` for flips, the word an Icelandic board game uses for a move.
 *
 * `orð` and `stig` do not change in the plural — eitt orð, tvö orð — which is why two of these
 * pairs carry the same string on purpose.
 */
export const is: Messages = {
  tag: 'is',

  readingDictionary: 'Les orðabókina…',
  noWordList: 'Enginn orðalisti fyrir „{language}“. Búðu hann til:  pnpm dictionary build',
  emptyWordList: 'Orðalistinn fyrir „{language}“ er tómur.',

  flips: 'leikir',
  score: 'stig',
  words: 'orð',
  round: 'umferð',
  ticksLeftLabel: 'Tími eftir í þessari umferð',
  typeAWord: 'sláðu inn orð',
  tapPrompt: 'ýttu á stafi til að velja eða skila, síðan {action}',

  boardOfTiles: 'Borð með {n} flísum',
  faceDown: 'á hvolfi',
  wildCard: 'jóker',
  wildKey: 'hvaða stafur sem er',
  letterReplaced: '{from} varð að {to}',
  letterSwap: 'STAFASKIPTI!',
  spentTile: 'notuð flís',
  hiddenWhilePaused: 'falið á meðan gert er hlé',
  letterInWord: '{letter}, {position}. stafur orðsins',

  completeWord: 'Ljúka orði',

  completeShort: 'Lokið',
  reset: 'Hreinsa',
  pause: 'Hlé',
  resume: 'Halda áfram',
  newGame: 'Nýr leikur',
  paused: 'Í hléi',
  outOfFlips: 'Leikir búnir',
  finalResult: '{score} fyrir {words} á {rounds}',
  playAgain: 'Spila aftur',
  share: 'Deila',
  shareCopied: 'Afritað.',
  shareSelect: 'Afritaðu þetta:',

  lettersSelect: 'stafir velja',
  keysWild: 'tekinn þegar þú slærð inn staf sem engin flís sýnir',
  clearsEvery: 'hreinsar alla valda {letter}',
  undoLastLetter: 'afturkalla síðasta staf',
  noWordsYet: 'Engin orð enn.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'þegar fundið',
  reasonTooShort: 'of stutt',
  reasonNotAWord: 'ekki orð',
  reasonAllFound: 'þú ert þegar með þau öll',
  noSuchLetterUp: 'enginn {letter} snúinn upp',
  nothingUp: 'ekkert snúið upp',
  shuffled: 'stokkað',
  shuffledAndBilled: 'stokkað, {flips} ónotaðir dregnir frá',

  gameLanguage: 'tungumál',
  interfaceLanguage: 'viðmót',
  dictionarySize: '{common} algeng af {full} orðum',
  filterLanguages: 'Leita að tungumáli',
  noMatches: 'Ekkert fannst',

  nerdMode: 'nördastilling',
  rules: 'Reglur',
  difficulty: 'erfiðleikastig',
  difficultyNames: { easy: 'létt', medium: 'miðlungs', hard: 'erfitt', insane: 'brjálað' },
  tiles: 'flísar (N)',
  secondsPerTick: 'sekúndur / takt',
  holdTicks: 'biðtaktar',
  minWord: 'stysta orð',
  startingFlips: 'leikir í upphafi',
  wildChance: 'líkur á jóker',
  replaceChance: 'líkur á stafaskiptum',
  wordCompleteMode: 'þegar orði er lokið',
  wordCompleteNames: { shuffle: 'stokka', spend: 'eyða', keep: 'halda' },
  flipEconomy: 'endurgreiðsla leikja',
  flipEconomyNames: {
    none: 'engin',
    perLetter: 'á staf',
    fibonacci: 'fibonacci',
    overMinimum: 'yfir lágmarki',
  },
  repeatedLetterKey: 'lykill fyrir endurtekinn staf',
  keySchemeNames: { cycle: 'hringur', advance: 'áfram' },
  keySchemeHelp: {
    cycle:
      'A tekur næsta ónotaða A, og þegar þeir eru allir komnir í orðið hreinsar það þá. ' +
      'Shift+A hreinsar þá líka.',
    advance: 'A tekur næsta ónotaða A. Shift+A hreinsar alla A úr orðinu.',
  },

  whatThatMeans: 'Hvað það þýðir',
  factRound: 'umferð',
  factWholeBoardUp: 'allt borðið uppi í',
  factRoundCosts: 'umferð kostar',
  factFlipsBuy: 'upphafsleikir kaupa',
  factThisBoard: 'þetta borð',
  factBoardHadToAdmit: 'borðið varð að leyfa',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, lengst {longest}',
  wordsIncludingOneOf: '{words}, þar af eitt með {ceiling}',
  scorelessRounds: '{rounds} án stiga',

  whatAWordPays: 'Hvað orð gefur',
  columnLetters: 'stafir',
  columnCost: 'kostnaður',
  columnPoints: 'stig',
  columnFlips: 'leikir',
  columnNet: 'nettó',

  canonicalRules: 'Venjulegar reglur fyrir {difficulty}.',
  customRules: 'Breytt frá forstillingu. Stig með eigin reglum komast ekki á listann.',
  applyAndStart: 'Virkja og byrja nýjan leik',
  changesNextGame: 'Breytingarnar taka gildi í næsta leik.',
  presets: 'Forstillingar:',

  start: 'Byrja',
  restart: 'Upp á nýtt',
  quit: 'Hætta',
  quitTitle: 'Hætta í þessum leik?',
  restartTitle: 'Byrja þennan leik upp á nýtt?',
  restartConfirm: 'Upp á nýtt',
  quitConfirm: 'Hætta',
  keepPlaying: 'Halda áfram að spila',
  personalBest: 'Bestu leikirnir þínir',
  thisGame: 'þessi leikur',
  newPersonalBest: 'Nýtt persónulegt met.',
  columnRank: '#',
  notRanked: 'Eigin reglur, svo þessi leikur kemst ekki á listann.',
  rankOfTotal: '{rank} af {total}',

  howToPlay: 'Hvernig á að spila',

  backToGame: 'Aftur í leikinn',
  welcomeTitle: 'Velkomin í Blinkered',
  tutorialSkip: 'Sleppa',
  tutorialNext: 'Áfram',
  tutorialBack: 'Til baka',
  tutorialStart: 'Byrja að spila',
  tutorialHideAgain: 'Ekki sýna þetta aftur',
  tutorialProgress: '{n} af {total}',
  tutorialSkipTitle: 'Sleppa kynningunni?',
  tutPickLetters: 'Ýttu á stafina sem þú vilt, í röð, til að mynda orð.',
  tutMoreTurn:
    'Flísar halda áfram að snúast meðan þú hugsar, svo betri stafur gæti enn verið á leiðinni.',
  tutTapBack:
    'Tókstu einn sem þú vildir ekki? Ýttu aftur á hann til að skila honum. Hvaða sem er, ekki bara þann síðasta.',
  tutComplete: 'Ýttu á Lokið þegar orðið er tilbúið.',
  tutControlsTitle: 'Hnapparnir',
  tutReset: 'Hreinsa eyðir orðinu sem þú ert að mynda. Flísarnar verða kyrrar.',
  tutPause: 'Hlé stöðvar klukkuna og felur borðið, svo pása nýtist ekki til að læra það.',
  tutRestart: 'Upp á nýtt gefur nýtt borð frá byrjun. Það spyr fyrst.',
  tutQuit: 'Hætta lýkur leiknum og sýnir stigin. Það spyr fyrst.',
  tutDoneTitle: 'Þetta er allur leikurinn',
  tutDoneBody: 'Veldu erfiðleikastig og spilaðu. Hvernig á að spila er alltaf við titilinn.',
  htBoardTitle: 'Borðið',
  htBoardBody: 'Flísarnar snúast við ein í einu, í lestrarröð. Úr þeim sem snúa upp má mynda orð.',
  htWordsTitle: 'Orðin',
  htWordsBody:
    'Myndaðu orð úr flísunum sem snúa upp með því að slá inn eða smella á stafina í röð.',
  htFlipsTitle: 'Leikirnir',
  htFlipsBody:
    'Hver flís sem snýst kostar leik. Fullgert orð skilar leikjum til baka, og lengri orð skila fleirum. Þegar leikirnir klárast er leiknum lokið.',
  htRoundTitle: 'Umferðin',
  htRoundBody:
    'Þegar síðasta flís umferðarinnar snýst stendur allt borðið kyrrt andartak. Svo er flísunum snúið við og stokkað, og ný umferð hefst.',
  htLanguagesTitle: 'Tungumálin',
  htLanguagesBody:
    'Þau eru {n}. Hvert borð má leysa með orðum sem fólk notar í raun. Sjaldgæft orð gefur líka stig, ef orðabókin þekkir það.',
  htKeysTitle: 'Lyklaborðið',
  htWildTitle: 'Jókerarnir',
  htWildBody:
    'Stundum birtist jóker í stað stafs. Jóker gildir sem hvaða stafur sem myndar gilt orð. Orð sem þegar er fundið gildir ekki.',
  htSwapTitle: 'Stafir sem breytast',
  htSwapBody:
    'Stundum er einum staf skipt út fyrir annan milli umferða. Þú sérð hvor hvarf og hvor kom.',
  htLevelsTitle: 'Stigin',
  htLevelEasy:
    'Sömu tólf stafirnir allan leikinn, svo þú getur lært þá og borið orðalista í höfðinu. Flísarnar snúast hægt og allt borðið sést nógu lengi til að ljúka valinu.',
  htLevelMedium:
    'Öðru hverju breytist stafur, svo erfiðara verður að muna orð sem geymd voru til seinni tíma. Minni tími til að horfa og minni til að hugsa.',
  htLevelHard:
    'Þriggja stafa orð hætta að gilda og stafur breytist um það bil aðra hverja umferð. Borðið nær varla að sýna sig áður en það stokkast.',
  htLevelInsane: 'Allt í einu, á fullri ferð. Borðið stokkast nánast strax eftir síðasta leikinn.',
  htTouchTitle: 'Snertiskjárinn',
  htTouchBody:
    'Ýttu á flís sem snýr upp til að taka stafinn hennar. Ýttu á staf sem þú hefur tekið til að skila honum. Lokið og Hreinsa eru undir borðinu.',

  plurals: {
    words: { one: '{n} orð', other: '{n} orð' },
    rounds: { one: '{n} umferð', other: '{n} umferðir' },
    flips: { one: '{n} leikur', other: '{n} leikir' },
    ticks: { one: '{n} taktur', other: '{n} taktar' },
    points: { one: '{n} stig', other: '{n} stig' },
  },
}
