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
  tapAWord: 'Buchstaben antippen',

  boardOfTiles: 'Feld mit {n} Steinen',
  faceDown: 'verdeckt',
  spentTile: 'verbrauchter Stein',
  hiddenWhilePaused: 'in der Pause verdeckt',
  letterInWord: '{letter}, Buchstabe {position} des Wortes',

  completeWord: 'Wort abgeben',
  reset: 'Löschen',
  pause: 'Pause',
  resume: 'Weiter',
  newGame: 'Neues Spiel',
  paused: 'Pausiert',
  outOfFlips: 'Keine Züge mehr',
  finalResult: '{score} Punkte mit {words} in {rounds}',
  playAgain: 'Nochmal spielen',

  lettersSelect: 'Buchstaben wählen',
  clearsEvery: 'entfernt alle gewählten {letter}',
  undoLastLetter: 'letzten Buchstaben zurück',
  tapToSelect:
    'ein Buchstabe wird durch Antippen genommen, der letzte durch nochmaliges Antippen zurückgegeben',
  noWordsYet: 'Noch keine Wörter.',

  wordAccepted: '{word}  +{points} Punkte, +{flips} Züge',
  wordRejected: '{word}  {reason}',
  reasonDuplicate: 'schon gefunden',
  reasonTooShort: 'zu kurz',
  reasonNotAWord: 'kein Wort',
  noSuchLetterUp: 'kein {letter} offen',
  nothingUp: 'nichts offen',
  shuffled: 'gemischt',
  shuffledAndBilled: 'gemischt, {flips} unbenutzte Züge berechnet',

  gameLanguage: 'Sprache',
  interfaceLanguage: 'Oberfläche',
  dictionarySize: '{common} häufige von {full} Wörtern',

  nerdMode: 'Expertenmodus',
  rules: 'Regeln',
  difficulty: 'Schwierigkeit',
  difficultyNames: { easy: 'leicht', medium: 'mittel', hard: 'schwer', insane: 'brutal' },
  tiles: 'Steine (N)',
  secondsPerTick: 'Sekunden / Takt',
  holdTicks: 'Haltetakte',
  minWord: 'Mindestwort',
  startingFlips: 'Züge am Start',
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
  quitConfirm: 'Beenden',
  keepPlaying: 'Weiterspielen',
  personalBest: 'Deine besten Spiele',
  thisGame: 'dieses Spiel',
  newPersonalBest: 'Neue persönliche Bestleistung.',
  columnRank: '#',
  notRanked: 'Eigene Regeln, daher wird dieses Spiel nicht gewertet.',
  rankOfTotal: '{rank} von {total}',

  howToPlay: 'Spielanleitung',
  htBoardTitle: 'Das Feld',
  htBoardBody:
    'Die Steine werden einzeln umgedreht, in Leserichtung. Einen Buchstaben sieht man erst, wenn sein Stein sich dreht.',
  htWordsTitle: 'Die Wörter',
  htWordsBody:
    'Bilde ein Wort aus den offenen Steinen. Tippe es, oder klicke sie an. Jeder Stein zählt einmal, und erst nachdem er sich gedreht hat.',
  htFlipsTitle: 'Die Züge',
  htFlipsBody:
    'Jeder Stein, der sich dreht, kostet einen Zug. Ein Wort gibt Züge zurück, und lange Wörter geben mehr. Sind die Züge aufgebraucht, ist das Spiel vorbei.',
  htRoundTitle: 'Die Runde',
  htRoundBody:
    'Dreht sich der letzte Stein einer Runde, liegt das ganze Feld offen. Es bleibt einen Moment so. Dann wird gemischt und neu ausgelegt.',
  htLanguagesTitle: 'Die Sprachen',
  htLanguagesBody:
    'Sechzehn. Jedes Feld lässt sich mit gebräuchlichen Wörtern lösen. Ein seltenes Wort zählt trotzdem, wenn das Wörterbuch es kennt.',
  htKeysTitle: 'Die Tastatur',
  htTouchTitle: 'Der Berührungsbildschirm',
  htTouchBody:
    'Tippe ein aufgedecktes Plättchen an, um seinen Buchstaben zu nehmen. Tippe den letzten Buchstaben noch einmal an, um ihn zurückzugeben. Wort abgeben und Löschen liegen unter dem Brett.',

  plurals: {
    words: { one: '{n} Wort', other: '{n} Wörter' },
    rounds: { one: '{n} Runde', other: '{n} Runden' },
    flips: { one: '{n} Zug', other: '{n} Züge' },
    ticks: { one: '{n} Takt', other: '{n} Takte' },
    points: { one: '{n} Punkt', other: '{n} Punkte' },
  },
}
