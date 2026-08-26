# Where things stand

A handover note. [PLAN.md](PLAN.md) is the design; this is the state of play and what is
next.

## Done and committed

- **`packages/engine`** — the whole game as one pure reducer. No clock, no I/O, no DOM.
  Deterministic from `(seed, difficulty, event log)`, which is what will let a server verify
  a score rather than believe one. Sixteen alphabets, with draw weights derived from each
  language's own shipped vocabulary.
- **`packages/words`** — word list normalisation, anagram solver, board generation, weight
  derivation, and the dictionary pipeline's pure half. Node-only filesystem access sits behind
  `@blinkered/words/node` so the browser bundle cannot pull in `node:fs`.
- **`packages/i18n`** — every string the game says, in sixteen languages. Plurals go through
  `Intl.PluralRules`, so Russian gets its four forms and Croatian its three.
- **`packages/words/data`** — sixteen playable languages, generated and committed, each with
  its own `LICENSE` and `PROVENANCE.md`. 5.4MB, about 100KB gzipped per language.
- **`tools/dictionary`** — builds them: `build`, `calibrate`, `weights`, `floor`, `list`.
- **`tools/harness`** — terminal front end on the real engine. Every rule is a flag.
- **`tools/derive`** — draw weights and word-count calibration from an arbitrary word list.
- **`apps/web`** — playable React front end. Keyboard and pointer, sixteen languages with a
  flag picker, full interface localisation, nerd mode, flip and shuffle animation, pause,
  game over.
- 314 tests, 100% line/branch/function/statement coverage on engine, words and i18n. CI on
  ubuntu and macos.

## Next, in order

1. **Playwright suite.** Drive ticks explicitly, no `waitForTimeout` anywhere. That rule is
   the whole reason the engine has no clock. The manual checks in
   [DICTIONARIES.md](DICTIONARIES.md) and the ones below are what this should automate: a word
   accepted end to end, a language switch keeping the keyboard alive, no letter in the DOM for
   a face-down tile.
2. **In-progress game surviving reload**, via localStorage. Nearly free: state is
   serialisable and the reducer is pure.
3. **The balance simulator** (PLAN.md phase 2). Never built, and the difficulty numbers are
   still guesses — the only numbers in the repo that are. Everything else is now measured.
4. Then accounts, verified score submission, and history: PLAN.md phase 4 onward.

## Open questions that need Nick

- **Who owns this**: NOTICE currently says `Copyright 2026 Tight Line LLC`, which was a
  default rather than a decision. Tight Line has a co-owner, so putting it there gives away
  a share; a separate LLC ring-fences it. Also decides the Apple Developer account type,
  which is hard to undo because an individual account shows a personal name as the seller
  forever.
- **Five languages ship under CC BY-SA**, because Wiktionary is the only clean validator for
  them: Italian, German, Norwegian, Finnish, Malay. Fine for the web build. Needs a decision
  before a store build wraps DRM around a share-alike data file. Options and the order I would
  try them are at the end of DICTIONARIES.md. Nothing is GPL.
- **Frequency source provenance**: FrequencyWords is MIT but derives from OpenSubtitles.
  Evaluating `wordfreq` would also help with the point above.
- **Claim the names**: `blinkered.game` and `playblinkered.com` are free, as are the
  `blinkered` npm name and, at the time of checking, the GitHub org (now taken by us).
  `blinkered.com` and `.app` are parked. And someone should eyeball `r/blinkered` by hand,
  since Reddit blocks automated checks.
- **Malay is the weak one.** 15% validation yield, and no cut fixes it: the Wiktionary
  validator is exhausted by rank 100,000. A Malay player will be refused real words. Either
  find a better source or consider not offering it at launch.

## Rules still unsettled, deliberately

Settled by playing, not by argument. All are runtime settings; see PLAN.md 1.10.

- **word-complete mode**: `spend` chosen, by playing it. `shuffle` and `keep` remain options.
- **flip economy**: `fibonacci` is the hypothesis and the only one where word length affects
  survival rather than just score. Unconfirmed.
- **minimum word length**: 3, with 4 on the harder presets. Unconfirmed. Floored at 3 in the
  interface now, because the shipped lists start there.
- **difficulty numbers**: still guesses. The balance simulator replaces them.

## Traps already hit, so they are not hit again

- **The engine must never leak the hidden board.** The keyboard consults only revealed tiles,
  or it becomes an oracle. The same bug reappeared in the view, where every tile's letter sat
  in the DOM face down and a screen reader would read the whole concealed board; and again in
  pause, which left the board legible and so bought unlimited study time. All three are fixed
  and tested. Expect a fourth.
- **Anything depending on live game state belongs in the reducer.** Letter cycling was
  decided in the view from a snapshot, so identical keystrokes gave different words depending
  on whether React had re-rendered. `CYCLE_LETTER` is one event the reducer resolves.
- **A mouse click must not cost the player the keyboard.** The keydown handler ignored any
  event targeting a button or a select, which meant that after clicking Pause or choosing a
  language, every letter typed went nowhere and Enter re-pressed the button instead of
  submitting the word. Controls now decline focus on click (`withoutStealingFocus`), the
  language select hands focus back, and the handler only defers to the keys a control actually
  owns.
- **Do not decide what is a word by counting how often films say it.** The credit tier was cut
  at candidate rank 50,000, which rejected WEAL (rank 85,602). Replacing the rank cut with a
  frequency floor looked like the fix, pruned Dutch by 72% for 0.27% of coverage, and would have
  rejected SWALE (13 occurrences, 0.025 per million) all over again. Corpus frequency is the
  right instrument for deciding whether a _board_ is solvable and the wrong one for deciding
  whether a _submission_ is a word. The credit tier is now bounded by a lexicon, and for English
  the lexicon is ENABLE rather than a spell checker, because a spell checker is built to catch
  typos and a word-game lexicon is built to settle arguments.
- **Derived numbers go stale silently.** Changing the word lists left `defaultWMin` calibrated
  against the old ones, so the word floor sat at twice what any board could reach: every draw
  rejected, the whole attempt budget burned, the best of four hundred boards played, and a
  green build throughout. `pnpm dictionary weights` then `pnpm dictionary floor`, in that
  order, and the order matters.
- **Tests must not read the machine they run on.** A test read `/usr/share/dict/words`, which
  exists on macOS and not on a Linux runner, so the suite passed locally and failed on the
  first push. Word tests now use a miniature language defined in the fixtures.
- **Literal control characters get written into source.** Twice: a NUL in `wordIndex.ts` and
  a `0x01` in `alphabet.ts`. Both worked, and both made `file` report the source as binary so
  grep skipped it and a repo-wide rename silently missed the file. `pnpm lint:sources`
  refuses them now.
- **`unmunch` fails silently** in two ways; a 1.0x expansion ratio is the tell. The pipeline
  no longer expands anything — it asks `hunspell -l` instead. See DICTIONARIES.md.
- **Verify by running the thing.** The DOM leak, the pause cheat, the focus bug, `pnpm dev`
  needing a prior build, and the missing-word-list error never firing were all found by
  driving the built app in a browser, not by a green build.
