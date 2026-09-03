# Accounts, history and leaderboards

The design for PLAN.md phase 4 and phase 6, written after reading what is actually in the repo
rather than what phase 4 was sketched as. [PLAN.md](PLAN.md) sections 2.3 and 2.4 are the older,
shorter version of this; where the two disagree, this one is later and knows more.

This is the change that ends "there is no server". Everything before it has been a static site
with the player's own browser as the only database. [DEPLOY.md](DEPLOY.md) currently says there
is nothing to back up and no secret to manage. That sentence is the cost of this feature, and it
is worth reading it once before starting.

## What is already true, and worth not rebuilding

More of this exists than it looks like, because the engine was written expecting a server.

- **Ranking is already a rule, not a view.** `compareResults`, `rankedResults` and `rankOf` live
  in `packages/engine/src/results.ts`, and the file says in its own comment why: "the same
  ordering has to hold when a server ranks a submitted score against everyone else's, and two
  implementations of which game was better would eventually disagree." The server imports those
  three functions. It does not write its own.
- **`GameResult` and `ResultGroup` are already the wire format.** Language, difficulty, engine
  version, canonical, seed, score, words, rounds, timestamp. Nothing needs adding for a
  leaderboard except who played it.
- **Grouping is already decided.** A board is per language, per difficulty, per engine version,
  canonical only. That is `rankedResults`, shipped and tested.
- **Board size cannot pollute a board.** `n` is an override, so a six-tile game is already
  `canonical: false` and already unranked. This was worth checking rather than assuming.
- **Replay already exists.** `replay(start, events, dictionary)` in `packages/engine/src/game.ts`.
- **The board is recoverable from the seed.** `generateBoard(config, seed, dictionary, alphabet)`
  is deterministic, so a server holding the seed holds the board.
- **The word lists already load in Node**, behind `@blinkered/words/node`.
- **The language guess already exists.** `guessLanguage()` in `apps/web/src/settings.ts` reads
  `navigator.languages` through `preferredLocale`. The account's default is that function's
  answer, not a new one.
- **Settings already keep the two languages apart.** `gameLanguage` and `uiLanguage` are separate
  fields, deliberately, with the reasoning written down. The account stores both. Collapsing them
  into one "preferred language" column would quietly undo a decision that was made on purpose.

## What is missing, concretely

Five things.

### 1. The client computes the score, and the server would be told it

`recordScore` believes whatever it is handed, which is correct for a table only its owner sees
and is the whole problem for a public one. The fix is in "How a score is checked" below, and it
is smaller than it looks: the client sends the words and the server does the addition.

### 2. The client picks its own seed

`App.tsx` generates the seed. The server should, so that a game is a server-side object with a
start time before it is a claim about a finished one, and so that a submission has something to
be idempotent against. Not load-bearing for score integrity any more, and cheap enough to keep.

### 3. Canonicality lives in the wrong package

`isCanonical` and `hasCustomRules` are in `apps/web/src/settings.ts`. The server has to agree
about what counts as a preset, and by `results.ts`'s own argument two implementations of that
will drift. It moves to `@blinkered/engine` as a function of `GameConfig`, next to `configFor`,
which is the thing it compares against. The web app then imports what it used to own.

### 4. There is no server, and the deployment assumes there never will be

Today: one nginx container, read-only root filesystem, 10m CPU and 32Mi requested, no secrets, no
state. After: a second Deployment running Node, a Postgres, a Traefik rule sending `/v1` to it,
a migration Job, and five or six secrets. The apex hostname stays one origin, which is what keeps
the browser session a same-origin cookie and means there is no CORS anywhere in this feature.

### 5. `apps/web` has no tests at all

`vitest.config.ts` includes `packages/*/test/**`, so the coverage gate at 100% covers engine,
words and i18n and covers nothing in the web app. The Playwright suite is still item 1 on
STATUS.md's list and does not exist. Every screen this feature adds lands in the one part of the
repo with no safety net, and the sign-up flow is the first thing in the game where getting it
wrong loses somebody's data rather than their round.

## Decided

### Sign-in is a six-digit code, Google, and Apple

No password. There is nothing to reset, nothing to leak, no breach list to check against, and no
credential stuffing to rate-limit. What it costs is a round trip to an inbox on every sign-in,
which is a real tax on a game people open for four minutes; a long-lived session is what pays it
back, so sessions are months, not days.

**A code, not a link, as the primary flow.** A magic link has to come back to the app, and on the
phone that means universal links, an associated-domains entitlement, and an
`apple-app-site-association` file served from playblinkered.com, all of which fail in the same
silent way: the link opens Safari, the player signs in there, and the app they were holding is
still signed out. A six-digit code typed back into the screen that asked for it needs none of
that and works identically on the web, in the WebView, and on a machine that is not the one
holding the inbox. The link can ship later as a convenience on the web, where it is easy.

**Sign in with Apple is not optional** once Google ships, under App Store guideline 4.8. Verify
that against the current guideline text rather than against this sentence; it has been rewritten
before. The organization Developer account it needs is already decided in STATUS.md.

Facebook is left out. It needs app review, business verification and a data-deletion callback,
for uptake that has largely moved to Google and Apple. It is one provider entry if players ask
for it.

**Every sign-in sends mail, so mail becomes a product surface.** SPF, DKIM and DMARC on
playblinkered.com, a sending service, and a bounce path. And the mail is in the player's
language, because we know it: one per locale, two templates.

### Avatars are generated, not uploaded

Deterministic from the user id, drawn in the game's own visual language rather than as a
photograph. No object storage, no CDN, no classifier, no report queue for images, no appeals, and
nothing to explain to a store reviewer. Uploads can be added later. They cannot be removed later:
the day after the first upload, deleting the feature means deleting somebody's picture.

This is the same trade the game already makes elsewhere, and it is worth being honest that it is
a trade. A generated avatar is less fun than a chosen one.

### The username is the only public identifier, and it is the real moderation problem

Bigger than avatars ever was, and much cheaper to forget.

- Unique case-insensitively, and on an NFKC-normalized form, so `nick` and the one with a
  fullwidth `i` are not two accounts.
- A reserved list: `admin`, `blinkered`, `support`, `moderator`, and the obvious neighbors.
- Length bounds, and a character set decided on purpose. Fifty-one interface languages argues for
  letting people write their own name in their own script; homoglyph impersonation argues the
  other way. Ship permissive with a confusable check against existing names, which catches the
  attack without telling a Greek player their name is invalid.
- **Renameable.** A name that cannot be changed is a name that has to be moderated perfectly the
  first time. A rename changes nothing about history, since games belong to a user id.
- A blocklist is not going to work across this many languages and pretending otherwise is worse than
  not having one. What works is a report button and the power to rename an account and tell its
  owner why.

### The bio ships short, plain, and link-free

140 characters, no markup, and no URLs, because links are the only thing spam actually wants out
of a profile field. It is still the largest free-text surface in the game and it still needs the
report button. Worth asking once whether it is wanted at launch or whether the country and the
language are enough of a profile for a word game.

### The country is picked by name and shown as a flag

ISO 3166-1 alpha-2, self-declared, optional, never geo-IP. Geo-IP is wrong often enough to be
insulting and is a tracking signal we would otherwise not be collecting.

**Picked from an alphabetized list of names**, and **shown, next to a username, as a flag.** The
two halves want different things and get to have them: choosing needs a list you can read and
type into, and a leaderboard row needs something that fits in the space a row has.

The worry about flags was that the game already uses them for _languages_, in a picker whose own
comment in `registry.ts` calls that "a compromise and worth naming as one", since a flag is a
country and those are languages. Showing a real country as a flag next to a person does not make
that worse. It is the correct use sitting next to the compromise, and the two never appear in the
same control.

Two implementation notes, because both are free and both are easy to do the hard way.

- **`Intl.DisplayNames`** gives localized country names from ICU, so nobody hand-translates 250
  names per locale, and **`Intl.Collator`** sorts them in the reader's own language,
  which is the difference between an alphabetized list and an English one. Alphabetical by the
  English name in a Greek interface is not a list, it is a shuffle.
- **Emoji flags do not render on Windows.** No flag glyphs ship with the OS, so Chrome and Edge
  draw the two letters instead: `GB`, `FR`, `ES`. This is not new and not caused by this feature.
  The language picker has it today and nobody has looked.

So the flags are SVG files, from **`flag-icons`**: MIT, copyright Panayiotis Lipiridis 2013,
v7.5.0 at the time of writing, 4.1MB unpacked for both aspect ratios plus the CSS, of which this
game wants only the 4x3 SVGs. MIT obliges one thing, that the copyright and permission notice
travels with the copies, so it is a `LICENSE` file beside them. Nothing like the CC BY-SA question
hanging over five of the word lists, and nothing a store build has to think about.

**They are emitted as files, not bundled into JS, and the reason is the one `vite.config.ts`
already gives for the word lists**: they live next to their own LICENSE, and a copy inside the app
would drift from it. Same plugin shape, emitting `dist/flags/xx.svg`. Payload is not the argument
and does not need to be; the audit is.

**Which settles the phone for free.** `capacitor.config.ts` sets `webDir: '../web/dist'`, so
everything Vite emits is inside the binary, exactly as the word lists already are. The web
fetches `/flags/hr.svg`, the phone reads the same path out of the bundle, and there is one code
path. It also has to be that way: the shell sets `limitsNavigationsToAppBoundDomains: true`, so a
flag on a CDN would not render on a phone at all.

Where a country has no file, fall back to the two-letter code. It is legible, and it is what
Windows has been showing all along.

**A note for phase A, from the same config.** Its comment already says it: "Anything that does
want the network later (accounts, phase 4) has to say so deliberately."
`limitsNavigationsToAppBoundDomains` has to change before the native shell can reach the API.
Better known now than found in Xcode.

### The account is authoritative on sign-in, local is authoritative while signed out

Both languages, the key scheme, and nerd mode come down from the account when a session starts,
and overwrite what is in `localStorage`. Signed out, `localStorage` is the whole truth, as now.
Any other rule produces a device that quietly disagrees with the account and a player who cannot
tell which one they are editing.

Guest play stays complete. Nobody is ever asked to sign in to play, and the local leaderboard
does not go away when the global one arrives.

### Account deletion is in the app, and the row goes with it

App Store guideline 5.1.1(v) requires in-app account deletion for any app that offers account
creation. It is easy to leave until last and hard to bolt on, because it reaches the leaderboard.

When an account is deleted, its leaderboard rows go. A board is a list of people, and a person
who left is not on it. The alternative, an anonymized tombstone holding first place, is worse on
every axis: it is a weaker answer to a deletion request, it puts a row on a public list that
nobody can be asked about, and it makes the board a museum. The all-time board getting shorter is
a consequence worth accepting.

### Age gate, privacy policy, export

This many languages means European players whatever the company's address is. That means a privacy
policy, a lawful basis, an export path and a deletion path, all of which are small if they are
designed in and expensive if they are retrofitted. A word game will also attract children, and
collecting an email address from an under-13 is regulated on both sides of the Atlantic. A
neutral age gate at sign-up, no accounts under 13, and guest play untouched, which is the answer
that costs a child nothing.

## The phasing, and why the leaderboard is not second

Three phases. The middle one is not about accounts at all, and that is the point.

### Phase A. Server, accounts, profile, history.

Hono on Node, Postgres, Drizzle, the three sign-in methods, the profile fields, generated
avatars, `GET /v1/me/games`, the game-over capture flow, local history import, account deletion,
the privacy policy, the age gate, and the deployment changes.

Scores in this phase are trusted, because the only person who sees them is the person who set
them. A personal history is a diary. Nobody forges a diary.

### Phase B. The balance simulator.

PLAN.md phase 2 and section 3, never built, and the only guessed numbers left in the repo. A bot
with a tunable skill model, meaning reaction time, vocabulary depth and willingness to hold out
for a longer word, plays thousands of games across every difficulty, word-complete mode and flip
economy, and reports per cell: median game length, score spread, words per round, and above all
the fraction of runs that never terminate, which is how a broken economy announces itself. The
difficulty tables, `wildChance` and `replaceChance` are all replaced by whatever it says.

It sits here rather than at the end for one reason: **`ENGINE_VERSION` gets expensive the moment boards are public.**

Today a bump costs a player their own local table, which is a shame. With global boards it wipes
every board in the game, in every language, at every difficulty, and there is no way to explain
that to somebody who was first. The engine is at 0.3.0 and STATUS.md still lists the difficulty
ladder, `wildChance` and `replaceChance` as bids awaiting exactly this simulator.

Opening public boards on numbers you already intend to replace is choosing to wipe them. Do the
measuring first, take the version bump while nobody is watching, and open the boards on numbers
that are meant to last.

### Phase C. Checked submission and leaderboards.

Server-issued seeds, the envelope check on submit, `leaderboard_eligible`, today and all-time
boards, the profile's leaderboard tab. See "How a score is checked".

## How a score is checked

Two things, and then a person.

**The client sends the words it found, not a score.** The server sums `wordScore` over them and
stores its own number. That is the whole mechanism, and it works here because of a property the
engine already has: `points = wordScore(length)` and nothing else. No letter values, no board
multipliers, no clock. `properties.test.ts` already asserts a game's score is exactly the sum of
its words' points, so the server is not approximating the client. It is running the same function.

**If a stupid score appears anyway, delete it.** A `hidden` column and an admin route. Do it twice
to the same person and delete the account.

That is the correct amount of defense for a word game, and getting there took two wrong answers
worth recording so nobody walks back up the same hill.

### The two wrong answers

**Full replay** was the first. The server holds the reducer, the client ships an event log, the
whole game is re-run against a server-issued seed. It works, and it costs an event log in the
client, the dictionary and anagram index resident per language, board regeneration, and 200 to
300ms of CPU per submission. All of that to defend a word game.

**A client-computed checksum** was the second, and it is worth writing down why it fails, because
it is the intuitive fix. Whatever key or hash the client uses ships in the bundle, and the client
computes both the score and the digest over it. Anyone who can open devtools can call that
function on an invented score and get a valid digest. It is not weaker than replay; it is nothing
at all, bought at the price of looking like something.

### What summing the words does not catch, and why that is fine

It stops the thirty-second attack: open devtools, find `score`, change it. That is the only attack
that will actually happen.

It does not stop somebody who fakes a whole game, and it is worth knowing exactly how badly,
because the number is funny. The flip economy is unbounded under `fibonacci`: `flipReward` **is**
`wordScore`, so a twelve-tile word pays back 144 flips and costs 12 reveals. The ledger never
closes, so nothing in the arithmetic caps how many rounds a game can claim. A forger claiming one
twelve-letter word per round for an hour claims about 21,600 points.

Which is the argument for the delete button rather than against it. A real game scores under a
hundred. **A fake big enough to be worth faking is a fake you can see from across the room**, and
a board with a few dozen players on it is a board somebody reads. Closing that hole automatically
means reconstructing the board server-side, which means the dictionary and the anagram index and
the seed pool and, because letter replacement moves the board mid-game, most of replay coming back
through the window it was shown out of.

The same goes for bots, permanently. The word lists are a public download and the engine is
deterministic and documented, so a script that solves the board as it turns produces a game that
is valid because it is valid. No amount of server-side checking touches that. A report path and
the willingness to remove an account do.

### The tile count, which will bite silently

`wordScore` takes a **tile** count, not a character count, and `reducer.ts` says so in a comment
at the point where it matters. The server segments each submitted word with `alphabetFor(language)`
before scoring it. Get this wrong and English is perfect, Croatian under-scores every word holding
LJ, NJ or DŽ, and the only people who can see the bug are the ones least likely to be asked.

### Whether to check the words are real at all

Optional, and worth a moment. Without it the server needs no dictionary whatsoever: it imports
`wordScore` from the engine and nothing else, no word lists, no table, about twenty lines.

With it, the server needs the words in a `(language, word)` table, loaded once by a migration,
and validation is a query rather than a resident heap. What that buys is that the found-words
list on a public profile is trustworthy. What it costs is one migration.

Worth having if found words are shown publicly. Not worth having for score integrity, which the
sum already covers.

### Cloudflare, and what it is and is not for

It is in front already, and what it does for the word lists is a deployment fact rather than an
accounts one: [DEPLOY.md](DEPLOY.md) has the cache rule and the measurements. What matters here is
what it will and will not do for this feature.

**What it genuinely fixes is the mail.** `POST /v1/auth/code` sends an email to any address handed
to it. Unprotected, that is a free mail-bombing button pointed at strangers, and the collateral is
worse than the nuisance: the bounces and complaints land on playblinkered.com's sending
reputation, and a domain that gets itself blocked cannot sign anybody in at all. Turnstile on that
endpoint, and on sign-up, is the highest-value item in this whole section. Rate limiting on
`/v1/usernames/:name`, which enumerates, is the second. Neither exists yet, because neither
endpoint does.

**What it does not fix is a bot playing the game.** The threat is a userscript in a real browser,
on a real session, from a real person's address, submitting a real result. There is nothing at the
network layer to detect, because the cheating does not happen at the network layer.

**`CF-Connecting-IP` is a header, not a setting.** Cloudflare already sends it. The work is at the
other end: the API reads it rather than the socket address, or every rate limit becomes one bucket
for the entire world. And it is only trustworthy while the origin cannot be reached directly,
since anything bypassing the proxy can invent one. Both become true the day there is an endpoint
worth rate limiting.

## Schema

PLAN.md 2.4 with the gaps filled. Drizzle, Postgres.

```
users             id, username, username_normalized, country, ui_language, game_language,
                  bio, avatar_seed, created_at, deleted_at
auth_identities   user_id, provider (google|apple|email), provider_account_id,
                  email, email_verified_at
sessions          id, user_id, kind (cookie|bearer), expires_at, revoked_at
login_codes       email, code_hash, expires_at, consumed_at, attempts
games             id, user_id, seed, status, source (web|ios), imported,
                  difficulty, language, canonical, n, speed_multiplier, initial_flips,
                  w_min, min_word_len, word_complete_mode, flip_economy,
                  charge_full_round, wild_chance, replace_chance,
                  letters, score, words_count, flips_used, rounds_played,
                  engine_version, dictionary_version,
                  leaderboard_eligible, hidden, started_at, finished_at
game_words        game_id, word, tiles, points, round_index
words             language, word          (optional; only if found words are shown publicly)
reports           reporter_user_id, subject_user_id, field, reason, created_at, resolved_at
```

`login_codes` stores a hash, not a code, for the same reason a password table would.

`hidden` is the moderation lever, and it is the whole anti-cheat apparatus: a score that is
obviously a lie stops being on the board, and the game it came from stays in its owner's history
where it can do no harm. Reversible, which a delete is not.

`words` is the dictionary if it is wanted at all; see "Whether to check the words are real".
`game_words` holds tiles rather than characters, because that is what scores.

`started_at` is written when the server deals the game, not when the client says so, which is
what makes the elapsed-clock check mean anything.

**The leaderboard index has to mirror `compareResults` exactly.** That function is score
descending, then rounds ascending, then timestamp ascending, and any `ORDER BY` that differs from
it produces a board that disagrees with the ranking the client computes from the same rows. So:

```
(language, difficulty, engine_version, score desc, rounds asc, finished_at asc)
  where leaderboard_eligible
```

and `(user_id, finished_at desc)` for history.

Today's board is `finished_at >= date_trunc('day', now() at time zone 'utc')`. **The day is
UTC**, said out loud in the interface. A local day makes the board different for every viewer,
which means it cannot be cached and means two players comparing screens disagree about who is
on today's board.

At this scale the boards are a query. Materializing them is a thing to do when a query says so.

## Routes

Same origin, under `/v1`, which is one Traefik rule and no CORS.

```
POST   /v1/auth/code            email -> sends a six-digit code
POST   /v1/auth/code/verify     email + code -> session
GET    /v1/auth/:provider       google | apple
POST   /v1/auth/signout
GET    /v1/usernames/:name      availability, rate-limited, because this enumerates
POST   /v1/me                   create the profile: username, country, languages
PATCH  /v1/me                   edit it
DELETE /v1/me                   account deletion, in-app, required
GET    /v1/me/games?cursor=
POST   /v1/games                -> { gameId, seed, config }   the server picks the seed
POST   /v1/games/:id/finish     -> { words, rounds }  scored by us, stored
POST   /v1/games/import         the local store, on sign-up. History only, never eligible
GET    /v1/leaderboards/:language/:difficulty/:period    phase C
POST   /v1/reports
```

Sessions are an httpOnly, Secure, SameSite=Lax cookie on the web, so the browser never holds a
token in JavaScript, and a Bearer token in Keychain in the native shell. That split is PLAN.md's
and it is right; it is also the fiddliest part of the phase and deserves the spike PLAN gives it.

## The game-over flow, which is the whole point of item 6

A guest finishes a game. `Finished` already holds the result, the words, and the board's letters.
The screen offers to keep it.

**Sign-up renders over the game-over screen, not in place of it.** This is not a preference; it is
a trap already sprung once in this codebase. App.tsx carries the note: returning the rules instead
of the shell unmounted the game, so coming back mounted a fresh one on the same seed and the
player lost the word they were holding. A sign-up that replaces the game-over screen loses the
result it exists to preserve, and it loses it in the failure case, where the mail did not arrive
and the player backed out.

Then: username, country, preferred language defaulted from `guessLanguage()`, and the avatar is
already generated. Four fields, one of which is prefilled and one of which is a picklist.

**The score that is preserved is history, not a leaderboard entry**, in phase B, and in phase D
for any game the server did not deal. Say so at the moment of capture rather than letting the
player discover it on a board they are not on. In phase D a guest's game can go through
`POST /v1/games` like anyone else's, and then the preserved score is eligible, which is the
version of this feature worth having.

**Offer the whole local store, not just the last game.** `recordScore` keeps up to 500 results,
trimmed per language and difficulty, and somebody's twentieth-best game is still theirs. All of
it imports as history, none of it as eligible, because none of it was ever dealt by a server or
logged. One sentence at import time, and it never has to be explained again.

## The leaderboard is 128 boards, and most of them are empty

Four difficulties, fifty-one languages, two periods, per engine version. That is the grouping
`rankedResults` already enforces and it is correct: a Greek board admits well under half what an
Italian one does, so a single table would be a table about languages.

It is also a lot of empty rooms at launch. So the screen opens on the board the player just
played, empty boards say they are empty rather than being offered as a menu of disappointments,
and the local table stays where it is for the player who is the only Finnish insane player in the
world.

**One row per player per board, their best game.** Otherwise one strong player owns the top ten
and the board stops being a leaderboard and starts being a profile.

## The part that is easy to forget

Every string in this feature exists once per locale. Sign-up, sign-in, the code screen, the profile,
history, the boards, every error, every moderation message, and two email templates. That is
roughly 85 to 100 new messages against the 166 the game has now, so it grows i18n by more than
half.

PROPOSALS.md makes this point about the help page and it is the same point: the feature works
without it, and the last translation is never the interesting part of the day.

The rules page needs nothing. Accounts do not change what a word is worth.

## The database, now that it is in the cluster

`postgres.enabled: true` and the StatefulSet the chart already has. The seam that would let a
managed database in is the same one that lets this out, so the decision is reversible and costs
a values file.

**Replication and durability are different purchases, and only one of them is wanted yet.**

A three-node streaming cluster buys **availability**: a node drains, a replica is promoted, and
the API sees a few seconds of errors instead of however long a pod takes to reschedule. With no
users, that is worth close to nothing.

It buys no **durability** at all. Three replicas of a corrupted table are three corrupted tables,
and `DROP TABLE` replicates in milliseconds. What buys durability is continuous WAL archiving to
object storage plus scheduled base backups, which together give point-in-time recovery — and PITR
is the thing that made Neon attractive in the first place. Losing a month of everyone's history
is a real loss; ninety seconds of downtime during a node drain is not.

So: **one instance, with PITR, before three instances without it.** In that order, and the second
is a switch rather than a project.

An operator is the way to get both. CloudNativePG describes a cluster, its backup schedule and
its WAL archive in one manifest, and `instances: 1` to `instances: 3` is a one-line change with
no application impact — precisely because the chart already treats the database as an interface.
Doing it by hand in a StatefulSet means writing failover, and writing failover is how you get an
outage caused by the thing that was supposed to prevent one.

**Two facts about tl-prod decide whether one instance is enough, and I cannot see them from
here:**

- **Is the volume network-attached or node-local?** Network-attached (Longhorn, Ceph, NFS) and a
  single instance reschedules onto another node by itself. Node-local and a lost node is downtime
  until it returns, which moves three instances from luxury to insurance.
- **Is there object storage on the cluster** — MinIO, or an external bucket — for the WAL archive?
  Without somewhere to put it there is no PITR, and then the honest options are a managed
  database or a backup job whose restore path someone has actually tried.

The second question is the one that matters. A backup nobody has restored is a hope.

## Still open

- ~~**Does a rename rewrite history?**~~ Yes. The board joins `users`, so a score set as `nick`
  shows under `trout` the moment `nick` becomes `trout`, and an old screenshot disagrees with the
  live board.

  The screenshot is the weakest argument on either side. The decisive one is **account
  deletion**, which this design promises: if the username were copied onto each game row at
  submit time, deleting an account would leave that name scattered across every row the person
  ever wrote, and there would be no single place to redact it. A live join means identity is the
  account and the name is one column. It also means renaming actually works as a remedy — a
  handle you regret is not one you can shed if history keeps it.

  The cost is rename-squatting: reach the top of a board, rename to something ugly, and the board
  carries it. That is the same problem as the bio and has the same answer, `reports` and a
  moderator, rather than a different data model.

- ~~**Is the bio wanted at launch?**~~ Yes, with a profile page, and the bio is editable. Content
  controls come later; `reports` is already in the schema for when they do.

  **The bio is text and is never markup.** Stored as text, rendered as text, length-capped. React
  escapes by default, so the ways this goes wrong are all deliberate: `dangerouslySetInnerHTML`,
  auto-linking by parsing what somebody typed, or the bio reaching a surface React does not
  render — an `og:description`, an email, a PDF. If links are ever wanted they get built from an
  allowlist, not by finding them in the string. This is not the same question as avatars: avatars
  avoid hosting a _file_, and a bio is a short string in a column.

- ~~**Neon or in-cluster Postgres.**~~ In-cluster, on tl-prod. The chart already treats the
  database as an interface with two implementations — `postgres.enabled` and a seven-key secret —
  so this is a values change rather than a design one, and Neon stays available behind the same
  seam if it is ever wanted. What does **not** carry over for free is the reason Neon was
  attractive: backups and point-in-time recovery. See below.
- ~~**What the coverage bar for `apps/server` is.**~~ 100%, the same as everything else, and it
  already is. A quieter bar for the one component holding other people's data would be exactly
  backwards.

  The rule that goes with it: **an ignore pragma is never added unilaterally.** If a branch looks
  untestable the likeliest explanation is a design fault wearing a disguise — a default that
  cannot happen, a null check the types already forbid, an error path with no caller — and
  suppressing it hides the fault instead of removing it. Bring the line and the reason, and we
  decide together.

- ~~**Whether guest games should reach the server in phase A already.**~~ No. A guest's games
  stay in `localStorage`, where they already are, and nothing anonymous is uploaded.

  **But a sign-in on the game-over screen claims the game that is on it.** That is the one moment
  a score stops being anonymous, and losing it there would be the worst time to lose it — it is
  the score that just persuaded somebody to make an account.

  One consequence to carry into phase C: **a claimed guest game is never
  `leaderboard_eligible`.** Phase A trusts scores because a personal history is a diary and
  nobody forges a diary, and that stays true for a claimed game. A leaderboard entry is a
  different object: it needs a server-issued seed and the envelope check, and a game played
  before the server knew it existed has neither. It belongs in the person's history and not on a
  board, and the column for saying so is already there.
