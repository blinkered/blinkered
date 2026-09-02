import type { CaseRule, TierCuts } from '@blinkered/words'

/**
 * Where every language's words come from, and under what terms.
 *
 * This file is the license audit. Each source names the SPDX branch we rely on, because a
 * tri-licensed hunspell dictionary read carelessly looks like GPL, and GPL data in a mobile
 * binary is the one outcome that would stop the game shipping. Nothing here is GPL.
 *
 * Three kinds of validator, for one reason: a third of the hunspell dictionaries are GPL-only.
 *
 * - `hunspell`, where a clean-licensed dictionary exists. Best case by a distance: it knows
 *   the language's morphology, so an inflected form validates without anyone enumerating it.
 * - `titles`, the page titles of that language's own Wiktionary. Used where hunspell is
 *   GPL-only (Italian, German, Norwegian) or absent (Finnish, Malay). Weaker on two counts:
 *   titles are mostly lemmas, so inflected forms are refused, and a Wiktionary documents
 *   foreign words too, so a little cross-language noise gets through. Both are bounded by
 *   the frequency list, which is that language's own corpus.
 * - `category`, the members of `Category:<Language> lemmas` on the **English** Wiktionary.
 *   For a language whose own wiki is small or absent while en.wiktionary documents it
 *   thoroughly: Tagalog has 1,132 usable titles on tl.wiktionary and 33,079 lemmas here.
 *   Better than `titles` on the count that matters, because a category says which language a
 *   word belongs to, so none of the cross-language noise gets in.
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
  /** The branch of the upstream license we rely on, not the whole disjunction. */
  readonly license: string
  readonly attribution: string
}

export interface TitlesSource {
  readonly kind: 'titles'
  /** Wiki prefix: `de` means de.wiktionary.org. */
  readonly wiki: string
  readonly license: string
  readonly attribution: string
}

/** A plain list of words, one per line. For a lexicon that is already a word list. */
export interface WordListSource {
  readonly kind: 'wordList'
  readonly id: string
  readonly url: string
  readonly license: string
  readonly attribution: string
}

/**
 * Members of one wiki's categories, which is how a language is found on somebody else's wiki.
 *
 * Only the direct members are read. On en.wiktionary the lemma category holds every lemma
 * page itself and keeps the parts of speech as subcategories alongside them, so recursing
 * would fetch the same pages again under another name.
 */
export interface CategorySource {
  readonly kind: 'category'
  /** Wiki prefix: `en` means en.wiktionary.org. */
  readonly wiki: string
  readonly categories: readonly string[]
  readonly license: string
  readonly attribution: string
}

export type Source = HunspellSource | TitlesSource | WordListSource | CategorySource

/**
 * Where a language's word *ordering* comes from, which is all a corpus decides.
 *
 * `openSubtitles` is hermitdave's list for that language, and `id` is its directory there.
 * `wikipedia` counts the articles of one wiki, and is what the languages with no OpenSubtitles
 * list at all have instead. See tools/dictionary/src/corpus.ts.
 */
export type Corpus =
  | { readonly kind: 'openSubtitles'; readonly id: string }
  | { readonly kind: 'wikipedia'; readonly wiki: string }

const subtitles = (id: string): Corpus => ({ kind: 'openSubtitles', id })
const wikipedia = (wiki: string): Corpus => ({ kind: 'wikipedia', wiki })

export interface LanguageSpec {
  /** Engine language id, and the directory the data is written to. */
  readonly tag: string
  readonly corpus: Corpus
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

const wooorm = (id: string, license: string, attribution: string): HunspellSource => ({
  kind: 'hunspell',
  id,
  dic: `https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/${id}/index.dic`,
  aff: `https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/${id}/index.aff`,
  license,
  attribution,
})

const titles = (wiki: string): TitlesSource => ({
  kind: 'titles',
  wiki,
  license: 'CC-BY-SA-4.0',
  attribution: `${wiki}.wiktionary.org contributors, page titles in namespace 0`,
})

/**
 * The English Wiktionary's own record of a language, which for several languages is the fullest
 * one anywhere. `language` is the name en.wiktionary files it under.
 *
 * Lemmas and inflected forms by default, because an inflected form is a word a player will
 * type. `lemmasOnly` is for a category too large to page through politely: Latin's inflected
 * forms are 800,379 pages, which is 1,600 requests, and the API throttles hard enough that
 * fetching them takes most of a day. See the `la` entry for what that costs.
 */
const enCategories = (language: string, lemmasOnly = false): CategorySource => ({
  kind: 'category',
  wiki: 'en',
  categories: lemmasOnly
    ? [`Category:${language} lemmas`]
    : [`Category:${language} lemmas`, `Category:${language} non-lemma forms`],
  license: 'CC-BY-SA-4.0',
  attribution: `en.wiktionary.org contributors, members of Category:${language} lemmas`,
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
    corpus: subtitles('en'),
    // One group, so any member suffices. Both spellings play, because a word game has no
    // reason to make a player pick between COLOR and COLOR. And ENABLE is in there because
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
          license: 'LicenseRef-public-domain',
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
    corpus: subtitles('fr'),
    groups: [[wooorm('fr', 'MPL-2.0', 'Dicollecte / Grammalecte, Olivier R.')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'es',
    corpus: subtitles('es'),
    groups: [[wooorm('es', 'MPL-1.1', 'RLA-ES, Santiago Bosio and contributors')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'it',
    corpus: subtitles('it'),
    groups: [[titles('it')]],
    cuts: DEFAULT_CUTS,
    caveat: 'Validated against Wiktionary titles: the hunspell dictionary is GPL-3.0 only.',
  },
  {
    tag: 'de',
    corpus: subtitles('de'),
    groups: [[titles('de')]],
    // Every German noun is capitalized, so the filter that drops proper nouns everywhere
    // else would delete the nouns and leave the verbs. Case stops being evidence.
    caseRule: 'ignoreCase',
    cuts: DEFAULT_CUTS,
    caveat:
      'Validated against Wiktionary titles (igerman98 is GPL only), and with case ignored, ' +
      'so some proper nouns are admitted. Both are explained in docs/DICTIONARIES.md.',
  },
  {
    tag: 'nl',
    corpus: subtitles('nl'),
    groups: [[wooorm('nl', 'BSD-3-Clause', 'OpenTaal')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'pt',
    corpus: subtitles('pt'),
    groups: [[wooorm('pt-PT', 'MPL-1.1', 'Natura project, Universidade do Minho')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'pt-BR',
    corpus: subtitles('pt_br'),
    groups: [[wooorm('pt', 'MPL-2.0', 'VERO project, Raimundo Moura and contributors')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'hr',
    corpus: subtitles('hr'),
    groups: [[wooorm('hr', 'SISSL', 'Denis Lackovic and contributors')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'ms',
    corpus: subtitles('ms'),
    groups: [[titles('ms')]],
    cuts: deepCuts(50_000, 200_000),
    caveat:
      'Validated against Wiktionary titles; no clean-licensed Malay hunspell dictionary ' +
      'exists. The thinnest source in the set: the validator is exhausted by rank 100,000, ' +
      'so a deeper cut recovers nothing and the two tiers nearly coincide.',
  },
  {
    tag: 'id',
    corpus: subtitles('id'),
    groups: [
      [
        {
          kind: 'hunspell',
          id: 'id_ID',
          dic: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/id/id_ID.dic',
          aff: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/id/id_ID.aff',
          license: 'LGPL-3.0',
          attribution: 'Hunspell Indonesian, Kamus Besar Bahasa Indonesia contributors',
        },
      ],
    ],
    cuts: creditEverything(deepCuts(35_000, 100_000)),
  },
  {
    tag: 'ru',
    corpus: subtitles('ru'),
    groups: [[wooorm('ru', 'BSD-3-Clause', 'Alexander Lebedev and contributors')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'sv',
    corpus: subtitles('sv'),
    groups: [[wooorm('sv', 'LGPL-3.0', 'Den stora svenska ordlistan, Göran Andersson')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'no',
    corpus: subtitles('no'),
    groups: [[titles('no')]],
    cuts: deepCuts(60_000, 150_000),
    caveat: 'Validated against Wiktionary titles: the Bokmål hunspell dictionary is GPL-2.0.',
  },
  {
    tag: 'fi',
    corpus: subtitles('fi'),
    groups: [[titles('fi')]],
    cuts: deepCuts(50_000, 150_000),
    caveat:
      'Validated against Wiktionary titles, which are mostly lemmas, so an inflected ' +
      'Finnish form is usually refused. The weakest language in the set, and the one most ' +
      'in need of a real morphological validator.',
  },
  {
    tag: 'el',
    corpus: subtitles('el'),
    groups: [[wooorm('el', 'MPL-1.1', 'Ελληνικός ορθογράφος, Steve Stavropoulos')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'af',
    corpus: subtitles('af'),
    groups: [
      [
        {
          kind: 'hunspell',
          id: 'af_ZA',
          dic: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/af_ZA/af_ZA.dic',
          aff: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/af_ZA/af_ZA.aff',
          license: 'LGPL-2.1-or-later',
          attribution:
            'MySpell Afrikaans, Translate.org.za; word lists by Bernard A Nieuwoudt and ' +
            'Danie Viljoen, affix file by Dwayne Bailey, all relicensed under the LGPL',
        },
      ],
    ],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'tr',
    corpus: subtitles('tr'),
    groups: [[wooorm('tr', 'MIT', 'Turkish spelling dictionary, Harun Reşit Zafer')]],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'sw',
    // No OpenSubtitles list at 2016 or 2018; sw.wikipedia has 125,850 articles.
    corpus: wikipedia('sw'),
    groups: [
      [
        {
          kind: 'hunspell',
          id: 'sw_TZ',
          dic: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/sw_TZ/sw_TZ.dic',
          aff: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/sw_TZ/sw_TZ.aff',
          license: 'LGPL-2.1-or-later',
          attribution:
            'Jambo Swahili Spellchecker, Alberto Escudero-Pascual and contributors; word ' +
            'lists from Egerton University, the TUKI English-Swahili Dictionary, the Kamusi ' +
            'Project and Crúbadán',
        },
      ],
    ],
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'la',
    // A dead language has no subtitle corpus and never will. la.wikipedia has 140,000 articles,
    // a large share of them bot-written stubs about places, which is why the validator matters
    // more here than the ordering does.
    corpus: wikipedia('la'),
    // Lemmas only. The inflected forms are there — 800,379 of them — and the API throttles
    // hard enough that paging them would take most of a day and be rude while doing it. So
    // Latin plays like Finnish: the dictionary knows the lemma and refuses the inflection.
    // For a language this inflected that is a real limitation and it is the honest one to
    // have, since the alternative is admitting the corpus unchecked.
    groups: [[enCategories('Latin', true)]],
    // A far deeper cut than anything else, and for the reason `deepCuts` exists rather than
    // in spite of it. The corpus's top ranks are inflected forms the validator refuses, so
    // the lemmas that survive sit a long way down: at rank 20,000 the common tier is 3,479
    // words and a board admits 43, which is unplayable. At 150,000 it is 10,765 and 81, which
    // is where Swahili and Turkish sit. That is not admitting rarer words; it is recovering
    // ordinary ones a lemma-only validator never saw.
    cuts: creditEverything({ commonRank: 150_000 }),
    caveat:
      'Ordered by a Wikipedia written by enthusiasts rather than by a corpus of Latin as it ' +
      'was used, so "commonest" here means commonest on that wiki. Validated against ' +
      'en.wiktionary lemmas only, so an inflected form is refused: AMARE plays and AMAVERUNT ' +
      'does not. The weakest thing about this list, and the same weakness Finnish has.',
  },
  {
    tag: 'he',
    corpus: subtitles('he'),
    // Its own Wiktionary and the English one, unioned. Hspell, the only morphological Hebrew
    // dictionary there is, is AGPL-3.0, which is further out of reach than the GPL ones.
    groups: [[titles('he'), enCategories('Hebrew')]],
    // Hebrew has no case at all, so the lower-case rule that catches proper nouns everywhere
    // else would reject every word instead. German ignores case because case stopped being
    // evidence; Hebrew ignores it because there is none.
    caseRule: 'ignoreCase',
    // Deep for the usual reason and then some: the validator accepts 16% of what it is asked,
    // so the cut is nowhere near the binding constraint. The shallower cut left only 85% of
    // draws holding a six-letter word, the worst in the set, which costs the generator attempts
    // and the player the words that actually pay.
    cuts: deepCuts(150_000, 400_000),
    caveat:
      'Validated against Wiktionary rather than a morphological dictionary, because Hspell is ' +
      'AGPL-3.0. Hebrew inflects heavily and Wiktionary titles are mostly lemmas, so an ' +
      'inflected form is often refused. Case is ignored, there being none, so proper nouns are ' +
      'admitted where a Wiktionary lists them.',
  },
  {
    tag: 'ar',
    corpus: subtitles('ar'),
    groups: [
      [
        {
          kind: 'hunspell',
          id: 'ar',
          dic: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/ar/ar.dic',
          aff: 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/ar/ar.aff',
          // Tri-licensed GPL-2.0 / LGPL-2.1 / MPL-1.1, and MPL-1.1 is the branch relied on,
          // exactly as for Spanish, Portuguese and Greek. Read carelessly this looks like GPL.
          license: 'MPL-1.1',
          attribution: 'Ayaspell / Arabic hunspell dictionary, Taha Zerrouki and contributors',
        },
      ],
    ],
    // No case, same as Hebrew.
    caseRule: 'ignoreCase',
    cuts: creditEverything(DEFAULT_CUTS),
  },
  {
    tag: 'ko',
    corpus: subtitles('ko'),
    // hunspell-dict-ko says it plainly: "the built files (ko.aff and ko.dic) are licensed under
    // the GPL version 3". LibreOffice's ko_KR is GPL-3.0 too. So Korean goes the way Hebrew
    // does, against its own Wiktionary unioned with en.wiktionary's Korean lemmas.
    groups: [[titles('ko'), enCategories('Korean')]],
    // Hangul has no case, so the lower-case rule would reject the language rather than its
    // proper nouns. Same reason as Hebrew and Arabic.
    caseRule: 'ignoreCase',
    // The deepest cut in the set, and Latin's reason: the corpus head is conjugated forms the
    // validator refuses, so the dictionary forms it does accept sit a long way down. At 60,000
    // a board admitted 39 words and two thirds of draws held a word worth playing; at 500,000
    // it is 62 and four fifths.
    cuts: deepCuts(500_000, 1_200_000),
    caveat:
      'Validated against Wiktionary rather than a morphological dictionary, the only Korean ' +
      'hunspell being GPL-3.0. Korean inflects heavily and Wiktionary titles are mostly ' +
      'dictionary forms, so a conjugated verb is usually refused.',
  },
  {
    tag: 'tl',
    corpus: subtitles('tl'),
    // Its own wiki and the English one, unioned, because they are the same project and
    // neither is a check on the other. tl.wiktionary contributes the words en.wiktionary has
    // not got to; en.wiktionary contributes almost everything else.
    groups: [[titles('tl'), enCategories('Tagalog')]],
    // The subtitle corpus is 10,665 words long, which is a tenth of Malay's and the real
    // ceiling on the common tier. The credit tier is not bounded by it, because the category
    // is a lexicon as well as a validator: every Tagalog lemma en.wiktionary knows is a
    // candidate, and the ones the corpus never saw rank below every cut and earn credit
    // without ever being a word a board is required to be solvable from.
    cuts: creditEverything({ commonRank: 10_000 }),
    caveat:
      'No Tagalog hunspell dictionary exists at any licence, so there is no morphology here ' +
      'and an affixed form validates only if somebody wrote it down. The common tier is ' +
      'small because the corpus is: 10,665 words, the shortest of the set.',
  },
]

export function specFor(tag: string): LanguageSpec {
  const spec = LANGUAGES.find((language) => language.tag === tag)
  if (spec === undefined) throw new RangeError(`no dictionary sources for ${tag}`)
  return spec
}
