import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Where the shipped lists live, which is the only directory this tool reads. */
export const DATA_DIR = 'packages/words/data'

/**
 * Where a language's word *ordering* comes from, which is all a corpus decides here.
 *
 * One kind, where there used to be three. Wikipedia counts and JMdict's priority bands existed
 * to order languages that had no OpenSubtitles list, and both belonged to the half of this tool
 * that built word lists out of dictionaries. That half is gone: lists are attested in
 * `blinkered-dictionary-*` now and borrowed by `pnpm languages update`.
 *
 * What is left needs a corpus for one thing only, which is ranking candidate tour boards by how
 * common their words are. A language that needs a different corpus for that can add it back.
 */
export interface Corpus {
  readonly kind: 'openSubtitles'
  readonly id: string
}

export interface LanguageSpec {
  /** Engine language id, and the directory the shipped list is read from. */
  readonly tag: string
  readonly corpus: Corpus
}

/**
 * Where a tag and its corpus id differ, which is only ever a regional variant.
 *
 * hermitdave's directories are named by language, so `pt-BR` is `pt_br` and everything else is
 * itself. Listed rather than computed, because a rule that lower-cases and swaps the hyphen
 * would silently invent a directory name for any tag that does not have one.
 */
const CORPUS_ID: Readonly<Record<string, string>> = { 'pt-BR': 'pt_br' }

export function specFor(tag: string): LanguageSpec {
  return { tag, corpus: { kind: 'openSubtitles', id: CORPUS_ID[tag] ?? tag } }
}

/**
 * Every language with a list on disk.
 *
 * Read from the directory rather than from a table. There used to be a table of fifty-one, each
 * entry naming the dictionaries that validated it and the license branch relied on, and it was
 * the right shape when this tool decided what shipped. It does not decide that any more, so a
 * second list of languages here could only disagree with the first.
 */
export function shipped(): LanguageSpec[] {
  if (!existsSync(DATA_DIR)) return []
  return readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(DATA_DIR, entry.name, 'words.txt')))
    .map((entry) => specFor(entry.name))
    .sort((a, b) => a.tag.localeCompare(b.tag))
}
