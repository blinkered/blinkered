import { ENGLISH, alphabetFor } from '@blinkered/engine'
import type { Alphabet } from '@blinkered/engine'
import { buildIndex, calibrate, deriveWeights } from '@blinkered/words'
import { readWordList } from '@blinkered/words/node'

const USAGE = `
Derives a language's draw weights and word-count calibration from its own word list, so the
numbers in an Alphabet and in defaultWMin describe the dictionary rather than a guess.

  pnpm derive [options]

  --words=<path>       word list, one per line (default /usr/share/dict/words)
  --language=<tag>     alphabet to fold the list onto (default en)
  --bag=<n>            notional tile-bag size; bigger means finer weights (default 100)
  --samples=<n>        boards sampled per size when calibrating (default 1500)
  --sizes=6,9,12       board sizes to calibrate (default 6..12)
  --no-calibration     weights only, skip the sampling pass
`

interface Options {
  readonly path: string
  readonly alphabet: Alphabet
  readonly bagSize: number
  readonly samples: number
  readonly sizes: readonly number[]
  readonly calibrate: boolean
}

function fail(message: string): never {
  process.stderr.write(`${message}\n${USAGE}`)
  process.exit(1)
}

function parseArgs(argv: readonly string[]): Options {
  let path = '/usr/share/dict/words'
  let alphabet: Alphabet = ENGLISH
  let bagSize = 100
  let samples = 1500
  let sizes = [6, 7, 8, 9, 10, 11, 12]
  let wantsCalibration = true

  for (const arg of argv) {
    const [flag, raw = ''] = arg.split('=', 2) as [string, string?]
    switch (flag) {
      case '--help':
        process.stdout.write(USAGE)
        process.exit(0)
      case '--words':
        path = raw
        break
      case '--language':
        alphabet = alphabetFor(raw)
        break
      case '--bag':
        bagSize = Number(raw)
        break
      case '--samples':
        samples = Number(raw)
        break
      case '--sizes':
        sizes = raw.split(',').map(Number)
        break
      case '--no-calibration':
        wantsCalibration = false
        break
      default:
        fail(`unknown option: ${flag}`)
    }
  }
  if (!Number.isInteger(bagSize) || bagSize < 26) fail('--bag must be at least 26')
  if (!Number.isInteger(samples) || samples < 1) fail('--samples must be a positive integer')
  if (sizes.some((n) => !Number.isInteger(n) || n < 2)) fail('--sizes must be whole numbers >= 2')
  return { path, alphabet, bagSize, samples, sizes, calibrate: wantsCalibration }
}

function pct(share: number): string {
  return `${(share * 100).toFixed(1)}%`
}

function main(): void {
  const options = parseArgs(process.argv.slice(2))
  const { alphabet } = options

  const words = readWordList(options.path, alphabet, { minLength: 2, maxLength: 16 })
  process.stdout.write(
    `\n${options.path}\n  ${String(words.length)} playable words for alphabet "${alphabet.id}"\n`,
  )

  const derived = deriveWeights(words, alphabet, { bagSize: options.bagSize })

  process.stdout.write('\nderived draw weights\n')
  const rows = Object.entries(derived.weights).sort(([, a], [, b]) => b - a)
  for (const [letter, weight] of rows) {
    const current = alphabet.weights[letter] ?? 0
    const drift = weight === current ? '' : `   (alphabet says ${String(current)})`
    const bar = '#'.repeat(weight)
    process.stdout.write(
      `  ${letter}  ${String(weight).padStart(3)}  ${pct(derived.frequency[letter] ?? 0).padStart(6)}  ${bar}${drift}\n`,
    )
  }
  process.stdout.write(`\n  vowel share            ${pct(derived.vowelShare)}\n`)
  process.stdout.write(`  suggested rare letters ${derived.suggestedRareLetters.join(' ')}\n`)
  process.stdout.write(`  alphabet currently says ${alphabet.rareLetters.join(' ')}\n`)

  if (!options.calibrate) return

  const candidate: Alphabet = { ...alphabet, weights: derived.weights }
  const index = buildIndex(words, alphabet)
  const table = calibrate(index, candidate, {
    sizes: options.sizes,
    samples: options.samples,
  })

  process.stdout.write('\nwords a board admits, by size and minimum length\n')
  process.stdout.write('   n  min      p25   median      p75   holds a 6+   faulty draws\n')
  for (const row of table) {
    process.stdout.write(
      `  ${String(row.n).padStart(2)}   ${String(row.minLength)}   ${String(row.p25).padStart(6)}` +
        `   ${String(row.median).padStart(6)}   ${String(row.p75).padStart(6)}` +
        `       ${pct(row.ceilingRate).padStart(6)}         ${pct(row.faultRate).padStart(6)}\n`,
    )
  }

  // The two literals defaultWMin reads. Paste them into packages/engine/src/difficulty.ts.
  const atMinimumThree = options.sizes.map(
    (n) => table.find((row) => row.n === n && row.minLength === 3)?.median ?? 0,
  )
  const baseline = table.find((row) => row.n === 9 && row.minLength === 3)?.median ?? 0
  process.stdout.write('\ncalibration for packages/engine/src/difficulty.ts\n')
  process.stdout.write(`  MEDIAN_WORDS (n = ${options.sizes.join(', ')})\n`)
  process.stdout.write(`    [${atMinimumThree.join(', ')}]\n`)
  if (baseline > 0) {
    process.stdout.write('  SHARE_BY_MINIMUM (measured at n=9)\n')
    for (const minLength of [2, 3, 4, 5, 6]) {
      const median = table.find((row) => row.n === 9 && row.minLength === minLength)?.median
      if (median === undefined) continue
      process.stdout.write(`    ${String(minLength)}: ${(median / baseline).toFixed(2)}\n`)
    }
  }
  process.stdout.write('\n')
}

main()
