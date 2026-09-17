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

### Only a 401 means signed out

The third state the client needed, and it is a product decision rather than a caching one.

`GET /v1/me` answering is how the app learns who it is talking to, and every way of that failing
used to come back as the same `null`: signed out, refused, API not deployed, and no network at
all. On the website that was a fair trade, because a browser with no network has no app to be
signed in to. The native shell changes the premise -- the bundle is already on the device, so a
player can sit with no network for a whole game -- and there `null` renders somebody as **signed
out while their session is still perfectly good.** They would report it as the app losing their
account, and they would be right.

So `whoAmI()` answers three things instead of two:

- **`signed-in`**, on a 200. The profile is cached in `localStorage` as a side effect.
- **`signed-out`**, on a **401 and nothing else**, because only the server can know that. This is
  the one case that clears the cache.
- **`offline`**, for everything else that stops us finding out: no network, a 500, a 502, a build
  served with no API behind it, or a body that will not parse. It carries the cached profile, or
  null if this device has never seen one.

Three consequences worth stating, because each one is a place the obvious implementation is
wrong:

- **The cache has no expiry.** A session's lifetime is the server's business and it already
  enforces it: the credential stops working, `/v1/me` answers 401, the cache is dropped. A second
  copy of that rule here would be wrong in the one direction that matters, signing somebody out
  while they are offline. Staleness is bounded by the next request that gets through, so the
  visible cost is a name edited on another device showing stale until this one can ask.
- **Languages come down from the account on a live answer only.** An `offline` answer is not a
  sign-in; it is this device remembering one, and those languages were adopted when it was live.
  Applying them again would overwrite a language somebody picked while offline, which is the
  device disagreeing with itself rather than with the account. The rule above is unchanged.
- **It fixes `games.imported` for an offline player.** `beganAsGuest` is `account === null`, so
  before this a signed-in player who lost the network had their game filed as a guest import --
  untrue, and the exact mislabeling `account/importing.ts` records as the first version's
  mistake. Cached identity makes it correct without a second rule, and the state is seeded
  synchronously at mount so a slow answer cannot open that window either.

### What reaches a board, and the three rules that decide it

`leaderboard_eligible` existed from the first schema and **nothing ever wrote it**, so it was
false on every row and any board reading it was empty by construction. The column is now set on
import, in one expression, and that is the only place it is written:

```ts
leaderboardEligible: game.canonical && game.score > 0 && !game.paused
```

- **Canonical.** A custom-rules game is a real game somebody played and is not comparable to a
  preset one. It is kept and shown in their history; it has no board.
- **A score above zero.** Zero is what an abandoned game scores and what a bad one scores, and a
  board with a tail of noughts has stopped ranking anything.
- **A clock that never stopped.** Nick found the exploit and it has no technical fix: screen-cap
  the board, pause, pick the words out of the photograph at leisure, resume, miss nothing. iOS
  cannot hide a view from a screenshot on request, and a second phone photographing the screen
  defeats anything that could --- so the game declines to rank a game whose clock stopped instead
  of pretending to prevent the capture.

  **The tab going away counts too**, which is the part worth arguing. Pausing by hand and
  switching apps stop the clock identically, and the second is the _easier_ route: leave the game,
  study the screenshot in Photos, come back. A rule that only counted the Pause button would have
  a hole in it the shape of the home gesture. The cost is real and falls on honest players: a
  phone call mid-game closes the board to that score. The veil says so while it is happening,
  because afterwards it is a penalty nobody was told about.

  It is reported by the client, like everything else in phase A, and worth what the client is
  worth. The point is not that it cannot be lied about but that the honest path is closed; phase
  C's event log is what makes it checkable.

- **`imported` does not enter into it**, and that reverses what this file used to say. A claimed
  guest game was never eligible, on the argument that a board entry needs a server-issued seed
  and the envelope check. In phase A **neither exists**, so the rule excluded one of two
  indistinguishable things: a signed-in game and a claimed guest game are both client-seeded and
  both re-scored on the server from the words. It was also self-defeating, because the score that
  persuades somebody to sign up was the one score that would not count.

Phase C is where the distinction becomes real -- a server cannot have dealt a seed to a game it
never knew about -- and at that point the change is to this expression rather than to any query.
That is the whole reason for writing a column instead of filtering at read time.

**The games played before the column was written were backfilled once**, in both environments, by
the same rule rather than by hand:

```sql
update games set leaderboard_eligible = true
where canonical and score > 0 and not leaderboard_eligible;
```

Dev took one row and prod five. One prod game stayed out --
`MkxsSSz-gvetTJK3rd3FqA`, en/insane, 93 points -- because it was played on a custom ruleset, which
is the first rule above and not an accident of the backfill. Nick asked for "all scores" and this
is the reading that keeps a board comparable; flipping that row as well is one `update` away if he
wants it.

Two things to know if this ever has to be done again. **The board also requires the game's
`engine_version` to match the running one**, so a backfill after an engine change makes rows
eligible without making them visible; every row in both databases was `0.3.0`, which is why this
one worked. And **the rows changed are recorded in the commit** rather than only in the column, so
the operation can be undone: the ids above are the whole set.

### The board is an address, and its language is the page's

`GET /v1/leaderboard/:language/:difficulty`, public, top ten, `?limit` up to a hundred. The
screen is at `/l/en/insane`, which nginx serves through the same rule as `/g/` and `/u/`.

**Both parts are in the address rather than in state.** A board is the most shareable thing the
game has, and "look at the Finnish insane board" has to survive being pasted. It also makes both
selectors navigation rather than filtering, so Back walks through the boards somebody looked at.

**The board's language is the page's language**, which is not how the rest of the app works:
everywhere else the interface is whatever the reader picked in settings. Here it follows the
board, because a board is a link sent to a player of that language, who should not have to read
English to see where they rank. It touches nothing in settings -- a reader whose interface is
Greek sees a Finnish board in Finnish and is still reading Greek everywhere else.

The engine version is **not** in the URL and is not the caller's to choose. Scores set under
different rules are not comparable, which is why `games_leaderboard_idx` carries the column, so a
board is always the current engine's and an old score stops being ranked rather than ranking
wrongly. A URL that could name a version would be a URL that could ask for a board nobody can
still play into.

Two strings, because everything else already existed in fifty-one languages and is reused:
`gameLanguage` and `difficulty` label the selectors, `difficultyNames` fills one, `score` and
`columnRounds` head the columns, `gamesLoading` covers the wait, `backToGame` is the way out.

### The title bar is the tightest row, and a medal proved it again

The way to a board from anywhere is a gold medal in the title bar, going to **the board for what
is currently selected** -- the only default that needs no explaining. Both parts stay in the
address, so the page's own selectors can move from there and the link stays shareable.

An icon rather than a word, and hidden below 23rem, both for the same reason: that row is the
most expensive thing on a small screen. IOS.md records it taking 108px of a 568px iPhone before
the language picker's label was dropped, and adding the medal **put the account button back onto
a third row at 320px** -- the exact regression that note records fixing, where the third row is
what pushed Complete word off the bottom.

Measured rather than guessed. At 320px the bar has 288px of content width; row two spends 234 on
the picker, the nerd toggle and the medal; the account button needs 75. The medal's 44 plus its
gap is precisely the deficit. Moving it beside How to play does not help, because that row is
already 260 of 288 and it wraps straight back down. Shaving the picker would have bought eight
pixels and still lost in Spanish, where Sign in is "Iniciar sesión".

So it went at 23rem rather than the 30rem this stylesheet uses elsewhere, because the row fits at
390px and most phones are wider than 368. What is lost there is one route rather than the
feature: the board is still reached from the link under a finished game, which is where it means
the most.

**The rule had no effect when first written**, and the reason is worth remembering: a media query
carries no extra specificity, so `.board-link { display: none }` inside one loses to
`.board-link { display: inline-flex }` written later in the file. It matched, it was in the
stylesheet, and the element stayed visible. Only reading the computed `display` found it.

**And then the whole approach turned out to be wrong**, which Nick saw by doing the one thing no
breakpoint survives: dragging the window. A wrapping row of six controls rearranges itself as it
narrows -- the account button alone on a second line, the medal and the toggle changing places --
and "it fits in two rows" is not the same property as "it stays where it is". What he wanted was
the controls getting narrow and staying in the header, always.

The row does not wrap any more. It sheds detail in a fixed order until it fits, and which step it
lands on is measured rather than written down, because the answer is different in every one of
the fifty-one languages. `fitRow.ts` and the `[data-fit~='...']` rules in `styles.css` are the
two halves; IOS.md, "One row, measured", has the order and the two layout facts that had to be
true first. The 23rem rule is gone: the medal is now the last thing to go rather than a width,
and in English it survives to 360px.

"nerd mode" is part of the same sequence: the face stays at every width, the words go to the
accessibility tree, and the `title` explains it to a pointer.

### Every page that is not the game has the same head

There were five heads. The rules page spelled "Blinkered" as plain text over a lead line and put
its Back button under the heading; the board page had a title and a text link; the account and
player pages had an avatar, a name and a button called something else; the moderation panel had
its own. The player page's way home read "← Play Blinkered", in English, in all fifty-one
languages -- which is what happens to a string nobody who reads English ever sees.

Nick asked whether there was a reason. There was not: they were written one at a time, each
solving its own way home, and no two of them agreed.

`PageHead.tsx` is now the head on all of them: the wordmark at the start, the page's own controls
after it, one labelled way back at the end, on one line at every width by the same measurement the
title bar uses. Two things about it are decisions rather than plumbing:

- **The mark is the game's own tiles, standing still.** `Title` grew a `still` mode rather than
  these pages growing a second wordmark: same tiles, same type, same spacing, no animation. A
  nine-tile shuffle replaying every time somebody opens a leaderboard is a flourish charging rent,
  and these pages are read rather than entered. In that mode it is also not an `h1` -- the page
  has its own heading, and a document with two titles is a document with none.
- **The label comes from the caller, not from `Messages`.** The board page's head has to speak the
  board's language rather than the reader's, and the moderation panel is deliberately English.
  A head that reached for `messages.backToGame` itself could do neither.

### Three routes for the app, and the two secrets they trade in

The shell signs in through `POST /v1/auth/native/nonce`, `POST /v1/auth/native/apple` and
`POST /v1/auth/native/exchange`. `docs/IOS.md` has why a browser flow cannot work there; this is
what the server ended up holding.

**One new table, `native_handshakes`, with a `kind`.** Two secrets, the same shape --- a random
string the server issued, good once, for a few minutes --- so one table rather than two that would
drift. A `nonce` is issued before the app asks Apple for a credential; a `handoff` is written at
the end of a native Google callback and carried to the app in the custom-scheme URL. The hash is
the primary key, never the secret, exactly as `sessions` and `login_codes` do it.

**Spent in the statement that reads it.** `consumeHandshake` is one conditional
`UPDATE ... RETURNING` with the expiry, the kind and `consumed_at is null` all in the condition.
Read-then-write is a race whose prize is a second session: two requests presenting the same secret
both pass a `select`, and both go on to mint a token. One `update` lets exactly one of them see a
row.

**The nonce is hashed twice, differently.** The row is keyed on `hash('nonce:' + secret)` and the
value the app shows Apple is `hash(secret)`. Both derive from the same string, and separating them
means the value travelling inside a signed token other software gets to see is not also the key to
the row that authorises it.

**The audience is the one field that differs from the web.** A native Apple credential is minted
for the App ID and a web one for the Services ID, so `appleNativeProvider` is the web provider with
`clientId` swapped. `oidc.ts` calls that check the security of the whole feature and it is right:
accepting either audience on either route would mean a token issued to one client signs somebody in
through the other.

**A year, in one place.** `bearerSession` writes the session for all three ways into the app --- a
mailed code with `native: true`, a native Apple credential, a Google handoff --- so three doors
cannot drift into three different session lifetimes.

### The conversion problem, and the two things aimed at it

One signup in production besides Nick's own, which says the offer of an account was not reaching
anybody. Two changes, and the second is much the stronger:

**A last screen on the tour**, saying what an account is for, with a button that opens the same
`SignInDialog` as everywhere else. Not a second sign-in surface inside the tour: that would need
its own validation, its own code step, its own errors in fifty-one languages, and would give the
tour a way to fail halfway through.

**Taking the offer ends the tour**, and that is not a nicety. The dialog is a `.modal` and the
tour is a `.tut-modal`, which sits above it deliberately, so pressing Sign in on the last screen
opened the dialog _underneath_ the card that offered it: the only way to reach it was to press
Start playing first. Two stacked modals is the bug and raising one above the other would only
have hidden it, so the button closes the tour through the same `onDone` that Start playing uses --
which also keeps the "don't show this again" box meaning what it says for somebody who ticks it
and then signs in.

It went in badly twice before it went in well, and both mistakes are about the screen _before_
it. The tour's rules screen used to read "That is the whole game" over "Pick a level and play",
so adding a screen after it announced an ending and then did not end. The first fix was to delete
the new screen and fold the offer onto that one, which was the wrong end of the problem: it left
a card carrying a board, a closing line, a pitch, a button, a checkbox and the navigation, and
the pitch sat in the middle of a send-off. The answer was to stop the rules screen talking like
the last screen -- it is headed "Those are the rules" now and its body keeps only the standing
fact, that how to play is always in the title bar. Nothing announces an ending until the ending,
which is the `Start playing` button itself. **A screen that says the tour is over has to be the
one that is over.**

**The projected board on the game-over panel**, which is Nick's idea and better than the slide.
A paragraph asks somebody to imagine a reason to sign up; this hands them one they can see --
their score, in the board's own shape, third from the top among named strangers.

Three things keep it honest, and each is a case where the obvious version misleads:

- **It says "would".** `leaderboardWouldBe` heads it, because a row drawn among real rows and
  left unlabelled reads as a result that already counts, and for a guest it counts for nothing
  until they sign in. The projected row carries no game id and so is not a link.
- **It renders nothing unless the score places.** Not for a custom ruleset, not for a board that
  could not be read, and not for a score outside the visible five. An inducement that appears
  whatever you scored is an advertisement, and "you would be eleventh" is an argument against
  signing up.
- **The row shares one component with the real board.** The effect depends on looking like the
  thing it is a projection of, and two copies of that markup would drift the first time either
  was touched.

The ranking is restated on the client rather than calling `compareResults`, which compares two
`GameResult`s where one side here is a board row with no engine version, seed or word list.
Getting it wrong would show somebody a rank they will not get and nothing would look broken, so
the agreement with the server's order is asserted in `apps/web/test/boardPreview.test.ts`.

### A guest's game is queued before anybody signs in, because the provider reloads the page

The bug Nick hit: play signed out, sign in to keep the game, and the game is not kept.

**Signing in with Google or Apple is a full page navigation.** The browser leaves for the
provider and comes back to `/?signin=ok`, and the app is torn down and rebuilt in between. The
upload was reached from `finished`, which is React state, so by the time the account existed the
finished game did not. The effect found nothing and did nothing, silently.

The email code never had the problem, because its dialog keeps the page alive. That is why this
survived: the path that worked was the one that got tested, and the comment that should have
given it away is right there in `App.tsx` on the SSO return -- "the `whoAmI()` on arrival finds
the account the same way it does after a reload".

It is the same shape as the half-written report, which `reportDraft.ts` already solved for the
report button by putting the draft in storage before navigating. Games had no equivalent.

So a finished game is queued **the moment it finishes**, signed in or not, and an entry may carry
`userId: null`, meaning nobody owns it yet. `claim` hands every unclaimed entry to the account
that arrives, and it runs whenever one appears -- a code typed into the dialog, or a return from a
provider on a page with no game in it at all.

Two things bound that, and the second is the one worth stating:

- **An unclaimed entry is sent for nobody.** `queuedFor` matches an owner exactly, so a drain
  cannot post a guest's game to an account until it has been claimed.
- **Unclaimed entries expire after thirty minutes.** "Whoever signs in next owns it" is right for
  the person who just played and wrong for the next person to use a shared browser, and only time
  tells those apart. Longer than the ten minutes `reportDraft.ts` allows, because keeping a game
  is a decision somebody may sit and think about.

One gap left, recorded rather than papered over: **the enqueue at game end is not driven through
a real game in a browser.** `overFixture` builds no `keepable`, so `?fixture=over` cannot reach
the upload path, and giving it one would mean opening that URL while signed in uploads an invented
game to your account. The claim half is driven end to end; the enqueue half is a one-line
condition with unit tests behind it.

### A finished game is queued, not posted

The second half of the offline design, and the half that needed a column.

Before this the upload was one attempt at the moment the game ended, and `App.tsx` said so:
"Nothing is shown if this fails. The game is in `localStorage` either way." Both clauses were
true, and together they meant a game finished with no network stayed on the device forever,
because nothing ever tried again.

So a finished game now goes into a queue in `localStorage` (`pendingGames.ts`) **before** anything
is sent, and a drain empties it. The drain runs at three moments, and all three are cheap because
a drain with nothing waiting sends no requests:

- when a game finishes,
- on the `online` event, which is the closest thing a page gets to "a connection is restored",
- and on mount, which covers the app being closed with games waiting and opened somewhere else.

**`games.client_key` is what makes that safe.** A retry whose response was lost is
indistinguishable from a second attempt, so without a key the only options are a duplicate row or
a guess from the timestamp, and a guess is how a history grows a phantom game. The key is sixteen
random bytes from the device, the server never interprets it, and a partial unique index on
`(user_id, client_key)` decides. `insertGame` uses `on conflict do nothing` and then reads the
existing row, rather than checking first and inserting second, because the check-then-insert
version has a window that two tabs can both get through.

The route answers **201** when it created a row and **200** when the game was already stored,
both carrying the stored id. A draining device needs to tell "I took this" from "you have this"
without either being an error.

Four decisions in the queue that are not obvious:

- **A 400 drops the entry.** Every other failure leaves it. A submission the server calls
  `bad-game` will be called that identically forever, so retrying it at the head of the queue
  blocks every good game behind it, and one lost game becomes all of them.
- **Each entry carries the account it belongs to.** One device can be signed in as two people
  over its life, and a queue drained without checking would post the first person's games to the
  second person's account. Clearing the queue on sign-out would also prevent that, and would
  throw away games that are nobody's to throw away.
- **Serial, not parallel.** A phone that has just regained a flaky connection should not open two
  hundred requests, and "stop at the first failure" only means something if there is a first.
- **Two hundred entries, oldest dropped.** Lower than the 500 in `scores.ts`, because these hold
  the whole submission rather than a summary. Reaching it means two hundred games finished
  without ever regaining a connection.

The scored history is unaffected: `scores.ts` still records every finished game the moment it
ends, signed in or not, so the local leaderboard never depended on any of this.

### Offline needed one new string, not a family of them

The instinct is a set of offline messages: one for a blocked save, one for a blocked report, one
for the game-over panel. That is fifty-one translations each, and it was the wrong instinct.

`serverBusy` already reads "Could not reach the server. Try again in a moment." in every language,
which is exactly true with no network, and `AccountScreen` already renders it for every refused
save -- both `unavailable` paths map to it. A second key saying the same thing would be the
duplication the note on `deleteAccount` argues against, and it would drift.

So there is **one** new key, `offline`, and it is a badge rather than a sentence: a grey dot on the
account avatar, with the word joining the trigger's `aria-label` so a screen reader says
"clever-beacon-1267 (Offline), menu button". The dot itself is `aria-hidden`, because the fact is
already in the label and saying it twice makes a control announce itself as "Nick offline offline".

It marks the state and disables nothing. Every item in the menu still works, and the ones that
need the network fail the way they already did. The alternative, greying out what cannot work,
needs the app to predict which actions those are, and it would be wrong the moment a connection
came back without an `online` event to announce it.

Not red. Offline is a state, not a fault, and red in this interface means Ban.

Checked in a browser rather than only in tests, because the three states are the feature: a
cached account with no API renders as signed in with the badge; a 200 clears the badge and
refreshes the cache to the name the server now holds; a 401 clears the cache and shows Sign in.
The badge was read back in Japanese, Turkish and Finnish.

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
                  bio, avatar_seed, created_at, banned_at, is_admin
auth_identities   user_id, provider (google|apple|email), provider_account_id,
                  email, email_verified_at
sessions          id, user_id, kind (cookie|bearer), expires_at, revoked_at
login_codes       email, code_hash, expires_at, consumed_at, attempts
games             id, user_id, seed, status, source (web|ios), imported,
                  difficulty, language, canonical, n, speed_multiplier, initial_flips,
                  w_min, min_word_len, word_complete_mode, flip_economy,
                  charge_full_round, wild_chance, replace_chance,
                  score, words_count, rounds_played,
                  engine_version, dictionary_version,
                  leaderboard_eligible, hidden, started_at, finished_at
game_detail       game_id, version, detail (jsonb: boards[{tiles, wilds}], words[])
words             language, word          (optional; only if found words are shown publicly)
reports           reporter_user_id, subject_user_id, field, reason, created_at, resolved_at
```

`login_codes` stores a hash, not a code, for the same reason a password table would.

`hidden` is the moderation lever, and it is the whole anti-cheat apparatus: a score that is
obviously a lie stops being on the board, and the game it came from stays in its owner's history
where it can do no harm. Reversible, which a delete is not.

`words` is the dictionary if it is wanted at all; see "Whether to check the words are real".

`started_at` is written when the server deals the game, not when the client says so, which is
what makes the elapsed-clock check mean anything.

### The detail document, and why it is not three tables

`game_detail` was a `game_words` table in the first draft of this document, and would have wanted
a `game_rounds` table beside it once the board per round was worth keeping. It is one versioned
`jsonb` column instead, because **the split that matters here is by access pattern rather than by
entity shape.**

Nothing queries a found word. The leaderboard sorts scalars on `games`; My Games sorts scalars on
`games`; moderation reads a scalar. The words and the boards are written once, read whole, and
never partially updated, which is the definition of a document rather than a table.

The arithmetic agreed, and by more than expected. As rows, fourteen words came to about 1.7KB of
which **fifty-seven percent was tuple headers and index entries** rather than game: 68 bytes of
Postgres bookkeeping to hold a five-letter word and three small integers. The same content as
`jsonb` is smaller before compression and roughly a third after it, since consecutive boards
differ by one letter and the keys repeat once per word.

| per game        | as tables | as a document |
| --------------- | --------- | ------------- |
| rows            | 16        | 2             |
| stored          | ~2.3 KB   | ~0.9 KB       |
| write-ahead log | ~6 KB     | ~2 KB         |

The last row is the one that matters, because the write-ahead log is what point-in-time recovery
actually stores. At a hundred thousand daily players the difference is about 2GB a day of archive
against 700MB.

**A table of its own rather than a column on `games`**, for two reasons that outlive the byte
count. `games` is what the leaderboard scans, and it cannot do an index-only scan because it needs
`user_id` to reach a username, so a detail column would ride along on every page; TOAST usually
prevents that, but a document this size sits right at the 2KB threshold and would be inline for
short games and out of line for long ones, which is worse than either. And retention here is a
`delete`, which gives space back, rather than an `update ... set detail = null`, which bloats the
table it is trying to shrink.

**`boards` is one entry per round, carrying the faces and any wilds that round was showing.** The
wild mask is kept beside the letters rather than written into them, because a wild is a mask and
the letter is still underneath: flatten the two and the history forgets the board the round went
back to. The detail screen draws the whole board for any round that differs from the one before
it — a replacement or a card arriving or leaving — rather than only the delta, since asking a
reader to rebuild the board in their head from the opening deal is the thing keeping a board per
round was meant to spare them.

**`version` is a column, not a key inside the document**, so "how many rows are still on version
1" is a query rather than a scan. The discipline that goes with it, and it has to be chosen rather
than drifted into: **a migration rewrites old documents; readers do not accumulate.** The
alternative leaves a reader for every shape ever written and nobody willing to delete one.

What is deliberately not in it is an event log. The board changes mid-game, so "which board" is
really "which of the several boards this game had", and reconstructing all of them means full
replay, which this document rejects above for the score check and rejects here for the same
reason. The board at each round boundary plus the round each word was found in answers the
question at a fraction of the cost.

One consequence for later: cross-game word analytics — "you have found STRAIGHTEN four times" —
is a scan rather than an index lookup. That is the right shape anyway. Nobody would run a
`group by word` over millions of live rows; it wants a derived table, fed from the document, and
the document does not block it.

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
POST   /v1/games/import         the local store and the upload queue. 201 new, 200 already stored
GET    /v1/leaderboard/:language/:difficulty   a board, top ten, public. ?limit up to 100
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

**A player may appear more than once, and this reverses what this file used to say.** It said one
row per player, their best game, on the argument that otherwise one strong player owns the top
ten and the board stops being a leaderboard and starts being a profile. Nick overruled it: an
arcade cabinet let you fill all ten slots, and a board that hides your second-best game is hiding
something you earned.

The consequence is real and accepted rather than argued away: with three accounts, one player
owning the whole board is the likely outcome for a while. Two things make it cheaper than the
original note assumed. `games_leaderboard_idx` is ordered
`(language, difficulty, engine_version, score desc, rounds_played, finished_at)`, which is
_exactly_ a plain top-N and cannot serve the `distinct on` a per-player best needs -- so the
reversal is both simpler and faster. And if it ever does read as a profile, the fix is a
`distinct on` in one query rather than a schema change.

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

## The sign-in surface, and the order to build it

Written after a false start worth recording: the code flow was built first and hung on the setup
screen as a bare email box with no heading and no explanation. Every mechanism in it worked and
none of it was usable, because a form with no context is not a feature. What follows starts from
where a person meets an account instead.

### What a player sees

**Signed out.** A **Sign in** button at the top of the page, beside How to play and the language
picker. That is the only entry point that exists at all times.

**Signed in.** The button is replaced by the generated avatar in a circle. Clicking it opens a
menu: **My Profile**, **My Games**, **Sign out**.

**After a game.** The game-over panel offers to keep the result. Choosing it opens the same
sign-in dialog **over** the panel — never in place of it. This is the trap this document already
records under the game-over flow: replacing the panel unmounts the game, and a sign-up that fails
then costs the player the result it existed to preserve.

**On return.** The session is a thirty-day cookie and `whoAmI()` runs on load, so coming back
signed in is the default. Nothing needs building for it; what it needs is for nobody to add
eager invalidation.

### The dialog

One dialog, three ways in, reached from both entry points:

```
Continue with Apple      <- built
Continue with Google     <- built
or
Email                    <- built
  -> six-digit code
```

It uses the existing `.modal` / `.modal-card` pattern, which lives at the top level of `App.tsx`
for a reason recorded there: `.board-wrap` is an inline-size container, so `position: fixed`
inside it is contained and a full-screen dialog cannot be built there at all.

It has to say what signing in is **for** — keeping your games, and a leaderboard later — because
the thing being asked for is an email address.

### Order, and what each step became

All four are built. What follows is what they are, rather than what they were going to be.

1. **The shell.** `AccountMenu` sits at the end of the title bar: a Sign in button when signed
   out, the generated avatar and a menu when signed in. Account state is lifted into `Session`,
   so one `whoAmI()` on arrival serves every consumer. `Avatar.tsx` draws the identicon.
2. **The dialog.** `SignInDialog` holds the two-step email flow; the standalone panel is gone.
   Both third-party buttons leave the page for a server route. A provider the deployment has no
   credentials for is not mounted and answers 501, so the client path is real either way.
3. **Game over.** A **Keep this game** button opens the dialog over the panel, never in place of
   it, and one effect in `Session` sends the game the moment there is an account to attach it to.
   That one effect is why signing in _on_ the game-over screen keeps the score that is still on
   it: playing signed in and signing up afterwards are the same two facts becoming true, in
   either order. Imported games are never `leaderboard_eligible`.
4. **The destinations.** `AccountScreen` is one overlay with two tabs. Profile edits the
   username (checked while typing, against `GET /v1/usernames/:name`), the bio, the country and
   both languages; Games lists what `GET /v1/me/games` returns. Sign out revokes the session
   rather than dropping the cookie, so a copied token dies with it.

### Server work it needed

| route                          | for                                              |
| ------------------------------ | ------------------------------------------------ |
| `POST /v1/auth/signout`        | the menu item, revoking rather than forgetting   |
| `GET /v1/me`                   | the whole profile, avatar seed and all           |
| `PATCH /v1/me`                 | the profile screen                               |
| `GET /v1/usernames/:name`      | availability while typing, behind a session      |
| `POST /v1/games/import`        | keeping a game played before there was a person  |
| `GET /v1/me/games`             | My Games                                         |
| `GET /v1/games/:id`            | one game, public, what a permalink resolves to   |
| `GET /v1/users/:name`          | somebody's profile, public                       |
| `GET /v1/users/:name/games`    | what they have played, public                    |
| `GET /v1/auth/apple`           | redirects to Apple; 501 with no key configured   |
| `POST /v1/auth/apple/callback` | Apple's form post, and the session it results in |
| `GET /v1/auth/google`          | redirects to Google; 501 with no secret          |
| `GET /v1/auth/google/callback` | Google's redirect, and the session it follows    |

Three decisions taken while building them, none of which the plan above had settled.

**The availability check is behind the session cookie.** `/v1/usernames/:name` enumerates, and
requiring a session turns "anyone can walk the namespace" into "anyone with an account can"; a
smaller problem, and free.

**The public profile routes are rate limited, where a caller can be identified.** `/v1/users/:name`
and its games listing are public and addressable by name, so walking the namespace is a request
away. Sixty per minute per client, fixed window, in `rateLimit.ts`.

Two things about it are deliberate and would otherwise look like defects. It is **per pod**, so
production's two replicas allow up to twice the configured number; a shared counter would mean a
write to Postgres on every public profile view, which is the wrong trade for a limit whose job is
to make bulk collection slow rather than exact. And it is **mounted only where the deployment
says something in front rewrites `X-Forwarded-For`**, which is `api.trustProxy` in the chart:
true in production behind Cloudflare, false on the dev host, whose own values file already
explains that a client IP arriving there is not believed. Rate limiting without a believable
client key is theatre, and the two ways to fake it are worse than not pretending: one shared
bucket lets a single caller exhaust everybody's quota, and trusting a forgeable header means the
limit is bypassed by setting it.

**Account deletion is owed, and so is the thing it should be built with.** `DELETE /v1/me` is
designed above and does not exist; the privacy policy says so plainly and gives an address
instead. It becomes a hard blocker before any native build, because the App Store requires in-app
deletion from anything offering account creation.

The shape it should take is not a lone endpoint. What is actually wanted is an `is_admin` on
`users` and an admin panel behind it: delete and modify accounts, curate leaderboards, resolve
the `reports` rows that already have a table and nothing reading them. A moderation queue with no
way to act on it is the current state, and one delete route would not change that.

**That panel is now built** — see "Moderation" below. What exists is the other half: somebody can
now be deleted, and by somebody who can also undo it. Self-service deletion still does not, and
what Apple actually asks for is narrower than a route and wider than one at the same time — see
"What the App Store requires, exactly" below.

**A game played while signed in goes through the same route, and is not marked `imported`.**
Phase A issues no seeds, so every game is finished on the client whoever was signed in, and one
route takes both. What the two are is still different: `imported` means a game brought in from a
browser's localStorage, and `leaderboard_eligible` means a game that can be ranked.

The first version set `imported` on everything, on the reasoning that both are unrankable
anyway. That is true and it is the other column's job to say so. What it produced was a history
telling people that games they had played while signed in had been "kept from a guest game" —
untrue, and of no use to them even where it was true.

So it is gone from My Games, and gone from what `GET /v1/me/games` returns as well. Provenance is
worth a column and is worth nothing to the person whose row it is: it explains to _us_ why a game
is not on a board, and to them it is a game they played. Leaving it on the wire for nothing to
render is how it ends up rendered again.

The client says which it was, because the client is the only party that knows: whether an account
existed when the game **began**, not when it was sent. Signing up on the game-over panel is the
whole point of that panel, so by the time the game is posted the account always exists. It is a
claim, and it is allowed to be, on the same footing as scores in phase A: a personal history is a
diary and nobody forges a diary. Nothing is granted by it.

### Profiles and games are public, and two earlier decisions are reversed

A game is worth sharing, so a game has a permalink and anybody who follows one can read it.
That means profiles are public too, since a game has to be able to say who played it.

```
/g/<id>         one finished game
/u/<username>   one player
```

**What this reverses, plainly.** `GET /v1/me/games/:id` was scoped to its owner and answered 404
to everybody else, with a test asserting exactly that. It is gone; `GET /v1/games/:id` replaces
it and the account screen reads it too, so there is one reader rather than a public one and a
private one that could drift about what a game is.

**And it makes the session gate on `/v1/usernames/:name` pointless.** That gate exists three
sections up because an availability endpoint enumerates. `GET /v1/users/:name` now answers 404
for a name nobody has, publicly, which is the same oracle with a nicer URL. The gate is left in
place because it costs nothing, but the reason written down for it is no longer true, and a
rate limit in front of the public route is the thing that would actually help.

**What stays private is the boundary, not the page.** `PublicProfile` is a separate type from
`Profile` rather than a subset computed at the call site, and that is the whole mechanism: the
address an account signs in with has never been on a profile, and whatever `Profile` gains next
is not public by default. A `hidden` game, an unclaimed one, and one belonging to a deleted
account are all 404 — the same answer, because telling them apart is how an endpoint starts
reporting what exists.

**Usernames rot and game ids do not.** `/u/trout` breaks when trout renames, which is the
ordinary contract everywhere on the web and the right side of the trade: the link worth keeping
is the game permalink, and that carries an id that never moves.

**A game id is eight bytes, not sixteen.** Eleven characters rather than twenty-two, because
this is the one id a person reads. Collisions are a birthday problem and the arithmetic picked
the size: at eleven million games — about a year at ten thousand daily players — eight bytes
collide with probability 3 in a million and six bytes with probability 1 in 5. The shorter one
would have needed a retry loop around the insert, where a collision costs somebody the game they
just finished. Existing ids are untouched and still resolve; an id is opaque text.

**The SPA fallback is scoped to those two prefixes and nothing else.** `deploy/nginx.shared.conf`
refuses a blanket one, and the comment there is still right: a fallback that catches everything
is what once made a missing word list arrive as `index.html` and parse as HTML. `/g/` and `/u/`
hold nothing on disk, so nothing real can be masked by them. Checked against real nginx rather
than reasoned about — `/words/missing.txt` still 404s.

**The store is one object behind two ports.** `AuthStore` proves who somebody is, `AccountStore`
says what they have, and `Store` is both. One Postgres implementation, one fake in the test
suite, and route tests that hand over only the half they need.

**And one bug worth recording, because only the integration suite could have found it.** Drizzle
wraps a driver error in an `Error` of its own carrying the SQL and the parameters, so reading
`failure.code` for `23505` finds `undefined` on the wrapper. A rename that lost the unique index
came back as a 500 instead of a 409. No fake would have built the wrapper; `pnpm test:integration`
did, on the first run.

### Two decisions, taken

- ~~**English first, one localization pass afterwards.**~~ Done. `Messages` requires every key in
  all fifty-one locales at once, so it could not be added a little at a time, and translating a
  flow nobody had walked through would have been translating a guess. The flow has since been
  walked through and the pass has happened: **72 keys, 51 locales, about 3,700 strings.**

  Three things came out of doing it rather than planning it. The estimate of "roughly twenty
  strings" was wrong by a factor of three, because strings hide in props (`label=`, `filter=`,
  `empty=`) and in maps of server error tags, not just in text nodes. The board-change lines were
  fragments assembled in the markup, `{letter}` + `replaced in` + `slot {n}`, which is three
  pieces in an order only English uses; they are now one template each. And the character counter
  under the bio was reworded from "{n} characters left" to `{left}/{max}`, because the original
  needs a plural set for a string nobody reads twice.

  `columnRounds` is derived from each locale's existing `plurals.rounds` form rather than
  invented, so the noun is one a translator already chose. Finnish gets the partitive
  `kierrosta` that way, which is what follows a numeral rather than what heads a column; it is
  the one place the derivation is visibly imperfect.

- **A geometric identicon**, drawn from `avatarSeed`. Deterministic, so the same account is the
  same picture everywhere without anything being stored; inline SVG, so there is no dependency
  and no second request; and coarse on purpose, because it has to read at 24 pixels in the top
  bar. Initials on a colour was the alternative and loses to it for one reason worth naming: a
  generated name like `clever-beacon-1267` gives `CB`, and the point of the picture is to be the
  thing you recognise when the name is one you did not choose.

**Uploads are wanted later, and that is a reversal rather than an addition.** This document
chose generated avatars specifically so that there is nothing hosted to moderate, and the bio
section repeats the reasoning. Accepting uploads brings back all of it: storage, a moderation
path, a report queue that has to be acted on rather than filled, and a deletion story that
reaches an object store as well as a row. None of that is a reason not to do it; it is the work
that comes with it, and it should be planned rather than arrived at.

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
  nobody forges a diary, and that stays true for a claimed game. It belongs in the person's
  history and not on a board, and the column for saying so is already there.

  **What this passage got wrong, now that boards exist:** it said a leaderboard entry "needs a
  server-issued seed and the envelope check". The boards shipped before either, so eligibility is
  currently the weaker rule **canonical and not imported**, set on import. A ranked phase-A score
  is therefore a score the server re-computed from the words it was sent, on a board the client
  chose the seed for. That is a real gap and it is the one phase C closes; what it is not is a
  reason for an empty page, with three accounts and nothing shipped. The rule lives in one
  expression in the import route, so closing it is a change there and not to any query.

## Moderation

Built, and it is what the section above asked for rather than a delete route: an `is_admin` on
`users`, a panel behind it, and a report button in front of it. The two halves are the point. A
queue nothing writes to is a queue of nothing, and a report nobody can act on is a form that
wastes somebody's time politely.

### The flag is a column, and nobody can give it to themselves

`users.is_admin`, default false, not null. A column rather than a roles table because there is
exactly one power and it is not going to grow into a permission system for a word game; the day
it needs two is the day to build the table, and a boolean is cheap to migrate off.

Three rules hold it shut, and together they mean **every admin was made by somebody else**:

- Nothing in the sign-in flow writes the column. There is no path from signing up to holding it.
- `PATCH /v1/admin/users/:id` answers 409 when the id is the caller's own. Not a rail against a
  misclick: it is what stops the flag being something an admin panel can hand to itself. A bug in
  the panel cannot mint an admin, because the panel has no route that would.
- So **the first one is set by hand against the database.** One `update`, recorded in
  [DEPLOY.md](DEPLOY.md). That is the correct amount of ceremony for the power to delete
  anybody's account.

Banning yourself is refused the same way, for a smaller reason: it is a misclick that would cost
the account able to undo it. The panel does not draw either button on your own row, because a
control that exists only to be refused is worse than no control — the same rule the report button
follows about your own profile.

`Profile.isAdmin` goes to the browser on `GET /v1/me`, so a menu item can be drawn. It is
**not** on `PublicProfile` and must not be: who moderates is nobody else's business, and a public
field saying so would be a list of the accounts worth attacking. Every route reads the column
itself, so a client that lies about it gets a menu item and a 403.

### The routes

| route                            | for                                                 |
| -------------------------------- | --------------------------------------------------- |
| `POST /v1/reports`               | the report button, behind the session               |
| `GET /v1/admin/users`            | find somebody, by username or sign-in address       |
| `GET /v1/admin/users/:id`        | one account: how they sign in, how much they played |
| `PATCH /v1/admin/users/:id`      | rename, clear a bio, grant or remove the flag       |
| `POST /v1/admin/users/:id/ban`   | ban, reversibly                                     |
| `POST /v1/admin/users/:id/unban` | lift it                                             |
| `GET /v1/admin/games`            | the board, in the board's own order                 |
| `PATCH /v1/admin/games/:id`      | hide a game, or bring it back                       |
| `GET /v1/admin/reports`          | the queue                                           |
| `PATCH /v1/admin/reports/:id`    | resolve one, or reopen it                           |

Everything under `/v1/admin` sits behind one middleware rather than a check at the top of nine
handlers, which is the property worth having: a route added to that file later is behind the gate
because of where it is, not because somebody remembered. That is the opposite call from
`account/routes.ts`, where each handler asks for the session itself because some of those routes
are public. Here nothing is.

401 and 403 stay apart. They are different facts and the client shows different things — signed
out means sign in, and not an admin means this page is not for you — and there is no enumeration
concern, because you have to be signed in to tell them apart and your own account's flag is not
news to you.

### The panel is in English, and the button is in fifty-one languages

Deliberate, and the asymmetry is the whole of it. The queue has one audience and it is us; the
button has fifty-one, and this document already settled why that matters: "a blocklist is not
going to work across this many languages and pretending otherwise is worse than not having one.
What works is a report button and the power to rename an account and tell its owner why." A
button that only worked in English would be a blocklist with extra steps.

Going the other way, forty admin strings nobody outside the project will read would cost
fifty-one locale files apiece, forever, and the i18n suite's own completeness checks would then be
policing translations of "Mark deleted". It is a decision rather than a gap, and the day somebody
moderating Blinkered does not read English it becomes a wrong one.

Two strings are reused rather than added: the dialog's sending state is `saving` and its failure
is `serverBusy`, which already say exactly those things in every language.

### What a report is

`POST /v1/reports`, **behind the session**, which is a deliberate cost. An anonymous button would
collect more reports and the `reporter_user_id` column is nullable so it could, but a queue nobody
can be held to is a queue of noise: much of a report's value is who filed it and whether they file
good ones.

One open report per person per subject per field. A second one answers 200 rather than 409 and the
dialog says the same thing it says about the first, because from where the reader is standing they
reported it and it is reported; telling them the difference only invites a third attempt. The
duplicate rule is a check rather than a partial unique index over four nullable columns — the race
that leaves costs the queue a duplicate row, and the index costs more than that to get right for
the same outcome.

**Being signed out is not a dead end, and the first version of it was.** The button is still
offered to a stranger, because one invisible to everybody without an account teaches nobody the
feature exists. What the first version then did was let them choose a field, write five hundred
characters, press Send, and only then say "sign in to report something" — with the text gone,
because there was nowhere for it to be and no way to sign in from inside the dialog. That
punished exactly the reader who cared enough to explain.

So the ask is up front, the form is still drawn underneath it so somebody can write while the
thought is theirs, and pressing the button keeps what they wrote in `sessionStorage` before
opening the sign-in dialog. Session rather than local storage, ten minutes, and the same choice
`SignInDialog` already makes about a half-typed address — for the same reason, which is that Apple
and Google are a whole navigation away and back, so component state cannot survive it.

**The draft knows its own address, which is what makes the return trip work.** The callback
redirects to `/?signin=ok` rather than to wherever the reader was, and that is the server keeping
its redirect simple and is the right call: a return path in a query parameter is an open redirect
waiting to be written. So the thing that remembers is the report, and it needs nothing stored to
do it — a subject _is_ a page, `{ kind: 'person', username }` is `/u/<username>`, so `App` reads
the waiting draft on return and goes there. The dialog reopens holding the field and the text.

Two smaller decisions inside that:

- **It restores while signed out but only opens itself once there is a session.** Restoring the
  text costs nothing and they may press the button again; a modal opening unprompted on a cold
  page load is intrusive.
- **Cancel drops the draft.** Otherwise it reappears the next time somebody passes the same page,
  which is not what pressing Cancel asked for. A session that dies _between_ opening the dialog
  and pressing Send takes the other path: the text is kept and the same ask appears, because a
  401 has to end somewhere a person can act rather than in an error they can do nothing about.

Only a report restores the page this way. Signing in from somebody's profile for any other reason
still lands on the game, which is a rougher edge than this one and a separate decision.

A reported game carries **its owner as well as the game id**, because "has this person done this
before" is a question a queue holding only game ids could not answer. Reporting yourself is 409; a
subject that is not there is 404, through the same readers the public pages use, so there is one
idea of what a person is and one of what a game is rather than moderation-flavoured copies.

### Hiding, renaming, marking

The three verbs, and each one is the reversible half of something irreversible.

**Hiding a game** is the whole anti-cheat apparatus this document already argued for: the server
scores a submission from its own words, which stops the thirty-second attack, and anything
surviving that is dealt with by a person looking at it. A hidden game 404s on its permalink and
disappears from its owner's own list too — a score removed from a board that still sits at the top
of a personal page has been removed from nowhere its setter can see. The curation listing shows
hidden games unless the filter excludes them, because a hidden game that could not be found again
could never be un-hidden.

That listing is ordered **score down, rounds up, oldest first**, which is `compareResults` in
`@blinkered/engine` and the column order `games_leaderboard_idx` is built for. Deliberately the
board's order rather than "newest first": the screen exists to look at what is at the top of a
board and decide whether it belongs there, and a listing sorted differently would not be showing
the board.

**Renaming** goes through `parsePatch`, the same checks a name its owner types goes through. An
admin renaming somebody past the rules would be creating the impersonation problem the rules exist
to prevent — including the generated `word-word-1234` shape, which stays reserved, so nobody can
be made indistinguishable from a brand-new account.

**Banning** sets `users.banned_at` and nothing else. It ends their sessions as a consequence
rather than as a second step, because `findSession` already joins `users` and checks the column;
their profile and their games 404 with them. A banned account is still editable here, unlike
through `updateProfile`, which is what lets an offensive name be fixed rather than merely hidden.

**The row stays, indefinitely, and that is the operation rather than half of one.** This column was
called `deleted_at` and was described as the first step of a two-step deletion with a reaper still
to come. Neither was true: nothing reaped it, and what it did was ban. The reaper sat on the list
of owed work for exactly as long as the wrong name did — which is the argument for renaming things
when you notice, since a bad name generates imaginary work.

Two consequences of keeping the row, both of which may be what you want and are worth stating:

- **The name stays taken.** `usernameTaken` deliberately does not filter banned accounts, because
  the unique index does not either. Right for a name removed for abuse; worth knowing for a ban
  applied by mistake and never lifted.
- **The address is retained with no stated period.** Which is also the only thing that could ever
  recognise a banned account coming back — see the ban-evasion note under "Deleting your own
  account".

### The one place the API returns a sign-in address

`GET /v1/admin/users` and `/v1/admin/users/:id`, and nowhere else. A profile has never carried one
and `PublicProfile` exists to keep it that way, so this is a deliberate exception rather than an
oversight: moderation means answering "who is this account", and a panel that cannot see the
address cannot answer it. `AdminUser` is a third type beside `Profile` and `PublicProfile` rather
than a widening of either, and that is the mechanism — the routes that answer a browser do not
have an address to leak.

### What is still not built

- ~~**A reaper for the marked-deleted column.**~~ There is nothing to reap. Self-service deletion
  erases the row, and the admin path is a ban that keeps it on purpose. This was owed work for
  exactly as long as the column was misnamed `deleted_at`, which is the argument for renaming
  things when you notice: a bad name generates imaginary work.
- **Telling somebody why they were renamed.** There is no notification of any kind, so this is a
  person and an email address. Worth doing before the first rename that is not ours.
- **A rate limit on `POST /v1/reports`.** The duplicate rule stops somebody filing the same report
  twice; it does not stop them filing one about everybody. Behind a session, which makes it
  attributable, which is most of the defence.
- **Any test of the report dialog itself.** `reportDraft.ts` has a suite, and it is the first
  test in `apps/web`; the dialog's own states — asked up front, asked after a 401, restored from
  a draft — were walked in a browser and are not pinned by anything. That is what the Playwright
  suite on STATUS.md's list is for.
- **An audit trail.** Who hid what, and when. The reports table records the objection and nothing
  records the answer beyond `resolved_at`. Wanted the first time two people moderate.

## Deleting your own account

Built. `DELETE /v1/me`, behind a fresh six-digit code, and it is a real delete rather than the
mark an admin sets.

**Two paths, on purpose, and only one is a deletion.** An admin sets `banned_at` and can undo it,
because that handler can be aimed at the wrong person. Somebody deleting their own account gets a
cascade, because they are the row and they have just answered a code — and because 5.1.1(v)'s support page is
explicit that "only offering to temporarily deactivate or disable an account is insufficient", so
a mark would not satisfy it.

**A code rather than a typed confirmation.** A session lasts thirty days, so a session alone means
an open laptop is enough to erase somebody. Apple permits exactly this remedy: "entering a code
from an email or phone number already associated with the account". It reuses `loginCodes`,
`policy.ts` and `secrets.ts`, so there is one implementation of what a six-digit code is, with one
rate limit and one expiry.

One consequence of that reuse, stated rather than discovered: a code asked for to delete can be
used to sign in and the other way round. Both mean "whoever holds the inbox", which is already the
bar for the account — somebody with the inbox can sign in and then delete anyway — so it is not a
new exposure. The address comes from the account rather than the request, because letting somebody
name where a deletion code goes is letting them name who confirms it.

### What goes, and what does not

| row                         | what happens | why                                          |
| --------------------------- | ------------ | -------------------------------------------- |
| `users`                     | deleted      | the record itself, which is what is required |
| `auth_identities`           | cascade      | every way back in goes with it               |
| `sessions`                  | cascade      | nothing to sign out of afterwards            |
| `games`, `game_detail`      | cascade      | and with them every leaderboard appearance   |
| `reports` (all three links) | **set null** | the objection outlives the people in it      |
| `reports.reason`            | **nulled**   | prose about the subject is data about them   |

The reason column is the one a foreign key could not reach. It is one `update` inside the same
transaction and **before** the delete, since afterwards `subject_user_id` is already null and
there is nothing left to match on.

**Redacting the name out of `reason` was considered and refused.** It sounds gentler and it cannot
work here: usernames are renameable by design and nothing records the old ones, so the name in a
report may be one the account no longer had. Matching would also have to be on the NFKC
case-folded form against arbitrary prose, and prose can identify somebody without using their
handle at all. `reason is null` is checkable; "we took their name out" is a claim only readable by
hand.

What survives a subject's deletion is `field`, `created_at`, `resolved_at` and the reporter — so
our own count of how much moderating happened stays honest, and a reporter's record of filing real
reports stands. Both are about us and about reporters. **Neither is about the subject, and none of
this recognises them if they come back.**

### Ban evasion is undefended, and this widens it

Worth stating plainly because it is the obvious question. Nothing here recognises a returning
account: no fingerprinting, no retained addresses, no blocklist. A deleted address can sign up
again immediately and get a clean account.

A ban keeps the row and its `auth_identities`, so it leaves something recognisable; a
self-deletion erases them. So somebody who sees a ban coming can delete their own account and
re-register clean.

**That path is mostly self-defeating, which is why it is not urgent.** The three reportable
surfaces are a username, a bio and a score, and self-deletion removes all three — the evader
destroys their own offending content to escape a ban, which is us getting the outcome we wanted by
an unexpected route. What it costs us is the `reason` prose on reports about them, so a moderator
mid-investigation loses the description of what happened; `field`, the timestamps and the counts
survive.

**The real hole is serial signup, and it predates all of this.** Nothing stops a second account
with a second address, reported or not, and a spammer wants impressions rather than persistence —
so delete-and-recreate is barely a shortcut for them. Worth filing as "serial signup is
undefended" rather than "self-deletion enables evasion", because the second framing blames the
wrong button.

It is not closed, and closing it is a decision rather than a task. The options, none taken:

- **Accept it.** Pre-release, and ban evasion is unsolved regardless.
- **Keep a hash of the address** on erasure, so a return is recognisable. Cheap, effective against
  the lazy case, and it means retaining a derivation of personal data after somebody asked to be
  erased — a position to take deliberately, not a detail.
- **Keep an opaque per-account key** that outlives the row, so "this is the fourth account from
  whoever this was" is answerable without storing anything about them. More machinery, better
  posture.

## What the App Store requires, exactly

Worth stating precisely, because "the App Store blocker" was attached to `DELETE /v1/me` for a
while and that is not what Apple asks for.

Guideline 5.1.1(v) is one sentence: "If your app supports account creation, you must also offer
account deletion within the app." The shell offers sign-in, so it applies. It blocks **submitting
the native app** and nothing else — the web is unaffected and so is everything shipped today.

What the [support page](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
adds is the part that changes the design:

- **A route is not required.** "If people need to visit a website to finish deleting their
  account, include a link directly to the page on your website where they can complete the
  process." So a findable in-app entry point leading to a real deletion satisfies it, and
  `DELETE /v1/me` is one way to build that rather than the obligation.
- **A slow or manual process is acceptable**, if it says how long it will take and confirms when
  it is done. Which means the reaper does not have to be synchronous.
- **Marking is not enough.** "Offer to delete the entire account record, along with associated
  personal data... only offering to temporarily deactivate or disable an account is
  insufficient." A reversible mark _is_ deactivation, which is why self-service deletion erases
  the row outright rather than setting a column. It also settles what the admin path is: a ban,
  now named `banned_at`, and not a half-finished deletion waiting on a reaper.
- **An address is specifically disqualifying.** "Requiring users to phone, email, or contact
  support" is listed as not acceptable outside the regulated industries of 5.1.1(ix), and the
  privacy policy currently gives an address. So the thing standing in for deletion today is the
  one thing named as insufficient.
- **Everybody, everywhere.** "All users should be allowed to delete their accounts, regardless of
  where they're located" — not a GDPR-region path.

One requirement is ours to answer rather than Apple's to settle: they expect user-generated
content shared with others to go too. Games are public and carry permalinks. A deleted account's
games already 404, which is the right behaviour, but the rows are still there — so the reaper has
to decide whether a game outlives the person who played it. That is a product question.
