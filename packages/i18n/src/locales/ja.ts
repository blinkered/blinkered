import type { Messages } from '../messages.js'

/**
 * Japanese. `手` for flips, which is the word a Japanese board game already uses for a move.
 * `もじ` for tiles, after もじぴったん, and `盤` for the board.
 *
 * The interface is ordinary Japanese, kanji and all. Only the tiles are kana, and only because
 * a board cannot deal two thousand kanji.
 *
 * `htBoardBody` carries a sentence the other locales have no need of: on the board, voicing and
 * kana size are not distinctions, so は is played as ば and つ as っ. That is how もじぴったん
 * and every kana crossword work, but a player who has not been told will think the game is
 * broken the first time it refuses がっこう and accepts かつこう.
 */
export const ja: Messages = {
  tag: 'ja',

  readingDictionary: '辞書を読み込んでいます…',
  noWordList: '「{language}」の単語リストがありません。作成してください:  pnpm dictionary build',
  emptyWordList: '「{language}」の単語リストが空です。',

  flips: '手',
  score: '得点',
  words: '単語',
  round: 'ラウンド',
  ticksLeftLabel: 'このラウンドの残り時間',
  typeAWord: '単語を入力',
  tapPrompt: 'もじをタップして選ぶか戻し、それから{action}',

  boardOfTiles: 'もじ{n}枚の盤',
  faceDown: '裏向き',
  wildCard: 'ジョーカー',
  wildKey: 'どのもじでも',
  letterReplaced: '{from}が{to}になりました',
  letterSwap: 'もじが入れ替わった！',
  spentTile: '使用済みのもじ',
  hiddenWhilePaused: '一時停止中は隠されます',
  letterInWord: '{letter}、単語の{position}番目',

  completeWord: '単語を完成',

  completeShort: '完成',
  reset: 'クリア',
  pause: '一時停止',
  resume: '再開',
  newGame: '新しいゲーム',
  paused: '一時停止中',
  outOfFlips: '手がなくなりました',
  finalResult: '{rounds}で{words}、{score}',
  playAgain: 'もう一度遊ぶ',
  share: '共有',
  shareCopied: 'コピーしました。',
  shareSelect: 'これをコピー:',

  lettersSelect: 'もじを選ぶ',
  keysWild: 'どのもじにもない字を入力すると取られます',
  clearsEvery: '選んだ{letter}をすべて消す',
  undoLastLetter: '最後のもじを戻す',
  noWordsYet: 'まだ単語がありません。',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'もう見つけています',
  reasonTooShort: '短すぎます',
  reasonNotAWord: '単語ではありません',
  reasonAllFound: 'すべて見つけています',
  noSuchLetterUp: '表になった{letter}がありません',
  nothingUp: '表になっていません',
  shuffled: 'シャッフルしました',
  shuffledAndBilled: 'シャッフルしました。使わなかった{flips}を差し引きます',

  gameLanguage: '言語',
  interfaceLanguage: '表示',
  dictionarySize: '{full}語のうち日常語{common}語',

  nerdMode: 'マニアモード',
  rules: 'ルール',
  difficulty: '難易度',
  difficultyNames: {
    easy: 'やさしい',
    medium: 'ふつう',
    hard: 'むずかしい',
    insane: 'むちゃくちゃ',
  },
  tiles: 'もじ (N)',
  secondsPerTick: '秒 / 拍',
  holdTicks: '停止の拍',
  minWord: '最短の単語',
  startingFlips: '開始時の手',
  wildChance: 'ジョーカーの確率',
  replaceChance: 'もじが入れ替わる確率',
  wordCompleteMode: '単語が完成したら',
  wordCompleteNames: { shuffle: 'シャッフル', spend: '使う', keep: '残す' },
  flipEconomy: '手の増え方',
  flipEconomyNames: {
    none: 'なし',
    perLetter: 'もじごと',
    fibonacci: 'フィボナッチ',
    overMinimum: '最短を超えた分',
  },
  repeatedLetterKey: '同じもじのキー',
  keySchemeNames: { cycle: '巡回', advance: '前進' },
  keySchemeHelp: {
    cycle: 'あを押すと未使用のあを次々に取り、すべて単語に入ると消えます。Shift+あでも消えます。',
    advance: 'あを押すと未使用のあを次に取ります。Shift+あは単語の中のあをすべて消します。',
  },

  whatThatMeans: 'その意味',
  factRound: 'ラウンド',
  factWholeBoardUp: '盤全体が見えている時間',
  factRoundCosts: '1ラウンドの費用',
  factFlipsBuy: '開始時の手で買えるもの',
  factThisBoard: 'この盤',
  factBoardHadToAdmit: '盤が満たすべき語数',
  ticksAndSeconds: '{ticks}、{seconds}',
  wordsLongest: '{words}、最長{longest}',
  wordsIncludingOneOf: '{words}、うち1つは{ceiling}',
  scorelessRounds: '{rounds}が無得点',

  whatAWordPays: '単語の値打ち',
  columnLetters: 'もじ',
  columnCost: '費用',
  columnPoints: '得点',
  columnFlips: '手',
  columnNet: '差引',

  canonicalRules: '{difficulty}の標準ルールです。',
  customRules: '既定から変更されています。独自ルールの得点は順位に入りません。',
  applyAndStart: '適用して新しいゲームを開始',
  changesNextGame: '変更は次のゲームから有効になります。',
  presets: '既定:',

  start: 'はじめる',
  restart: 'やり直す',
  quit: 'やめる',
  quitTitle: 'このゲームをやめますか？',
  restartTitle: 'このゲームをやり直しますか？',
  restartConfirm: 'やり直す',
  quitConfirm: 'やめる',
  keepPlaying: '続ける',
  personalBest: 'あなたの最高記録',
  thisGame: 'このゲーム',
  newPersonalBest: '自己ベストを更新しました。',
  columnRank: '#',
  notRanked: '独自ルールのため、このゲームは順位に入りません。',
  rankOfTotal: '{total}中{rank}',

  howToPlay: '遊び方',

  backToGame: 'ゲームに戻る',
  welcomeTitle: 'Blinkered へようこそ',
  tutorialSkip: 'スキップ',
  tutorialNext: '次へ',
  tutorialBack: '戻る',
  tutorialStart: 'はじめる',
  tutorialHideAgain: '次から表示しない',
  tutorialProgress: '{total}中{n}',
  tutorialSkipTitle: '説明をスキップしますか？',
  tutPickLetters: '使いたいもじを順にタップして単語を作ります。',
  tutMoreTurn: '考えているあいだももじは開き続けるので、もっといいもじがまだ来るかもしれません。',
  tutTapBack:
    '取りたくないものを取ってしまいましたか。もう一度タップすると戻せます。最後の1つだけでなく、どれでも。',
  tutComplete: '単語ができたら完成を押します。',
  tutControlsTitle: 'ボタン',
  tutReset: 'クリアは作りかけの単語を消します。もじはそのまま残ります。',
  tutPause: '一時停止は時計を止めて盤を隠します。休憩のあいだに覚えられないように。',
  tutRestart: 'やり直すは最初から新しい盤を配ります。先に確認します。',
  tutQuit: 'やめるはゲームを終えて得点を見せます。先に確認します。',
  tutDoneTitle: 'ゲームはこれで全部です',
  tutDoneBody: '難易度を選んで遊びましょう。遊び方はいつでもタイトルの横にあります。',
  htBoardTitle: '盤',
  htBoardBody:
    'もじは読む順に1枚ずつ表になります。表になったもじで単語を作ります。盤の上では濁点も半濁点もつけて読めるので、「は」は「ば」として使えます。小さい「っ」「ゃ」「ゅ」「ょ」も大きいもじで表します。',
  htWordsTitle: '単語',
  htWordsBody: '表になったもじを順に入力するかクリックして単語を作ります。',
  htFlipsTitle: '手',
  htFlipsBody:
    'もじが1枚表になるごとに1手かかります。単語が完成すると手が戻り、長い単語ほど多く戻ります。手がなくなるとゲームは終わりです。',
  htRoundTitle: 'ラウンド',
  htRoundBody:
    'そのラウンドの最後のもじが表になると、盤全体がしばらくそのままになります。そのあともじは裏返されて混ぜられ、新しいラウンドが始まります。',
  htLanguagesTitle: '言語',
  htLanguagesBody:
    '{n}言語。どの盤も、人が実際に使う単語で解けます。珍しい単語も辞書にあれば得点になります。',
  htKeysTitle: 'キーボード',
  htWildTitle: 'ジョーカー',
  htWildBody:
    'ときどきもじの代わりにジョーカーが出ます。ジョーカーは正しい単語になるどのもじとしても数えます。すでに完成した単語は数えません。',
  htSwapTitle: 'もじの入れ替わり',
  htSwapBody:
    'ときどきラウンドの合間に、1枚のもじが別のもじに入れ替わります。どのもじが消えてどのもじが増えたか分かります。',
  htLevelsTitle: '難易度',
  htLevelEasy:
    'ゲーム中ずっと同じ12枚なので、覚えて頭の中に単語のリストを持てます。もじはゆっくり表になり、盤全体は選び終わるまで十分に見えています。',
  htLevelMedium:
    'ときどき1枚が変わるので、あとで使うつもりだった単語を覚えておくのが難しくなります。見る時間も考える時間も少なくなります。',
  htLevelHard:
    '3もじの単語は数えなくなり、2ラウンドに1度ほどもじが変わります。盤は開いたと思うともう混ざります。',
  htLevelInsane: 'すべて同時に、最高速度で。最後の1手のすぐあとに盤が混ざります。',
  htTouchTitle: 'タッチ画面',
  htTouchBody:
    '表になったもじをタップするとその字を取ります。取ったもじをタップすると戻せます。完成とクリアは盤の下にあります。',

  plurals: {
    words: { other: '{n}語' },
    rounds: { other: '{n}ラウンド' },
    flips: { other: '{n}手' },
    ticks: { other: '{n}拍' },
    points: { other: '{n}点' },
  },
}
