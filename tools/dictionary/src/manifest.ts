import type { CaseRule, TierCuts } from '@blinkered/words'

/**
 * Where every language's words come from, and under what terms.
 *
 * This file is the licence audit. Each source names the SPDX branch we rely on, because a
 * tri-licensed hunspell dictionary read carelessly looks like GPL, and GPL data in a mobile
 * binary is the one outcome that would stop the game shipping. Nothing here is GPL.
 *
 * Two kinds of validator, for one reason: a third of the hunspell dictionaries are GPL-only.
 *
 * - `hunspell`, where a clean-licensed dictionary exists. Best case by a distance: it knows
 *   the language's morphology, so an inflected form validates without anyone enumerating it.
 * - `titles`, the page titles of that language's own Wiktionary. Used where hunspell is
 *   GPL-only (Italian, German, Norwegian) or absent (Finnish, Malay). Weaker on two counts:
 *   titles are mostly lemmas, so inflected forms are refused, and a Wiktionary documents
 *   foreign words too, so a little cross-language noise gets through. Both are bounded by
 *   the frequency list, which is that language's own corpus.
 *
 * The validator is a build-time filter and is never shipped. What ships is the intersection
 * of a corpus ordering with a yes/no answer, which is a far thinner derivative of either
 * input than a copy of either would be. See docs/DICTIONARIES.md.
 */

export interface HunspellSource {
  readonly kind: 'hunspell'
  /** Directory name under the upstream repo, and the name of the cached dic/aff pair. */
  readonly id: string
  readonly dic: string
  readonly aff: string
  /** The branch of the upstream licence we rely on, not the whole disjunction. */
  readonly licence: string
  readonly attribution: string
}

export interface TitlesSource {
  readonly kind: 'titles'
  /** Wiki prefix: `de` means de.wiktionary.org. */
  readonly wiki: string
  readonly licence: string
  readonly attribution: string
}

/** A plain list of words, one per line. For a lexicon that is already a word list. */
export interface WordListSource {
  readonly kind: 'wordList'
  readonly id: string
  readonly url: string
  readonly licence: string
  readonly attribution: string
}

export type Source = HunspellSource | TitlesSource | WordListSource

export interface LanguageSpec {
  /** Engine language id, and the directory the data is written to. */
  readonly tag: string
  /** Directory name in hermitdave/FrequencyWords. */
  readonly frequency: string
  /**
   * A candidate must clear every group, and clears a group by satisfying any member. So
   * independent sources go in separate groups and get intersected, while variants of one
   * language share a group and get unioned.
   */
  readonly groups: readonly (readonly Source[])[]
  readonly caseRule?: CaseRule
  /** Calibrated by board density; see `pnpm dictionary calibrate`. */
  readonly cuts: TierCuts
  /** Anything a reader of the shipped list deserves to be warned about. */
  readonly caveat?: string
}

const wooorm = (id: string, licence: string, attribution: string): HunspellSource => ({
  kind: 'hunspell',
  id,
  dic: `https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/${id}/index.dic`,
  aff: `https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/${id}/index.aff`,
  licence,
  attribution,
})

const titles = (wiki: string): TitlesSource => ({
  kind: 'titles',
  wiki,
  licence: 'CC-BY-SA-4.0',
  attribution: `${wiki}.wiktionary.org contributors, page titles in namespace 0`,
})

/**
 * The cut for a language whose validator knows its morphology. Calibrated on English by board
 * density, and it holds across the hunspell-validated languages; see docs/DICTIONARIES.md.
 */
const DEFAULT_CUTS: TierCuts = { commonRank: 20_000, fullRank: 50_000 }

/**
 * A deeper cut, for a language where the validator is the bottleneck rather than the cut.
 *
 * Where hunspell is unavailable or thin on affixed forms, validation accepts a quarter to a
 * half of what a full morphological dictionary would, so a 20,000 cut yields five thousand
 * words instead of sixteen thousand. Going deeper here is not the failure mode
 * DICTIONARIES.md warns about: it is not admitting rarer words, it is recovering ordinary
 * ones a thin validator never saw. Each of these was measured with `pnpm dictionary calibrate`.
 */
const deepCuts = (commonRank: number, fullRank: number): TierCuts => ({ commonRank, fullRank })

/**
 * Drops the credit cut, keeping the word floor's.
 *
 * Used wherever the validator is a dictionary of this language and can be trusted about the
 * whole corpus. The full tier only grants credit, so refusing a word the dictionary accepted
 * buys nothing and costs the player: WEAL is rank 85,602 in the English corpus and was being
 * rejected by a cut at 50,000. Not used for the Wiktionary-validated languages, where the
 * validator cannot tell one language from another. See docs/DICTIONARIES.md.
 */
const creditEverything = (cuts: TierCuts): TierCuts => ({ commonRank: cuts.commonRank })

export const LANGUAGES: readonly LanguageSpec[] = [
  {
    tag: 'en',
    frequency: 'en',
    // One group, so any member suffices. Both spellings play, because a word game has no
    // reason to make a player pick between COLOUR and COLOR. And ENABLE is in there because
    // SCOWL at this size does not know SWALE: a spell checker aims to catch typos, whereas a
    // word-game lexicon aims to settle arguments, and the second is what we want.
    groups: [
      [
        wooorm('en', 'MIT', 'SCOWL, Kevin Atkinson and contributors'),
        wooorm('en-GB', 'MIT', 'SCOWL, Kevin Atkinson and contributors'),
        {
          kind: 'wordList',
          id: 'enable1',
          url: 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt',
          licence: 'LicenseRef-public-domain',
          attribution:
            'ENABLE (Enhanced North American Benchmark Lexicon), Alan Beale and M. Cooper, ' +
            'released into the public domain; see the YAWL package LICENSE for the statement',
        },
      ],
    ],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'fr',
    frequency: 'fr',
    groups: [[wooorm('fr', 'MPL-2.0', 'Dicollecte / Grammalecte, Olivier R.')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'es',
    frequency: 'es',
    groups: [[wooorm('es', 'MPL-1.1', 'RLA-ES, Santiago Bosio and contributors')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'it',
    frequency: 'it',
    groups: [[titles('it')]],
    cuts: DEFAULT_CUTS,
    caveat: 'Validated against Wiktionary titles: the hunspell dictionary is GPL-3.0 only.',
  },
  {
    tag: 'de',
    frequency: 'de',
    groups: [[titles('de')]],
    // Every German noun is capitalised, so the filter that drops proper nouns everywhere
    // else would delete the nouns and leave the verbs. Case stops being evidence.
    caseRule: 'ignoreCase',
    cuts: DEFAULT_CUTS,
    caveat:
      'Validated against Wiktionary titles (igerman98 is GPL only), and with case ignored, ' +
      'so some proper nouns are admitted. Both are explained in docs/DICTIONARIES.md.',
  },
  {
    tag: 'nl',
    frequency: 'nl',
    groups: [[wooorm('nl', 'BSD-3-Clause', 'OpenTaal')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'pt',
    frequency: 'pt',
    groups: [[wooorm('pt-PT', 'MPL-1.1', 'Natura project, Universidade do Minho')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'pt-BR',
    frequency: 'pt_br',
    groups: [[wooorm('pt', 'MPL-2.0', 'VERO project, Raimundo Moura and contributors')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'hr',
    frequency: 'hr',
    groups: [[wooorm('hr', 'SISSL', 'Denis Lackovic and contributors')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'ms',
    frequency: 'ms',
    groups: [[titles('ms')]],
    cuts: deepCuts(50_000, 200_000),
    caveat:
      'Validated against Wiktionary titles; no clean-licensed Malay hunspell dictionary ' +
      'exists. The thinnest source in the set: the validator is exhausted by rank 100,000, ' +
      'so a deeper cut recovers nothing and the two tiers nearly coincide.',
  },
  {
    tag: 'id',
    frequency: 'id',
    groups: [
      [
        {
          kind: 'hunspell',
          id: 'id_ID',
          dic: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/id/id_ID.dic',
          aff: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/id/id_ID.aff',
          licence: 'LGPL-3.0',
          attribution: 'Hunspell Indonesian, Kamus Besar Bahasa Indonesia contributors',
        },
      ],
    ],
    cuts: creditEverything(deepCuts(35_000, 100_000)),
  },
  {
    tag: 'ru',
    frequency: 'ru',
    groups: [[wooorm('ru', 'BSD-3-Clause', 'Alexander Lebedev and contributors')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'sv',
    frequency: 'sv',
    groups: [[wooorm('sv', 'LGPL-3.0', 'Den stora svenska ordlistan, Göran Andersson')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'no',
    frequency: 'no',
    groups: [[titles('no')]],
    cuts: deepCuts(60_000, 150_000),
    caveat: 'Validated against Wiktionary titles: the Bokmål hunspell dictionary is GPL-2.0.',
  },
  {
    tag: 'fi',
    frequency: 'fi',
    groups: [[titles('fi')]],
    cuts: deepCuts(50_000, 150_000),
    caveat:
      'Validated against Wiktionary titles, which are mostly lemmas, so an inflected ' +
      'Finnish form is usually refused. The weakest language in the set, and the one most ' +
      'in need of a real morphological validator.',
  },
  {
    tag: 'el',
    frequency: 'el',
    groups: [[wooorm('el', 'MPL-1.1', 'Ελληνικός ορθογράφος, Steve Stavropoulos')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
]

export function specFor(tag: string): LanguageSpec {
  const spec = LANGUAGES.find((language) => language.tag === tag)
  if (spec === undefined) throw new RangeError(`no dictionary sources for ${tag}`)
  return spec
}

/** Frequency lists all come from one place, so the URL is built rather than repeated. */
export function frequencyUrl(spec: LanguageSpec): string {
  const base = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018'
  return `${base}/${spec.frequency}/${spec.frequency}_full.txt`
}

export const FREQUENCY_LICENCE = 'MIT'
export const FREQUENCY_ATTRIBUTION =
  'hermitdave/FrequencyWords, from the OpenSubtitles 2018 corpus via OPUS'
