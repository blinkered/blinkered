# Where things stand

A handover note. [PLAN.md](PLAN.md) is the design; this is the state of play and what is
next.

## Done and committed

- **`packages/engine`** — the whole game as one pure reducer. No clock, no I/O, no DOM.
  Deterministic from `(seed, difficulty, event log)`, which is what will let a server verify
  a score rather than believe one. Fifty-one alphabets, with draw weights derived from each
  language's own shipped vocabulary.
- **`packages/words`** — word list normalization, anagram solver, board generation, weight
  derivation, and the dictionary pipeline's pure half. Node-only filesystem access sits behind
  `@blinkered/words/node` so the browser bundle cannot pull in `node:fs`.
- **`packages/i18n`** — every string the game says, in fifty-one languages. Plurals go through
  `Intl.PluralRules`, so Russian gets its four forms and Croatian its three. Two languages CLDR
  cannot reliably name carry their own table of exonyms; see LANGUAGES.md.
- **`packages/words/data`** — fifty-one playable languages, generated and committed, each with
  its own `LICENSE` and `PROVENANCE.md`. 122MB, about 100KB gzipped per language, though
  Hungarian is 17.2MB on its own and Arabic, Russian and Turkish are 8.5 to 9MB each.
- **`tools/dictionary`** — builds them: `build`, `calibrate`, `weights`, `floor`, `list`.
- **`tools/harness`** — terminal front end on the real engine. Every rule is a flag.
- **`tools/derive`** — draw weights and word-count calibration from an arbitrary word list.
- **Deployed and live** at https://playblinkered.com, two replicas in `blinkered-prod` on
  `tl-prod`. One container, nginx serving the built files, built and pushed by CI, fronted by
  Traefik with the www redirect and response compression as middlewares. See
  [DEPLOY.md](DEPLOY.md).
- **`apps/web`** — playable React front end. Keyboard and pointer, fifty-one languages behind a
  searchable flag picker that shows each language's own name over the reader's name for it, full
  interface localisation, nerd mode, flip and shuffle animation, pause, game over.
- **iOS**, meaning the same build made genuinely playable on a phone and installable to the
  home screen: the board sizes itself from the room available instead of from `vmin`, every
  touch target clears Apple's 44pt floor, the four touch defaults that fight a tapping game are
  turned off, landscape gets its own layout, and there is a manifest and an icon set.
  [IOS.md](IOS.md) has the measurements.
- **`apps/mobile`** — the Capacitor iOS shell, which runs `apps/web`'s build in a WebView and
  owns no game code. Every word list is inside the app, so it plays with the phone in
  aeroplane mode. The one thing the shell had to change is the rules, which cannot be a second
  tab where there are no tabs. Installing it needs an Apple ID typed into Xcode and Xcode's iOS
  platform download, neither of which can be scripted; steps are in
  [../apps/mobile/README.md](../apps/mobile/README.md). This is PLAN.md phase 3 finished and
  phase 5 started. A **store** build still waits on the CC BY-SA call.
- **A first-run tour**, shown over the setup screen until it is dismissed for good. Six screens:
  the board turning over, taking and giving back letters, the control row, wild cards, a letter
  swap, and done. Every screen drives the game's own `Board` from a scripted state rather than
  drawing a picture of one, so a tutorial that teaches the wrong thing would have to be a game
  that does the wrong thing. Skipping asks before it hides the tour for good; finishing assumes.
- **Sharing a finished game**, **wild cards** and **letter replacement** — the three features
  written up in [PROPOSALS.md](PROPOSALS.md), now built. The last two both change what the board
  is, so each ships with its own section in the rules page in every language.
- **Moderation**, which is `is_admin` on `users`, a panel behind it, and a report button in
  front of it. The panel finds an account by username or sign-in address, renames it, clears a
  bio, grants or removes the flag, marks it deleted and brings it back; it lists games in the
  board's own order and hides one; and it reads and resolves the `reports` rows that had a table
  and nothing writing to or reading them. Nobody can grant themselves the flag — the sign-in flow
  never writes the column and the routes refuse to change it on the caller's own row — so the
  first admin is one `update` by hand, which is the correct ceremony for the power to delete
  anybody's account. The panel is in English and the report button is in all fifty-one languages,
  and that asymmetry is the point: a report button that only worked in English would be the
  blocklist ACCOUNTS.md refuses. See [ACCOUNTS.md](ACCOUNTS.md), "Moderation".
- **`apps/server`** — started, and honest about how far. A Hono app answering `/healthz`, and
  `scoreSubmission`, which is the rule that a submitted game is scored from its words rather than
  believed. No database yet, so no other route exists: one that answered from nothing would be a
  fixture pretending to be an endpoint. See [ACCOUNTS.md](ACCOUNTS.md).
- 1,621 tests, 100% line/branch/function/statement coverage on engine, words, i18n and server.
  CI on ubuntu and macos. Three of them are per-language sweeps rather than samples: every
  alphabet deals an accepted board over three seeds, every letter in every `weights` table
  appears in some shipped word, and every written form in every shipped list folds back onto the
  word it is filed under.

## Next, in order

1. **Playwright suite.** Drive ticks explicitly, no `waitForTimeout` anywhere. That rule is
   the whole reason the engine has no clock. The manual checks in
   [DICTIONARIES.md](DICTIONARIES.md) and the ones below are what this should automate: a word
   accepted end to end, a language switch keeping the keyboard alive, no letter in the DOM for
   a face-down tile. The WebKit device checks written for [IOS.md](IOS.md) belong here too —
   board geometry per viewport, a 44pt audit of every target, and a game played by touch alone.
   They exist and were run; they live in a scratchpad rather than the repo, which is the gap.

   **`apps/web` now has exactly one test**, `test/reportDraft.test.ts`, and it is not a dent in
   this item. It is there because that module parses a shape out of session storage and so has
   to refuse one that is not the shape it wrote, which is branch logic rather than rendering.
   `vitest.config.ts` runs `apps/web/test` and deliberately leaves it out of the coverage gate:
   a percentage over a directory with one tested file in it would read as a claim about the
   directory. The report dialog's own states — asked up front, asked again after a 401, restored
   from a draft — were walked in a browser and are pinned by nothing, which is this item's job.

2. **In-progress game surviving reload**, via localStorage. Nearly free: state is
   serializable and the reducer is pure.
3. **The balance simulator** (PLAN.md phase 2). Never built, and the difficulty numbers are
   still guesses — the only numbers in the repo that are. Everything else is now measured.
4. Then accounts, history and leaderboards: PLAN.md phase 4 onward, designed in
   [ACCOUNTS.md](ACCOUNTS.md). That is when the deployment stops being a static site and grows
   a backend and a Postgres.

The balance simulator stays at 3 for a sharper reason than before: `ENGINE_VERSION` is cheap to
bump while the only table it wipes is the player's own, and it stops being cheap the day the
boards are public.

## Wanted, not built

**The boards are uncached, deliberately, and this is the note asking for it later.** Nick's words
were "when the game has 1341245454351 users". `GET /v1/leaderboard/:language/:difficulty` is one
index scan and a join, and `games_leaderboard_idx` is ordered
`(language, difficulty, engine_version, score desc, rounds_played, finished_at)`, which is exactly
that query. At a size where it stops being free, the answer is a short-lived cache keyed by
`(language, difficulty, engineVersion)` or a materialised view refreshed on write: a board is the
same answer for everybody who asks, which makes it the easiest thing in the system to cache and
the reason not to do it speculatively now. The `TODO` is on the query in `pgStore.ts`.

Three smaller things the boards opened:

- **A board has no periods.** ACCOUNTS.md describes "today and all-time" and the address has room
  for neither; `/l/en/insane` is all-time. A period belongs in the path when it exists, not in a
  query parameter, for the same reason the language and the difficulty are there.
- **Ranked scores are still client-seeded.** Eligibility is `canonical && score > 0`, which is
  the weaker rule phase A can support: the server re-scores the words it is sent but the seed was
  the client's. Phase C closes it, and the change is one expression in the import route.
- **Nothing recomputes eligibility for games already stored.** Every row written before the
  column was set carries `false`, so the boards start from the games played after this shipped.
  A backfill is one `UPDATE` and was not run, because deciding retroactively that old games are
  rankable is a decision rather than a migration.

**The offline design is built, in four steps, and three things are owed out of it.** The product
commitment was Nick's, on 2026-09-16: sign-in needs a connection; a signed-in player stays signed
in but cannot write; games are playable either way; and games played offline upload when a
connection returns. Half of it already existed -- every finished game has always gone to
`localStorage`, and `POST /v1/games/import` has always existed to move one onto an account. What
is new is that only a 401 means signed out, that a finished game is queued rather than posted
once, and that the native shell can authenticate at all. See
[ACCOUNTS.md](ACCOUNTS.md) and [IOS.md](IOS.md).

- **The native bearer token is in `localStorage`, not the keychain.** Defensible -- the store is
  inside the app sandbox and goes on uninstall -- and not right: any script in the WebView can
  read it. Moving it needs a Capacitor plugin and a bridge, and `apps/web` deliberately has no
  Capacitor dependency. It is behind three functions in `api.ts` so the move is one file.
- **Google and Apple sign-in are not wired for the shell**, because they are navigations
  off-origin ending at a cookie the shell cannot receive. `ASWebAuthenticationSession` and a
  token-returning callback is the shape. Not a store blocker: an app offering no third-party SSO
  is not subject to guideline 4.8, so the email code flow is enough to submit with.
- **None of the native work has run on a device.** Unit suites, the server's bearer and CORS
  routes, and a simulator build are the limit of what a Mac can check. `WKAppBoundDomains` fails
  in a way that looks like a network outage, and it is the first thing to suspect if the shell
  signs in and then reaches nothing.

**Accounts, history and leaderboards** is largely built rather than queued; what is left of it is
in [ACCOUNTS.md](ACCOUNTS.md). Sign-in is a six-digit emailed code plus Google and Apple, with no
password anywhere; avatars are generated rather than uploaded, so there is nothing hosted to
moderate; personal history ships before any public board, and the boards wait for the balance
simulator. Scores are checked rather than replayed: the client sends the words it found and the
server scores them, since `points` is a function of word length alone.

**Three pieces of the account surface are still owed**, and the first is a store blocker:

- **Anything at all that recognises a returning account.** No fingerprinting, no retained
  addresses, no blocklist, so a new address is a clean account. ACCOUNTS.md lists three options and
  takes none: it is a privacy decision rather than a task, and lower priority than it looks.
  The evasion path through self-deletion destroys the evader's own username, bio and score on the
  way out, so it is largely self-defeating; the real hole is **serial signup**, which predates all
  of this.
- **The privacy policy still gives an address for deletion**, which is now wrong in the good
  direction: there is a button. Worth rewriting before any submission, since "requiring users to
  phone, email, or contact support" is the pattern Apple names as unacceptable and we no longer
  do it.
- **Telling somebody why they were renamed.** ACCOUNTS.md's answer to an abusive username is "the
  power to rename an account and tell its owner why". The rename exists; there is no notification
  of any kind, so the telling is a person and an email address.

Otherwise nothing is queued. [PROPOSALS.md](PROPOSALS.md) is now a record of the three that
shipped, kept because the reasoning is the part worth having: what was decided, what was measured,
and the two places where the first answer was wrong.

The two frequencies those features introduced, `wildChance` and `replaceChance`, are still guesses
in the same way the difficulty tables are, and the balance simulator is still the thing that would
settle them. They are both nerd-mode numbers, so nothing is blocked on it.

## Settled

- **100% coverage everywhere, `apps/server` included, and pragmas are a joint decision.** The
  bar is the same for the component holding other people's data as for the engine; a quieter one
  there would be exactly backwards. And an ignore pragma is never added unilaterally: a branch
  that looks untestable is nearly always a design fault wearing a disguise — a default that
  cannot happen, a null check the types already forbid, an error path with no caller — so the
  first move is to look at the code again, not at the config.

  Four exclusions exist in `vitest.config.ts` today and predate the rule, so they are worth
  re-reading rather than inheriting: `bin/**`, `db.ts`, `migrate.ts` and `schema.ts`. Two of
  them justify themselves by pointing at `pnpm test:integration`, **which measures no coverage
  at all** — `vitest.integration.config.ts` has no `coverage` block. So the claim that those
  files are covered elsewhere is not being checked. Giving the integration run its own gate is
  the fix, and is better than either an exclusion or a pragma.

  Half of that is now done. `pnpm check` ends with `pnpm test:integration:when-up`, which runs
  those suites when a Postgres answers at `BLINKERED_DB_HOST`/`BLINKERED_DB_PORT` and prints a
  deliberately shouty skip when none does (`tools/integration-gate.sh`). What prompted it: the
  table list in `database.integration.test.ts` went stale when `native_handshakes` arrived, and
  because nothing on a development machine ran that suite, CI went red on six consecutive pushes
  before anybody looked. A developer with the stack up now finds out before pushing.

  The coverage half is still open and the gate does not touch it: those runs still measure
  nothing, so the exclusions for `db.ts` and `migrate.ts` still rest on a claim nobody checks.

- **The database is in-cluster on tl-prod**, not Neon, and the chart already treats it as an
  interface with two implementations so the decision is reversible. What does not come with it
  is point-in-time recovery, which was the reason Neon was attractive. See ACCOUNTS.md.
- **Tight Line LLC owns this.** NOTICE was already written that way; it is now a decision
  rather than a default. It also settles the Apple Developer account type, which is the part
  that is hard to undo: an organization account, not an individual one.
- **The Apple Developer Program is not Apple Business Manager**, and Tight Line's existing ABM
  account (used for MDM) does not provide TestFlight. They are separate enrolments: ABM is free
  and deploys apps and devices to people, the Developer Program is $99/yr and is what lets you
  build, beta-test and publish one. The two compose later, in that the Developer Program can
  push a private Custom App to your own organization _through_ ABM, which is the modern
  replacement for the $299 Enterprise Program and the wrong shape for a public game.
  The useful consequence: ABM enrolment already required a verified D-U-N-S number, so the part
  of organization enrolment with a multi-day wait in it is already done. The rest of what Apple
  asks for is also in place: a legal entity, a work email on the organization's own domain, and
  a functional website at that domain.
- **`playblinkered.com` is registered.** `blinkered.game` is not: $300 a year against $10.
- **Download size over vocabulary.** The credit tier is bounded by a lexicon rather than by
  corpus frequency, which makes the inflected languages large: 1.2MB gzipped for Russian and
  Swedish, 459KB for English, 25KB for Malay. Accepted knowingly, because a game that refuses a
  word you know is broken in a way a large download is not.

## Known and accepted

- **Drizzle is on `1.0.0-rc.4`, a release candidate, and that was a decision.** The stable line
  is 0.45, whose migrator applies every migration newer than the newest applied row rather than
  every migration the table is missing — so a file stamped earlier than something already applied
  was skipped **in silence, for good**. Two branches each generating a migration, older one
  merging second, is all it took, which is a thing a team does routinely rather than an exotic
  case. It was [#5316](https://github.com/drizzle-team/drizzle-orm/issues/5316) and
  [#5769](https://github.com/drizzle-team/drizzle-orm/issues/5769); 1.0 matches by folder name and
  set membership, which is what Rails has always done.

  A release candidate for the component holding other people's data is not a small thing to run,
  and the argument for it is that the alternative was worse: a known silent-data-corruption path
  in the migrator against a product with no users yet, where an RC is the cheapest it will ever be
  to adopt. The upgrade surface turned out to be small because this repository barely uses the
  ORM: no relational queries anywhere, so `relations()` was three declarations nothing called, and
  every read in `pgStore.ts` is an explicit `select` with its own join.

  What it cost: `drizzle({ client })` instead of `drizzle(sql, { schema })`, the three unused
  relation declarations deleted, the migration folder converted by `drizzle-kit up`, and
  `migrationReport.ts` rewritten around names instead of timestamps — which mostly meant deleting
  the guard that existed for the bug. Verified against a real Postgres: the full integration
  suite, the one-time table upgrade on a copy of dev's state, and the two-branch case actually
  applying.

  **Revisit when 1.0 goes stable**, which should be a version bump and nothing else.

- **`drizzle-kit push` asks to drop `__drizzle_migrations` and the schema with it.** The
  bookkeeping table lives in `blinkered` because `migrationsSchema` is `DATABASE_SCHEMA`, push
  diffs declared tables against the database, and that table is not declared. It refuses rather
  than proceeding, and nothing in the repository runs push — `dev-schema.ts` and the compose
  `schema` service both generate and then migrate. The hazard predates 1.0; removing `--strict`
  is only what made it visible. Moving the table to its own schema would settle it and is a
  separate change against two live databases.

- **Twenty languages ship under CC BY-SA**, because Wiktionary is the only clean validator for
  them: Armenian, Basque, Czech, Egyptian Arabic, Finnish, Galician, German, Hebrew, Icelandic,
  Irish, Italian, Japanese, Korean, Latin, Macedonian, Malay, Norwegian, Tagalog, Ukrainian,
  Vietnamese. That was five before the batch of twenty-five, and the store-build question grew
  with it — see the end of DICTIONARIES.md. No effect on the web build, where attribution is the
  whole obligation and we do it. Nothing anywhere is GPL.
- **Naijá is built from corpus frequency with no validator at all**, which is the one place the
  pipeline knowingly breaks its own rule, and it shows: twelve of fourteen unambiguous English
  probes are playable as Naijá. **Accepted, deliberately.** It cannot be fixed the way the other
  six were — Naijá is an English-lexifier creole, so `for`, `of`, `to`, `and` and `go` are core
  vocabulary spelled exactly as English, and an English blocklist would delete the language. What
  it needs is a Naijá lexicon and the largest one anywhere is en.wiktionary's 188 entries. It is
  there so that a colleague in Lagos finds their language in the menu, which was always the
  reason, and that reason survives a loose word list. Revisit if a lexicon turns up.
- **Yoruba, Hausa and Igbo are parked**, not blocked. The evidence for the diacritic decision is
  gathered and written up in LANGUAGES.md; the decision itself is deliberately not being taken
  yet. Naijá's own diacritic question rides along with it.
- **Six locales were written by someone who does not speak them** — Basque, Georgian, Armenian,
  Welsh, Irish, Naijá. Fluent and idiomatic as far as that goes. A native reader would be worth
  more than another pass by the author, and none is queued.
- **Malay is the weak one**, at 15% validation yield, and no cut fixes it: the Wiktionary
  validator is exhausted by rank 100,000, so a Malay player will be refused real words. Good
  enough to ship. Nick is asking Malay speakers where a better dictionary lives; when one turns
  up it is one entry in `tools/dictionary/src/manifest.ts` and a rebuild.
- **No service worker**, so no offline play. Offline is not something the game does on the web
  either, so it would be new behavior rather than parity, and the payload is every word list
  of which Russian, Turkish and Arabic are 8.5 to 9MB each. A stale service worker is also the classic way to serve last
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
- **the difficulty ladder**: retuned once from play, which said every level was a notch harder
  than its name. The number that did it was the window with the whole board face up,
  `holdTicks * speedMultiplier`, which used to run 6.4s, 2.4s, 0.9s, 0s: insane gave no thinking
  time at all and hard gave a glance, so the top of the ladder had nothing between its rungs. It
  now halves rather than vanishing, 9.0s to 1.8s, with the tick slowed across the board. Still a
  bid; `initialRounds` was deliberately left alone so the next play has one variable to speak to.
  `ENGINE_VERSION` went to 0.2.0 with it, and the leaderboard now groups on that, so scores set
  under the old presets are kept but no longer ranked against new ones.
- **whether letters change is now a difficulty, not a slider** (0.3.0). It shipped as one flat
  rate on the grounds that one guessed number beats four, and play said otherwise for a better
  reason than balance: with the letters fixed you can learn the board and carry a word list
  between rounds, and once they drift you cannot. That is a different game rather than a harder
  one, so `easy` has no letter swaps at all and the rate climbs to `hard` and stops. It stops
  because what a swap costs is a stale memorized list, and `insane` shows the full board for 1.8
  seconds, so there was never a list to go stale. Wild cards stay flat deliberately: moving two
  mechanics at once would leave the next play unable to say which one did what.
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
