---
name: update-languages
description: Re-import Blinkered's word lists from the blinkered-dictionary-* repositories, check each against the usability floor, and set which localizations the app can offer. Use when asked to update, refresh, re-import or re-borrow the word lists or dictionaries; to check whether a language has become playable; or to add or withdraw a playable language. Never disables a working language without the operator's approval.
---

# Updating the languages

Blinkered does not build word lists any more. It borrows them: one repository per language,
`blinkered/blinkered-dictionary-<tag>`, where a word ships because three independent collections
of that language were found to contain it. This skill re-reads all of them, keeps what plays, and
records where each file came from.

**The whole job is `pnpm languages update`.** What this skill adds is the judgment the tool
refuses to make on its own: whether a language that used to work and no longer does should be
switched off.

## Before anything

Read the report before writing anything. The first command is always a dry run:

```sh
pnpm languages update --dry-run
```

It reads all fifty-one localizations, fetches each one's `words.txt` from its repository's main
branch, and deals three boards from it. It writes nothing. Expect it to take a minute or two;
some of these lists are several megabytes.

Narrow it while iterating: `--only de,ko`. That is safe: a language the run did not look at
keeps whatever it had.

## What the report says

Nine verdicts, and only three of them need you.

| verdict         | what it means                                            | what to do                    |
| --------------- | -------------------------------------------------------- | ----------------------------- |
| `added`         | new list upstream, blessed, deals a playable board       | nothing; it will be borrowed  |
| `updated`       | the list moved upstream                                  | nothing; it will be borrowed  |
| `unchanged`     | same bytes as the copy here                              | nothing; not even rewritten   |
| `absent`        | no repository, or nothing built yet                      | nothing; this is the queue    |
| `pending`       | built upstream, nobody has ruled on it                   | read the floor line under it  |
| `held`          | built upstream and refused there, in writing             | nothing; read the reason      |
| `unusable`      | built upstream, does not deal a playable board           | report it; nothing is offered |
| **`lost`**      | **a list this repo plays, gone upstream**                | **stop and ask**              |
| **`withdrawn`** | **a list this repo plays, upstream stopped shipping it** | **stop and ask**              |
| **`failing`**   | **a list this repo plays, now below the floor**          | **stop and ask**              |

`absent` is the ordinary state of most of this project. Forty-four of the fifty-one languages
have a translated interface, a candidate list waiting in `blinkered-attestation/candidates`, and
nobody has registered sources for them yet. That is a queue, not a fault, and it is not news
worth leading with.

## Two gates, and the higher one is not ours

Every language passes through both, and they answer different questions.

**`status.json` says whether it should ship.** Each dictionary repository publishes one, and the
field that matters here is `ships`. It carries `decided` and `why` beside it, and the report
prints the reason in full, because that sentence was written by a person for a person to read.

**The usability floor says whether it can be dealt.** Three seeds on the board the game opens on,
each needing a board the generator accepts holding a word of six tiles.

The blessing decides on its own. Japanese is why: it clears the floor comfortably and is refused
anyway, because its reader cannot build compound words and Japanese vocabulary is largely
compounds. That is a judgment about whether the list is any _good_, which no board count can
reach. A run whose verdict followed the floor would report Japanese as passing and then withdraw
it, which reads as a mechanical failure when it is nothing of the kind.

**Never infer a blessing.** A missing or unreadable `status.json` means not shipping. If that is
wrong, the fix is a commit in the language's own repository, never a flag here.

### `ships` has three values, and only one of them ships

| value       | means                                | verdict here                      |
| ----------- | ------------------------------------ | --------------------------------- |
| `true`      | blessed; offer it                    | `added` / `updated` / `unchanged` |
| `false`     | looked at and refused, with a reason | `held`                            |
| `"pending"` | nobody has ruled on it yet           | `pending`                         |

`false` used to carry both of the last two, and they are different facts: one is a decision with
an argument behind it, the other is work not done. A missing `status.json` reads as `"pending"`
for the same reason, and still does not ship. Anything else in the field stops the run rather
than being guessed at.

**A pending language is measured; a refused one is not.** That closes a circle the importer used
to be stuck in: a language is not offered until somebody blesses it, nobody can bless it without
knowing whether it plays, and the only run that could say so was skipping it because it was not
blessed. So the floor is dealt for every pending language and printed under its row, and the
report ends with the ones that clear it. Japanese is not re-measured every run, because there the
argument is editorial and another three boards it would pass add nothing.

**Blessing one is still a commit in its own repository**, never a flag here: `"ships": true` in
that repository's `status.json`, with the date and the reason beside it. It arrives on the next
run, and the next section is how to make it.

## Blessing a pending language

Part of this job when the operator asks for it, and never otherwise. The two halves are not the
same and the difference is the whole point:

- **Deciding** to bless a language is the operator's, always. Not yours because the floor passed,
  not yours because five others just went in, not yours because "ready" was said about the list.
  A list clearing the floor is the evidence for the decision and not the decision.
- **Making** the commit, once they have asked for it by name, is mechanical, and there is no
  reason to hand it back to them.

**Bring the evidence, do not just bring the question.** A pending language is one nobody has
ruled on, and the reason nobody has is usually that nobody had the numbers. Gather both halves
first, then say what you found and ask them to mark those languages as shipping:

- **the floor**, which the dry run already measured for every pending language;
- **a tour board**, searched for and read, so that "it plays" and "it has a first run" are
  answered together rather than a fortnight apart.

Both are in hand before the operator is asked anything, because a blessing is easy to give and
awkward to take back, and the second of those questions is the one that used to surface after the
import when the suite went red.

Then ask for two things: which languages, and the sentence that goes in `why`. That sentence is
read by whoever wonders later why this language is offered, so it is theirs to write. Offer a
draft if it helps, take their correction, and never invent one.

The edit is to `status.json` in `blinkered/blinkered-dictionary-<tag>`, on `main`:

```json
  "ships": true,
  "decided": "<the date>",
  "why": "<their sentence>",
```

Nothing else in the file moves. `saturation.mjs` carries these four fields forward on every
rebuild, which is why editing the published file is the supported way to do it rather than a
patch that the next build would undo.

Then come back and run the import, which now sees `added` where it saw `pending`.

**Withdrawing one is the same edit and not the same act.** Setting `ships` back to `false` takes
a language away from anybody playing it, so it is a regression, it comes back through **Regressions:
stop here**, and it needs the approval that section describes.

## Terms come from the language too

`status.json` also carries `license`, the SPDX id the list is under, and the import copies it
into `manifest.json` and each language's `LICENSE` rather than deciding it. Same reason as
`ships`: the terms of a word list belong to whoever assembled the evidence for it, and a constant
in this repository would be a second place that knows the answer and can be wrong about it. A
change upstream arrives on the next run.

**Not the repository's `LICENSE` file.** A dictionary repository is not all one licence: its
build scripts are Apache-2.0 and its `words.txt` is CC0, and reading the file would confidently
borrow the wrong one.

**A language that declares nothing gets nothing written.** The report names it and prints the one
line to add upstream. Do not fill the gap from here, however obvious the answer looks; an invented
licence is the one kind of wrong answer this project exists to avoid.

## The usability floor

A board the generator accepts, holding a word of six tiles, which is the first length that turns
a profit under the fibonacci economy.

That is deliberately not a coverage number. A language repository publishes when its record is
honest, which is a different question and a lower bar: a thin list stated as thin is a fine thing
to publish and a poor thing to deal from. The floor is `defaultWMin` for that language, scaled
per language, because a Russian board admits under half what an Italian one does and a single
number would be unreachable in one and free in the other.

**A language failing the floor may be a calibration fault rather than a thin list.** If several
languages fail at once, suspect `MEDIAN_WORDS`, `SHARE_BY_MINIMUM` and `DENSITY_SCALE` in
`packages/engine/src/difficulty.ts`: they describe a dictionary, and these lists are not the
dictionary they were measured against. `pnpm dictionary floor` regenerates them. Say so in the
report rather than switching the languages off.

## Regressions: stop here

`lost`, `withdrawn` and `failing` are the three outcomes that would take a working language away
from a player. Different causes, identical effect on somebody who opened the app this morning,
which is why all three are yours and not the tool's. It refuses to write while any of them is
unapproved, and prints the exact command that would approve them.

**Do not run that command on your own initiative.** Not to be helpful, not because the reason
looks obvious, not because the dry run already showed it. Approving is an edit to what the app
offers, and it is the operator's to make.

Bring them the list, one line each, with the reason and what it costs:

> Three languages would stop being playable:
>
> - `it`: the repository is gone. Italian has been playable since the first build.
> - `ja`: still built, `status.json` now says `ships: false`. Its reader cannot produce
>   compound words, and Japanese vocabulary is largely compounds.
> - `fi`: still published and blessed, now fails the floor. 2 of 3 boards fell short of 41 words.
>
> Approving deletes each one's directory and removes it from the picker. Anybody mid-game keeps
> the board they were dealt and cannot start another. The translation stays in the repo either
> way, so switching one back on later is one flag and one file.
>
> Approve any of these?

Only with a clear yes, naming the languages, run:

```sh
pnpm languages update --approve it,ja,fi
```

Approve **only** the ones they named. If they approve two of three, pass two; the third stays,
the tool refuses again, and that is the correct outcome rather than a problem to work around.

A `lost` language is worth one look before asking: a repository that 404s because a token expired
looks exactly like a repository that was deleted. The tool refuses without credentials for this
reason, but a token that works for fifty repositories and not the fifty-first is worth checking by
hand before calling it a deletion.

## Writing it

```sh
pnpm languages update --message /tmp/languages-commit.txt
```

That borrows each list, writes its `LICENSE` and `PROVENANCE.md`, rebuilds `manifest.json`, sets
`available` on every localization in `packages/i18n/src/registry.ts`, and writes the commit
message naming the upstream commit each file came from.

**Never set `available` by hand.** It is a claim that a word list is here and has been through the
floor, and a test checks it against the directory. Editing it directly makes the claim false or
the test red, and there is no third outcome.

**The import is not the end of the job.** A language that arrived needs a tour board, and one
that left needs its board taken away. That is the next section, and it is part of this run rather
than a follow-up: `TUTORIAL_BOARDS` is pinned to exactly the set of languages in the manifest, so
a run that stops here leaves the repository in a state that does not build.

## Tour boards, for every language that arrived or left

`TUTORIAL_BOARDS` in `packages/words/src/tutorialBoards.ts` is held to exactly the set of
languages in the manifest, so both directions are the same pin and neither is optional:

- **a language that arrived needs a board added**, or the suite is red the moment it is borrowed;
- **a language that left needs its board removed**, for the same reason.

**Searching is one step and pasting is another, and they happen either side of the blessing.**

```sh
pnpm dictionary board --language=<tag> --top=4
```

It prints four boards ranked by the worst of their three words in the corpus, so the first is
usually the one, and it is still worth reading the three words before taking it. The first run is
where somebody decides whether this dictionary is worth trusting.

**The search runs before the blessing.** `--language` names the language directly instead of
going through the manifest, so the only thing it needs is the list at
`packages/words/data/<tag>/words.txt`. For a language that has not been borrowed yet, put the
upstream `words.txt` there, run the search, and take it away again; those are the same bytes the
import would write, so the boards are the boards. Clean up however it exits and check
`git status` afterwards, because a stray directory under `packages/words/data` is a language as
far as `i18n.test.ts` is concerned.

**The paste happens after the import.** `TUTORIAL_BOARDS` is pinned to the manifest in both
directions, so an entry for a language that has not been borrowed yet fails the test exactly as
surely as a missing one.

The dry run says who will want a board: a `pending` language carries `no tour board yet` on its
floor line, and a language that arrives is named under **the first-run tour needs attention**.

**This is the one step that still reaches outside the repository.** It reads the language's
OpenSubtitles frequency list through the download cache: tens of megabytes the first time for
each language, and nothing afterwards. Check the disk before doing several at once.

## Then verify, then commit

```sh
pnpm typecheck && pnpm lint && pnpm test
```

Three of these will tell you something real:

- `i18n.test.ts` checks `available` against the files on disk.
- `everyLanguagePlays.test.ts` deals three boards in every language that shipped.
- `tutorialBoard.test.ts` checks each language's tour board against the list it is dealt from,
  and holds `TUTORIAL_BOARDS` to exactly the set of languages in the manifest.

**A language that stayed can still have lost its tour.** Separate from the two cases above, and
the only one of the three that is advisory: a language whose demonstration needs rebuilding is
still a language that plays. The opening and correcting words have to be in the new list's
_common_ tier and the card word somewhere in it, and an attested list is a different list.
Regenerate it with the same command, which the report prints for you.

**Look at what the old board was doing before you replace it.** Japanese opened on いたい
correcting to たいへいよう, with the card turning へ into せ, so the Pacific became the Atlantic.
That came out of teaching the search to prefer words Japanese spells the way the tiles do, and
`pnpm dictionary board` ranks by corpus frequency, so it will not reliably find such a pair again.
Where the missing words are ordinary ones, the better repair is upstream: the attestation harvest
exists for exactly this, and getting the word attested keeps the tour instead of replacing it.

Never fix this by loosening the test. A tour that opens on a word the player cannot find in the
dictionary teaches them to distrust the dictionary, which is the whole thing this work buys.

Commit with the message the tool wrote, unedited apart from anything you learned:

```sh
git commit -F /tmp/languages-commit.txt
```

One commit for the whole run, naming every language and the upstream commit its bytes came from.
That citation is the point: somebody who doubts a word can follow the sha to the evidence that
earned it, and a borrowed list recorded without its commit has no provenance at all.

## What this skill does not touch

- **The dictionary repositories.** They are where a list is built, measured and argued about.
  Nothing here writes to them except the blessing, and only when the operator has asked for it by
  name. Never the words, the evidence or the build.
- **`blinkered-attestation`.** Its roll-up has its own rule and its own command, `pnpm roll`, run
  from that repository after a language changes.
- **The candidate lists.** They live in `blinkered-attestation/candidates`, apart from the lists
  they judge, so that a language cannot end up taking its own output as its input.
- **Localizations.** A language switched off keeps its translation, its flag and its endonym.
  `LOCALES` stays at fifty-one; `available` is what moves.
