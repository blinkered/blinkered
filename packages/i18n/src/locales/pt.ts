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
  tutPickLetters: 'Toque nas letras que quiser. Entram na palavra pela ordem por que lhes tocar.',
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
    'As peças viram-se uma a uma, na ordem de leitura. Não se vê uma letra até a sua peça virar.',
  htWordsTitle: 'As palavras',
  htWordsBody:
    'Forme uma palavra com as peças à vista. Escreva-a, ou clique nelas. Cada peça serve uma vez, e só depois de virar.',
  htFlipsTitle: 'As viradas',
  htFlipsBody:
    'Cada peça que vira custa uma virada. Uma palavra devolve viradas, e as palavras longas devolvem mais. Quando as viradas acabam, o jogo termina.',
  htRoundTitle: 'A ronda',
  htRoundBody:
    'Quando vira a última peça de uma ronda, o tabuleiro está todo à vista. Fica assim por um momento. Depois é baralhado e distribuído de novo.',
  htLanguagesTitle: 'Os idiomas',
  htLanguagesBody:
    'Dezasseis. Cada tabuleiro pode ser resolvido com palavras de uso corrente. Uma palavra invulgar também pontua, se o dicionário a conhecer.',
  htKeysTitle: 'O teclado',
  htWildTitle: 'Os coringas',
  htWildBody:
    'Algumas peças viram como coringa em vez de letra. Um coringa vale a letra que forma uma palavra, escolhida entre as que servem, e descobre qual quando a palavra aparece na sua lista. Uma palavra que já tem não conta.',
  htSwapTitle: 'As letras mudam',
  htSwapBody:
    'Entre rondas, uma peça pode mudar de letra. O tabuleiro esvazia-se e mostra-lhe a letra que sai e a que ocupa o seu lugar, mas nunca de que peça se tratava. O tabuleiro nunca fica igual muito tempo, por isso uma lista das suas letras fica desatualizada.',
  htLevelsTitle: 'Os níveis',
  htLevelEasy:
    'As mesmas doze letras durante toda a partida: pode aprendê-las e guardar uma lista de palavras de cabeça. As peças viram devagar e o tabuleiro completo fica à vista tempo suficiente para preparar uma.',
  htLevelMedium:
    'De vez em quando uma letra muda e a lista que andava a guardar deixa de servir. Menos tempo para olhar e menos para pensar.',
  htLevelHard:
    'As palavras de três letras deixam de contar e uma letra muda mais ou menos de duas em duas rondas. O tabuleiro mal aparece e já baralha.',
  htLevelInsane:
    'Tudo ao mesmo tempo, a toda a velocidade. O tabuleiro desaparece quase assim que fica completo e não há tempo para guardar lista nenhuma.',
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
