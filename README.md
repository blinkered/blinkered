# Blinkered

A word game where the letters hide from you.

Tiles flip face up one per tick, in reading order. You spell words from what is exposed.
Every reveal costs a flip; every word pays some back. When the flips run out, the game is
over. The full rules, and the decisions behind them, are in [docs/PLAN.md](docs/PLAN.md).

## Play it in a browser

```
pnpm install
pnpm dev          # http://localhost:5173
```

Type the word. Enter completes it, Escape clears the word, Backspace undoes the last letter,
shift-X clears all selected Xs, and clicking tiles works too. **Nerd mode**, the toggle top
right, shows every rule and the arithmetic behind it: how long the whole board stays up, what
a round costs in flips, and what each word length pays against what its letters cost.

Sixteen languages, picked from the flag menu, which sets the interface language too. The word
lists are committed, so there is no build step before playing; `pnpm dictionary build`
regenerates them and [docs/DICTIONARIES.md](docs/DICTIONARIES.md) explains where they come
from and why they are the size they are.

## Play it in a terminal

```
pnpm play
```

The harness runs the same engine, and is still the fastest way to argue with the rules.

```
pnpm play --difficulty=hard
pnpm play --mode=shuffle --economy=perLetter      # the pairing we think is unbounded
pnpm play --mode=keep --min=4 --keys=modifier
pnpm play --hold=5 --speed=2                   # generous: a long look at the whole board
pnpm play --seed=4242                            # same board every time
pnpm play --help
```

While playing: **type the word**. Letter keys select the next tile bearing that letter,
Enter submits, Escape clears, Backspace undoes. Digits 1-9 and 0 tap the first ten tiles by
position, which is only useful for exercising the pointer path. Ctrl-C quits and prints a
summary.

The board is twelve tiles by default, `--n` for anything else. Board size is a player's
choice rather than a difficulty setting: the flip budget and the word floor are derived from
it, so a level lasts the same number of rounds at any size.

Three rules are settings rather than assumptions, because they can only be settled by
playing: what an accepted word does to the board (`--mode`), what a word pays in flips
(`--economy`), and the minimum word length (`--min`). See PLAN.md section 1.10.

`--hold` is the difficulty dial worth reaching for first. It is how many extra ticks the
board stays fully exposed after the last tile appears. At zero you get a single tick with
everything visible; the presets run from three on easy down to zero on insane. It buys time
without making the letters easier, and it does not change what a round costs in flips.

The harness reads `/usr/share/dict/words` as a placeholder. The real two-tier word list
arrives in phase 2.

## Layout

Start with [docs/STATUS.md](docs/STATUS.md) for the state of play, then
[docs/PLAN.md](docs/PLAN.md) for the design and [docs/DICTIONARIES.md](docs/DICTIONARIES.md)
for how word lists are built. [docs/IOS.md](docs/IOS.md) covers the phone, which is the same
build and not the same machine.

```
packages/engine     the whole game as one pure reducer. No clock, no I/O, no DOM
packages/words      word lists, the anagram solver, board generation, weight derivation
tools/harness       terminal front end for the engine
tools/derive        derives draw weights and calibration from a word list
docs/PLAN.md        rules, architecture, phases, open questions
apps/server         Hono API. Accounts, history and leaderboards; owns no game rules
apps/mobile         Capacitor iOS shell. Runs apps/web's build; owns no game code
docs/IOS.md         what had to change for a phone, and how each bit was measured
docs/PROPOSALS.md   features that are wanted but not built, and what each still needs
docs/ACCOUNTS.md    accounts, history and leaderboards: the design, not yet built
```

## Adding a language

Three pieces, and none of them is the engine. An `Alphabet` in
`packages/engine/src/languages.ts` holds everything language-specific: draw weights, vowels,
which letters are too rare to appear twice, which need a companion (English Q needs a U), how
a typed key folds onto a tile, and how a word splits into tiles. A `Messages` set in
`packages/i18n/src/locales/` holds every string. And a source entry in
`tools/dictionary/src/manifest.ts` says where the words come from and under what licence.

Then, in this order, because each step depends on the one before:

```
pnpm dictionary build --language=<tag>   # fetch, validate, write the list
pnpm dictionary weights --language=<tag> # draw weights, from its own vocabulary
pnpm dictionary floor                    # the word floor, from the new weights
```

Getting the last two backwards calibrates the board against a guess, and getting them wrong
is silent rather than loud. [docs/DICTIONARIES.md](docs/DICTIONARIES.md) has the details;
PLAN.md section 5 covers why accents and diacritics are different problems.

## Deploying it

```
git push                          # CI builds and pushes the image to GHCR
kubectl apply -f deploy/k8s/
```

The container is nginx serving the built files, which is all Blinkered needs until accounts
arrive. [docs/DEPLOY.md](docs/DEPLOY.md) covers the rest: why the image is built in CI rather
than on a laptop (an Apple Silicon build is arm64 and will not start on an amd64 node), how to
let the cluster pull from GHCR, and why the word lists are pre-compressed at build time.

## Checks

```
pnpm check          typecheck, lint, format, and the test suite with coverage
pnpm test           tests only
pnpm coverage       tests with the 100% engine coverage gate
```

The engine is held at 100% lines, branches, functions and statements. That is affordable
only because the engine is pure: the reducer takes a state, an event and a dictionary, and
returns the next state plus the effects the view should animate. Every rule is reachable
from a test without a timer or a browser.

## Licence

Code is Apache-2.0; see [LICENSE](LICENSE). The **Blinkered** name and any logo are
reserved and not covered by it: fork the game freely, but ship it under your own name.

Word lists are third-party data with their own licences, kept out of the code licence
entirely. See [packages/words/data/README.md](packages/words/data/README.md), which
explains why a GPL dictionary is a distribution problem for a mobile binary rather than
merely an attribution one.

## Status

Phase 0 and 1 are done: workspace, CI, the engine, and the harness. Phase 2 is the packed
two-tier dictionary, the board generator that guarantees W words, and the balance simulator
that replaces the guessed difficulty numbers. Phases 3 onward are the web game, accounts,
and the Capacitor builds.
