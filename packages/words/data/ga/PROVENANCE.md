# Gaeilge (`ga`)

Borrowed, not built. This list is a copy of what `blinkered/blinkered-dictionary-ga` publishes on its main
branch, and that repository is where it is made, measured and argued about.

| | |
| --- | --- |
| upstream | https://github.com/blinkered/blinkered-dictionary-ga |
| commit | [`bc17b69a81e8`](https://github.com/blinkered/blinkered-dictionary-ga/commit/bc17b69a81e8a9a3114dd8966c9f93867dbf45ff) |
| committed | 2026-09-23T20:13:48Z |
| blob | `e0c618adb5f9bc8eb79b89d537d9df287459d386` |
| borrowed | 2026-09-24T02:25:41.965Z |
| common | 8,585 |
| full | 8,585 |
| digest | `none` |

## Why it ships

`blinkered/blinkered-dictionary-ga` says so, in its own `status.json`, decided 2026-09-23:

> Clears the standard tests, the minimum-W floor and its tour board; blessed 2026-09-23.

That is a separate question from whether the list deals a playable board, and a higher one. This
repository checks the board; only the repository that built the list is in a position to say
whether the list is any good. A language can clear the floor comfortably and be held back anyway.

## Where the words come from

Every word here is attested: three independent collections of Gaeilge text were found to
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
