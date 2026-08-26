import type { Messages } from '../messages.js'

/** European Portuguese. `viradas` for flips, which is literally what a tile does. */
export const pt: Messages = {
  tag: 'pt',

  readingDictionary: 'A ler o dicionário…',
  noWordList: 'Sem lista de palavras para "{language}". Gere uma:  pnpm dictionary build',
  emptyWordList: 'A lista de palavras para "{language}" está vazia.',

  flips: 'viradas',
  score: 'pontos',
  words: 'palavras',
  round: 'ronda',
  ticksLeftLabel: 'Tempo restante nesta ronda',
  typeAWord: 'escreva uma palavra',

  boardOfTiles: 'Tabuleiro de {n} peças',
  faceDown: 'voltada para baixo',
  spentTile: 'peça gasta',
  hiddenWhilePaused: 'oculta em pausa',
  letterInWord: '{letter}, letra {position} da palavra',

  completeWord: 'Completar palavra',
  reset: 'Limpar',
  pause: 'Pausa',
  resume: 'Continuar',
  newGame: 'Novo jogo',
  paused: 'Em pausa',
  outOfFlips: 'Sem viradas',
  finalResult: '{score} pontos com {words} em {rounds}',
  playAgain: 'Jogar de novo',

  lettersSelect: 'as letras selecionam',
  clearsEvery: 'retira todos os {letter} selecionados',
  undoLastLetter: 'desfaz a última letra',
  noWordsYet: 'Ainda nenhuma palavra.',

  wordAccepted: '{word}  +{points} pontos, +{flips} viradas',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'já encontrada',
  reasonTooShort: 'demasiado curta',
  reasonNotAWord: 'não é uma palavra',
  noSuchLetterUp: 'nenhum {letter} à vista',
  nothingUp: 'nada à vista',
  shuffled: 'baralhado',
  shuffledAndBilled: 'baralhado, cobradas {flips} viradas não usadas',

  gameLanguage: 'idioma',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} comuns de {full} palavras',

  nerdMode: 'modo técnico',
  rules: 'Regras',
  difficulty: 'dificuldade',
  difficultyNames: { easy: 'fácil', medium: 'médio', hard: 'difícil', insane: 'brutal' },
  tiles: 'peças (N)',
  secondsPerTick: 'segundos / tempo',
  holdTicks: 'tempos de espera',
  minWord: 'palavra mínima',
  startingFlips: 'viradas iniciais',
  wordCompleteMode: 'palavra completa',
  wordCompleteNames: { shuffle: 'baralhar', spend: 'gastar', keep: 'manter' },
  flipEconomy: 'economia de viradas',
  flipEconomyNames: {
    none: 'nenhuma',
    perLetter: 'por letra',
    fibonacci: 'fibonacci',
    overMinimum: 'acima do mínimo',
  },
  repeatedLetterKey: 'tecla de letra repetida',
  keySchemeNames: { cycle: 'ciclar', advance: 'avançar' },
  keySchemeHelp: {
    cycle:
      'A toma o próximo A livre e, quando estão todos na palavra, retira-os. ' +
      'Shift+A também os retira.',
    advance: 'A toma o próximo A livre. Shift+A retira todos os A da palavra.',
  },

  whatThatMeans: 'O que isso significa',
  factRound: 'uma ronda',
  factWholeBoardUp: 'tabuleiro todo à vista',
  factRoundCosts: 'uma ronda custa',
  factFlipsBuy: 'as viradas iniciais dão',
  factThisBoard: 'este tabuleiro',
  factBoardHadToAdmit: 'o tabuleiro tinha de admitir',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, a mais longa {longest}',
  wordsIncludingOneOf: '{words} incluindo uma de {ceiling}',
  scorelessRounds: '{rounds} sem pontuar',

  whatAWordPays: 'O que rende uma palavra',
  columnLetters: 'letras',
  columnCost: 'custo',
  columnPoints: 'pontos',
  columnFlips: 'viradas',
  columnNet: 'líquido',

  canonicalRules: 'Regras {difficulty} oficiais.',
  customRules: 'Alterado da predefinição. Pontuações com regras próprias não são classificadas.',
  applyAndStart: 'Aplicar e começar um jogo',
  changesNextGame: 'As alterações aplicam-se no próximo jogo.',
  presets: 'Predefinições:',

  plurals: {
    words: { one: '{n} palavra', other: '{n} palavras' },
    rounds: { one: '{n} ronda', other: '{n} rondas' },
    flips: { one: '{n} virada', other: '{n} viradas' },
    ticks: { one: '{n} tempo', other: '{n} tempos' },
    points: { one: '{n} ponto', other: '{n} pontos' },
  },
}
