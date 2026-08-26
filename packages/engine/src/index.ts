export * from './types.js'
export { reduce, revealNext, type Reduction } from './reducer.js'
export { createGame, replay, type NewGame, type Replay } from './game.js'
export { keyToEvent, type KeyPress, type KeyScheme } from './keymap.js'
export { wordScore, flipReward } from './score.js'
export { drawLetters } from './letters.js'
export { letterFaults, type LetterFault } from './letterFaults.js'
export {
  ALPHABET_IDS,
  DEFAULT_LANGUAGE,
  ENGLISH,
  alphabetFor,
  segmentBy,
  stripDiacritics,
  type Alphabet,
} from './alphabet.js'
export {
  DEFAULT_BOARD_SIZE,
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
export { seedRng, nextFloat, nextInt, nextUint32, shuffle } from './rng.js'
