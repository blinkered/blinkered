# Languages: what is next, and what each one costs

A survey, written before building any of it, so the decisions are made once and the numbers are
not re-gathered. [README.md](../README.md) has the checklist for adding a language and which
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

## Two things the pipeline cannot do yet

Both live in `tools/dictionary`. Neither touches the engine. Together they are what most of the
blocked rows above are actually blocked on.

1. **A validator that reads en.wiktionary categories.** Today `titles` reads the page titles of a
   language's own Wiktionary. For Swahili, Yoruba, Hausa, Igbo and Naija that wiki is empty or
   absent while en.wiktionary holds thousands of properly tagged lemmas. Category members are a
   different query from page titles and a different `SourceKind`.
2. **A frequency source that is not OpenSubtitles.** The common tier is a size band intersected
   with corpus frequency, and the tutorial board is ranked by it. A Wikipedia dump gives a word
   count for every language with a wiki, which is every candidate here. STATUS.md already lists
   the OpenSubtitles provenance as the weak link, so this is a debt worth paying regardless.

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

- **Swahili** clears Malay twice over and is not really in this group at all. It is a normal
  addition waiting on the en.wiktionary validator.
- **Yoruba**, at 4,873 lemmas, is about half of Malay's full tier. Plausible at the weak end.
- **Hausa**, at 1,987, is a quarter of Malay. The validator is the bottleneck, not the corpus:
  ha.wikipedia has 109,427 articles.
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
way is a different kind of object from the other sixteen and should say so in its PROVENANCE.

Worth doing anyway, for the reason above, as long as the file admits what it is.

## The order

1. **Afrikaans, Turkish, Tagalog.** The same work as the existing sixteen: Latin, left to right,
   both sources already available. Turkish carries one specific trap, the dotless ı and dotted İ,
   which matters because the lists are uppercased and `toUpperCase` is locale-dependent there.
2. **The two pipeline capabilities.** Which brings Swahili, Latin and Yoruba into range, and
   improves Urdu, Hebrew and Telugu.
3. **RTL, then Hebrew and Arabic.**
4. **Korean**, then Japanese if the JMdict readings work out.
5. **Hausa, Igbo, Naija**, measured with `pnpm dictionary floor` and accepted or not on what it
   says.
6. **Abugidas**, when somebody wants to answer the tile question.

## Still open

- Whether `igboapi.com` is usable as a source, by licence and by size.
- What Egyptian Arabic would be, given no corpus and no wiki of its own, and whether it is a
  separate game from Arabic at all.
- Whether Vietnamese tones ride on the tile or on the word. Tiles carrying them explodes the
  inventory; folding them away merges words that differ only by tone.
- Urdu needs Nastaliq to look right, which is a font decision on top of RTL.
