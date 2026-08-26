# Blinkered

A word game where the letters hide from you.

Tiles flip face up one per tick, in reading order. You spell words from what is exposed.
Every reveal costs a flip; every word pays some back. When the flips run out, the game is
over. The full rules, and the decisions behind them, are in [docs/PLAN.md](docs/PLAN.md).

## Play it in a browser

```
pnpm install
pnpm wordlist     # packs a word list into apps/web/public (once)
pnpm dev          # http://localhost:5173
```

Type the word. Enter completes it, Escape clears the word, Backspace undoes the last letter,
shift-X clears all selected Xs, and clicking tiles works too. **Nerd mode**, the toggle top right, shows every rule and the arithmetic behind
it: how long the whole board stays up, what a round costs in flips, and what each word
length pays against what its letters cost.

`pnpm wordlist` is a stopgap. It packs the system dictionary, which is Webster's 1934 and a
list of base forms, so it knows HISS but not HISSES while cheerfully accepting OWSE. The
real two-tier list replaces it behind the same interface.

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

```
packages/engine     the whole game as one pure reducer. No clock, no I/O, no DOM
packages/words      word lists, the anagram solver, board generation, weight derivation
tools/harness       terminal front end for the engine
tools/derive        derives draw weights and calibration from a word list
docs/PLAN.md        rules, architecture, phases, open questions
```

## Adding a language

Everything language-specific lives in one `Alphabet`: draw weights, vowels, which letters are
too rare to appear twice, which need a companion (English Q needs a U), how a typed key folds
onto a tile, and how a word splits into tiles. Given a word list, the numbers come from the
repo rather than from guesswork:

```
pnpm derive --words=<list> --language=<tag>
```

That derives the draw weights from the language's own vocabulary, suggests which letters are
too rare to double, and prints the calibration table `defaultWMin` needs. See PLAN.md section
5, which also covers why accents and diacritics are different problems.

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
