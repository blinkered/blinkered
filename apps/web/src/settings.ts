import { DEFAULT_LANGUAGE, DIFFICULTIES, configFor } from '@blinkered/engine'
import type {
  Difficulty,
  FlipEconomy,
  GameConfig,
  KeyScheme,
  WordCompleteMode,
} from '@blinkered/engine'
import { DEFAULT_LOCALE, localeFor, preferredLocale } from '@blinkered/i18n'

export interface Settings {
  readonly difficulty: Difficulty
  /** Anything the player changed away from the preset. Empty means canonical. */
  readonly overrides: Partial<GameConfig>
  readonly keyScheme: KeyScheme
  /** Reveals every rule and the arithmetic behind it. Off by default. */
  readonly nerdMode: boolean
  /**
   * The language the board is dealt and words are judged in.
   *
   * Kept apart from `uiLanguage` even though one control usually sets both, because they are
   * genuinely different questions: plenty of people would want to practise French with an
   * interface they read fluently, and merging the two fields now would be hard to undo later.
   */
  readonly gameLanguage: string
  readonly uiLanguage: string
}

/**
 * The interface language the browser asks for, if it is one we have.
 *
 * Only the interface. The game language stays English by default: guessing which language
 * somebody wants to play a word game in from their system settings would be presumptuous, and
 * wrong for anyone learning one.
 */
function guessUiLanguage(): string {
  try {
    return preferredLocale(navigator.languages)
  } catch {
    return DEFAULT_LOCALE
  }
}

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'medium',
  overrides: {},
  keyScheme: 'cycle',
  nerdMode: false,
  gameLanguage: DEFAULT_LANGUAGE,
  uiLanguage: DEFAULT_LOCALE,
}

export const DIFFICULTY_NAMES = Object.keys(DIFFICULTIES) as Difficulty[]
export const WORD_COMPLETE_MODES: readonly WordCompleteMode[] = ['shuffle', 'spend', 'keep']
export const FLIP_ECONOMIES: readonly FlipEconomy[] = [
  'none',
  'perLetter',
  'fibonacci',
  'overMinimum',
]
export const KEY_SCHEMES: readonly KeyScheme[] = ['cycle', 'advance']

export function configOf(settings: Settings): GameConfig {
  // Language reaches the engine as part of the ruleset, because the word floor a board has to
  // clear depends on how many words the language's dictionary admits.
  return configFor(settings.difficulty, { ...settings.overrides, language: settings.gameLanguage })
}

/** True when nothing has been changed away from the preset, which is what ranking will need. */
export function isCanonical(settings: Settings): boolean {
  return Object.keys(settings.overrides).length === 0
}

const STORAGE_KEY = 'blinkered.settings.v1'

export function loadSettings(): Settings {
  const fallback: Settings = { ...DEFAULT_SETTINGS, uiLanguage: guessUiLanguage() }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw) as Partial<Settings>
    const difficulty = DIFFICULTY_NAMES.find((name) => name === parsed.difficulty)
    const keyScheme = KEY_SCHEMES.find((scheme) => scheme === parsed.keyScheme)
    // A stored interface language we no longer translate falls back rather than blanking the
    // interface. The game language is checked against the catalogue instead, once it loads:
    // whether a list exists is a fact about the deployment, not about this file.
    const uiLanguage = localeFor(parsed.uiLanguage ?? '')?.tag
    return {
      difficulty: difficulty ?? fallback.difficulty,
      overrides: typeof parsed.overrides === 'object' ? { ...parsed.overrides } : {},
      keyScheme: keyScheme ?? fallback.keyScheme,
      nerdMode: parsed.nerdMode === true,
      gameLanguage: parsed.gameLanguage ?? fallback.gameLanguage,
      uiLanguage: uiLanguage ?? fallback.uiLanguage,
    }
  } catch {
    // A corrupt or unavailable store is not worth failing a game over.
    return fallback
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private browsing and blocked storage are both fine; settings simply do not persist.
  }
}
