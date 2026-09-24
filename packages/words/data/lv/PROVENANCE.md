# Latviešu (`lv`)

Borrowed, not built. This list is a copy of what `blinkered/blinkered-dictionary-lv` publishes on its main
branch, and that repository is where it is made, measured and argued about.

| | |
| --- | --- |
| upstream | https://github.com/blinkered/blinkered-dictionary-lv |
| commit | [`ee72602359bb`](https://github.com/blinkered/blinkered-dictionary-lv/commit/ee72602359bbb6b522fa0b70f7f2d6fc2aee5bff) |
| committed | 2026-09-23T21:32:35Z |
| blob | `faeb436e188a3771a0ac1191082d54d8c1ded228` |
| borrowed | 2026-09-24T02:25:41.965Z |
| common | 17,000 |
| full | 49,838 |
| digest | `none` |

## Why it ships

`blinkered/blinkered-dictionary-lv` says so, in its own `status.json`, decided 2026-09-23:

> Clears the standard tests, the minimum-W floor and its tour board; blessed 2026-09-23.

That is a separate question from whether the list deals a playable board, and a higher one. This
repository checks the board; only the repository that built the list is in a position to say
whether the list is any good. A language can clear the floor comfortably and be held back anyway.

## Where the words come from

Every word here is attested: three independent collections of Latviešu text were found to
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
