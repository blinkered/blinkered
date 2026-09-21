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
  de: {
    tiles: ['D', 'E', 'R', 'W', 'E', 'N'],
    three: 'DER',
    six: 'WERDEN',
    card: { at: 5, becomes: 'I', word: 'WIEDER' },
    swap: { from: 'W', to: 'T' },
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
  fr: {
    tiles: ['M', 'O', 'N', 'A', 'I', 'S'],
    three: 'MON',
    six: 'MAISON',
    card: { at: 0, becomes: 'R', word: 'RAISON' },
    swap: { from: 'M', to: 'E' },
  },
  ko: {
    tiles: ['ㅇ', 'ㅏ', 'ㄴ', 'ㅈ', 'ㄱ', 'ㅡ'],
    three: 'ㅇㅏㄴ',
    six: 'ㅈㅏㄱㅇㅡㄴ',
    card: { at: 3, becomes: 'ㅌ', word: 'ㄱㅏㅌㅇㅡㄴ' },
    swap: { from: 'ㅡ', to: 'ㄹ' },
  },
  ru: {
    tiles: ['О', 'Н', 'А', 'Д', 'Л', 'Ж'],
    three: 'ОНА',
    six: 'ДОЛЖНА',
    card: { at: 2, becomes: 'Е', word: 'ДОЛЖЕН' },
    swap: { from: 'Ж', to: 'Е' },
  },
  tl: {
    tiles: ['A', 'N', 'G', 'G', 'L', 'I'],
    three: 'ANG',
    six: 'GALING',
    card: { at: 4, becomes: 'M', word: 'MAGING' },
    swap: { from: 'G', to: 'O' },
  },
}
