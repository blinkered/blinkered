# Word list data

Nothing here yet. Flippy currently plays against `/usr/share/dict/words` as a
placeholder, which is not shipped.

## Rules for adding a list

Read these before committing any dictionary, because the licence on the data can
determine the licence of the whole distributed app.

1. **One directory per language**, named by its BCP 47 tag: `data/en`, `data/fr`.
2. **Each directory carries a `LICENSE`** with the list's own terms, verbatim, and a
   `PROVENANCE.md` naming the upstream project, the version or date obtained, the URL,
   and the licence in one line.
3. **Copyleft data is a distribution problem, not just an attribution problem.** A
   GPL-licensed word list bundled into a mobile binary argues the binary is a GPL work,
   and the FSF's position is that the GPL conflicts with the Apple App Store's terms.
   Prefer permissive or weak-copyleft sources: OpenTaal (Dutch, BSD and CC BY),
   Dicollecte/Grammalecte (French, MPL 2.0). Read tri-licensed hunspell dictionaries
   carefully and record which branch of the licence we are relying on.
4. **Hunspell dictionaries are not word lists.** They are stems plus affix rules and
   need expanding first. Record the expansion command in `PROVENANCE.md` so the list
   can be rebuilt.
5. **Both tiers come from the same source where possible.** The full tier grants credit;
   the common tier is what the board generator counts toward W.
6. **Regenerate the derived numbers** after any change:
   `pnpm derive --words=<list> --language=<tag>`, then update the draw weights in the
   alphabet and `MEDIAN_WORDS` in `packages/engine/src/difficulty.ts`.
