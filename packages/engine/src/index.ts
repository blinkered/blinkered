export * from './types.js'
export { reduce, revealNext, type Reduction } from './reducer.js'
export { createGame, replay, type NewGame, type Replay } from './game.js'
export { keyToEvent, type KeyPress, type KeyScheme } from './keymap.js'
export { wordScore, flipReward, scoreWords } from './score.js'
export { drawLetters } from './letters.js'
export { letterFaults, type LetterFault } from './letterFaults.js'
export {
  byCodePoint,
  folder,
  segmentBy,
  stripDiacritics,
  type Alphabet,
  type FoldOptions,
} from './alphabet.js'
export { composeHangul, foldHangul } from './hangul.js'
export {
  AFRIKAANS,
  ALPHABET_IDS,
  ARABIC,
  CROATIAN,
  DEFAULT_LANGUAGE,
  DUTCH,
  ENGLISH,
  FINNISH,
  FRENCH,
  GERMAN,
  GREEK,
  HEBREW,
  INDONESIAN,
  ITALIAN,
  JAPANESE,
  KOREAN,
  LATIN,
  MALAY,
  NORWEGIAN,
  PORTUGUESE,
  PORTUGUESE_BR,
  RUSSIAN,
  SPANISH,
  SWAHILI,
  SWEDISH,
  TAGALOG,
  TURKISH,
  alphabetFor,
} from './languages.js'
export {
  DEFAULT_BOARD_SIZE,
  DEFAULT_WILD_CHANCE,
  DIFFICULTIES,
  ENGINE_VERSION,
  PROFITABLE_LENGTH,
  configFor,
  defaultWMin,
  type DifficultyProfile,
} from './difficulty.js'
export {
  isEligible,
  letterAvailability,
  selectedLetters,
  tileAt,
  tileById,
  type LetterAvailability,
} from './selection.js'
export {
  compareResults,
  isCanonical,
  rankOf,
  rankedResults,
  type GameResult,
  type ResultGroup,
} from './results.js'
export { seedRng, nextFloat, nextInt, nextUint32, shuffle } from './rng.js'
export { MAX_WILDS, WILD_GLYPH, dealWilds, resolveWilds } from './wild.js'
export type { Resolution, ResolveOutcome } from './wild.js'
export { replaceLetter } from './replace.js'
export type { Replacement } from './replace.js'
