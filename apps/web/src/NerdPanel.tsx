import { DIFFICULTIES, flipReward, wordScore } from '@blinkered/engine'
import type {
  Difficulty,
  FlipEconomy,
  GameConfig,
  KeyScheme,
  WordCompleteMode,
} from '@blinkered/engine'
import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import type { GeneratedBoard, TieredIndex } from '@blinkered/words'
import { withoutStealingFocus } from './focus.js'
import { InterfacePicker } from './LanguagePicker.js'
import { countOf } from './Hud.js'
import {
  DIFFICULTY_NAMES,
  FLIP_ECONOMIES,
  KEY_SCHEMES,
  WORD_COMPLETE_MODES,
  isCanonical,
} from './settings.js'
import type { Settings } from './settings.js'

interface NerdPanelProps {
  readonly settings: Settings
  readonly config: GameConfig
  readonly board: GeneratedBoard
  readonly dictionary: TieredIndex
  readonly dirty: boolean
  readonly messages: Messages
  readonly onChange: (next: Settings) => void
  readonly onNewGame: () => void
}

/** The smallest word length the shipped lists hold; see docs/DICTIONARIES.md. */
const SHORTEST_SHIPPED_WORD = 3

/**
 * Every rule, and the arithmetic they produce. The derived numbers matter more than the raw
 * settings: "hold 2" means nothing until you see that it buys 3.6 seconds with the whole
 * board showing, and the flip economy means nothing until you see what a word pays against
 * what its letters cost.
 */
export function NerdPanel({
  settings,
  config,
  board,
  dictionary,
  dirty,
  messages,
  onChange,
  onNewGame,
}: NerdPanelProps): React.JSX.Element {
  const set = (overrides: Partial<GameConfig>): void => {
    onChange({ ...settings, overrides: { ...settings.overrides, ...overrides } })
  }
  const roundTicks = config.n + config.holdTicks
  const seconds = (ticks: number): string => `${(ticks * config.speedMultiplier).toFixed(1)}s`
  const ticks = (count: number): string =>
    format(messages.ticksAndSeconds, {
      ticks: countOf(messages, 'ticks', count),
      seconds: seconds(count),
    })
  const rounds = config.initialFlips / config.n

  return (
    <aside className="nerd">
      <div className="nerd-head">
        <h2>{messages.rules}</h2>
        <label className="nerd-row">
          <span>{messages.difficulty}</span>
          <select
            value={settings.difficulty}
            onChange={(e) => {
              // A preset change discards overrides, otherwise "medium" would silently lie.
              onChange({ ...settings, difficulty: e.target.value as Difficulty, overrides: {} })
            }}
          >
            {DIFFICULTY_NAMES.map((name) => (
              <option key={name} value={name}>
                {messages.difficultyNames[name]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="nerd-grid">
        <Number
          label={messages.tiles}
          value={config.n}
          min={2}
          max={16}
          onChange={(n) => {
            set({ n })
          }}
        />
        <Number
          label={messages.secondsPerTick}
          value={config.speedMultiplier}
          min={0.2}
          max={4}
          step={0.1}
          onChange={(speedMultiplier) => {
            set({ speedMultiplier })
          }}
        />
        <Number
          label={messages.holdTicks}
          value={config.holdTicks}
          min={0}
          max={12}
          onChange={(holdTicks) => {
            set({ holdTicks })
          }}
        />
        {/* Floored at three because the shipped lists start there: a two-letter minimum would
            offer a length with nothing in it to find. */}
        <Number
          label={messages.minWord}
          value={config.minWordLength}
          min={SHORTEST_SHIPPED_WORD}
          max={8}
          onChange={(minWordLength) => {
            set({ minWordLength })
          }}
        />
        <Number
          label={messages.startingFlips}
          value={config.initialFlips}
          min={1}
          max={999}
          onChange={(initialFlips) => {
            set({ initialFlips })
          }}
        />
        <Choice
          label={messages.wordCompleteMode}
          value={config.wordCompleteMode}
          options={WORD_COMPLETE_MODES}
          name={(mode: WordCompleteMode) => messages.wordCompleteNames[mode]}
          onChange={(wordCompleteMode: WordCompleteMode) => {
            set({ wordCompleteMode })
          }}
        />
        <Choice
          label={messages.flipEconomy}
          value={config.flipEconomy}
          options={FLIP_ECONOMIES}
          name={(economy: FlipEconomy) => messages.flipEconomyNames[economy]}
          onChange={(flipEconomy: FlipEconomy) => {
            set({ flipEconomy })
          }}
        />
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
          label={messages.factThisBoard}
          value={format(messages.wordsLongest, {
            words: countOf(messages, 'words', board.wordCount),
            longest: board.longest,
          })}
        />
        <Fact
          label={messages.factBoardHadToAdmit}
          value={format(messages.wordsIncludingOneOf, {
            words: countOf(messages, 'words', config.wMin),
            ceiling: config.ceilingMin,
          })}
        />
        <Fact
          label={messages.gameLanguage}
          value={format(messages.dictionarySize, {
            common: dictionary.commonSize,
            full: dictionary.size,
          })}
        />
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

      <p className="nerd-note">
        {isCanonical(settings)
          ? format(messages.canonicalRules, {
              difficulty: messages.difficultyNames[settings.difficulty],
            })
          : messages.customRules}
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onMouseDown={withoutStealingFocus}
        onClick={onNewGame}
      >
        {dirty ? messages.applyAndStart : messages.newGame}
      </button>
      {dirty ? <p className="nerd-note">{messages.changesNextGame}</p> : null}
      <p className="nerd-note nerd-dim">
        {messages.presets}{' '}
        {DIFFICULTY_NAMES.map(
          (d) => `${messages.difficultyNames[d]} ${String(DIFFICULTIES[d].initialRounds)}r`,
        ).join('  ')}
      </p>
    </aside>
  )
}

function Number({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
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
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  name: (option: T) => string
  onChange: (value: T) => void
}): React.JSX.Element {
  return (
    <label className="nerd-row">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => {
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
