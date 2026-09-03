import type { Messages } from '../messages.js'

/**
 * Irish. `beart` for flips, the word an Irish board game uses for a move.
 *
 * Five plural forms, and they are not five ways of saying the same thing: an Irish numeral
 * mutates the noun after it, and which mutation depends on the number. One to six lenite —
 * `trí fhocal` — seven to ten eclipse — `seacht bhfocal` — and from eleven the noun is bare
 * again. The plural forms here carry those mutations, which is why the same word is spelt three
 * ways below.
 */
export const ga: Messages = {
  tag: 'ga',

  readingDictionary: 'Ag léamh an fhoclóra…',
  noWordList: 'Níl liosta focal ann do "{language}". Cruthaigh ceann:  pnpm dictionary build',
  emptyWordList: 'Tá liosta focal "{language}" folamh.',

  flips: 'bearta',
  score: 'scór',
  words: 'focail',
  round: 'babhta',
  ticksLeftLabel: 'An t-am atá fágtha sa bhabhta seo',
  typeAWord: 'clóscríobh focal',
  tapPrompt: 'tapáil litreacha chun iad a roghnú nó a thabhairt ar ais, ansin {action}',

  boardOfTiles: 'Clár de {n} tíl',
  faceDown: 'béal faoi',
  wildCard: 'cárta fiáin',
  wildKey: 'litir ar bith',
  letterReplaced: 'rinneadh {to} de {from}',
  letterSwap: 'MALARTÚ LITREACHA!',
  spentTile: 'tíl caite',
  hiddenWhilePaused: 'i bhfolach le linn sosa',
  letterInWord: '{letter}, litir {position} den fhocal',

  completeWord: 'Críochnaigh an focal',

  completeShort: 'Críochnaigh',
  reset: 'Glan',
  pause: 'Sos',
  resume: 'Lean ar aghaidh',
  newGame: 'Cluiche nua',
  paused: 'Ar sos',
  outOfFlips: 'Bearta ídithe',
  finalResult: '{score} as {words} thar {rounds}',
  playAgain: 'Imir arís',
  share: 'Comhroinn',
  shareCopied: 'Cóipeáilte.',
  shareSelect: 'Cóipeáil é seo:',

  lettersSelect: 'roghnaíonn litreacha',
  keysWild: 'tógtar é nuair a chlóscríobhann tú litir nach bhfuil ar aon tíl',
  clearsEvery: 'glanann gach {letter} roghnaithe',
  undoLastLetter: 'cealaigh an litir dheireanach',
  noWordsYet: 'Gan focal ar bith fós.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'aimsithe cheana',
  reasonTooShort: 'róghearr',
  reasonNotAWord: 'ní focal é',
  reasonAllFound: 'tá siad go léir agat cheana',
  noSuchLetterUp: 'níl {letter} ar bith iompaithe',
  nothingUp: 'níl aon rud iompaithe',
  shuffled: 'suaite',
  shuffledAndBilled: 'suaite, gearradh {flips} gan úsáid',

  gameLanguage: 'teanga',
  interfaceLanguage: 'comhéadan',
  dictionarySize: '{common} coitianta as {full} focal',
  filterLanguages: 'Cuardaigh teanga',
  noMatches: 'Gan torthaí',

  nerdMode: 'mód na ndíograiseoirí',
  rules: 'Rialacha',
  difficulty: 'deacracht',
  difficultyNames: { easy: 'éasca', medium: 'measartha', hard: 'deacair', insane: 'mire' },
  tiles: 'tíleanna (N)',
  secondsPerTick: 'soicindí / tic',
  holdTicks: 'ticeanna coinneála',
  minWord: 'an focal is giorra',
  startingFlips: 'bearta tosaigh',
  wildChance: 'seans cárta fiáin',
  replaceChance: 'seans malartaithe litreach',
  wordCompleteMode: 'nuair a chríochnaítear focal',
  wordCompleteNames: { shuffle: 'suaith', spend: 'caith', keep: 'coinnigh' },
  flipEconomy: 'aisíoc na mbeart',
  flipEconomyNames: {
    none: 'gan aon cheann',
    perLetter: 'de réir litreach',
    fibonacci: 'fibonacci',
    overMinimum: 'os cionn an íosmhéid',
  },
  repeatedLetterKey: 'eochair na litreach athdhéanta',
  keySchemeNames: { cycle: 'timthriall', advance: 'ar aghaidh' },
  keySchemeHelp: {
    cycle:
      'Tógann A an chéad A eile nach bhfuil in úsáid, agus nuair atá siad go léir san fhocal, ' +
      'glanann sé iad. Glanann Shift+A iad freisin.',
    advance: 'Tógann A an chéad A eile nach bhfuil in úsáid. Glanann Shift+A gach A san fhocal.',
  },

  whatThatMeans: 'Cad is brí leis sin',
  factRound: 'babhta',
  factWholeBoardUp: 'an clár ar fad iompaithe ar feadh',
  factRoundCosts: 'cosnaíonn babhta',
  factFlipsBuy: 'ceannaíonn na bearta tosaigh',
  factThisBoard: 'an clár seo',
  factBoardHadToAdmit: 'bhí ar an gclár glacadh le',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, an ceann is faide {longest}',
  wordsIncludingOneOf: '{words}, ceann acu {ceiling}',
  scorelessRounds: '{rounds} gan scór',

  whatAWordPays: 'An méid a íocann focal',
  columnLetters: 'litreacha',
  columnCost: 'costas',
  columnPoints: 'pointí',
  columnFlips: 'bearta',
  columnNet: 'glan',

  canonicalRules: 'Gnáthrialacha {difficulty}.',
  customRules: 'Athraithe ón réamhshocrú. Ní chuirfear scóir faoi rialacha féin ar an liosta.',
  applyAndStart: 'Cuir i bhfeidhm agus tosaigh cluiche nua',
  changesNextGame: 'Tiocfaidh na hathruithe i bhfeidhm sa chéad chluiche eile.',
  presets: 'Réamhshocruithe:',

  start: 'Tosaigh',
  restart: 'Atosaigh',
  quit: 'Éirigh as',
  quitTitle: 'Éirí as an gcluiche seo?',
  restartTitle: 'An cluiche seo a atosú?',
  restartConfirm: 'Atosaigh',
  quitConfirm: 'Éirigh as',
  keepPlaying: 'Lean ort ag imirt',
  personalBest: 'Na cluichí is fearr agat',
  thisGame: 'an cluiche seo',
  newPersonalBest: 'Curiarracht phearsanta nua.',
  columnRank: '#',
  notRanked: 'Rialacha féin, mar sin níl an cluiche seo ar an liosta.',
  rankOfTotal: '{rank} as {total}',

  howToPlay: 'Conas imirt',

  backToGame: 'Ar ais chuig an gcluiche',
  welcomeTitle: 'Fáilte go Blinkered',
  tutorialSkip: 'Scipeáil',
  tutorialNext: 'Ar aghaidh',
  tutorialBack: 'Siar',
  tutorialStart: 'Tosaigh ag imirt',
  tutorialHideAgain: 'Ná taispeáin é seo arís',
  tutorialProgress: '{n} as {total}',
  tutorialSkipTitle: 'An turas a scipeáil?',
  tutPickLetters: 'Tapáil na litreacha atá uait, in ord, chun focal a dhéanamh.',
  tutMoreTurn:
    'Leanann na tíleanna ag iompú fad is atá tú ag machnamh, mar sin d’fhéadfadh litir níos fearr a bheith ar an mbealach.',
  tutTapBack:
    'Ar thóg tú ceann nach raibh uait? Tapáil arís í chun í a thabhairt ar ais. Ceann ar bith, ní hí an ceann deireanach amháin.',
  tutComplete: 'Brúigh Críochnaigh nuair atá an focal réidh.',
  tutControlsTitle: 'Na cnaipí',
  tutReset: 'Glanann Glan an focal atá á dhéanamh agat. Fanann na tíleanna san áit a bhfuil siad.',
  tutPause:
    'Stopann Sos an clog agus cuireann sé an clár i bhfolach, ionas nach n-úsáidfí sos chun staidéar a dhéanamh air.',
  tutRestart: 'Roinneann Atosaigh clár nua ón tús. Fiafraíonn sé ar dtús.',
  tutQuit:
    'Cuireann Éirigh as deireadh leis an gcluiche agus taispeánann sé do scór. Fiafraíonn sé ar dtús.',
  tutDoneTitle: 'Sin an cluiche ar fad',
  tutDoneBody: 'Roghnaigh leibhéal agus imir. Tá Conas imirt i gcónaí in aice leis an teideal.',
  htBoardTitle: 'An clár',
  htBoardBody:
    'Iompaítear na tíleanna ceann ar cheann, in ord léitheoireachta. Is féidir focail a dhéanamh as na cinn atá iompaithe.',
  htWordsTitle: 'Na focail',
  htWordsBody:
    'Déan focal as na tíleanna atá le feiceáil trí na litreacha a chlóscríobh nó a chliceáil in ord.',
  htFlipsTitle: 'Na bearta',
  htFlipsBody:
    'Cosnaíonn gach tíl a iompaítear beart. Tugann focal críochnaithe bearta ar ais, agus íocann focail níos faide níos mó. Nuair a ídítear na bearta, tá an cluiche thart.',
  htRoundTitle: 'An babhta',
  htRoundBody:
    'Nuair a iompaítear tíl dheireanach an bhabhta, fanann an clár ar fad ar feadh soicind. Ansin iompaítear na tíleanna agus suaitear iad, agus tosaíonn babhta nua.',
  htLanguagesTitle: 'Na teangacha',
  htLanguagesBody:
    'Tá {n} acu ann. Is féidir gach clár a réiteach le focail a úsáideann daoine i ndáiríre. Faigheann focal neamhchoitianta scór freisin, má tá aithne ag an bhfoclóir air.',
  htKeysTitle: 'An méarchlár',
  htWildTitle: 'Cártaí fiáine',
  htWildBody:
    'Uaireanta tagann cárta fiáin in ionad litreach. Comhaireamh cárta fiáin mar litir ar bith a dhéanann focal bailí. Ní chomhairtear focal atá críochnaithe cheana.',
  htSwapTitle: 'Litreacha a athraíonn',
  htSwapBody:
    'Uaireanta, idir babhtaí, cuirtear litir eile in ionad litreach. Feicfidh tú cé acu a d’imigh agus cé acu a tháinig.',
  htLevelsTitle: 'Na leibhéil',
  htLevelEasy:
    'An dá litir dhéag chéanna ar feadh an chluiche, mar sin is féidir iad a fhoghlaim agus liosta focal a iompar i do cheann. Iompaíonn na tíleanna go mall, agus fanann an clár ar fad le feiceáil fada go leor chun do rogha a chríochnú.',
  htLevelMedium:
    'Athraíonn litir anois is arís, mar sin is deacra cuimhneamh ar fhocail a cuireadh i leataobh do níos déanaí. Níos lú ama le breathnú, agus níos lú le machnamh.',
  htLevelHard:
    'Ní chomhairtear focail trí litir a thuilleadh, agus athraíonn litir gach dara babhta nach mór. Is ar éigin a bhíonn an clár le feiceáil sula suaitear é.',
  htLevelInsane:
    'Gach rud le chéile, ar luas. Suaitear an clár beagnach díreach tar éis an bhirt dheireanaigh.',
  htTouchTitle: 'An scáileán tadhaill',
  htTouchBody:
    'Tapáil tíl atá le feiceáil chun a litir a thógáil. Tapáil litir a thóg tú chun í a thabhairt ar ais. Tá Críochnaigh agus Glan faoin gclár.',

  plurals: {
    words: {
      one: '{n} fhocal',
      two: '{n} fhocal',
      few: '{n} fhocal',
      many: '{n} bhfocal',
      other: '{n} focal',
    },
    rounds: {
      one: '{n} bhabhta',
      two: '{n} bhabhta',
      few: '{n} bhabhta',
      many: '{n} mbabhta',
      other: '{n} babhta',
    },
    flips: {
      one: '{n} bheart',
      two: '{n} bheart',
      few: '{n} bheart',
      many: '{n} mbeart',
      other: '{n} beart',
    },
    ticks: {
      one: '{n} thic',
      two: '{n} thic',
      few: '{n} thic',
      many: '{n} dtic',
      other: '{n} tic',
    },
    points: {
      one: '{n} phointe',
      two: '{n} phointe',
      few: '{n} phointe',
      many: '{n} bpointe',
      other: '{n} pointe',
    },
  },
}
