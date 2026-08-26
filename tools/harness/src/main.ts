import { configFor, createGame, keyToEvent, reduce, tileAt } from '@blinkered/engine'
import type {
  Difficulty,
  Effect,
  FlipEconomy,
  GameConfig,
  GameEvent,
  GameState,
  KeyPress,
  KeyScheme,
  WordCompleteMode,
} from '@blinkered/engine'
import { alphabetFor } from '@blinkered/engine'
import { buildIndex, generateBoard } from '@blinkered/words'
import { readWordList } from '@blinkered/words/node'
import { CLEAR_SCREEN, render, summary } from './render.js'

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'insane']
const MODES: readonly WordCompleteMode[] = ['shuffle', 'spend', 'keep']
const ECONOMIES: readonly FlipEconomy[] = ['none', 'perLetter', 'fibonacci', 'overMinimum']
const SCHEMES: readonly KeyScheme[] = ['cycle', 'advance']

const USAGE = `
Blinkered, in a terminal. Phase 1 rules harness.

  pnpm play [options]

  --difficulty=easy|medium|hard|insane   preset to start from (default medium)
  --mode=shuffle|spend|keep              what an accepted word does to the board
  --economy=none|perLetter|fibonacci|overMinimum   what a word pays in flips
  --min=<n>                              minimum word length
  --n=<n>                                tiles on the board
  --speed=<seconds>                      real seconds per tick
  --hold=<n>                             extra ticks the full board stays up
  --flips=<n>                            starting flips
  --charge                               bill the full round even when it ends early
  --keys=cycle|advance                   how a repeated letter key behaves
  --seed=<n>                             board seed
  --ticks=<n>                            run n ticks with no input, print, exit
`

interface Options {
  readonly config: GameConfig
  readonly scheme: KeyScheme
  readonly seed: number
  readonly autoTicks: number | null
}

function fail(message: string): never {
  process.stderr.write(`${message}\n${USAGE}`)
  process.exit(1)
}

function oneOf<T extends string>(name: string, value: string, allowed: readonly T[]): T {
  const match = allowed.find((candidate) => candidate === value)
  if (match === undefined) fail(`--${name} must be one of: ${allowed.join(', ')}`)
  return match
}

function whole(name: string, value: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) fail(`--${name} must be zero or a whole number`)
  return parsed
}

function positive(name: string, value: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) fail(`--${name} must be a positive number`)
  return parsed
}

function parseArgs(argv: readonly string[]): Options {
  let difficulty: Difficulty = 'medium'
  let scheme: KeyScheme = 'cycle'
  let seed = Math.floor(Date.now() % 2147483647)
  let autoTicks: number | null = null
  const overrides: Record<string, unknown> = {}

  for (const arg of argv) {
    const [flag, raw = ''] = arg.split('=', 2) as [string, string?]
    switch (flag) {
      case '--help':
        process.stdout.write(USAGE)
        process.exit(0)
      case '--difficulty':
        difficulty = oneOf('difficulty', raw, DIFFICULTIES)
        break
      case '--mode':
        overrides['wordCompleteMode'] = oneOf('mode', raw, MODES)
        break
      case '--economy':
        overrides['flipEconomy'] = oneOf('economy', raw, ECONOMIES)
        break
      case '--keys':
        scheme = oneOf('keys', raw, SCHEMES)
        break
      case '--min':
        overrides['minWordLength'] = positive('min', raw)
        break
      case '--hold':
        overrides['holdTicks'] = whole('hold', raw)
        break
      case '--n':
        overrides['n'] = positive('n', raw)
        break
      case '--speed':
        overrides['speedMultiplier'] = positive('speed', raw)
        break
      case '--flips':
        overrides['initialFlips'] = positive('flips', raw)
        break
      case '--charge':
        overrides['chargeFullRound'] = true
        break
      case '--seed':
        seed = positive('seed', raw)
        break
      case '--ticks':
        autoTicks = positive('ticks', raw)
        break
      default:
        fail(`unknown option: ${flag}`)
    }
  }

  return { config: configFor(difficulty, overrides), scheme, seed, autoTicks }
}

/** The one effect worth putting on the status line. */
function describe(effects: readonly Effect[]): string | null {
  const ESC = '\u001b'
  const green = `${ESC}[32m`
  const red = `${ESC}[31m`
  const dim = `${ESC}[2m`
  const reset = `${ESC}[0m`
  for (const effect of [...effects].reverse()) {
    switch (effect.type) {
      case 'WORD_ACCEPTED':
        return `${green}${effect.word}  +${String(effect.points)} pts  +${String(effect.flips)} flips${reset}`
      case 'WORD_REJECTED': {
        const reason =
          effect.reason === 'duplicate'
            ? 'already found'
            : effect.reason === 'too-short'
              ? 'too short'
              : 'not a word'
        return `${red}${effect.word || '(nothing)'}  ${reason}${reset}`
      }
      case 'ROUND_ENDED':
        return effect.flipsCharged > 0
          ? `${dim}shuffled, billed ${String(effect.flipsCharged)} unused flips${reset}`
          : `${dim}shuffled${reset}`
      case 'INPUT_IGNORED':
        if (effect.reason === 'no-such-letter') return `${dim}not up${reset}`
        if (effect.reason === 'already-selected') return `${dim}all of them are in${reset}`
        return null
      case 'REVEALED':
      case 'SELECTED':
      case 'DESELECTED':
      case 'GAME_OVER':
        break
    }
  }
  return null
}

function toKeyPress(chunk: string): KeyPress | null {
  if (chunk === '\r' || chunk === '\n') return { key: 'Enter' }
  if (chunk === '\u001b') return { key: 'Escape' }
  if (chunk === '\u007f' || chunk === '\b') return { key: 'Backspace' }
  if (chunk.length === 1) {
    const code = chunk.charCodeAt(0)
    // Ctrl-A through Ctrl-Z arrive as 1..26. Ctrl-C and Ctrl-D are handled before this.
    if (code >= 1 && code <= 26) {
      return { key: String.fromCharCode(96 + code), modified: true }
    }
    if (/^[a-z]$/i.test(chunk)) return { key: chunk }
  }
  return null
}

function main(): void {
  const options = parseArgs(process.argv.slice(2))
  process.stdout.write('loading words...\n')
  // Placeholder list until phase 2 packs a real two-tier dictionary.
  const alphabet = alphabetFor(options.config.language)
  const words = buildIndex(
    readWordList('/usr/share/dict/words', alphabet, { minLength: 2, maxLength: 16 }),
    alphabet,
  )
  const board = generateBoard(options.config, options.seed, words, alphabet)
  if (!board.accepted) {
    process.stdout.write(
      `no board cleared W=${String(options.config.wMin)} with a ` +
        `${String(options.config.ceilingMin)}-letter word in ${String(board.attempts)} draws; ` +
        `playing the best found (${String(board.wordCount)} words, longest ${String(board.longest)})\n`,
    )
  }

  const [initial] = createGame({
    config: options.config,
    letters: board.letters,
    seed: options.seed,
  })
  let state: GameState = initial
  let flash = ''

  const draw = (): void => {
    process.stdout.write(
      CLEAR_SCREEN +
        render(state, {
          flash,
          scheme: options.scheme,
          boardWords: board.wordCount,
          boardLongest: board.longest,
        }) +
        '\n',
    )
  }

  const dispatch = (event: GameEvent): void => {
    const [next, effects] = reduce(state, event, words)
    state = next
    flash = describe(effects) ?? (event.type === 'TICK' ? '' : flash)
    draw()
  }

  if (options.autoTicks !== null) {
    for (let i = 0; i < options.autoTicks && state.status === 'playing'; i++) {
      dispatch({ type: 'TICK' })
    }
    process.stdout.write(state.status === 'over' ? summary(state) : '\n')
    return
  }

  if (!process.stdin.isTTY) fail('no terminal attached; try --ticks=20 for a non-interactive run')

  let timer: ReturnType<typeof setInterval> | null = null

  const stop = (): void => {
    if (timer !== null) clearInterval(timer)
    process.stdin.setRawMode(false)
    process.stdin.pause()
    process.stdout.write(summary(state))
  }

  timer = setInterval(() => {
    dispatch({ type: 'TICK' })
    if (state.status === 'over') stop()
  }, options.config.speedMultiplier * 1000)

  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (chunk: string) => {
    if (chunk === '\u0003' || chunk === '\u0004') {
      stop()
      return
    }
    const digit = /^[0-9]$/.test(chunk) ? (Number(chunk) + 9) % 10 : null
    if (digit !== null) {
      if (digit < state.config.n) dispatch({ type: 'TAP_TILE', tileId: tileAt(state, digit).id })
      return
    }
    const press = toKeyPress(chunk)
    if (press === null) return
    const event = keyToEvent(press, options.scheme)
    if (event === null) return
    dispatch(event)
    // In shuffle mode a submitted word can end the round, and with it the game.
    if (state.status === 'over') stop()
  })

  draw()
}

main()
