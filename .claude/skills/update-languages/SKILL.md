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

Narrow it while iterating: `--only de,ko`. That is safe — a language the run did not look at
keeps whatever it had.

## What the report says

Seven verdicts, and only two of them need you.

| verdict | what it means | what to do |
| --- | --- | --- |
| `added` | new list upstream, deals a playable board | nothing; it will be borrowed |
| `updated` | the list moved upstream | nothing; it will be borrowed |
| `unchanged` | same bytes as the copy here | nothing; not even rewritten |
| `absent` | no repository, or nothing built yet | nothing; this is the queue |
| `unusable` | built upstream, does not deal a playable board | report it; nothing is offered |
| **`lost`** | **a list this repo plays, gone upstream** | **stop and ask** |
| **`failing`** | **a list this repo plays, now below the floor** | **stop and ask** |

`absent` is the ordinary state of most of this project. Forty-three of the fifty-one languages
have a translated interface, a candidate list waiting in `blinkered-attestation/candidates`, and
nobody has registered sources for them yet. That is a queue, not a fault, and it is not news
worth leading with.

## The usability floor

A list is offered only if it deals a board somebody could play. Three seeds on the board the game
opens on, each needing a board the generator **accepts** and which holds a word of six tiles,
which is the first length that turns a profit under the fibonacci economy.

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

`lost` and `failing` are the two outcomes that would take a working language away from a player.
The tool refuses to write while either is unapproved, and prints the exact command that would
approve them.

**Do not run that command on your own initiative.** Not to be helpful, not because the reason
looks obvious, not because the dry run already showed it. Approving is an edit to what the app
offers, and it is the operator's to make.

Bring them the list, one line each, with the reason and what it costs:

> Three languages would stop being playable:
>
> - `it` — the repository is gone. Italian has been playable since the first build.
> - `pl` — repository is there, `words.txt` has been removed from main.
> - `fi` — still published, now fails the floor: 2 of 3 boards fell short of 41 words.
>
> Approving deletes each one's directory and removes it from the picker. Anybody mid-game keeps
> the board they were dealt and cannot start another. The translation stays in the repo either
> way, so switching one back on later is one flag and one file.
>
> Approve any of these?

Only with a clear yes, naming the languages, run:

```sh
pnpm languages update --approve it,pl,fi
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

## Then verify, then commit

```sh
pnpm typecheck && pnpm lint && pnpm test
```

Three of these will tell you something real:

- `i18n.test.ts` checks `available` against the files on disk.
- `everyLanguagePlays.test.ts` deals three boards in every language that shipped.
- `tutorialBoard.test.ts` checks each language's tour board against the list it is dealt from,
  and holds `TUTORIAL_BOARDS` to exactly the set of languages in the manifest.

The dry run already told you about that last one, under **the first-run tour needs attention**.
It is advisory and never blocks: a language whose demonstration needs rebuilding is still a
language that plays. Two shapes of it.

**A language that leaves needs its tour board removed** from
`packages/words/src/tutorialBoards.ts`, because the test pins the two sets equal. A language that
arrives needs one added, and the report says so.

**A language that stays can still lose its tour.** The opening and correcting words have to be in
the new list's *common* tier and the card word somewhere in it, and an attested list is a
different list. Regenerate with the command the report prints:

```sh
pnpm dictionary board --language=<tag> --top=4
```

and paste the entry it prints. This reads the language's frequency corpus, so it is the one step
here that still reaches into the old pipeline's downloads.

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
  Nothing here writes to them.
- **`blinkered-attestation`.** Its roll-up has its own rule and its own command, `pnpm roll`, run
  from that repository after a language changes.
- **The candidate lists.** They live in `blinkered-attestation/candidates`, apart from the lists
  they judge, so that a language cannot end up taking its own output as its input.
- **Localizations.** A language switched off keeps its translation, its flag and its endonym.
  `LOCALES` stays at fifty-one; `available` is what moves.
