#!/bin/sh
# Render every icon the consoles ask for from brand/logo.svg.
#
# Needs Chrome (for the SVG, because it resolves `system-ui` to the same font the game uses) and
# ImageMagick (to scale, and to check the results).
#
# Two variants come out of the one source:
#
#   round   the mark as drawn: the tile fills the frame, its corners are the game's radius, and
#           the ground behind them is transparent. Anywhere that draws an icon as given.
#   square  the same tile with its corners squared off and the alpha channel stripped. For the
#           four places that must not round their own corners or carry transparency: the App
#           Store asset, the native app's icon, the iOS home-screen icon, and the Android
#           maskable icon.
#
# Each variant is rendered once at 1024 and scaled down from there. Two things make that the right
# way round rather than rendering each size directly:
#
#   - Chrome will not paint a window as small as 120 and writes a blank frame instead, every time.
#   - Headless Chrome will screenshot a frame it has not finished painting. Two invocations are
#     rare enough to retry; ten produced a blank file or a tile with no letter about twice a run.
#
# So both masters are checked for a plausible number of distinct colours and retried, and the
# script fails rather than leave a blank icon behind. Do not remove that check. Scale down plainly,
# without premultiplying: Chrome leaves the tile's colour in the transparent corners, so there is
# nothing to fringe, and un-premultiplying near-zero alpha invents bright pixels out there.
set -eu

cd "$(dirname "$0")/.."
CHROME=${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}
[ -x "$CHROME" ] || { echo "no Chrome at $CHROME; set CHROME=" >&2; exit 1; }

ICON=apps/mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# Without width and height the viewBox fills the window, so a window of N gives an N by N render.
# Anchored to the root element: the tile carries the same width and height, and needs to keep them.
sed 's/^\(<svg .*\) width="1024" height="1024"/\1/' brand/logo.svg >"$work/round.svg"
# Squaring the corners also removes the only transparent pixels in the frame.
sed 's/ rx="[0-9]*"//' "$work/round.svg" >"$work/square.svg"

# An anti-aliased letter on a tile is never fewer than a few dozen distinct colours. A part-painted
# frame is 1 (nothing) or 2 (a tile, no letter), so the two failures are far from the real thing.
FLOOR=16

master() { # master <variant> -> $work/<variant>.png at 1024
  try=1
  while [ "$try" -le 4 ]; do
    "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
      --virtual-time-budget=4000 --default-background-color=00000000 \
      --window-size=1024,1024 --screenshot="$work/$1.png" "$work/$1.svg" >/dev/null 2>&1 || true
    got=$(magick "$work/$1.png" -format "%wx%h %k" info: 2>/dev/null || echo "0x0 0")
    if [ "${got% *}" = "1024x1024" ] && [ "${got#* }" -ge "$FLOOR" ]; then
      echo "$1 master: ${got#* } colours, attempt $try"
      return 0
    fi
    try=$((try + 1))
  done
  echo "FAILED: the $1 master never rendered ($got after 4 attempts)" >&2
  exit 1
}

scale() { # scale <variant> <size> <out>
  magick "$work/$1.png" -filter Lanczos -resize "$2x$2" "$3"
  got=$(magick "$3" -format "%wx%h %k" info:)
  [ "${got% *}" = "$2x$2" ] && [ "${got#* }" -ge "$FLOOR" ] || {
    echo "FAILED: $3 came out as $got" >&2
    exit 1
  }
  echo "  $3 ($2, ${got#* } colours)"
}

master round
master square

echo "the mark, with its own corners and a transparent ground:"
scale round 512 brand/logo-512.png
scale round 256 brand/logo-256.png
scale round 192 brand/logo-192.png
scale round 180 brand/logo-180.png
scale round 120 brand/logo-120.png
scale round 512 apps/web/public/icon-512.png
scale round 192 apps/web/public/icon-192.png

echo "squared off and opaque:"
scale square 1024 brand/logo-1024.png
scale square 180 apps/web/public/apple-touch-icon.png
scale square 512 apps/web/public/icon-maskable-512.png
# The native app's icon is this same asset, so it is generated here rather than drawn a second
# time. It used to be redrawn from scratch in apps/mobile/tools/make-icons.mjs, which meant two
# definitions of one mark, and they had already drifted: that letter was 348x448 where this one
# is 464x597.
scale square 1024 "$ICON"
for f in brand/logo-1024.png apps/web/public/apple-touch-icon.png \
  apps/web/public/icon-maskable-512.png "$ICON"; do
  magick "$f" -alpha off "$f" # Apple rejects an icon that carries an alpha channel at all.
  [ "$(magick "$f" -format "%A" info:)" = "Undefined" ] || {
    echo "FAILED: $f still carries an alpha channel" >&2
    exit 1
  }
done

# The favicon is the same file the browser can scale itself, without the comment.
sed '/<!--/,/-->/d' "$work/round.svg" | sed '/^$/d' >apps/web/public/favicon.svg
echo "  apps/web/public/favicon.svg"
