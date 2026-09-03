import type { Messages } from '../messages.js'

/**
 * Welsh. `symudiad` for flips, the word a Welsh board game uses for a move.
 *
 * Welsh has six CLDR plural forms, more than anything else here: separate ones for one, two,
 * three and six, which are genuinely different words rather than a technicality — `dau air`,
 * `tri gair`, `chwe gair`. The initial consonant mutates after some of them, which is why
 * `gair` appears as `air` after `dau`.
 */
export const cy: Messages = {
  tag: 'cy',

  readingDictionary: 'Yn darllen y geiriadur…',
  noWordList: 'Dim rhestr eiriau ar gyfer "{language}". Lluniwch un:  pnpm dictionary build',
  emptyWordList: 'Mae rhestr eiriau "{language}" yn wag.',

  flips: 'symudiadau',
  score: 'sgôr',
  words: 'geiriau',
  round: 'rownd',
  ticksLeftLabel: 'Amser sydd ar ôl yn y rownd hon',
  typeAWord: 'teipiwch air',
  tapPrompt: 'tapiwch lythrennau i’w dewis neu eu dychwelyd, yna {action}',

  boardOfTiles: 'Bwrdd o {n} teilsen',
  faceDown: 'wyneb i waered',
  wildCard: 'cerdyn gwyllt',
  wildKey: 'unrhyw lythyren',
  letterReplaced: 'daeth {from} yn {to}',
  letterSwap: 'CYFNEWID LLYTHRENNAU!',
  spentTile: 'teilsen wedi’i defnyddio',
  hiddenWhilePaused: 'wedi’i guddio tra bo saib',
  letterInWord: '{letter}, llythyren {position} y gair',

  completeWord: 'Cwblhau’r gair',

  completeShort: 'Cwblhau',
  reset: 'Clirio',
  pause: 'Saib',
  resume: 'Ailddechrau',
  newGame: 'Gêm newydd',
  paused: 'Ar saib',
  outOfFlips: 'Dim symudiadau ar ôl',
  finalResult: '{score} am {words} dros {rounds}',
  playAgain: 'Chwarae eto',
  share: 'Rhannu',
  shareCopied: 'Wedi copïo.',
  shareSelect: 'Copïwch hyn:',

  lettersSelect: 'llythrennau’n dewis',
  keysWild: 'fe’i cymerir pan deipiwch lythyren nad oes teilsen yn ei dangos',
  clearsEvery: 'yn clirio pob {letter} a ddewiswyd',
  undoLastLetter: 'dadwneud y llythyren olaf',
  noWordsYet: 'Dim geiriau eto.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'wedi’i ganfod eisoes',
  reasonTooShort: 'rhy fyr',
  reasonNotAWord: 'nid yw’n air',
  reasonAllFound: 'mae gennych bob un ohonynt',
  noSuchLetterUp: 'dim {letter} yn y golwg',
  nothingUp: 'dim yn y golwg',
  shuffled: 'wedi’i gymysgu',
  shuffledAndBilled: 'wedi’i gymysgu, codwyd {flips} heb eu defnyddio',

  gameLanguage: 'iaith',
  interfaceLanguage: 'rhyngwyneb',
  dictionarySize: '{common} cyffredin o {full} gair',
  filterLanguages: 'Chwilio am iaith',
  noMatches: 'Dim canlyniadau',

  nerdMode: 'modd y selogion',
  rules: 'Rheolau',
  difficulty: 'anhawster',
  difficultyNames: { easy: 'hawdd', medium: 'canolig', hard: 'anodd', insane: 'gwallgof' },
  tiles: 'teils (N)',
  secondsPerTick: 'eiliadau / tic',
  holdTicks: 'ticiau dal',
  minWord: 'gair byrraf',
  startingFlips: 'symudiadau cychwynnol',
  wildChance: 'siawns cerdyn gwyllt',
  replaceChance: 'siawns cyfnewid llythyren',
  wordCompleteMode: 'wrth gwblhau gair',
  wordCompleteNames: { shuffle: 'cymysgu', spend: 'gwario', keep: 'cadw' },
  flipEconomy: 'dychwelyd symudiadau',
  flipEconomyNames: {
    none: 'dim',
    perLetter: 'fesul llythyren',
    fibonacci: 'fibonacci',
    overMinimum: 'dros y lleiafswm',
  },
  repeatedLetterKey: 'bysell llythyren ailadroddus',
  keySchemeNames: { cycle: 'cylch', advance: 'ymlaen' },
  keySchemeHelp: {
    cycle:
      'Mae A yn cymryd yr A nesaf sydd heb ei defnyddio, a phan fyddant i gyd yn y gair, ' +
      'mae’n eu clirio. Mae Shift+A yn eu clirio hefyd.',
    advance:
      'Mae A yn cymryd yr A nesaf sydd heb ei defnyddio. Mae Shift+A yn clirio pob A o’r gair.',
  },

  whatThatMeans: 'Beth mae hynny’n ei olygu',
  factRound: 'rownd',
  factWholeBoardUp: 'y bwrdd cyfan yn y golwg am',
  factRoundCosts: 'mae rownd yn costio',
  factFlipsBuy: 'mae’r symudiadau cychwynnol yn prynu',
  factThisBoard: 'y bwrdd hwn',
  factBoardHadToAdmit: 'roedd rhaid i’r bwrdd dderbyn',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, yr hiraf {longest}',
  wordsIncludingOneOf: '{words}, gan gynnwys un o {ceiling}',
  scorelessRounds: '{rounds} heb sgôr',

  whatAWordPays: 'Beth mae gair yn ei dalu',
  columnLetters: 'llythrennau',
  columnCost: 'cost',
  columnPoints: 'pwyntiau',
  columnFlips: 'symudiadau',
  columnNet: 'net',

  canonicalRules: 'Rheolau arferol {difficulty}.',
  customRules: 'Wedi newid o’r rhagosodiad. Ni chaiff sgorau dan reolau eich hun eu rhestru.',
  applyAndStart: 'Gosod a dechrau gêm newydd',
  changesNextGame: 'Daw’r newidiadau i rym yn y gêm nesaf.',
  presets: 'Rhagosodiadau:',

  start: 'Dechrau',
  restart: 'Ailddechrau',
  quit: 'Gadael',
  quitTitle: 'Gadael y gêm hon?',
  restartTitle: 'Ailddechrau’r gêm hon?',
  restartConfirm: 'Ailddechrau',
  quitConfirm: 'Gadael',
  keepPlaying: 'Dal ati i chwarae',
  personalBest: 'Eich gemau gorau',
  thisGame: 'y gêm hon',
  newPersonalBest: 'Record bersonol newydd.',
  columnRank: '#',
  notRanked: 'Rheolau eich hun, felly ni chaiff y gêm hon ei rhestru.',
  rankOfTotal: '{rank} o {total}',

  howToPlay: 'Sut i chwarae',

  backToGame: 'Yn ôl at y gêm',
  welcomeTitle: 'Croeso i Blinkered',
  tutorialSkip: 'Hepgor',
  tutorialNext: 'Nesaf',
  tutorialBack: 'Yn ôl',
  tutorialStart: 'Dechrau chwarae',
  tutorialHideAgain: 'Peidiwch â dangos hyn eto',
  tutorialProgress: '{n} o {total}',
  tutorialSkipTitle: 'Hepgor y cyflwyniad?',
  tutPickLetters: 'Tapiwch y llythrennau rydych eu heisiau, yn eu trefn, i ffurfio gair.',
  tutMoreTurn:
    'Mae’r teils yn dal i droi tra byddwch yn meddwl, felly gall llythyren well fod ar ei ffordd.',
  tutTapBack:
    'Wedi cymryd un nad oeddech ei heisiau? Tapiwch hi eto i’w dychwelyd. Unrhyw un, nid yr olaf yn unig.',
  tutComplete: 'Pwyswch Cwblhau pan fydd y gair yn barod.',
  tutControlsTitle: 'Y botymau',
  tutReset: 'Mae Clirio yn dileu’r gair rydych yn ei ffurfio. Mae’r teils yn aros lle maent.',
  tutPause:
    'Mae Saib yn stopio’r cloc ac yn cuddio’r bwrdd, fel na ellir defnyddio egwyl i’w astudio.',
  tutRestart: 'Mae Ailddechrau yn delio bwrdd newydd o’r dechrau. Mae’n gofyn yn gyntaf.',
  tutQuit: 'Mae Gadael yn gorffen y gêm ac yn dangos eich sgôr. Mae’n gofyn yn gyntaf.',
  tutDoneTitle: 'Dyna’r gêm i gyd',
  tutDoneBody: 'Dewiswch lefel a chwaraewch. Mae Sut i chwarae bob amser wrth y teitl.',
  htBoardTitle: 'Y bwrdd',
  htBoardBody:
    'Mae’r teils yn troi fesul un, yn nhrefn darllen. Gellir defnyddio’r rhai sydd yn y golwg i ffurfio geiriau.',
  htWordsTitle: 'Y geiriau',
  htWordsBody:
    'Ffurfiwch air o’r teils sydd yn y golwg drwy deipio neu glicio’r llythrennau yn eu trefn.',
  htFlipsTitle: 'Y symudiadau',
  htFlipsBody:
    'Mae pob teilsen sy’n troi yn costio symudiad. Mae gair cyflawn yn dychwelyd symudiadau, ac mae geiriau hirach yn talu mwy. Pan fydd y symudiadau’n dod i ben, mae’r gêm ar ben.',
  htRoundTitle: 'Y rownd',
  htRoundBody:
    'Pan fydd teilsen olaf y rownd yn troi, mae’r bwrdd cyfan yn aros am eiliad. Yna caiff y teils eu troi drosodd a’u cymysgu, ac mae rownd newydd yn dechrau.',
  htLanguagesTitle: 'Yr ieithoedd',
  htLanguagesBody:
    'Mae {n} ohonynt. Gellir datrys pob bwrdd â geiriau y mae pobl yn eu defnyddio go iawn. Mae gair anghyffredin yn sgorio hefyd, os yw’r geiriadur yn ei adnabod.',
  htKeysTitle: 'Y bysellfwrdd',
  htWildTitle: 'Cardiau gwyllt',
  htWildBody:
    'Weithiau daw cerdyn gwyllt yn lle llythyren. Mae cerdyn gwyllt yn cyfrif fel unrhyw lythyren sy’n gwneud gair dilys. Nid yw gair a gwblhawyd eisoes yn cyfrif.',
  htSwapTitle: 'Llythrennau’n newid',
  htSwapBody:
    'Weithiau, rhwng rowndiau, caiff un llythyren ei disodli gan un arall. Cewch weld pa un a aeth a pha un a ddaeth.',
  htLevelsTitle: 'Y lefelau',
  htLevelEasy:
    'Yr un deuddeg llythyren drwy’r gêm, felly gallwch eu dysgu a chario rhestr o eiriau yn eich pen. Mae’r teils yn troi’n araf, ac mae’r bwrdd cyfan yn aros yn y golwg yn ddigon hir i orffen eich dewis.',
  htLevelMedium:
    'Mae llythyren yn newid nawr ac yn y man, felly mae’n anos cofio geiriau a gadwyd at nes ymlaen. Llai o amser i edrych, a llai i feddwl.',
  htLevelHard:
    'Nid yw geiriau tair llythyren yn cyfrif mwyach, ac mae llythyren yn newid bob yn ail rownd, fwy neu lai. Prin y mae’r bwrdd wedi ymddangos cyn iddo gymysgu.',
  htLevelInsane:
    'Popeth ar unwaith, ar garlam. Mae’r bwrdd yn cymysgu bron yn syth ar ôl y symudiad olaf.',
  htTouchTitle: 'Y sgrin gyffwrdd',
  htTouchBody:
    'Tapiwch deilsen sydd yn y golwg i gymryd ei llythyren. Tapiwch lythyren a gymerwyd i’w dychwelyd. Mae Cwblhau a Clirio o dan y bwrdd.',

  plurals: {
    words: {
      zero: '{n} gair',
      one: '{n} gair',
      two: '{n} air',
      few: '{n} gair',
      many: '{n} gair',
      other: '{n} gair',
    },
    rounds: {
      zero: '{n} rownd',
      one: '{n} rownd',
      two: '{n} rownd',
      few: '{n} rownd',
      many: '{n} rownd',
      other: '{n} rownd',
    },
    flips: {
      zero: '{n} symudiad',
      one: '{n} symudiad',
      two: '{n} symudiad',
      few: '{n} symudiad',
      many: '{n} symudiad',
      other: '{n} symudiad',
    },
    ticks: {
      zero: '{n} tic',
      one: '{n} tic',
      two: '{n} dic',
      few: '{n} tic',
      many: '{n} tic',
      other: '{n} tic',
    },
    points: {
      zero: '{n} pwynt',
      one: '{n} pwynt',
      two: '{n} bwynt',
      few: '{n} phwynt',
      many: '{n} phwynt',
      other: '{n} pwynt',
    },
  },
}
