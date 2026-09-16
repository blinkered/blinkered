import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The native shell. It owns no game code: `webDir` points at `apps/web`'s build output, so the
 * app is the same bundle the site serves, wrapped in a WebView.
 *
 * That includes the fifty-one word lists, which Vite emits into `dist/words/`. In the browser they
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
    // **This is now a blocker rather than a safe default, and it is left on deliberately so
    // that it stays visible.** It was written when the game had no accounts and the WebView
    // genuinely never needed the network. Accounts shipped, and the client calls the API with
    // root-relative paths (`fetch('/v1/me')`) and a same-origin session cookie. Inside the
    // WebView the origin is `capacitor://localhost`, so those calls resolve to the bundle and
    // there is nothing to answer them; Google and Apple sign-in are also navigations off-origin.
    // Turning this off alone does not fix it. See docs/IOS.md.
    limitsNavigationsToAppBoundDomains: true,
  },
}

export default config
