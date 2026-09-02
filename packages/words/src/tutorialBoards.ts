import type { TutorialBoard } from './tutorialBoard.js'

/**
 * A six-tile board per language for the first-run tour, and the three words it plays on it.
 *
 * Generated, not chosen. Each board is a real six-tile word from that language's own common
 * tier, arranged so that its first three tiles are themselves a word: the tour opens by spelling
 * that short one, gives the letters back, and spells the long one. The card masks one tile and
 * turns into a letter that makes a third word from the other five, which is the whole point of a
 * card and cannot be demonstrated with a letter already on the board.
 *
 * Ranked by corpus frequency, worst of the three words first, so a board only scores well when
 * every word on it is one a speaker uses rather than one a dictionary admits. The shipped
 * candidates run from rank 66 to rank 421, which is comfortably inside everyday
 * vocabulary.
 *
 * English is the exception and is chosen rather than generated. SAT to STAGES to GASSES teaches
 * the card better than anything the ranking picked: the card becomes a third S, and the board
 * holds two. A card that hands you a letter you could have tapped yourself makes the mechanic
 * look like a long way round.
 *
 * `tutorialBoard.test.ts` checks every one of these against the shipped word lists, because a
 * table of words that drifts from the dictionary is the kind of thing that stays wrong for a
 * year. Regenerate with tools/dictionary; see docs/DICTIONARIES.md.
 */
export const TUTORIAL_BOARDS: Readonly<Record<string, TutorialBoard>> = {
  af: {
    tiles: ['D', 'I', 'E', 'A', 'N', 'K'],
    three: 'DIE',
    six: 'DANKIE',
    card: { at: 5, becomes: 'M', word: 'IEMAND' },
    swap: { from: 'D', to: 'R' },
  },
  ar: {
    tiles: ['ك', 'ا', 'ن', 'ي', 'م', 'ن'],
    three: 'كان',
    six: 'يمكننا',
    card: { at: 1, becomes: 'ي', word: 'يمكنني' },
    swap: { from: 'ك', to: 'ل' },
  },
  de: {
    tiles: ['D', 'E', 'R', 'W', 'E', 'N'],
    three: 'DER',
    six: 'WERDEN',
    card: { at: 5, becomes: 'I', word: 'WIEDER' },
    swap: { from: 'W', to: 'T' },
  },
  el: {
    tiles: ['Π', 'Ε', 'Ι', 'Π', 'Ρ', 'Ε'],
    three: 'ΠΕΙ',
    six: 'ΠΡΕΠΕΙ',
    card: { at: 2, becomes: 'Ε', word: 'ΕΠΡΕΠΕ' },
    swap: { from: 'Π', to: 'Α' },
  },
  en: {
    tiles: ['S', 'A', 'T', 'G', 'E', 'S'],
    three: 'SAT',
    six: 'STAGES',
    card: { at: 2, becomes: 'S', word: 'GASSES' },
    swap: { from: 'G', to: 'N' },
  },
  es: {
    tiles: ['Q', 'U', 'E', 'P', 'O', 'R'],
    three: 'QUE',
    six: 'PORQUE',
    card: { at: 3, becomes: 'I', word: 'QUIERO' },
    swap: { from: 'Q', to: 'A' },
  },
  fi: {
    tiles: ['I', 'S', 'Ä', 'E', 'L', 'L'],
    three: 'ISÄ',
    six: 'SIELLÄ',
    card: { at: 1, becomes: 'M', word: 'MEILLÄ' },
    swap: { from: 'Ä', to: 'A' },
  },
  fr: {
    tiles: ['M', 'O', 'N', 'A', 'I', 'S'],
    three: 'MON',
    six: 'MAISON',
    card: { at: 0, becomes: 'R', word: 'RAISON' },
    swap: { from: 'M', to: 'E' },
  },
  he: {
    tiles: ['י', 'ו', 'מ', 'א', 'מ', 'ר'],
    three: 'יומ',
    six: 'אומרימ',
    card: { at: 2, becomes: 'ח', word: 'מאחורי' },
    swap: { from: 'א', to: 'ה' },
  },
  hr: {
    tiles: ['I', 'L', 'I', 'M', 'S', 'M'],
    three: 'ILI',
    six: 'MISLIM',
    card: { at: 5, becomes: 'Š', word: 'MISLIŠ' },
    swap: { from: 'L', to: 'A' },
  },
  id: {
    tiles: ['A', 'P', 'A', 'K', 'E', 'N'],
    three: 'APA',
    six: 'KENAPA',
    card: { at: 1, becomes: 'R', word: 'KARENA' },
    swap: { from: 'P', to: 'I' },
  },
  it: {
    tiles: ['S', 'T', 'A', 'Q', 'U', 'E'],
    three: 'STA',
    six: 'QUESTA',
    card: { at: 2, becomes: 'O', word: 'QUESTO' },
    swap: { from: 'Q', to: 'I' },
  },
  la: {
    tiles: ['U', 'N', 'A', 'I', 'S', 'L'],
    three: 'UNA',
    six: 'INSULA',
    card: { at: 4, becomes: 'G', word: 'LINGUA' },
    swap: { from: 'L', to: 'E' },
  },
  ms: {
    tiles: ['D', 'A', 'N', 'A', 'T', 'G'],
    three: 'DAN',
    six: 'DATANG',
    card: { at: 0, becomes: 'S', word: 'SANGAT' },
    swap: { from: 'D', to: 'E' },
  },
  nl: {
    tiles: ['E', 'E', 'N', 'A', 'D', 'R'],
    three: 'EEN',
    six: 'ANDERE',
    card: { at: 1, becomes: 'S', word: 'ANDERS' },
    swap: { from: 'D', to: 'I' },
  },
  no: {
    tiles: ['J', 'E', 'G', 'E', 'R', 'N'],
    three: 'JEG',
    six: 'GJERNE',
    card: { at: 0, becomes: 'P', word: 'PENGER' },
    swap: { from: 'J', to: 'A' },
  },
  pt: {
    tiles: ['S', 'E', 'R', 'E', 'P', 'A'],
    three: 'SER',
    six: 'ESPERA',
    card: { at: 5, becomes: 'M', word: 'SEMPRE' },
    swap: { from: 'P', to: 'O' },
  },
  'pt-BR': {
    tiles: ['L', 'H', 'E', 'M', 'O', 'R'],
    three: 'LHE',
    six: 'MELHOR',
    card: { at: 4, becomes: 'U', word: 'MULHER' },
    swap: { from: 'H', to: 'A' },
  },
  ru: {
    tiles: ['О', 'Н', 'А', 'Д', 'Л', 'Ж'],
    three: 'ОНА',
    six: 'ДОЛЖНА',
    card: { at: 2, becomes: 'Е', word: 'ДОЛЖЕН' },
    swap: { from: 'Ж', to: 'Е' },
  },
  sv: {
    tiles: ['N', 'Ä', 'R', 'K', 'N', 'E'],
    three: 'NÄR',
    six: 'KÄNNER',
    card: { at: 4, becomes: 'T', word: 'TÄNKER' },
    swap: { from: 'Ä', to: 'A' },
  },
  sw: {
    tiles: ['K', 'W', 'A', 'A', 'T', 'I'],
    three: 'KWA',
    six: 'WAKATI',
    card: { at: 1, becomes: 'K', word: 'KATIKA' },
    swap: { from: 'T', to: 'U' },
  },
  tl: {
    tiles: ['A', 'N', 'G', 'G', 'L', 'I'],
    three: 'ANG',
    six: 'GALING',
    card: { at: 4, becomes: 'M', word: 'MAGING' },
    swap: { from: 'G', to: 'O' },
  },
  tr: {
    tiles: ['B', 'A', 'Y', 'U', 'R', 'A'],
    three: 'BAY',
    six: 'BURAYA',
    card: { at: 2, becomes: 'D', word: 'BURADA' },
    swap: { from: 'B', to: 'E' },
  },
}
