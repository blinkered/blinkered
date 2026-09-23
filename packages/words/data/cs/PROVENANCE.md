# Čeština (`cs`)

Borrowed, not built. This list is a copy of what `blinkered/blinkered-dictionary-cs` publishes on its main
branch, and that repository is where it is made, measured and argued about.

| | |
| --- | --- |
| upstream | https://github.com/blinkered/blinkered-dictionary-cs |
| commit | [`26c3ef80e66f`](https://github.com/blinkered/blinkered-dictionary-cs/commit/26c3ef80e66fa375ecf238eb0599036faee31001) |
| committed | 2026-09-22T23:28:31Z |
| blob | `9c7479492876c607a6e0440b908c11ff10ab926c` |
| borrowed | 2026-09-23T00:13:21.871Z |
| common | 17,000 |
| full | 21,486 |
| digest | `none` |

## Why it ships

`blinkered/blinkered-dictionary-cs` says so, in its own `status.json`, decided 2026-09-22:

> Clears the usability floor on all three boards and has a first-run tour of common words (e.g. BEZ → DOBRZE / BARDZO); blessed 2026-09-22.

That is a separate question from whether the list deals a playable board, and a higher one. This
repository checks the board; only the repository that built the list is in a position to say
whether the list is any good. A language can clear the floor comfortably and be held back anyway.

## Where the words come from

Every word here is attested: three independent collections of Čeština text were found to
contain it, and the evidence recording which, and where, is committed upstream next to the
list. Independence is counted over families rather than collections, because three pages of
one web crawl can easily be three mirrors of one dictionary.

The dictionaries that used to build this list still have a job, and it is a smaller one: they
propose the words worth looking up. Their candidate lists live in
`blinkered-attestation/candidates`, apart from the lists they judge.

## What to do about this file

Nothing by hand. `pnpm languages update` rewrites it from whatever the upstream repository
publishes, and refuses to disable a language that used to work without an operator saying so.
Editing it here would only make this repository disagree with the one that is right.
