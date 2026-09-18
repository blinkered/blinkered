# Blinkered: Build Plan

A word game where the letters hide from you.

## 0. Decisions taken

| Question        | Decision                                                                                                 | Why                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Client platform | React + TypeScript + Vite on the web, wrapped by Capacitor for iOS (an Android shell is not built)       | One codebase, one rendering model, one test suite; the native shells are additive and can come later      |
| Backend         | Own Node API (Hono) + Postgres in-cluster on tl-prod, Auth.js for SSO, Drizzle for schema                | The client holds no database credential at all, only a session; score verification is just a route        |
| Round rule      | `spend`. A completed word takes its letters off the board and the round continues                        | Decided by playing it: spending the letters adds anxiety. `shuffle` and `keep` stay available as settings |
| Flip economy    | Also a runtime setting (`none`, `perLetter`, `fibonacci`, `overMinimum`), default hypothesis `fibonacci` | Fibonacci flips are what actually make short words cost you ground and long words pay; see 1.10           |
| Dictionary      | Two tiers: full list accepts words for credit, common list is what the generator counts toward W         | Keeps boards humanly solvable without disallowing legitimate obscure finds                                |

## 1. Canonical rules

This section is the spec the engine implements. Where the prose in the original brief was ambiguous, the resolution is called out.

### 1.1 Vocabulary

- **tile**: one of N letter tiles on the board, each holding exactly one letter
- **tick**: one time step, lasting `speedMultiplier` real seconds. The on-screen timer counts ticks, not seconds
- **round**: one reveal-and-hide cycle, `N + holdTicks` ticks long
- **hold**: ticks at the end of a round where the board sits fully exposed and nothing new appears
- **flips remaining**: the game's life meter. Revealing a tile costs 1. Completing a word of length L awards L
- **spent**: a tile whose letter was used in a completed word. Whether it goes face down, and whether the round survives at all, depends on the word-complete mode in 1.10

### 1.2 Round lifecycle

A round is `N + holdTicks` ticks long.

1. Round begins. The timer reads `N + holdTicks` and tile 1 (top-left) is revealed immediately.
2. On each tick the timer decrements and the next tile in reading order (left to right, top to bottom) is revealed. Tile k appears when the timer reads `N + holdTicks + 1 - k`, so the last tile lands with `holdTicks + 1` ticks remaining.
3. The board then sits fully exposed for the rest of the round, `holdTicks + 1` ticks in total.
4. At timer 0 every tile flips face down, the tiles visibly shuffle to new positions, and a new round begins.

**The hold is the main difficulty dial.** With `holdTicks` at zero the last tile lands with one tick left, and that is every second you get with the whole board in front of you, which is punishing at any speed. Raising the hold buys thinking and typing time without making the letters easier and without changing what a round costs, since reveals are what cost flips. That makes it a cleaner lever than the clock: speed decides how fast letters arrive, the hold decides how long you have to use them.

Revealing a tile decrements flips remaining by 1, so a round that runs its full course costs exactly N flips. A reveal never happens when flips remaining is 0, so the counter cannot go negative.

Under `shuffle` mode (see 1.10) a round can end early, having revealed fewer than N tiles and so having cost fewer than N flips. That has sharp economic consequences, covered there.

**A round also ends early when it can no longer produce a word** (0.4.0). Count the letters it can still put in front of the player: the ones face up and unspent, plus the ones a flip could still turn over. If that is below the minimum word length, nothing the player does for the rest of the round can matter, so the next board is dealt instead of the remaining ticks being spent. Playtesting: "the remaining flips count down at the normal rate which is a waste of user time."

Nothing is charged for the tiles it skips, since flips are spent by reveals that happened and by nothing else; billing for reveals that did not happen would make clearing a board dearer than dawdling on one. The view covers the board and says why for 1.5s before the next round starts, because a board that deals itself early with no warning reads as a bug. The clock is held while that notice is up, so reading it is free, and it is not the pause flag: a hold the game imposed is not the player stopping the clock, and must not cost them leaderboard eligibility.

### 1.3 Forming words

**The keyboard is the primary input device.** You type the word. Pointer input exists and is equal in power, but the keyboard is what makes the game playable at speed.

- Typing a letter selects the next unselected, exposed, unspent tile bearing that letter, in reading order. Typing it again takes the next copy, so BANANA is typed exactly as it reads
- Enter submits. Escape clears the whole word. Backspace drops the last letter
- Tapping or clicking an exposed tile appends its letter. Tapping the most recently selected tile undoes it; tapping one from the middle of the word does nothing
- The keyboard consults **only revealed tiles**. A key for a letter that is on the board but still face down does nothing at all, exactly as if that letter were absent. Anything else would turn the keyboard into an oracle for the hidden board

How a repeated letter key behaves when the board holds several copies is a keyboard ergonomics question rather than a rules question, so the keymap maps a keystroke to an intent and the reducer resolves it. Two schemes ship as a preference:

- `cycle` (default): with N copies of A on the board, each of the first N presses takes one and the N+1th cancels them all. Typing ALIAS against a board holding one A goes A, AL, ALI, LI, LIS
- `advance`: the first N presses behave identically and the N+1th does nothing, so typing is never destructive

Either way the clear modifier clears every copy of a letter at once: Shift in a browser, since macOS turns Option into an accented character and Ctrl and Cmd belong to the browser, and Ctrl in the terminal harness.

**The cycle decision belongs to the reducer, not the view.** Choosing between taking another copy and cancelling them all depends on live game state. When the keymap made that choice from a snapshot of state, identical keystrokes produced different words depending on whether the view had re-rendered between them: typing ALIAS slowly gave LIS and typing it quickly gave ALIS. `CYCLE_LETTER` is therefore a single event that the reducer resolves, and the keymap knows nothing about the game at all.

Each tile contributes at most one letter to a word. A word needing a double letter needs two tiles carrying it.

**The reveal order gates which words are spellable, and this is the deepest mechanic in the game.** Letters are appended in tap order, and a tile can only be tapped once revealed. So to spell STONE while the board is still revealing, the tiles carrying S, T, O, N and E must occupy positions whose reading order matches that spelling. Any word whose letters sit in a different order can only be assembled after every tile it needs is face up, and a word needing the last tile can only be completed in the final tick.

Two consequences worth stating plainly:

- The shuffle permutation is not just a memory test. It decides which words are reachable at all this round, which is why the shuffle has to be watchable
- Long words are constrained by dexterity as much as by vocabulary. Assembling eight letters inside the one-tick full-exposure window is not physically possible at hard speeds, so a long word has to be built incrementally as its letters appear in order. That difficulty is the main argument for a reward curve that pays disproportionately for length

### 1.4 Submission outcomes

Rejections are free. No score, no flips, no penalty; the selection clears and every tile stays live.

| Outcome                         | Effect                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------- |
| Not in the dictionary           | selection cleared, "not a word"                                                 |
| Already found this game         | selection cleared, "already found"                                              |
| Shorter than the minimum length | selection cleared                                                               |
| Valid and new                   | score `+score(L)`, flips per the flip economy, board per the word-complete mode |

Duplicate detection is per game and case-insensitive. What the board does after an accepted word, and what the word pays in flips, are both runtime settings rather than fixed rules. See 1.10.

### 1.5 Scoring

Word score is the Fibonacci sequence anchored at the brief's table:

```
score(2) = 1
score(3) = 2
score(L) = score(L - 1) + score(L - 2)
```

Giving 1, 2, 3, 5, 8, 13, 21, 34 for lengths 2 through 9. Time remaining never affects word value. Game score is the sum of word scores.

### 1.6 Game end

The game ends when nothing the player can do, in this round or in any round after it, can produce another word. Both halves have to be false for it to continue:

- **this round is dead**: the letters face up and unspent, plus the letters a flip could still turn over, come to fewer than the minimum word length
- **every future round is dead too**: a fresh board deals every tile back unspent, so what it would offer is `min(N, flips remaining)`, and that is also below the minimum

Otherwise the round is allowed to finish, so a player can bank one last word with what is already exposed. That is not necessarily a losing position: under any economy but `none` a word pays flips back, which revives the round and lets reveals resume. The test fires after any event, so spending the last usable tiles in a word ends the game just as surely as running out of flips does. The word still scores.

**This used to be "flips remaining is 0, and ..."** (before 0.4.0), which made a game with two flips left and a four-letter floor formally unfinished: it went on turning tiles over at full speed to reach a position that was already decided. Counting what the flips can still _reach_ ends it at the moment it becomes true. It is also what makes the early deal in 1.2 safe from looping: reaching that rule means a fresh board offers enough letters, so the round it deals cannot be barren in turn.

**The economy is deliberately lossy.** A full round costs N flips and pays back whatever the flip economy awards for the words made. Breaking even generally means using nearly every revealed letter. So flips decay, every game ends, and the score is how long you held out. Expected game length is roughly `initialFlips / (N - averageFlipsEarnedPerRound)` rounds.

Whether that holds depends entirely on which economy is selected, and some combinations do not hold at all. See 1.10.

### 1.7 Board generation

1. Draw N letters with a frequency-weighted distribution (not uniform, or you get boards of consonants)
2. Solve the multiset: count distinct **common-tier** words of length >= M formed from the tiles, each tile used at most once
3. If the count is below W, discard and redraw. Cap attempts and log the rejection rate

W is a board-quality filter, not a target. Because tiles are spent and the board is only briefly fully exposed, the words actually reachable in play are far fewer than W.

**A word count alone is the wrong filter, measured rather than guessed.** Sampling thousands of draws against the placeholder dictionary (min word 3):

| N   | Median words | Admits a 6-letter word | A 7-letter word |
| --- | ------------ | ---------------------- | --------------- |
| 6   | 15           | 17%                    | impossible      |
| 7   | 26           | 44%                    | 5%              |
| 8   | 50           | 79%                    | 38%             |
| 9   | 75           | 91%                    | 62%             |
| 10  | 116          | 97%                    | 83%             |

Under the fibonacci economy a five-letter word exactly breaks even, so **a board whose longest word is five letters cannot be played at a profit however well it is played.** An eight-tile board admitting 81 words but nothing longer than five (EPSTOWWE, two W's and two E's) is strictly worse than a board with 40 words and one seven-letter answer. Acceptance therefore needs three tests, not one:

1. at least W common-tier words of at least the minimum length
2. **a ceiling**: at least one word, preferably two, of length 6 or more
3. **no letter faults**, which are properties of the alphabet rather than of the game:
   - no duplicate of a rare letter (J K Q V W X Z in English). Only a few percent of draws carry one, and they are what produces a rich-looking board with no long words
   - no letter left without a companion it needs. A Q with no U in English can be revealed and never used: about 15% of twelve-tile draws hold a Q, and two thirds of those have no U, so roughly one board in ten was carrying a dead tile before this rule existed

W itself is derived, not written down per level: `defaultWMin(n, minWordLength, language)` reads a measured median word count for the board size, scales it for the minimum length and for how rich that language's board is, and aims at 70% of it so acceptance costs a draw or two rather than hundreds. Those medians and the draw weights come from `pnpm dictionary weights` and `pnpm dictionary floor` reading the actual word lists; regenerate them whenever a list changes, because they describe a dictionary rather than the rules. The language term is not optional: at twelve tiles an Italian board admits 183 words and a Russian one 69, so a single floor would be unreachable in Russian and free in Italian.

The draw weights are worth a note. They were originally Scrabble's, which are letter frequencies in _running text_. Derived from dictionary words instead, C is 5 rather than 2 and L and S are 6 rather than 4, because a board has to spell words rather than sentences. Boards got measurably richer as a result: the median twelve-tile board went from 248 words to 464.

`ceilingMin` sits in the game config alongside `wMin`, so the whole acceptance rule is recorded with every stored game. All three tests are already enforced in the terminal harness. At the default twelve tiles every board it hands you holds a six-letter word and nearly all hold a seven or eight.

The current W numbers do almost no filtering: medium, hard and insane accept the first or second draw. The ceiling test is what will actually be doing the work.

### 1.8 Determinism

Everything random is drawn from a seeded PRNG whose state lives in the game state: the letters, the initial layout, and every shuffle permutation. Given `(seed, difficulty, orderedInputEvents)` the entire game replays identically. This single property buys deterministic tests, bug reproduction from any recorded game, server-side score verification, and replay playback later.

### 1.9 Difficulty

Still bids rather than simulator output, but twice revised by playing. `DIFFICULTIES` in
`packages/engine/src/difficulty.ts` is the source of truth; this table is the current state of it
and the reasoning for each column lives beside the code.

| Level  | Seconds per tick | Hold | Rounds of life | Min word | Swap rate | Round (at N=12) | Full board | Floor    |
| ------ | ---------------- | ---- | -------------- | -------- | --------- | --------------- | ---------- | -------- |
| Easy   | 1.5              | 5    | 7              | 3        | 0         | 25.5s           | 7.5s       | 2.98 min |
| Medium | 1.3              | 4    | 8              | 3        | 0.25      | 20.8s           | 5.2s       | 2.77 min |
| Hard   | 1.2              | 3    | 9              | 4        | 0.5       | 18.0s           | 3.6s       | 2.70 min |
| Insane | 0.9              | 2    | 10             | 4        | 0.5       | 12.6s           | 1.8s       | 2.10 min |

Two columns decide how a level feels, and they are not the same thing.

**Full board** is the perception budget: how long you hold the whole thing in front of you. The
first retune (0.2.0) existed because this column used to read 8.0s, 3.6s, 1.8s, 0.7s and then 0s
at the bottom -- insane gave no thinking time at all and hard gave a glance, so the top of the
ladder had nothing between its rungs. It halves now instead of vanishing.

**Floor** is the endurance budget: how long a game lasts if you score nothing, which is every
round the flip budget pays for at that level's own pace. The second retune (0.4.0) existed
because this column read 7.1 minutes on easy, and a first game nobody can lose for seven minutes
is a first game people put down. Playtesting: "too many flips for so slow a game."

**Rounds of life read backwards on purpose.** They climb, 7 to 10, while the floor falls. A round
is 25.5s on easy and 12.6s on insane, so equal round counts would be unequal sittings; what a
player feels is the wall clock, so that is the column held in order and the round count is
whatever produces it.

**Board size is a player's choice, on an axis of its own.** N is absent from the table because it
is not a difficulty dial. A bigger board is harder to track and gives less time per tile, but it
admits far more words and much longer ones, so it is easier to score on; under the fibonacci
economy the small board is the harsher one, since at N=6 a seven-letter word is arithmetically
impossible and only 8% of raw draws reach even a six. The default is **12**, laid out 4x3 in
landscape and 3x4 in portrait, where 97% of raw draws reach a six-letter word. A player can pick
another size and keep whatever difficulty they were playing.

Those two percentages are measured with `Dictionary.profile`, which is the board generator's own
solver and counts **the common tier only**. That matters, because the same question answered
against the full tier gives a much friendlier number -- a seven-letter word is there in 98% of
twelve-tile draws by the full list and 84% by the common one -- and both are true of different
things. The floor is what a board is required to hold; credit is what a player is allowed to find.
Earlier drafts of this section quoted the two instruments against each other, and once quoted the
five-letter figure as if it were the six.

That only works if the two rules that scale with the board are derived from it rather than fixed:

- **Flip budget.** A round costs one flip per tile, so a profile specifies _rounds of life_, not flips, and the engine multiplies by N. Twelve rounds is twelve rounds at any size; a fixed flip count would make the same level twice as long on a small board
- **Word floor.** W is derived from N and the minimum word length, because a count that filters hard at nine tiles is trivial at twelve and unreachable at six. See 1.7

Note what the clock does _not_ scale: reveal time is `N x speedMultiplier`, so a bigger board makes a longer round at the same tick rate. At twelve tiles easy runs a 25-second round, which may simply be too slow to sit through; that is a tuning question for the simulator rather than a structural one, but it is the first thing to look at if easy feels sluggish.

Everything else in a difficulty profile is board-independent by construction: the clock, the hold, and the vocabulary floor. The full-board window in particular depends only on the hold and the clock, so it is identical at every board size. `defaultWMin` and the flip derivation are covered by tests that assert a level lasts the same number of rounds at every size.

**Minimum word length is not a pure difficulty dial either.** Raising it removes the option of short words, which makes it harder to find anything, but the words it forbids are exactly the ones that lose you flips under fibonacci. So a higher floor is harder to score against and gentler on the life meter at the same time. Another thing for the simulator to weigh rather than assume.

**N is inverted as an economic dial, and the ladder does not use it.** A bigger board is harder to
track and leaves less time per tile, but it admits far more words and much longer ones, which
under fibonacci makes it economically _more generous_. A seven-letter word is arithmetically
impossible at N=6, and only 8% of six-tile draws even reach a six, so a player who wants the
generous economy plays a bigger board rather than an easier level.

That is why the ladder carries difficulty on the clock, the hold, the minimum word length and the
swap rate, and why board size sits outside it as the player's own choice: the two would otherwise
fight. Every accepted board reaches six letters at any size by construction -- `ceilingMin` is 6
and the generator retries until it clears -- so the 8% is how hard the generator has to work at
N=6, not what the player is handed. Since board size is part of the recorded ruleset, ranked play
groups by it.

Minimum word length is a runtime setting, not a constant. Two-letter words are a dictionary-trivia contest (AA, XI, ZA) worth 1 point, and allowing them makes the game more obscure rather than easier, so the floor is 3. Raising it to 4 on the harder levels is a way to make difficulty about vocabulary rather than only about speed, and the simulator can say whether that is better than just turning the clock up.

Reading order is defined on tile positions, not on the grid, so it survives a responsive relayout: twelve tiles read 4x3 in landscape and 3x4 in portrait, and the reveal sequence is the same either way even though the path across the screen differs. Reading order always runs left to right and top to bottom in whatever grid is being shown. Since board size is part of the recorded ruleset, ranked play groups by it: a nine-tile medium game and a twelve-tile medium game are different leaderboards, not rivals.

### 1.10 Runtime settings and the playtest matrix

Three rules are genuinely undecided. They are therefore settings the engine reads, exposed in a settings panel so they can be changed between games without a rebuild, recorded with every stored game, and swept by the balance simulator.

**Word-complete mode** (`shuffle` | `spend` | `keep`)

- `shuffle`: the round ends the instant a word is accepted. Everything hides, the board shuffles, a new round begins. The punchiest loop, and the original design intent
- `spend`: the used tiles hide, everything still exposed stays exposed, reveals keep ticking. The round becomes a partitioning puzzle. **This is the decided default**, chosen by playing it: losing the letters you just used adds real anxiety
- `keep`: the selection clears and every letter stays available. The most forgiving, and the one at real risk of degenerating, since distinct-word rules make ATE, EAT and TEA three separate scores off the same three tiles. Note that the reveal-order constraint in 1.3 limits the damage: reordering the same letters is only possible once they are all face up, which is the final tick, so farming is bounded by how fast a thumb moves

**Minimum word length** (2 to 6, default 3)

**Hold** (`holdTicks`, zero or more) is a difficulty dial rather than an undecided rule, but it belongs in the same sweep, since how long the full board stays up changes which economies are reachable at all.

**Flip economy** (`none` | `perLetter` | `fibonacci` | `overMinimum`)

Every revealed tile costs exactly one flip, so a word built from L tiles cost L flips to expose. That is the yardstick the reward has to be measured against. Reward first, net in parentheses:

| Word length | Cost to reveal | `none` | `perLetter` | `fibonacci` | `overMinimum` (min 3) |
| ----------- | -------------- | ------ | ----------- | ----------- | --------------------- |
| 3           | 3              | 0 (-3) | 3 (0)       | 2 (-1)      | 1 (-2)                |
| 4           | 4              | 0 (-4) | 4 (0)       | 3 (-1)      | 2 (-2)                |
| 5           | 5              | 0 (-5) | 5 (0)       | 5 (0)       | 3 (-2)                |
| 6           | 6              | 0 (-6) | 6 (0)       | 8 (+2)      | 4 (-2)                |
| 7           | 7              | 0 (-7) | 7 (0)       | 13 (+6)     | 5 (-2)                |
| 8           | 8              | 0 (-8) | 8 (0)       | 21 (+13)    | 6 (-2)                |

- `none`: no flips awarded. Total rounds becomes exactly `initialFlips / N`, so every game at a difficulty is the same length. This contradicts the original brief and is still worth taking seriously, because a fixed-length game is the only genuinely fair basis for a leaderboard or a daily challenge. It also demotes "flips remaining" to a round counter, which would want relabelling
- `perLetter`: `L` flips. Break-even at every length, so word length is irrelevant to survival and the only loss each round is the letters left unused. The game becomes "waste no letters", which is very legible to a player but applies no pressure toward longer words
- `fibonacci`: `wordScore(L)` flips, the same number the word pays in points. **The only economy where length affects survival rather than just score.** Below five letters you bleed, five breaks even, six and up turns a profit. This is the one that implements the stated intent
- `overMinimum`: `L - minWordLength + 1` flips. Nets a constant `minWordLength - 1` loss at every length, since `L - (L - min + 1)` does not depend on L. A flat tax per word: gentle, guaranteed to end, and applies no survival pressure toward length either

**Termination is not uniform across these.** Under `spend`, the flips a round can pay back are capped by the tiles it revealed, so `none`, `perLetter` and `overMinimum` all guarantee the game ends. `fibonacci` does not: a player who reliably finds a six-letter word every round gains flips indefinitely. That may be the right aspiration, or it may mean the leaderboard measures endurance rather than skill. Decide it deliberately.

**The interaction that needs watching.** These settings are not independent. Under `shuffle` a round can end after only a few reveals and so cost only a few flips, which breaks the cost yardstick above; `shuffle` with `perLetter` looks unbounded, because finding a 3-letter word in the first three reveals costs 3 flips and pays 3, repeatable indefinitely. Under `keep`, letters can be reused, so the total reward in a round is no longer capped by N and every economy can in principle run away, bounded only by how fast a thumb moves. So the simulator's first job is not tuning; it is finding which of the twelve configurations admit a strategy whose net flips per round is non-negative. Those get either `chargeFullRound` (a round always costs N flips, whenever it ends) or a stingier economy.

Settled so far: `spend` by playing it. Minimum 3 and `fibonacci` remain hypotheses.

**Comparability.** Because these settings change the game rather than decorate it, a score is only comparable against others produced under the same full ruleset. Leaderboard eligibility keys on the whole config, not just the difficulty name, and non-canonical settings are stored and shown but never ranked.

### 1.11 Wild cards

A tile can be dealt showing a wild instead of its letter, at `wildChance` per tile per deal, 0.02
by default. It stands for whatever letter completes a word, and the player finds out what it
became when the word is accepted: `WORD_ACCEPTED` carries `wilds`, the indices that came from one,
and the view marks them so a player sees what they were given rather than what they chose.

**A mask, not a substitution.** The letter underneath is untouched and shows again next round, so
the board is the same letters from first deal to last. That is exactly the line between this and
1.12. It also means masking can never make a board unsolvable -- a wild is strictly better than
the letter it hides, since it can always become that letter -- so the generator and the word floor
need to know nothing about any of it.

**At most two on the board at once** (`MAX_WILDS`). Resolution costs a dictionary lookup per
candidate, so one wild is an alphabet's worth and two is that squared, about a thousand for
Russian; three is thirty-five thousand. The cap is on the deal rather than on the submission,
which is the way round that has nothing left to explain: refusing a word for holding three wilds
would tell a player "not a word" about a selection that is thousands of words at once. With a
three-letter minimum it also guarantees one real letter in every word, so the engine never writes
one entirely by itself.

A wild is a card rather than a blank, because a blank is indistinguishable from a tile that has
not turned over yet, and that is the one thing the board must never be ambiguous about. A
keystroke onto a wild is remembered as an intent (`GameState.wildIntent`) and tried first, so
typing is not less expressive than tapping; it is a preference and not a promise, and resolution
falls back to the ordinary search. When every letter the wild could have been makes a word already
found, the rejection is its own reason, `all-found`, because "not a word" would be a lie about a
selection the player cannot see inside.

### 1.12 Letter replacement

At `replaceChance` per deal, one tile's letter becomes another one, permanently, and the old
letter is gone. This is the mechanic wilds deliberately are not.

**Why it exists:** the hold phase shows the whole board face up on purpose, so a player can
photograph twelve letters and hand them to an anagram solver. Nothing closes that by hiding,
because the exposure is the mechanic. What closes it is the board going stale.

The replacement is drawn from the letters that could take the slot **without dropping the board
below its floor** -- the generator's own acceptance test, applied to a board that already exists:
at least `wMin` common words and one of at least `ceilingMin` tiles. It takes no notice of what
the player has already found, because the promise a board makes is that it holds W words, not that
it holds W words nobody has played, and a floor that shrank as the game went on would end every
long game by refusing to change anything. The outgoing letter is excluded, since replacing E with
E after an animation promising a change is a broken promise the player cannot tell from a bug.

It is announced by `LETTER_REPLACED` and the view stops the clock to play it over the whole board
-- **never on the tile itself**, which was the first version and gave the position away: the deal
has already happened, so flipping up the changed tile is one free reveal per swap in a game whose
whole economy is paying flips for exactly that.

Replacement runs before wilds are dealt and never on the same tile, so one tile cannot arrive
carrying two announcements at once. It is safe in that order for the same reason it needs no
change to board generation: it leaves the board above its floor, and a wild is strictly better
than the letter it hides.

**It is a difficulty column, not a slider** (0, 0.25, 0.5, 0.5 by level). With the letters fixed
you can learn a board and carry a word list between rounds; once they drift you cannot, and that
is a different game rather than a harder one. So easy has none at all, and the rate stops
climbing at hard, because what a swap costs is a stale memorised list and insane shows the whole
board for 1.8 seconds.

## 2. Architecture

pnpm workspaces, TypeScript strict everywhere, one lint/format config at the root.

```
blinkered/
  packages/
    engine/       pure TS state machine. Zero dependencies. No clock, no RNG calls, no DOM
    words/        word lists, anagram solver, board generator, weight derivation
    i18n/         every string the game says, in fifty-one languages
  apps/
    web/          React + Vite. Owns the wall clock and the pixels
    mobile/       Capacitor project. Consumes apps/web's build output
    server/       Hono + Drizzle, migrations under apps/server/drizzle
  tools/
    dictionary/   builds a language's word list from its sources
    derive/       draw weights and word-count calibration
    harness/      the engine in a terminal, every rule a flag
```

Three things in the original sketch never existed, and the reasons are worth keeping.

**`packages/shared`** was to hold the difficulty table, the DTOs and the zod schemas. The
difficulty table lives in `engine`, next to the reducer that reads it, and the server imports
`@blinkered/engine` directly; a package whose whole job is to be imported by two others earns its
keep the day they disagree about a type, and they never did. **`db/`** is
`apps/server/drizzle`, because the migrations belong to the app that runs them. **`tools/simulate`**
is still unbuilt, and is item 3 in STATUS.md's list; `tools/harness` is what exists instead, and
it plays the game rather than measuring it. `packages/i18n` was not foreseen at all.

### 2.1 The engine

A reducer, and nothing more. No timers, no `Date.now()`, no `Math.random()`. The UI owns the wall clock and dispatches `TICK`; that is the only reason the engine can be tested exhaustively and replayed on a server.

The two undecided rules are two config reads, not two code paths: one pure function for the reward and one three-way branch in the submit handler, where `shuffle` reuses the timer-expiry path that already exists.

```ts
function flipReward(len: number, cfg: GameConfig): number {
  switch (cfg.flipEconomy) {
    case 'none':
      return 0
    case 'perLetter':
      return len
    case 'fibonacci':
      return wordScore(len)
    case 'overMinimum':
      return len - cfg.minWordLength + 1
  }
}
```

```ts
type Difficulty = 'easy' | 'medium' | 'hard' | 'insane'
type WordCompleteMode = 'shuffle' | 'spend' | 'keep'
type FlipEconomy = 'none' | 'perLetter' | 'fibonacci' | 'overMinimum'

interface GameConfig {
  n: number
  speedMultiplier: number
  holdTicks: number
  initialFlips: number
  wMin: number
  minWordLength: number
  ceilingMin: number // the longest word a generated board must admit
  wordCompleteMode: WordCompleteMode
  flipEconomy: FlipEconomy
  chargeFullRound: boolean // a round costs N flips even if it ends early
  wildChance: number // per tile per deal
  replaceChance: number // per deal, one tile's letter becomes another
  language: string
  engineVersion: string
}

interface Tile {
  id: number
  letter: string
  position: number // index in the current grid layout, reading order
  revealed: boolean
  spent: boolean
  wild: boolean // showing as a wild this round; `letter` is untouched underneath
}

interface GameState {
  readonly config: GameConfig // frozen for the life of the game
  readonly rng: RngState // serializable PRNG state
  readonly tiles: readonly Tile[] // stable identity; position changes on shuffle
  readonly selection: readonly number[] // tile ids, in tap order
  readonly wildIntent: Readonly<Record<number, string>> // letters typed onto a wild
  readonly roundIndex: number
  readonly ticksRemaining: number
  readonly revealsThisRound: number
  readonly flipsRemaining: number
  readonly score: number
  readonly wordsFound: readonly FoundWord[] // { word, length, points, roundIndex, tick }
  readonly tick: number
  readonly status: 'playing' | 'over'
}

type GameEvent =
  | { type: 'TICK' }
  | { type: 'TAP_TILE'; tileId: number } // pointer
  | { type: 'SELECT_LETTER'; letter: string } // keyboard: take the next copy
  | { type: 'CLEAR_LETTER'; letter: string } // keyboard: drop every copy
  | { type: 'CYCLE_LETTER'; letter: string } // keyboard: take the next, or clear them all
  | { type: 'UNDO_LETTER' } // backspace
  | { type: 'RESET_WORD' } // escape
  | { type: 'SUBMIT_WORD' } // enter

type RejectReason = 'unknown' | 'duplicate' | 'too-short' | 'all-found'

type Effect =
  | { type: 'REVEALED'; tileId: number }
  | { type: 'SELECTED'; tileId: number }
  | { type: 'DESELECTED'; tileIds: number[] }
  | { type: 'INPUT_IGNORED'; reason: IgnoredReason }
  | { type: 'WORD_ACCEPTED'; word: string; points: number; flips: number; wilds: number[] }
  | { type: 'WORD_REJECTED'; word: string; reason: RejectReason }
  | { type: 'ROUND_ENDED'; layout: number[]; flipsCharged: number; cutShort: boolean }
  | { type: 'LETTER_REPLACED'; tileId: number; from: string; to: string }
  | { type: 'GAME_OVER' }

function reduce(state: GameState, event: GameEvent, dict: Dictionary): [GameState, Effect[]]
function keyToEvent(press: KeyPress, scheme: KeyScheme): GameEvent | null
```

Two things in that listing were added after the sketch and have their own rules below: a tile can
be dealt as a **wild** (1.11), and a deal can **replace one letter** (1.12). `selected` is not a
field on `Tile`: the selection is `GameState.selection`, in tap order, and it is the sole source
of truth for the current word, because a board where two places record the same fact is a board
that can contradict itself. `keyToEvent` takes no state for the same reason -- a view deciding
between SELECT and CLEAR from a snapshot gives different answers depending on whether it
happened to re-render between two keystrokes.

Effects exist so the UI knows what to animate and what sound to play without inspecting state diffs. The event log plus the seed is the complete record of a game.

### 2.2 The words package

Built by `pnpm dictionary build --language=<tag>` and committed, one directory per language under
`packages/words/data`. SCOWL was the sketch and is now one source among many: each language names
its own sources in `tools/dictionary/src/manifest.ts`, because SCOWL is English and fifty of these
are not. See [DICTIONARIES.md](DICTIONARIES.md) for the pipeline and
[LANGUAGES.md](LANGUAGES.md) for what each language draws on.

1. Order a corpus by frequency, then filter it through every validator that language has. The
   **common** tier is what survives above the candidate cut and is counted toward W; the **full**
   tier is everything accepted, and is what scores
2. Fold to the language's own alphabet and drop anything outside 3 to 16 tiles
3. Write one `words.txt` per language, common tier first, with a header giving the tier sizes and
   a digest: `#blinkered/wordlist/2 language=en common=16575 full=174456 digest=...`

Runtime: `parseWordList` splits the two tiers out of that one file and `buildTieredIndex` gives
them their two jobs -- `has` answers from the full tier, so an unusual word still scores, and
`profile` counts only the common tier, so a board is solvable from vocabulary people use.

**This runs on the main thread, not in a Web Worker**, which the sketch had backwards.
`Dictionary.has` is synchronous and the reducer calls it inside a pure function; a worker would
make validation async and change the engine's contract, which is the one thing in this repo that
is not allowed to depend on an environment. `apps/web/src/dictionary.ts` says so at the point of
decision. Solving a board still enumerates the sub-multisets of N letters, 4096 at most, deduped
by sorted key, and looks each up in the anagram index.

Licensing is settled and recorded per language: every directory carries its own `LICENSE` and
`PROVENANCE.md`, twenty-one of them CC BY-SA, nothing GPL. See the end of DICTIONARIES.md for the
store-build question that comes with the share-alike ones.

### 2.3 The server

Hono on Node, deployed to tl-prod alongside the site, Postgres in the same cluster. See
[ACCOUNTS.md](ACCOUNTS.md) for why in-cluster, and for the part that does not come with it:
point-in-time recovery.

**Auth.js is not what shipped, and there is no Facebook.** `@auth/core` appears nowhere in the
tree. Sign-in is an email one-time code (`auth/routes.ts`, `auth/policy.ts`, `auth/secrets.ts`)
plus hand-written OIDC clients for Google and Apple only (`auth/google.ts`, `auth/apple.ts`,
`auth/oidc.ts`). Two providers rather than three because Sign in with Apple is compulsory the
moment any third-party SSO is offered, and a third one buys nothing an email code does not. See
[AUTH.md](AUTH.md).

**Sign in with Apple is not optional.** App Store guideline 4.8 requires it if we offer any other third-party SSO.

Two session mechanisms, because web and native genuinely differ:

- **Web**: an httpOnly, Secure, SameSite=Lax session cookie. The browser never holds a token in
  JavaScript
- **Native**: a Swift plugin with two methods and no networking. `signInWithApple` runs
  `ASAuthorizationAppleIDProvider` against a nonce from `/v1/auth/native/nonce`;
  `signInWithBrowser` runs `ASWebAuthenticationSession` for Google and returns the code, which
  `/v1/auth/native/exchange` trades for a bearer token. The scheme is `blinkered://auth`

The dual path did deserve its spike, and two details came out of it that the sketch did not
foresee. The web half reaches the plugin through `Capacitor.nativePromise`, not
`Capacitor.Plugins`: `apps/web` has no `@capacitor/core` dependency, so nothing builds that
registry and there is no way to ask whether a method exists. And **the token is in
`localStorage`, not the Keychain** -- a secure-storage plugin needs that same dependency, so it is
behind three functions in `api.ts` and recorded as accepted in STATUS.md rather than done.

Routes:

```
POST   /v1/auth/code            -> email a one-time code
POST   /v1/auth/code/verify     -> code for a session
GET    /v1/auth/{google,apple}  -> start OIDC; ?native=1 marks a shell flow
POST   /v1/auth/native/nonce    -> a nonce for ASAuthorizationAppleIDProvider
POST   /v1/auth/native/apple    -> an Apple identity token for a bearer token
POST   /v1/auth/native/exchange -> a browser-flow code for a bearer token
POST   /v1/auth/signout
GET    /v1/me                   -> the signed-in account
PATCH  /v1/me                   -> username, bio, country, languages
GET    /v1/me/games             -> own history, paginated
POST   /v1/me/deletion-code     -> a code that authorises the next call
DELETE /v1/me
POST   /v1/games/import         -> a finished game, scored from its words
GET    /v1/games/:id            -> one game, for a shared link
GET    /v1/usernames/:name      -> is this name free
GET    /v1/users/:username       -> a public profile
GET    /v1/users/:username/games -> somebody else's history
GET    /v1/leaderboard/:language/:difficulty
POST   /v1/reports              -> report a name, a bio or a game
/v1/admin/*                     -> users, users/:id, ban, unban, games, reports
```

**The seed-issuing, log-replaying design above is phase C, and what runs is phase A.** The
difference matters, so it is written down in `account/routes.ts` at the route itself. Phase A
issues no seeds: every game is played and finished on the client, and `POST /v1/games/import`
takes the word list and the ruleset, recomputes the score from the words with
`scoreSubmission`, and stores the number it worked out rather than the one it was handed. So a
score cannot be inflated by a client that lies about arithmetic, and can be by a client that
lies about having found a word.

That is the gap phase C closes by replaying an event log against a server-issued seed, and the
rate limits and log caps belong with it. What holds the line meanwhile is narrower and honest
about it: `canonical` records whether the ruleset was one of the four presets at the default
board size, `paused` records whether the clock ever stopped, and `leaderboard_eligible` is
`canonical && score > 0 && !paused`. Offline play still works, and such games still appear in a
player's own history.

### 2.4 Schema

Everything lives in a `blinkered` schema rather than in `public`, including drizzle's own
bookkeeping table. `apps/server/src/schema.ts` is the source of truth; this is its shape.

```
users             id, username, username_normalized, country, ui_language,
                  game_language, bio, avatar_seed, is_admin, created_at, banned_at
auth_identities   id, user_id, provider, provider_account_id, email,
                  email_verified_at, created_at
sessions          id, user_id, kind, created_at, expires_at, revoked_at
native_handshakes id, kind, user_id, created_at, expires_at, consumed_at
login_codes       id, email, code_hash, attempts, created_at, expires_at, consumed_at
games             id, user_id, seed, status, source, imported, client_key,
                  difficulty, language, canonical,
                  n, speed_multiplier, hold_ticks, initial_flips, w_min,
                  min_word_length, word_complete_mode, flip_economy,
                  charge_full_round, wild_chance, replace_chance,
                  score, words_count, rounds_played,
                  engine_version, dictionary_version,
                  paused, leaderboard_eligible, hidden, started_at, finished_at
game_detail       game_id, version, detail                  (jsonb: the words, one row per game)
reports           id, reporter_user_id, subject_user_id, subject_game_id,
                  field, reason, created_at, resolved_at
```

`engine_version` and `dictionary_version` are stored per game so an old result stays explainable
after the rules or the word list change, and the leaderboard groups on `engine_version` so a
retune does not rank new games against old ones. **`ruleset_hash` was never built**: the whole
tuple is stored column by column instead, and `canonical` is the boolean that says it matches a
preset, which is the question a leaderboard actually asks. `verified` was never built either,
since nothing is verified by replay yet; `flips_used` is absent because flips left is derivable
and flips spent was not wanted; and the words are one jsonb row rather than a `game_words` table,
because nothing queries inside them.

This covers everything the brief asked to record: initial flips, speed multiplier, N, minimum word length, words made, score, tile letters, and timestamp.

## 3. Testing

The bar is complete coverage of the engine and the UI, so the architecture is built to make that cheap rather than heroic.

**Engine (`vitest`), coverage gate at 100% lines and branches.** The reducer is pure, so this is achievable rather than aspirational. Property-based tests with `fast-check`:

- flips remaining is never negative, in any event sequence
- score always equals the sum of `score(L)` over found words
- every submitted word's tiles were revealed, unspent and unselected at submit time
- reveal order is always reading order
- every round is exactly `N + holdTicks` ticks
- replaying `(seed, events)` twice yields identical state, byte for byte
- the same replay in Node and in a browser yields identical state

**Words.** Solver checked against a brute-force implementation on small alphabets. The generator yields at least W over 10,000 seeds per difficulty and always terminates inside the attempt cap.

**Balance simulator (`tools/simulate`), still unbuilt.** It is item 3 in STATUS.md's list and the
only thing in this document's testing section that has not been written. A bot with a tunable
skill model (reaction time, vocabulary depth, willingness to hold out for a longer word) plays thousands of games across the full cross-product of four difficulties, three word-complete modes and four flip economies. It reports, per cell: median and spread of game length, score distribution, words per round, and above all **the fraction of runs that never terminate**, which is how a broken economy announces itself. Section 1.9's table and section 1.10's defaults both get replaced by whatever this says. Guessing at these numbers is not tuning.

The bot also has to respect the reveal-order constraint from 1.3, since a bot that can tap letters in any order at any time would make every economy look generous.

**UI (Playwright), not built.** This is the plan and remains the plan; there is no Playwright in
the repo, and it is item 1 in STATUS.md's list. What `apps/web/test` holds instead is ten files of
pure-module tests -- routes, api, autofill, identity, themes and the rest -- which test the things
that can be decided without a DOM. The report dialog's states, the board's geometry per viewport
and a game played by touch alone have all been walked in a browser and are pinned by nothing.

The plan, when it is written: the clock is injectable, so every test drives ticks explicitly and
runs at full speed, with no `waitForTimeout` anywhere in the suite and lint enforcing that.
Coverage includes tap and undo, reset, submit, all four submission outcomes and their feedback,
spent tiles, the timer display, the shuffle animation landing tiles in the engine's permutation,
game over, and full keyboard operation.

**Accessibility.** Tiles are reachable by keyboard and labelled for screen readers, reveals are
announced politely, Enter submits and Escape resets, and `prefers-reduced-motion` shortens travel
without hiding the position change. All of that is built. **`axe` does not run in CI**, and nor
does anything else in a browser; what is pinned instead is contrast, in `apps/web/test/themes.test.ts`,
which holds all three palettes to 4.5:1 for text and 3:1 for the parts that are not text.

**Server.** Integration tests against a real Postgres in Docker. Authorisation tests assert that user A cannot read user B's games under any route. Forged and truncated logs are rejected. A cross-check test asserts the client engine and the server engine agree on a corpus of recorded games.

**Visual regression.** Playwright screenshots of each tile state in each palette. Not built, with the rest of the Playwright work.

CI on GitHub Actions, and what runs today is two workflows. `CI` runs `pnpm check` -- typecheck,
lint, lint:sources, format:check and the coverage gate -- on ubuntu and macos, plus a `database`
job on ubuntu alone that runs the Postgres suites against a service container, because GitHub's
macOS runners have no Docker. `Release` builds and pushes the two images. There is no e2e job,
because there is no e2e suite, and no iOS workflow: the app is built and archived from Xcode on a
Mac.

## 4. Look and feel

- Tiles flip with a CSS 3D `rotateY` on a `preserve-3d` container. No animation library needed
- The shuffle uses the FLIP technique: measure, transform, play, so tiles visibly travel to their new homes and an attentive player can track a letter across the shuffle. That tracking is the game's core skill, so this animation is a gameplay feature, not decoration
- HUD: flips remaining is the largest number on screen, the tick countdown is a depleting ring, and the word under construction sits directly above the thumb buttons
- The keyboard is the primary interface on anything with one: type the word, Enter to submit, Escape to clear, Backspace to undo. Word Complete and Reset Word exist as thumb-reachable buttons for touch, not as the main path
- A settings screen exposes the three undecided rules from 1.10 alongside difficulty, so playtesting is a matter of tapping rather than rebuilding. Non-default combinations are marked as unranked wherever a score is shown
- Feedback is immediate and distinct per outcome: accepted words show `+3 flips` flying into the counter, unknown words shake, duplicates say "already found"
- Full-bleed, safe-area aware, dark and light, no browser chrome
- The game is fully playable offline. Results queue and submit when connectivity returns

Apple rejects apps that are just a website in a box under guideline 4.2. Shipping the dictionary in the bundle, working offline, holding state locally and respecting safe areas is what keeps us clear of that, and we get all of it for other reasons anyway.

## 5. Speaking other languages

### 5.1 What the engine already handles

- a tile holds a `string`, not a character, and **word length is counted in tiles** everywhere, down to the anagram keys in the word index. An alphabet whose letters are digraphs needs no engine change: `segmentBy` builds a greedy longest-match segmenter, so an IJ tile wins over an I tile at the same position
- scoring and both economies are arithmetic over that tile count, so they are language-neutral outright
- every fact about a language lives in one `Alphabet`: draw weights, which letters are vowels, which are too rare to appear twice, which need a companion, how a typed key folds onto a tile, and how a word splits into tiles. `GameConfig` records a BCP 47 tag, so an old result stays interpretable
- board acceptance asks the alphabet, so Q-needs-U is data. A test runs the fault checker against an invented alphabet where nothing is rare and X needs a Y or a Z, to keep it that way

### 5.2 Accents are not the same thing as diacritics

This is the distinction that decides how much work a language is, and it is a fact about the language rather than about Unicode.

**Accents on a letter.** French e-acute is an E wearing a mark; the French alphabet has 26 letters. Same for Italian, and for Spanish vowels. Every word game in these languages, Scrabble included, puts bare letters on tiles and drops accents in play. So the alphabet folds them away, in the word list and in typed input alike: epee and pere both become words over plain E tiles, and a US keyboard can play French. The only cost is that folding merges cote, côte, coté and côté into one entry, which is exactly what a French player expects.

**Diacritics that are letters.** Polish L-with-stroke, Turkish dotless I, Spanish N-with-tilde, German umlauts. These are separate letters of their alphabets, with their own Scrabble tiles, and collapsing them would merge distinct words: Polish zle and z-acute-le, German Bar and Bär. So they get their own tiles, their own draw weights, and need their own keys. No folding.

Both cases are exercised by tests: one alphabet folds accents away, another keeps L-with-stroke as its own tile.

### 5.3 Where to start

Latin-alphabet languages needing **no extra tiles at all**, only folding: English, French, Italian, Dutch (IJ as I then J, per Dutch Scrabble), Indonesian and Malay, which carry no diacritics in the first place.

**One or two extra tiles:** Spanish adds N-with-tilde and folds its vowel accents. Portuguese adds C-cedilla.

**A handful of extra tiles, still routine:** German adds three umlauts and spells eszett as SS. Polish adds nine. Czech and Hungarian similar.

**The one real trap** is Turkish, where dotless i upper-cases to I and dotted i upper-cases to I-with-dot. That is why `fold` is a function on the alphabet rather than a locale argument handed to `toLocaleUpperCase`.

Non-Latin scripts are a different project rather than another language. Arabic has contextual letter forms and no case; a CJK tile is not the same game.

### 5.4 Where the word lists come from

Fifty-one playable languages, built and committed. The sourcing design, the license audit and
every measurement behind the sizing live in [DICTIONARIES.md](DICTIONARIES.md). The short
version: a frequency list selects candidates, a dictionary validates them, and we ship the
intersection, which is smaller, better and a thinner derivative of either input than a copy of
either would be.

### 5.5 What a new language actually costs

Three commands, in this order, once the sources are named in `tools/dictionary/src/manifest.ts`:

```
pnpm dictionary build --language=<tag>     # fetch, validate, cut, write
pnpm dictionary weights --language=<tag>   # draw weights from its own vocabulary
pnpm dictionary floor                      # the word floor, from the new weights
```

The order is load-bearing: board density depends on the draw weights, and the word floor is calibrated against board density, so deriving the weights after the floor calibrates against a guess. Skipping the floor step is worse than getting it wrong, because it fails silently — the floor sits above what any board can reach, every draw is rejected, and the generator plays the best of four hundred boards while reporting failure.

The remaining work is a judgment pass on the suggested rare letters, a note of which letters are dead alone, and a `Messages` set in `packages/i18n/src/locales/`.

So the engineering is minutes. The only genuine gate is **a word list with a defensible common tier and a license that permits shipping it**, which varies enormously by language and is the one thing no amount of tooling shortens: a third of them have no usable morphological dictionary at all.

Because language is part of the recorded ruleset, ranked play groups by it, exactly as it does for board size.

## 6. Phases

Each phase ends with green tests and something you can actually play or click.

**Where this stands:** 0, 1, 3, 4 and 5 are done and deployed, 6 is partly done, and 2 is the one
that was skipped. The game is live at playblinkered.com with accounts, history and leaderboards,
and installed on a phone. [STATUS.md](STATUS.md) is the current state of play; what follows is the
plan as written, kept because the order it chose is still the argument for the order.

**Phase 0. Scaffold.** pnpm workspace, TypeScript strict, lint, format, CI skeleton, empty packages wired together.

**Phase 1. Engine.** The full reducer and its test suite, all three word-complete modes and all four flip economies behind the config, plus a text-mode CLI harness so the game is playable in a terminal before any pixels exist. This is where the rules get argued with.

**Phase 2. Words and generation.** Dictionary build pipeline, solver, generator, balance simulator. Ends with a difficulty table backed by data, and with any runaway mode-and-economy pairings identified and either fixed or removed.

_Half done. The pipeline, solver and generator shipped for fifty-one languages; the simulator never
got written, so the difficulty table is still bids revised by playing rather than a table backed by
data, and `fibonacci` is still unbounded for a strong player by design rather than by measurement._

**Phase 3. Web game.** React UI, flip and shuffle animation, HUD, accessibility, Playwright suite, PWA manifest. Local-only, no accounts. **This is the first milestone worth showing anyone.**

_Done except the Playwright suite, which is item 1 in STATUS.md. There is no PWA manifest beyond
`manifest.webmanifest`; an installable web app stopped being the plan when the iOS shell became
the way onto a phone._

**Phase 4. Accounts and history.** Server, Postgres, Auth.js web flow, verified submission, history screen.

_Done, with two substitutions. Auth.js became a hand-written email code flow plus Google and Apple
OIDC clients (2.3), and "verified submission" became scoring from the submitted words rather than
replaying an event log against a server-issued seed -- phase A of the three in 2.3, and the line
`leaderboard_eligible` holds meanwhile._

**Phase 5. Native.** Capacitor iOS and Android shells, native OAuth spike, secure token storage, icons and splash, TestFlight and Play internal testing.

_iOS only, and no Android shell exists: `capacitor.config.ts` has an `ios` block and nothing else,
and `apps/mobile` has no `android` directory. The OAuth spike is done and runs on a device. Secure
token storage is not: the bearer token is in `localStorage`, which STATUS.md records as accepted
rather than finished. Icons and the splash are done. TestFlight is not -- `PrivacyInfo.xcprivacy`
is the blocker._

**Phase 6. Depth.** Leaderboards, a daily challenge where everyone gets the same seed, and replay playback. All three are nearly free given the deterministic engine.

_Leaderboards are live, grouped by language, difficulty and engine version, with no periods in the
path yet -- "today" and "all-time" are still to come. The daily challenge and replay playback are
not built, and replay playback is the same machinery phase C of 2.3 needs, so they are one piece of
work rather than two._

## 7. Risks and open items

| Item                                                    | Status                                                                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reveal-offset ambiguity in section 1.2                  | Resolved. Round is N ticks, last reveal at 1 remaining, full board exposed for one tick                                                                        |
| Word-complete mode                                      | Resolved: `spend`. The other two remain settings                                                                                                               |
| Flip economy                                            | Runtime setting, four options, decided by playtest. `shuffle` with `perLetter` is likely unbounded, and `fibonacci` is unbounded for a strong player by design |
| Minimum word length                                     | Runtime setting, default 3, higher on hard levels pending the simulator                                                                                        |
| Difficulty numbers                                      | Still bids, revised twice by playing (0.2.0 and 0.4.0), and the only unmeasured numbers left in the repo. The phase 2 simulator is unbuilt                     |
| N as a difficulty dial                                  | Resolved: it is not one. Board size is a player's choice, default 12; the flip budget and word floor derive from it                                            |
| Board acceptance                                        | Resolved: word count, a six-letter ceiling, and no duplicate rare consonant. Enforced in the harness today                                                     |
| Reveal-order constraint (1.3) is load-bearing           | Confirm it plays as well as it reads; it is the main source of skill expression                                                                                |
| SCOWL license and attribution                           | Done, and generalised: every language carries its own LICENSE and PROVENANCE.md, twenty-one of them CC BY-SA, nothing GPL                                      |
| Native OAuth via custom scheme                          | Done. `blinkered://auth`, a Swift plugin with two methods, and three `/v1/auth/native/*` routes. It did cost the day                                           |
| Apple Developer Program, $99/yr, and Sign in with Apple | Required before any iOS build reaches a device other than yours                                                                                                |
| Whether the economy is too lossy to feel fair           | Answered by the simulator plus real playtesting, not by argument                                                                                               |
