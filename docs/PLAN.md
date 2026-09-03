# Blinkered: Build Plan

A word game where the letters hide from you.

## 0. Decisions taken

| Question        | Decision                                                                                                 | Why                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Client platform | React + TypeScript + Vite on the web, wrapped by Capacitor for iOS/Android                               | One codebase, one rendering model, one test suite; the native shells are additive and can come later      |
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

The game ends when flips remaining is 0 and either of these is true:

- the current round completes, or
- fewer tiles are exposed and unspent than the minimum word length. No word can be formed and no further tile can be turned over, so the rest of the round is dead time and the clock should not run it down

Otherwise the round is allowed to finish, so a player can bank one last word with what is already exposed. That is not necessarily a losing position: under any economy but `none` a word pays flips back, which revives the round and lets reveals resume. The same dead-board test also fires immediately after a word is accepted, since spending the last usable tiles strands the board just as surely as running out of flips does. The word still scores.

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

Opening bids, to be replaced by whatever the balance simulator says.

| Level  | Seconds per tick | Hold | Rounds of life | Min word | Round (at N=12) | Full board |
| ------ | ---------------- | ---- | -------------- | -------- | --------------- | ---------- |
| Easy   | 1.6              | 4    | 14             | 3        | 25.6s           | 8.0s       |
| Medium | 1.2              | 2    | 12             | 3        | 16.8s           | 3.6s       |
| Hard   | 0.9              | 1    | 11             | 4        | 11.7s           | 1.8s       |
| Insane | 0.7              | 0    | 10             | 4        | 8.4s            | 0.7s       |

The last column is the one that decides how a level feels: how long you hold the whole board in front of you. It falls from eight seconds to under one.

**Board size is a player's choice, on an axis of its own.** N is absent from the table because it is not a difficulty dial. A bigger board is harder to track and gives less time per tile, but it admits far more words and much longer ones, so it is easier to score on; under the fibonacci economy the small board is the harsher one, since at N=6 a seven-letter word is arithmetically impossible and only 17% of raw draws hold even a six. The default is **12**, laid out 4x3 in landscape and 3x4 in portrait, where every draw contains a six-letter word and 97% contain a seven. A player can pick another size and keep whatever difficulty they were playing.

That only works if the two rules that scale with the board are derived from it rather than fixed:

- **Flip budget.** A round costs one flip per tile, so a profile specifies _rounds of life_, not flips, and the engine multiplies by N. Twelve rounds is twelve rounds at any size; a fixed flip count would make the same level twice as long on a small board
- **Word floor.** W is derived from N and the minimum word length, because a count that filters hard at nine tiles is trivial at twelve and unreachable at six. See 1.7

Note what the clock does _not_ scale: reveal time is `N x speedMultiplier`, so a bigger board makes a longer round at the same tick rate. At twelve tiles easy runs a 25-second round, which may simply be too slow to sit through; that is a tuning question for the simulator rather than a structural one, but it is the first thing to look at if easy feels sluggish.

Everything else in a difficulty profile is board-independent by construction: the clock, the hold, and the vocabulary floor. The full-board window in particular depends only on the hold and the clock, so it is identical at every board size. `defaultWMin` and the flip derivation are covered by tests that assert a level lasts the same number of rounds at every size.

**Minimum word length is not a pure difficulty dial either.** Raising it removes the option of short words, which makes it harder to find anything, but the words it forbids are exactly the ones that lose you flips under fibonacci. So a higher floor is harder to score against and gentler on the life meter at the same time. Another thing for the simulator to weigh rather than assume.

**N is inverted as a difficulty dial, which this table does not yet reflect.** A bigger board is harder to track and leaves less time per tile, but it admits far more words and much longer ones. Under fibonacci that makes it economically _more generous_: at N=6 only about half of generated boards contain a six-letter word and a seven-letter word is arithmetically impossible, so easy is the level where playing well helps least. Insane, at N=12, has a seven-letter answer 98% of the time. Either the ladder stops using N as a dial and holds it at 8 or above, carrying difficulty on hold, speed and minimum word length, or easy needs a gentler economy than the rest. Open, and it changes the difficulty tuple in the brief.

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

## 2. Architecture

pnpm workspaces, TypeScript strict everywhere, one lint/format config at the root.

```
blinkered/
  packages/
    engine/       pure TS state machine. Zero dependencies. No clock, no RNG calls, no DOM
    words/        word lists, anagram solver, board generator, weight derivation
    shared/       difficulty tables, DTOs, zod schemas shared by client and server
  apps/
    web/          React + Vite + PWA. Owns the wall clock and the pixels
    mobile/       Capacitor project. Consumes apps/web's build output
    server/       Hono + Auth.js + Drizzle
  db/             Drizzle migrations
  tools/
    build-dict/   SCOWL to packed binary
    simulate/     bot player for balance tuning
```

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
  initialFlips: number
  wMin: number
  minWordLength: number
  wordCompleteMode: WordCompleteMode
  flipEconomy: FlipEconomy
  chargeFullRound: boolean // a round costs N flips even if it ends early
  engineVersion: string
}

interface Tile {
  letter: string
  position: number // index in the current grid layout, reading order
  revealed: boolean
  spent: boolean
  selected: boolean
}

interface GameState {
  readonly config: GameConfig // frozen for the life of the game
  readonly rng: RngState // serializable PRNG state
  tiles: Tile[] // stable identity; position changes on shuffle
  selection: number[] // tile ids, in tap order
  roundIndex: number
  ticksRemaining: number
  flipsRemaining: number
  score: number
  wordsFound: FoundWord[] // { word, length, points, roundIndex, tick }
  status: 'playing' | 'over'
}

type GameEvent =
  | { type: 'TICK' }
  | { type: 'TAP_TILE'; tileId: number } // pointer
  | { type: 'SELECT_LETTER'; letter: string } // keyboard: take the next copy
  | { type: 'CLEAR_LETTER'; letter: string } // keyboard: drop every copy
  | { type: 'UNDO_LETTER' } // backspace
  | { type: 'RESET_WORD' } // escape
  | { type: 'SUBMIT_WORD' } // enter

type Effect =
  | { type: 'REVEALED'; tileId: number }
  | { type: 'SELECTED'; tileId: number }
  | { type: 'DESELECTED'; tileIds: number[] }
  | { type: 'INPUT_IGNORED'; reason: IgnoredReason }
  | { type: 'WORD_ACCEPTED'; word: string; points: number; flips: number }
  | { type: 'WORD_REJECTED'; word: string; reason: 'unknown' | 'duplicate' | 'too-short' }
  | { type: 'ROUND_ENDED'; layout: number[]; flipsCharged: number }
  | { type: 'GAME_OVER' }

function reduce(state: GameState, event: GameEvent, dict: Dictionary): [GameState, Effect[]]
function keyToEvent(state: GameState, press: KeyPress, scheme: KeyScheme): GameEvent | null
```

Effects exist so the UI knows what to animate and what sound to play without inspecting state diffs. The event log plus the seed is the complete record of a game.

### 2.2 The words package

Build step, run in CI and committed as an artifact:

1. Take SCOWL's size bands. Size 60 becomes the **full** list (accepted for credit); size 35 intersected with a frequency list becomes the **common** list (counted toward W)
2. Filter to A-Z only, drop anything shorter than 2 or longer than 12, since nothing longer than the largest N is reachable
3. Pack to a compact binary: sorted word blob for validation by binary search, plus an anagram index keyed by sorted letters for the solver

Runtime: the package builds its indices lazily, once. In the browser this happens in a Web Worker so the first paint is not blocked; on the server it happens at boot. Validation is a binary search over the blob. Solving a board enumerates the sub-multisets of N letters (4096 at most, deduped by sorted key) and looks each up in the anagram index, which is fast enough to redraw boards freely.

Licensing task: vendor SCOWL's copyright notice and confirm the attribution terms before shipping. Do not assume.

### 2.3 The server

Hono on Node, deployed to tl-prod alongside the site, Postgres in the same cluster. Auth.js (`@auth/core`) with Google, Facebook and Apple providers. See ACCOUNTS.md for why in-cluster, and for the part that does not come with it: point-in-time recovery.

**Sign in with Apple is not optional.** App Store guideline 4.8 requires it if we offer any other third-party SSO.

Two session mechanisms, because web and native genuinely differ:

- **Web**: standard Auth.js httpOnly, Secure, SameSite=Lax session cookie. The browser never holds a token in JavaScript
- **Native**: `@capacitor/browser` opens the API's sign-in URL in `ASWebAuthenticationSession` (iOS) or a Custom Tab (Android). The callback redirects to a custom scheme, `blinkered://auth/callback`, carrying a one-time code. The app exchanges it for a session token and stores that in Keychain/Keystore via a secure-storage plugin, never in WebView `localStorage`. API calls then use `Authorization: Bearer`

This dual path is the fiddliest work in the whole project and deserves its own spike.

Routes:

```
POST /v1/games            -> { gameId, seed, difficulty, config }   server picks and pre-validates the seed
POST /v1/games/:id/finish -> { events } -> replayed, scored, stored, canonical result returned
GET  /v1/me/games?cursor= -> paginated history
GET  /v1/leaderboards/:difficulty/:period                          (phase 6)
```

Scores are never accepted from the client. `finish` imports `@blinkered/engine`, replays the event log against the server-generated seed, and stores the result it computed itself. It also rejects implausible logs: taps on tiles that were not revealed yet, more events than the tick count allows, superhuman inter-tap intervals. Per-user rate limits and a hard cap on log length.

Offline play still works. The client generates its own seed when it cannot reach the API, and such games are stored flagged `unverified_seed`: they appear in personal history but are never leaderboard-eligible.

### 2.4 Schema

```
users          id, display_name, avatar_url, created_at
accounts       user_id, provider, provider_account_id        (Auth.js)
sessions       id, user_id, expires                          (Auth.js)
games          id, user_id, difficulty, seed, status,
               n, speed_multiplier, initial_flips, w_min, min_word_len,
               word_complete_mode, flip_economy, charge_full_round,
               ruleset_hash, leaderboard_eligible,
               letters, score, words_count, flips_used, rounds_played,
               engine_version, dictionary_version, verified,
               started_at, finished_at
game_words     game_id, word, length, points, round_index, tick
```

`engine_version` and `dictionary_version` are stored per game so an old result stays explainable and re-verifiable after the rules or the word list change. `ruleset_hash` is a digest of the full settings tuple, which is what leaderboards group by; `difficulty` alone is only a label. Indexes on `(user_id, finished_at desc)` for history and `(ruleset_hash, score desc)` for the eventual leaderboard.

This covers everything the brief asked to record: initial flips, speed multiplier, N, minimum word length, words made, score, tile letters, and timestamp.

## 3. Testing

The bar is complete coverage of the engine and the UI, so the architecture is built to make that cheap rather than heroic.

**Engine (`vitest`), coverage gate at 100% lines and branches.** The reducer is pure, so this is achievable rather than aspirational. Property-based tests with `fast-check`:

- flips remaining is never negative, in any event sequence
- score always equals the sum of `score(L)` over found words
- every submitted word's tiles were revealed, unspent and unselected at submit time
- reveal order is always reading order
- every round is exactly `N + 1` ticks
- replaying `(seed, events)` twice yields identical state, byte for byte
- the same replay in Node and in a browser yields identical state

**Words.** Solver checked against a brute-force implementation on small alphabets. The generator yields at least W over 10,000 seeds per difficulty and always terminates inside the attempt cap.

**Balance simulator (`tools/simulate`).** A bot with a tunable skill model (reaction time, vocabulary depth, willingness to hold out for a longer word) plays thousands of games across the full cross-product of four difficulties, three word-complete modes and four flip economies. It reports, per cell: median and spread of game length, score distribution, words per round, and above all **the fraction of runs that never terminate**, which is how a broken economy announces itself. Section 1.9's table and section 1.10's defaults both get replaced by whatever this says. Guessing at these numbers is not tuning.

The bot also has to respect the reveal-order constraint from 1.3, since a bot that can tap letters in any order at any time would make every economy look generous.

**UI (Playwright).** The clock is injectable, so every test drives ticks explicitly and runs at full speed. There is no `waitForTimeout` anywhere in the suite; that rule is enforced by lint. Coverage includes tap and undo, reset, submit, all four submission outcomes and their feedback, spent tiles, the timer display, the shuffle animation landing tiles in the engine's permutation, game over, and full keyboard operation.

**Accessibility, tested not assumed.** Tiles are reachable by keyboard and labelled for screen readers, reveals are announced politely, Enter submits and Escape resets, and `prefers-reduced-motion` shortens travel without hiding the position change. `axe` runs in CI.

**Server.** Integration tests against a real Postgres in Docker. Authorisation tests assert that user A cannot read user B's games under any route. Forged and truncated logs are rejected. A cross-check test asserts the client engine and the server engine agree on a corpus of recorded games.

**Visual regression.** Playwright screenshots of each tile state in light and dark.

CI on GitHub Actions: typecheck, lint, unit, integration, e2e, coverage gate. iOS and Android builds are a separate manually triggered workflow.

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

**Phase 0. Scaffold.** pnpm workspace, TypeScript strict, lint, format, CI skeleton, empty packages wired together.

**Phase 1. Engine.** The full reducer and its test suite, all three word-complete modes and all four flip economies behind the config, plus a text-mode CLI harness so the game is playable in a terminal before any pixels exist. This is where the rules get argued with.

**Phase 2. Words and generation.** Dictionary build pipeline, solver, generator, balance simulator. Ends with a difficulty table backed by data, and with any runaway mode-and-economy pairings identified and either fixed or removed.

**Phase 3. Web game.** React UI, flip and shuffle animation, HUD, accessibility, Playwright suite, PWA manifest. Local-only, no accounts. **This is the first milestone worth showing anyone.**

**Phase 4. Accounts and history.** Server, Postgres, Auth.js web flow, verified submission, history screen.

**Phase 5. Native.** Capacitor iOS and Android shells, native OAuth spike, secure token storage, icons and splash, TestFlight and Play internal testing.

**Phase 6. Depth.** Leaderboards, a daily challenge where everyone gets the same seed, and replay playback. All three are nearly free given the deterministic engine.

## 7. Risks and open items

| Item                                                    | Status                                                                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reveal-offset ambiguity in section 1.2                  | Resolved. Round is N ticks, last reveal at 1 remaining, full board exposed for one tick                                                                        |
| Word-complete mode                                      | Resolved: `spend`. The other two remain settings                                                                                                               |
| Flip economy                                            | Runtime setting, four options, decided by playtest. `shuffle` with `perLetter` is likely unbounded, and `fibonacci` is unbounded for a strong player by design |
| Minimum word length                                     | Runtime setting, default 3, higher on hard levels pending the simulator                                                                                        |
| Difficulty numbers                                      | Guesses until the phase 2 simulator runs                                                                                                                       |
| N as a difficulty dial                                  | Resolved: it is not one. Board size is a player's choice, default 9; the flip budget and word floor derive from it                                             |
| Board acceptance                                        | Resolved: word count, a six-letter ceiling, and no duplicate rare consonant. Enforced in the harness today                                                     |
| Reveal-order constraint (1.3) is load-bearing           | Confirm it plays as well as it reads; it is the main source of skill expression                                                                                |
| SCOWL license and attribution                           | Verify before shipping                                                                                                                                         |
| Native OAuth via custom scheme                          | Needs a spike in phase 5, most likely place to lose a day                                                                                                      |
| Apple Developer Program, $99/yr, and Sign in with Apple | Required before any iOS build reaches a device other than yours                                                                                                |
| Whether the economy is too lossy to feel fair           | Answered by the simulator plus real playtesting, not by argument                                                                                               |
