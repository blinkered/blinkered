import type { Messages } from '../messages.js'

/**
 * German. `Züge` for flips, because a `Drehung` is what the tile does and a `Zug` is what it
 * costs you, and the meter is a currency.
 */
export const de: Messages = {
  tag: 'de',

  readingDictionary: 'Wörterbuch wird gelesen…',
  noWordList: 'Keine Wortliste für „{language}“. Erzeuge sie:  pnpm dictionary build',
  emptyWordList: 'Die Wortliste für „{language}“ ist leer.',

  flips: 'Züge',
  score: 'Punkte',
  words: 'Wörter',
  round: 'Runde',
  ticksLeftLabel: 'Restzeit in dieser Runde',
  typeAWord: 'Wort eingeben',
  tapPrompt: 'antippen: nehmen oder zurückgeben, dann {action}',

  boardOfTiles: 'Feld mit {n} Steinen',
  faceDown: 'verdeckt',
  wildCard: 'Joker',
  wildKey: 'ein beliebiger Buchstabe',
  letterReplaced: 'Aus {from} wurde {to}',
  letterSwap: 'BUCHSTABENTAUSCH!',
  spentTile: 'verbrauchter Stein',
  hiddenWhilePaused: 'in der Pause verdeckt',
  letterInWord: '{letter}, Buchstabe {position} des Wortes',

  completeWord: 'Wort abgeben',
  completeShort: 'Abgeben',
  reset: 'Löschen',
  pause: 'Pause',
  resume: 'Weiter',
  newGame: 'Neues Spiel',
  paused: 'Pausiert',
  outOfFlips: 'Keine Züge mehr',
  finalResult: '{score} Punkte mit {words} in {rounds}',
  playAgain: 'Nochmal spielen',
  share: 'Teilen',
  shareCopied: 'Kopiert.',
  shareSelect: 'Das hier kopieren:',

  lettersSelect: 'Buchstaben wählen',
  keysWild: 'wird genommen, wenn du einen Buchstaben tippst, den kein Stein zeigt',
  clearsEvery: 'entfernt alle gewählten {letter}',
  undoLastLetter: 'letzten Buchstaben zurück',
  noWordsYet: 'Noch keine Wörter.',

  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'schon gefunden',
  reasonTooShort: 'zu kurz',
  reasonNotAWord: 'kein Wort',
  reasonAllFound: 'die hast du alle schon',
  noSuchLetterUp: 'kein {letter} offen',
  nothingUp: 'nichts offen',
  shuffled: 'gemischt',
  shuffledAndBilled: 'gemischt, {flips} unbenutzte Züge berechnet',

  gameLanguage: 'Sprache',
  interfaceLanguage: 'Oberfläche',
  dictionarySize: '{common} häufige von {full} Wörtern',
  filterLanguages: 'Sprachen suchen',
  noMatches: 'Keine Treffer',

  nerdMode: 'Expertenmodus',
  rules: 'Regeln',
  difficulty: 'Schwierigkeit',
  difficultyNames: { easy: 'leicht', medium: 'mittel', hard: 'schwer', insane: 'brutal' },
  tiles: 'Steine (N)',
  secondsPerTick: 'Sekunden / Takt',
  holdTicks: 'Haltetakte',
  minWord: 'Mindestwort',
  startingFlips: 'Züge am Start',
  wildChance: 'Joker-Wahrscheinlichkeit',
  replaceChance: 'Wahrscheinlichkeit für Buchstabentausch',
  wordCompleteMode: 'Wort fertig',
  wordCompleteNames: { shuffle: 'mischen', spend: 'verbrauchen', keep: 'behalten' },
  flipEconomy: 'Zugwirtschaft',
  flipEconomyNames: {
    none: 'keine',
    perLetter: 'pro Buchstabe',
    fibonacci: 'Fibonacci',
    overMinimum: 'über Minimum',
  },
  repeatedLetterKey: 'Taste bei Doppelbuchstaben',
  keySchemeNames: { cycle: 'durchlaufen', advance: 'weiterrücken' },
  keySchemeHelp: {
    cycle:
      'A nimmt das nächste freie A, und sobald alle im Wort sind, entfernt es sie. ' +
      'Umschalt+A entfernt sie ebenfalls.',
    advance: 'A nimmt das nächste freie A. Umschalt+A entfernt jedes A aus dem Wort.',
  },

  whatThatMeans: 'Was das bedeutet',
  factRound: 'eine Runde',
  factWholeBoardUp: 'ganzes Feld offen für',
  factRoundCosts: 'eine Runde kostet',
  factFlipsBuy: 'Startzüge reichen für',
  factThisBoard: 'dieses Feld',
  factBoardHadToAdmit: 'Feld musste zulassen',
  ticksAndSeconds: '{ticks}, {seconds}',
  wordsLongest: '{words}, längstes {longest}',
  wordsIncludingOneOf: '{words}, davon eins mit {ceiling}',
  scorelessRounds: '{rounds} ohne Punkte',

  whatAWordPays: 'Was ein Wort einbringt',
  columnLetters: 'Buchstaben',
  columnCost: 'Kosten',
  columnPoints: 'Punkte',
  columnFlips: 'Züge',
  columnNet: 'netto',

  canonicalRules: 'Reguläre Regeln für {difficulty}.',
  customRules: 'Von der Vorgabe abgewichen. Punkte mit eigenen Regeln werden nicht gewertet.',
  applyAndStart: 'Übernehmen und neu starten',
  changesNextGame: 'Änderungen gelten ab dem nächsten Spiel.',
  presets: 'Vorgaben:',

  start: 'Starten',
  restart: 'Neu starten',
  quit: 'Beenden',
  quitTitle: 'Dieses Spiel beenden?',
  restartTitle: 'Dieses Spiel neu starten?',
  restartConfirm: 'Neu starten',
  quitConfirm: 'Beenden',
  keepPlaying: 'Weiterspielen',
  personalBest: 'Deine besten Spiele',
  thisGame: 'dieses Spiel',
  newPersonalBest: 'Neue persönliche Bestleistung.',
  columnRank: '#',
  notRanked: 'Eigene Regeln, daher wird dieses Spiel nicht gewertet.',
  rankOfTotal: '{rank} von {total}',

  howToPlay: 'Spielanleitung',

  backToGame: 'Zurück zum Spiel',
  welcomeTitle: 'Willkommen bei Blinkered',
  tutorialSkip: 'Überspringen',
  tutorialNext: 'Weiter',
  tutorialBack: 'Zurück',
  tutorialStart: 'Spiel starten',
  tutorialHideAgain: 'Nicht mehr anzeigen',
  tutorialProgress: '{n} von {total}',
  tutorialSkipTitle: 'Einführung überspringen?',
  tutPickLetters: 'Tippe die Buchstaben, die du willst, der Reihe nach an, um ein Wort zu bilden.',
  tutMoreTurn:
    'Während Sie überlegen, drehen sich weitere Plättchen um: ein besserer Buchstabe kann noch kommen.',
  tutTapBack:
    'Versehentlich einen genommen? Tippen Sie ihn noch einmal an, um ihn zurückzugeben. Jeden, nicht nur den letzten.',
  tutComplete: 'Drücken Sie Fertig, wenn das Wort steht.',
  tutControlsTitle: 'Die Schaltflächen',
  tutReset: 'Zurücksetzen leert das Wort, das Sie gerade bilden. Die Plättchen bleiben liegen.',
  tutPause:
    'Pause hält die Uhr an und verdeckt das Feld, damit eine Pause nicht zum Studieren dient.',
  tutRestart: 'Neustart teilt ein neues Feld von vorn aus. Es fragt vorher nach.',
  tutQuit: 'Beenden schließt die Partie ab und zeigt Ihr Ergebnis. Es fragt vorher nach.',
  tutDoneTitle: 'Das ist das ganze Spiel',
  tutDoneBody:
    'Wählen Sie eine Stufe und spielen Sie. Die Anleitung bleibt oben in der Titelleiste.',
  htBoardTitle: 'Das Feld',
  htBoardBody:
    'Die Steine werden einzeln umgedreht, in Leserichtung. Aus den offenen Steinen bildest du Wörter.',
  htWordsTitle: 'Die Wörter',
  htWordsBody:
    'Bilde ein Wort aus den offenen Steinen, indem du die Buchstaben der Reihe nach tippst oder anklickst.',
  htFlipsTitle: 'Die Züge',
  htFlipsBody:
    'Jeder Stein, der sich dreht, kostet einen Zug. Ein fertiges Wort schreibt Züge wieder gut, und lange Wörter geben mehr. Sind die Züge aufgebraucht, ist das Spiel vorbei.',
  htRoundTitle: 'Die Runde',
  htRoundBody:
    'Dreht sich der letzte Stein einer Runde, liegt das ganze Feld einen Moment offen. Dann werden die Steine umgedreht und gemischt, und eine neue Runde beginnt.',
  htLanguagesTitle: 'Die Sprachen',
  htLanguagesBody:
    '{n}. Jedes Feld lässt sich mit gebräuchlichen Wörtern lösen. Ein seltenes Wort zählt trotzdem, wenn das Wörterbuch es kennt.',
  htKeysTitle: 'Die Tastatur',
  htWildTitle: 'Joker',
  htWildBody:
    'Manchmal erscheint ein Joker statt eines Buchstabens. Ein Joker gilt als jeder Buchstabe, der ein gültiges Wort ergibt. Ein bereits gefundenes Wort zählt nicht.',
  htSwapTitle: 'Wechselnde Buchstaben',
  htSwapBody:
    'Manchmal wird zwischen den Runden ein Buchstabe durch einen anderen ersetzt. Du siehst, welcher Buchstabe weg ist und welcher dazugekommen ist.',
  htLevelsTitle: 'Die Stufen',
  htLevelEasy:
    'Dieselben zwölf Buchstaben die ganze Partie über: du kannst sie dir einprägen und eine Wortliste im Kopf behalten. Die Steine drehen sich langsam, und das volle Feld bleibt lange genug sichtbar, um deine Buchstaben in Ruhe auszuwählen.',
  htLevelMedium:
    'Ab und zu wechselt ein Buchstabe, und dann wird es schwerer, sich Wörter zu merken, die du später spielen wolltest. Weniger Zeit zum Schauen und weniger zum Nachdenken.',
  htLevelHard:
    'Wörter mit drei Buchstaben zählen nicht mehr, und etwa jede zweite Runde wechselt ein Buchstabe. Das Feld ist kaum zu sehen, bevor neu gemischt wird.',
  htLevelInsane:
    'Alles auf einmal, in vollem Tempo. Das Feld wird fast unmittelbar nach dem letzten Zug gemischt.',
  htTouchTitle: 'Der Berührungsbildschirm',
  htTouchBody:
    'Tippe ein aufgedecktes Plättchen an, um seinen Buchstaben zu nehmen. Tippe einen genommenen Buchstaben an, um ihn zurückzugeben. Abgeben und Löschen liegen unter dem Brett.',

  plurals: {
    words: { one: '{n} Wort', other: '{n} Wörter' },
    rounds: { one: '{n} Runde', other: '{n} Runden' },
    flips: { one: '{n} Zug', other: '{n} Züge' },
    ticks: { one: '{n} Takt', other: '{n} Takte' },
    points: { one: '{n} Punkt', other: '{n} Punkte' },
  },
}
