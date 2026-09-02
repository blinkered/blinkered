import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { asEntry, findBoards } from './board.js'
import { build, sweep } from './build.js'
import { LANGUAGES, specFor } from './manifest.js'
import type { LanguageSpec, Source } from './manifest.js'
import { requireHunspell } from './sources.js'
import { densityScale, derive, floor } from './weights.js'
import { DATA_DIR, writeLanguage, writeManifest } from './write.js'
import type { ManifestEntry } from './write.js'

/**
 * Builds the shipped word lists. Design and evidence: docs/DICTIONARIES.md.
 *
 * Everything downloaded is cached under .cache/dictionary, so re-running is cheap and
 * calibrating a cut does not mean fetching a corpus again.
 */
const USAGE = `
  pnpm dictionary build     [--language=<tag>] [--refresh]
  pnpm dictionary calibrate  --language=<tag>  [--cuts=10000,20000,30000]
  pnpm dictionary weights   [--language=<tag>]
  pnpm dictionary board     [--language=<tag>] [--top=4]
  pnpm dictionary floor
  pnpm dictionary list

  build      fetch, validate and write packages/words/data/<tag>/
  calibrate  sweep the candidate cut and report what each does to board density
  weights    re-derive draw weights from a built list, to paste into the alphabet
  board      search a built list for the first-run tour's six tiles and three words
  floor      re-measure the board word floor in packages/engine/src/difficulty.ts
  list       the languages this tool knows how to build

  --refresh  ignore the cache and download again
`

const DEFAULT_CUTS = [10_000, 20_000, 30_000, 50_000]

/** The language the word floor curve is measured on; every other language is scaled to it. */
const REFERENCE_LANGUAGE = 'en'

function arg(name: string): string | undefined {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))
  return hit === undefined ? undefined : hit.slice(name.length + 3)
}

function chosen(): readonly LanguageSpec[] {
  const language = arg('language')
  return language === undefined ? LANGUAGES : [specFor(language)]
}

/** Merges into whatever is already there, so building one language keeps the rest listed. */
function mergeManifest(fresh: readonly ManifestEntry[]): void {
  const path = join(DATA_DIR, 'manifest.json')
  const byTag = new Map<string, ManifestEntry>()
  if (existsSync(path)) {
    const existing = JSON.parse(readFileSync(path, 'utf8')) as { languages?: ManifestEntry[] }
    for (const entry of existing.languages ?? []) byTag.set(entry.tag, entry)
  }
  for (const entry of fresh) byTag.set(entry.tag, entry)
  writeManifest([...byTag.values()])
}

function percent(share: number): string {
  return `${(share * 100).toFixed(0)}%`
}

async function doBuild(): Promise<void> {
  requireHunspell()
  const refresh = process.argv.includes('--refresh')
  const written: ManifestEntry[] = []
  const failed: string[] = []

  for (const spec of chosen()) {
    process.stderr.write(`${spec.tag}\n`)
    try {
      const built = await build(spec, refresh)
      written.push(writeLanguage(built))
      const { stats } = built.tiers
      process.stdout.write(
        `${spec.tag.padEnd(6)} common ${String(built.tiers.common.length).padStart(6)}  ` +
          `full ${String(built.tiers.full.length).padStart(6)}  ` +
          `yield ${percent(stats.commonYield)}/${percent(stats.fullYield)}  ` +
          `coverage ${percent(stats.coverage)}  ` +
          `board ${String(built.density.median)} words, ${percent(built.density.ceilingRate)} reach 6\n`,
      )
    } catch (cause) {
      // One unavailable source should not cost the other fifteen languages.
      failed.push(spec.tag)
      process.stdout.write(`${spec.tag.padEnd(6)} FAILED  ${String(cause)}\n`)
    }
  }

  if (written.length > 0) mergeManifest(written)
  process.stdout.write(`\n${String(written.length)} written, ${String(failed.length)} failed\n`)
  if (failed.length > 0) process.exitCode = 1
}

async function doCalibrate(): Promise<void> {
  requireHunspell()
  const language = arg('language')
  if (language === undefined) throw new Error('calibrate needs --language=<tag>')
  const spec = specFor(language)
  const cuts = (arg('cuts')?.split(',').map(Number) ?? DEFAULT_CUTS).filter(
    (cut) => Number.isFinite(cut) && cut > 0,
  )

  const rows = await sweep(spec, cuts, process.argv.includes('--refresh'))
  process.stdout.write(`\n${spec.tag}: board density by candidate cut\n`)
  process.stdout.write('  cut      words kept   median board   reach 6   coverage\n')
  for (const row of rows) {
    process.stdout.write(
      `  ${String(row.cut).padStart(6)}   ${String(row.tiers.full.length).padStart(10)}   ` +
        `${String(row.density.median).padStart(12)}   ${percent(row.density.ceilingRate).padStart(7)}   ` +
        `${percent(row.tiers.stats.coverage).padStart(8)}\n`,
    )
  }
  process.stdout.write(
    '\nPick the cut whose median board is near the target in docs/DICTIONARIES.md, then set\n' +
      'it in tools/dictionary/src/manifest.ts.\n',
  )
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
    LANGUAGES.map((spec) => spec.tag),
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

function sourceLabel(source: Source): string {
  if (source.kind === 'titles') return `${source.wiki}.wiktionary`
  if (source.kind === 'category') return `${source.wiki}.wiktionary categories`
  return source.id
}

function doList(): void {
  for (const spec of LANGUAGES) {
    const sources = spec.groups
      .flat()
      .map((source) => sourceLabel(source))
      .join(', ')
    process.stdout.write(`${spec.tag.padEnd(6)} ${sources}\n`)
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'help'
  switch (command) {
    case 'build':
      await doBuild()
      return
    case 'calibrate':
      await doCalibrate()
      return
    case 'weights':
      doWeights()
      return
    case 'board':
      await doBoard()
      return
    case 'floor':
      doFloor()
      return
    case 'list':
      doList()
      return
    default:
      process.stdout.write(USAGE)
  }
}

await main()
