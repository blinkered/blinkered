import { WILD_GLYPH } from '@blinkered/engine'
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
  onBack,
}: {
  messages: Messages
  language: string
  onLanguage: (language: string) => void
  /** Shown only where the page cannot be closed by closing a tab: the native shell. */
  onBack?: () => void
}): React.JSX.Element {
  const sections = [
    { title: messages.htBoardTitle, body: messages.htBoardBody },
    { title: messages.htWordsTitle, body: messages.htWordsBody },
    { title: messages.htFlipsTitle, body: messages.htFlipsBody },
    { title: messages.htRoundTitle, body: messages.htRoundBody },
    { title: messages.htWildTitle, body: messages.htWildBody },
    { title: messages.htSwapTitle, body: messages.htSwapBody },
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
        <InterfacePicker value={language} label={messages.gameLanguage} onChange={onLanguage} />
      </div>

      {onBack === undefined ? null : (
        <button type="button" className="btn rules-back" onClick={onBack}>
          {messages.backToGame}
        </button>
      )}

      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}

      {/*
       * What separates the four levels, in qualities rather than numbers.
       *
       * A list rather than a paragraph, because this is the first choice anyone makes and four
       * levels run together in prose are four things nobody reads. The names come from
       * `difficultyNames`, which the setup panel already uses, so the page and the chips cannot
       * end up calling the same level two different things.
       *
       * No numbers on purpose. "1.2 seconds a tile" means nothing to somebody who has not played;
       * "the board is barely showing before it goes" means something immediately, and the numbers
       * are all in nerd mode for anyone who wants them.
       */}
      <section>
        <h2>{messages.htLevelsTitle}</h2>
        <dl className="rules-keys rules-levels">
          <dt>{messages.difficultyNames.easy}</dt>
          <dd>{messages.htLevelEasy}</dd>
          <dt>{messages.difficultyNames.medium}</dt>
          <dd>{messages.htLevelMedium}</dd>
          <dt>{messages.difficultyNames.hard}</dt>
          <dd>{messages.htLevelHard}</dd>
          <dt>{messages.difficultyNames.insane}</dt>
          <dd>{messages.htLevelInsane}</dd>
        </dl>
      </section>

      {/* After the levels rather than before: it is a note about the dictionaries, not a rule,
          and it was sitting between the mechanics and the choice they describe. */}
      <section>
        <h2>{messages.htLanguagesTitle}</h2>
        <p>{messages.htLanguagesBody}</p>
      </section>

      {/* Both, always, in this order. The page opens in its own tab and is shareable, so it
          cannot assume the device reading it is the device playing on it: somebody reads the
          rules on a phone and plays on a laptop, and the reverse. */}
      <section>
        <h2>{messages.htTouchTitle}</h2>
        <p>{messages.htTouchBody}</p>
      </section>

      <section>
        <h2>{messages.htKeysTitle}</h2>
        <dl className="rules-keys">
          <dt>
            <kbd>A</kbd> … <kbd>Z</kbd>
          </dt>
          <dd>{messages.lettersSelect}</dd>
          {/* The same A-Z keys, so no new key cap: the card is what they reach for when the board
              is not showing the letter, which is a fact about the board rather than the keyboard
              and belongs next to the keys that do it. */}
          <dt className="wild-row" aria-label={messages.wildCard}>
            <span className="wild-key">{WILD_GLYPH}</span>
          </dt>
          <dd className="wild-row">{messages.keysWild}</dd>
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
