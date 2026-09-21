import { WILD_GLYPH, alphabetFor } from '@blinkered/engine'
import { PLAYABLE, format, messagesFor } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { InterfacePicker } from './LanguagePicker.js'
import { PageHead } from './PageHead.js'

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
/**
 * The first and last letters of a language's own alphabet, for the "letters select" row.
 *
 * It used to say `A … Z` everywhere, which is a sentence about the Latin alphabet rather than
 * about the keyboard: a Greek reader was shown two letters their board never deals, and a
 * Russian reader two that are not letters at all.
 *
 * The page's own language, the one picked at the top of it. The settings can hold a different
 * interface and game language, but only through nerd mode, and this page has no business
 * knowing about that: it is one document and it is in one language throughout.
 *
 * Sorted with the language's own collation rather than taken in source order, which matters in
 * more than the obvious places. Swedish and Finnish both hold Z in the middle and end on Ö;
 * Norwegian ends on Å. Source order would have said Z for all three and been wrong three times
 * while looking right.
 */
function alphabetEnds(language: string): { first: string; last: string } {
  const alphabet = alphabetFor(language)
  // Arabic says its own, sorting having no way to know that ء is not one of the twenty-eight.
  if (alphabet.recited !== undefined) {
    const [first, last] = alphabet.recited
    return { first, last }
  }
  // The collator in an arrow rather than passed by reference: `compare` is bound per spec, but
  // handing a method around unbound is a habit worth not having, and the lint says so.
  const collator = new Intl.Collator(language)
  const letters = Object.keys(alphabet.weights)
    // A modifier letter is a tile and not a letter of the alphabet, and Unicode is the one
    // saying so rather than a list here. Japanese ー is the only one in any alphabet: it is a
    // key you press and it lengthens the vowel before it, so the row read ー … ん, which is not
    // how anybody describes the kana.
    .filter((letter) => !/^\p{Lm}+$/u.test(letter))
    .sort((a, b) => collator.compare(a, b))
  return { first: letters[0] ?? 'A', last: letters[letters.length - 1] ?? 'Z' }
}

export function HowToPlay({
  messages,
  language,
  onLanguage,
  onBack,
  onAbout,
}: {
  messages: Messages
  language: string
  onLanguage: (language: string) => void
  /** Shown only where the page cannot be closed by closing a tab: the native shell. */
  onBack?: () => void
  /**
   * Opens the about page in the app rather than as a navigation.
   *
   * Given in the app, where `/about` as a link would reload the whole bundle and take a running
   * game with it. Omitted on the standalone document, which has no app to keep and where an
   * ordinary link is the better thing anyway -- it can be middle-clicked and copied.
   */
  onAbout?: () => void
}): React.JSX.Element {
  const ends = alphabetEnds(language)
  const sections = [
    { title: messages.htBoardTitle, body: messages.htBoardBody },
    { title: messages.htWordsTitle, body: messages.htWordsBody },
    { title: messages.htFlipsTitle, body: messages.htFlipsBody },
    { title: messages.htRoundTitle, body: messages.htRoundBody },
    { title: messages.htWildTitle, body: messages.htWildBody },
    // Hiding before swapping: one takes a letter away inside a round, the other changes one
    // between rounds, and read in that order the second is the smaller surprise.
    { title: messages.htHideTitle, body: messages.htHideBody },
    { title: messages.htSwapTitle, body: messages.htSwapBody },
  ]

  return (
    <main className="rules">
      {/*
       * The same head as every other page. It used to spell the name as plain text and keep the
       * way back in a button of its own below the heading, which is how five pages ended up with
       * five different nav bars.
       *
       * No `onHome` when there is nothing to go back to: this file is also a standalone document
       * at `how-to-play.html`, opened in its own tab from the game, and there the mark is a link
       * to the game rather than a button that closes a page over it.
       */}
      <PageHead back={messages.backToGame} {...(onBack === undefined ? {} : { onHome: onBack })}>
        {/* Every locale, whether or not a word list exists for it: reading the rules needs no
            dictionary. Opens on whatever the game was being read in. */}
        <InterfacePicker value={language} label={messages.gameLanguage} onChange={onLanguage} />
      </PageHead>

      <h1 className="page-title">{messages.howToPlay}</h1>

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
        {/* Counted rather than written out. It said "Sixteen" in sixteen files, which was a
            number that goes stale in fifteen places the moment a language is added.

            The playable count, not the translated one. The sentence it fills is about boards
            being solvable from words people use, which is a claim about dictionaries: saying
            fifty-one here while seven have a word list would be counting the translations and
            describing the boards. The interface picker still offers all fifty-one, and says so
            where that is what it means. */}
        <p>{format(messages.htLanguagesBody, { n: PLAYABLE.length })}</p>
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
            <kbd>{ends.first}</kbd> … <kbd>{ends.last}</kbd>
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

      {/*
        Who made this, at the foot of the page somebody reads when they want to know more.
        
        A button in the app and a link on the standalone document, which is the same split
        `HowToPlayLink` makes in the other direction and for the same reason: a WebView has one
        page and a navigation would cost a game.
      */}
      <p className="rules-about">
        {onAbout === undefined ? (
          <a href="/about">{messages.about}</a>
        ) : (
          <button
            type="button"
            className="rules-about-button"
            onClick={() => {
              onAbout()
            }}
          >
            {messages.about}
          </button>
        )}
      </p>
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
