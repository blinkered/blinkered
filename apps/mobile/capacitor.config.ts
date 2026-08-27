import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The native shell. It owns no game code: `webDir` points at `apps/web`'s build output, so the
 * app is the same bundle the site serves, wrapped in a WebView.
 *
 * That includes the sixteen word lists, which Vite emits into `dist/words/`. In the browser they
 * are fetched from the server on demand; here they are inside the app, so a game works with the
 * phone in aeroplane mode and no request leaves the device. It also means the binary carries all
 * of them, which is the main thing to know before this goes anywhere near a store.
 */
const config: CapacitorConfig = {
  appId: 'com.tightlinesoftware.blinkered',
  appName: 'Blinkered',
  webDir: '../web/dist',
  ios: {
    // The game is dark and draws its own background; without this the WebView flashes white
    // between the splash screen and the first paint.
    backgroundColor: '#0e1116',
    // Nothing in the game scrolls the document on purpose. The board is fixed and the page
    // fits, so the elastic bounce is only ever an accident of a stray drag across a tile.
    scrollEnabled: false,
    // No remote code, so the WebView never needs to reach the network. Anything that does
    // want the network later (accounts, phase 4) has to say so deliberately.
    limitsNavigationsToAppBoundDomains: true,
  },
}

export default config
