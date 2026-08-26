import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { alphabetFor } from '@blinkered/engine'
import { readWordList } from '@blinkered/words/node'

/**
 * Packs a word list into something the browser can fetch.
 *
 * Interim, and deliberately not committed. The source here is the system dictionary, which
 * is Webster's Second International of 1934: its copyright has lapsed, but it is a poor list
 * for a word game, full of obsolete and dialect entries (OWSE, SPET) and missing modern
 * inflections. It exists so the web build is playable today. The real two-tier list replaces
 * it behind the same interface, and packages/words/data/README.md governs that.
 */
const USAGE = `
  pnpm wordlist [--source=<path>] [--out=<path>] [--language=en] [--max=16]
`

function arg(name: string, fallback: string): string {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))
  return hit === undefined ? fallback : hit.slice(name.length + 3)
}

function main(): void {
  if (process.argv.includes('--help')) {
    process.stdout.write(USAGE)
    return
  }
  const source = arg('source', '/usr/share/dict/words')
  const out = arg('out', 'apps/web/public/words-en.txt')
  const alphabet = alphabetFor(arg('language', 'en'))
  const maxLength = Number(arg('max', '16'))

  const words = readWordList(source, alphabet, { minLength: 2, maxLength })
  const body = `${words.join('\n')}\n`
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, body, 'utf8')

  const kb = (body.length / 1024).toFixed(0)
  process.stdout.write(
    `${out}\n  ${String(words.length)} words from ${source} (${kb} KB uncompressed)\n`,
  )
}

main()
