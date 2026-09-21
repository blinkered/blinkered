# 한국어 (`ko`)

Borrowed, not built. This list is a copy of what `blinkered/blinkered-dictionary-ko` publishes on its main
branch, and that repository is where it is made, measured and argued about.

| | |
| --- | --- |
| upstream | https://github.com/blinkered/blinkered-dictionary-ko |
| commit | [`e8e949f7e4b2`](https://github.com/blinkered/blinkered-dictionary-ko/commit/e8e949f7e4b2618119dc287d98a9bfc43cfb1c9a) |
| committed | 2026-09-21T22:43:07Z |
| blob | `cb95a0d382a976946242670b1889600dde736d13` |
| borrowed | 2026-09-21T22:44:36.174Z |
| common | 19,257 |
| full | 24,395 |
| digest | `none` |

## Why it ships

`blinkered/blinkered-dictionary-ko` says so, in its own `status.json`, decided 2026-09-21:

> Blessed by the operator on 2026-09-21, in the first cut of seven.

That is a separate question from whether the list deals a playable board, and a higher one. This
repository checks the board; only the repository that built the list is in a position to say
whether the list is any good. A language can clear the floor comfortably and be held back anyway.

## Where the words come from

Every word here is attested: three independent collections of 한국어 text were found to
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
