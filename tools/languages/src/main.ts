import { writeFileSync } from 'node:fs'
import { commitMessage, report } from './report.js'
import { apply, survey } from './update.js'
import type { Options } from './update.js'

const USAGE = `
pnpm languages update [options]

  Re-borrows every word list from its own repository's main branch, and sets which
  localizations the app can offer. One language is one repository: blinkered-dictionary-<tag>.

  --only <tags>      comma separated, for checking one language rather than all of them
  --approve <tags>   comma separated; the languages you agree to stop offering
  --dry-run          read and report, write nothing
  --rewrite          re-write every language, even where upstream has not moved
  --message <path>   write the commit message for this run to a file
`

function list(args: readonly string[], flag: string): string[] {
  const at = args.indexOf(flag)
  if (at === -1) return []
  const value = args[at + 1]
  if (value === undefined || value.startsWith('--')) throw new Error(`${flag} needs a value`)
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '')
}

function value(args: readonly string[], flag: string): string | undefined {
  const at = args.indexOf(flag)
  if (at === -1) return undefined
  const found = args[at + 1]
  if (found === undefined || found.startsWith('--')) throw new Error(`${flag} needs a value`)
  return found
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]
  if (command === undefined || command === 'help' || args.includes('--help')) {
    process.stdout.write(`${USAGE}\n`)
    return
  }
  if (command !== 'update') throw new Error(`unknown command "${command}". ${USAGE}`)

  const options: Options = {
    only: list(args, '--only'),
    approved: new Set(list(args, '--approve')),
    dryRun: args.includes('--dry-run'),
    rewrite: args.includes('--rewrite'),
  }

  const when = new Date()
  const plan = await survey(options)
  process.stdout.write(`${report(plan)}\n`)

  if (plan.blocked.length > 0) {
    process.exitCode = 1
    return
  }

  const wrote = plan.outcomes.filter(
    (outcome) =>
      outcome.verdict === 'added' ||
      outcome.verdict === 'updated' ||
      plan.regressions.includes(outcome),
  )
  if (wrote.length === 0) {
    process.stdout.write('\nNothing to do: every language is already what its repository says.\n')
    return
  }

  if (options.dryRun) {
    process.stdout.write(
      `\nDry run: ${String(wrote.length)} language${wrote.length === 1 ? '' : 's'} would change. Nothing written.\n`,
    )
    return
  }

  const kept = await apply(plan, when)
  const message = commitMessage(plan, when)
  const path = value(args, '--message')
  if (path !== undefined) writeFileSync(path, message, 'utf8')

  process.stdout.write(
    `\n${String(kept.length)} language${kept.length === 1 ? '' : 's'} available. ` +
      'Review, then commit:\n\n' +
      `${message
        .split('\n')
        .map((row) => `  ${row}`)
        .join('\n')}\n`,
  )
}

await main()
