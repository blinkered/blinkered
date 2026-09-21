import { asEntry, findBoards } from './board.js'
import { shipped, specFor } from './manifest.js'
import type { LanguageSpec } from './manifest.js'
import { densityScale, derive, floor } from './weights.js'

/**
 * Measures the shipped word lists, and nothing else.
 *
 * It used to build them: fetch a frequency corpus, intersect it with whatever dictionary could
 * validate the language, and write the result with the most restrictive of its input licenses.
 * Lists are attested now -- a word ships because three independent collections were found to
 * contain it -- so building happens in `blinkered-dictionary-*` and `pnpm languages update`
 * borrows the result.
 *
 * What is left is the three numbers that describe a dictionary rather than the rules, and that
 * therefore have to be re-derived whenever a list changes. Skipping them is a silent fault: the
 * word floor sits above what any board can reach, every draw is rejected, and the generator
 * plays the best of four hundred boards while reporting that it failed.
 */
const USAGE = `
  pnpm dictionary weights   [--language=<tag>]
  pnpm dictionary board     [--language=<tag>] [--top=4] [--refresh]
  pnpm dictionary floor

  weights    re-derive draw weights from a shipped list, to paste into the alphabet
  board      search a shipped list for the first-run tour's six tiles and three words
  floor      re-measure the board word floor in packages/engine/src/difficulty.ts

  --refresh  ignore the cached frequency corpus and download it again
`

/** The language the word floor curve is measured on; every other language is scaled to it. */
const REFERENCE_LANGUAGE = 'en'

function arg(name: string): string | undefined {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))
  return hit === undefined ? undefined : hit.slice(name.length + 3)
}

function chosen(): readonly LanguageSpec[] {
  const language = arg('language')
  return language === undefined ? shipped() : [specFor(language)]
}

function percent(share: number): string {
  return `${(share * 100).toFixed(0)}%`
}

function doWeights(): void {
  for (const spec of chosen()) {
    const report = derive(spec)
    process.stdout.write(`\n// ${report.tag}\n  weights: {\n${report.block}\n  },\n`)
    process.stdout.write(`  // vowel share ${percent(report.vowelShare)}\n`)
    process.stdout.write(`  // rare: suggested [${report.suggestedRare.join(' ')}]\n`)
    process.stdout.write(`  //       current   [${report.currentRare.join(' ')}]\n`)
    if (report.biggestMoves.length > 0) {
      process.stdout.write(`  // moved: ${report.biggestMoves.join('  ')}\n`)
    }
  }
}

function doFloor(): void {
  const report = floor(REFERENCE_LANGUAGE)
  process.stdout.write(`\n// measured on the ${REFERENCE_LANGUAGE} common tier\n`)
  process.stdout.write(`const MEDIAN_WORDS = [${report.medianWords.join(', ')}] as const\n\n`)
  process.stdout.write('const SHARE_BY_MINIMUM: Readonly<Record<number, number>> = {\n')
  for (const [minLength, share] of Object.entries(report.shareByMinimum)) {
    process.stdout.write(`  ${minLength}: ${String(share)},\n`)
  }
  process.stdout.write('}\n\n')

  const scale = densityScale(
    shipped().map((spec) => spec.tag),
    REFERENCE_LANGUAGE,
  )
  process.stdout.write('const DENSITY_SCALE: Readonly<Record<string, number>> = {\n')
  for (const [tag, value] of Object.entries(scale)) {
    process.stdout.write(`  '${tag}': ${String(value)},\n`)
  }
  process.stdout.write('}\n')
}

/** Boards to print per language. Enough to choose between; the first is usually the one. */
const DEFAULT_BOARD_CHOICES = 4

async function doBoard(): Promise<void> {
  const top = Number(arg('top') ?? DEFAULT_BOARD_CHOICES)
  const refresh = process.argv.includes('--refresh')
  for (const spec of chosen()) {
    const plans = await findBoards(spec, refresh)
    process.stdout.write(`\n// ${spec.tag}: ${String(plans.length)} viable boards\n`)
    for (const plan of plans.slice(0, top)) {
      process.stdout.write(
        `// ${plan.tiles.join('')}  worst rank ${String(plan.worstRank)}  ` +
          `${plan.three} -> ${plan.six}, card ${plan.card.masked}->${plan.card.becomes} ` +
          `= ${plan.card.word}\n${asEntry(spec.tag, plan)}\n`,
      )
    }
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'help'
  switch (command) {
    case 'weights':
      doWeights()
      return
    case 'board':
      await doBoard()
      return
    case 'floor':
      doFloor()
      return
    default:
      process.stdout.write(USAGE)
  }
}

await main()
