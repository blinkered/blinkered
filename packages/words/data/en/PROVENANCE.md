# English (`en`)

Borrowed, not built. This list is a copy of what `blinkered/blinkered-dictionary-en` publishes on its main
branch, and that repository is where it is made, measured and argued about.

| | |
| --- | --- |
| upstream | https://github.com/blinkered/blinkered-dictionary-en |
| commit | [`c3dcffe3aa1a`](https://github.com/blinkered/blinkered-dictionary-en/commit/c3dcffe3aa1a04fdf52d838b8cdce75407509671) |
| committed | 2026-09-21T22:44:50Z |
| blob | `e4d44fe1d0876be088dc8a1f2de1130e9364d6bf` |
| borrowed | 2026-09-21T22:48:21.296Z |
| common | 16,575 |
| full | 112,115 |
| digest | `none` |

## Why it ships

`blinkered/blinkered-dictionary-en` says so, in its own `status.json`, decided 2026-09-21:

> Blessed by the operator on 2026-09-21, in the first cut of seven.

That is a separate question from whether the list deals a playable board, and a higher one. This
repository checks the board; only the repository that built the list is in a position to say
whether the list is any good. A language can clear the floor comfortably and be held back anyway.

## Where the words come from

Every word here is attested: three independent collections of English text were found to
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
