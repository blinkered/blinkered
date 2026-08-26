import { DIFFICULTIES, configFor } from '@blinkered/engine'
import type {
  Difficulty,
  FlipEconomy,
  GameConfig,
  KeyScheme,
  WordCompleteMode,
} from '@blinkered/engine'

export interface Settings {
  readonly difficulty: Difficulty
  /** Anything the player changed away from the preset. Empty means canonical. */
  readonly overrides: Partial<GameConfig>
  readonly keyScheme: KeyScheme
  /** Reveals every rule and the arithmetic behind it. Off by default. */
  readonly nerdMode: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'medium',
  overrides: {},
  keyScheme: 'cycle',
  nerdMode: false,
}

export const DIFFICULTY_NAMES = Object.keys(DIFFICULTIES) as Difficulty[]
export const WORD_COMPLETE_MODES: readonly WordCompleteMode[] = ['shuffle', 'spend', 'keep']
export const FLIP_ECONOMIES: readonly FlipEconomy[] = [
  'none',
  'perLetter',
  'fibonacci',
  'overMinimum',
]
export const KEY_SCHEMES: readonly KeyScheme[] = ['cycle', 'modifier']

export function configOf(settings: Settings): GameConfig {
  return configFor(settings.difficulty, settings.overrides)
}

/** True when nothing has been changed away from the preset, which is what ranking will need. */
export function isCanonical(settings: Settings): boolean {
  return Object.keys(settings.overrides).length === 0
}

const STORAGE_KEY = 'blinkered.settings.v1'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    const difficulty = DIFFICULTY_NAMES.find((name) => name === parsed.difficulty)
    const keyScheme = KEY_SCHEMES.find((scheme) => scheme === parsed.keyScheme)
    return {
      difficulty: difficulty ?? DEFAULT_SETTINGS.difficulty,
      overrides: typeof parsed.overrides === 'object' ? { ...parsed.overrides } : {},
      keyScheme: keyScheme ?? DEFAULT_SETTINGS.keyScheme,
      nerdMode: parsed.nerdMode === true,
    }
  } catch {
    // A corrupt or unavailable store is not worth failing a game over.
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private browsing and blocked storage are both fine; settings simply do not persist.
  }
}
