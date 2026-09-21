# Word list data

One directory per language, each holding the list the game plays against and where it came
from. Everything here is borrowed: `pnpm languages update`. Do not edit a `words.txt` by hand.

These lists are not built here any more, and not built from dictionaries at all. Each one is
made in its own repository, `blinkered/blinkered-dictionary-<tag>`, where a word ships because
three independent collections of that language were found to contain it. The rule, the evidence
format and the argument for both live in `blinkered-attestation`.

## What is here

```
manifest.json          what the app reads to know which languages it can offer
<tag>/words.txt        both tiers in one file, common first, with the split in the header
<tag>/LICENSE          what this list is distributed under, and why it inherits nothing
<tag>/PROVENANCE.md    the upstream repository, the commit these bytes came from, and why it ships
```

Seven languages, against fifty-one the interface is translated into. That gap is the state of
the project rather than a fault: a language becomes playable when somebody has attested a
dictionary for it, and the other forty-four are queued in
`blinkered-attestation/candidates`, each with the list of words worth looking up.

## The file format

```
#blinkered/wordlist/2 language=en common=16575 full=107670 digest=<hash of the body>
<16575 common words, sorted>
<91095 further words, sorted>
```

Two tiers, one file, one fetch. The **common** tier is what the board generator counts toward
the word floor, so a board is guaranteed solvable from vocabulary people actually use. The
**full** tier is what earns credit, so an unusual word still scores. The magic first line is
load-bearing: a dev server answers a missing path with its index page, and a word list that
silently parsed as one word would be worse than an error.

A line may carry a tab and a second column, which is how the word is *written* where that
differs from how it is tiled. It is sparse, and no language shipping today uses it: it exists
for Vietnamese, where the fold eats the spaces out of most of the vocabulary. Column one is the
word, always; every consumer but the rail reads it and nothing else.

## Adding a language

There is no step here. A language arrives by being attested in its own repository, and this
directory finds out about it:

1. **Build it in `blinkered-dictionary-<tag>`**, against candidates from
   `blinkered-attestation/candidates/<tag>/words.txt`. The expensive part is finding three
   independent families that between them cover the register those candidates came from.
2. **Bless it there**, in that repository's `status.json`, by setting `ships: true` with a
   reason. That is an editorial judgment about whether the list is any good, and it is the one
   question this repository does not try to answer for itself.
3. **`pnpm languages update` here.** It fetches, checks the list deals a board somebody could
   play, writes the three files above, rebuilds `manifest.json`, and sets `available` on the
   localization. See `.claude/skills/update-languages`.

The engine must already have an alphabet with the same id, and the language must already be
translated; both are true for all fifty-one.

## What changed, and what did not

**Licensing stopped being the hard part.** Every list here used to be a frequency corpus
intersected with whatever dictionary could validate it, distributed under the most restrictive
of its inputs, and twenty-five of the fifty-one came out share-alike. The rule that no GPL
dictionary may be used still holds and still matters for candidates, and the reasoning is worth
keeping: a GPL word list bundled into a mobile binary argues the binary is a GPL work, and the
FSF's position is that the GPL conflicts with the App Store's terms. It is recorded in
[docs/DICTIONARIES.md](../../../docs/DICTIONARIES.md) along with the measurements behind the
tier cuts, which are still the measurements the cuts rest on.

None of it reaches a list here any more. An attested list takes nothing from a dictionary that
a license governs; it takes a question, and answers it from collections of text. Each `LICENSE`
says that at length.

**Calibration did not stop mattering.** The word floor and the draw weights describe a
dictionary, and these are different dictionaries from the ones they were measured against:

- `pnpm dictionary weights`, pasted into the alphabet in `packages/engine/src/languages.ts`
- `pnpm dictionary floor`, pasted into `packages/engine/src/difficulty.ts`

Skipping that is a silent fault rather than a loud one: the floor sits above what any board can
reach, every draw is rejected, and the generator plays the best of four hundred boards while
reporting that it failed. `everyLanguagePlays` is the test that catches it.
