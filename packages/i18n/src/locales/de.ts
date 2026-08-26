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

  plurals: {
    words: { one: '{n} Wort', other: '{n} Wörter' },
    rounds: { one: '{n} Runde', other: '{n} Runden' },
    flips: { one: '{n} Zug', other: '{n} Züge' },
    ticks: { one: '{n} Takt', other: '{n} Takte' },
    points: { one: '{n} Punkt', other: '{n} Punkte' },
  },
}
