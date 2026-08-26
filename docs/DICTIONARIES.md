# Dictionaries

How Blinkered gets a word list for each language, and the evidence behind the choices.
Numbers here were measured, not estimated; re-measure rather than trust them after any
source changes.

## The decision

**A frequency list selects the candidates; a dictionary validates them; we ship the
intersection.**

```
frequency list, ranked        candidate words, commonest first
        │ filter              length 3-16, letters in this alphabet only
        │ validate            present in a dictionary, and listed in lower case
        │                     (drops proper nouns and subtitle noise)
        │ intersect           where several dictionaries exist, require agreement
        ▼
  common tier (counted toward W)  +  full tier (accepted for credit)
```

This replaced an earlier plan to expand hunspell dictionaries wholesale. It is better on
every axis that matters:

- **size**: ~31k words rather than 2.4MB of Webster's, or 83M expanded Portuguese forms
- **quality**: every word is one people actually use, and validated as real
- **uniformity**: one pipeline for every language rather than fifteen sets of quirks
- **licence**: the frequency list contributes an ordering, which is a fact about the
  language; the shipped artifact is an intersection and a far thinner derivative of either
  input than a copy of either would be

## Why not expand hunspell dictionaries

Tried first. Three problems, all discovered by measurement.

**Licences block a third of the set.** Per [wooorm/dictionaries](https://github.com/wooorm/dictionaries), which labels each:

| Clean      |                                    | Blocked                    |
| ---------- | ---------------------------------- | -------------------------- |
| English    | MIT AND BSD                        | Italian: GPL-3.0           |
| French     | MPL-2.0                            | German: GPL-2.0 OR GPL-3.0 |
| Dutch      | BSD-3-Clause OR CC-BY-3.0          | Norwegian Bokmål: GPL-2.0  |
| Russian    | BSD-3-Clause                       |                            |
| Spanish    | GPL-3.0 OR LGPL-3.0 OR **MPL-1.1** | Absent entirely:           |
| Portuguese | LGPL-3.0 OR **MPL-2.0**            | Finnish, Malay, Indonesian |
| Greek      | GPL-2.0 OR LGPL-2.1 OR **MPL-1.1** |                            |
| Croatian   | LGPL-2.1 OR SISSL                  |                            |
| Swedish    | LGPL-3.0                           |                            |

Where a tri-licence is involved, PROVENANCE must record **which branch we relied on**, or a
later reader will assume GPL. Swedish and Croatian being LGPL-only is the one spot worth a
second opinion: LGPL's replaceable-library concept does not map cleanly onto a data file,
though it lacks GPL's viral distribution effect. GPL is the hard blocker, because its terms
are what conflict with the App Store.

**Expansion output is wildly uneven.** `unmunch` on each dictionary:

|            | stems   | forms          | ratio  |
| ---------- | ------- | -------------- | ------ |
| English    | 49,569  | 129,493        | 2.6x   |
| French     | 84,278  | 1,471,850      | 17.5x  |
| Spanish    | 57,345  | 1,072,250      | 18.7x  |
| Dutch      | 180,745 | 1,102,729      | 6.1x   |
| Russian    | 146,270 | 1,290,242      | 8.8x   |
| Swedish    | 153,717 | 866,458        | 5.6x   |
| Italian    | 95,438  | 36,639,611     | 383.9x |
| Portuguese | 312,369 | **83,189,912** | 266.3x |
| Croatian   | 53,711  | 53,710         | 1.0x   |
| Greek      | 828,807 | 828,806        | 1.0x   |

83 million Portuguese forms is not merely impractical, it is wrong: productive verb
conjugation crossed with enclitic pronouns generates forms no player would recognise.

**`unmunch` fails silently, twice.** Both of these produce a plausible-looking file:

- it ignores `AF` alias tables. Croatian's `.dic` entries carry `/360`, an index into a
  417-entry alias table; unmunch emitted the stems unchanged. Resolving the aliases first
  (substitute the flag string, strip the `AF` lines) takes Croatian from 53,710 to
  **9,798,329** forms.
- a dictionary with no affix flags passes straight through. Greek has zero flagged entries
  of 828,807, so its `.dic` is already a complete word list.

**A 1.0x expansion ratio is the tell for both.** Any pipeline that expands affixes must
assert on the ratio rather than trust the exit code.

## Sizing the cut

Measured on English: candidate pool from the frequency list, filtered and validated, then
board profiles over 300 sound 12-tile boards.

| candidate pool | words kept | board words p25/median/p75 | has a 6+ word | dead board |
| -------------- | ---------- | -------------------------- | ------------- | ---------- |
| top 10k        | 8,221      | 64 / 98 / 148              | 93%           | 7%         |
| **top 20k**    | **15,317** | **94 / 144 / 208**         | **97%**       | **3%**     |
| top 30k        | 21,474     | 112 / 166 / 254            | 98%           | 2%         |
| top 50k        | 30,959     | 137 / 196 / 307            | 98%           | 2%         |
| full hunspell  | 77,592     | 172 / 261 / 427            | 99%           | 1%         |

Top-20k gives 55% of the word density at a fifth of the size. The extra 62,000 words in the
full list are rare forms a player will never find: they inflate W without adding playable
options, which is the same criticism that sank Webster's.

**Tiers**: full ≈ top 50k validated (~31k words, accepted for credit); common ≈ top 20k
validated (~15k words, counted toward W). So an unusual word still scores, while the board
is guaranteed solvable from vocabulary people actually use.

### The cut must adapt per language, but not by percentage

Full frequency list lengths:

```
fi  2,492,889     hr  1,517,660     nl  1,107,145
en  1,656,996     ru  1,423,050     fr    834,768
el  1,488,237     es  1,202,520     pt    770,227
```

Finnish being longest fits morphology. English being **second** does not: English is
morphologically simple, and its list is long because the OpenSubtitles English corpus is far
larger, giving a longer tail of rare words, typos and names. **List length tracks corpus
size, not inflection**, so "top N%" would hand English the biggest dictionary for the wrong
reason and Portuguese the smallest despite needing more.

Two normalizers that are not confounded:

- **board density** (the rule): cut where the median 12-tile board hits a target word count,
  around 144 for English at top-20k. Optimises the thing we care about and self-calibrates.
- **cumulative token coverage** (the sanity check): take words until they account for ~92% of
  all occurrences. Corpus-size independent; an inflected language needs more types to get
  there.

Record the resulting cut per language in PROVENANCE, so "how big is the Finnish dictionary"
has an answer derived from gameplay rather than from a round number.

## Filters that matter

- **length 3 to 16 tiles.** Nothing longer than the largest board is reachable.
- **alphabet only.** Anything carrying a letter the alphabet lacks is dropped, not mangled.
  Folding happens first, so French accents collapse and Croatian Č survives.
- **lower case only.** The hunspell list contains capitalised proper nouns, and folding
  everything to upper case would make JAMES indistinguishable from a word. Keep only entries
  the dictionary lists in lower case: HISS the sound stays, Hiss the person goes. On English
  this drops 129,493 forms to 77,976.
- **validation yield falls with depth**: 97% of the top 10k survive validation, 93% of the
  top 20k, 88% of 30k, 78% of 50k. Deeper cuts need more filtering, not less.

Spot checks that the English list passes: HISSES present, OWSE absent, JAMES absent, MMM
absent, MRS absent. GRUNTS present and correct, being a real verb form.

## Sources

**Frequency**: [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords),
OpenSubtitles 2018, ~600KB per language, and it covers all fifteen. Both `_50k.txt` and
`_full.txt` exist.

**Open provenance question.** That repo is MIT, but the data derives from OpenSubtitles via
OPUS: user-uploaded subtitles of copyrighted films, distributed for research. The mitigation
is real, since we ship only dictionary-validated words and the frequency list contributes
ordering rather than content, but murky upstream is not the same as clean.
[wordfreq](https://github.com/rspeer/wordfreq) is the alternative to evaluate: MIT code,
CC BY-SA data, aggregated across corpora rather than subtitles alone, roughly 40 languages.
The pipeline treats the frequency source as one pluggable input, so switching later is cheap.

**Validation**: the clean-licence hunspell dictionaries above. For Italian, German,
Norwegian, Finnish, Malay and Indonesian, which have no clean hunspell option, a validator is
still needed but the bar is much lower than being the whole source — Wiktionary (CC BY-SA)
covers all six.

**Regional variants**: of our fifteen, only Portuguese has one. `pt` and `pt_br` both exist;
`en`, `es`, `nl`, `de`, `fr` and `no` do not. So sixteen playable options from fifteen
languages, with 🇵🇹 and 🇧🇷 as separate entries. English having no variant is quietly good
for a word game: one dictionary accepting both COLOUR and COLOR gives players more words
rather than forcing a choice.

## Per-language data layout

Governed by [packages/words/data/README.md](../packages/words/data/README.md). One directory
per language tag, each carrying its own `LICENSE` and a `PROVENANCE.md` naming every source,
the licence branch relied on, the date obtained, the exact commands, and the measured cut.
