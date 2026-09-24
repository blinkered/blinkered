# Português (Brasil) (`pt-BR`)

Borrowed, not built. This list is a copy of what `blinkered/blinkered-dictionary-pt-BR` publishes on its main
branch, and that repository is where it is made, measured and argued about.

| | |
| --- | --- |
| upstream | https://github.com/blinkered/blinkered-dictionary-pt-BR |
| commit | [`d0117e2e6a21`](https://github.com/blinkered/blinkered-dictionary-pt-BR/commit/d0117e2e6a21e7c7ec7855275f17d814bcc00409) |
| committed | 2026-09-24T01:13:48Z |
| blob | `fab02e172c66922699d1f4fc16f2fbfeb4ab236b` |
| borrowed | 2026-09-24T02:11:35.282Z |
| common | 17,000 |
| full | 157,040 |
| digest | `none` |

## Why it ships

`blinkered/blinkered-dictionary-pt-BR` says so, in its own `status.json`, decided 2026-09-21:

> Blessed by the operator on 2026-09-21, after verifying the usability floor, the minimum-W tests and the boards it deals.

That is a separate question from whether the list deals a playable board, and a higher one. This
repository checks the board; only the repository that built the list is in a position to say
whether the list is any good. A language can clear the floor comfortably and be held back anyway.

## Where the words come from

Every word here is attested: three independent collections of Português (Brasil) text were found to
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
