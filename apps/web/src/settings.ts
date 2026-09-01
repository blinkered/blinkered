import { DIFFICULTIES, configFor, isCanonical as isCanonicalRuleset } from '@blinkered/engine'
import type {
  Difficulty,
  FlipEconomy,
  GameConfig,
  KeyScheme,
  WordCompleteMode,
} from '@blinkered/engine'
import { DEFAULT_LOCALE, localeFor, preferredLocale } from '@blinkered/i18n'

/**
 * What the player has chosen, and what is remembered between visits.
 *
 * Two of these are not settings at all but game-time choices: `gameLanguage` decides what the
 * board is dealt from, and `difficulty` decides how fast it comes at you. A game cannot be
 * ranked against one that used different values for either, so both are locked while a game
 * runs and both live in the setup panel rather than in nerd mode.
 */
export interface Settings {
  /** The preset a game is based on, and the base for the custom ruleset. */
  readonly difficulty: Difficulty
  /**
   * True when the nerd-mode ruleset is the one in play.
   *
   * Separate from `overrides` being non-empty so the two can coexist: switching back to a preset
   * leaves the custom ruleset stored but inactive, and switching to `custom` picks it up again
   * rather than making the player re-enter it.
   */
  readonly custom: boolean
  /** Anything changed away from the preset. Applied only while `custom`. */
  readonly overrides: Partial<GameConfig>
  readonly keyScheme: KeyScheme
  /** Reveals every rule and the arithmetic behind it. Off by default. */
  readonly nerdMode: boolean
  /** The language the board is dealt and words are judged in. */
  readonly gameLanguage: string
  /**
   * The language the interface is written in.
   *
   * Kept apart from `gameLanguage` even though one control sets both, because they are
   * genuinely different questions: plenty of people would want to practice French with an
   * interface they read fluently, and merging the two fields now would be hard to undo later.
   */
  readonly uiLanguage: string
  /**
   * Whether the first-run tour has been dismissed for good.
   *
   * False until the player either finishes the tour with the box ticked or skips and ticks it, so
   * a first visit and a visit from somebody who closed the tab mid-tour both get it again. Its own
   * field rather than being inferred from anything else here: "has played before" and "has been
   * shown the rules" are different facts and only one of them is this one.
   */
  readonly tutorialSeen: boolean
}

/**
 * What the browser asks for, if it is one we have, and English otherwise.
 *
 * Used for both languages on a first visit. Guessing which language somebody wants to *play* a
 * word game in is a little presumptuous, but the picker sits at the top of the page and is
 * always live, so a wrong guess costs one click; an interface nobody can read costs more.
 */
export function guessLanguage(): string {
  try {
    return preferredLocale(navigator.languages)
  } catch {
    return DEFAULT_LOCALE
  }
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

/** The fifth option in the difficulty row, offered only once a custom ruleset exists. */
export const CUSTOM_RULES = 'custom'
export type Ruleset = Difficulty | typeof CUSTOM_RULES

/**
 * Whether the stored ruleset actually forks from a preset.
 *
 * Having overrides at all is not the same question, and treating it as the same is what put a
 * fifth chip on the setup panel for a ruleset identical to `medium`. Nerd mode writes a field
 * the moment it is touched, so a player who nudged a number and put it back had a custom
 * ruleset that was custom in name only.
 *
 * The comparison itself belongs to the engine now, because a server has to reach the same verdict
 * about the same game and two implementations would drift. This asks the engine's question about
 * the stored overrides, resolved whether or not they are currently applied: "does this ruleset
 * fork" is a fact about what is saved, not about what is switched on.
 */
export function hasCustomRules(settings: Settings): boolean {
  const language = settings.gameLanguage
  const rules = configFor(settings.difficulty, { ...settings.overrides, language })
  return !isCanonicalRuleset(rules, settings.difficulty)
}

/**
 * Which chip is lit: a preset, or the custom ruleset.
 *
 * Follows what is offered. A custom ruleset that matches a preset is not offered, so it cannot
 * be the one lit either, and the preset it matches is what the player is actually playing.
 */
export function rulesetOf(settings: Settings): Ruleset {
  return settings.custom && hasCustomRules(settings) ? CUSTOM_RULES : settings.difficulty
}

/**
 * Chooses a ruleset. A preset does not discard the custom one, it just stops applying it,
 * so the player can go back to their own numbers without retyping them.
 */
export function withRuleset(settings: Settings, ruleset: Ruleset): Settings {
  if (ruleset === CUSTOM_RULES) return { ...settings, custom: true }
  return { ...settings, difficulty: ruleset, custom: false }
}

/** Editing a rule in nerd mode forks to the custom ruleset; that is what makes it custom. */
export function withOverride(settings: Settings, overrides: Partial<GameConfig>): Settings {
  return { ...settings, custom: true, overrides: { ...settings.overrides, ...overrides } }
}

export function configOf(settings: Settings): GameConfig {
  // Language reaches the engine as part of the ruleset, because the word floor a board has to
  // clear depends on how many words the language's dictionary admits.
  const rules = settings.custom ? settings.overrides : {}
  return configFor(settings.difficulty, { ...rules, language: settings.gameLanguage })
}

/**
 * True when the rules are a published preset, which is what ranking requires.
 *
 * Asks what the rules are, not how they were reached. A game played on numbers identical to a
 * preset is a game on that preset and ranks, even if the player got there through nerd mode.
 */
export function isCanonical(settings: Settings): boolean {
  return !settings.custom || !hasCustomRules(settings)
}

const STORAGE_KEY = 'blinkered.settings.v1'

export function defaultSettings(): Settings {
  const guess = guessLanguage()
  return {
    difficulty: 'medium',
    custom: false,
    overrides: {},
    keyScheme: 'cycle',
    nerdMode: false,
    gameLanguage: guess,
    uiLanguage: guess,
    tutorialSeen: false,
  }
}

export function loadSettings(): Settings {
  const fallback = defaultSettings()
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
    const overrides = typeof parsed.overrides === 'object' ? { ...parsed.overrides } : {}
    return {
      difficulty: difficulty ?? fallback.difficulty,
      // A stored `custom` flag means nothing without the rules it refers to.
      custom: parsed.custom === true && Object.keys(overrides).length > 0,
      overrides,
      keyScheme: keyScheme ?? fallback.keyScheme,
      nerdMode: parsed.nerdMode === true,
      gameLanguage: parsed.gameLanguage ?? fallback.gameLanguage,
      uiLanguage: uiLanguage ?? fallback.uiLanguage,
      // Anything but a stored `true` means show it: a corrupt value should err towards offering
      // the tour, which costs one click, rather than hiding it from somebody who has never played.
      tutorialSeen: parsed.tutorialSeen === true,
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
