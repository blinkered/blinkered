/**
 * Draws the app icon and the splash screen.
 *
 * Rendered in headless WebKit and screenshotted, which is how `apps/web/public`'s icons are made
 * too: no image toolchain to install, and the source of every asset is the few lines below rather
 * than a binary whose origin has been lost.
 *
 * Needs Playwright, which the repo does not depend on. Run it with a temporary copy:
 *
 *   cd $(mktemp -d) && npm i playwright@1 --silent \
 *     && node <repo>/apps/mobile/tools/make-icons.mjs <repo>/apps/mobile/ios/App/App/Assets.xcassets
 *
 * The output is committed, so this only needs running when the mark changes.
 */
import { writeFileSync } from 'node:fs'
import { webkit } from 'playwright'

const ASSETS = process.argv[2]
if (!ASSETS) throw new Error('usage: make-icons.mjs <path to Assets.xcassets>')

const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
const BLUE = '#2f81f7'
const DARK = '#0e1116'

/**
 * The icon is a selected tile: the blue the board paints a taken letter, and the white on top of
 * it. Full bleed and fully opaque, because iOS applies its own mask and composites transparency
 * onto black.
 */
const icon = (size) => `
<html><head><meta charset="utf-8"><style>
  html,body { margin:0; padding:0; }
  body { width:${size}px; height:${size}px; background:${BLUE};
         display:grid; place-items:center;
         font:650 ${Math.round(size * 0.62)}px/1 ${FONT}; color:#fff; }
</style></head><body>B</body></html>`

/**
 * The splash is the app's own background with the same tile on it, so the handover from splash to
 * first paint has nothing to see. Capacitor scales one square image to every screen and crops the
 * overflow, so the mark sits well inside the middle.
 */
const splash = (size) => `
<html><head><meta charset="utf-8"><style>
  html,body { margin:0; padding:0; }
  body { width:${size}px; height:${size}px; background:${DARK};
         display:grid; place-items:center; }
  .tile { width:${Math.round(size * 0.16)}px; height:${Math.round(size * 0.16)}px;
          background:${BLUE}; border-radius:${Math.round(size * 0.028)}px;
          display:grid; place-items:center;
          font:650 ${Math.round(size * 0.1)}px/1 ${FONT}; color:#fff; }
</style></head><body><div class="tile">B</div></body></html>`

const JOBS = [
  { path: `${ASSETS}/AppIcon.appiconset/AppIcon-512@2x.png`, size: 1024, html: icon },
  // Three names, one image. Capacitor's template lists a light, a dark and a default; the game
  // is dark either way, so they are the same picture rather than three near-identical ones.
  { path: `${ASSETS}/Splash.imageset/splash-2732x2732.png`, size: 2732, html: splash },
  { path: `${ASSETS}/Splash.imageset/splash-2732x2732-1.png`, size: 2732, html: splash },
  { path: `${ASSETS}/Splash.imageset/splash-2732x2732-2.png`, size: 2732, html: splash },
]

const browser = await webkit.launch()
for (const job of JOBS) {
  const page = await browser.newPage({
    viewport: { width: job.size, height: job.size },
    deviceScaleFactor: 1,
  })
  await page.setContent(job.html(job.size))
  const png = await page.screenshot({ omitBackground: false })
  writeFileSync(job.path, png)
  console.log(`${job.path}  ${job.size}x${job.size}  ${png.length} bytes`)
  await page.close()
}
await browser.close()
