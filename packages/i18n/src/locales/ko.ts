import type { Messages } from '../messages.js'

/**
 * Korean. `수` for flips, which is the word a Korean board game already uses for a move: the
 * thing you spend, which is what the meter counts. `타일` for tiles and `판` for the board.
 *
 * Korean has one plural form and no agreement, so every count here is written with the counter
 * the noun takes — 단어 3개, 5수, 2점 — rather than with a plural.
 */
export const ko: Messages = {
  tag: 'ko',

  readingDictionary: '사전을 읽는 중…',
  noWordList: '"{language}" 단어 목록이 없습니다. 하나 만드세요:  pnpm dictionary build',
  emptyWordList: '"{language}" 단어 목록이 비어 있습니다.',

  flips: '수',
  score: '점수',
  words: '단어',
  round: '라운드',
  ticksLeftLabel: '이번 라운드에 남은 시간',
  typeAWord: '단어를 입력하세요',
  tapPrompt: '글자를 눌러 고르거나 되돌린 뒤 {action}',

  boardOfTiles: '타일 {n}개의 판',
  faceDown: '뒤집힘',
  wildCard: '조커',
  wildKey: '아무 글자나',
  letterReplaced: '{from}이(가) {to}(으)로 바뀌었습니다',
  letterSwap: '글자 교체!',
  spentTile: '사용한 타일',
  hiddenWhilePaused: '일시정지 중에는 가려집니다',
  letterInWord: '{letter}, 단어의 {position}번째 글자',

  completeWord: '단어 완성',

  completeShort: '완성',
  reset: '지우기',
  pause: '일시정지',
  resume: '계속',
  newGame: '새 게임',
  paused: '일시정지됨',
  outOfFlips: '수가 떨어졌습니다',
  finalResult: '{rounds} 동안 {words}로 {score}점',
  playAgain: '다시 하기',
  share: '공유',
  shareCopied: '복사했습니다.',
  shareSelect: '이것을 복사하세요:',

  lettersSelect: '글자로 고릅니다',
  keysWild: '어떤 타일에도 없는 글자를 입력하면 가져갑니다',
  clearsEvery: '선택한 {letter}를 모두 지웁니다',
  undoLastLetter: '마지막 글자 되돌리기',
  noWordsYet: '아직 단어가 없습니다.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: '이미 찾았습니다',
  reasonTooShort: '너무 짧습니다',
  reasonNotAWord: '단어가 아닙니다',
  reasonAllFound: '이미 전부 찾았습니다',
  noSuchLetterUp: '열린 {letter}이(가) 없습니다',
  nothingUp: '열리지 않았습니다',
  shuffled: '섞었습니다',
  shuffledAndBilled: '섞었고, 쓰지 않은 {flips}를 청구했습니다',

  gameLanguage: '언어',
  interfaceLanguage: '화면',
  dictionarySize: '{full}개 중 일상 단어 {common}개',
  filterLanguages: '언어 검색',
  noMatches: '결과 없음',

  nerdMode: '너드 모드',
  rules: '규칙',
  difficulty: '난이도',
  difficultyNames: { easy: '쉬움', medium: '보통', hard: '어려움', insane: '미친' },
  tiles: '타일 (N)',
  secondsPerTick: '초 / 박자',
  holdTicks: '멈춤 박자',
  minWord: '가장 짧은 단어',
  startingFlips: '시작 수',
  wildChance: '조커 확률',
  replaceChance: '글자 교체 확률',
  wordCompleteMode: '단어를 완성하면',
  wordCompleteNames: { shuffle: '섞기', spend: '사용', keep: '유지' },
  flipEconomy: '수 경제',
  flipEconomyNames: {
    none: '없음',
    perLetter: '글자마다',
    fibonacci: '피보나치',
    overMinimum: '최소 초과분',
  },
  repeatedLetterKey: '같은 글자 키',
  keySchemeNames: { cycle: '순환', advance: '전진' },
  keySchemeHelp: {
    cycle:
      'ㄱ은 아직 쓰지 않은 다음 ㄱ을 가져오고, 모두 단어에 들어가면 지웁니다. ' +
      'Shift+ㄱ도 지웁니다.',
    advance: 'ㄱ은 아직 쓰지 않은 다음 ㄱ을 가져옵니다. Shift+ㄱ은 단어 속 ㄱ을 모두 지웁니다.',
  },

  whatThatMeans: '무슨 뜻인가',
  factRound: '라운드',
  factWholeBoardUp: '판 전체가 열려 있는 시간',
  factRoundCosts: '한 라운드의 비용',
  factFlipsBuy: '시작 수로 살 수 있는 것',
  factThisBoard: '이 판',
  factBoardHadToAdmit: '판이 받아들여야 했던 수',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, 가장 긴 것 {longest}',
  wordsIncludingOneOf: '{words}, 그중 하나는 {ceiling}',
  scorelessRounds: '{rounds} 무득점',

  whatAWordPays: '단어의 값어치',
  columnLetters: '글자',
  columnCost: '비용',
  columnPoints: '점수',
  columnFlips: '수',
  columnNet: '순이익',

  canonicalRules: '{difficulty} 기본 규칙입니다.',
  customRules: '기본값에서 바꿨습니다. 직접 정한 규칙의 점수는 순위에 오르지 않습니다.',
  applyAndStart: '적용하고 새 게임 시작',
  changesNextGame: '변경 사항은 다음 게임부터 적용됩니다.',
  presets: '기본값:',

  start: '시작',
  restart: '다시 시작',
  quit: '나가기',
  quitTitle: '이 게임에서 나갈까요?',
  restartTitle: '이 게임을 다시 시작할까요?',
  restartConfirm: '다시 시작',
  quitConfirm: '나가기',
  keepPlaying: '계속 하기',
  personalBest: '최고 기록',
  thisGame: '이 게임',
  newPersonalBest: '새로운 개인 최고 기록입니다.',
  columnRank: '#',
  notRanked: '직접 정한 규칙이라 이 게임은 순위에 오르지 않습니다.',
  rankOfTotal: '{total} 중 {rank}',

  howToPlay: '게임 방법',

  backToGame: '게임으로 돌아가기',
  welcomeTitle: 'Blinkered에 오신 것을 환영합니다',
  tutorialSkip: '건너뛰기',
  tutorialNext: '다음',
  tutorialBack: '이전',
  tutorialStart: '게임 시작',
  tutorialHideAgain: '다시 보지 않기',
  tutorialProgress: '{total} 중 {n}',
  tutorialSkipTitle: '안내를 건너뛸까요?',
  tutPickLetters: '원하는 글자를 순서대로 눌러 단어를 만드세요.',
  tutMoreTurn: '생각하는 동안에도 타일은 계속 열리니, 더 좋은 글자가 아직 나올 수 있습니다.',
  tutTapBack:
    '원하지 않은 글자를 눌렀나요? 다시 누르면 되돌아갑니다. 마지막 글자만이 아니라 어느 것이든요.',
  tutComplete: '단어가 준비되면 완성을 누르세요.',
  tutControlsTitle: '버튼',
  tutReset: '지우기는 만들던 단어를 지웁니다. 타일은 그대로 있습니다.',
  tutPause: '일시정지는 시계를 멈추고 판을 가립니다. 쉬는 동안 판을 외울 수 없게요.',
  tutRestart: '다시 시작은 처음부터 새 판을 돌립니다. 먼저 물어봅니다.',
  tutQuit: '나가기는 게임을 끝내고 점수를 보여줍니다. 먼저 물어봅니다.',
  tutDoneTitle: '이게 게임의 전부입니다',
  tutDoneBody: '난이도를 고르고 시작하세요. 게임 방법은 언제나 제목 줄에 있습니다.',
  htBoardTitle: '판',
  htBoardBody: '타일은 읽는 순서대로 하나씩 열립니다. 열린 타일로 단어를 만듭니다.',
  htWordsTitle: '단어',
  htWordsBody: '열린 타일의 글자를 순서대로 입력하거나 눌러서 단어를 만드세요.',
  htFlipsTitle: '수',
  htFlipsBody:
    '타일이 하나 열릴 때마다 한 수가 듭니다. 단어를 완성하면 수가 돌아오고, 긴 단어일수록 더 많이 돌아옵니다. 수가 떨어지면 게임이 끝납니다.',
  htRoundTitle: '라운드',
  htRoundBody:
    '라운드의 마지막 타일이 열리면 판 전체가 잠시 그대로 있습니다. 그런 다음 타일을 뒤집어 섞고 새 라운드가 시작됩니다.',
  htLanguagesTitle: '언어',
  htLanguagesBody:
    '{n}개 언어. 어떤 판이든 사람들이 실제로 쓰는 단어로 풀 수 있습니다. 드문 단어도 사전에 있으면 점수가 됩니다.',
  htKeysTitle: '키보드',
  htWildTitle: '조커',
  htWildBody:
    '가끔 글자 대신 조커가 나옵니다. 조커는 올바른 단어를 만드는 어떤 글자로도 칩니다. 이미 완성한 단어는 치지 않습니다.',
  htSwapTitle: '바뀌는 글자',
  htSwapBody:
    '가끔 라운드 사이에 글자 하나가 다른 글자로 바뀝니다. 어떤 글자가 빠지고 어떤 글자가 들어왔는지 보여줍니다.',
  htLevelsTitle: '난이도',
  htLevelEasy:
    '게임 내내 같은 열두 글자라서 외워 두고 머릿속에 단어 목록을 담아 둘 수 있습니다. 타일이 천천히 열리고, 글자를 다 고를 때까지 판 전체가 충분히 오래 보입니다.',
  htLevelMedium:
    '이따금 글자 하나가 바뀌어서 나중에 쓰려던 단어를 기억하기가 어려워집니다. 볼 시간도 생각할 시간도 줄어듭니다.',
  htLevelHard:
    '세 글자 단어는 더 이상 세지 않고, 두 라운드마다 글자가 바뀝니다. 판이 겨우 열리자마자 섞입니다.',
  htLevelInsane: '전부 한꺼번에, 최고 속도로. 마지막 수가 끝나자마자 판이 섞입니다.',
  htTouchTitle: '터치스크린',
  htTouchBody:
    '열린 타일을 눌러 글자를 가져오세요. 가져온 글자를 누르면 되돌아갑니다. 완성과 지우기는 판 아래에 있습니다.',

  plurals: {
    words: { other: '단어 {n}개' },
    rounds: { other: '{n}라운드' },
    flips: { other: '{n}수' },
    ticks: { other: '{n}박자' },
    points: { other: '{n}점' },
  },
}
