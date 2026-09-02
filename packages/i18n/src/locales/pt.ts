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
  tapPrompt: 'toque para tomar ou devolver, depois {action}',

  boardOfTiles: 'Tabuleiro de {n} peças',
  faceDown: 'voltada para baixo',
  wildCard: 'coringa',
  wildKey: 'qualquer letra',
  letterReplaced: '{from} passou a {to}',
  letterSwap: 'TROCA DE LETRA!',
  spentTile: 'peça gasta',
  hiddenWhilePaused: 'oculta em pausa',
  letterInWord: '{letter}, letra {position} da palavra',

  completeWord: 'Completar palavra',
  completeShort: 'Completar',
  reset: 'Limpar',
  pause: 'Pausa',
  resume: 'Continuar',
  newGame: 'Novo jogo',
  paused: 'Em pausa',
  outOfFlips: 'Sem viradas',
  finalResult: '{score} pontos com {words} em {rounds}',
  playAgain: 'Jogar de novo',
  share: 'Partilhar',
  shareCopied: 'Copiado.',
  shareSelect: 'Copie isto:',

  lettersSelect: 'as letras selecionam',
  keysWild: 'pega uma carta se nenhuma peça mostrar a letra, e tenta ser essa letra',
  clearsEvery: 'retira todos os {letter} selecionados',
  undoLastLetter: 'desfaz a última letra',
  noWordsYet: 'Ainda nenhuma palavra.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'já encontrada',
  reasonTooShort: 'demasiado curta',
  reasonNotAWord: 'não é uma palavra',
  reasonAllFound: 'já os tem todos',
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
  wildChance: 'probabilidade de coringa',
  replaceChance: 'probabilidade de troca de letra',
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

  start: 'Começar',
  restart: 'Reiniciar',
  quit: 'Sair',
  quitTitle: 'Sair deste jogo?',
  restartTitle: 'Reiniciar este jogo?',
  restartConfirm: 'Reiniciar',
  quitConfirm: 'Sair',
  keepPlaying: 'Continuar a jogar',
  personalBest: 'Os seus melhores jogos',
  thisGame: 'este jogo',
  newPersonalBest: 'Novo recorde pessoal.',
  columnRank: '#',
  notRanked: 'Regras próprias: este jogo não é classificado.',
  rankOfTotal: '{rank} de {total}',

  howToPlay: 'Como jogar',

  backToGame: 'Voltar ao jogo',
  welcomeTitle: 'Bem-vindo ao Blinkered',
  tutorialSkip: 'Ignorar',
  tutorialNext: 'Seguinte',
  tutorialBack: 'Voltar',
  tutorialStart: 'Começar a jogar',
  tutorialHideAgain: 'Não mostrar novamente',
  tutorialProgress: '{n} de {total}',
  tutorialSkipTitle: 'Ignorar a apresentação?',
  tutPickLetters: 'Toque nas letras que quiser, pela ordem, para formar uma palavra.',
  tutMoreTurn:
    'As peças continuam a virar enquanto pensa, por isso ainda pode aparecer uma letra melhor.',
  tutTapBack:
    'Tocou numa sem querer? Toque outra vez para a devolver. Em qualquer uma, não só na última.',
  tutComplete: 'Carregue em Concluir quando a palavra estiver pronta.',
  tutControlsTitle: 'Os botões',
  tutReset: 'Limpar esvazia a palavra que está a formar. As peças ficam onde estão.',
  tutPause:
    'Pausa para o relógio e esconde o tabuleiro, para que uma pausa não sirva para o estudar.',
  tutRestart: 'Reiniciar distribui um tabuleiro novo desde o início. Pede confirmação.',
  tutQuit: 'Sair termina o jogo e mostra a sua pontuação. Pede confirmação.',
  tutDoneTitle: 'O jogo é isto',
  tutDoneBody: 'Escolha um nível e jogue. Como jogar está sempre na barra de título.',
  htBoardTitle: 'O tabuleiro',
  htBoardBody:
    'As peças viram-se uma a uma, na ordem de leitura. As peças à vista servem para formar palavras.',
  htWordsTitle: 'As palavras',
  htWordsBody:
    'Forme uma palavra com as peças à vista, escrevendo ou clicando nas letras pela ordem.',
  htFlipsTitle: 'As viradas',
  htFlipsBody:
    'Cada peça que vira custa uma virada. Uma palavra completa devolve viradas ao seu total, e as palavras longas devolvem mais. Quando as viradas acabam, o jogo termina.',
  htRoundTitle: 'A ronda',
  htRoundBody:
    'Quando vira a última peça de uma ronda, o tabuleiro fica todo à vista por um momento. Depois as peças são viradas ao contrário e baralhadas, e começa uma ronda nova.',
  htLanguagesTitle: 'Os idiomas',
  htLanguagesBody:
    'Dezasseis. Cada tabuleiro pode ser resolvido com palavras de uso corrente. Uma palavra invulgar também pontua, se o dicionário a conhecer.',
  htKeysTitle: 'O teclado',
  htWildTitle: 'Os coringas',
  htWildBody:
    'Às vezes aparece um coringa em vez de uma letra. Um coringa vale qualquer letra que forme uma palavra válida. Uma palavra já completada não conta.',
  htSwapTitle: 'As letras mudam',
  htSwapBody:
    'Às vezes, entre rondas, uma letra é substituída por outra. Vai ver qual foi retirada e qual foi acrescentada.',
  htLevelsTitle: 'Os níveis',
  htLevelEasy:
    'As mesmas doze letras durante toda a partida: pode aprendê-las e guardar uma lista de palavras de cabeça. As peças viram devagar e o tabuleiro completo fica à vista tempo suficiente para acabar de escolher as letras.',
  htLevelMedium:
    'De vez em quando uma letra muda, por isso torna-se mais difícil guardar as palavras que queria jogar mais à frente. Menos tempo para olhar e menos para pensar.',
  htLevelHard:
    'As palavras de três letras deixam de contar e uma letra muda mais ou menos de duas em duas rondas. O tabuleiro mal aparece e já baralha.',
  htLevelInsane:
    'Tudo ao mesmo tempo, a toda a velocidade. O tabuleiro é baralhado quase logo a seguir à última virada.',
  htTouchTitle: 'O ecrã tátil',
  htTouchBody:
    'Toque numa peça virada para tomar a sua letra. Toque numa letra já tomada para a devolver. Completar e Limpar ficam sob o tabuleiro.',

  plurals: {
    words: { one: '{n} palavra', other: '{n} palavras' },
    rounds: { one: '{n} ronda', other: '{n} rondas' },
    flips: { one: '{n} virada', other: '{n} viradas' },
    ticks: { one: '{n} tempo', other: '{n} tempos' },
    points: { one: '{n} ponto', other: '{n} pontos' },
  },
}
