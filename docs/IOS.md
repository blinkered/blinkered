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
chrome. Two rows now, mostly by dropping the picker's visible label. The trigger already shows a
flag and the language's own name for itself, which says "language" better than the word does;
the label stays in the accessibility tree via `.sr-only` rather than being removed, because
`aria-labelledby` points at it.

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
on top of it. Generated from an SVG by screenshotting it in headless WebKit, so there is no
image toolchain to install and no binary asset whose source has been lost.

`.webmanifest` is not in nginx's `mime.types`, so without a `default_type` it ships as
`application/octet-stream`. Browsers are forgiving and Safari is the one that matters here, but
a file served as the wrong type is a thing waiting to break.

## There is no service worker, on purpose

The obvious next PWA box to tick, and it is not ticked. Offline is not something the game does
on the web either, so adding it here would be new behavior rather than parity, and the payload
is twenty-three word lists of which Russian, Turkish and Arabic are 8.5 to 9MB each — caching that is a decision about a
player's storage, not a detail. A stale service worker is also the classic way to serve last
week's bundle to somebody who has cleared everything else.

Add it when offline play is a feature somebody asked for, and cache the app shell plus the one
language in play.

## What the native app still needs

The Capacitor shell exists and consumes this build unchanged, which was the point of doing the
browser work first: the touch targets, the self-sizing board and the safe-area padding are the
same code inside a WebView. What is left is not code.

- **A signing identity**, which cannot be scripted, because it is an Apple ID typed into Xcode.
  A free one installs to your own phone and expires after seven days; the paid Developer Program
  signs for a year and unlocks TestFlight. See apps/mobile/README.md.
- **Xcode's iOS platform support**, a multi-gigabyte download separate from Xcode itself. Its
  absence presents as `iOS 26.5 is not installed` and no build destination, which reads like a
  broken project.
- **The CC BY-SA decision**, and this is the one that actually blocks a store. Five languages
  ship under it: Italian, German, Norwegian, Finnish, Malay. The app bundles every word
  lists, so a store build wraps DRM around a share-alike data file. On the web attribution is the
  whole obligation and we meet it; a binary is a different question. See the end of
  DICTIONARIES.md.
- **Sign in with Apple**, which App Store guideline 4.8 makes non-optional once any other
  third-party SSO exists. Not yet relevant: there are no accounts until PLAN.md phase 4.
- **A decision about the 53MB of word lists** in the bundle. Fine for a development install, and
  worth revisiting before distribution against downloading them on demand.

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
