import type { Messages } from '../messages.js'

/**
 * Swahili. `hatua` for flips, the way Dutch takes `zetten`: a move you spend, which is what the
 * meter counts, rather than the physical turning of a tile.
 *
 * `vigae` for tiles and `ubao` for the board. Several of the counted nouns here are class 9/10
 * and so identical in both numbers, which is why some plural forms look unchanged.
 */
export const sw: Messages = {
  tag: 'sw',

  readingDictionary: 'Kamusi inasomwa…',
  noWordList: 'Hakuna orodha ya maneno kwa "{language}". Tengeneza moja:  pnpm dictionary build',
  emptyWordList: 'Orodha ya maneno ya "{language}" haina kitu.',

  flips: 'hatua',
  score: 'alama',
  words: 'maneno',
  round: 'raundi',
  ticksLeftLabel: 'Muda uliobaki katika raundi hii',
  typeAWord: 'andika neno',
  tapPrompt: 'gusa herufi kuchagua au kurudisha, kisha {action}',

  boardOfTiles: 'Ubao wa vigae {n}',
  faceDown: 'kimefunikwa',
  wildCard: 'joker',
  wildKey: 'herufi yoyote',
  letterReplaced: '{from} imekuwa {to}',
  letterSwap: 'HERUFI IMEBADILIKA!',
  spentTile: 'kigae kilichotumika',
  hiddenWhilePaused: 'kimefichwa wakati mchezo umesimama',
  letterInWord: '{letter}, herufi ya {position} ya neno',

  completeWord: 'Kamilisha neno',

  completeShort: 'Kamilisha',
  reset: 'Futa',
  pause: 'Simamisha',
  resume: 'Endelea',
  newGame: 'Mchezo mpya',
  paused: 'Umesimama',
  outOfFlips: 'Hatua zimeisha',
  finalResult: 'alama {score} kutoka {words} katika {rounds}',
  playAgain: 'Cheza tena',
  share: 'Shiriki',
  shareCopied: 'Imenakiliwa.',
  shareSelect: 'Nakili hii:',

  lettersSelect: 'herufi huchagua',
  keysWild: 'huchukuliwa unapoandika herufi ambayo hakuna kigae kinachoionyesha',
  clearsEvery: 'huondoa herufi {letter} zote zilizochaguliwa',
  undoLastLetter: 'rudisha herufi ya mwisho',
  noWordsYet: 'Bado hakuna neno.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'limeshapatikana',
  reasonTooShort: 'fupi mno',
  reasonNotAWord: 'si neno',
  reasonAllFound: 'tayari unayo yote',
  noSuchLetterUp: 'hakuna {letter} wazi',
  nothingUp: 'hakijafunuliwa',
  shuffled: 'vimechanganywa',
  shuffledAndBilled: 'vimechanganywa, umetozwa hatua {flips} zisizotumika',

  gameLanguage: 'lugha',
  interfaceLanguage: 'kiolesura',
  dictionarySize: 'maneno {common} ya kawaida kati ya {full}',

  nerdMode: 'hali ya kitaalamu',
  rules: 'Kanuni',
  difficulty: 'ugumu',
  difficultyNames: { easy: 'rahisi', medium: 'wastani', hard: 'gumu', insane: 'kichaa' },
  tiles: 'vigae (N)',
  secondsPerTick: 'sekunde / mpigo',
  holdTicks: 'mipigo ya kusubiri',
  minWord: 'neno fupi zaidi',
  startingFlips: 'hatua za kuanzia',
  wildChance: 'nafasi ya joker',
  replaceChance: 'nafasi ya kubadilisha herufi',
  wordCompleteMode: 'neno likikamilika',
  wordCompleteNames: { shuffle: 'changanya', spend: 'tumia', keep: 'weka' },
  flipEconomy: 'uchumi wa hatua',
  flipEconomyNames: {
    none: 'hakuna',
    perLetter: 'kwa kila herufi',
    fibonacci: 'fibonacci',
    overMinimum: 'zaidi ya kima',
  },
  repeatedLetterKey: 'kitufe cha herufi inayorudiwa',
  keySchemeNames: { cycle: 'mzunguko', advance: 'mbele' },
  keySchemeHelp: {
    cycle:
      'A huchukua A inayofuata ambayo haijatumika, na zikishaingia zote katika neno, huziondoa. ' +
      'Shift+A pia huziondoa.',
    advance: 'A huchukua A inayofuata ambayo haijatumika. Shift+A huondoa kila A katika neno.',
  },

  whatThatMeans: 'Maana yake',
  factRound: 'raundi',
  factWholeBoardUp: 'ubao mzima wazi kwa',
  factRoundCosts: 'raundi moja hugharimu',
  factFlipsBuy: 'hatua za kuanzia hununua',
  factThisBoard: 'ubao huu',
  factBoardHadToAdmit: 'ubao ulipaswa kukubali',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, refu zaidi {longest}',
  wordsIncludingOneOf: '{words} pamoja na moja la {ceiling}',
  scorelessRounds: '{rounds} bila alama',

  whatAWordPays: 'Neno hulipa nini',
  columnLetters: 'herufi',
  columnCost: 'gharama',
  columnPoints: 'alama',
  columnFlips: 'hatua',
  columnNet: 'baki',

  canonicalRules: 'Kanuni za kawaida za {difficulty}.',
  customRules: 'Umebadilisha kutoka mpangilio. Alama za kanuni zako mwenyewe hazipangwi.',
  applyAndStart: 'Tumia na uanze mchezo mpya',
  changesNextGame: 'Mabadiliko yataanza kutumika mchezo ujao.',
  presets: 'Mipangilio:',

  start: 'Anza',
  restart: 'Anza upya',
  quit: 'Toka',
  quitTitle: 'Utoke katika mchezo huu?',
  restartTitle: 'Uanze mchezo huu upya?',
  restartConfirm: 'Anza upya',
  quitConfirm: 'Toka',
  keepPlaying: 'Endelea kucheza',
  personalBest: 'Michezo yako bora',
  thisGame: 'mchezo huu',
  newPersonalBest: 'Rekodi mpya yako binafsi.',
  columnRank: '#',
  notRanked: 'Kanuni zako mwenyewe, kwa hivyo mchezo huu haupangwi.',
  rankOfTotal: '{rank} kati ya {total}',

  howToPlay: 'Jinsi ya kucheza',

  backToGame: 'Rudi kwenye mchezo',
  welcomeTitle: 'Karibu Blinkered',
  tutorialSkip: 'Ruka',
  tutorialNext: 'Ifuatayo',
  tutorialBack: 'Nyuma',
  tutorialStart: 'Anza kucheza',
  tutorialHideAgain: 'Usionyeshe hii tena',
  tutorialProgress: '{n} kati ya {total}',
  tutorialSkipTitle: 'Uruke maelezo?',
  tutPickLetters: 'Gusa herufi unazotaka, kwa mpangilio, ili kuunda neno.',
  tutMoreTurn: 'Vigae vinaendelea kufunuka unapofikiri, kwa hivyo herufi bora bado inaweza kuja.',
  tutTapBack:
    'Umegusa moja usiyoitaka? Igusa tena ili kuirudisha. Yoyote kati yake, si ya mwisho tu.',
  tutComplete: 'Bonyeza Kamilisha neno likiwa tayari.',
  tutControlsTitle: 'Vitufe',
  tutReset: 'Futa huondoa neno unalounda. Vigae hubaki mahali pake.',
  tutPause: 'Simamisha husimamisha saa na kuficha ubao, ili mapumziko yasitumike kuusoma.',
  tutRestart: 'Anza upya hugawa ubao mpya kutoka mwanzo. Huuliza kwanza.',
  tutQuit: 'Toka humaliza mchezo na kuonyesha ulichopata. Huuliza kwanza.',
  tutDoneTitle: 'Huo ndio mchezo mzima',
  tutDoneBody:
    'Chagua kiwango na ucheze. Jinsi ya kucheza iko kwenye mwambaa wa kichwa ukiitaka tena.',
  htBoardTitle: 'Ubao',
  htBoardBody:
    'Vigae hufunuka kimoja baada ya kingine, kwa mpangilio wa kusoma. Kutoka vigae vilivyo wazi unaunda maneno.',
  htWordsTitle: 'Maneno',
  htWordsBody: 'Unda neno kutoka vigae vilivyo wazi kwa kuandika au kubofya herufi kwa mpangilio.',
  htFlipsTitle: 'Hatua',
  htFlipsBody:
    'Kila kigae kinachofunuka hugharimu hatua moja. Neno lililokamilika hurudisha hatua kwenye jumla yako, na maneno marefu hulipa zaidi. Hatua zikiisha, mchezo umekwisha.',
  htRoundTitle: 'Raundi',
  htRoundBody:
    'Kigae cha mwisho cha raundi kinapofunuka, ubao mzima hubaki wazi kwa muda mfupi. Kisha vigae hufunikwa na kuchanganywa, na raundi mpya huanza.',
  htLanguagesTitle: 'Lugha',
  htLanguagesBody:
    'Lugha {n}. Kila ubao unaweza kutatuliwa kwa maneno ambayo watu hutumia kweli. Neno lisilo la kawaida bado hupata alama, kama kamusi inalijua.',
  htKeysTitle: 'Kibodi',
  htWildTitle: 'Joker',
  htWildBody:
    'Wakati mwingine joker huonekana badala ya herufi. Joker huhesabiwa kama herufi yoyote inayounda neno sahihi. Neno ulilokwisha kamilisha halihesabiwi.',
  htSwapTitle: 'Herufi zinazobadilika',
  htSwapBody:
    'Wakati mwingine, kati ya raundi, herufi moja hubadilishwa na nyingine. Utaona ni herufi ipi imeondolewa na ipi imeongezwa.',
  htLevelsTitle: 'Viwango',
  htLevelEasy:
    'Herufi zile zile kumi na mbili mchezo mzima, kwa hivyo unaweza kuzijua na kubeba orodha ya maneno kichwani. Vigae hufunuka polepole, na ubao uliojaa hubaki wazi muda wa kutosha kumaliza kuchagua herufi zako.',
  htLevelMedium:
    'Mara kwa mara herufi moja hubadilika, kwa hivyo inakuwa vigumu zaidi kukumbuka maneno uliyokusudia kucheza baadaye. Muda mchache wa kuangalia, na mchache wa kufikiri.',
  htLevelHard:
    'Maneno ya herufi tatu hayahesabiwi tena, na herufi hubadilika kila raundi ya pili. Ubao unakuwa umefunuka kwa shida kabla ya kuchanganywa.',
  htLevelInsane:
    'Yote kwa pamoja, kwa kasi kamili. Ubao huchanganywa karibu mara tu baada ya hatua ya mwisho.',
  htTouchTitle: 'Skrini ya kugusa',
  htTouchBody:
    'Gusa kigae kilicho wazi ili kuchukua herufi yake. Gusa herufi yoyote uliyochukua ili kuirudisha. Kamilisha na Futa viko chini ya ubao.',

  plurals: {
    words: { one: 'neno {n}', other: 'maneno {n}' },
    rounds: { one: 'raundi {n}', other: 'raundi {n}' },
    flips: { one: 'hatua {n}', other: 'hatua {n}' },
    ticks: { one: 'mpigo {n}', other: 'mipigo {n}' },
    points: { one: 'alama {n}', other: 'alama {n}' },
  },
}
