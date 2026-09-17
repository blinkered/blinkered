import type { Messages } from '../messages.js'

/**
 * Tagalog. `tira` for flips, the way Dutch takes `zetten`: what a Filipino card player calls
 * the turn they are about to spend, which is what the meter counts, rather than the physical
 * turning of a tile.
 *
 * `tablero` and `piyesa` for the board and its tiles, and `komodin` for a wild card, all three
 * being what a Filipino board or card game already calls them.
 *
 * The plural forms are identical on purpose. Tagalog counts with a bare noun, so `3 salita` is
 * right and `3 mga salita` is not Tagalog.
 */
export const tl: Messages = {
  tag: 'tl',

  readingDictionary: 'Binabasa ang diksyunaryo…',
  noWordList:
    'Walang listahan ng salita para sa "{language}". Gumawa ng isa:  pnpm dictionary build',
  emptyWordList: 'Walang laman ang listahan ng salita para sa "{language}".',

  flips: 'tira',
  score: 'puntos',
  words: 'salita',
  round: 'ikot',
  ticksLeftLabel: 'Natitirang oras sa ikot na ito',
  typeAWord: 'mag-type ng salita',
  tapPrompt: 'pindutin ang mga titik para kunin o ibalik, tapos {action}',

  boardOfTiles: 'Tablero na may {n} piyesa',
  faceDown: 'nakatalikod',
  wildCard: 'komodin',
  wildKey: 'kahit anong titik',
  letterReplaced: 'naging {to} ang {from}',
  letterSwap: 'PALIT TITIK!',
  spentTile: 'gamit nang piyesa',
  hiddenWhilePaused: 'nakatago habang nakahinto',
  letterInWord: '{letter}, titik {position} ng salita',

  completeWord: 'Tapusin ang salita',

  completeShort: 'Tapusin',
  reset: 'Burahin',
  pause: 'Ihinto',
  resume: 'Ipagpatuloy',
  newGame: 'Bagong laro',
  paused: 'Nakahinto',
  outOfFlips: 'Ubos na ang tira',
  finalResult: '{score} puntos mula sa {words} sa loob ng {rounds}',
  playAgain: 'Maglaro ulit',
  share: 'Ibahagi',
  shareCopied: 'Nakopya na.',
  shareSelect: 'Kopyahin ito:',

  lettersSelect: 'pumipili ng titik',
  keysWild: 'nakukuha kapag nag-type ka ng titik na wala sa kahit anong piyesa',
  clearsEvery: 'binubura lahat ng napiling {letter}',
  undoLastLetter: 'ibalik ang huling titik',
  noWordsYet: 'Wala pang salita.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'nahanap na',
  reasonTooShort: 'masyadong maikli',
  reasonNotAWord: 'hindi salita',
  reasonAllFound: 'nakuha mo na silang lahat',
  noSuchLetterUp: 'walang bukas na {letter}',
  nothingUp: 'hindi bukas',
  shuffled: 'binalasa',
  shuffledAndBilled: 'binalasa, siningil ang {flips} na hindi nagamit',

  gameLanguage: 'wika',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} karaniwan sa {full} salita',
  filterLanguages: 'Maghanap ng wika',
  noMatches: 'Walang tugma',

  nerdMode: 'nerd mode',
  rules: 'Mga tuntunin',
  difficulty: 'hirap',
  difficultyNames: { easy: 'madali', medium: 'katamtaman', hard: 'mahirap', insane: 'baliw' },
  tiles: 'piyesa (N)',
  secondsPerTick: 'segundo / tibok',
  holdTicks: 'tibok ng paghinto',
  minWord: 'pinakamaikling salita',
  startingFlips: 'panimulang tira',
  wildChance: 'tsansa ng komodin',
  replaceChance: 'tsansa ng palit-titik',
  wordCompleteMode: 'kapag tapos ang salita',
  wordCompleteNames: { shuffle: 'balasahin', spend: 'gamitin', keep: 'itago' },
  flipEconomy: 'ekonomiya ng tira',
  flipEconomyNames: {
    none: 'wala',
    perLetter: 'bawat titik',
    fibonacci: 'fibonacci',
    overMinimum: 'lampas sa minimum',
  },
  repeatedLetterKey: 'ulit na titik sa keyboard',
  keySchemeNames: { cycle: 'umiikot', advance: 'sumusulong' },
  keySchemeHelp: {
    cycle:
      'Kinukuha ng A ang susunod na hindi pa gamit na A, at kapag nasa salita na silang lahat, ' +
      'binubura sila nito. Bumubura rin ang Shift+A.',
    advance:
      'Kinukuha ng A ang susunod na hindi pa gamit na A. Binubura ng Shift+A ang lahat ng A sa ' +
      'salita.',
  },

  whatThatMeans: 'Ang ibig sabihin niyan',
  factRound: 'ikot',
  factWholeBoardUp: 'buong tablero bukas nang',
  factRoundCosts: 'ang halaga ng isang ikot',
  factFlipsBuy: 'nabibili ng panimulang tira',
  factThisBoard: 'ang tablerong ito',
  factBoardHadToAdmit: 'kailangang tanggapin ng tablero',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, pinakamahaba {longest}',
  wordsIncludingOneOf: '{words} kasama ang isa sa {ceiling}',
  scorelessRounds: '{rounds} na walang puntos',

  whatAWordPays: 'Kung magkano ang isang salita',
  columnLetters: 'titik',
  columnCost: 'halaga',
  columnPoints: 'puntos',
  columnFlips: 'tira',
  columnNet: 'neto',

  canonicalRules: 'Karaniwang tuntunin ng {difficulty}.',
  customRules: 'Binago mula sa preset. Hindi ipapasok sa ranggo ang puntos sa sariling tuntunin.',
  applyAndStart: 'Ilapat at magsimula ng bagong laro',
  changesNextGame: 'Sa susunod na laro magkakabisa ang mga pagbabago.',
  presets: 'Mga preset:',

  start: 'Simulan',
  restart: 'Simulan muli',
  quit: 'Umalis',
  quitTitle: 'Aalis na sa larong ito?',
  restartTitle: 'Sisimulan muli ang larong ito?',
  restartConfirm: 'Simulan muli',
  quitConfirm: 'Umalis',
  keepPlaying: 'Magpatuloy sa paglalaro',
  personalBest: 'Ang pinakamagaling mong laro',
  thisGame: 'ang larong ito',
  newPersonalBest: 'Bagong personal na rekord.',
  columnRank: '#',
  notRanked: 'Sariling tuntunin, kaya hindi nararanggo ang larong ito.',
  rankOfTotal: '{rank} sa {total}',

  howToPlay: 'Paano maglaro',

  backToGame: 'Balik sa laro',
  welcomeTitle: 'Maligayang pagdating sa Blinkered',
  tutorialSkip: 'Laktawan',
  tutorialNext: 'Susunod',
  tutorialBack: 'Balik',
  tutorialStart: 'Simulang maglaro',
  tutorialHideAgain: 'Huwag nang ipakita ito',
  tutorialProgress: '{n} sa {total}',
  tutorialSkipTitle: 'Laktawan ang paglilibot?',
  tutPickLetters: 'Pindutin ang mga titik na gusto mo, sunod-sunod, para bumuo ng salita.',
  tutMoreTurn:
    'Patuloy na bumubukas ang mga piyesa habang nag-iisip ka, kaya baka may mas magandang titik ' +
    'pang darating.',
  tutTapBack:
    'May napindot kang ayaw mo? Pindutin ulit para ibalik. Kahit alin, hindi lang ang huli.',
  tutComplete: 'Pindutin ang Tapusin kapag handa na ang salita.',
  tutControlsTitle: 'Ang mga pindutan',
  tutReset: 'Binubura ng Burahin ang salitang binubuo mo. Nananatili sa lugar nila ang mga piyesa.',
  tutPause:
    'Hinihinto ng Ihinto ang orasan at itinatago ang tablero, para hindi magamit ang pahinga sa ' +
    'pag-aaral nito.',
  tutRestart: 'Nagbibigay ang Simulan muli ng bagong tablero mula sa umpisa. Nagtatanong muna.',
  tutQuit: 'Tinatapos ng Umalis ang laro at ipinapakita ang puntos mo. Nagtatanong muna.',
  tutDoneTitle: 'Iyan na ang buong laro',
  tutDoneBody:
    'Pumili ng antas at maglaro. Nasa title bar palagi ang Paano maglaro kung kailanganin mo ulit.',
  htBoardTitle: 'Ang tablero',
  htBoardBody:
    'Isa-isang bumubukas ang mga piyesa, sunod sa daloy ng pagbasa. Mula sa mga bukas na piyesa ka bumubuo ng salita.',
  htWordsTitle: 'Ang mga salita',
  htWordsBody:
    'Bumuo ng salita mula sa mga bukas na piyesa sa pamamagitan ng pag-type o pag-click sa mga titik nang sunod-sunod.',
  htFlipsTitle: 'Ang mga tira',
  htFlipsBody:
    'Bawat piyesang bumubukas ay nagkakahalaga ng isang tira. Ang natapos na salita ay nagdaragdag ng tira sa kabuuan mo, at mas malaki ang bayad ng mahahabang salita. Kapag naubos ang tira, tapos na ang laro.',
  htRoundTitle: 'Ang ikot',
  htRoundBody:
    'Kapag bumukas ang huling piyesa ng isang ikot, sandaling nananatiling bukas ang buong tablero. Pagkatapos ay itataob at babalasahin ang mga piyesa, at magsisimula ang bagong ikot.',
  htLanguagesTitle: 'Ang mga wika',
  htLanguagesBody:
    '{n}. Nalulutas ang bawat tablero gamit ang mga salitang talagang ginagamit ng tao. May puntos pa rin ang bihirang salita, kung kilala ito ng diksyunaryo.',
  htKeysTitle: 'Ang keyboard',
  htWildTitle: 'Mga komodin',
  htWildBody:
    'Minsan may lalabas na komodin sa halip na titik. Ang komodin ay katumbas ng kahit anong titik na bumubuo ng tamang salita. Hindi bilang ang salitang natapos mo na dati.',
  htSwapTitle: 'Pagpapalit ng titik',
  htSwapBody:
    'Minsan, sa pagitan ng mga ikot, may isang titik na napapalitan ng iba. Makikita mo kung aling titik ang inalis at kung alin ang idinagdag.',
  htLevelsTitle: 'Ang mga antas',
  htLevelEasy:
    'Iisang labindalawang titik sa buong laro, kaya kabisado mo sila at makakapag-isip ka ng listahan ng salita sa ulo mo. Mabagal bumukas ang mga piyesa, at matagal-tagal nananatiling nakikita ang punong tablero para matapos mong pumili ng titik.',
  htLevelMedium:
    'Paminsan-minsan ay nagbabago ang isang titik, kaya mas mahirap tandaan ang mga salitang balak mong laruin mamaya. Mas kaunting oras para tumingin, at mas kaunti para mag-isip.',
  htLevelHard:
    'Hindi na bilang ang mga salitang tatlong titik, at halos tuwing ikalawang ikot ay may nagbabagong titik. Kabubukas pa lang ng tablero ay babalasahin na ito.',
  htLevelInsane:
    'Lahat nang sabay-sabay, sa buong bilis. Halos kaagad pagkatapos ng huling tira ay binabalasa na ang tablero.',
  htTouchTitle: 'Ang touchscreen',
  htTouchBody:
    'Pindutin ang bukas na piyesa para kunin ang titik nito. Pindutin ang kahit anong titik na nakuha mo para ibalik ito. Nasa ilalim ng tablero ang Tapusin at Burahin.',

  accountTitle: 'Ang account mo',
  menuProfile: 'Profile ko',
  menuGames: 'Mga laro ko',
  menuPublicPage: 'Pampublikong pahina ko',
  menuSignedInAs: 'Naka-sign in bilang',
  signIn: 'Mag-sign in',
  signOut: 'Mag-sign out',
  signInTitle: 'Mag-sign in o mag-sign up',
  signInLead: 'Itinatago ng account ang mga laro mo, sa kahit anong device.',
  signInKeepGame: 'Mag-sign in para manatili ang larong ito, at lahat ng susunod.',
  continueWithApple: 'Magpatuloy gamit ang Apple',
  continueWithGoogle: 'Magpatuloy gamit ang Google',
  signInOr: 'o',
  emailLabel: 'Email',
  codeLabel: 'Code',
  emailMeACode: 'Padalhan ako ng code',
  working: 'Sandali lang…',
  sendNewCode: 'Magpadala ng bagong code',
  codeSent: 'Tingnan ang email mo. Tumatagal ang code nang 10 minuto.',
  notNow: 'Hindi muna',
  badEmail: 'Mukhang hindi ito email address.',
  badCode:
    'Hindi gumana ang code. Nag-e-expire ang mga code pagkalipas ng 10 minuto at minsan lang magagamit.',
  serverBusy: 'Hindi maabot ang server. Subukan ulit mamaya.',
  serverDown: 'Hindi maabot ang server.',
  offline: 'Walang koneksyon',
  leaderboardTitle: 'Talaan ng Nangunguna',
  leaderboardEmpty: 'Wala pang laro sa talaang ito. Maging una ka.',
  leaderboardWouldBe: 'Saan mapupunta ang larong ito',
  leaderboardThisGame: 'Ang larong ito',
  tutAccountBody:
    'Ang account ay nag-iingat ng mga laro mo, naglalagay ng puntos mo sa talaan, at nag-iingat ng profile mo.',
  ssoCancelled: 'Kinansela ang pag-sign in.',
  ssoExpired: 'Masyadong natagalan. Mag-sign in ulit.',
  ssoNoUsername: 'Hindi natapos gawin ang account. Subukan ulit mamaya.',
  ssoFailed: 'Hindi gumana. Subukan ulit, o gamitin ang email mo.',
  tabProfile: 'Profile',
  countryAny: 'Ayaw sabihin',
  findCountry: 'Maghanap ng bansa',
  usernameLabel: 'Username',
  bioLabel: 'Tungkol sa akin',
  countryLabel: 'Bansa',
  bioHint: 'Walang link. {left}/{max}',
  save: 'I-save',
  saving: 'Sine-save…',
  saved: 'Na-save.',
  nameTaken: 'May gumagamit na ng pangalang iyan.',
  nameTooShort: 'Pahabaan nang kaunti.',
  nameTooLong: 'Masyadong mahaba.',
  nameBadCharacters: 'Letra, numero, gitling at underscore lang.',
  nameBadEdges: 'Dapat magsimula at magtapos sa letra o numero.',
  nameMixedScripts: 'Pumili ng isang alpabeto at manatili roon.',
  nameReserved: 'Mukhang pangalang kami mismo ang nagbibigay. Pumili ng iba.',
  nameUnusable: 'Hindi magagamit ang pangalang iyan.',
  bioTooLong: 'Hanggang {max} karakter lang ito.',
  bioHasLink: 'Bawal ang link dito.',
  bioHasControl: 'May mga karakter na hindi kasya dito.',
  bioUnusable: 'Hindi magagamit ang tekstong iyan.',
  gamesHeading: 'Mga laro',
  gamesEmpty: 'Wala pa rito. Lalabas dito ang mga larong nilaro mo habang naka-sign in.',
  gamesEmptyShort: 'Wala pa rito.',
  gamesLoading: 'Binabasa ang mga laro mo…',
  theirGamesLoading: 'Binabasa ang mga laro nila…',
  profileLoading: 'Binabasa ang profile…',
  playerNotFound: 'Walang tao rito na ganyan ang pangalan.',
  columnWhen: 'Kailan',
  columnRounds: 'ikot',
  columnGame: 'Laro',
  gameLoading: 'Binabasa ang laro…',
  gameUnreadable: 'Hindi nabasa ang larong ito.',
  gameNotRanked: 'Nilaro sa binagong patakaran, kaya hindi ito nakaranggo.',
  detailNotKept: 'Hindi na iniingatan ang mga salita at board ng larong ito.',
  openingBoard: 'Ang panimulang board',
  roundByRound: 'Bawat round',
  roundNothing: 'walang nakita',
  changeReplaced: '{letter} pinalitan sa puwang {slot}',
  changeWildOn: '{letter} naging wild sa puwang {slot}',
  changeWildOff: '{letter} nawala ang wild sa puwang {slot}',
  keepThisGame: 'Itago ang larong ito',
  savedToYourGames: 'Na-save sa mga laro mo.',

  reportThis: 'Iulat',
  reportHeading: 'Iulat ito',
  reportTheName: 'Ang pangalan',
  reportTheBio: 'Ang bio',
  reportTheScore: 'Ang puntos',
  reportWhy: 'Ano ang mali dito? Opsyonal.',
  reportSend: 'Ipadala ang ulat',
  reportSent: 'Salamat. May titingin dito.',
  reportSignIn: 'Mag-sign in para makapag-ulat.',
  reportGone: 'Wala na iyon.',
  reportCancel: 'Kanselahin',

  deleteAccount: 'Burahin ang aking account',
  deleteAccountWhat:
    'Aalisin nito ang iyong profile at lahat ng laro na iyong itinago, tuluyan. Hindi na ito maibabalik.',
  deleteAccountAsk: 'Padalhan ako ng code',
  deleteConfirm: 'Burahin nang tuluyan',
  deleteGone: 'Wala na ang account mo. Salamat sa paglalaro.',
  deleteNoAddress:
    'Walang nakumpirmang address sa account na ito, kaya hindi masusuri ang pagbura. Makipag-ugnayan sa amin at gagawin namin ito nang manu-mano.',

  plurals: {
    words: { one: '{n} salita', other: '{n} salita' },
    rounds: { one: '{n} ikot', other: '{n} ikot' },
    flips: { one: '{n} tira', other: '{n} tira' },
    ticks: { one: '{n} tibok', other: '{n} tibok' },
    points: { one: '{n} puntos', other: '{n} puntos' },
  },
}
