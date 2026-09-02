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

Nineteen languages, picked from the flag menu, which sets the interface language too. The word
lists are committed, so there is no build step before playing; `pnpm dictionary build`
regenerates them and [docs/DICTIONARIES.md](docs/DICTIONARIES.md) explains where they come
from and why they are the size they are.

## Run the whole thing

```
docker compose up
```

Then <http://localhost:5173>. Postgres, the API and the site, and **all three reload when you
save**: edit `apps/web/src` and the page hot-reloads, edit `apps/server/src` and the API restarts,
edit `apps/server/src/schema.ts` and the migration is generated and applied to the database. Each
takes about two seconds. Nothing else to run and nothing to remember.

The site and the API are on one origin there, as they are in production, so a session cookie
behaves the same way in both.

`docker compose down -v` stops it and discards the database. `docker compose build` is needed
only after changing a dependency, because `node_modules` lives in the image rather than in the
mount.

**None of this is deployable and none of it is trying to be.** What deploys is built by CI on a
Linux runner; a laptop builds arm64 and the cluster would pull it and die with `exec format
error`. See [docs/DEPLOY.md](docs/DEPLOY.md).

`docker compose up -d postgres` is the database on its own, which is all the test suites need.

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
                    Its README has the local Postgres and how to run the migrations
apps/mobile         Capacitor iOS shell. Runs apps/web's build; owns no game code
docs/IOS.md         what had to change for a phone, and how each bit was measured
docs/PROPOSALS.md   features that are wanted but not built, and what each still needs
docs/ACCOUNTS.md    accounts, history and leaderboards: the design, not yet built
docs/LANGUAGES.md   which languages are next, and what each one costs
```

## Adding a language

Six pieces, and none of them is the engine. Four of the six are enforced rather than remembered,
which is noted against each: a language that is half-added should not build.

1. **An `Alphabet`** in `packages/engine/src/languages.ts`: draw weights, vowels, which letters
   are too rare to appear twice, which need a companion (English Q needs a U), how a typed key
   folds onto a tile, and how a word splits into tiles.
2. **A `Messages` set** in `packages/i18n/src/locales/`, holding every string the game says, in
   the spirit of the English one rather than translated word for word. _Enforced:_ `Messages` is
   a type, so a missing string is a compile error.
3. **A `Locale` entry** in `packages/i18n/src/registry.ts`: tag, the language's own name for
   itself, and a flag. _Enforced:_ the type requires all three, and a test asserts every locale
   has an alphabet and that the count is what it should be, so adding one is a deliberate act.
4. **A source entry** in `tools/dictionary/src/manifest.ts`, saying where the words come from and
   under what licence. That file is the licence audit; read the end of DICTIONARIES.md first.
5. **A tutorial board** in `packages/words/src/tutorialBoards.ts`: six tiles whose first three
   spell a word, a six-tile word that uses all of them, and a card that becomes a letter making a
   third word from the other five. Searched for rather than chosen, by `pnpm dictionary board`,
   which ranks candidates by the **worst** of their three words in the corpus so that a board
   only scores well when all three are words a speaker uses. _Enforced:_ `tutorialBoard.test.ts`
   asserts a board exists for every language in the manifest and checks every one of those
   properties against the shipped word list, including that the board **cannot** spell the card's
   word without it.
6. **Nothing for the keyboard.** The `A … Z` row derives its two letters from the alphabet,
   sorted by that language's own collation, so Greek reads `Α … Ω` and Norwegian `A … Å` without
   anybody deciding.

Then, in this order, because each step depends on the one before:

```
pnpm dictionary build --language=<tag>   # fetch, validate, write the list
pnpm dictionary weights --language=<tag> # draw weights, from its own vocabulary
pnpm dictionary build --language=<tag>   # again: density depends on the weights
pnpm dictionary board --language=<tag>   # the tour's six tiles and three words
pnpm dictionary floor                    # the word floor, from the new weights
```

Order matters and is silent when it is wrong. Weights come from the list, board density comes
from the weights, and the floor curve comes from both, so deriving the weights against a
guessed table and then not rebuilding calibrates everything after it against the guess. [docs/DICTIONARIES.md](docs/DICTIONARIES.md) has the details;
PLAN.md section 5 covers why accents and diacritics are different problems.

### What a new script may cost, before any of the above

Every shipped language is alphabetic and left to right, and three assumptions
rest on that. None is hard to find; all three are cheaper to know about first.

- **One code point per tile.** `byCodePoint` splits a word by code point, and `segmentBy` handles
  a fixed list of digraph letters, which is what Croatian LJ and DŽ need. Neither describes an
  abugida: in Devanagari or Bengali a written syllable is a consonant plus a vowel sign, and
  splitting by code point puts a mark that cannot stand alone on a tile of its own. Those scripts
  need a decision about what a tile **is** before they need a word list.
- **Left to right.** Reveal order, tile positions and the word line all mean "reading order" and
  all assume one direction. Nothing in the app or the CSS knows about `direction: rtl` yet, so
  Arabic and Hebrew want that work doing once, and both would then benefit.
- **A frequency list.** The common tier is a size band intersected with corpus frequency, and the
  tutorial board is ranked by it too. A language with a lexicon but no corpus can be validated
  and cannot be calibrated, which is a different and harder gap than a missing dictionary.

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
