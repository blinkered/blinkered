# Proposals

All three of these are now built. This started as a queue and is kept as a record, because what
is worth having is not the list but the reasoning: what was decided, what turned out to be
measurable, and the two places where the first answer was wrong and had to be replaced.

[PLAN.md](PLAN.md) is the design. [STATUS.md](STATUS.md) is the state of play.

---

## 1. Share a finished game — built

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

## 2. Wild cards — built

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
- **A cap on wilds per board**, not per word. Resolution costs one dictionary lookup per
  candidate, so one wild is 26–33 lookups and two is a thousand; four is a million, and the board
  can in principle deal four. Capping the submission was the first answer and the wrong one: it
  refuses a three-wild selection as "not a word", which is a lie about something that is thousands
  of words, and the player cannot see why. At 0.02 that would almost never happen, which is what
  made it look harmless, but `wildChance` goes to 0.5 in nerd mode and there it is the usual case.
  Capping the deal removes the failure rather than hiding it, and leaves nothing to explain in the
  rules.
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
- **Per tile, per deal, and it masks rather than replaces.** The board keeps its twelve letters
  from first deal to last. Each shuffle, a tile may be dealt showing a wild instead of its letter;
  the letter underneath is untouched and is back next round.

  This went round twice and the distinction is the whole point. _Replacing_ a letter with another
  letter changes what the board is made of, which is proposal 3, and doing it here early would have
  meant nothing measured later could say what proposal 3 adds. _Masking_ changes nothing: the
  twelve letters are constant, one of them is promoted for a round, and a player who has
  transcribed the board still has a correct list. The two features stay orthogonal, and a wild is
  strictly better than the letter it hides, since it can always become that letter.

- **What 0.02 means.** 21.5% of rounds carry a wild, 2.2% carry two, and a game sees 2.4 to 3.4 of
  them depending on the setting. Spread across the game rather than concentrated into one game in
  five, which is the other thing the per-deal reading buys.

- **The per-game figure is what to judge**, not the 0.02. Three wilds against a fourteen-word game
  is a fifth of the words, and a wild can be a whole word by fishing. Knowingly generous for a
  first pass, because a treat nobody sees teaches nothing about whether it is fun.

- **When proposal 3 arrives, the two must not look alike.** A masked letter and a replaced letter
  are different events and the animation for each has to say which happened, or the board becomes
  untrustworthy in a way no amount of correctness fixes.

### Still open

- **Can a wild be part of a two-letter word** where the minimum length is 3? Not a real question
  unless the minimum is ever 2.
- **Whether three wilds in one word should be refused outright.** At 0.02 the odds are about two in
  a thousand rounds, but a word made entirely of wilds is a word the engine wrote by itself.

---

## 3. Letter replacement — built

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

### Where the rule lives, and why the answer here was wrong

`Dictionary` as the reducer saw it was one method, `has`. Deciding whether a candidate letter
clears the word floor needs the common tier and the anagram solver, which is a far larger thing.

**The answer proposed here was to precompute a replacement table** at board generation: for each
tile and each candidate letter, whether the board still clears W, carried in state so that
`reduce` only reads a table. It does not work. After a replacement the board is a different board,
so the table describes one that no longer exists. It buys exactly one swap, and the feature is
about the board changing repeatedly.

**What was actually needed was the measurement**, which this file said to take and which turned
out to answer the question by itself. On the shipped dictionaries, one `profile()` run costs
1.1–1.4ms, and 85% to 94% of single-letter swaps clear the floor first time. Testing one tile
against every letter of its alphabet exhaustively is 26 to 33 runs, about 30–42ms measured across
English, Russian and Croatian at all four difficulties. The deal is already stopped for a second
and a half while the change is animated, so there is nothing to optimise and nothing to cache.

So `Dictionary` grew a second method rather than the state growing a table:

```ts
export interface Dictionary {
  has(word: string): boolean
  profile(letters: readonly string[], minLength: number): BoardProfile
}
```

Required, not optional. `WordIndex` already satisfied it exactly, so the web app changed by
nothing at all; the only other implementer was the test helper. Optional was tempting and wrong: a
dictionary that could not profile would replay a game differently from one that could, and silent
divergence between a client and the server verifying it is precisely what the pure reducer exists
to rule out. Required makes it a type error.

### What the search does

Slots are tried in a drawn order rather than in tile order, and every candidate for a slot is
tested rather than trying them until one passes.

Trying candidates in a clever order was the other idea worth measuring: start near the outgoing
letter's own frequency and work outwards, so a common letter finds a common replacement quickly.
The median search finds a passing letter on its **first** try, so there is nothing to speed up.
The ordering would also have cost something real, twice over. It biases replacements towards
letters of similar frequency, which makes the board drift less, and drift is the entire point.
And "first that passed in a heuristic order" is not a fair draw. Enumerating and then drawing is
simpler, has a fixed cost, and makes "this tile has no valid replacement" a fact rather than an
artifact of when the search gave up.

The draw among the survivors is weighted by the alphabet's own letter weights. A uniform draw
would put Ž on the board as often as A, and at this rate a game is six or so swaps long: the board
would drift from a plausible mix of letters towards a flat one, getting steadily stranger to play
on.

### Decided

- **The floor takes no notice of words already found.** The promise a board makes is that it holds
  W words, not W words nobody has played yet. A floor that shrank as the game went on would end
  every long game by refusing to change anything.
- **One letter per deal, not a chance per letter.** A replacement is announced and watched; two at
  once would be two things to watch and the player would catch neither.
- **0.5, fixed, adjustable in nerd mode.** Set against the cheat rather than against the feel: a
  transcribed board is wrong within a round or two. Not a column in the difficulty table, for the
  same reason `wildChance` is not.
- **Nothing at all rather than a broken floor.** When no tile has a valid replacement the deal
  passes. Churn is a defence against a cheat and the floor is a promise to the player. Measured
  over 432 swaps across three languages and four difficulties, it never came up.
- **Replace first, then deal wilds, and never both on the same tile.** A tile that changed and was
  then masked would spend its announcement on a letter the board immediately hides, and the two
  mechanics have to stay tellable apart or the board stops being trustworthy.
- **The questions about spent and selected tiles dissolved.** Replacement happens at the deal,
  where the selection is already cleared and every tile is already unspent.

### Saying it happened, which was the hard part

The animation was the easy half. A wild card works because it is a **state**: visible for as long
as it is there. A replacement is an **event**, and if the player was reading the rail or the tab
was in the background, all that survives is a board that quietly disagrees with their memory.

What it gets, after one revision from play: an interstitial over the whole board. The board is
covered, a heading says so, and the two letters get a third of the board's width each, the
outgoing one dimming on the left and the incoming one arriving on the right. The clock is stopped
for the whole 2.6s, which costs the player nothing because a round is spent in ticks. The message
bar still carries `R → S` as the record that outlasts it; a screen reader gets a sentence, since
an arrow is a shape.

The first version played on the changed tile itself and was wrong twice over. It **named the
tile's position**: the deal has already happened when this runs, so flipping that tile up handed
out one free reveal every time, in a game whose entire economy is paying flips for exactly that.
A bonus nobody designed is a bug. And one tile for 1.5s is **too small and too brief to notice**
on a board the player is not yet looking at — the same reason the message-bar line could not carry
the news on its own, being a 13px row that also holds "shuffled" and every rejection.

The outgoing letter dims rather than disappearing. A full fade is the literal reading of "fade it
out" and it loses the story: a player who looks up late would see one letter and no reason it was
being shown to them. Ending on a dimmed R, an arrow and a bright S means the last second still
says what happened.

Neither the heading nor the incoming tile is gold, which was the obvious choice for something that
has to shout and the one colour unavailable: gold means wild card everywhere else on this board.
Blue is selection, green accepted, red refused. So the emphasis is weight and spacing, and the
before/after distinction is carried by dimming rather than by hue.

Nothing persists afterwards, and that is deliberate rather than lazy. A permanent mark on the
changed tile is an **anti**-anti-cheat feature: it lets a player who was not watching repair their
transcription reliably, which is the thing the 0.5 rate exists to prevent. The player who watches
can keep up. That is the trade the feature is making.

Four things found by looking at it rather than by reading it. The first cover was drawn at the
size of the whole board, because `.tile` was not a positioning context. Cross-fading two letters
in one cell is unreadable, since for a fifth of a second both are half-drawn on top of each other
and it reads as a broken glyph. Sizing the big tiles from the board's width alone blew them out of
a desktop board, which is 928px across and 226 tall — the `--tile: 10vmin` mistake again, in the
other direction. And the same width rule flung the two letters 900px apart there, far enough that
the eye cannot hold both and the arrow between them stops joining anything. Both are capped now,
which leaves the phone layout, where the ask was made, untouched.

### Still open

- **Is the rate right?** 0.5 was chosen against the cheat and has not been played. It is one nerd
  mode number.
- **The balance simulator** would settle it, along with `wildChance` and the difficulty tables.

## The help page was part of the feature

Every string the game says exists in sixteen languages, and the rules page is a string like any
other. Wild cards and letter replacement both changed what a player has to understand, so each
shipped with its own section across all sixteen locales, in the same commit as the mechanic. Share
needed nothing there: a button that shares a result explains itself.

This was easy to forget because the feature works without it, and the sixteenth translation is
never the interesting part of the day.

## What the order turned out to be

Share first, being small and self-contained and wanting no engine change. Then wild cards, then
replacement. The stated reason to do the last two after the balance simulator was that each
introduces a frequency that cannot be chosen by argument, and that is still true; both were built
anyway, with the frequency as a nerd-mode number and a stated guess. That is the cheaper order:
the simulator can calibrate a mechanic that exists, and a mechanic nobody has played teaches
nothing about whether it is worth calibrating.
