# Euskara (`eu`)

Borrowed, not built. This list is a copy of what `blinkered/blinkered-dictionary-eu` publishes on its main
branch, and that repository is where it is made, measured and argued about.

| | |
| --- | --- |
| upstream | https://github.com/blinkered/blinkered-dictionary-eu |
| commit | [`baca10c1aff3`](https://github.com/blinkered/blinkered-dictionary-eu/commit/baca10c1aff3dc092f6ba7de2437d3ebeadd6c09) |
| committed | 2026-09-23T20:35:56Z |
| blob | `f10e4346daf4a208cde273c1f0d0f91326ad4d08` |
| borrowed | 2026-09-24T02:25:41.965Z |
| common | 3,964 |
| full | 3,964 |
| digest | `none` |

## Why it ships

`blinkered/blinkered-dictionary-eu` says so, in its own `status.json`, decided 2026-09-23:

> Clears the standard tests, the minimum-W floor and its tour board; blessed 2026-09-23.

That is a separate question from whether the list deals a playable board, and a higher one. This
repository checks the board; only the repository that built the list is in a position to say
whether the list is any good. A language can clear the floor comfortably and be held back anyway.

## Where the words come from

Every word here is attested: three independent collections of Euskara text were found to
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
