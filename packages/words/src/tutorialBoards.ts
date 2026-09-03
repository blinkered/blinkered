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
  arz: {
    tiles: ['ك', 'ا', 'ن', 'ا', 'ل', 'س'],
    three: 'كان',
    six: 'السكان',
    card: { at: 5, becomes: 'م', word: 'المكان' },
    swap: { from: 'س', to: 'ي' },
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
  ja: {
    tiles: ['い', 'た', 'い', 'へ', 'よ', 'う'],
    three: 'いたい',
    six: 'たいへいよう',
    card: { at: 3, becomes: 'せ', word: 'たいせいよう' },
    swap: { from: 'へ', to: 'ん' },
  },
  ko: {
    tiles: ['ㅇ', 'ㅏ', 'ㄴ', 'ㅈ', 'ㄱ', 'ㅡ'],
    three: 'ㅇㅏㄴ',
    six: 'ㅈㅏㄱㅇㅡㄴ',
    card: { at: 3, becomes: 'ㅌ', word: 'ㄱㅏㅌㅇㅡㄴ' },
    swap: { from: 'ㅡ', to: 'ㄹ' },
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
  pl: {
    tiles: ['B', 'E', 'Z', 'D', 'O', 'R'],
    three: 'BEZ',
    six: 'DOBRZE',
    card: { at: 1, becomes: 'A', word: 'BARDZO' },
    swap: { from: 'B', to: 'A' },
  },
  cs: {
    tiles: ['D', 'E', 'N', 'E', 'B', 'U'],
    three: 'DEN',
    six: 'NEBUDE',
    card: { at: 2, becomes: 'M', word: 'BUDEME' },
    swap: { from: 'B', to: 'O' },
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
  da: {
    tiles: ['D', 'E', 'T', 'S', 'I', 'S'],
    three: 'DET',
    six: 'SIDSTE',
    card: { at: 3, becomes: 'V', word: 'VIDSTE' },
    swap: { from: 'D', to: 'R' },
  },
  ca: {
    tiles: ['P', 'E', 'R', 'O', 'T', 'S'],
    three: 'PER',
    six: 'POTSER',
    card: { at: 0, becomes: 'N', word: 'NOSTRE' },
    swap: { from: 'P', to: 'A' },
  },
  et: {
    tiles: ['K', 'U', 'I', 'N', 'A', 'G'],
    three: 'KUI',
    six: 'KUNAGI',
    card: { at: 0, becomes: 'S', word: 'SINUGA' },
    swap: { from: 'G', to: 'E' },
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
  sr: {
    tiles: ['И', 'Л', 'И', 'М', 'С', 'М'],
    three: 'ИЛИ',
    six: 'МИСЛИМ',
    card: { at: 3, becomes: 'Ш', word: 'МИСЛИШ' },
    swap: { from: 'Л', to: 'А' },
  },
  uk: {
    tiles: ['Т', 'Р', 'И', 'П', 'В', 'І'],
    three: 'ТРИ',
    six: 'ПРИВІТ',
    card: { at: 5, becomes: 'Е', word: 'ПРИВЕТ' },
    swap: { from: 'П', to: 'А' },
  },
  bg: {
    tiles: ['А', 'К', 'О', 'Д', 'О', 'Т'],
    three: 'АКО',
    six: 'ДОКАТО',
    card: { at: 3, becomes: 'Г', word: 'КОГАТО' },
    swap: { from: 'Д', to: 'Е' },
  },
  hy: {
    tiles: ['Կ', 'Ա', 'Մ', 'Ր', 'Ի', 'Ր'],
    three: 'ԿԱՄ',
    six: 'ԿԱՐՄԻՐ',
    card: { at: 3, becomes: 'Դ', word: 'ՄԱՐԴԻԿ' },
    swap: { from: 'Մ', to: 'Ն' },
  },
  ka: {
    tiles: ['დ', 'ა', 'ნ', 'წ', 'ლ', 'ი'],
    three: 'დან',
    six: 'წლიდან',
    card: { at: 0, becomes: 'ი', word: 'ნაწილი' },
    swap: { from: 'წ', to: 'ე' },
  },
  eu: {
    tiles: ['Z', 'E', 'N', 'G', 'O', 'A'],
    three: 'ZEN',
    six: 'GOAZEN',
    card: { at: 1, becomes: 'I', word: 'IZANGO' },
    swap: { from: 'G', to: 'I' },
  },
  gl: {
    tiles: ['L', 'L', 'E', 'M', 'O', 'R'],
    three: 'LLE',
    six: 'MELLOR',
    card: { at: 4, becomes: 'U', word: 'MULLER' },
    swap: { from: 'M', to: 'A' },
  },
  is: {
    tiles: ['E', 'R', 'U', 'G', 'N', 'G'],
    three: 'ERU',
    six: 'GENGUR',
    card: { at: 3, becomes: 'L', word: 'LENGUR' },
    swap: { from: 'G', to: 'A' },
  },
  cy: {
    tiles: ['E', 'N', 'W', 'Y', 'D', 'D'],
    three: 'ENW',
    six: 'NEWYDD',
    card: { at: 0, becomes: 'O', word: 'NODWYD' },
    swap: { from: 'W', to: 'A' },
  },
  ga: {
    tiles: ['I', 'N', 'A', 'B', 'L', 'I'],
    three: 'INA',
    six: 'BLIAIN',
    card: { at: 0, becomes: 'A', word: 'BLIANA' },
    swap: { from: 'B', to: 'H' },
  },
  hu: {
    tiles: ['A', 'K', 'I', 'V', 'A', 'L'],
    three: 'AKI',
    six: 'VALAKI',
    card: { at: 1, becomes: 'M', word: 'VALAMI' },
    swap: { from: 'V', to: 'E' },
  },
  ro: {
    tiles: ['M', 'E', 'A', 'D', 'O', 'N'],
    three: 'MEA',
    six: 'DOAMNE',
    card: { at: 3, becomes: 'I', word: 'OAMENI' },
    swap: { from: 'D', to: 'I' },
  },
  fa: {
    tiles: ['ا', 'ر', 'ه', 'د', 'ر', 'ب'],
    three: 'اره',
    six: 'درباره',
    card: { at: 1, becomes: 'و', word: 'دوباره' },
    swap: { from: 'ب', to: 'ی' },
  },
  pcm: {
    tiles: ['A', 'N', 'D', 'I', 'S', 'I'],
    three: 'AND',
    six: 'INSAID',
    card: { at: 0, becomes: 'E', word: 'INSIDE' },
    swap: { from: 'D', to: 'E' },
  },
  vi: {
    tiles: ['N', 'H', 'Ư', 'T', 'Ơ', 'G'],
    three: 'NHƯ',
    six: 'THƯƠNG',
    card: { at: 4, becomes: 'Ờ', word: 'THƯỜNG' },
    swap: { from: 'Ơ', to: 'E' },
  },
}
