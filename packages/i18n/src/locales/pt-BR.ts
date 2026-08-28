import type { Messages } from '../messages.js'

/**
 * Brazilian Portuguese. Not a copy of the European locale with the flag swapped: `rodada` for
 * a round, `embaralhado` for a shuffle, the gerund where Portugal uses `a` plus the infinitive,
 * and the pronoun before the verb rather than hyphenated after it.
 */
export const ptBR: Messages = {
  tag: 'pt-BR',

  readingDictionary: 'Lendo o dicionário…',
  noWordList: 'Sem lista de palavras para "{language}". Gere uma:  pnpm dictionary build',
  emptyWordList: 'A lista de palavras para "{language}" está vazia.',

  flips: 'viradas',
  score: 'pontos',
  words: 'palavras',
  round: 'rodada',
  ticksLeftLabel: 'Tempo restante nesta rodada',
  typeAWord: 'digite uma palavra',
  tapPrompt: 'toque para pegar ou devolver, depois {action}',

  boardOfTiles: 'Tabuleiro de {n} peças',
  faceDown: 'virada para baixo',
  spentTile: 'peça gasta',
  hiddenWhilePaused: 'oculta na pausa',
  letterInWord: '{letter}, letra {position} da palavra',

  completeWord: 'Completar palavra',
  completeShort: 'Completar',
  reset: 'Limpar',
  pause: 'Pausar',
  resume: 'Continuar',
  newGame: 'Novo jogo',
  paused: 'Pausado',
  outOfFlips: 'Sem viradas',
  finalResult: '{score} pontos com {words} em {rounds}',
  playAgain: 'Jogar novamente',

  lettersSelect: 'as letras selecionam',
  clearsEvery: 'remove todos os {letter} selecionados',
  undoLastLetter: 'desfaz a última letra',
  noWordsYet: 'Nenhuma palavra ainda.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'já encontrada',
  reasonTooShort: 'muito curta',
  reasonNotAWord: 'não é uma palavra',
  noSuchLetterUp: 'nenhum {letter} à vista',
  nothingUp: 'nada à vista',
  shuffled: 'embaralhado',
  shuffledAndBilled: 'embaralhado, cobradas {flips} viradas não usadas',

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
  wordCompleteNames: { shuffle: 'embaralhar', spend: 'gastar', keep: 'manter' },
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
      'A pega o próximo A livre e, quando todos estão na palavra, os remove. ' +
      'Shift+A também os remove.',
    advance: 'A pega o próximo A livre. Shift+A remove todos os A da palavra.',
  },

  whatThatMeans: 'O que isso significa',
  factRound: 'uma rodada',
  factWholeBoardUp: 'tabuleiro todo à vista',
  factRoundCosts: 'uma rodada custa',
  factFlipsBuy: 'as viradas iniciais dão',
  factThisBoard: 'este tabuleiro',
  factBoardHadToAdmit: 'o tabuleiro tinha que admitir',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, a mais longa {longest}',
  wordsIncludingOneOf: '{words} incluindo uma de {ceiling}',
  scorelessRounds: '{rounds} sem pontuar',

  whatAWordPays: 'O que uma palavra rende',
  columnLetters: 'letras',
  columnCost: 'custo',
  columnPoints: 'pontos',
  columnFlips: 'viradas',
  columnNet: 'líquido',

  canonicalRules: 'Regras {difficulty} oficiais.',
  customRules: 'Alterado do padrão. Pontuações com regras próprias não são classificadas.',
  applyAndStart: 'Aplicar e começar um jogo',
  changesNextGame: 'As alterações valem a partir do próximo jogo.',
  presets: 'Padrões:',

  start: 'Começar',
  restart: 'Reiniciar',
  quit: 'Sair',
  quitTitle: 'Sair deste jogo?',
  quitConfirm: 'Sair',
  keepPlaying: 'Continuar jogando',
  personalBest: 'Seus melhores jogos',
  thisGame: 'este jogo',
  newPersonalBest: 'Novo recorde pessoal.',
  columnRank: '#',
  notRanked: 'Regras próprias: este jogo não é classificado.',
  rankOfTotal: '{rank} de {total}',

  howToPlay: 'Como jogar',

  backToGame: 'Voltar ao jogo',
  htBoardTitle: 'O tabuleiro',
  htBoardBody:
    'As peças viram uma a uma, na ordem de leitura. Você não vê uma letra até a peça dela virar.',
  htWordsTitle: 'As palavras',
  htWordsBody:
    'Monte uma palavra com as peças à vista. Digite-a, ou clique nelas. Cada peça serve uma vez, e só depois de virar.',
  htFlipsTitle: 'As viradas',
  htFlipsBody:
    'Cada peça que vira custa uma virada. Uma palavra devolve viradas, e palavras longas devolvem mais. Quando as viradas acabam, o jogo termina.',
  htRoundTitle: 'A rodada',
  htRoundBody:
    'Quando vira a última peça de uma rodada, o tabuleiro fica todo à vista. Ele fica assim por um instante. Depois é embaralhado e distribuído de novo.',
  htLanguagesTitle: 'Os idiomas',
  htLanguagesBody:
    'Dezesseis. Cada tabuleiro pode ser resolvido com palavras de uso corrente. Uma palavra incomum também pontua, se o dicionário a conhecer.',
  htKeysTitle: 'O teclado',
  htTouchTitle: 'A tela sensível ao toque',
  htTouchBody:
    'Toque numa peça virada para pegar a letra dela. Toque numa letra já pega para devolvê-la. Completar e Limpar ficam abaixo do tabuleiro.',

  plurals: {
    words: { one: '{n} palavra', other: '{n} palavras' },
    rounds: { one: '{n} rodada', other: '{n} rodadas' },
    flips: { one: '{n} virada', other: '{n} viradas' },
    ticks: { one: '{n} tempo', other: '{n} tempos' },
    points: { one: '{n} ponto', other: '{n} pontos' },
  },
}
