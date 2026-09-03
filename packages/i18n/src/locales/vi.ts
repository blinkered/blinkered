import type { Messages } from '../messages.js'

/**
 * Vietnamese. `nước` for flips, the word a Vietnamese board game uses for a move.
 *
 * Vietnamese has one plural form and no agreement, so every count here is a bare numeral and a
 * classifier where the noun takes one: `3 từ`, `5 nước`.
 *
 * `htBoardBody` carries a sentence the other locales have no need of. Tiles hold their tone —
 * À and Á are different tiles, as they are in Vietboard — and the space between syllables is
 * not a tile at all, so SINH VIÊN is played as six tiles with no gap. A player who has not been
 * told will look for a space tile and not find one.
 */
export const vi: Messages = {
  tag: 'vi',

  readingDictionary: 'Đang đọc từ điển…',
  noWordList: 'Không có danh sách từ cho "{language}". Hãy tạo một:  pnpm dictionary build',
  emptyWordList: 'Danh sách từ của "{language}" trống.',

  flips: 'nước',
  score: 'điểm',
  words: 'từ',
  round: 'vòng',
  ticksLeftLabel: 'Thời gian còn lại trong vòng này',
  typeAWord: 'nhập một từ',
  tapPrompt: 'chạm vào chữ để chọn hoặc trả lại, rồi {action}',

  boardOfTiles: 'Bàn gồm {n} quân',
  faceDown: 'úp xuống',
  wildCard: 'quân trắng',
  wildKey: 'chữ bất kỳ',
  letterReplaced: '{from} đã thành {to}',
  letterSwap: 'ĐỔI CHỮ!',
  spentTile: 'quân đã dùng',
  hiddenWhilePaused: 'ẩn khi tạm dừng',
  letterInWord: '{letter}, chữ thứ {position} của từ',

  completeWord: 'Hoàn thành từ',

  completeShort: 'Xong',
  reset: 'Xóa',
  pause: 'Tạm dừng',
  resume: 'Tiếp tục',
  newGame: 'Ván mới',
  paused: 'Đang tạm dừng',
  outOfFlips: 'Hết nước',
  finalResult: '{score} cho {words} qua {rounds}',
  playAgain: 'Chơi lại',
  share: 'Chia sẻ',
  shareCopied: 'Đã sao chép.',
  shareSelect: 'Sao chép cái này:',

  lettersSelect: 'chữ để chọn',
  keysWild: 'được lấy khi bạn gõ một chữ không quân nào đang hiện',
  clearsEvery: 'xóa mọi {letter} đã chọn',
  undoLastLetter: 'hoàn tác chữ cuối',
  noWordsYet: 'Chưa có từ nào.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'đã tìm được rồi',
  reasonTooShort: 'quá ngắn',
  reasonNotAWord: 'không phải là từ',
  reasonAllFound: 'bạn đã có đủ cả',
  noSuchLetterUp: 'không có {letter} nào đang mở',
  nothingUp: 'chưa mở quân nào',
  shuffled: 'đã xáo',
  shuffledAndBilled: 'đã xáo, trừ {flips} chưa dùng',

  gameLanguage: 'ngôn ngữ',
  interfaceLanguage: 'giao diện',
  dictionarySize: '{common} từ thường dùng trong {full}',
  filterLanguages: 'Tìm ngôn ngữ',
  noMatches: 'Không có kết quả',

  nerdMode: 'chế độ chuyên sâu',
  rules: 'Luật chơi',
  difficulty: 'độ khó',
  difficultyNames: { easy: 'dễ', medium: 'vừa', hard: 'khó', insane: 'điên rồ' },
  tiles: 'quân (N)',
  secondsPerTick: 'giây / nhịp',
  holdTicks: 'nhịp giữ',
  minWord: 'từ ngắn nhất',
  startingFlips: 'nước khởi đầu',
  wildChance: 'tỉ lệ quân trắng',
  replaceChance: 'tỉ lệ đổi chữ',
  wordCompleteMode: 'khi xong một từ',
  wordCompleteNames: { shuffle: 'xáo', spend: 'dùng hết', keep: 'giữ lại' },
  flipEconomy: 'hoàn nước',
  flipEconomyNames: {
    none: 'không',
    perLetter: 'theo từng chữ',
    fibonacci: 'fibonacci',
    overMinimum: 'vượt mức tối thiểu',
  },
  repeatedLetterKey: 'phím chữ lặp',
  keySchemeNames: { cycle: 'vòng', advance: 'tiến' },
  keySchemeHelp: {
    cycle:
      'A lấy quân A chưa dùng tiếp theo, và khi tất cả đã vào từ thì xóa hết. ' +
      'Shift+A cũng xóa hết.',
    advance: 'A lấy quân A chưa dùng tiếp theo. Shift+A xóa mọi A trong từ.',
  },

  whatThatMeans: 'Nghĩa là gì',
  factRound: 'vòng',
  factWholeBoardUp: 'cả bàn mở trong',
  factRoundCosts: 'một vòng tốn',
  factFlipsBuy: 'nước khởi đầu mua được',
  factThisBoard: 'bàn này',
  factBoardHadToAdmit: 'bàn phải nhận',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, dài nhất {longest}',
  wordsIncludingOneOf: '{words}, trong đó một từ {ceiling}',
  scorelessRounds: '{rounds} không điểm',

  whatAWordPays: 'Một từ đáng bao nhiêu',
  columnLetters: 'chữ',
  columnCost: 'phí',
  columnPoints: 'điểm',
  columnFlips: 'nước',
  columnNet: 'chênh lệch',

  canonicalRules: 'Luật chuẩn của mức {difficulty}.',
  customRules: 'Đã đổi khác mặc định. Điểm với luật riêng không vào bảng xếp hạng.',
  applyAndStart: 'Áp dụng và bắt đầu ván mới',
  changesNextGame: 'Thay đổi có hiệu lực từ ván sau.',
  presets: 'Mặc định:',

  start: 'Bắt đầu',
  restart: 'Chơi lại từ đầu',
  quit: 'Thoát',
  quitTitle: 'Thoát ván này?',
  restartTitle: 'Chơi lại ván này từ đầu?',
  restartConfirm: 'Từ đầu',
  quitConfirm: 'Thoát',
  keepPlaying: 'Chơi tiếp',
  personalBest: 'Những ván hay nhất của bạn',
  thisGame: 'ván này',
  newPersonalBest: 'Kỷ lục mới của bạn.',
  columnRank: '#',
  notRanked: 'Luật riêng, nên ván này không vào bảng xếp hạng.',
  rankOfTotal: '{rank} trên {total}',

  howToPlay: 'Cách chơi',

  backToGame: 'Trở lại ván chơi',
  welcomeTitle: 'Chào mừng đến với Blinkered',
  tutorialSkip: 'Bỏ qua',
  tutorialNext: 'Tiếp',
  tutorialBack: 'Lùi',
  tutorialStart: 'Bắt đầu chơi',
  tutorialHideAgain: 'Đừng hiện lại nữa',
  tutorialProgress: '{n} trên {total}',
  tutorialSkipTitle: 'Bỏ qua phần giới thiệu?',
  tutPickLetters: 'Chạm vào các chữ bạn muốn, theo thứ tự, để ghép thành từ.',
  tutMoreTurn: 'Quân vẫn tiếp tục mở trong lúc bạn nghĩ, nên chữ tốt hơn có thể vẫn đang tới.',
  tutTapBack: 'Lỡ lấy chữ không muốn? Chạm lại để trả về. Chữ nào cũng được, không riêng chữ cuối.',
  tutComplete: 'Nhấn Xong khi từ đã sẵn sàng.',
  tutControlsTitle: 'Các nút',
  tutReset: 'Xóa sẽ bỏ từ bạn đang ghép. Các quân vẫn nằm nguyên chỗ cũ.',
  tutPause: 'Tạm dừng ngừng đồng hồ và che bàn, để giờ nghỉ không dùng để học thuộc bàn.',
  tutRestart: 'Chơi lại từ đầu chia một bàn mới từ đầu. Nó hỏi trước.',
  tutQuit: 'Thoát kết thúc ván và cho xem điểm. Nó hỏi trước.',
  tutDoneTitle: 'Cả trò chơi chỉ có vậy',
  tutDoneBody: 'Chọn một mức và chơi. Cách chơi luôn nằm cạnh tên trò chơi.',
  htBoardTitle: 'Bàn chơi',
  htBoardBody:
    'Các quân mở lần lượt, theo thứ tự đọc. Ghép từ bằng những quân đã mở. Dấu thanh nằm ngay trên quân, nên À và Á là hai quân khác nhau. Khoảng trắng giữa các tiếng thì không phải là quân: SINH VIÊN ghép bằng sáu quân, không có chỗ trống.',
  htWordsTitle: 'Các từ',
  htWordsBody: 'Ghép một từ từ những quân đang mở bằng cách gõ hoặc bấm các chữ theo thứ tự.',
  htFlipsTitle: 'Nước',
  htFlipsBody:
    'Mỗi quân mở ra tốn một nước. Một từ hoàn thành hoàn lại nước, và từ càng dài hoàn lại càng nhiều. Khi hết nước là hết ván.',
  htRoundTitle: 'Vòng',
  htRoundBody:
    'Khi quân cuối cùng của vòng mở ra, cả bàn dừng lại một lát. Rồi các quân được úp xuống và xáo lại, và một vòng mới bắt đầu.',
  htLanguagesTitle: 'Các ngôn ngữ',
  htLanguagesBody:
    'Có {n} ngôn ngữ. Bàn nào cũng giải được bằng những từ người ta thật sự dùng. Từ hiếm vẫn được điểm, nếu từ điển biết nó.',
  htKeysTitle: 'Bàn phím',
  htWildTitle: 'Quân trắng',
  htWildBody:
    'Đôi khi một quân trắng hiện ra thay cho một chữ. Quân trắng tính là bất kỳ chữ nào tạo thành từ đúng. Từ đã ghép rồi thì không tính.',
  htSwapTitle: 'Chữ đổi',
  htSwapBody:
    'Đôi khi giữa hai vòng, một chữ được thay bằng chữ khác. Bạn sẽ thấy chữ nào đi và chữ nào đến.',
  htLevelsTitle: 'Các mức',
  htLevelEasy:
    'Vẫn mười hai chữ đó suốt ván, nên bạn có thể thuộc chúng và giữ sẵn một danh sách từ trong đầu. Quân mở chậm, và cả bàn còn hiện đủ lâu để bạn chọn xong.',
  htLevelMedium:
    'Thỉnh thoảng một chữ đổi, nên khó nhớ những từ để dành cho sau. Ít thời gian nhìn hơn, và ít thời gian nghĩ hơn.',
  htLevelHard:
    'Từ ba chữ không còn tính, và cứ khoảng hai vòng lại đổi một chữ. Bàn vừa kịp hiện ra là đã xáo.',
  htLevelInsane: 'Tất cả cùng lúc, hết tốc lực. Bàn xáo gần như ngay sau nước cuối.',
  htTouchTitle: 'Màn hình cảm ứng',
  htTouchBody:
    'Chạm vào một quân đang mở để lấy chữ của nó. Chạm vào chữ đã lấy để trả lại. Xong và Xóa nằm dưới bàn.',

  plurals: {
    words: { other: '{n} từ' },
    rounds: { other: '{n} vòng' },
    flips: { other: '{n} nước' },
    ticks: { other: '{n} nhịp' },
    points: { other: '{n} điểm' },
  },
}
