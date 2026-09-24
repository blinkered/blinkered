# Svenska (`sv`)

Borrowed, not built. This list is a copy of what `blinkered/blinkered-dictionary-sv` publishes on its main
branch, and that repository is where it is made, measured and argued about.

| | |
| --- | --- |
| upstream | https://github.com/blinkered/blinkered-dictionary-sv |
| commit | [`1bd2e9ac7ec5`](https://github.com/blinkered/blinkered-dictionary-sv/commit/1bd2e9ac7ec59827e5f86385d4c71c2c8a74817e) |
| committed | 2026-09-24T01:14:33Z |
| blob | `bbe8c31764e29cc61762da2b800a2469377dde5b` |
| borrowed | 2026-09-24T02:11:35.282Z |
| common | 17,000 |
| full | 162,041 |
| digest | `none` |

## Why it ships

`blinkered/blinkered-dictionary-sv` says so, in its own `status.json`, decided 2026-09-22:

> Clears the usability floor on all three boards and has a first-run tour of common words (e.g. BEZ → DOBRZE / BARDZO); blessed 2026-09-22.

That is a separate question from whether the list deals a playable board, and a higher one. This
repository checks the board; only the repository that built the list is in a position to say
whether the list is any good. A language can clear the floor comfortably and be held back anyway.

## Where the words come from

Every word here is attested: three independent collections of Svenska text were found to
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
