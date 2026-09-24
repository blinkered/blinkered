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
 * every word on it is one a speaker uses rather than one a dictionary admits. Most of the shipped
 * boards sit between rank 60 and rank 450, which is comfortably inside everyday vocabulary.
 *
 * Three rank far worse and are still fine, because the number is about the corpus rather than
 * the words. Hebrew (1111) and Georgian (3008) have small subtitle corpora. Serbian (2726) is
 * ranked against subtitles written almost entirely in Latin script, so ИЛИ and МИСЛИМ look rare
 * to it when they are not.
 *
 * Swahili, Irish, Welsh and Naijá have no OpenSubtitles list at all. Their boards were ranked
 * by each word list's own order, which roughly follows frequency but carries crawl noise (Irish
 * opens on THE, which is English), and then chosen by reading them: KWA, WAKATI and KATIKA; INA,
 * BLIAIN and BLIANA; SIR, SIARAD and CARIAD; DON, GROUND and AROUND.
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
    tiles: ['D', 'I', 'E', 'M', 'A', 'N'],
    three: 'DIE',
    six: 'IEMAND',
    card: { at: 3, becomes: 'K', word: 'DANKIE' },
    swap: { from: 'M', to: 'R' },
  },
  ar: {
    tiles: ['ي', 'ك', 'ن', 'ي', 'م', 'ن'],
    three: 'يكن',
    six: 'يمكنني',
    card: { at: 0, becomes: 'ا', word: 'يمكننا' },
    swap: { from: 'ك', to: 'ا' },
  },
  bg: {
    tiles: ['А', 'К', 'О', 'О', 'Г', 'Т'],
    three: 'АКО',
    six: 'КОГАТО',
    card: { at: 4, becomes: 'Д', word: 'ДОКАТО' },
    swap: { from: 'Г', to: 'Е' },
  },
  ca: {
    tiles: ['S', 'E', 'R', 'N', 'Y', 'O'],
    three: 'SER',
    six: 'SENYOR',
    card: { at: 4, becomes: 'T', word: 'NOSTRE' },
    swap: { from: 'Y', to: 'A' },
  },
  cs: {
    tiles: ['D', 'E', 'N', 'E', 'B', 'U'],
    three: 'DEN',
    six: 'NEBUDE',
    card: { at: 2, becomes: 'M', word: 'BUDEME' },
    swap: { from: 'B', to: 'O' },
  },
  cy: {
    tiles: ['S', 'I', 'R', 'A', 'A', 'D'],
    three: 'SIR',
    six: 'SIARAD',
    card: { at: 0, becomes: 'C', word: 'CARIAD' },
    swap: { from: 'S', to: 'E' },
  },
  da: {
    tiles: ['D', 'E', 'T', 'S', 'I', 'S'],
    three: 'DET',
    six: 'SIDSTE',
    card: { at: 3, becomes: 'V', word: 'VIDSTE' },
    swap: { from: 'D', to: 'R' },
  },
  de: {
    tiles: ['D', 'E', 'R', 'W', 'E', 'N'],
    three: 'DER',
    six: 'WERDEN',
    card: { at: 5, becomes: 'I', word: 'WIEDER' },
    swap: { from: 'W', to: 'T' },
  },
  el: {
    tiles: ['Κ', 'Α', 'Ι', 'Ν', 'Ε', 'Σ'],
    three: 'ΚΑΙ',
    six: 'ΚΑΝΕΙΣ',
    card: { at: 2, becomes: 'Ε', word: 'ΕΚΑΝΕΣ' },
    swap: { from: 'Κ', to: 'Ο' },
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
  et: {
    tiles: ['K', 'U', 'I', 'N', 'A', 'G'],
    three: 'KUI',
    six: 'KUNAGI',
    card: { at: 0, becomes: 'S', word: 'SINUGA' },
    swap: { from: 'G', to: 'E' },
  },
  eu: {
    tiles: ['Z', 'E', 'N', 'G', 'O', 'A'],
    three: 'ZEN',
    six: 'GOAZEN',
    card: { at: 1, becomes: 'I', word: 'IZANGO' },
    swap: { from: 'G', to: 'I' },
  },
  fa: {
    tiles: ['ب', 'و', 'د', 'ا', 'ر', 'ه'],
    three: 'بود',
    six: 'دوباره',
    card: { at: 1, becomes: 'ر', word: 'درباره' },
    swap: { from: 'ب', to: 'ی' },
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
  ga: {
    tiles: ['I', 'N', 'A', 'B', 'L', 'I'],
    three: 'INA',
    six: 'BLIAIN',
    card: { at: 0, becomes: 'A', word: 'BLIANA' },
    swap: { from: 'B', to: 'H' },
  },
  gl: {
    tiles: ['L', 'L', 'E', 'M', 'O', 'R'],
    three: 'LLE',
    six: 'MELLOR',
    card: { at: 4, becomes: 'U', word: 'MULLER' },
    swap: { from: 'L', to: 'A' },
  },
  he: {
    tiles: ['כ', 'מ', 'ו', 'נ', 'י', 'ת'],
    three: 'כמו',
    six: 'מכונית',
    card: { at: 0, becomes: 'א', word: 'מאיתנו' },
    swap: { from: 'כ', to: 'ה' },
  },
  hr: {
    tiles: ['I', 'L', 'I', 'M', 'S', 'M'],
    three: 'ILI',
    six: 'MISLIM',
    card: { at: 3, becomes: 'Š', word: 'MISLIŠ' },
    swap: { from: 'L', to: 'A' },
  },
  hu: {
    tiles: ['A', 'M', 'I', 'V', 'A', 'L'],
    three: 'AMI',
    six: 'VALAMI',
    card: { at: 1, becomes: 'K', word: 'VALAKI' },
    swap: { from: 'V', to: 'E' },
  },
  hy: {
    tiles: ['Ա', 'Յ', 'Ս', 'Ն', 'Պ', 'Ե'],
    three: 'ԱՅՍ',
    six: 'ԱՅՆՊԵՍ',
    card: { at: 3, becomes: 'Դ', word: 'ԱՅԴՊԵՍ' },
    swap: { from: 'Պ', to: 'Ո' },
  },
  id: {
    tiles: ['A', 'P', 'A', 'K', 'E', 'N'],
    three: 'APA',
    six: 'KENAPA',
    card: { at: 1, becomes: 'R', word: 'KARENA' },
    swap: { from: 'P', to: 'I' },
  },
  is: {
    tiles: ['E', 'R', 'U', 'L', 'N', 'G'],
    three: 'ERU',
    six: 'LENGUR',
    card: { at: 3, becomes: 'G', word: 'GENGUR' },
    swap: { from: 'G', to: 'A' },
  },
  it: {
    tiles: ['S', 'T', 'A', 'Q', 'U', 'E'],
    three: 'STA',
    six: 'QUESTA',
    card: { at: 2, becomes: 'O', word: 'QUESTO' },
    swap: { from: 'Q', to: 'I' },
  },
  ka: {
    tiles: ['ა', 'რ', 'ა', 'დ', 'გ', 'ნ'],
    three: 'არა',
    six: 'რადგან',
    card: { at: 5, becomes: 'კ', word: 'კარგად' },
    swap: { from: 'გ', to: 'ი' },
  },
  ko: {
    tiles: ['ㅇ', 'ㅏ', 'ㄴ', 'ㅈ', 'ㄱ', 'ㅡ'],
    three: 'ㅇㅏㄴ',
    six: 'ㅈㅏㄱㅇㅡㄴ',
    card: { at: 3, becomes: 'ㅌ', word: 'ㄱㅏㅌㅇㅡㄴ' },
    swap: { from: 'ㅡ', to: 'ㄹ' },
  },
  lt: {
    tiles: ['K', 'A', 'I', 'R', 'E', 'I'],
    three: 'KAI',
    six: 'REIKIA',
    card: { at: 4, becomes: 'T', word: 'TIKRAI' },
    swap: { from: 'K', to: 'S' },
  },
  lv: {
    tiles: ['E', 'S', 'I', 'V', 'I', 'M'],
    three: 'ESI',
    six: 'VISIEM',
    card: { at: 1, becomes: 'Ņ', word: 'VIŅIEM' },
    swap: { from: 'V', to: 'A' },
  },
  mk: {
    tiles: ['Т', 'О', 'А', 'Р', 'Б', 'И'],
    three: 'ТОА',
    six: 'РАБОТИ',
    card: { at: 5, becomes: 'А', word: 'РАБОТА' },
    swap: { from: 'Б', to: 'Е' },
  },
  ms: {
    tiles: ['D', 'A', 'N', 'A', 'T', 'G'],
    three: 'DAN',
    six: 'DATANG',
    card: { at: 0, becomes: 'S', word: 'SANGAT' },
    swap: { from: 'D', to: 'E' },
  },
  nl: {
    tiles: ['E', 'E', 'N', 'Z', 'G', 'G'],
    three: 'EEN',
    six: 'ZEGGEN',
    card: { at: 4, becomes: 'I', word: 'GEZIEN' },
    swap: { from: 'Z', to: 'A' },
  },
  no: {
    tiles: ['J', 'E', 'G', 'E', 'R', 'N'],
    three: 'JEG',
    six: 'GJERNE',
    card: { at: 0, becomes: 'P', word: 'PENGER' },
    swap: { from: 'J', to: 'T' },
  },
  pcm: {
    tiles: ['D', 'O', 'N', 'G', 'R', 'U'],
    three: 'DON',
    six: 'GROUND',
    card: { at: 3, becomes: 'A', word: 'AROUND' },
    swap: { from: 'G', to: 'A' },
  },
  pl: {
    tiles: ['B', 'E', 'Z', 'D', 'O', 'R'],
    three: 'BEZ',
    six: 'DOBRZE',
    card: { at: 1, becomes: 'A', word: 'BARDZO' },
    swap: { from: 'B', to: 'A' },
  },
  pt: {
    tiles: ['U', 'M', 'A', 'A', 'L', 'G'],
    three: 'UMA',
    six: 'ALGUMA',
    card: { at: 2, becomes: 'E', word: 'ALGUEM' },
    swap: { from: 'G', to: 'E' },
  },
  'pt-BR': {
    tiles: ['U', 'M', 'A', 'A', 'L', 'G'],
    three: 'UMA',
    six: 'ALGUMA',
    card: { at: 2, becomes: 'E', word: 'ALGUEM' },
    swap: { from: 'G', to: 'E' },
  },
  ro: {
    tiles: ['M', 'A', 'I', 'O', 'E', 'N'],
    three: 'MAI',
    six: 'OAMENI',
    card: { at: 2, becomes: 'D', word: 'DOAMNE' },
    swap: { from: 'M', to: 'R' },
  },
  ru: {
    tiles: ['О', 'Н', 'А', 'Д', 'Л', 'Ж'],
    three: 'ОНА',
    six: 'ДОЛЖНА',
    card: { at: 2, becomes: 'Е', word: 'ДОЛЖЕН' },
    swap: { from: 'Ж', to: 'Е' },
  },
  sk: {
    tiles: ['K', 'T', 'O', 'V', 'Š', 'E'],
    three: 'KTO',
    six: 'VŠETKO',
    card: { at: 2, becomes: 'Y', word: 'VŠETKY' },
    swap: { from: 'Š', to: 'A' },
  },
  sl: {
    tiles: ['V', 'E', 'Č', 'L', 'O', 'K'],
    three: 'VEČ',
    six: 'ČLOVEK',
    card: { at: 2, becomes: 'I', word: 'VELIKO' },
    swap: { from: 'Č', to: 'A' },
  },
  sr: {
    tiles: ['И', 'Л', 'И', 'М', 'С', 'М'],
    three: 'ИЛИ',
    six: 'МИСЛИМ',
    card: { at: 3, becomes: 'Ш', word: 'МИСЛИШ' },
    swap: { from: 'Л', to: 'А' },
  },
  sv: {
    tiles: ['N', 'Ä', 'R', 'K', 'N', 'E'],
    three: 'NÄR',
    six: 'KÄNNER',
    card: { at: 0, becomes: 'T', word: 'TÄNKER' },
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
  uk: {
    tiles: ['Т', 'Р', 'И', 'П', 'О', 'С'],
    three: 'ТРИ',
    six: 'ПРОСТИ',
    card: { at: 2, becomes: 'О', word: 'ПРОСТО' },
    swap: { from: 'П', to: 'А' },
  },
  vi: {
    tiles: ['N', 'H', 'Ư', 'T', 'Ờ', 'G'],
    three: 'NHƯ',
    six: 'THƯỜNG',
    card: { at: 4, becomes: 'Ơ', word: 'THƯƠNG' },
    swap: { from: 'Ư', to: 'C' },
  },
}
