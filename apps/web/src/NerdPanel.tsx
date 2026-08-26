import { DIFFICULTIES, flipReward, wordScore } from '@blinkered/engine'
import type {
  Difficulty,
  FlipEconomy,
  GameConfig,
  KeyScheme,
  WordCompleteMode,
} from '@blinkered/engine'
import type { GeneratedBoard } from '@blinkered/words'
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
  readonly dirty: boolean
  readonly onChange: (next: Settings) => void
  readonly onNewGame: () => void
}

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
  dirty,
  onChange,
  onNewGame,
}: NerdPanelProps): React.JSX.Element {
  const set = (overrides: Partial<GameConfig>): void => {
    onChange({ ...settings, overrides: { ...settings.overrides, ...overrides } })
  }
  const roundTicks = config.n + config.holdTicks
  const seconds = (ticks: number): string => `${(ticks * config.speedMultiplier).toFixed(1)}s`
  const rounds = config.initialFlips / config.n

  return (
    <aside className="nerd">
      <div className="nerd-head">
        <h2>Rules</h2>
        <label className="nerd-row">
          <span>difficulty</span>
          <select
            value={settings.difficulty}
            onChange={(e) => {
              // A preset change discards overrides, otherwise "medium" would silently lie.
              onChange({ ...settings, difficulty: e.target.value as Difficulty, overrides: {} })
            }}
          >
            {DIFFICULTY_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="nerd-grid">
        <Number
          label="tiles (N)"
          value={config.n}
          min={2}
          max={16}
          onChange={(n) => {
            set({ n })
          }}
        />
        <Number
          label="seconds / tick"
          value={config.speedMultiplier}
          min={0.2}
          max={4}
          step={0.1}
          onChange={(speedMultiplier) => {
            set({ speedMultiplier })
          }}
        />
        <Number
          label="hold ticks"
          value={config.holdTicks}
          min={0}
          max={12}
          onChange={(holdTicks) => {
            set({ holdTicks })
          }}
        />
        <Number
          label="min word"
          value={config.minWordLength}
          min={2}
          max={8}
          onChange={(minWordLength) => {
            set({ minWordLength })
          }}
        />
        <Number
          label="starting flips"
          value={config.initialFlips}
          min={1}
          max={999}
          onChange={(initialFlips) => {
            set({ initialFlips })
          }}
        />
        <Choice
          label="word complete"
          value={config.wordCompleteMode}
          options={WORD_COMPLETE_MODES}
          onChange={(wordCompleteMode: WordCompleteMode) => {
            set({ wordCompleteMode })
          }}
        />
        <Choice
          label="flip economy"
          value={config.flipEconomy}
          options={FLIP_ECONOMIES}
          onChange={(flipEconomy: FlipEconomy) => {
            set({ flipEconomy })
          }}
        />
        <Choice
          label="repeated letter key"
          value={settings.keyScheme}
          options={KEY_SCHEMES}
          onChange={(keyScheme: KeyScheme) => {
            onChange({ ...settings, keyScheme })
          }}
        />
      </div>

      <p className="nerd-note nerd-dim">
        {settings.keyScheme === 'advance'
          ? 'A takes the next unused A. Shift+A clears every A in the word.'
          : 'A takes the next unused A, and once they are all in the word, clears them. Shift+A clears them too.'}
      </p>

      <h2>What that means</h2>
      <dl className="nerd-derived">
        <Fact label="round" value={`${String(roundTicks)} ticks, ${seconds(roundTicks)}`} />
        <Fact
          label="whole board up for"
          value={`${String(config.holdTicks + 1)} ticks, ${seconds(config.holdTicks + 1)}`}
        />
        <Fact label="a round costs" value={`${String(config.n)} flips`} />
        <Fact label="starting flips buy" value={`${String(rounds)} scoreless rounds`} />
        <Fact
          label="this board"
          value={`${String(board.wordCount)} words, longest ${String(board.longest)}`}
        />
        <Fact
          label="board had to admit"
          value={`${String(config.wMin)} words incl. one of ${String(config.ceilingMin)}`}
        />
      </dl>

      <h2>What a word pays</h2>
      <table className="nerd-table">
        <thead>
          <tr>
            <th>letters</th>
            <th>cost</th>
            <th>points</th>
            <th>flips</th>
            <th>net</th>
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
          ? `Canonical ${settings.difficulty} rules.`
          : 'Changed from the preset. Scores under custom rules will not be ranked.'}
      </p>
      <button type="button" className="btn btn-primary" onClick={onNewGame}>
        {dirty ? 'Apply and start a new game' : 'New game'}
      </button>
      {dirty ? <p className="nerd-note">Changes take effect on the next game.</p> : null}
      <p className="nerd-note nerd-dim">
        Presets:{' '}
        {DIFFICULTY_NAMES.map((d) => `${d} ${String(DIFFICULTIES[d].initialRounds)}r`).join('  ')}
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
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
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
            {option}
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
