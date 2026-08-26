import { alphabetFor } from '@blinkered/engine'
import { buildTieredIndex, parseWordList } from '@blinkered/words'
import type { TieredIndex } from '@blinkered/words'
import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'

/** One language as the shipped data describes it. Written by `pnpm dictionary build`. */
export interface CatalogueEntry {
  readonly tag: string
  readonly endonym: string
  readonly common: number
  readonly full: number
  readonly bytes: number
  readonly licence: string
  /** True when the data licence carries a share-alike obligation. See DICTIONARIES.md. */
  readonly shareAlike: boolean
  /** Median words a 12-tile board admits from the common tier. */
  readonly density: number
}

function base(): string {
  return import.meta.env.BASE_URL
}

/**
 * What languages this build can actually play.
 *
 * Read at runtime rather than compiled in, so the answer describes the deployment rather than
 * the moment it was built, and a language whose list failed to ship is simply not offered.
 */
export async function loadCatalogue(signal: AbortSignal): Promise<CatalogueEntry[]> {
  const response = await fetch(`${base()}words/manifest.json`, { signal })
  if (!response.ok) throw new Error('No word lists. Build them with:  pnpm dictionary build')
  const parsed = (await response.json()) as { languages?: CatalogueEntry[] }
  const languages = parsed.languages ?? []
  if (languages.length === 0) {
    throw new Error('No word lists. Build them with:  pnpm dictionary build')
  }
  return languages
}

/**
 * Loads one language's word list and builds its index.
 *
 * This runs on the main thread on purpose. The engine's `Dictionary.has` is synchronous,
 * because word validation happens inside a pure reducer, so moving the index into a Web
 * Worker would mean making validation async and changing the engine's contract. Instead the
 * index is built once per language, behind a loading state.
 *
 * The two tiers are one file and one fetch. `has` accepts the full list, so an unusual word
 * still scores; `profile` counts only the common tier, so a board has to be solvable from
 * vocabulary people actually use. See docs/DICTIONARIES.md.
 */
export async function loadDictionary(
  language: string,
  messages: Messages,
  signal: AbortSignal,
): Promise<TieredIndex> {
  const alphabet = alphabetFor(language)
  const response = await fetch(`${base()}words/${language}.txt`, { signal })
  if (!response.ok) throw new Error(format(messages.noWordList, { language }))

  const text = await response.text()
  // A dev server answers an unmatched path with index.html rather than a 404, so `ok` alone
  // would let the app try to parse a web page as a dictionary. parseWordList refuses anything
  // without the magic header, which covers that and a truncated download besides.
  let parsed
  try {
    parsed = parseWordList(text)
  } catch {
    throw new Error(format(messages.noWordList, { language }))
  }
  if (parsed.full.length === 0) throw new Error(format(messages.emptyWordList, { language }))
  return buildTieredIndex(parsed.full, parsed.common, alphabet)
}
