import type { Messages } from '../messages.js'

/**
 * Finnish. Counts take the partitive singular, which is why the plural forms read `2 sanaa`
 * rather than `2 sanat`: `Intl.PluralRules` calls that `other` and it is not a plural at all.
 */
export const fi: Messages = {
  tag: 'fi',

  readingDictionary: 'Luetaan sanakirjaa…',
  noWordList: 'Ei sanalistaa kielelle ”{language}”. Rakenna se:  pnpm dictionary build',
  emptyWordList: 'Sanalista kielelle ”{language}” on tyhjä.',

  flips: 'siirrot',
  score: 'pisteet',
  words: 'sanat',
  round: 'kierros',
  ticksLeftLabel: 'Kierroksella jäljellä oleva aika',
  typeAWord: 'kirjoita sana',
  tapPrompt: 'kosketa ottaaksesi tai palauttaaksesi, sitten {action}',

  boardOfTiles: 'Pelilauta, {n} laattaa',
  faceDown: 'nurin',
  wildCard: 'jokeri',
  wildKey: 'mikä tahansa kirjain',
  letterReplaced: '{from} muuttui kirjaimeksi {to}',
  letterSwap: 'KIRJAIN VAIHTUI!',
  spentTile: 'käytetty laatta',
  hiddenWhilePaused: 'piilotettu tauon ajaksi',
  letterInWord: '{letter}, sanan {position}. kirjain',

  completeWord: 'Hyväksy sana',
  completeShort: 'Hyväksy',
  reset: 'Tyhjennä',
  pause: 'Tauko',
  resume: 'Jatka',
  newGame: 'Uusi peli',
  paused: 'Tauolla',
  outOfFlips: 'Siirrot loppuivat',
  finalResult: '{score} pistettä, {words} {rounds}',
  playAgain: 'Pelaa uudelleen',
  share: 'Jaa',
  shareCopied: 'Kopioitu.',
  shareSelect: 'Kopioi tämä:',

  lettersSelect: 'kirjaimet valitsevat',
  clearsEvery: 'poistaa kaikki valitut {letter}-kirjaimet',
  undoLastLetter: 'peruu viimeisen kirjaimen',
  noWordsYet: 'Ei vielä sanoja.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'jo löydetty',
  reasonTooShort: 'liian lyhyt',
  reasonNotAWord: 'ei ole sana',
  reasonAllFound: 'sinulla on ne jo kaikki',
  noSuchLetterUp: 'ei {letter}-kirjainta näkyvissä',
  nothingUp: 'ei mitään näkyvissä',
  shuffled: 'sekoitettu',
  shuffledAndBilled: 'sekoitettu, veloitettiin {flips} käyttämätöntä siirtoa',

  gameLanguage: 'kieli',
  interfaceLanguage: 'käyttöliittymä',
  dictionarySize: '{common} yleistä / {full} sanaa',

  nerdMode: 'asiantuntijatila',
  rules: 'Säännöt',
  difficulty: 'vaikeustaso',
  difficultyNames: { easy: 'helppo', medium: 'normaali', hard: 'vaikea', insane: 'raaka' },
  tiles: 'laatat (N)',
  secondsPerTick: 'sekuntia / askel',
  holdTicks: 'pitoaskeleet',
  minWord: 'lyhin sana',
  startingFlips: 'siirrot alussa',
  wildChance: 'jokerin todennäköisyys',
  replaceChance: 'kirjaimen vaihtumisen todennäköisyys',
  wordCompleteMode: 'sana valmis',
  wordCompleteNames: { shuffle: 'sekoita', spend: 'kuluta', keep: 'säilytä' },
  flipEconomy: 'siirtotalous',
  flipEconomyNames: {
    none: 'ei mitään',
    perLetter: 'kirjainta kohti',
    fibonacci: 'fibonacci',
    overMinimum: 'yli minimin',
  },
  repeatedLetterKey: 'toistuvan kirjaimen näppäin',
  keySchemeNames: { cycle: 'kierrätä', advance: 'edistä' },
  keySchemeHelp: {
    cycle:
      'A ottaa seuraavan vapaan A:n, ja kun kaikki ovat sanassa, se poistaa ne. ' +
      'Vaihto+A poistaa ne myös.',
    advance: 'A ottaa seuraavan vapaan A:n. Vaihto+A poistaa sanasta kaikki A:t.',
  },

  whatThatMeans: 'Mitä se tarkoittaa',
  factRound: 'kierros',
  factWholeBoardUp: 'koko lauta näkyvissä',
  factRoundCosts: 'kierros kustantaa',
  factFlipsBuy: 'aloitussiirrot riittävät',
  factThisBoard: 'tämä lauta',
  factBoardHadToAdmit: 'laudan oli sallittava',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, pisin {longest}',
  wordsIncludingOneOf: '{words}, joista yksi {ceiling} kirjaimen',
  scorelessRounds: '{rounds} ilman pisteitä',

  whatAWordPays: 'Mitä sana tuottaa',
  columnLetters: 'kirjaimet',
  columnCost: 'hinta',
  columnPoints: 'pisteet',
  columnFlips: 'siirrot',
  columnNet: 'netto',

  canonicalRules: 'Viralliset {difficulty}-säännöt.',
  customRules: 'Muutettu esiasetuksesta. Omilla säännöillä saatuja tuloksia ei sijoiteta.',
  applyAndStart: 'Ota käyttöön ja aloita uusi peli',
  changesNextGame: 'Muutokset vaikuttavat seuraavaan peliin.',
  presets: 'Esiasetukset:',

  start: 'Aloita',
  restart: 'Aloita uudelleen',
  quit: 'Lopeta',
  quitTitle: 'Lopetetaanko tämä peli?',
  restartTitle: 'Aloitetaanko peli alusta?',
  restartConfirm: 'Alusta',
  quitConfirm: 'Lopeta',
  keepPlaying: 'Jatka pelaamista',
  personalBest: 'Parhaat pelisi',
  thisGame: 'tämä peli',
  newPersonalBest: 'Uusi henkilökohtainen ennätys.',
  columnRank: '#',
  notRanked: 'Omat säännöt, joten tätä peliä ei sijoiteta.',
  rankOfTotal: '{rank} / {total}',

  howToPlay: 'Näin pelataan',

  backToGame: 'Takaisin peliin',
  welcomeTitle: 'Tervetuloa Blinkerediin',
  tutorialSkip: 'Ohita',
  tutorialNext: 'Seuraava',
  tutorialBack: 'Takaisin',
  tutorialStart: 'Aloita peli',
  tutorialHideAgain: 'Älä näytä uudelleen',
  tutorialProgress: '{n} / {total}',
  tutorialSkipTitle: 'Ohitetaanko esittely?',
  tutPickLetters:
    'Napauta haluamiasi kirjaimia. Ne liittyvät sanaan siinä järjestyksessä kuin napautat.',
  tutMoreTurn:
    'Laatat kääntyvät edelleen sillä aikaa kun mietit, joten parempi kirjain voi olla vielä tulossa.',
  tutTapBack:
    'Napautitko väärää? Napauta sitä uudelleen ja saat sen takaisin. Mitä tahansa, ei vain viimeistä.',
  tutComplete: 'Paina Valmis, kun sana on kasassa.',
  tutControlsTitle: 'Painikkeet',
  tutReset: 'Tyhjennä poistaa sanan, jota olet kokoamassa. Laatat jäävät paikoilleen.',
  tutPause:
    'Tauko pysäyttää kellon ja piilottaa laudan, jottei taukoa voi käyttää sen tutkimiseen.',
  tutRestart: 'Aloita alusta jakaa uuden laudan alusta. Se kysyy ensin.',
  tutQuit: 'Lopeta päättää pelin ja näyttää pistemääräsi. Se kysyy ensin.',
  tutDoneTitle: 'Siinä koko peli',
  tutDoneBody: 'Valitse taso ja pelaa. Pelin ohjeet löytyvät aina otsikkopalkista.',
  htBoardTitle: 'Pelilauta',
  htBoardBody:
    'Laatat kääntyvät esiin yksi kerrallaan, lukusuunnassa. Kirjainta ei näe ennen kuin sen laatta kääntyy.',
  htWordsTitle: 'Sanat',
  htWordsBody:
    'Muodosta sana näkyvistä laatoista. Kirjoita se, tai napsauta niitä. Jokainen laatta kelpaa kertaalleen, ja vasta kun se on kääntynyt.',
  htFlipsTitle: 'Siirrot',
  htFlipsBody:
    'Jokainen kääntyvä laatta kuluttaa yhden siirron. Sana palauttaa siirtoja, ja pitkät sanat palauttavat enemmän. Kun siirrot loppuvat, peli päättyy.',
  htRoundTitle: 'Kierros',
  htRoundBody:
    'Kun kierroksen viimeinen laatta kääntyy, koko lauta on näkyvissä. Se pysyy niin hetken. Sitten se sekoitetaan ja jaetaan uudelleen.',
  htLanguagesTitle: 'Kielet',
  htLanguagesBody:
    'Kuusitoista. Jokainen lauta ratkeaa arkisilla sanoilla. Harvinainen sana kelpaa silti, jos sanakirja tuntee sen.',
  htKeysTitle: 'Näppäimistö',
  htWildTitle: 'Jokerit',
  htWildBody:
    'Osa laatoista kääntyy jokeriksi kirjaimen sijaan. Jokeri käy siitä kirjaimesta, joka muodostaa sanan, valittuna niistä jotka sopivat, ja kumpi se oli näkyy kun sana ilmestyy listaasi. Jo löytämäsi sana ei kelpaa.',
  htSwapTitle: 'Vaihtuvat kirjaimet',
  htSwapBody:
    'Joskus kierrosten välissä yksi laatta vaihtaa kirjaintaan. Näet kumpi lähtee ja kumpi tulee, mutta et sitä missä se on. Muistamiasi kirjaimia ei ehkä enää ole.',
  htLevelsTitle: 'Vaikeustasot',
  htLevelEasy:
    'Samat kaksitoista kirjainta koko pelin ajan, joten ehdit opetella ne ja pitää sanalistaa mielessäsi. Laatat kääntyvät hitaasti ja koko lauta näkyy tarpeeksi kauan, että ehdit suunnitella sanan.',
  htLevelMedium:
    'Silloin tällöin yksi kirjain vaihtuu, eikä mielessä pitämäsi lista enää pidä paikkaansa. Vähemmän aikaa katsoa ja vähemmän aikaa ajatella.',
  htLevelHard:
    'Kolmen kirjaimen sanat eivät enää kelpaa, ja kirjain vaihtuu suunnilleen joka toinen kierros. Lauta ehtii tuskin näkyä ennen kuin se sekoitetaan.',
  htLevelInsane:
    'Kaikki yhtä aikaa ja täydellä vauhdilla. Lauta katoaa lähes heti kun se on kokonainen, eikä mitään ehdi painaa mieleen.',
  htTouchTitle: 'Kosketusnäyttö',
  htTouchBody:
    'Kosketa käännettyä laattaa ottaaksesi sen kirjaimen. Kosketa mitä tahansa ottamaasi kirjainta palauttaaksesi sen. Hyväksy ja Tyhjennä ovat laudan alla.',

  plurals: {
    words: { one: '{n} sana', other: '{n} sanaa' },
    rounds: { one: '{n} kierros', other: '{n} kierrosta' },
    flips: { one: '{n} siirto', other: '{n} siirtoa' },
    ticks: { one: '{n} askel', other: '{n} askelta' },
    points: { one: '{n} piste', other: '{n} pistettä' },
  },
}
