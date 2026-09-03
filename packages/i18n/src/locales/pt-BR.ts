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
  wildCard: 'curinga',
  wildKey: 'qualquer letra',
  letterReplaced: '{from} virou {to}',
  letterSwap: 'TROCA DE LETRA!',
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
  share: 'Compartilhar',
  shareCopied: 'Copiado.',
  shareSelect: 'Copie isto:',

  lettersSelect: 'as letras selecionam',
  keysWild: 'usado quando você digita uma letra que nenhuma peça mostra',
  clearsEvery: 'remove todos os {letter} selecionados',
  undoLastLetter: 'desfaz a última letra',
  noWordsYet: 'Nenhuma palavra ainda.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'já encontrada',
  reasonTooShort: 'muito curta',
  reasonNotAWord: 'não é uma palavra',
  reasonAllFound: 'você já tem todos',
  noSuchLetterUp: 'nenhum {letter} à vista',
  nothingUp: 'nada à vista',
  shuffled: 'embaralhado',
  shuffledAndBilled: 'embaralhado, cobradas {flips} viradas não usadas',

  gameLanguage: 'idioma',
  interfaceLanguage: 'interface',
  dictionarySize: '{common} comuns de {full} palavras',
  filterLanguages: 'Buscar idiomas',
  noMatches: 'Nenhum resultado',

  nerdMode: 'modo técnico',
  rules: 'Regras',
  difficulty: 'dificuldade',
  difficultyNames: { easy: 'fácil', medium: 'médio', hard: 'difícil', insane: 'brutal' },
  tiles: 'peças (N)',
  secondsPerTick: 'segundos / tempo',
  holdTicks: 'tempos de espera',
  minWord: 'palavra mínima',
  startingFlips: 'viradas iniciais',
  wildChance: 'chance de curinga',
  replaceChance: 'chance de troca de letra',
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
  restartTitle: 'Reiniciar este jogo?',
  restartConfirm: 'Reiniciar',
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
  welcomeTitle: 'Boas-vindas ao Blinkered',
  tutorialSkip: 'Pular',
  tutorialNext: 'Avançar',
  tutorialBack: 'Voltar',
  tutorialStart: 'Começar a jogar',
  tutorialHideAgain: 'Não mostrar de novo',
  tutorialProgress: '{n} de {total}',
  tutorialSkipTitle: 'Pular a apresentação?',
  tutPickLetters: 'Toque nas letras que quiser, em ordem, para formar uma palavra.',
  tutMoreTurn:
    'As peças continuam virando enquanto você pensa, então ainda pode vir uma letra melhor.',
  tutTapBack:
    'Tocou em uma sem querer? Toque de novo para devolver. Em qualquer uma, não só na última.',
  tutComplete: 'Aperte Concluir quando a palavra estiver pronta.',
  tutControlsTitle: 'Os botões',
  tutReset: 'Limpar esvazia a palavra que você está montando. As peças ficam onde estão.',
  tutPause:
    'Pausa para o relógio e esconde o tabuleiro, para que a pausa não sirva para estudá-lo.',
  tutRestart: 'Reiniciar distribui um tabuleiro novo do começo. Ele pergunta antes.',
  tutQuit: 'Sair encerra o jogo e mostra sua pontuação. Ele pergunta antes.',
  tutDoneTitle: 'O jogo é isso',
  tutDoneBody: 'Escolha um nível e jogue. Como jogar fica sempre na barra de título.',
  htBoardTitle: 'O tabuleiro',
  htBoardBody:
    'As peças viram uma a uma, na ordem de leitura. As peças à vista servem para formar palavras.',
  htWordsTitle: 'As palavras',
  htWordsBody: 'Monte uma palavra com as peças à vista, digitando ou clicando nas letras em ordem.',
  htFlipsTitle: 'As viradas',
  htFlipsBody:
    'Cada peça que vira custa uma virada. Uma palavra completa devolve viradas ao seu total, e palavras longas devolvem mais. Quando as viradas acabam, o jogo termina.',
  htRoundTitle: 'A rodada',
  htRoundBody:
    'Quando vira a última peça de uma rodada, o tabuleiro fica todo à vista por um instante. Depois as peças são viradas para baixo e embaralhadas, e começa uma rodada nova.',
  htLanguagesTitle: 'Os idiomas',
  htLanguagesBody:
    '{n}. Cada tabuleiro pode ser resolvido com palavras de uso corrente. Uma palavra incomum também pontua, se o dicionário a conhecer.',
  htKeysTitle: 'O teclado',
  htWildTitle: 'Os curingas',
  htWildBody:
    'Às vezes aparece um curinga no lugar de uma letra. Um curinga vale qualquer letra que forme uma palavra válida. Uma palavra já completada não conta.',
  htSwapTitle: 'As letras mudam',
  htSwapBody:
    'Às vezes, entre rodadas, uma letra é substituída por outra. Você vai ver qual letra saiu e qual entrou.',
  htLevelsTitle: 'Os níveis',
  htLevelEasy:
    'As mesmas doze letras durante o jogo inteiro: dá para aprendê-las e guardar uma lista de palavras na cabeça. As peças viram devagar e o tabuleiro completo fica à vista tempo suficiente para terminar de escolher as letras.',
  htLevelMedium:
    'De vez em quando uma letra muda, então fica mais difícil guardar as palavras que você queria jogar mais adiante. Menos tempo para olhar e menos para pensar.',
  htLevelHard:
    'Palavras de três letras deixam de contar e uma letra muda mais ou menos a cada duas rodadas. O tabuleiro mal aparece e já embaralha.',
  htLevelInsane:
    'Tudo ao mesmo tempo, na velocidade máxima. O tabuleiro é embaralhado quase logo depois da última virada.',
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
