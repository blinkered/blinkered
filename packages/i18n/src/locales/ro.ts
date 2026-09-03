import type { Messages } from '../messages.js'

/**
 * Romanian. `mutare` for flips, the word a Romanian board game uses for a move.
 *
 * Three plural forms, and the third is the one nothing else here has: from twenty upward
 * Romanian puts `de` between the number and the noun, so it is `19 cuvinte` but `20 de cuvinte`.
 * That is what `other` carries.
 */
export const ro: Messages = {
  tag: 'ro',

  readingDictionary: 'Se citește dicționarul…',
  noWordList: 'Nu există listă de cuvinte pentru „{language}”. Creați una:  pnpm dictionary build',
  emptyWordList: 'Lista de cuvinte pentru „{language}” este goală.',

  flips: 'mutări',
  score: 'scor',
  words: 'cuvinte',
  round: 'rundă',
  ticksLeftLabel: 'Timp rămas în această rundă',
  typeAWord: 'scrieți un cuvânt',
  tapPrompt: 'atingeți literele pentru a le alege sau returna, apoi {action}',

  boardOfTiles: 'Tablă cu {n} piese',
  faceDown: 'cu fața în jos',
  wildCard: 'joker',
  wildKey: 'orice literă',
  letterReplaced: '{from} a devenit {to}',
  letterSwap: 'SCHIMB DE LITERE!',
  spentTile: 'piesă folosită',
  hiddenWhilePaused: 'ascuns pe durata pauzei',
  letterInWord: '{letter}, litera {position} a cuvântului',

  completeWord: 'Termină cuvântul',

  completeShort: 'Gata',
  reset: 'Șterge',
  pause: 'Pauză',
  resume: 'Reia',
  newGame: 'Joc nou',
  paused: 'În pauză',
  outOfFlips: 'S-au terminat mutările',
  finalResult: '{score} pentru {words} în {rounds}',
  playAgain: 'Mai joacă o dată',
  share: 'Distribuie',
  shareCopied: 'Copiat.',
  shareSelect: 'Copiați asta:',

  lettersSelect: 'literele aleg',
  keysWild: 'se ia când scrieți o literă pe care nicio piesă nu o arată',
  clearsEvery: 'șterge toate literele {letter} alese',
  undoLastLetter: 'anulează ultima literă',
  noWordsYet: 'Niciun cuvânt încă.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'deja găsit',
  reasonTooShort: 'prea scurt',
  reasonNotAWord: 'nu este un cuvânt',
  reasonAllFound: 'le aveți deja pe toate',
  noSuchLetterUp: 'nicio literă {letter} întoarsă',
  nothingUp: 'nimic întors',
  shuffled: 'amestecat',
  shuffledAndBilled: 'amestecat, s-au scăzut {flips} nefolosite',

  gameLanguage: 'limbă',
  interfaceLanguage: 'interfață',
  dictionarySize: '{common} obișnuite din {full} de cuvinte',
  filterLanguages: 'Caută o limbă',
  noMatches: 'Nicio potrivire',

  nerdMode: 'mod pentru pasionați',
  rules: 'Reguli',
  difficulty: 'dificultate',
  difficultyNames: { easy: 'ușoară', medium: 'medie', hard: 'grea', insane: 'nebunească' },
  tiles: 'piese (N)',
  secondsPerTick: 'secunde / bătaie',
  holdTicks: 'bătăi de așteptare',
  minWord: 'cel mai scurt cuvânt',
  startingFlips: 'mutări la început',
  wildChance: 'șansa de joker',
  replaceChance: 'șansa de schimb de literă',
  wordCompleteMode: 'când cuvântul e gata',
  wordCompleteNames: { shuffle: 'amestecă', spend: 'consumă', keep: 'păstrează' },
  flipEconomy: 'returnarea mutărilor',
  flipEconomyNames: {
    none: 'niciuna',
    perLetter: 'per literă',
    fibonacci: 'fibonacci',
    overMinimum: 'peste minim',
  },
  repeatedLetterKey: 'tasta literei repetate',
  keySchemeNames: { cycle: 'ciclu', advance: 'înainte' },
  keySchemeHelp: {
    cycle:
      'A ia următorul A nefolosit, iar când toate sunt în cuvânt, le șterge. ' +
      'Shift+A le șterge de asemenea.',
    advance: 'A ia următorul A nefolosit. Shift+A șterge toate literele A din cuvânt.',
  },

  whatThatMeans: 'Ce înseamnă asta',
  factRound: 'rundă',
  factWholeBoardUp: 'toată tabla întoarsă timp de',
  factRoundCosts: 'o rundă costă',
  factFlipsBuy: 'mutările de la început cumpără',
  factThisBoard: 'această tablă',
  factBoardHadToAdmit: 'tabla a trebuit să admită',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, cel mai lung {longest}',
  wordsIncludingOneOf: '{words}, dintre care unul de {ceiling}',
  scorelessRounds: '{rounds} fără puncte',

  whatAWordPays: 'Cât aduce un cuvânt',
  columnLetters: 'litere',
  columnCost: 'cost',
  columnPoints: 'puncte',
  columnFlips: 'mutări',
  columnNet: 'net',

  canonicalRules: 'Regulile obișnuite pentru {difficulty}.',
  customRules: 'Modificat față de presetare. Scorurile cu reguli proprii nu intră în clasament.',
  applyAndStart: 'Aplică și începe un joc nou',
  changesNextGame: 'Modificările se aplică de la jocul următor.',
  presets: 'Presetări:',

  start: 'Începe',
  restart: 'De la capăt',
  quit: 'Renunță',
  quitTitle: 'Renunțați la acest joc?',
  restartTitle: 'Reluați acest joc de la capăt?',
  restartConfirm: 'De la capăt',
  quitConfirm: 'Renunță',
  keepPlaying: 'Continuă jocul',
  personalBest: 'Cele mai bune jocuri ale dumneavoastră',
  thisGame: 'acest joc',
  newPersonalBest: 'Un nou record personal.',
  columnRank: '#',
  notRanked: 'Reguli proprii, deci acest joc nu intră în clasament.',
  rankOfTotal: '{rank} din {total}',

  howToPlay: 'Cum se joacă',

  backToGame: 'Înapoi la joc',
  welcomeTitle: 'Bun venit la Blinkered',
  tutorialSkip: 'Sari peste',
  tutorialNext: 'Înainte',
  tutorialBack: 'Înapoi',
  tutorialStart: 'Începe să joci',
  tutorialHideAgain: 'Nu mai arăta asta',
  tutorialProgress: '{n} din {total}',
  tutorialSkipTitle: 'Săriți peste prezentare?',
  tutPickLetters: 'Atingeți literele dorite, în ordine, pentru a forma un cuvânt.',
  tutMoreTurn:
    'Piesele se întorc și în timp ce gândiți, așa că o literă mai bună poate încă să vină.',
  tutTapBack:
    'Ați luat una pe care nu o voiați? Atingeți-o din nou și se întoarce. Oricare, nu doar ultima.',
  tutComplete: 'Apăsați Gata când cuvântul e pregătit.',
  tutControlsTitle: 'Butoanele',
  tutReset: 'Șterge înlătură cuvântul pe care îl formați. Piesele rămân unde sunt.',
  tutPause:
    'Pauza oprește ceasul și ascunde tabla, ca o pauză să nu fie folosită pentru a o învăța.',
  tutRestart: 'De la capăt împarte o tablă nouă de la început. Întreabă mai întâi.',
  tutQuit: 'Renunță încheie jocul și arată cât ați făcut. Întreabă mai întâi.',
  tutDoneTitle: 'Ăsta e tot jocul',
  tutDoneBody: 'Alegeți un nivel și jucați. Cum se joacă este mereu lângă titlu.',
  htBoardTitle: 'Tabla',
  htBoardBody:
    'Piesele se întorc una câte una, în ordinea citirii. Din cele întoarse se formează cuvinte.',
  htWordsTitle: 'Cuvintele',
  htWordsBody: 'Formați un cuvânt din piesele întoarse scriind sau apăsând literele în ordine.',
  htFlipsTitle: 'Mutările',
  htFlipsBody:
    'Fiecare piesă întoarsă costă o mutare. Un cuvânt terminat returnează mutări, iar cuvintele lungi returnează mai multe. Când mutările se termină, jocul s-a încheiat.',
  htRoundTitle: 'Runda',
  htRoundBody:
    'Când se întoarce ultima piesă a rundei, toată tabla stă o clipă. Apoi piesele sunt întoarse pe dos și amestecate, și începe o rundă nouă.',
  htLanguagesTitle: 'Limbile',
  htLanguagesBody:
    'Sunt {n}. Orice tablă poate fi rezolvată cu cuvinte pe care oamenii chiar le folosesc. Un cuvânt rar aduce și el puncte, dacă dicționarul îl cunoaște.',
  htKeysTitle: 'Tastatura',
  htWildTitle: 'Jokerii',
  htWildBody:
    'Uneori apare un joker în loc de literă. Jokerul contează ca orice literă care formează un cuvânt valid. Un cuvânt deja găsit nu contează.',
  htSwapTitle: 'Litere care se schimbă',
  htSwapBody:
    'Uneori, între runde, o literă este înlocuită cu alta. Veți vedea care a plecat și care a venit.',
  htLevelsTitle: 'Nivelurile',
  htLevelEasy:
    'Aceleași douăsprezece litere tot jocul, așa că le puteți învăța și purta o listă de cuvinte în minte. Piesele se întorc încet, iar toată tabla rămâne vizibilă destul ca să terminați alegerea.',
  htLevelMedium:
    'Din când în când o literă se schimbă, deci e mai greu să țineți minte cuvintele păstrate pentru mai târziu. Mai puțin timp de privit și mai puțin de gândit.',
  htLevelHard:
    'Cuvintele de trei litere nu mai contează, iar o literă se schimbă cam la fiecare a doua rundă. Tabla abia apucă să se arate și deja se amestecă.',
  htLevelInsane:
    'Totul deodată, la viteză maximă. Tabla se amestecă aproape imediat după ultima mutare.',
  htTouchTitle: 'Ecranul tactil',
  htTouchBody:
    'Atingeți o piesă întoarsă ca să îi luați litera. Atingeți o literă luată ca să o returnați. Gata și Șterge sunt sub tablă.',

  plurals: {
    words: { one: '{n} cuvânt', few: '{n} cuvinte', other: '{n} de cuvinte' },
    rounds: { one: '{n} rundă', few: '{n} runde', other: '{n} de runde' },
    flips: { one: '{n} mutare', few: '{n} mutări', other: '{n} de mutări' },
    ticks: { one: '{n} bătaie', few: '{n} bătăi', other: '{n} de bătăi' },
    points: { one: '{n} punct', few: '{n} puncte', other: '{n} de puncte' },
  },
}
