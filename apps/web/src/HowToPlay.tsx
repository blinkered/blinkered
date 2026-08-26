import { format, messagesFor } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { InterfacePicker } from './LanguagePicker.js'

/**
 * The rules, on their own page, in whatever language the game is being read in.
 *
 * A separate page rather than an overlay because it opens in a new tab: somebody halfway
 * through a game should be able to read the rules and come back to a board that waited for
 * them, and a dialog covering the board cannot be read next to it.
 *
 * The language arrives in the URL rather than from storage, so the tab is shareable and shows
 * the language the game was in at the moment the link was clicked.
 */
export function HowToPlay({
  messages,
  language,
  onLanguage,
}: {
  messages: Messages
  language: string
  onLanguage: (language: string) => void
}): React.JSX.Element {
  const sections = [
    { title: messages.htBoardTitle, body: messages.htBoardBody },
    { title: messages.htWordsTitle, body: messages.htWordsBody },
    { title: messages.htFlipsTitle, body: messages.htFlipsBody },
    { title: messages.htRoundTitle, body: messages.htRoundBody },
    { title: messages.htLanguagesTitle, body: messages.htLanguagesBody },
  ]

  return (
    <main className="rules">
      <div className="rules-head">
        <div>
          <h1>Blinkered</h1>
          <p className="rules-lead">{messages.howToPlay}</p>
        </div>
        {/* Every locale, whether or not a word list exists for it: reading the rules needs no
            dictionary. Opens on whatever the game was being read in. */}
        <InterfacePicker
          value={language}
          label={messages.gameLanguage}
          layout="inline"
          onChange={onLanguage}
        />
      </div>

      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}

      <section>
        <h2>{messages.htKeysTitle}</h2>
        <dl className="rules-keys">
          <dt>
            <kbd>A</kbd> … <kbd>Z</kbd>
          </dt>
          <dd>{messages.lettersSelect}</dd>
          <dt>
            <kbd>shift-X</kbd>
          </dt>
          <dd>{format(messages.clearsEvery, { letter: 'X' })}</dd>
          <dt>
            <kbd>&#x232b;</kbd>
          </dt>
          <dd>{messages.undoLastLetter}</dd>
          <dt>
            <kbd>enter</kbd>
          </dt>
          <dd>{messages.completeWord}</dd>
          <dt>
            <kbd>esc</kbd>
          </dt>
          <dd>{messages.reset}</dd>
        </dl>
      </section>
    </main>
  )
}

/** The interface language for this tab, from `?lang=`, falling back to English. */
export function languageFromUrl(search: string): string {
  return new URLSearchParams(search).get('lang') ?? 'en'
}

export function messagesFromUrl(search: string): Messages {
  return messagesFor(languageFromUrl(search))
}

/** Where the link points. One place, so the game and the page cannot disagree about it. */
export function howToPlayUrl(language: string): string {
  return `${import.meta.env.BASE_URL}how-to-play.html?lang=${encodeURIComponent(language)}`
}
