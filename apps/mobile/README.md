# apps/mobile

The native shell. It owns no game code: `capacitor.config.ts` points `webDir` at
`../web/dist`, so the app is the same bundle the website serves, running in a WKWebView.

```
pnpm mobile        # build apps/web, then copy it into the Xcode project
pnpm mobile:open   # open the project in Xcode
```

`pnpm mobile` is a web build followed by `cap sync`, in that order and always both, because the
thing Capacitor copies is `apps/web/dist` and a stale `dist` produces a stale app that looks like
a code change that did not take.

## Getting it onto a phone

Three prerequisites, and the first is the one that surprises people:

1. **Xcode's iOS platform support**, which is a separate multi-gigabyte download from Xcode
   itself. Without it there is no build destination at all and `xcodebuild` fails with
   `iOS 26.5 is not installed`, which reads like a project problem and is not one.
   Xcode > Settings > Components, or `xcodebuild -downloadPlatform iOS`.
2. **CocoaPods.** `brew install cocoapods`. See the note at the bottom if `pod` then explodes.
3. **A signing identity**, which cannot be scripted: it needs an Apple ID typed into Xcode.

Then:

```
pnpm mobile
pnpm mobile:open
```

In Xcode, select the **App** target, then **Signing & Capabilities**, and set **Team** to your
Apple ID. Xcode creates a free development certificate the first time. Plug the phone in, pick it
in the destination menu at the top, and press Run.

**On a free Apple ID** the app stops launching after **seven days** and has to be re-installed
from Xcode. You also have to trust the certificate on the phone the first time, under Settings >
General > VPN & Device Management. Three devices at a time, no TestFlight.

**On the paid Developer Program** the build signs for a year and TestFlight becomes possible,
which is how the app gets to a phone without a cable. That account should be the Tight Line
organisation account rather than an individual one, per docs/STATUS.md.

Worth stating because it is a natural thing to assume: **Apple Business Manager is a different
programme and does not include TestFlight.** ABM is free and deploys apps and devices to people;
the Developer Program is $99/yr and is what lets you build and beta-test one. Having ABM does
help, in that its enrolment already required a verified D-U-N-S number, which is the slow part of
organisation enrolment in the Developer Program.

## What the shell had to change about the game

Almost nothing, which was the point of doing the web work first. Two things:

**The rules could not stay a second tab.** A WebView has no tabs, and `target="_blank"` on a
local URL is dropped silently, so the link did nothing. Navigating in place is worse: it would
load the rules over a running game and lose it. So in the shell the same words become a button
and the rules render in-app over the top, with the game still mounted and still paused
underneath. `apps/web/src/platform.ts` is the whole of the platform detection, and it reads the
global Capacitor injects rather than importing `@capacitor/core`, so `apps/web` keeps no
dependency on Capacitor at all.

**The status bar.** The game is dark-only, and iOS defaults to dark status bar text, which is
invisible on it. `UIUserInterfaceStyle: Dark` in `Info.plist` tells iOS what the app already
knows, and the light status bar text follows from that rather than from a second setting.

Everything else the app needs was already there from making the site work on a phone: the touch
targets, the board that sizes itself to the screen, the safe-area padding, and the tap prompt that
does not tell a phone to type. See docs/IOS.md.

## The word lists are inside the app

All sixteen, about 42MB of the bundle. In the browser they are fetched from the server when a
language is chosen; here they are already on the device, so a game works in aeroplane mode and no
request leaves the phone. `dictionary.ts` needed no change for this, because it builds its URLs
from `import.meta.env.BASE_URL` and the WebView serves the bundle from the app's own root.

Two consequences worth knowing before this goes near the App Store:

- **The binary is large.** Fine for a development install. For distribution it is worth asking
  whether every language ships or whether they download on demand.
- **Five of those lists are CC BY-SA**: Italian, German, Norwegian, Finnish, Malay. Wrapping DRM
  around a share-alike data file is a question the web build never had to answer, because there
  attribution is the whole obligation and we do it. Read the end of docs/DICTIONARIES.md, and
  probably a lawyer, before shipping. This is unchanged by anything here; the shell simply makes
  it live.

## What is tracked, and what is generated

The Xcode project is committed, so native settings are reviewable in a diff. These are not:

```
ios/App/App/public/                  a copy of apps/web/dist, made by `cap sync`
ios/App/Pods/                        vendored by `pod install`; Podfile.lock is tracked
ios/App/App/capacitor.config.json    generated from capacitor.config.ts
ios/App/build/, ios/DerivedData/     build output
```

If the project ever gets into a state that makes no sense, deleting `ios/` and running
`npx cap add ios` regenerates it. The only things worth keeping first are the `Info.plist` change
above and the asset catalogue, which `tools/make-icons.mjs` can redraw.

## The icon

`tools/make-icons.mjs` draws the app icon and the splash screen by rendering a few lines of HTML
in headless WebKit and screenshotting it, the same way `apps/web/public`'s icons are made. The
output is committed; the script only needs running when the mark changes, and it needs a
throwaway Playwright install rather than a repo dependency. Its header says how.

The icon is a selected tile, in the blue the board paints a taken letter. The splash is the app's
own background with the same tile on it, so the handover from splash to first paint has nothing
to see.

## If `pod` dies looking for a gem

Not a project problem, and not the Ruby version manager's fault either. Homebrew's wrapper is one
line:

```sh
GEM_HOME=".../cocoapods/1.17.0/libexec" exec ".../libexec/bin/pod" "$@"
```

It overrides `GEM_HOME` and **not `GEM_PATH`**. Any Ruby version manager exports both, so the
interpreter is Homebrew's Ruby while `GEM_PATH` still points at the managed Ruby's gem tree. An
explicitly set `GEM_PATH` also replaces the interpreter's own default-gem specification path, so
`pod` fails to activate a gem its own Ruby ships. The error names the gem, which makes it look
like a Capacitor or CocoaPods problem, and it is neither.

The fix belongs on the machine rather than here, because it affects every brew-installed Ruby
command line tool and Xcode invokes `pod` too. A shim earlier on `PATH` than
`/opt/homebrew/bin`, which survives `brew upgrade` in a way that editing the formula does not:

```sh
#!/bin/sh
# Homebrew's cocoapods wrapper sets GEM_HOME but not GEM_PATH, so a Ruby version manager's
# exported GEM_PATH sends rubygems to the wrong Ruby's gems.
exec env -u GEM_HOME -u GEM_PATH -u RUBYOPT -u BUNDLE_GEMFILE /opt/homebrew/bin/pod "$@"
```

Installing CocoaPods as an ordinary gem instead would also work and is worse for iOS work: a gem
in a version-managed Ruby disappears the moment you switch rubies for another project, which is
the reason to want the self-contained Homebrew install in the first place.

Failing all that, one command works without changing anything:

```
env -u GEM_HOME -u GEM_PATH -u RUBYOPT -u BUNDLE_GEMFILE npx cap sync ios
```
