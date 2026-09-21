import { fetchText } from './cache.js'
import type { Corpus } from './manifest.js'

/**
 * How common each word is, which is the only thing a corpus is consulted for now.
 *
 * It used to order the candidates a list was cut from. The cutting happens in
 * `blinkered-dictionary-*` against candidates in `blinkered-attestation`, so what is left is
 * ranking tour boards: a board scores well only when every word on it is one a speaker uses
 * rather than one a dictionary admits, and nothing in a shipped list says which is which.
 */
const OPEN_SUBTITLES =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018'

export function corpusUrl(corpus: Corpus): string {
  return `${OPEN_SUBTITLES}/${corpus.id}/${corpus.id}_full.txt`
}

/** `word count` lines, commonest first, lower case. */
export async function frequencyLines(corpus: Corpus, refresh: boolean): Promise<string[]> {
  const text = await fetchText(`frequency/${corpus.id}.txt`, corpusUrl(corpus), refresh)
  return text.split('\n')
}
