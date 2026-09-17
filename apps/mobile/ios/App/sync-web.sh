#!/bin/bash
#
# Builds the web app and copies it into the shell, as a build phase.
#
# Exists because of a failure with no error message in it. Xcode's Run button builds neither
# `apps/web` nor the copy of it that Capacitor bundles: `cap copy` puts `apps/web/dist` into
# `ios/App/App/public`, and Xcode ships whatever is sitting in that folder. Forget either command
# and the build succeeds and installs an older app -- which happened, and read as "the intro is
# six screens long" and later as "the sign-in screen has no Apple and Google options". Neither
# looked like a stale copy. Both were.
#
# `copy` rather than `sync`: sync also runs `pod install`, which has no business running inside a
# build that CocoaPods is already driving.
set -euo pipefail

# Xcode build phases get a minimal PATH, so the toolchain has to be found rather than assumed.
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/share/pnpm:$PATH"
if ! command -v pnpm > /dev/null; then
  echo "error: pnpm is not on PATH. Add its directory to sync-web.sh." >&2
  exit 1
fi

root=$(cd "$SRCROOT/../../../.." && pwd)
cd "$root"

# Two levels of drift are possible and both matter: dist behind the sources, and public behind
# dist. This closes both, every time, in about five seconds.
pnpm --filter @blinkered/web build
pnpm --filter @blinkered/mobile exec cap copy ios

echo "web assets copied into ios/App/App/public"
