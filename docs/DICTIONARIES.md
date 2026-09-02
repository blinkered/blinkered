# Dictionaries

How Blinkered gets a word list for each language, and the evidence behind the choices.
Numbers here were measured, not estimated; re-measure rather than trust them after any source
changes. The pipeline is `tools/dictionary`, the license audit is
`tools/dictionary/src/manifest.ts`, and the pure logic is `packages/words/src/pipeline.ts`.

## The decision

**A frequency list selects the candidates; a dictionary validates them; we ship the
intersection.**

```
frequency list, ranked  ∪  curated lexicon    candidates; the corpus supplies the order
        │ fold                onto the alphabet's tiles: épée and epee become one EPEE
        │ filter              3 to 16 tiles, letters in this alphabet only
        │ validate            ask the raw spelling of every dictionary configured
        │ intersect           every group must agree; within a group, any member will do
        ▼
  common tier: top 20,000 by corpus rank    →  counted toward the board's word floor
  full tier:   everything else that is a word →  accepted for credit
```

**The two tiers answer different questions, and only one of them is about frequency.** Whether
a board is solvable is a question about what people know, so the common tier is cut by corpus
rank. Whether a submission is a word is not a question about films, so the credit tier is not
cut by corpus frequency at all.

Twenty-six playable languages. The credit tier is much the larger of the two, and its size is
driven by how productive the language's morphology is rather than by any choice of ours.

|       | common | credit  | yield     | coverage | board words | reach 6 | gzipped |
| ----- | ------ | ------- | --------- | -------- | ----------- | ------- | ------- |
| en    | 16,575 | 174,456 | 83% / 16% | 95%      | 167         | 98%     | 459 KB  |
| fr    | 16,593 | 144,105 | 83% / 25% | 95%      | 153         | 99%     | 356 KB  |
| es    | 16,993 | 201,655 | 85% / 22% | 94%      | 120         | 98%     | 468 KB  |
| it    | 16,507 | 37,512  | 83% / 75% | 92%      | 183         | 100%    | 104 KB  |
| de    | 18,389 | 42,747  | 92% / 85% | 96%      | 140         | 98%     | 133 KB  |
| nl    | 16,334 | 322,146 | 82% / 40% | 95%      | 142         | 97%     | 1064 KB |
| pt    | 16,107 | 134,775 | 81% / 27% | 94%      | 140         | 97%     | 320 KB  |
| pt-BR | 16,627 | 200,241 | 83% / 25% | 95%      | 143         | 97%     | 495 KB  |
| hr    | 17,613 | 341,040 | 88% / 28% | 93%      | 99          | 95%     | 793 KB  |
| ms    | 7,372  | 9,173   | 15% / 9%  | 74%      | 164         | 93%     | 25 KB   |
| id    | 17,300 | 41,132  | 49% / 15% | 91%      | 149         | 95%     | 122 KB  |
| ru    | 18,094 | 423,100 | 90% / 42% | 94%      | 69          | 91%     | 1226 KB |
| sv    | 16,350 | 371,287 | 82% / 52% | 95%      | 122         | 94%     | 1202 KB |
| no    | 9,994  | 13,891  | 17% / 9%  | 79%      | 164         | 93%     | 42 KB   |
| fi    | 17,511 | 35,648  | 35% / 24% | 71%      | 136         | 96%     | 111 KB  |
| el    | 17,421 | 257,014 | 87% / 33% | 95%      | 97          | 96%     | 743 KB  |
| af    | 12,354 | 12,354  | 72% / 72% | 94%      | 107         | 97%     | 37 KB   |
| tr    | 17,867 | 638,282 | 89% / 38% | 93%      | 79          | 91%     | 1608 KB |
| tl    | 3,540  | 23,306  | 35% / 69% | 70%      | 68          | 95%     | 69 KB   |
| sw    | 9,215  | 29,038  | 46% / 14% | 74%      | 87          | 98%     | 88 KB   |
| la    | 10,765 | 32,765  | 7% / 8%   | 27%      | 91          | 97%     | 104 KB  |
| he    | 12,992 | 15,924  | 9% / 4%   | 57%      | 344         | 93%     | 45 KB   |
| ar    | 18,686 | 656,979 | 93% / 53% | 95%      | 268         | 96%     | 1715 KB |
| ko    | 19,257 | 38,467  | 4% / 6%   | 34%      | 95          | 89%     | 155 KB  |
| ja    | 17,000 | 191,188 | 100%/100% | 100%     | 149         | 50%     | 767 KB  |
| arz   | 11,570 | 154,576 | 58% / 27% | 70%      | 195         | 92%     | 429 KB  |

Board words is the median a 12-tile board admits from the **common** tier at minimum length 3,
over 300 sound draws, and it is the number the cut is calibrated against because it is the one a
player feels. Coverage is the share of playable occurrences in the corpus the shipped list
accounts for; the denominator excludes one- and two-letter words, which are half of any corpus
and unplayable here, and counting them would put every language near two thirds and say nothing.
Yield is the share of considered candidates a validator accepted, at each of the two cuts; it
collapses in the right-hand column wherever the credit tier is uncapped, because the denominator
becomes the whole corpus tail and most of a corpus tail is typos, names and foreign words.

**The download is the cost, and it was accepted deliberately.** Russian and Swedish are 1.2MB
gzipped, against 25KB for Malay, because Russian inflection and Swedish compounding are
productive and the corpus attests an enormous number of real forms. Parsing is not the problem:
4.2M characters of Russian parse in 51ms, since the expensive anagram index covers only the
18,094-word common tier. So it is purely bytes over the wire, once per language per session.

Nick's call, and the right one: a game that refuses a word you know is broken in a way a large
download is not. If mobile makes this hurt later, the lever is a size-motivated cut on the
languages with no lexicon, and it should be labelled as exactly that rather than dressed up as a
quality decision.

Spot checks the English list passes: SWALE, SWALES, WEAL, WEALS, HISSES, GRUNTS, ZYZZYVA, QUINE
and SUSURRUS all present; COLOR **and** COLOR both present; JAMES, MRS, MMM, LONDON, MONDAY and
ENGLAND all absent. CROMULENT is absent too, which is correct, if a little disappointing.

## Corpus frequency is the wrong instrument for credit

Learned the hard way, twice, and worth stating plainly because both mistakes look reasonable.

A rank cut on the credit tier rejects real words for having nothing to do with wordhood.
**WEAL** sits at rank 85,602 in the English corpus and was rejected by a cut at 50,000. It is
an ordinary English word.

The obvious repair — a frequency _floor_ instead of a rank cut, on the grounds that it separates
"rare word" from "junk compound" — is the same mistake wearing a better disguise. It does
separate those two things, and the numbers are genuinely attractive: at 0.05 occurrences per
million playable tokens, Dutch drops from 317,858 words to 88,535 while losing 0.27% of corpus
coverage, because what it removes is one-off ad-hoc compounds. But:

```
weal    57 occurrences   0.109 per million
swales  29 occurrences   0.055 per million
swale   13 occurrences   0.025 per million   <- below any useful floor
```

**SWALE** would have been rejected again. Thirteen occurrences in a corpus of film subtitles is
a fact about films, not about English. Any threshold low enough to keep SWALE is too low to
prune anything, and any threshold high enough to prune is high enough to reject a word a player
will reasonably submit. The instrument is wrong, not the setting.

So the credit tier is bounded by the **lexicon**, never by the corpus. Where a curated lexicon
exists, every word in it is a candidate whether the corpus has ever seen it or not: a lexicon
word arrives with a count of zero, ranks below every cut the common tier applies, earns credit
like any other word, and cannot be one of the words a board is required to be solvable from.
For English that lexicon is **ENABLE**, 172,823 words, public domain, and the base of most free
word games. SWALE, WEAL, ZYZZYVA, QUINE and SUSURRUS are all in; JAMES, MRS, LONDON and MONDAY
are all out, because ENABLE was curated to exclude proper nouns.

The cost is size: English goes from 275KB to 1.7MB raw, 100KB to 470KB gzipped. Worth it. A
word game that refuses a word you know is broken in a way that a slightly larger download is
not.

The remaining fifteen languages have no equivalent public-domain lexicon, so their credit tier
is the corpus intersected with the validator, uncapped. That is why the inflected ones are large
(Russian 435k forms, Dutch 322k) and why the yield column collapses for them: the denominator is
now the whole corpus, and most of a corpus tail is typos, names and foreign words.

## Ask the dictionary; do not expand it

The first plan was to expand each hunspell dictionary with `unmunch` and ship the result. That
was wrong, and the reason is worth keeping: **nothing needs a full form list to answer a
yes-or-no question about thirty thousand words.** `hunspell -l` prints the words it rejects
from a list you hand it, so one subprocess call per language replaces the whole expansion step.

That change removed three problems at once, all of which had been measured:

**Expansion output was wildly uneven.** `unmunch` on each dictionary:

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

83 million Portuguese forms is not merely impractical, it is wrong: productive verb conjugation
crossed with enclitic pronouns generates forms no player would recognize.

**`unmunch` fails silently, twice.** Both of these produce a plausible-looking file:

- it ignores `AF` alias tables. Croatian's `.dic` entries carry `/360`, an index into a
  417-entry alias table; unmunch emitted the stems unchanged. Resolving the aliases first takes
  Croatian from 53,710 to **9,798,329** forms.
- a dictionary with no affix flags passes straight through. Greek has zero flagged entries of
  828,807.

**A 1.0x expansion ratio is the tell for both.** Any pipeline that expands affixes must assert
on the ratio rather than trust the exit code. Ours does not expand, and instead asserts that
hunspell accepted neither everything nor nothing, which catches an aff file that failed to load.

**Asking also does the proper-noun filtering for free.** Candidates arrive lower-cased from the
frequency list, and hunspell is case-aware: it accepts `hiss` and rejects `james`, because the
dictionary lists the latter only as `James`. The spell check and the name filter are one pass.

## Licenses: eleven clean, three GPL-only, five gaps

Per [wooorm/dictionaries](https://github.com/wooorm/dictionaries), verified by reading each
license file rather than trusting the summary:

| Clean, and the branch relied on  |              | GPL-only, so unusable      |
| -------------------------------- | ------------ | -------------------------- |
| English (`en` ∪ `en-GB`)         | MIT          | Italian: GPL-3.0           |
| French                           | MPL-2.0      | German: GPL-2.0 or GPL-3.0 |
| Spanish                          | MPL-1.1      | Norwegian Bokmål: GPL-2.0  |
| Portuguese (`pt-PT`)             | MPL-1.1      |                            |
| Brazilian Portuguese (`pt`)      | MPL-2.0      | Absent entirely:           |
| Dutch                            | BSD-3-Clause | Finnish, Malay, Tagalog    |
| Russian                          | BSD-3-Clause |                            |
| Croatian                         | SISSL        |                            |
| Swedish                          | LGPL-3.0     |                            |
| Greek                            | MPL-1.1      |                            |
| Indonesian (LibreOffice `id_ID`) | LGPL-3.0     |                            |
| Turkish                          | MIT          |                            |
| Afrikaans (LibreOffice `af_ZA`)  | LGPL-2.1+    | Hebrew: Hspell is AGPL-3.0 |
| Arabic (LibreOffice `ar`)        | MPL-1.1      | Korean: GPL-3.0            |

Checked and rejected: `de_DE_frami` and LibreOffice `it_IT` are GPL too, so there is no
non-GPL morphological dictionary for German or Italian anywhere obvious. Nor for **Korean**,
where hunspell-dict-ko says it outright — "the built files (ko.aff and ko.dic) are licensed
under the GPL version 3" — and LibreOffice's `ko_KR` is GPL-3.0 as well; nor for **Hebrew**,
whose only one is Hspell, under the AGPL, which is further out of reach than the GPL is. GPL is the hard
blocker, because a GPL word list bundled into a mobile binary argues the binary is a GPL work,
and the FSF's position is that the GPL conflicts with the App Store's terms.

**English unions three sources rather than intersecting them.** `en` alone rejects COLOR;
`en-GB` alone rejects COLOR; both reject SWALE. All three sit in one validator group and any one
suffices, which is why the pipeline has two levels: groups are intersected, members of a group
are unioned. The third member is ENABLE, and the reason it is needed is that a spell checker and
a word-game lexicon are built for different jobs — one aims to catch typos, the other to settle
arguments, and the second is what a word game needs.

### The languages without a clean hunspell use Wiktionary

`https://dumps.wikimedia.org/<wiki>wiktionary/latest/<wiki>wiktionary-latest-all-titles-in-ns0.gz`
is small (150KB to 5MB gzipped), CC BY-SA, one headword per line with case preserved, and
exists for every language here. Used for Italian, German, Norwegian, Finnish and Malay.

Weaker than hunspell on two counts, both visible in the yield column. Titles are mostly lemmas,
so an inflected form is refused; and a Wiktionary documents foreign words too, so a little
cross-language noise gets through, bounded by the frequency list being that language's own
corpus.

**German needed a rule of its own.** Every German noun is capitalized, so the filter that drops
proper nouns everywhere else would have deleted the nouns and left the verbs. German therefore
ignores case on both sides, which is why its yield is the highest in the table (92%) and why it
is the one language that admits some proper nouns. Recorded in its PROVENANCE.

### Tagalog needed the English Wiktionary rather than its own

Two things go wrong for a language whose own wiki is small. tl.wiktionary has 17,092 pages of
which 1,175 survive as Tagalog words, and a deeper cut recovers nothing at all: the validator is
exhausted long before the cut is. Meanwhile en.wiktionary holds **33,079 Tagalog lemmas**, filed
under `Category:Tagalog lemmas`, every one of them tagged with the language it belongs to.

So there is a third `SourceKind`, `category`, which reads the members of a category through the
MediaWiki API rather than a titles dump. There is no dump for this: the `all-titles` dump is per
wiki, and what is wanted is per language on somebody else's wiki. Thirty thousand lemmas is
sixty-seven paged requests, once, and then it is a file in the cache like everything else.

**A category is a lexicon as well as a validator, and that is the real difference.** A titles
list is every language at once, so it cannot say which words are Tagalog and cannot stand in for
its lexicon; a category says exactly that. So the category's members join the candidate pool the
way ENABLE does for English, with a count of zero, ranking below every cut the common tier
applies. They earn credit and are never words a board is required to be solvable from — which is
right, because the thing keeping Tagalog's common tier small is not the validator at all. **The
Tagalog subtitle corpus is 10,665 words long**, a tenth of Malay's. That is the ceiling, and only
a different corpus moves it.

## Sizing the cut

Calibrated on English by board density, then checked against every other language. The cut is
a **candidate rank**, applied before validation.

| candidate pool | words kept | board words p25/median/p75 | has a 6+ word | dead board |
| -------------- | ---------- | -------------------------- | ------------- | ---------- |
| top 10k        | 8,221      | 64 / 98 / 148              | 93%           | 7%         |
| **top 20k**    | **15,317** | **94 / 144 / 208**         | **97%**       | **3%**     |
| top 30k        | 21,474     | 112 / 166 / 254            | 98%           | 2%         |
| top 50k        | 30,959     | 137 / 196 / 307            | 98%           | 2%         |
| full hunspell  | 77,592     | 172 / 261 / 427            | 99%           | 1%         |

Top-20k gives 55% of the word density at a fifth of the size. The extra 62,000 words in the full
list are rare forms a player will never find: they inflate the word floor without adding playable
options. So **common = top 20,000 validated**, and that holds for every language whose validator
knows its morphology.

Note what this cut is and is not. It bounds the tier that decides _board solvability_, where
admitting words nobody knows makes a board dishonest. It has nothing to do with the credit tier,
which is bounded by the lexicon instead, for the reasons above.

### Four languages needed a deeper cut, for a different reason

Where the validator is thin, the cut is not what limits the list: validation is. Malay at
rank 20,000 yielded 4,984 words against English's 16,115, from the same cut.

|                  | 20k          | 50k          | 100k         | 200k         |
| ---------------- | ------------ | ------------ | ------------ | ------------ |
| ms words / board | 4,984 / 115  | 7,372 / 172  | 9,021 / 208  | 9,173 / 211  |
| no words / board | 5,830 / 96   | 9,227 / 137  | 12,185 / 163 | 14,985 / 186 |
| fi words / board | 9,225 / 78   | 17,511 / 129 | 27,712 / 186 | 42,211 / 266 |
| id words / board | 12,205 / 118 | 21,032 / 170 | 29,235 / 215 | 36,515 / 251 |

Going deeper here is **not** the failure mode above. It is not admitting rarer words; it is
recovering ordinary ones a thin validator never saw. So `ms` 50k, `no` 60k, `fi` 50k, `id` 35k,
which brings all four to a normal board density.

The five Wiktionary-validated languages keep a credit cut as well, which the others do not: a
Wiktionary in one language documents words of every other, and the deep tail of a subtitle corpus
is full of them, so an uncapped credit tier there would quietly accept English words as Italian.

Malay stays the weakest at 15% yield: its validator is exhausted by rank 100,000, so no cut
recovers more, and its two tiers nearly coincide. A Malay player will be refused real words.

### Why not "top N%"

Full frequency list lengths:

```
fi  2,492,889     hr  1,517,660     nl  1,107,145
en  1,656,996     ru  1,423,050     fr    834,768
el  1,488,237     es  1,202,520     pt    770,227
```

Finnish being longest fits its morphology. English being **second** does not: English is
morphologically simple, and its list is long because the OpenSubtitles English corpus is far
larger, giving a longer tail of rare words, typos and names. **List length tracks corpus size,
not inflection**, so a percentage would hand English the biggest dictionary for the wrong
reason. Board density is the rule; cumulative token coverage is the sanity check.

## The word floor has to be recalibrated with the list

`defaultWMin` decides how many words a board must admit before the generator accepts it, and it
derives that from a curve measured on one word list. The old curve had been measured against a
78,000-word placeholder and put the median 12-tile board at 464 words. The shipped English
common tier puts it at 155.

Left alone, the floor would have sat at 325 against boards that reach 155: **every draw
rejected, the whole attempt budget burned, and the best of four hundred boards played while
reporting that it failed.** Nothing crashes, which is exactly what makes it worth a tool.
`pnpm dictionary floor` regenerates all three literals.

Board richness also varies far too much for one curve. At the same size and cut, an Italian
board admits 183 words and a Russian one 69, because a 21-letter alphabet combines differently
from a 32-letter one. So the floor is scaled per language:

```
he 2.06   ar 1.60   arz 1.17   it 1.10   en 1.00   ms 0.98   no 0.98   fr 0.92
id 0.89   ja 0.89   pt-BR 0.86   nl 0.85   de 0.84   pt 0.84   fi 0.81   sv 0.73
es 0.72   af 0.64   hr 0.59   el 0.58   ko 0.57   la 0.54   sw 0.52   tr 0.47
ru 0.41   tl 0.41
```

The two abjads sit above English and nothing else does. A script that writes its vowels as
marks and strips them puts far more of the dictionary within reach of twelve tiles: Hebrew
builds words on three-consonant roots, so a Hebrew board admits twice what an English one does.

With these in place every language accepts a board in a mean of 1.3 to 1.8 draws.

Draw weights come first, because density depends on them: `pnpm dictionary weights`, paste,
then `pnpm dictionary floor`, paste. Getting that order backwards calibrates against a guess.
Doing it revealed that **Malay and Indonesian need separate weight tables** — eleven letters
differ, with Indonesian's Dutch borrowings against Malaysian's English ones showing up as more
M, N, K and U and less A and R. They had been sharing one table.

## Filters that matter

- **length 3 to 16 tiles**, counted in tiles, so a Croatian DŽ is one. Nothing longer than the
  largest board is reachable, and nothing shorter is in the list, which is why the minimum word
  length setting is floored at 3 in the interface.
- **alphabet only.** Anything carrying a letter the alphabet lacks is dropped, not mangled.
  Folding happens first, so French accents collapse and Croatian Č survives.
- **validated on the raw spelling, played on the folded one.** ÉPÉE is checked as `épée` and
  played as EPEE. Several raw spellings can fold onto one playable word, and any one of them
  validating is enough, so a corpus that spells `acción` correctly rescues ACCION.
- **upper-cased by the language's own rules, not the default ones.** Only Turkish needs this and
  it needs it badly: `toUpperCase` sends both the dotless ı and the dotted i to a plain I, which
  merges ILIK (lukewarm) with İLİK (marrow) and, in the folded list, with every other pair the
  dot distinguishes. `folder({ locale: 'tr' })` keeps them apart. The board search runs through
  the same fold, so a Turkish tutorial board cannot be found by looking up the wrong word.
- **lower case only**, except German. The frequency list is lower-cased throughout, so the case
  in the _dictionary_ is the only case evidence available, and it is worth a lot.
- **validation yield falls with depth**, which is what makes a deeper cut a real trade rather
  than free words: 97% of the English top 10k survive, 93% of the top 20k, 88% of 30k, 78% of
  50k.

## Sources

**Frequency**, for nineteen of the twenty-six:
[hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords), OpenSubtitles 2018.
Of our set only Portuguese has a regional variant (`pt` and `pt_br`), so twenty-six playable
options come from twenty languages.

**Frequency, for Japanese**: JMdict's own `nf` priority bands, CC BY-SA 4.0, which rank about a
tenth of its readings in blocks of five hundred. Japanese is the one language whose ordering and
membership are the same file, and it has no choice: the game is played in kana and a corpus is
written in kanji, so ranking readings by corpus frequency would need a morphological analyser
before it needed anything else. The OpenSubtitles list would not help even then — Japanese has no
spaces, so a tokeniser has already had a go at it, and what comes back is 分か, 言, 知, 聞.

Japanese also has the one lossy fold in the set. Voicing and kana size are not distinctions the
board makes, following MegaHouse's もじぴったん (濁音や半濁音を付けた形で読むことができ) and
crossword convention (小さい文字は大きい文字と同一視される), so ビール and ヒール are one
sequence of tiles and eighty-four kana become forty-seven. Without it a twelve-tile board reached
a six-tile word 17% of the time; with it, and with a measured vowel share, 50%.

**Frequency, for the two languages OpenSubtitles does not cover**: a word count over one Wikipedia's articles,
CC BY-SA. Swahili and Latin have no OpenSubtitles list at 2016 or 2018 — nor do Yoruba, Hausa,
Igbo or Nigerian Pidgin, which is what this exists for — and a dead language never will. The
dump is the ordinary `pages-articles` one and the stripper is not a wikitext parser, which it
does not need to be: the corpus decides ordering and nothing else, so imperfect stripping costs
a few template parameter names a place in the ranking, and every one of them still has to get
past a dictionary of the language. What the stripper does have to get right is the two things
that would skew the ordering: markup that repeats on every page, and pages that are not
articles. Section headings are the markup that repeats most, since every article on a wiki ends
with the same two or three, so they are dropped whole: on arz.wikipedia, which is 1.6 million
bot-written stubs, that had put مصادر and لينكات برانيه — "sources" and "external links" — at
ranks four to six in the entire language. Tokens seen once in a whole encyclopaedia are dropped
too, being typos and surnames far more often than words.

**Open provenance question, half answered.** hermitdave's repo is MIT, but the data derives from
OpenSubtitles via OPUS: user-uploaded subtitles of copyrighted films, distributed for research.
The mitigation is real, since we ship only dictionary-validated words and the frequency list
contributes ordering rather than content, but murky upstream is not the same as clean. Wikipedia
is the clean alternative and is now wired in, which settles the question for two languages and
proves the seam works; the remaining nineteen could move to it, at the cost of rebuilding and
re-calibrating every one. [wordfreq](https://github.com/rspeer/wordfreq) remains worth
evaluating: MIT code, CC BY-SA data, aggregated across corpora rather than subtitles alone.

## What we distribute it under

Conservatively, the most restrictive of a language's inputs, recorded per language in its
`LICENSE` with the verbatim text in `data/licenses/`. The argument that a filtered list
inherits nothing from its filter is a good one; making it is not the same as being right about
it, and assuming otherwise costs nothing.

Eleven languages come out permissive: MIT, BSD-3-Clause, MPL-1.1, MPL-2.0, SISSL, LGPL-3.0.
**Five come out CC BY-SA 4.0**: Italian, German, Norwegian, Finnish and Malay, the ones
validated against Wiktionary.

**That needs a decision before a store build, and only then.** Share-alike is satisfied for the
web build by attribution, which we do. The question is whether a store binary's DRM around a
BY-SA data file is the same objection the FSF raises about the GPL. It is less settled than the
GPL case and the same shape. The four options, in the order I would try them: find a
permissively licensed validator for those five; get the frequency source onto `wordfreq` and
argue the list is not a derivative at all; ship those five as a download rather than a bundle;
or drop them from the mobile build. Nothing else in the repo is blocked by this, and nothing is
GPL.

## Per-language data layout

Governed by [packages/words/data/README.md](../packages/words/data/README.md). One directory per
language tag, each carrying its own `LICENSE` and a `PROVENANCE.md` naming every source, the
license branch relied on, the exact command, and the measurements above.
