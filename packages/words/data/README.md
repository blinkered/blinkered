# Word list data

One directory per language, each holding the list the game plays against and the terms it
comes under. Everything here is generated: `pnpm dictionary build`. Do not edit `words.txt` by
hand; edit the sources in `tools/dictionary/src/manifest.ts` and rebuild.

The design, the measurements behind every number, and the license reasoning are in
[docs/DICTIONARIES.md](../../../docs/DICTIONARIES.md).

## What is here

```
manifest.json          what the app reads to know which languages it can offer
licenses/              verbatim license texts, referenced rather than copied per language
<tag>/words.txt        both tiers in one file, common first, with the split in the header
<tag>/LICENSE          the terms this list is distributed under, and what it was built from
<tag>/PROVENANCE.md    every source, the license branch relied on, and the measurements
```

## The file format

```
#blinkered/wordlist/1 language=en common=16115 full=33080
<16115 common words, sorted>
<16965 further words, sorted>
```

Two tiers, one file, one fetch. The **common** tier is what the board generator counts toward
the word floor, so a board is guaranteed solvable from vocabulary people actually use. The
**full** tier is what earns credit, so an unusual word still scores. The magic first line is
load-bearing: a dev server answers a missing path with its index page, and a word list that
silently parsed as one word would be worse than an error.

## Rules for adding a language

1. **Named by its BCP 47 tag**, and the engine must have an alphabet with the same id.
2. **No GPL, anywhere.** A GPL-licensed word list bundled into a mobile binary argues the
   binary is a GPL work, and the FSF's position is that the GPL conflicts with the App Store's
   terms. Where an upstream dictionary is offered under several licenses, record in
   `manifest.ts` **which branch** is relied on, or a later reader will assume the worst one.
3. **Validators are build-time filters and are never shipped.** What ships is a corpus
   ordering intersected with a yes-or-no answer, which is a far thinner derivative of either
   input than a copy of either would be.
4. **The list is distributed under the most restrictive of its inputs.** Conservative on
   purpose: a good argument says a filtered list inherits nothing, and making that argument is
   not the same as being right about it.
5. **Calibrate the cut by board density**, not by a round number: `pnpm dictionary calibrate`.
6. **Regenerate the derived numbers afterwards**, in this order, because each depends on the
   last:
   - `pnpm dictionary weights` and paste into the alphabet in `packages/engine/src/languages.ts`
   - `pnpm dictionary floor` and paste `MEDIAN_WORDS`, `SHARE_BY_MINIMUM` and `DENSITY_SCALE`
     into `packages/engine/src/difficulty.ts`

   Skipping the last step is a silent fault, not a loud one: the word floor sits above what
   any board can reach, every draw is rejected, and the generator plays the best of four
   hundred boards while reporting that it failed.
