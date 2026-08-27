import { DIFFICULTIES } from '@blinkered/engine'
import type { Messages } from '@blinkered/i18n'
import { HowToPlayLink } from './HowToPlayLink.js'
import { withoutStealingFocus } from './focus.js'
import { CUSTOM_RULES, DIFFICULTY_NAMES } from './settings.js'
import type { Ruleset, Settings } from './settings.js'

interface GameSetupProps {
  readonly settings: Settings
  readonly language: string
  readonly messages: Messages
  /**
   * Native only: shows the rules in-app. Needed here as much as during a game, because the
   * reason a WebView cannot open the link is that it has no second tab, not that there is a
   * game to lose.
   */
  readonly onShowRules?: () => void
  /** False while the dictionary for the chosen language is still loading. */
  readonly ready: boolean
  readonly startLabel: string
  readonly onRuleset: (ruleset: Ruleset) => void
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
  language,
  messages,
  ready,
  startLabel,
  onShowRules,
  onRuleset,
  onStart,
}: GameSetupProps): React.JSX.Element {
  return (
    <div className="setup">
      <RulesetPicker settings={settings} messages={messages} onChange={onRuleset} />
      <button
        type="button"
        className="btn btn-primary btn-start"
        disabled={!ready}
        onMouseDown={withoutStealingFocus}
        onClick={onStart}
      >
        {ready ? startLabel : messages.readingDictionary}
      </button>
      <HowToPlayLink
        language={language}
        messages={messages}
        {...(onShowRules === undefined ? {} : { onShowInApp: onShowRules })}
      />
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
  const current: Ruleset = settings.custom ? CUSTOM_RULES : settings.difficulty
  // Offered only once the player has actually changed something, so it is never an empty option.
  const offered: Ruleset[] =
    Object.keys(settings.overrides).length > 0
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
            {ruleset === CUSTOM_RULES ? messages.nerdMode : messages.difficultyNames[ruleset]}
            {ruleset === CUSTOM_RULES ? null : (
              <span className="chip-note">{DIFFICULTIES[ruleset].initialRounds}r</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
