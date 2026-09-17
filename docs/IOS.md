# iOS

Blinkered on an iPhone is the same build as Blinkered in a desktop browser. There is no second
codebase: the native app in `apps/mobile` runs this bundle in a WebView, and what follows is the
set of places where the same stylesheet and the same React tree had to be told that the machine is
different.

This is the browser half. The native shell, how to get it onto a phone, and the two things it had
to change about the game are in [../apps/mobile/README.md](../apps/mobile/README.md).

This is a record of which places those were, and how each one was measured. Almost none of it
was obvious by reading, and one of the defects only exists in WebKit.

## What "works on iOS" turned out to mean

The game was never broken on a phone. Tiles have always been buttons, and Complete word and
Reset have always been real controls, because the plan called for touch to be a first-class
path rather than an afterthought. So the first thing worth checking was whether any of it
actually functioned, and it did:

| checked in WebKit at an iPhone viewport     | result                                                  |
| ------------------------------------------- | ------------------------------------------------------- |
| Start button responds to a tap              | yes                                                     |
| tapping a face-up tile takes its letter     | yes                                                     |
| a word submitted by tapping is accepted     | yes, `HAIR +3 points, +3 flips`                         |
| tapping the last letter again takes it back | yes                                                     |
| pause, resume, reset, quit by tap           | yes                                                     |
| a whole game, no keyboard at all            | 20 points from 9 words over 3 rounds                    |
| the leaderboard, with four rows on it       | ranks, current row marked, table 324px in a 358px panel |

That mattered because the buttons all call `preventDefault` on `mousedown`
(`withoutStealingFocus`, which exists so a click cannot cost a desktop player their keyboard),
and WebKit synthesises `mousedown` after a touch. Had it suppressed the synthesised click, every
control in the game would have been dead on iOS and nothing else here would have been worth
doing. It does not.

So the problem was not function. It was that the game was **unplayable while being fully
operational**, which is a harder thing to notice and the reason all the numbers below are
measured rather than reasoned about.

## The board was a postage stamp

The headline defect. On a 390×664 screen the board was **132×179 pixels** with **40px tiles**:
the game's central object taking a third of the width while two thirds of the screen held
nothing, and every target under Apple's 44pt floor.

The cause was one line:

```css
--tile: clamp(2.5rem, 10vmin, 4.25rem);
```

`vmin` is the smaller viewport dimension, which on a phone in portrait is the **width**. 10vmin
came out at 39px, so the floor won and every tile was 40px no matter how much room there was.
The unit is right on a desktop, where width is plentiful and height is the constraint, and
exactly inverted on a phone.

A tile is now the smallest of three things, computed once on `.board`:

```css
--fit-width: calc((min(100cqw, 30rem) - (var(--cols) - 1) * var(--gap)) / var(--cols));
--fit-height: calc((var(--board-height) - (var(--rows) - 1) * var(--gap)) / var(--rows));
--tile: clamp(2.75rem, min(var(--fit-width), var(--fit-height)), var(--tile-max));
```

Two details in there are load-bearing.

**`100cqw`, not `100vw`.** The board measures itself against `.board-wrap`, which is an
inline-size container, so the narrower play column that nerd mode creates shrinks the tiles
instead of overflowing them. Using the viewport would have meant sizing against space the board
does not have.

**`--rows` comes from JavaScript.** CSS is told the column count already, but `repeat()` derives
the row count from the item count and never exposes the answer, and the height has to be divided
by something. `rowsFor(n, columns)` in `Board.tsx` publishes it next to `--cols`.

The result, all six scenarios measured against the production build:

| scenario            | viewport | grid | tile | board   | controls above the fold |
| ------------------- | -------- | ---- | ---- | ------- | ----------------------- |
| iPhone SE portrait  | 320×568  | 3×4  | 55px | 178×239 | yes                     |
| iPhone 14 portrait  | 390×664  | 3×4  | 72px | 227×305 | yes                     |
| iPhone 14 landscape | 750×340  | 4×3  | 78px | 330×246 | yes                     |
| iPad Mini portrait  | 768×1024 | 3×4  | 84px | 274×370 | yes                     |
| iPad Mini landscape | 1024×768 | 4×3  | 84px | 370×274 | yes                     |

## `svh`, not `dvh`

`--board-height` is a percentage of the viewport height, and which viewport unit it uses is a
real decision rather than a detail.

`dvh` is the _dynamic_ height and tracks Safari's URL bar as it collapses. Sizing the board from
it means the board grows and shrinks as the page scrolls, and every tile drifts sideways
underneath the thumb that is following it. In a game whose core skill is tracking a letter
through a shuffle, that is not a cosmetic problem.

`svh` is the URL-bar-expanded height and never changes. It costs a few pixels of board and buys
a board that holds still. In a home-screen app there is no URL bar and the two units are the
same number anyway.

## What had to be above the fold

Three things are load-bearing while a game is running: the flip count, because it is the clock;
the board; and Complete word, because it is how a word is submitted. The legend and the list of
found words can sit below the fold and be scrolled to. Every viewport in the table above keeps
the first three on screen together.

Getting there on a 568px iPhone SE meant finding 42 pixels, and the surprise was where they
were. Not the board, and not the controls: the **title bar**, which at 320px wrapped the
wordmark, the language picker and the nerd toggle onto three rows and spent **108px of 568** on
chrome. Dropping the picker's visible label got it to two. The trigger already shows a flag and
the language's own name for itself, which says "language" better than the word does; the label
stays in the accessibility tree via `.sr-only` rather than being removed, because
`aria-labelledby` points at it.

### One row, measured

Two rows was the wrong target. Six controls coming off the end of a wrapping row meant that
narrowing the window rearranged the bar -- the account button ending up alone on a line under the
wordmark, everything moving as the window moved. Nick, watching it: "I wasn't expecting nav
elements to start hopping all over the screen and down to a second line. I was expecting them to
get narrow and _stay in the top header area at all times_."

So the row does not wrap and gives up detail instead, in this order: the word "language", the
words beside the question mark, the words beside the nerd face, two thirds of the wordmark's
size, the language's name, eight of the nine tiles, and last the medal. `fitRow.ts` applies those
steps one at a time until the row stops overflowing, and re-measures on resize and when the fonts
arrive.

**Measured rather than written as breakpoints, because the right width is per language.** Sign in
is "Iniciar sesión" in Spanish and How to play is "Wie man spielt" in German; a bar tuned in
English wraps in both. Measuring costs twenty lines and is right in fifty-one languages. What it
buys is visible at the ends of the range: 320px English keeps every control but the medal, and
the medal survives to 360px, where the old hand-written breakpoint dropped it at 368px.

**A flex row cannot overflow unless you let it.** Two things had to be true before any of this
could be measured. `flex: none` on the children, or the flexbox quietly squashes the labels and
reports no overflow; and `grid-template-columns: minmax(0, 1fr)` on `.shell`, because an implicit
`auto` track is sized to its widest child's max-content -- so the row simply made the page wider
than the window and still reported that it fit. In German it pushed the document 386px past a
320px viewport before that line went in.

The same row is at the head of every page that is not the game, and it is measured the same way:
see `PageHead.tsx`.

The last six pixels came out of the board's share rather than the button, on the grounds that a
button you cannot reach is a game you cannot finish. 42% of an SE is still a 55px tile against
the 40px this started from.

## A phone on its side

340px of height, and the vertical stack needs about 500. So in landscape it stops being a stack:
the board takes a column and everything else goes beside it. This is the only place the layout
changes shape rather than merely tightening, and it is worth it because a phone in landscape is
how a lot of people hold a game.

The board's column is a percentage rather than `auto`, and that is not a style preference.
`.board-wrap` is an inline-size container, which means its width may not depend on its contents;
in an `auto` track it would depend on exactly that, and the column collapses to nothing.

## Touch behavior the browser supplies and we do not want

Four defaults, all of them wrong here, none of them visible without a device:

- **`touch-action: manipulation`** on tiles and buttons. Drops double-tap zoom, and with it the
  300ms wait to find out whether a tap was the first half of one. Tapping tiles quickly is the
  game.
- **`user-select: none` and `-webkit-touch-callout: none`** on tiles. A long press on a letter
  otherwise raises the iOS selection callout, offering to copy or look up a tile mid-round.
- **`-webkit-tap-highlight-color: transparent`**. WebKit paints a gray box over each tile as it
  is tapped, which on a dark board reads as the tile breaking rather than as a tap landing.
- **`overscroll-behavior: none`**. A page that does not scroll should not bounce; without it,
  tapping tiles drags the whole game up and down.

And one that had to be taken away rather than added: every `:hover` rule is now inside
`@media (hover: hover)`. A touch leaves `:hover` stuck on whatever was last tapped, so on a
phone the hover border marked a random tile as though it were special.

## The two iOS-only traps

**A focused field under 16px zooms the page and does not zoom back.** The nerd panel's number
fields were 13.6px, so every one of them was a trapdoor: tap a field, and you are left in a
magnified game with the board off the edge and no way back short of a reload. They are 1rem on
touch.

**WebKit will not accept an author height on a native menulist.** This one is genuinely
WebKit-only and was found by auditing rather than by looking. `min-height: 2.75rem` on the nerd
panel's three `<select>` elements computed to **18px**, and the rows stayed 23px tall — the only
targets on the page a finger could not reliably hit, and no amount of correct CSS fixed it.
Dropping `appearance` hands sizing back, at the cost of drawing the caret by hand.

The picker itself is still the system one, deliberately. On iOS a native `<select>` opens as a
wheel at the bottom of the screen under your thumb, which is the right control; this is the
opposite of the Chrome-on-macOS problem that `Dropdown.tsx` exists to solve, which is why these
three stay native while the language picker does not.

## Every target clears 44pt

Audited by walking every `button`, `input`, `select` and `a` in the document and measuring the
box a finger actually hits — the control, or the `label` that stands in for it, since the nerd
toggle is a 24px checkbox inside a label that is not.

The last one to fall was the How to play link, which was 74×20 as a bare line of text and is the
only route to the rules. Padding rather than a larger font, so it stays a quiet link and becomes
a reachable one.

## Telling a thumb what a keyboard was told

The legend hides its keyboard bindings under `(hover: none) and (pointer: coarse)`, which was
right and left a gap: a touch player was told nothing about how to take a letter back. Backspace
has no thumb equivalent to advertise, but tapping the last letter again is one, and it already
worked — `TAP_TILE` on the last-selected tile deselects it, which is `UNDO_LETTER` by another
route.

So there is one more legend line on touch, and a matching section on the rules page. In every
language, because everything the game says is in every language.

The rules page shows the touch section and the keyboard section **both, always**. It opens in
its own tab and is shareable, so it cannot assume the device reading it is the device playing on
it: somebody reads the rules on a phone and plays on a laptop, and the reverse.

## The home screen

Installable, which on iOS is a slightly different contract from the standard one:

- Safari reads `manifest.webmanifest` from 16.4 onwards, but still takes the icon from
  `apple-touch-icon` and the name from `apple-mobile-web-app-title` rather than from
  `short_name`. Both spellings of the same facts are in both HTML entry points.
- `apple-mobile-web-app-status-bar-style: black-translucent` lets the game draw under the status
  bar. That is only safe because `.shell` pads itself with `env(safe-area-inset-*)` and the
  viewport is `viewport-fit=cover`. Those three go together; remove one and the board slides
  under the clock.
- The safe-area padding is now all four insets rather than the vertical pair. A notched iPhone
  in landscape puts the notch and the home indicator on the left and right edges, and the board
  was drawn under them.

The icon is a selected tile: the same blue the board paints a taken letter, and the same white
on top of it. The tile fills the frame, because iOS masks the icon to its own corner and a tile
floating in a dark square would read as a picture of an icon rather than an icon. Generated from
an SVG by screenshotting it headless, so no binary asset has a source that can be lost. See
[../brand/README.md](../brand/README.md) for why the home-screen icon is opaque and square while
the tab icon is neither.

`.webmanifest` is not in nginx's `mime.types`, so without a `default_type` it ships as
`application/octet-stream`. Browsers are forgiving and Safari is the one that matters here, but
a file served as the wrong type is a thing waiting to break.

## There is no service worker, on purpose

The obvious next PWA box to tick, and it is not ticked. Offline is not something the game does
on the web either, so adding it here would be new behavior rather than parity, and the payload
is fifty-one word lists, 122MB of them, of which Hungarian is 17.2MB and Arabic, Russian and
Turkish are 8.5 to 9MB each. Caching that is a decision about a player's storage, not a detail. A
stale service worker is also the classic way to serve last week's bundle to somebody who has
cleared everything else.

Add it when offline play is a feature somebody asked for, and cache the app shell plus the one
language in play.

## The build copies the web app, because remembering to did not work

Xcode's Run button builds neither `apps/web` nor the copy of it that Capacitor bundles: `cap copy`
puts `apps/web/dist` into `ios/App/App/public`, and Xcode ships whatever is sitting in that
folder. Skip either step and the build succeeds and installs an older app -- a failure mode with
no error message anywhere in it.

It happened twice in an afternoon, and neither symptom looked like a stale copy: first "the intro
screens are just six screens long", then "the sign-in screen doesn't even have the Apple and
Google options". So it is a build phase now, `sync-web.sh`, first in the target's list:

```sh
pnpm --filter @blinkered/web build
pnpm --filter @blinkered/mobile exec cap copy ios
```

Run is all that is needed. Three details in it are deliberate: `copy` rather than `sync`, because
sync also runs `pod install` and CocoaPods is already driving this build; `alwaysOutOfDate = 1`,
because there are no outputs for Xcode to compare and the whole point is that it runs every time;
and an explicit `PATH`, because a build phase does not get a login shell and `pnpm` is not on the
one it gets.

By hand, if it is ever needed without Xcode:

```sh
pnpm build && pnpm --filter @blinkered/mobile sync
```

The drift it caused had two levels rather than one:

| What                                         | When         |
| -------------------------------------------- | ------------ |
| `ios/App/App/public` (what was on the phone) | Sep 16 15:46 |
| `apps/web/dist` (last web build)             | Sep 17 11:53 |
| `HEAD`                                       | Sep 17 14:05 |

The symptom was a six-screen tour with no mention of signing in -- which is not a bug, it is
what the tour looked like the day before. Anything that reads as "an older build" on a device is
this until proven otherwise, and the two timestamps above are how to prove it in ten seconds.

## What the native app still needs

The Capacitor shell exists and consumes this build unchanged, which was the point of doing the
browser work first: the touch targets, the self-sizing board and the safe-area padding are the
same code inside a WebView.

**This section used to say "what is left is not code". That is no longer true**, and the reason
is accounts. Everything below is the state as of the icon change.

**Signed in works in the shell now, by bearer token.** What follows is how, and what is still
owed. The paragraph this replaces described the problem; it is kept below in outline because the
shape of the fix only makes sense against it.

The client calls the API with root-relative paths and a `SameSite=Lax` same-origin cookie, which
is how the website is deployed: nginx serves the bundle and the API together, so there is no CORS
in the server and none was needed. Inside the WebView the origin is `capacitor://localhost`, so
every one of those paths resolved into the app bundle and found nothing, and the cookie could not
have travelled even with an absolute URL.

Four pieces, and each one is in a single place on purpose:

- **`apps/web/src/api.ts`** decides where a request goes and what it carries. Absolute origin and
  an `Authorization: Bearer` header in the shell, root-relative and a cookie in a browser.
  `account.ts` and `admin.ts` go through `apiFetch` and know nothing about the platform.
- **`currentUser`** accepts either credential, cookie first. That is the whole server-side
  surface, because every authenticated route already went through it.
- **`sessions.kind`** finally has a second value. `schema.ts` has said "cookie on the web, bearer
  in the native shell. They expire differently" since accounts arrived; a bearer session lasts a
  year, refreshed on use past halfway, against thirty days for a cookie. An installed app is the
  only place somebody is signed in, and the commitment is that they stay signed in through
  however long they are offline, which is time that cannot be spent refreshing. Revocable
  through `revoked_at`, which is what makes a year acceptable rather than merely convenient.
- **`WKAppBoundDomains`** in `Info.plist`. `limitsNavigationsToAppBoundDomains` is still on, and
  with no list it meant the local bundle and nothing else, which is what made this unreachable
  rather than merely broken.

The API grew CORS for exactly one origin, `capacitor://localhost`, and
**`Access-Control-Allow-Credentials` is deliberately absent**: without it a browser will not send
cookies cross-origin whatever a page asks, so the cookie session stays strictly same-origin and
the header block cannot become a way to ride one. The only credential it admits is a header a
client has to hold deliberately.

Three things are still owed here, and none of them is a detail:

- **The token is in `localStorage`, not the keychain.** In a WKWebView that store is inside the
  app sandbox, is not shared with Safari, and goes on uninstall, so it is defensible -- but any
  script in the WebView can read it and the keychain is the right home. Moving it needs a
  Capacitor plugin and a way for `apps/web` to reach it, and `platform.ts` exists precisely so
  that this package does not depend on Capacitor. Kept behind `token`, `rememberToken` and
  `forgetToken` so the move is one file.
- ~~**Google and Apple sign-in are not wired for the shell.**~~ Built. See below; what is left is
  two things in Xcode that only Nick can do.
- **It has now run on a phone and in the simulator**, which is what found the above. What a Mac
  could check -- the unit suites, the server's bearer and CORS routes, geometry under WebKit --
  was all green while the one thing nobody had run was the shell itself. `WKAppBoundDomains` in
  particular fails in a way that looks like a network outage rather than a configuration error,
  and it is the first thing to check if the shell signs in and then cannot reach anything.
- **One log line to ignore.** The simulator prints `Error creating CHHapticPattern ...
hapticpatternlibrary.plist couldn't be opened` whenever a keyboard appears. It is UIKit's
  keyboard feedback generator on a simulator that has no haptics file, it happens in every app,
  and it has nothing to do with whatever you were debugging when you saw it.

The original statement of the problem, kept because it is what the fix is shaped by:

**Signed in was broken in the shell, and it was the real work.** The client calls the API with
root-relative paths -- `fetch('/v1/me')`, `fetch('/v1/reports')` -- and relies on an
`httpOnly; Secure; SameSite=Lax` session cookie on a single origin, which is how the web is
deployed: nginx serves the bundle and the API together, so there is no CORS anywhere in the
server and none is needed. Inside the WebView the origin is `capacitor://localhost`, so every
one of those paths resolves into the app bundle and finds nothing. Absolute URLs alone do not
fix it: a `SameSite=Lax` cookie is not sent from `capacitor://localhost` to `playblinkered.com`,
there is no CORS to permit it, and WKWebView's third-party cookie policy is against it. Google
and Apple sign-in are worse than fetches, because they are navigations off-origin and
`limitsNavigationsToAppBoundDomains` forbids them.

So the offline game works in the shell today and nothing that needs an account does. What the
app does not do is _tell_ you that, which is the part that makes it unshippable rather than
merely limited: the sign-in button is drawn and does nothing.

That is an architecture decision, not a patch, and the options differ in kind:

- **Point the WebView at the live site** (`server.url`). Everything works at once and the app
  becomes a web wrapper: offline play goes, the bundled word lists become dead weight, and
  guideline 4.2 on minimum functionality gets a say.
- **Bearer tokens in the native keychain**, CORS for the app origin, and sign-in through
  `ASWebAuthenticationSession`. Keeps offline play and the bundle. It is the real answer and it
  is a second auth path in the server, not a flag.
- **Ship the shell with accounts hidden**, and be an offline single-player game on the store.
  Smallest change, and honest, but it is a different product from the website.

The rest, none of which is code:

- ~~**A signing identity.**~~ Done. Tight Line LLC is in the Apple Developer Program, an Apple ID
  is signed into Xcode, and the project carries `DEVELOPMENT_TEAM = ZJ3A78KXA4` with automatic
  signing on both configurations. The earlier note here said `security find-identity` reported
  **0 valid identities**, which was true of the machine and not of the account: it meant no Apple
  ID had been signed into Xcode yet, not that there was nothing to sign with.
- **An App Store Connect record** for `com.tightlinesoftware.blinkered`, which is where the
  TestFlight build goes and where export compliance is answered.
  `ITSAppUsesNonExemptEncryption: false` is already in `Info.plist`, which is the correct answer
  for an app that uses nothing but system TLS, and it is what stops that question being asked on
  every upload.
- **A privacy manifest.** There is no `PrivacyInfo.xcprivacy` anywhere in the project, app or
  Pods. Capacitor touches `UserDefaults`, which is a required-reason API, so this is a condition
  of upload rather than a nicety.
- **The CC BY-SA decision**, and this is still the one that actually blocks a store. It is
  **twenty-one languages now, not five**: the batch of twenty-five moved it, and German, Italian,
  Japanese and Korean are among them. The app bundles every word list, so a store build wraps
  DRM around a share-alike data file. On the web attribution is the whole obligation and we meet
  it; a binary is a different question. Dropping them was tolerable at five and is not at
  twenty-one. See the end of DICTIONARIES.md.
- **A decision about the 120MB of word lists** in the bundle -- fifty-one of them, not the
  sixteen this and apps/mobile/README.md both used to say. Fine for a development install, and
  worth weighing against downloading on demand before distribution.

**Sign in with Apple is done**, and is off this list. Guideline 4.8 makes it non-optional once
any other third-party SSO exists, which Google sign-in triggered; `apps/server/src/auth/apple.ts`
implements it, minting the client secret per exchange rather than storing a six-month JWT.
Xcode's iOS platform support is off the list too: iOS 26.5 is installed here now.

## Signing in without a browser to sign in with

The web flow cannot run in the shell, and the reasons stack three deep. Each one defeats a
different attempted fix, which is why they are all written down:

1. `sso.ts` navigates to a **root-relative** `/v1/auth/<provider>`, and a navigation does not go
   through `api.ts`, so it never becomes absolute. In the shell that resolves against
   `capacitor://localhost`, Capacitor's local server answers an unknown path with `index.html`,
   and **the app restarts at the first screen of the tour**. That is what a tester sees: an
   instant crash, with no network involved.
2. Making it absolute gets as far as `WKAppBoundDomains`, which lists this app's own domains and
   stops WebKit navigating an app-bound WebView anywhere else.
3. Turning that off gets as far as Google, which refuses OAuth in an embedded WebView outright
   (`disallowed_useragent`), and Apple, whose `response_mode=form_post` flow assumes a browser.

So the handshake happens outside the app, and the two providers arrive by different doors.

**Apple is a system sheet.** `ASAuthorizationAppleIDProvider` has no browser in it at all: it
returns a signed identity token straight to the app, which posts it to `POST /v1/auth/native/apple`
with the nonce the server issued. Nothing is exchanged and no client secret is involved --- the
whole check is the one `oidc.ts` already does, with one field different. A native credential's
audience is the **App ID**, `com.tightlinesoftware.blinkered`, where a web one's is the Services
ID, and `appleNativeProvider` exists to say so. Accepting either audience on either route would
mean a token issued to one client signs somebody in through the other.

**Google is a real browser.** `ASWebAuthenticationSession` is Safari, out of process, with its own
cookie store --- which is what makes Google willing to serve it and what puts the navigation
beyond app-bound domains. It runs the ordinary web flow, so the existing routes do all of it;
`?native=1` at the start is what changes the ending. Instead of setting a session cookie on a page
nobody will see, the callback mints a **one-minute, single-use code** and sends the browser to
`blinkered://auth?code=...`, which closes the sheet and hands the URL to the app. The app trades
that code at `POST /v1/auth/native/exchange` for the bearer token.

The code exists so the session token is not the thing in a URL. iOS hands that URL to the app, but
a URL is a URL: it can be logged and it outlives the request. Sixty seconds and one use, traded
over TLS for a year-long token, is the same handshake with a much smaller thing left lying around.
A failure takes the same route --- `blinkered://auth?error=cancelled` --- because redirecting to
`/?signin=cancelled` would load the game _inside_ the sheet, leaving a playable board in a browser
window with the app behind it waiting for a callback that never comes.

**The nonce is the server's.** `POST /v1/auth/native/nonce` issues it, the app hashes it before
Apple sees it, Apple echoes the hash inside the signed token, and the route will only accept a
nonce it issued and has not spent. Without that, an identity token lifted off the wire is valid
for ten minutes; with it, for one attempt. Spent _before_ verification, so a token that fails
checks still costs the nonce --- otherwise the nonce is something to grind against.

**Everything except the two sheets is TypeScript.** `NativeAuth.swift` fetches nothing, stores
nothing and decides nothing: it shows a sheet and returns a string. The nonce, the hashing, the
exchange, the origin and the token store are in `apps/web/src/nativeAuth.ts`, where `api.ts`
already knows the answers and where there are tests. Swift that talks to the API is Swift that
needs a second copy of all of it, and it is the copy no test runs.

### `Capacitor.Plugins` is empty here, and that is not a bug in Capacitor

The first version of this called `Capacitor.Plugins.NativeAuth.signInWithApple(...)`, which is what
every tutorial shows, and the buttons did not appear on the phone at all. `Plugins` is built by
`@capacitor/core`'s `registerPlugin`, **in JavaScript** --- and `apps/web` deliberately has no
dependency on Capacitor, so nothing ever populates it. The availability check read an empty map
and hid the buttons. `isPluginAvailable` reads the same map and would have agreed with it.

What exists without the package is the bridge the WebView is injected with, and
`Capacitor.nativePromise(plugin, method, options)` is the call its own internals use ---
`CapacitorHttp` and `Console` go through it. That is what `nativeAuth.ts` uses now.

The cost of that is real and worth naming: there is no registry to ask what the app supports, so a
shell older than its web assets gives a failed sign-in with a message rather than a hidden button.
In a TestFlight or App Store build both halves ship together and it cannot happen; in development
it means "rebuild the app", which the build phase above now does by itself.

### Two things in Xcode, and one thing to know

- **Sign in with Apple is a capability, not a library.** `App.entitlements` declares
  `com.apple.developer.applesignin`, and the App ID has to have the capability enabled as well ---
  Xcode does that for the team when the capability is added to the target. If a build fails with
  "provisioning profile doesn't support Sign in with Apple", that is the half that is missing, and
  Signing & Capabilities is where it is fixed rather than in this repository.
- **The plugin is registered by conformance, not by configuration.** Capacitor finds
  `CAPBridgedPlugin` conformers at runtime, so `NativeAuth` needs no entry anywhere; it needs to
  be in the target's Sources, which `project.pbxproj` now says it is. `xcodebuild` against the
  simulator SDK compiles it, which is as far as a Mac can check it.
- **The shell talks to production.** `NATIVE_API_ORIGIN` is `https://playblinkered.com` and is
  deliberately not configurable, so an account created while testing on a device is a real
  account and a game played in it goes on the real boards. Dev is behind the VPN and a phone
  cannot reach it, so there is no arrangement where this is otherwise.

## No zooming, in three parts

Nick: "clicking on the language drop-down causes the game to zoom in slightly, cropping the side
edges ... double-tapping the screen anywhere zooms back out, but most users aren't going to know
that." Three separate mechanisms, each needing its own answer.

**A focused field under 16px.** WKWebView zooms the page in and does not zoom back out. This block
used to name three controls --- the nerd panel's fields and the board's difficulty select --- and
naming them is exactly what let the language list's search box keep 13.6px and do it again. It is
one variable now, `--field-size`, which the touch block raises to 1rem: a media query adds no
specificity, so `input { font-size: 1rem }` inside one loses to `.nerd-row input` written earlier,
while inheritance has no such argument. The search box also had no size of its own and inherited
`.drop`'s --- a field whose size comes from its container is a field nobody thinks about.

**Double-tap.** `touch-action: manipulation` on the root, which keeps panning and pinch and drops
the 300ms wait that came with double-tap detection. Tiles and buttons have said it for a while,
each for their own reason; the page as a whole has the same one.

**Pinch, in the shell only.** `viewport.ts` pins the viewport when `isNativeApp()`, and the
website keeps pinch-zoom deliberately: taking it away is a WCAG 1.4.4 failure on a site that has a
high-contrast theme precisely because it takes that seriously. An installed app is different ---
no address bar, so a zoom nobody meant has no obvious way back.

Verified by measuring every focusable field's computed size under an iPhone emulation, on the
setup screen, the language list, the sign-in dialog and the nerd panel: zero that would zoom.

## Three palettes, and the arithmetic behind them

Traditional, light and high contrast, chosen from **the title bar** and kept per device --- a fact
about the room somebody is in and the eyes they are reading with, which is why it is not synced
from the account.

It started as a row of chips on the setup screen and that was the wrong place: most people will
never touch it, and the ones who need it need it on every screen rather than only before a game.
It is one glyph and a caret up top now --- `◐`, the mark every operating system already uses for
brightness and contrast, which `☯` would have carried other meanings into. The control is the
language picker's `Dropdown` told to wear a mark instead of a label, which is what keeps the
keyboard behaviour a hand-written menu would have had to earn back: arrow keys, Home and End,
Escape, click-outside, focus returning to the trigger.

**It also found a bug that had already shipped.** The measured collapse hides `.drop-value` to
shrink a trigger to its flag --- and `.drop-value` is the selected language on the trigger _and_
the name on every row of the list underneath it. Unscoped, the language menu on any screen below
600px was a column of flags with invisible names, and the new theme menu was three blank rows.
Scoped to `.drop-trigger .drop-value` now: it is the trigger that has no room for a word, and the
popup has all the room it needs.

Two things had to be true before a second palette was possible at all. **The face of a tile was a
literal `#1f2630` in three rules**, which is a colour no theme can reach, and in daylight it is a
dark tile with dark letters on it; it is `--face` now, with `--face-down` for the other side of
the same tile, because in the light theme a card is white and a white tile beside a white tile is
not a board. And **the accent had no ink of its own**: six rules wrote `color: #fff` on top of
`--sel`, which in a high-contrast theme is white on a bright blue at 2.15:1 --- the pairing that
looks strongest and reads worst. `--on-sel` is black there and white in the other two.

`apps/web/test/themes.test.ts` measures every pairing the interface draws against the floor WCAG
sets for it: 4.5:1 for text, since none of this interface's text is large by WCAG's definition,
and 3:1 for the borders and rings that identify a control. It also asserts that each theme defines
every token, because a missing one inherits the traditional value and looks almost right.

**The traditional theme missed two of those floors and does not any more.** White on the accent
was 3.75:1 where AA wants 4.5 -- and the primary button, the selected tile and four other places
write _on_ the accent rather than beside it -- while its borders were 1.46:1 against the page where
1.4.11 wants 3. In a dark theme whose cards are 1.09:1 against the page, that border is doing the
whole job of saying "this is a control", and an input was a shape you inferred from its contents.

Both are fixed at the least change that clears them. The accent is `#1f6feb`: darkening it is
pulled against by the other direction, because the accent also has to be findable _on_ the page as
a focus ring, and the window between the two floors is narrow. The border is `#616a74`, where
`#5d666f` is 2.96:1 against a card and misses. The app icon in `brand/` is still the older blue --
a fixed mark rather than a token, and re-rendering ten PNGs and an App Store asset for a shade is
its own decision.

The light theme's border is the one value that was solved rather than picked: `--line` has to
clear 3:1 against the page, against a white card **and** against a face-down tile, and that last
surface is the one that sets it at `#767f89`.

`index.html` applies the stored palette before the first paint. Without that, choosing the light
theme means a dark page flashing on every launch, which is the sort of thing that reads as a bug
in the app rather than a theme system working correctly.

## How this was checked, and what that cannot tell us

Playwright driving **WebKit** at real iPhone and iPad device descriptors. Same engine family as
Mobile Safari, real touch-event synthesis, real `pointer: coarse` and `hover: none`, and the
production build rather than the dev server. No iOS Simulator runtime is installed on this
machine, so this is as close as it gets here.

What it genuinely verifies: geometry, tap targets, computed styles, whether a tap reaches a
control, and a whole game played by touch.

One note on playing a game out, because the first attempt at the leaderboard check failed in an
instructive way. It submitted a word every time it could find one, and every accepted word pays
flips back, so a bot that never misses never runs out: 315 words in and the game was still
going. Draining the flip budget means submitting **nothing** and letting the reveals spend it,
which ends a default game in about twelve rounds. A test of the end of a game has to be bad at
the game.

What it cannot: **actual safe-area inset values** (the emulated viewport has none, so the
landscape notch padding is reasoned from the spec rather than measured), **the URL bar
resizing** the viewport, **the focus-zoom behavior** itself as opposed to the font sizes that
trigger it, and **home-screen installation**. Those four want five minutes on a real iPhone.

The checks live in the scratchpad rather than the repo, which is the honest gap here: STATUS.md
item 1 is still a Playwright suite, and these should become part of it rather than staying a
set of scripts that happened to be run once.
