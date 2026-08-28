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
- **Deployed and live** at https://playblinkered.com, two replicas in `blinkered-prod` on
  `tl-prod`. One container, nginx serving the built files, built and pushed by CI, fronted by
  Traefik with the www redirect and response compression as middlewares. See
  [DEPLOY.md](DEPLOY.md).
- **`apps/web`** — playable React front end. Keyboard and pointer, sixteen languages with a
  flag picker, full interface localisation, nerd mode, flip and shuffle animation, pause,
  game over.
- **iOS**, meaning the same build made genuinely playable on a phone and installable to the
  home screen: the board sizes itself from the room available instead of from `vmin`, every
  touch target clears Apple's 44pt floor, the four touch defaults that fight a tapping game are
  turned off, landscape gets its own layout, and there is a manifest and an icon set.
  [IOS.md](IOS.md) has the measurements.
- **`apps/mobile`** — the Capacitor iOS shell, which runs `apps/web`'s build in a WebView and
  owns no game code. All sixteen word lists are inside the app, so it plays with the phone in
  aeroplane mode. The one thing the shell had to change is the rules, which cannot be a second
  tab where there are no tabs. Installing it needs an Apple ID typed into Xcode and Xcode's iOS
  platform download, neither of which can be scripted; steps are in
  [../apps/mobile/README.md](../apps/mobile/README.md). This is PLAN.md phase 3 finished and
  phase 5 started. A **store** build still waits on the CC BY-SA call.
- 325 tests, 100% line/branch/function/statement coverage on engine, words and i18n. CI on
  ubuntu and macos.

## Next, in order

1. **Playwright suite.** Drive ticks explicitly, no `waitForTimeout` anywhere. That rule is
   the whole reason the engine has no clock. The manual checks in
   [DICTIONARIES.md](DICTIONARIES.md) and the ones below are what this should automate: a word
   accepted end to end, a language switch keeping the keyboard alive, no letter in the DOM for
   a face-down tile. The WebKit device checks written for [IOS.md](IOS.md) belong here too —
   board geometry per viewport, a 44pt audit of every target, and a game played by touch alone.
   They exist and were run; they live in a scratchpad rather than the repo, which is the gap.
2. **In-progress game surviving reload**, via localStorage. Nearly free: state is
   serialisable and the reducer is pure.
3. **The balance simulator** (PLAN.md phase 2). Never built, and the difficulty numbers are
   still guesses — the only numbers in the repo that are. Everything else is now measured.
4. Then accounts, verified score submission, and history: PLAN.md phase 4 onward. That is when
   the deployment stops being a static site and grows a backend and a Postgres.

## Wanted, not built

Three features are written up in [PROPOSALS.md](PROPOSALS.md) with the decisions each still needs:
sharing a finished game, wild-card tiles, and replacing a letter during a shuffle. Share wants no
engine change. The other two both want the balance simulator first, because each introduces a
frequency that cannot be settled by argument.

## Settled

- **Tight Line LLC owns this.** NOTICE was already written that way; it is now a decision
  rather than a default. It also settles the Apple Developer account type, which is the part
  that is hard to undo: an organisation account, not an individual one.
- **The Apple Developer Program is not Apple Business Manager**, and Tight Line's existing ABM
  account (used for MDM) does not provide TestFlight. They are separate enrolments: ABM is free
  and deploys apps and devices to people, the Developer Program is $99/yr and is what lets you
  build, beta-test and publish one. The two compose later, in that the Developer Program can
  push a private Custom App to your own organisation _through_ ABM, which is the modern
  replacement for the $299 Enterprise Program and the wrong shape for a public game.
  The useful consequence: ABM enrolment already required a verified D-U-N-S number, so the part
  of organisation enrolment with a multi-day wait in it is already done. The rest of what Apple
  asks for is also in place: a legal entity, a work email on the organisation's own domain, and
  a functional website at that domain.
- **`playblinkered.com` is registered.** `blinkered.game` is not: $300 a year against $10.
- **Download size over vocabulary.** The credit tier is bounded by a lexicon rather than by
  corpus frequency, which makes the inflected languages large: 1.2MB gzipped for Russian and
  Swedish, 459KB for English, 25KB for Malay. Accepted knowingly, because a game that refuses a
  word you know is broken in a way a large download is not.

## Known and accepted

- **Five languages ship under CC BY-SA**, because Wiktionary is the only clean validator for
  them: Italian, German, Norwegian, Finnish, Malay. No effect on the web build, where
  attribution is the whole obligation and we do it. Before a store build wraps DRM around a
  share-alike data file, someone should read the end of DICTIONARIES.md and probably a lawyer.
  Nothing anywhere is GPL.
- **Malay is the weak one**, at 15% validation yield, and no cut fixes it: the Wiktionary
  validator is exhausted by rank 100,000, so a Malay player will be refused real words. Good
  enough to ship. Nick is asking Malay speakers where a better dictionary lives; when one turns
  up it is one entry in `tools/dictionary/src/manifest.ts` and a rebuild.
- **No service worker**, so no offline play. Offline is not something the game does on the web
  either, so it would be new behaviour rather than parity, and the payload is sixteen word lists
  of which Russian alone is 8.3MB. A stale service worker is also the classic way to serve last
  week's bundle. Worth adding when somebody asks for offline; cache the shell and the one
  language in play.
- **Four iOS facts are reasoned rather than measured.** WebKit under Playwright gives real touch
  events and real `pointer: coarse`, but no safe-area insets, no URL-bar resize, no focus-zoom,
  and no home-screen install. The landscape notch padding in particular follows the spec rather
  than a measurement. Five minutes on a real iPhone closes it.
- **The frequency source is OpenSubtitles via hermitdave**, which is MIT but derives from
  user-uploaded subtitles. `wordfreq` remains the cleaner alternative if the provenance ever
  matters more than it does now.

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
- **A viewport unit can be right on one device and inverted on another.** Tile size was
  `clamp(2.5rem, 10vmin, 4.25rem)`, which is correct on a desktop, where width is plentiful and
  height is the constraint. On a phone in portrait `vmin` _is_ the width: 10vmin came out at
  39px, the floor won, and the board was 132×179 on a 390px screen with every target under
  Apple's 44pt minimum. The game was fully functional and unplayable at the same time, which is
  the hard kind to notice. Size from the room actually available, per axis.
- **WebKit ignores author heights on a native `select`.** `min-height: 2.75rem` computed to
  18px, and the three nerd-panel selects stayed 23px tall however the CSS was written. Only
  `appearance: none` gets sizing back. Found by auditing every interactive box against 44pt, not
  by looking at the page, and it would not reproduce in Chrome or Firefox at all.
- **`unmunch` fails silently** in two ways; a 1.0x expansion ratio is the tell. The pipeline
  no longer expands anything — it asks `hunspell -l` instead. See DICTIONARIES.md.
- **Verify by running the thing.** The DOM leak, the pause cheat, the focus bug, `pnpm dev`
  needing a prior build, and the missing-word-list error never firing were all found by
  driving the built app in a browser, not by a green build.
