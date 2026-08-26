# Where things stand

A handover note. [PLAN.md](PLAN.md) is the design; this is the state of play and what is
next.

## Done and committed

- **`packages/engine`** — the whole game as one pure reducer. No clock, no I/O, no DOM.
  Deterministic from `(seed, difficulty, event log)`, which is what will let a server verify
  a score rather than believe one. Fifteen alphabets.
- **`packages/words`** — word list normalisation, anagram solver, board generation, weight
  derivation. Node-only filesystem access sits behind `@blinkered/words/node` so the browser
  bundle cannot pull in `node:fs`.
- **`tools/harness`** — terminal front end on the real engine. Every rule is a flag.
- **`tools/derive`** — derives draw weights and the word-count calibration from a word list.
- **`tools/wordlist`** — interim: packs the system dictionary for the web app. Gitignored.
- **`apps/web`** — playable React front end. Keyboard and pointer, nerd mode, flip and
  shuffle animation, pause, game over.
- 258 tests, 100% line/branch/function/statement coverage on engine and words. CI on ubuntu
  and macos.

## Next, in order

1. **The dictionary pipeline.** Design and evidence in [DICTIONARIES.md](DICTIONARIES.md).
   Build `tools/dictionary`: source manifest, fetch with cache, filter, validate, intersect,
   split into tiers, calibrate the cut by board density, write per-language `LICENSE` and
   `PROVENANCE.md`. This is what makes the game feel fair, and it unblocks every other
   language.
2. **Per-language loading in the web app.** The current loader fetches one list and builds
   the index on the main thread behind a loading state, which is required because the
   engine's `Dictionary.has` is synchronous. With sixteen options it needs to load lazily
   per language and only offer languages whose list is actually present.
3. **UI localisation and the language picker.** Flag plus endonym, sixteen entries. Strings
   for every message in every language. The game language and the UI language should stay
   two fields in the model even if one control sets both, so playing French with an English
   interface stays possible later.
4. **Playwright suite.** Drive ticks explicitly, no `waitForTimeout` anywhere. That rule is
   the whole reason the engine has no clock.
5. **In-progress game surviving reload**, via localStorage. Nearly free: state is
   serialisable and the reducer is pure.
6. Then accounts, verified score submission, and history: PLAN.md phase 4 onward.

## Open questions that need Nick

- **Who owns this**: NOTICE currently says `Copyright 2026 Tight Line LLC`, which was a
  default rather than a decision. Tight Line has a co-owner, so putting it there gives away
  a share; a separate LLC ring-fences it. Also decides the Apple Developer account type,
  which is hard to undo because an individual account shows a personal name as the seller
  forever.
- **Frequency source provenance**: FrequencyWords derives from OpenSubtitles. See the open
  question in DICTIONARIES.md, and whether to evaluate wordfreq instead.
- **Claim the names**: `blinkered.game` and `playblinkered.com` are free, as are the
  `blinkered` npm name and, at the time of checking, the GitHub org (now taken by us).
  `blinkered.com` and `.app` are parked. And someone should eyeball `r/blinkered` by hand,
  since Reddit blocks automated checks.

## Rules still unsettled, deliberately

Settled by playing, not by argument. All are runtime settings; see PLAN.md 1.10.

- **word-complete mode**: `spend` chosen, by playing it. `shuffle` and `keep` remain options.
- **flip economy**: `fibonacci` is the hypothesis and the only one where word length affects
  survival rather than just score. Unconfirmed.
- **minimum word length**: 3, with 4 on the harder presets. Unconfirmed.
- **difficulty numbers**: still guesses. The balance simulator in PLAN.md phase 2 replaces
  them, and it has not been built.

## Traps already hit, so they are not hit again

- **The engine must never leak the hidden board.** The keyboard consults only revealed tiles,
  or it becomes an oracle. The same bug reappeared in the view, where every tile's letter sat
  in the DOM face down and a screen reader would read the whole board; and again in pause,
  which left the board legible and so bought unlimited study time. All three are fixed and
  tested. Expect a fourth.
- **Anything depending on live game state belongs in the reducer.** Letter cycling was
  decided in the view from a snapshot, so identical keystrokes gave different words depending
  on whether React had re-rendered. `CYCLE_LETTER` is one event the reducer resolves.
- **Tests must not read the machine they run on.** A test read `/usr/share/dict/words`, which
  exists on macOS and not on a Linux runner, so the suite passed locally and failed on the
  first push. Word tests now use a miniature language defined in the fixtures.
- **Literal control characters get written into source.** Twice: a NUL in `wordIndex.ts` and
  a `0x01` in `alphabet.ts`. Both worked, and both made `file` report the source as binary so
  grep skipped it and a repo-wide rename silently missed the file. `pnpm lint:sources`
  refuses them now.
- **`unmunch` fails silently** in two ways; a 1.0x expansion ratio is the tell. See
  DICTIONARIES.md.
- **Verify by running the thing.** The DOM leak, the pause cheat, `pnpm dev` needing a prior
  build, and the missing-word-list error never firing were all found by driving the built app
  in a browser, not by a green build.
