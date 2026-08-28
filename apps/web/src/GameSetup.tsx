import type { Messages } from '@blinkered/i18n'
import { withoutStealingFocus } from './focus.js'
import { CUSTOM_RULES, DIFFICULTY_NAMES } from './settings.js'
import type { Ruleset, Settings } from './settings.js'

interface GameSetupProps {
  readonly settings: Settings
  readonly messages: Messages
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
  messages,
  ready,
  startLabel,
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
