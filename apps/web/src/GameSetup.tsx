import type { Messages } from '@blinkered/i18n'
import { withoutStealingFocus } from './focus.js'
import { CUSTOM_RULES, DIFFICULTY_NAMES, hasCustomRules, rulesetOf } from './settings.js'
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
