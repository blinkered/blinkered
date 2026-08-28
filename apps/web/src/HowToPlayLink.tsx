import type { Messages } from '@blinkered/i18n'
import { howToPlayUrl } from './HowToPlay.js'
import { Icon } from './Icon.js'
import { isNativeApp } from './platform.js'

interface HowToPlayLinkProps {
  readonly language: string
  readonly messages: Messages
  /**
   * Called before the tab opens. During a game this pauses it: reading the rules should not
   * cost flips, and coming back to a board that carried on without you would be worse than not
   * offering the link at all.
   */
  readonly onOpen?: () => void
  /**
   * Where the rules go in the native shell, which has no second tab to put them in. Given, the
   * link becomes a button that calls this; omitted, it stays a link even in the shell, which is
   * what the setup screen wants: there is no game to lose there.
   */
  readonly onShowInApp?: () => void
}

/**
 * The rules, in the interface language, in a new tab.
 *
 * A real link rather than a button, so it can be middle-clicked, bookmarked and shared, and so
 * the browser rather than us decides what "open in a new tab" means.
 *
 * Except in the native shell, where there is no second tab and a WebView drops `target="_blank"`
 * on a local URL silently: the link would simply do nothing. Navigating in place is not the
 * answer either, because it would load the rules over a running game and lose it. So there the
 * same words become a button and the rules are shown in-app.
 */
export function HowToPlayLink({
  language,
  messages,
  onOpen,
  onShowInApp,
}: HowToPlayLinkProps): React.JSX.Element {
  if (onShowInApp !== undefined && isNativeApp()) {
    return (
      <button
        type="button"
        className="how-to-play how-to-play-button"
        title={messages.howToPlay}
        aria-label={messages.howToPlay}
        onClick={() => {
          onOpen?.()
          onShowInApp()
        }}
      >
        <Icon name="help" />
        <span className="btn-text">{messages.howToPlay}</span>
      </button>
    )
  }
  return (
    <a
      className="how-to-play"
      href={howToPlayUrl(language)}
      target="_blank"
      rel="noreferrer"
      title={messages.howToPlay}
      aria-label={messages.howToPlay}
      onClick={onOpen}
    >
      <Icon name="help" />
      <span className="btn-text">{messages.howToPlay}</span>
    </a>
  )
}
