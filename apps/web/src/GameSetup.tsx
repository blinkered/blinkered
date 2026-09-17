import type { Messages } from '@blinkered/i18n'
import { withoutStealingFocus } from './focus.js'
import { CUSTOM_RULES, DIFFICULTY_NAMES, THEMES, hasCustomRules, rulesetOf } from './settings.js'
import type { Ruleset, Settings, Theme } from './settings.js'

interface GameSetupProps {
  readonly settings: Settings
  readonly messages: Messages
  /** False while the dictionary for the chosen language is still loading. */
  readonly ready: boolean
  readonly startLabel: string
  readonly onRuleset: (ruleset: Ruleset) => void
  readonly onTheme: (theme: Theme) => void
  readonly onStart: () => void
}

/**
 * The choice that has to be made before a game and cannot be made during one.
 *
 * Not a modal. Language lives at the top of the page instead, always reachable, because
 * somebody arriving at a page in a language they cannot read needs to fix that before they need
 * anything else, and a dialog in the way of that is a wall rather than a prompt.
 */
export function GameSetup({
  settings,
  messages,
  ready,
  startLabel,
  onRuleset,
  onTheme,
  onStart,
}: GameSetupProps): React.JSX.Element {
  return (
    <div className="setup">
      <RulesetPicker settings={settings} messages={messages} onChange={onRuleset} />
      {/*
        The palette, under the difficulty and in the same shape as it.
        
        Here rather than in the title bar, which is the tightest row in the layout and is measured
        to stay on one line; and here rather than on the account screen, because it has to be
        reachable by somebody who has never signed in and is reading a page they find too dark or
        too bright. This screen is where the other two choices about how to play already are.
      */}
      <ThemePicker settings={settings} messages={messages} onChange={onTheme} />
      <button
        type="button"
        className="btn btn-primary btn-start"
        disabled={!ready}
        onMouseDown={withoutStealingFocus}
        onClick={onStart}
      >
        {ready ? startLabel : messages.readingDictionary}
      </button>
    </div>
  )
}

interface RulesetPickerProps {
  readonly settings: Settings
  readonly messages: Messages
  readonly onChange: (ruleset: Ruleset) => void
  readonly disabled?: boolean
}

/**
 * The four presets, plus the nerd-mode ruleset once one exists.
 *
 * A row of buttons rather than a menu: there are at most five and the choice is worth seeing
 * all of at once. Each preset carries its round budget, because "easy" and "insane" mean
 * nothing until you know that one buys fourteen scoreless rounds and the other ten.
 */
export function RulesetPicker({
  settings,
  messages,
  onChange,
  disabled = false,
}: RulesetPickerProps): React.JSX.Element {
  /*
   * Both of these come from settings.ts rather than being worked out here.
   *
   * They were inlined, and the inline version asked whether any override had ever been written
   * rather than whether the rules differ from a preset. Nerd mode writes a field as soon as it is
   * touched, so nudging a number and putting it back left a fifth chip offering a ruleset
   * identical to `medium`. Two copies of a rule is how one of them ends up being the wrong one.
   */
  const current = rulesetOf(settings)
  const offered: Ruleset[] = hasCustomRules(settings)
    ? [...DIFFICULTY_NAMES, CUSTOM_RULES]
    : DIFFICULTY_NAMES

  return (
    <div className="ruleset" role="group" aria-label={messages.difficulty}>
      <span className="picker-label">{messages.difficulty}</span>
      <div className="ruleset-options">
        {offered.map((ruleset) => (
          <button
            key={ruleset}
            type="button"
            className={`chip${ruleset === current ? ' is-on' : ''}`}
            aria-pressed={ruleset === current}
            disabled={disabled}
            onMouseDown={withoutStealingFocus}
            onClick={() => {
              onChange(ruleset)
            }}
          >
            {/*
             * The name and nothing else. This used to carry `initialRounds` as a bare number --
             * "easy 14" -- which is the starting flip budget expressed in rounds: an
             * implementation detail of the difficulty table, unlabelled, in the one place it
             * reads as a difficulty rating. It also ran backwards, the largest number being the
             * easiest setting. Anyone who wants the actual numbers has nerd mode.
             */}
            {ruleset === CUSTOM_RULES ? messages.nerdMode : messages.difficultyNames[ruleset]}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Which palette the interface is drawn in. Three chips, the same control as the difficulty row.
 *
 * Not a system-preference switch. `prefers-color-scheme` would be the obvious thing to follow and
 * it answers a different question: it says what somebody's operating system was set to, which on
 * a phone is usually a schedule, and it has nothing to say about wanting more contrast. An
 * explicit choice that persists is the one that helps the person it is for.
 */
function ThemePicker({
  settings,
  messages,
  onChange,
}: {
  readonly settings: Settings
  readonly messages: Messages
  readonly onChange: (theme: Theme) => void
}): React.JSX.Element {
  return (
    <div className="ruleset" role="group" aria-label={messages.themeLabel}>
      <span className="picker-label">{messages.themeLabel}</span>
      <div className="ruleset-options">
        {THEMES.map((theme) => (
          <button
            key={theme}
            type="button"
            className={`chip${theme === settings.theme ? ' is-on' : ''}`}
            aria-pressed={theme === settings.theme}
            onMouseDown={withoutStealingFocus}
            onClick={() => {
              onChange(theme)
            }}
          >
            {messages.themeNames[theme]}
          </button>
        ))}
      </div>
    </div>
  )
}
