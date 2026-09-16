# Brand assets

One mark, rendered at the sizes the consoles ask for. `logo.svg` is the source; everything else
comes from it. To regenerate, run `sh brand/render.sh`, which needs Chrome and ImageMagick.
Never edit a PNG.

## What it is

A selected tile, drawn the way `apps/web/src/styles.css` draws one: the board's selected colour,
the same colour for its border, and a white letter, with the game's corner ratio of 10px on a
68px tile. Nothing about it is invented, which is the point. The title screen already spells
BLINKERED in tiles that light up this way, so the icon and the game are visibly the same thing.

The tile fills the frame and the ground behind its corners is transparent, so each platform
supplies its own corner and its own backdrop.

## The two variants

`render.sh` derives both from `logo.svg`, by stripping one attribute and then the alpha channel.

| Variant    | What changes                                | Why                                                                      |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| **round**  | nothing; the mark as drawn                  | anywhere that draws an icon exactly as given                             |
| **square** | corners squared off, alpha channel stripped | the three places that must not round their own corners or be see-through |

| File                                    | Variant | Where it goes                                      |
| --------------------------------------- | ------- | -------------------------------------------------- |
| `logo.svg`                              | source  | the source of truth                                |
| `logo-1024.png`                         | square  | App Store                                          |
| `logo-512.png`                          | round   | Google's OAuth branding page, and any large square |
| `logo-256.png`, `logo-192.png`          | round   | general use                                        |
| `logo-180.png`                          | round   | the size iOS uses for a home-screen icon           |
| `logo-120.png`                          | round   | Google's stated minimum for the consent screen     |
| `apps/web/public/favicon.svg`           | round   | the browser tab                                    |
| `apps/web/public/icon-512.png`, `-192`  | round   | the manifest's `purpose: "any"` icons              |
| `apps/web/public/icon-maskable-512.png` | square  | the manifest's `purpose: "maskable"` icon          |
| `apps/web/public/apple-touch-icon.png`  | square  | the iOS home screen                                |

## Five things to know before changing it

**The square variant must stay opaque and unrounded.** Apple rejects an App Store icon that
carries an alpha channel at all, even a fully opaque one, and both Apple and Android apply their
own mask, so those files must not round their own corners. That is the whole reason the variant
exists; `render.sh` drops the channel rather than trusting the renderer to omit it.

**The letter has to clear two masks, and only just does.** Its ink measures 464×597 at (280,213)
in the 1024 frame, so the corners of that box sit 378px from the centre. Android's maskable safe
zone is a circle of radius 409.6, and Apple's corner arcs are nowhere near it. Enlarging the
letter past roughly font-size 900 starts to clip under a circular mask. Measure, do not eyeball:

```sh
magick brand/logo-1024.png -background black -alpha remove -alpha off \
  -colorspace gray -threshold 80% -background black -trim -format "%wx%h+%X+%Y\n" info:
```

**Chrome will not paint a window as small as 120**, and writes a blank frame rather than failing,
which is why `render.sh` scales down from a single 1024 master and then checks that every file it
wrote has a plausible number of distinct colours. It will also screenshot a frame it has not
finished painting, so the masters are retried. Both checks earned their place; leave them in.

**Never write a double hyphen in `logo.svg`'s comment.** It is illegal inside an XML comment, and
a renderer rejects the entire file rather than just the comment. This is not hypothetical: the
comment used to name the CSS custom properties, which made the file unparseable by every browser.

**Google will not show the logo until brand verification passes.** Until then the consent screen
displays the registrable domain from the authorized domains list instead of the name and logo.
That is a separate, lighter process from the app verification that sensitive scopes trigger, and
it applies however tame the scopes are. See [../docs/AUTH.md](../docs/AUTH.md).
