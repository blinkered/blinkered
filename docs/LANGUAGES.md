# Languages: what is next, and what each one costs

A survey, written before building any of it, so the decisions are made once and the numbers are
not re-gathered.

**Done since it was written: Afrikaans, Turkish, Tagalog, Swahili, Latin, Hebrew, Arabic, Korean,
Japanese and Egyptian Arabic ship; both missing pipeline capabilities are built; and the app
reads right to left.** What that turned up is at [What building the first
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

- ~~**RTL is one piece of work, done once.**~~ It was, and it was smaller than expected. See
  [What right to left actually cost](#what-right-to-left-actually-cost).
- **RTL is one piece of work, done once.** Nothing in the app or the CSS knows `direction: rtl`;
  reveal order, tile positions and the word line all assume one direction. Doing it unlocks
  Hebrew and Arabic together. Hebrew is the easier of the two to render, having no cursive
  joining, so a tile's glyph looks the same as it does inside a word; its final forms
  (ך ם ן ף ץ) are a `fold` decision, which is what `fold` exists for.
- **Japanese is a hiragana game.** Tiles are kana, words are readings rather than orthography,
  and JMdict has the readings under CC BY-SA 4.0. Two other things this note said were wrong and
  cost a day between them: "the engine needs no change at all", and "do not fold small kana:
  きって and きて are different words". Both are answered in
  [Japanese, and the answer that was in the room the whole time](#japanese-and-the-answer-that-was-in-the-room-the-whole-time).
- ~~**Korean is a jamo game.**~~ It is, and it was right that this would be the easiest of the
  non-Latin group. What the note did not anticipate is that Unicode gives a compound final like
  ㄵ or ㅄ its own code point, which makes tiling them tempting and wrong: eleven extra tiles
  reaching 0.7% of the vocabulary, three of them reaching none of it. Dropping them took board
  density from 62 to 95 and cost no words at all, because they became two tiles each rather than
  being thrown away. The tile set is now exactly the forty keys of a Korean keyboard.
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
5. ~~**RTL, then Hebrew and Arabic.**~~ Done.
6. ~~**Korean**, then Japanese.~~ Both done, and Japanese only after the first answer was
   wrong. See below.
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

## What right to left actually cost

Less than the survey feared, and the surprises were not where it looked.

**The stylesheet was almost already logical.** Sixteen physical offsets in two and a half
thousand lines, of which most were `text-align: center`. Eight became `inset-inline-*`,
`margin-inline-start` and `text-align: end`, and one — a select's background arrow, which CSS
cannot express logically — got a two-line `[dir='rtl']` override. The whole page mirrors from
`document.documentElement.dir`.

**Direction is a fact about the script, so it lives on the `Alphabet`**, required rather than
defaulted, which is what made the compiler point at all twenty-one existing languages and three
test fixtures. The page takes its direction from the interface language and the board, the word
line and the found rail take theirs from the game's, because in nerd mode those differ.

**CSS grid did the board for free.** `direction: rtl` decides which corner auto-placement starts
from, so tile one is top-left in English and top-right in Hebrew with nothing else said.

Three things that were not free:

- **The wordmark spelled DEREKNILB.** It is nine tiles in a flex row, and a flex row under `rtl`
  deals from the other end. It is a name rather than a word, so it is pinned `dir="ltr"` and
  `lang="en"` — the second because `text-transform: uppercase` follows the element's language,
  which is the same trap Turkish sprang.
- **`letter-spacing` pulls Arabic apart.** The word line tracks its letters at 0.22em, which is
  right for Latin and wrong for a script that joins: the word stops looking like a word. Turned
  off for `dir="rtl"`.
- **Hebrew needed a way to spell a finished word differently from how it is tiled.** Five letters
  take a different shape at the end of a word and a tile cannot be two shapes, so the tiles carry
  the ordinary form, as Hebrew Scrabble does. Without putting the shape back, every word in the
  rail was a letter short of correct: שלומ rather than שלום. `Alphabet.display` is that, it is
  optional, and Hebrew is the only language that has one.

And one thing that was feared and measured away. **Splitting an Arabic word into one span per
letter does not break the joining**, because CSS Text shapes across inline boundaries: مدرسة
rendered as one text node and as five spans comes out the same width to the pixel. The found
rail marks the letters a card gave you, and it can go on doing it per character.

## What Korean needed

**A module of its own**, `packages/engine/src/hangul.ts`, and one rule.

Hangul looks syllabic and is not: 한 is ㅎ + ㅏ + ㄴ, and NFD says so, so Korean is an alphabet
game like every other language here. The work is all in choosing which code point stands for a
letter and putting the letters back together afterwards.

**The tiles are compatibility jamo**, the ones on a keyboard. Unicode has three code points for
ㄱ — initial, final, and the letter itself — and a player seeing two of them on a board sees one
letter twice. Folding all three onto the letter is what lets a board holding ㄱ spell a word that
ends in one.

**The compound finals are two tiles each**, which was the one real decision and the one that was
initially got wrong. Tiling them is easier and it costs eleven of fifty-one tiles to reach 139
words out of 19,242, three of the eleven appearing in no word at all, and it makes the alphabet
recite as ㄱ … ㄿ. As two tiles they cost nothing: the words stay, the keyboard row reads ㄱ … ㅣ
without anybody deciding it should, and the board admits 95 words rather than 62.

**One rule does the composing.** A consonant closes the syllable before it unless a vowel follows
and claims it; where two consonants could close it together, they do if what follows still starts
a syllable. That is the whole difference between 국어 and 구거, between 없다 and 업소, and between
읽다 and 일가.

**And the word line composes as you build it**, rather than only when the word is done. `display`
existed for Hebrew's final forms, where "only at the end" was the right reading. Korean wants it
on every keystroke — ㅇ, 아, 안 — because nobody reads a string of jamo, and applying it always
turns out to be right for Hebrew too.

What Korean did not get is a morphological validator: hunspell-dict-ko says outright that its
built files are GPL-3.0, and LibreOffice's is too. So it validates against Wiktionary, refuses
most conjugated forms, and reaches 34% corpus coverage — which is why it needed the second
deepest cut in the set, for Latin's reason.

## Japanese, and the answer that was in the room the whole time

This section replaces one that said Japanese could not be made to work without changing the
rules. That was wrong, and the way it was wrong is the useful part: **every number in it was
correct and the tile set it measured was not the one a Japanese word game uses.**

The first attempt tiled the kana faithfully. Eighty-four of them, because がっこう has a voiced
か and a small つ and those are different sounds, and because [the note above](#decisions-already-taken)
said in as many words: do not fold small kana, きって and きて are different words. On that
inventory a twelve-tile board admitted 62 words and **17% of boards held a six-tile word**,
against 89% to 100% everywhere else. All true, and the conclusion drawn from it — that
`PROFITABLE_LENGTH = 6` cannot be cleared by a script whose tiles are syllables — did not
survive asking how the problem had already been solved.

**It has been solved, and the same way twice.** MegaHouse's もじぴったん card deck is forty-six
kana and says so on the box: 濁音や半濁音を付けた形で読むことができ、「つ・い・ゆ・よ」などは
小文字として使うことも出来る. The は card is played as ば, and ちよこ is read ちょこ. Japanese
crossword convention is identical — 濁音や半濁音は清音と区別されず、小さい文字は大きい文字と
同一視される — and for the same reason: a puzzle whose alphabet has eighty-four letters is not a
harder puzzle, it is a worse one.

So voicing and kana size are not distinctions the board makes. The dictionary still holds both
words; ビール and ヒール are simply one sequence of tiles, exactly as は and ば are one card.

And the worry that stopped the first attempt was misplaced anyway. **Folding the size of a kana
does not merge きって with きて**, because it does not remove the mora: one is three tiles and
the other is two.

Two changes, and what each was worth:

|                             | tiles | median words | holds a six-tile word |
| --------------------------- | ----- | ------------ | --------------------- |
| faithful kana               | 84    | 62           | 17%                   |
| the もじぴったん fold       | 47    | 127          | 42%                   |
| …and a measured vowel share | 47    | 149          | 50%                   |

The second change is the other thing the first attempt got wrong. `VOWEL_SHARE` is a flat 0.35
in the engine, and it exists so a draw cannot come out unspeakable — which is a problem no kana
script has, every tile being a syllable already. Japanese runs a 17% vowel share, so the default
was spending a third of every board on あ, え and お, the three rarest tiles it has.
`Alphabet.vowelShare` is that number, optional, and Japanese is the only language that sets one:
Greek at 49% and Arabic at 29% both play well on the default and changing it for them would
change every board they have ever dealt.

**Measured against the real generator, Japanese accepts 100% of boards in a mean of 2.7 draws.**
The shipped range is 1.4 to 1.8, so it is the least efficient in the set and it never falls back
to playing the best of a bad lot. No rules change, no bigger board, no new economy.

Two things that stayed true from the first attempt, and are worth keeping:

- **JMdict is both halves.** Ordering and membership come from one file, which no other language
  does. There is no alternative: the game is played in kana and a corpus is written in kanji, and
  the OpenSubtitles list is pre-tokenised into stems — 分か, 言, 知, 聞 — rather than words.
  JMdict's `nf` priority bands rank about a tenth of its readings, in blocks of five hundred, and
  that is the common tier.
- **The fold is lossy, so Japanese has no `display`.** Hebrew and Korean put their spelling back;
  Japanese cannot, because かつこう could be がっこう or かつこう. Neither can もじぴったん, whose
  tiles are plain kana that players read voiced. What it needs instead is a sentence saying so,
  and `htBoardBody` carries one in Japanese and in no other locale.

The board search learned something too. Half the common tier folds to itself, so it now prefers
a board whose three words are spelled the way the language writes them; for every other language
the corpus is lower case, nothing folds to itself, and the preference finds nothing to prefer.
Without it the tour opened on きよう → きよくちよう. With it, いたい corrects to たいへいよう and
the card turns the Pacific into the Atlantic.

## Egyptian Arabic, and the order the picker was in

**What it is.** The survey's open question was whether Egyptian Arabic is a separate game from
Arabic at all. It is, and the separation is exactly the one Malay and Indonesian have: same
letters, same folding, same direction, different vocabulary and different frequencies. Eleven
letters differ in the draw weights — more ا, ل and ه, less ق, ك and ع — which is Egyptian
writing rather than a newspaper's.

**Where it comes from.** There is no arz.wiktionary and no OpenSubtitles list, so the corpus is
arz.wikipedia, which is 1.6 million articles. Validation is the standard Arabic hunspell unioned
with en.wiktionary's 1,181 Egyptian lemmas, and the union is the point rather than a compromise:
Egyptian shares most of its vocabulary with the standard language, and the words that are _only_
Egyptian — مش, ازاي, كده — are the 1,181. The standard dictionary alone would refuse precisely
those; the Egyptian list alone would refuse almost everything else. It ships at 11,570 common,
195 board words and 92% reaching six, third densest in the set.

**What the corpus taught.** arz.wikipedia is famously bot-written, and it showed: مصادر and
لينكات برانيه, the "sources" and "external links" headings, ranked fourth to sixth _in the whole
language_, because they appear on every one of 1.6 million stubs. Section headings are dropped
whole now, which was always the intent — the stripper's own comment says its job is to catch
"markup that repeats on every page" — and it improves Swahili and Latin as well.

The astronomy is still there and is not a bug: 668,000 stubs about stars put السماوى and المجره
higher than they deserve. It cost nothing measurable, because draw weights count each word once
however often it appears, and the tour's board search was still handed كان → السكان → المكان.

**And it made the picker's ordering indefensible**, which was already true and had gone
unnoticed. Both pickers sorted the endonyms with a hardcoded English collator. Collating across
scripts does not interleave them, it ranks them, so Ελληνικά, Русский, עברית, العربية, 日本語 and
한국어 all sorted after every Latin name, in the order their Unicode blocks happen to fall — a
tail of six that looked like the order they were added in.

They sort by `Intl.DisplayNames` now: the reader's own name for each language, in the language
the interface is in, compared with the reader's own collation. An English reader gets Japanese
between Italian and Korean; a Japanese reader gets a list ordered by 語. The label stays the
endonym, because a Greek speaker looking for Greek is looking for Ελληνικά, and the flag is what
makes the row scannable either way.

One thing that needed saying out loud: **ICU does not name every language.** A browser knows no
name for `arz` in any locale, nor for `pcm`, so both would fall back to their endonym and sink to
the bottom of a Latin list, which is the thing the sort exists to prevent. `Locale.sortsWith`
names the language to file such a one under, and Egyptian Arabic files under Arabic, where
somebody looking for it would look.

## The batch of twenty-five, and what it cost

Fifty-one languages ship. The twenty-five added at once were Polish, Czech, Slovak, Slovene,
Danish, Catalan, Estonian, Lithuanian, Latvian, Macedonian, Serbian, Ukrainian, Bulgarian,
Armenian, Georgian, Basque, Galician, Icelandic, Welsh, Irish, Hungarian, Romanian, Persian,
Naija and Vietnamese.

**The survey that produced this file had a hole in it, and it was the shape of the file.** It
enumerated the languages that were _blocked_ — by script, by licence, by a missing corpus — and
so it never enumerated the ones that were not. Nothing about Polish or Danish or Hungarian was
hard, which is exactly why none of them appeared. There are about forty more in the same
position.

### Five decisions that could not be derived

- **Vietnamese carries its tone on the tile.** Eighty-nine of them, a number arrived at here
  from the corpus and then found to be exactly Vietboard's, which is the only Vietnamese tile
  game there is. Folding tone away buys forty more words a board and charges 14% of the
  vocabulary; HOA, HOÀ, HOÁ, HOẠ, HOẢ, HÒA, HÓA, HỌA and HỎA are nine words that become one.
- **The space folds and is not a tile.** 82% of Vietnamese words have one. Vietboard puts a
  space tile in the bag at ten points, which a hundred-tile bag and a persistent board can
  afford and a twelve-tile board cannot: spending one on whitespace drops the median from 64
  words to 48. Folding costs nothing and is unambiguous — 36,353 words fold to 36,341 distinct
  keys, and of the nine collisions only KẾTOÁN is real (KẾ TOÁN, accounting; KẾT OÁN, to bear a
  grudge).
- **No new digraph is a tile.** Welsh counts CH, DD, FF, NG, LL, PH, RH and TH as letters, and
  Hungarian counts nine of its own. All of them are two tiles, because `keyToEvent` matches a
  single code point and a multi-character tile can only be taken with the mouse. This is the
  Tagalog decision, and Welsh is where it costs most: LL and DD are among the commonest letters
  in the language.
- **Serbian is Cyrillic.** The Latin spelling is the same words letter for letter, so it would
  be a second language rather than a second spelling.
- **Three flags are drawn.** Unicode has emoji flags for England, Scotland and Wales and no
  other subdivision, so Welsh is fine and Catalan, Basque and Galician are not. Each is a
  handful of rectangles; drawing them keeps the repository free of the CC BY-SA notice that
  carrying somebody's SVG would add. See `packages/i18n/src/flags.ts`.

### Four bugs, three of them in code that had already shipped

- **Russian Й was a tile no word could use.** It is a letter of the alphabet and it was in
  `weights`, but in NFD it is И plus a combining breve, so the default fold ate it. The board
  dealt it at one draw in a hundred and not one word of 423,101 could spell it; МОЙ was stored
  as МОИ and merged with it. Nothing caught it because every test that could have was written
  against the same fold, so the guard now reads the shipped lists — the only place `weights` and
  `fold` meet. It is `packages/words/test/deadTiles.test.ts`, and it caught Estonian's Š and Ž
  on the way past.
- **hunspell fails an affix file by carrying on.** It prints `Failure loading aff file`,
  validates against the bare stems and exits zero, so Armenian — which inflects hard — shipped
  one build at 52% coverage with no morphology at all. That message is now fatal. Armenian
  validates against hy.wiktionary instead, because the Armenian affix file genuinely does not
  load: `SFX VD` declares 171 rules and carries 172, and correcting that is not the end of it.
- **A Wiktionary's titles are not one language.** `titles` accepts whatever that wiki
  documents, which includes English. Vietnamese was the worst case — Vietnamese words are one or
  two syllables, so every long entry that got through was English, 10,051 of 14,564 — and Czech
  had the same hole. Both moved to en.wiktionary categories, which tag the language rather than
  the wiki, and both now answer to none of thirteen English probes. **This is not confined to
  the two that were fixed:** Finnish, German and Malay have shipped against `titles` for a year
  and answer to seven, six and seven of the same thirteen. Left alone deliberately — they are
  shipped languages with shipped scores, and changing them is a decision rather than a fix.
- **Georgian upper-cases into a different script.** Unicode 11 gave Mkhedruli an upper case for
  headings, so `toUpperCase` deals ᲥᲐᲠᲗᲣᲚᲘ rather than ქართული. Georgian has its own fold and
  does not upper-case at all. This is Turkish's trap in another alphabet, found before shipping
  rather than after.

### What the numbers say

Derived weights are most of the value and are easy to skip: with uniform placeholders Polish
admitted 20 words a board, Czech 16, Estonian 14. Derived, they admit 53, 70 and 121. Two
languages needed a second validator unioned into the same group, because a lemma-only
Wiktionary refuses most of what an inflecting corpus contains — Ukrainian went from 3,197 words
to 13,175 and Basque from 2,373 to 5,323.

**Vietnamese is the thinnest language that ships**, at 27 words a board against Latin's 91 and
Japanese's 149, and its density scale is 0.16, the lowest in the set. The reason is structural
rather than a cut that could be moved: a folded compound is seven or eight tiles, and a
twelve-tile board holding all eight of the right toned vowels is rare.

### Still open on these

- **Vietnamese is written without its spaces.** ÁCHÂU rather than Á CHÂU. Hebrew restores its
  final forms in `display` because a rule can find them; a syllable boundary can only be looked
  up, and `display` is deliberately a function of the word alone. Fixing it means a word-list
  format that can carry a written form beside the folded one.
- **Six of the twenty-five were written by someone who does not speak them**: Basque, Georgian,
  Armenian, Welsh, Irish and Naija. They are fluent and idiomatic as far as that goes, and a
  native reader would be worth more than another pass here.
- Whether Finnish, German and Malay should move off `titles` too, given what it did to
  Vietnamese.
- Whether `sr-Latn` is worth a second entry. The word list is the same file transliterated.
- Vietnamese typing goes through an IME, and the browser delivers composed characters. It has
  not been tested with one attached.

## Still open

- Whether the other twenty-four languages want their own measured `vowelShare` too. Japanese has
  one because the default was actively wrong there; nobody has reported a fault anywhere else,
  and changing it would change every board those languages have ever dealt.
- ~~Whether `pcm` wants `sortsWith: 'en'`~~ — it does, and it has it.
- Whether `igboapi.com` is usable as a source, by licence and by size.
- ~~What Egyptian Arabic would be~~ — answered by building it. See below.
- ~~Whether Vietnamese tones ride on the tile or on the word.~~ On the tile, eighty-nine of
  them, measured rather than guessed. See above.
- Urdu needs Nastaliq to look right, which is a font decision on top of RTL.
- Whether Latin's 800,379 inflected forms are worth having, and how to get them without spending
  a day being throttled. A `categorylinks` dump would do it in one download, at the cost of
  parsing a SQL dump of every category on en.wiktionary.
- Whether the other twenty-one languages should move to the Wikipedia corpus now that it exists.
  It is the clean provenance and OpenSubtitles is not, but it means rebuilding and recalibrating
  every one, and the cuts are calibrated against the corpus they were measured on.
