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
    /*
     * The document scrolls, the same as it does on the web.
     *
     * It was off, on the grounds that nothing in the game scrolls on purpose: the board is fixed
     * and the playing screen fits. Both of those are still true, and neither is the whole app.
     * The game-over panel is the exception it always was -- the score, where it would rank, your
     * best games and every word you found -- and with the WebView's scroll view disabled a long
     * game's panel was clipped at the bottom of the screen with Share, the rest of the word list
     * and the keep-this-game button behind the cut and no way to reach any of them. Nick: "the
     * goal was not to prevent people from seeing the entire game over modal, or interacting with
     * its CTAs."
     *
     * The panel's own stylesheet already assumed this: its action bar is `position: sticky`,
     * which is a bar that pins itself while something scrolls underneath. Nothing was scrolling.
     *
     * What the old setting was really defending is the elastic bounce under a thumb on the
     * playing screen, and `body { overscroll-behavior: none }` in `styles.css` is the answer to
     * that -- put there for exactly this reason, and the browser has the same problem without it.
     */
    scrollEnabled: true,
    /*
     * Still on, and now it has a list to work from.
     *
     * With no `WKAppBoundDomains` in Info.plist this meant the local bundle and nothing else,
     * which is why signed-in features in the shell were unreachable rather than merely broken.
     * The API's hosts are listed there now, so the restriction is a restriction rather than a
     * wall: the WebView can reach the API and nothing else, which is the point of keeping it.
     *
     * Left on rather than removed because the alternative is a WebView that may navigate
     * anywhere, and the game has no reason to. The client-side half of this is `api.ts`, which
     * sends an absolute URL and a bearer token, because a root-relative path resolves into the
     * bundle and the session cookie cannot cross origins.
     */
    limitsNavigationsToAppBoundDomains: true,
  },
}

export default config
