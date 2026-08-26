import { selectedLetters } from '@flippy/engine'
import type { GameState, KeyScheme } from '@flippy/engine'
import { columnsFor } from './board.js'

const ESC = '\u001b'
const RESET = `${ESC}[0m`
const DIM = `${ESC}[2m`
const BOLD = `${ESC}[1m`
const GREEN = `${ESC}[32m`
const CYAN = `${ESC}[36m`
const YELLOW = `${ESC}[33m`
const RED = `${ESC}[31m`
const INVERSE = `${ESC}[7m`

export const CLEAR_SCREEN = `${ESC}[2J${ESC}[H`

export interface View {
  readonly flash: string
  readonly scheme: KeyScheme
  readonly boardWords: number
  readonly boardLongest: number
}

export function render(state: GameState, view: View): string {
  const { config } = state
  const rules = [
    config.wordCompleteMode,
    config.flipEconomy,
    `min ${String(config.minWordLength)}`,
    `hold ${String(config.holdTicks)}`,
    `${String(config.speedMultiplier)}s/tick`,
    `keys: ${view.scheme}`,
  ].join('  ')

  const hud = [
    `${BOLD}flips${RESET} ${flipColour(state.flipsRemaining)}${String(state.flipsRemaining).padStart(4)}${RESET}`,
    `${BOLD}score${RESET} ${String(state.score).padStart(4)}`,
    `${BOLD}round${RESET} ${String(state.roundIndex + 1).padStart(3)}`,
    `${BOLD}words${RESET} ${String(state.wordsFound.length).padStart(3)}`,
    `${DIM}board ~${String(view.boardWords)} words, longest ${String(view.boardLongest)}${RESET}`,
  ].join('   ')

  const word = selectedLetters(state)

  return [
    `${BOLD}FLIPPY${RESET}  ${DIM}${rules}${RESET}`,
    '',
    hud,
    timerBar(state),
    '',
    ...boardRows(state),
    '',
    `  ${BOLD}${word.padEnd(config.n, '_')}${RESET}   ${view.flash}`,
    '',
    `  ${DIM}${found(state)}${RESET}`,
    '',
    `  ${DIM}letters select  1-9,0 tap the first ten  enter submits  esc clears  backspace undoes  ctrl-c quits${RESET}`,
  ].join('\n')
}

function flipColour(flips: number): string {
  if (flips <= 5) return RED + BOLD
  if (flips <= 20) return YELLOW
  return GREEN
}

function timerBar(state: GameState): string {
  const left = state.ticksRemaining
  const spent = Math.max(0, state.config.n + state.config.holdTicks - left)
  const bar = `${CYAN}${'#'.repeat(left)}${RESET}${DIM}${'-'.repeat(spent)}${RESET}`
  return `  ${bar} ${DIM}${String(left)} tick${left === 1 ? '' : 's'}${RESET}`
}

function boardRows(state: GameState): string[] {
  const columns = columnsFor(state.config.n)
  const ordered = [...state.tiles].sort((a, b) => a.position - b.position)
  const rows: string[] = []
  for (let start = 0; start < ordered.length; start += columns) {
    const row = ordered.slice(start, start + columns)
    rows.push('  ' + row.map((tile) => cell(state, tile.id)).join(' '))
  }
  return rows
}

function cell(state: GameState, tileId: number): string {
  const tile = state.tiles[tileId]
  /* c8 ignore next -- tiles is indexed by id */
  if (!tile) return '     '
  const order = state.selection.indexOf(tileId)
  if (order >= 0) return `${GREEN}${INVERSE}[${tile.letter}${subscript(order + 1)}]${RESET}`
  if (tile.spent) return `${DIM}[ . ]${RESET}`
  if (!tile.revealed) return `${DIM}[ ? ]${RESET}`
  return `${BOLD}[ ${tile.letter} ]${RESET}`
}

const SUBSCRIPTS = '0123456789'

function subscript(value: number): string {
  return value < 10 ? (SUBSCRIPTS[value] ?? '') : String(value)
}

function found(state: GameState): string {
  if (state.wordsFound.length === 0) return 'no words yet'
  return state.wordsFound
    .slice(-10)
    .map((word) => `${word.word}(${String(word.points)})`)
    .join(' ')
}

export function summary(state: GameState): string {
  const words = [...state.wordsFound].sort((a, b) => b.points - a.points)
  const longest = words.reduce((best, word) => Math.max(best, word.length), 0)
  const best = words
    .slice(0, 8)
    .map((word) => word.word)
    .join(' ')
  return [
    '',
    `${BOLD}game over${RESET}`,
    `  score    ${String(state.score)}`,
    `  words    ${String(state.wordsFound.length)}`,
    `  rounds   ${String(state.roundIndex + 1)}`,
    `  longest  ${String(longest)} letters`,
    `  best     ${best === '' ? 'none' : best}`,
    `  letters  ${[...state.tiles].map((tile) => tile.letter).join('')}`,
    '',
  ].join('\n')
}
