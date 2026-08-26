import { flipReward, wordScore } from '@blinkered/engine'
import type { FlipEconomy, GameConfig, KeyScheme, WordCompleteMode } from '@blinkered/engine'
import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import type { TieredIndex } from '@blinkered/words'
import { countOf } from './Hud.js'
import { useFocusRelease } from './focus.js'
import { InterfacePicker } from './LanguagePicker.js'
import { FLIP_ECONOMIES, KEY_SCHEMES, WORD_COMPLETE_MODES, isCanonical } from './settings.js'
import type { Settings } from './settings.js'

interface NerdPanelProps {
  readonly settings: Settings
  readonly config: GameConfig
  /** Null until a language's word list has loaded. */
  readonly dictionary: TieredIndex | null
  /**
   * True while a game is running, when nothing that changes the rules may be touched.
   *
   * A game whose rules moved underneath it cannot be ranked against anything, and offering
   * controls that quietly apply "next time" invites a player to think they did something.
   */
  readonly locked: boolean
  readonly messages: Messages
  readonly onChange: (next: Settings) => void
  /** Editing any rule forks to the custom ruleset; that is what makes it custom. */
  readonly onOverride: (overrides: Partial<GameConfig>) => void
}

/** The smallest word length the shipped lists hold; see docs/DICTIONARIES.md. */
const SHORTEST_SHIPPED_WORD = 3

/**
 * Every rule, and the arithmetic they produce. The derived numbers matter more than the raw
 * settings: "hold 2" means nothing until you see that it buys 3.6 seconds with the whole
 * board showing, and the flip economy means nothing until you see what a word pays against
 * what its letters cost.
 *
 * Difficulty is not here. It is a game-time choice like language, so it lives in the setup
 * panel where it can be seen without opening this.
 */
export function NerdPanel({
  settings,
  config,
  dictionary,
  locked,
  messages,
  onChange,
  onOverride,
}: NerdPanelProps): React.JSX.Element {
  const roundTicks = config.n + config.holdTicks
  const seconds = (count: number): string => `${(count * config.speedMultiplier).toFixed(1)}s`
  const ticks = (count: number): string =>
    format(messages.ticksAndSeconds, {
      ticks: countOf(messages, 'ticks', count),
      seconds: seconds(count),
    })
  const rounds = config.initialFlips / config.n

  return (
    <aside className="nerd">
      <h2>{messages.rules}</h2>

      <div className="nerd-grid">
        <Number
          label={messages.tiles}
          value={config.n}
          min={2}
          max={16}
          disabled={locked}
          onChange={(n) => {
            onOverride({ n })
          }}
        />
        <Number
          label={messages.secondsPerTick}
          value={config.speedMultiplier}
          min={0.2}
          max={4}
          step={0.1}
          disabled={locked}
          onChange={(speedMultiplier) => {
            onOverride({ speedMultiplier })
          }}
        />
        <Number
          label={messages.holdTicks}
          value={config.holdTicks}
          min={0}
          max={12}
          disabled={locked}
          onChange={(holdTicks) => {
            onOverride({ holdTicks })
          }}
        />
        {/* Floored at three because the shipped lists start there: a two-letter minimum would
            offer a length with nothing in it to find. */}
        <Number
          label={messages.minWord}
          value={config.minWordLength}
          min={SHORTEST_SHIPPED_WORD}
          max={8}
          disabled={locked}
          onChange={(minWordLength) => {
            onOverride({ minWordLength })
          }}
        />
        <Number
          label={messages.startingFlips}
          value={config.initialFlips}
          min={1}
          max={999}
          disabled={locked}
          onChange={(initialFlips) => {
            onOverride({ initialFlips })
          }}
        />
        <Choice
          label={messages.wordCompleteMode}
          value={config.wordCompleteMode}
          options={WORD_COMPLETE_MODES}
          disabled={locked}
          name={(mode: WordCompleteMode) => messages.wordCompleteNames[mode]}
          onChange={(wordCompleteMode: WordCompleteMode) => {
            onOverride({ wordCompleteMode })
          }}
        />
        <Choice
          label={messages.flipEconomy}
          value={config.flipEconomy}
          options={FLIP_ECONOMIES}
          disabled={locked}
          name={(economy: FlipEconomy) => messages.flipEconomyNames[economy]}
          onChange={(flipEconomy: FlipEconomy) => {
            onOverride({ flipEconomy })
          }}
        />
        {/* The last two change nothing about the game, only about reading and typing it, so
            they stay live while a game runs. */}
        <Choice
          label={messages.repeatedLetterKey}
          value={settings.keyScheme}
          options={KEY_SCHEMES}
          name={(scheme: KeyScheme) => messages.keySchemeNames[scheme]}
          onChange={(keyScheme: KeyScheme) => {
            onChange({ ...settings, keyScheme })
          }}
        />
        <InterfacePicker
          label={messages.interfaceLanguage}
          value={settings.uiLanguage}
          onChange={(uiLanguage) => {
            onChange({ ...settings, uiLanguage })
          }}
        />
      </div>

      <p className="nerd-note nerd-dim">{messages.keySchemeHelp[settings.keyScheme]}</p>
      <p className="nerd-note">
        {isCanonical(settings)
          ? format(messages.canonicalRules, {
              difficulty: messages.difficultyNames[settings.difficulty],
            })
          : messages.customRules}
      </p>

      <h2>{messages.whatThatMeans}</h2>
      <dl className="nerd-derived">
        <Fact label={messages.factRound} value={ticks(roundTicks)} />
        <Fact label={messages.factWholeBoardUp} value={ticks(config.holdTicks + 1)} />
        <Fact label={messages.factRoundCosts} value={countOf(messages, 'flips', config.n)} />
        <Fact
          label={messages.factFlipsBuy}
          value={format(messages.scorelessRounds, {
            rounds: countOf(messages, 'rounds', rounds),
          })}
        />
        <Fact
          label={messages.factBoardHadToAdmit}
          value={format(messages.wordsIncludingOneOf, {
            words: countOf(messages, 'words', config.wMin),
            ceiling: config.ceilingMin,
          })}
        />
        {dictionary === null ? null : (
          <Fact
            label={messages.gameLanguage}
            value={format(messages.dictionarySize, {
              common: dictionary.commonSize,
              full: dictionary.size,
            })}
          />
        )}
      </dl>

      <h2>{messages.whatAWordPays}</h2>
      <table className="nerd-table">
        <thead>
          <tr>
            <th>{messages.columnLetters}</th>
            <th>{messages.columnCost}</th>
            <th>{messages.columnPoints}</th>
            <th>{messages.columnFlips}</th>
            <th>{messages.columnNet}</th>
          </tr>
        </thead>
        <tbody>
          {[3, 4, 5, 6, 7, 8]
            .filter((length) => length >= config.minWordLength && length <= config.n)
            .map((length) => {
              const flips = flipReward(length, config)
              const net = flips - length
              return (
                <tr key={length}>
                  <td>{length}</td>
                  <td>{length}</td>
                  <td>{wordScore(length)}</td>
                  <td>{flips}</td>
                  <td className={net > 0 ? 'is-good' : net < 0 ? 'is-bad' : ''}>
                    {net > 0 ? `+${String(net)}` : String(net)}
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </aside>
  )
}

function Number({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  disabled?: boolean
  onChange: (value: number) => void
}): React.JSX.Element {
  return (
    <label className="nerd-row">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        disabled={disabled ?? false}
        onChange={(e) => {
          const parsed = globalThis.Number(e.target.value)
          if (globalThis.Number.isFinite(parsed) && parsed >= min && parsed <= max) onChange(parsed)
        }}
      />
    </label>
  )
}

function Choice<T extends string>({
  label,
  value,
  options,
  name,
  disabled,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  name: (option: T) => string
  disabled?: boolean
  onChange: (value: T) => void
}): React.JSX.Element {
  const focus = useFocusRelease()
  return (
    <label className="nerd-row">
      <span>{label}</span>
      <select
        value={value}
        disabled={disabled ?? false}
        {...focus.handlers}
        onChange={(e) => {
          focus.release(e.currentTarget)
          onChange(e.target.value as T)
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {name(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

function Fact({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  )
}
