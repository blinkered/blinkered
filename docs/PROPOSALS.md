# Proposals

Features that are wanted but not built, and the decisions each one still needs. Written down
while they were being thought about, so nothing here is settled. [PLAN.md](PLAN.md) is the design
that exists; this is the queue.

Each entry ends with **what needs deciding**, which is the part worth arguing about before code.

---

## 1. Share a finished game

A short synopsis a player can paste anywhere, offered once a game is over: difficulty, words
made, score, whether it beat their own best, and a link to playblinkered.com.

Three or four lines, so it survives a text message and a Mastodon post without being folded.
Something like:

```
Blinkered — medium
14 words, 96 points, 12 rounds
A new personal best
https://playblinkered.com
```

Mechanically this is small. `navigator.share` where it exists, which is every phone and the
native shell, falling back to the clipboard on a desktop. One new message per line, so sixteen
locales, with the URL left alone.

### What needs deciding

- **Does "words made" mean the count or the list?** The count is what the leaderboard shows. The
  list is what people actually want to show off, and it costs nothing in spoilers because the next
  player gets a different board. It also makes the message long and unpredictable in length.
  A compromise: the count, plus the single longest word.
- **Is there a picture?** Wordle spread because the grid was legible with the words removed. The
  equivalent here might be the word lengths as blocks, `▮▮▮ ▮▮▮▮▮ ▮▮▮▮`, which shows the shape of a
  game without giving anything away. Worth doing or worth skipping, but worth deciding on purpose.
- **Does the seed travel?** `(seed, difficulty)` is enough to deal an identical board, and the
  engine is deterministic, so "play my board" is nearly free and is a different feature wearing
  this one's clothes. If it ships, the link needs a parameter and the leaderboard needs to know
  whether a shared board still counts as canonical.

---

## 2. Wild cards

A tile that stands for whatever letter would make a word. Drawn at random, more often on the
easier settings, with a frequency that is a nerd-mode number like everything else. More than one
can be on a board; the odds make it uncommon.

On submission the wild becomes any letter that completes a real word in that position, chosen at
random from the options, excluding words already found. The rail then shows the word that was
made, with the wild's letter marked so the player can see what they were given.

**Not a blank.** A blank tile is indistinguishable from a tile that has not turned yet, which is
the one thing the board must never be ambiguous about.

### The good news, which changes the design

`wordScore` is a function of length alone — Fibonacci on the tile count, no letter values. So every
resolution of the same selection scores exactly the same, and choosing at random costs the player
nothing. That was the strongest argument for "pick the best word instead of a random one", and it
does not apply. Random is fine, and random is more fun.

### The problem worth naming

A wild does not help you spell a word you know; it lets you **fish for one you do not**. Select
the wild, an E and a T, and the engine will hand you BET or GET or JET. The player supplies two
letters and a shrug, and the flip economy pays them for it.

That may be exactly what a power-up should feel like. But it means a wild is worth much more than
one letter, and the frequency has to be set against that rather than against how often a wild
"feels" right. It is also the first mechanic in the game where the engine plays for you, which is
worth wanting on purpose.

### What it requires

- **A look that is neither a letter nor a face-down tile.** A star or asterisk, and a shape rather
  than only a colour, since a colour-only distinction fails for a colour-blind player.
- **A one-line key on the board**, small: `🃏 = any letter` or similar. A symbol nobody has been
  taught needs saying once, and it has to cost almost no room, which on a phone means the same
  budget the tap prompt lives on.
- **The seeded RNG, not `Math.random`.** The whole engine is deterministic from
  `(seed, difficulty, event log)` so a server can one day verify a score instead of believing it.
  A wild resolved from `Math.random` silently ends that. The RNG state is already in `GameState`.
- **Resolution over the alphabet's tiles, not A–Z.** A tile holds a string: Croatian has LJ, NJ
  and DŽ. The wild has to try what `alphabetFor(language)` says a tile can be.
- **A rejection message of its own.** If every resolution is a word already found, the submission
  fails for a reason the player cannot see, because they cannot see what it would have picked.
  "No new word there" or similar, distinct from "not a word".
- **A cap on wilds per word.** Resolution costs one dictionary lookup per candidate, so one wild
  is 26–33 lookups and two is a thousand. Fine. Four is not, and the board can in principle hold
  four.
- **Board generation needs no change at all**, which was not obvious and is worth stating. The
  worry was that replacing a drawn letter with a wild could break the guarantee that the board
  admits W words. It cannot: a wild resolves over the whole alphabet, so it can always become the
  letter it replaced, and the set of achievable words is therefore a superset of what that letter
  allowed. Deal the board with letters, verify the floor as now, then turn a tile wild. The
  generator and the solver are untouched.

### Decided

- **The player finds out afterwards, in the rail.** No live preview. They select and hope, and the
  word they were given appears with its wild letters marked. The gamble is the mechanic.
- **Frequency is one fixed number**, 0.02, adjustable in nerd mode, and not part of the difficulty
  table. `n` is 12 on every setting and only the clock and the minimum word length change, so the
  same rate is worth less on a harder setting because there is less time to use it: the mechanic
  self-balances without a second number to guess. Making it level-dependent later is one field in
  `DIFFICULTIES`, so nothing is lost by waiting for play to say it is needed.
- **Per tile, drawn once with the board and fixed for the game.** A wild is a face like any other
  face: it moves position on every shuffle and it is still there next round, and the board is the
  same twelve faces from first deal to last.

  This was briefly decided the other way, per deal, and that was wrong for a reason worth keeping.
  Re-rolling wild-ness each shuffle changes the face set between rounds -- `ABCDEFGHIJKL`, then
  `A*CDEFGHIJKL`, then `ABCDEF*HIJKL` -- which is letter replacement, proposal 3, arriving early
  and in disguise. It would also have spoiled the experiment: if wild cards already churn the board
  between rounds, nothing measured afterwards can say what replacement adds.

- **What 0.02 then means.** 21.5% of _games_ have a wild and 2.2% have two, and a game that has one
  has it in every round. That is a strong board rather than an occasional treat, and it is the
  number to watch in play. Two things soften it: a wild is only worth a word when the other letters
  are up and willing, and words already found are excluded, so a wild decays as the game fills up
  the list of what it can no longer make.

- **The wrinkle to watch is ranked fairness.** One game in five being materially easier is variance
  the leaderboard cannot see, since a wild board and a plain board are both canonical. If play says
  that matters, the answers are a lower frequency, or a wild that can be spent only once in a game
  rather than once in a round.

### Still open

- **Can a wild be part of a two-letter word** where the minimum length is 3? Not a real question
  unless the minimum is ever 2.
- **Whether three wilds in one word should be refused outright.** At 0.02 the odds are about two in
  a thousand rounds, but a word made entirely of wilds is a word the engine wrote by itself.

---

## 3. Letter replacement

The same letters last all game, so a player can transcribe the board once and hand it to a
Scrabble engine. A nerd-mode percentage, rarer on easy and commoner as the settings harden, gives
each shuffle a chance to replace one letter.

The replacement must leave the board still admitting its W words, with the outgoing letter
excluded as a candidate. If no letter clears the floor, take the one that admits the most words.

When it happens, the shuffle animates differently: every tile turns face down **except** the one
being replaced, which is shown changing, and then turns over itself. One clear "watch this"
moment rather than a silent substitution.

### The cheat is real

Pause conceals the board, so pausing does not help. But the hold phase at the end of a round shows
every tile face up on purpose — that is the mechanic — and a photograph of that is the whole board.
There is no way to close that hole by hiding things, because the exposure is the game.

### The hard part is not the rule, it is where the rule lives

`Dictionary` as the reducer sees it is exactly one method:

```ts
export interface Dictionary {
  has(word: string): boolean
}
```

Deciding whether a candidate letter clears the word floor needs the common tier and the anagram
solver, which is a far larger dependency than `has`. Widening the port to carry a solver would put
the heaviest object in the codebase into the most load-bearing interface in it.

**A better shape**: compute the replacement table once, when the board is generated, and carry it
in state. For each tile and each candidate letter, whether the board still clears W. That is
`n × alphabet` solver runs at generation — measurable, done once, off the critical path — and at
shuffle time the reducer only reads a table and draws from the seeded RNG. `reduce` keeps its
signature and stays pure.

Whether `n × 33` solver runs is affordable at board generation is a measurement, not a guess, and
should be taken before this is designed any further.

### What needs deciding

- **One letter per shuffle, or a chance per letter?** "A percentage chance that a letter is
  replaced" reads as the former, and the former is easier to animate and easier to follow.
- **Does a replaced letter's tile keep its position** through the shuffle, so the player can watch
  it, or does it move like the others? The animation described implies it holds still.
- **What happens to a spent tile**, or a tile currently selected, when its letter is replaced?
- **Does this interact with wild cards** — can a wild be replaced, can a replacement be a wild?
- **Is the anti-cheat the point, or is the churn the point?** If it is anti-cheat, the frequency
  wants to be high enough that a transcribed board goes stale within a round or two, and that is a
  different number from one chosen to feel good.

---

## The help page is part of the feature

Every string the game says exists in sixteen languages, and the rules page is a string like any
other. Wild cards and letter replacement both change what a player has to understand, so each one
lands with its own section in `htTouch*`-style keys across all sixteen locales, in the same commit
as the mechanic. Share needs nothing there: a button that shares a result explains itself.

This is easy to forget because the feature works without it, and the sixteenth translation is
never the interesting part of the day.

## Order

Share is small, self-contained, and wants no engine change. The other two both touch the reducer
and both want the balance simulator ([STATUS.md](STATUS.md) item 3) to exist first, because both
introduce a number that cannot be chosen by argument: how often a wild appears, and how often a
letter turns over. Those are the same class of number as the difficulty tables, which are still
the only guessed numbers in the repo.
