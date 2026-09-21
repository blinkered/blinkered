import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * Downloaded corpora, kept out of the repository.
 *
 * Nothing here is tracked and nothing here is needed to run the game. A frequency list is
 * fetched only when somebody asks this tool to rank tour boards, and it is cached so that asking
 * twice costs nothing.
 */
export const CACHE = resolve('.cache/dictionary')

export function cachePath(name: string): string {
  return join(CACHE, name)
}

/** Fetches to the cache and returns the text. */
export async function fetchText(name: string, url: string, refresh: boolean): Promise<string> {
  const path = cachePath(name)
  if (!refresh && existsSync(path)) return readFileSync(path, 'utf8')

  process.stderr.write(`  fetching ${url}\n`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${String(response.status)} from ${url}`)
  const text = await response.text()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text, 'utf8')
  return text
}
