# Languages: what is next, and what each one costs

A survey, written before building any of it, so the decisions are made once and the numbers are
not re-gathered.

**Done since it was written: Afrikaans, Turkish, Tagalog, Swahili and Latin ship, and both
missing pipeline capabilities are built.** What that turned up is at [What building the first
five changed](#what-building-the-first-five-changed), which is the part to read before doing the
next one; the survey below is left as it was measured. [README.md](../README.md) has the checklist for adding a language and which
parts of it are enforced rather than remembered; this is about which languages to add and what
stands in the way of each.

Everything here was measured rather than assumed. Where a number is quoted it came from asking
the source.

## The bar

**Malay ships at 7,372 common and 9,173 full**, and STATUS.md calls it "the weak one", at 15%
validation yield, "Good enough to ship." Norwegian is next at 9,994 / 13,891. Everything else is
16,000 to 18,000 common. So Malay is the floor the project has already accepted, and it is the
number to compare a candidate against.

The floor is not a matter of taste. A board has to admit `wMin` words and at least one word of
`PROFITABLE_LENGTH`, or the generator burns its attempt budget and plays the best of a bad set.
`pnpm dictionary floor` measures exactly this. **A small language is settled by building the list
and measuring, not by arguing about it.**

## What each candidate has

`lemmas` is `Category:<Language> lemmas` on **en.wiktionary**, which is where the coverage is for
languages whose own Wiktionary is small or absent. `frequency` is hermitdave's OpenSubtitles
lists, which is what the pipeline uses today.

| language        | tag   | lemmas (en.wikt) | own wiktionary | frequency | wikipedia | script       |
| --------------- | ----- | ---------------- | -------------- | --------- | --------- | ------------ |
| Turkish         | `tr`  |                  | 1,358,006      | 2018      |           | Latin        |
| Afrikaans       | `af`  | 6,286 + 2,963    | 29,774         | 2016      |           | Latin        |
| Tagalog         | `tl`  |                  | 17,092         | 2016      |           | Latin        |
| Swahili         | `sw`  | 13,100 + 7,331   | 101,957        | none      | 125,850   | Latin        |
| Latin           | `la`  | 45,817           | 37,934         | none      | yes       | Latin        |
| Vietnamese      | `vi`  |                  | 346,328        | 2018      |           | Latin + tone |
| Yoruba          | `yo`  | 4,873            | 0              | none      | 40,222    | Latin + tone |
| Hausa           | `ha`  | 1,987            | none           | none      | 109,427   | Latin        |
| Igbo            | `ig`  | 272              | none           | none      | 48,306    | Latin + tone |
| Nigerian Pidgin | `pcm` | 188 + 13 subcats | none           | none      | 1,655     | Latin        |
| Hebrew          | `he`  |                  | 25,175         | 2018      |           | Hebrew, RTL  |
| Arabic          | `ar`  |                  | 79,865         | 2018      |           | Arabic, RTL  |
| Urdu            | `ur`  |                  | 26,100         | none      |           | Arabic, RTL  |
| Egyptian Arabic | `arz` |                  | none           | none      |           | Arabic, RTL  |
| Korean          | `ko`  |                  | 302,346        | 2018      |           | Hangul       |
| Japanese        | `ja`  | 126,966          | 500,210        | 2016      |           | kana + kanji |
| Hindi           | `hi`  |                  | 184,875        | 2016      |           | Devanagari   |
| Bengali         | `bn`  |                  | 165,797        | 2018      |           | Bengali      |
| Telugu          | `te`  |                  | 107,743        | 2016      |           | Telugu       |
| Marathi         | `mr`  |                  | 2,707          | none      |           | Devanagari   |

## Two things the pipeline could not do

It can do both now. Kept for the reasoning, since the next language will want to know which
kind of gap it is looking at.

Both live in `tools/dictionary`. Neither touches the engine. Together they are what most of the
blocked rows above are actually blocked on.

1. ~~**A validator that reads en.wiktionary categories.**~~ **Built.** `SourceKind` `category`,
   read through the MediaWiki API because no dump is per-language-on-another-wiki. It also
   enumerates, which `titles` cannot, so it doubles as a lexicon.
2. ~~**A frequency source that is not OpenSubtitles.**~~ **Built.** A word count over one
   Wikipedia's `pages-articles` dump, streamed through `bzip2` because Node's zlib will not.
   Its first output was the Naija ranking — `for, di, wey, dey, of, e, an, na, dem` — which is
   the language, in order, from a 2.2MB file.

## Decisions already taken

- **RTL is one piece of work, done once.** Nothing in the app or the CSS knows `direction: rtl`;
  reveal order, tile positions and the word line all assume one direction. Doing it unlocks
  Hebrew and Arabic together. Hebrew is the easier of the two to render, having no cursive
  joining, so a tile's glyph looks the same as it does inside a word; its final forms
  (ך ם ן ף ץ) are a `fold` decision, which is what `fold` exists for.
- **Japanese is a hiragana game.** Tiles are kana and words are readings rather than
  orthography. `byCodePoint` already works, because が is one precomposed code point in ordinary
  text, so the engine needs no change at all. The word list has to carry readings: JMdict does,
  under CC BY-SA 4.0, which is a licence this project already ships five languages under and
  which carries the same unresolved store-build question. Do not fold small kana: きって and きて
  are different words. It is shiritori-shaped, which is the point.
- **Korean is a jamo game.** Hangul is alphabetic underneath: NFD decomposes 한 into ᄒ ᅡ ᄂ, so
  tiles are the jamo and `fold` recomposes. Of everything in the non-Latin group this is the one
  expected to work best.
- **Abugidas are deferred.** Hindi, Bengali, Marathi and Telugu each need a decision about what a
  tile **is** before they need a word list: splitting by code point puts a vowel sign that cannot
  stand alone on a tile of its own. Agreed as a hard problem, not a build step.
- **Diacritics are not decoration in the West African languages.** Yoruba carries tone marks and
  subdot letters (ẹ ọ ṣ), Igbo has ị ọ ụ ṅ, Hausa has hooked ɓ ɗ ƙ ƴ. Unlike French accents these
  cannot fold away: _owó_ (money) and _owo_ (hand) are different words. Undiacriticised writing is
  common online, so a Wikipedia-derived corpus will mix marked and stripped forms and folding
  would silently merge distinct words. This is PLAN.md section 5's question with the opposite
  answer, and it has to be settled per language before the list is built.

## The West African languages, and why they are wanted

Not for reach. Tight Line has people in Nigeria, and a colleague finding their own language in
the flag menu is the entire return on this. That is a good reason and it changes what "good
enough" means: **a small dictionary is acceptable here in a way it would not be for Turkish.**

It does not change the mechanical floor. A board still has to admit enough words to be worth
playing, and that is measured rather than hoped.

- **Swahili** clears Malay twice over and is not really in this group at all, and it does not
  even need the category validator: LibreOffice's `sw_TZ` is a hunspell dictionary under the
  LGPL. It is a normal addition waiting on a corpus.
- **Yoruba**, at 4,873 lemmas, is about half of Malay's full tier. Plausible at the weak end.
- **Hausa**, at 1,987, is a quarter of Malay. ha.wikipedia has 109,427 articles, so the corpus
  is there for the taking once something can count words in a dump.
- **Igbo**, at 272, is not a lexicon. Worth checking `igboapi.com`, an open Igbo dictionary
  project, before calling it.
- **Naija** (Nigerian Pidgin, `pcm`) has 188 lemmas and a 1,655-article Wikipedia.

### Naija needs a rule broken, knowingly

There is no lexicon, and DICTIONARIES.md's whole model is that a lexicon bounds the credit tier.
The only way to build a Naija list is to accept tokens by corpus frequency alone, which is
precisely what "Do not decide what is a word by counting how often films say it" was written
against.

That trap was about **rejecting** real words: a frequency cut threw out WEAL and SWALE. Accepting
by frequency fails the other way, letting in typos and English intrusions, and Naija's
orthography overlaps English heavily, so the intrusions would be invisible. A word list built this
way is a different kind of object from every other list here and should say so in its
PROVENANCE.

Worth doing anyway, for the reason above, as long as the file admits what it is.

## The order

1. ~~**Afrikaans, Turkish, Tagalog.**~~ Done. Turkish's trap was real and is now a `locale`
   option on `folder`; Tagalog's was not the one expected. See below.
2. ~~**An en.wiktionary category validator.**~~ Done, and it turned out to be a lexicon as well
   as a validator, which is a bigger win than expected.
3. ~~**A frequency source that is not OpenSubtitles.**~~ Done, and with it ~~**Swahili**~~ and
   ~~**Latin**~~.
4. **Yoruba, Hausa, Igbo, Naija.** Nothing in the pipeline is missing for these now. What is
   missing is a decision per language about diacritics, which is the one thing that cannot be
   measured — see below.
5. **RTL, then Hebrew and Arabic.**
6. **Korean**, then Japanese if the JMdict readings work out.
7. **Abugidas**, when somebody wants to answer the tile question.

## What building the first five changed

Three things, and two of them are corrections to what is written above.

**Tagalog was blocked on its corpus, not its dictionary.** The survey called it a validator
problem, and half of that was right: tl.wiktionary yields 1,175 words and a cut four times
deeper recovers not one more, because the validator runs out long before the cut does. Reading
`Category:Tagalog lemmas` on en.wiktionary instead — 33,079 lemmas, each tagged with the language
it belongs to — took the common tier to 3,540 and the credit tier to 23,306. But the common tier
stopped there, and the reason is that **the Tagalog subtitle corpus is 10,665 words long**, a
tenth of Malay's. No validator moves that. It is the clearest argument yet for the Wikipedia
frequency source, and it applies to every language in the bottom half of the table.

**A category is a lexicon, and a titles dump is not.** This is the difference that makes the new
source worth more than a like-for-like replacement. A titles list is every language at once, so
it can only ever answer yes or no; a category names one language, so its members can join the
candidate pool the way ENABLE does for English — count zero, ranking below every cut, earning
credit without ever being a word a board has to be solvable from. That is where two thirds of
Tagalog's credit tier comes from.

**Swahili was not blocked on the validator at all.** LibreOffice ships `sw_TZ`, a hunspell
dictionary under the LGPL, which is a licence this project already relies on for Indonesian,
Swedish and now Afrikaans. So Swahili wanted morphology rather than category members, and the
only thing it was short of was a corpus. It ships at 9,215 common and 29,038 credit, board
density 87, which puts it above Turkish and well clear of Malay. It was written off in the first
pass at this survey.

**Latin is the awkward one, and the awkwardness is worth stating.** Its lexicon is the largest
of any candidate here, 45,818 lemmas on en.wiktionary. Its inflected forms are also there —
800,379 of them — and that is 1,600 paged API requests, which the API throttles hard enough to
take most of a day. Fetching them would be both slow and rude, so Latin validates against lemmas
only, and plays the way Finnish does: AMARE is a word and AMAVERUNT is not. Corpus coverage is
27%, the lowest in the set, and that number _is_ the inflections being refused. It needed a
common cut of 150,000 — seven times anything else — for the same reason: the corpus's top ranks
are forms the validator rejects, so the lemmas sit a long way down. At rank 20,000 a board
admitted 43 words, which is unplayable; at 150,000 it admits 91.

**The West African four are now unblocked, and what is left is a judgement rather than a
measurement.** Every piece of machinery they need exists. What does not exist is an answer to
the diacritic question, which is per language and cannot be derived: Yoruba tone marks and
subdots, Igbo ị ọ ụ ṅ, Hausa hooked ɓ ɗ ƙ ƴ. Undiacriticised writing is common online, so a
Wikipedia-derived corpus will mix marked and stripped forms, and folding would silently merge
distinct words while not folding will split one word into two rankings. That has to be settled
before a list is built, not after.

Three smaller notes worth keeping:

- **Tagalog's NG is two tiles, and not for the reason the alphabet suggests.** It is a letter of
  the abakada and it is genuinely unambiguous in Tagalog spelling, so the Croatian machinery
  would have handled it. The problem is the keyboard: nothing turns two keystrokes into one
  tile, so a multi-character tile can only be taken with the mouse. Croatian DŽ is rare enough
  for that to be a curiosity. NG is in a large share of Tagalog words, and a board whose
  commonest letter cannot be typed is a worse game than one whose alphabet is a letter short.
- **Turkish broke two things that only Turkish would have, and both were found by playing it
  rather than by testing it.** The keyboard upper-cased a key before handing it on, so on a board
  holding both i tiles a typed i took the dotless one; and the wordmark, being uppercased by CSS
  under `lang="tr"`, called the game BLİNKERED. Neither is in the language plan and both are the
  argument for opening the browser on a new language rather than trusting a green suite.
- **The English floor curve had drifted.** Re-running `pnpm dictionary floor` moved
  `MEDIAN_WORDS` up about 8% and every language's `DENSITY_SCALE` down by the same, so the
  product is unchanged everywhere except English, which gets a slightly stricter floor. The
  scales in `difficulty.ts` had been measured against an older English list than the one shipped;
  the manifest's own density numbers were right all along.

## Still open

- Whether `igboapi.com` is usable as a source, by licence and by size.
- What Egyptian Arabic would be, given no corpus and no wiki of its own, and whether it is a
  separate game from Arabic at all.
- Whether Vietnamese tones ride on the tile or on the word. Tiles carrying them explodes the
  inventory; folding them away merges words that differ only by tone.
- Urdu needs Nastaliq to look right, which is a font decision on top of RTL.
- Whether Latin's 800,379 inflected forms are worth having, and how to get them without spending
  a day being throttled. A `categorylinks` dump would do it in one download, at the cost of
  parsing a SQL dump of every category on en.wiktionary.
- Whether the other nineteen languages should move to the Wikipedia corpus now that it exists.
  It is the clean provenance and OpenSubtitles is not, but it means rebuilding and recalibrating
  every one, and the cuts are calibrated against the corpus they were measured on.
