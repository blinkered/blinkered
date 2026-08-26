import type { Messages } from '@blinkered/i18n'
import { howToPlayUrl } from './HowToPlay.js'

interface HowToPlayLinkProps {
  readonly language: string
  readonly messages: Messages
  /**
   * Called before the tab opens. During a game this pauses it: reading the rules should not
   * cost flips, and coming back to a board that carried on without you would be worse than not
   * offering the link at all.
   */
  readonly onOpen?: () => void
}

/**
 * The rules, in the interface language, in a new tab.
 *
 * A real link rather than a button, so it can be middle-clicked, bookmarked and shared, and so
 * the browser rather than us decides what "open in a new tab" means.
 */
export function HowToPlayLink({
  language,
  messages,
  onOpen,
}: HowToPlayLinkProps): React.JSX.Element {
  return (
    <a
      className="how-to-play"
      href={howToPlayUrl(language)}
      target="_blank"
      rel="noreferrer"
      onClick={onOpen}
    >
      {messages.howToPlay}
    </a>
  )
}
