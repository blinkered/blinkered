# Brand assets

One mark, rendered at the sizes the consoles ask for.

`logo.svg` is the source; everything else comes from it. To regenerate, render the SVG at
1024×1024 and resize down, rather than editing a PNG.

| File                           | Where it goes                                                         |
| ------------------------------ | --------------------------------------------------------------------- |
| `logo.svg`                     | the source of truth                                                   |
| `logo-1024.png`                | App Store. Opaque, square, no alpha and no rounded corners of its own |
| `logo-512.png`                 | Google's OAuth branding page, and anywhere wanting a large square     |
| `logo-256.png`, `logo-192.png` | general use                                                           |
| `logo-180.png`                 | the size iOS uses for a home-screen icon                              |
| `logo-120.png`                 | Google's stated minimum for the consent screen                        |

## What it is

A selected tile, drawn the way `apps/web/src/styles.css` draws one: the board's background
(`--bg`), a tile in `--sel` with the game's corner ratio (10px on a 68px tile), and a white
letter. Nothing about it is invented, which is the point. The title screen already spells
BLINKERED in tiles that light up this way, so the icon and the game are visibly the same thing.

## Two things to know before changing it

**The App Store asset must stay opaque.** Apple rejects an icon with an alpha channel, and applies
its own rounded mask, so the icon must not round its own corners. The margin around the tile is
wide enough that Apple's mask never reaches it.

**Google will not show it until brand verification passes.** Until then the consent screen
displays the registrable domain from the authorized domains list instead of the name and logo.
That is a separate, lighter process from the app verification that sensitive scopes trigger, and
it applies however tame the scopes are. See [../docs/AUTH.md](../docs/AUTH.md).
