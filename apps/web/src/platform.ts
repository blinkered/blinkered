/**
 * Whether the game is running inside the native shell rather than in a browser.
 *
 * Read from the global Capacitor injects rather than by importing `@capacitor/core`, so that
 * `apps/web` keeps no dependency on Capacitor at all. The shell consumes this build; this build
 * knows nothing about the shell beyond the one bit it has to.
 *
 * That bit is needed because a WebView is not a browser in one specific way that matters: it has
 * no tabs. On the web the rules open in a second tab and the game sits untouched in the first,
 * which is the whole reason they are a separate page. In a WebView `target="_blank"` on a local
 * URL is dropped without a word, and navigating in place would load the rules over the top of a
 * running game and lose it. So the shell shows the rules in-app instead.
 */
interface CapacitorGlobal {
  readonly isNativePlatform?: () => boolean
}

export function isNativeApp(): boolean {
  const capacitor = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor
  // Optional at every step: the global is absent in a browser, and a future Capacitor could
  // rename the method. Guessing wrong has to mean "treat it as the web", which still works.
  return capacitor?.isNativePlatform?.() === true
}
