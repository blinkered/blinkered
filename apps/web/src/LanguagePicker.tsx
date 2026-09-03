import { LOCALES, localeFor, messagesFor } from '@blinkered/i18n'
import { Dropdown } from './Dropdown.js'
import type { Choice } from './Dropdown.js'
import type { CatalogueEntry } from './dictionary.js'

/** The flag rides along as a badge, which the dropdown draws itself rather than as menu text. */
function flagOf(tag: string): string | undefined {
  return localeFor(tag)?.flag
}

/** The name a speaker of the language would look for, which is the one to sort by. */
function endonymOf(tag: string, fallback: string): string {
  return localeFor(tag)?.endonym ?? fallback
}

interface Naming {
  /** What the list is ordered by, which every language must have one of. */
  readonly key: string
  /**
   * What to draw under the endonym, which not every language has.
   *
   * Only ICU's own name for *this* language, never the one it is filed under. The two were the
   * same string until the second line existed, and drawing it showed why they must not be:
   * Egyptian Arabic sorts under Arabic, so a shared key put `Arabic` beneath both العربية and
   * مصرى, labelling one language as another. Where ICU has no name, the endonym on the first
   * line is the only name there is, and a second line repeating it is worse than none.
   */
  readonly note?: string
}

/**
 * Alphabetical by what the reader calls each language, which is not what each language calls
 * itself.
 *
 * Two orderings have been wrong here. The catalogue arrives sorted by BCP 47 tag, which is an
 * ordering for machines: it put Suomi before Français because `fi` sorts before `fr`. That was
 * replaced by sorting the endonyms, which is worse than it sounds, because collating across
 * scripts does not interleave them — it ranks them. Sorting Ελληνικά, Русский, עברית and
 * العربية against Latin names puts every one of them after every Latin one, in the order their
 * Unicode blocks happen to fall, and a list of twenty-six languages ended with a tail of six
 * that looked like the order they were added in.
 *
 * So the key is `Intl.DisplayNames`: the reader's own name for the language, in the language
 * the interface is in. An English reader gets Japanese between Italian and Korean, a Japanese
 * reader gets 日本語 among the 語s, and each of them finds their language where they would look
 * for it. The label stays the endonym, because a speaker looking for Greek is looking for
 * Ελληνικά, and the flag is what makes the row scannable either way.
 */
function namings(tags: readonly string[], readIn: string): Map<string, Naming> {
  const names = new Intl.DisplayNames([readIn], { type: 'language', fallback: 'none' })
  const found = new Map<string, Naming>()
  for (const tag of tags) {
    const locale = localeFor(tag)
    // Ours first, where we have one, and ICU's otherwise — that order round on purpose. CLDR
    // has only lately learned to name Nigerian Pidgin and Egyptian Arabic: Chrome 123 names
    // neither in any locale and Node 26 names both, so leaving it to the runtime would sort the
    // list one way on one browser and another way on the next, and a sorted list whose order
    // depends on a browser update is the thing this whole function exists to stop.
    const own = locale?.namedIn?.[readIn] ?? names.of(tag)
    // Neither, which now means a language nobody has written a name for. The locale can say
    // which one to file it under, and the endonym is the last resort.
    const under = locale?.sortsWith
    const filed = own ?? (under === undefined ? undefined : names.of(under))
    const key = filed ?? locale?.endonym ?? tag
    found.set(tag, own === undefined ? { key } : { key, note: own })
  }
  return found
}

/** Compares in the reader's own collation, so the list is sorted the way they would sort it. */
function byName(readIn: string): Intl.Collator {
  return new Intl.Collator(readIn, { sensitivity: 'base' })
}

interface LanguagePickerProps {
  /** Only the languages this build actually has a word list for. */
  readonly catalogue: readonly CatalogueEntry[]
  readonly value: string
  /** The interface language, which is what the list is named and ordered in. */
  readonly readIn: string
  readonly label: string
  /** True while a game is running: the language it was dealt in cannot change under it. */
  readonly disabled?: boolean
  readonly onChange: (language: string) => void
}

/**
 * Picks the language the board is dealt in.
 *
 * Offers what the deployment has rather than what the engine knows: more alphabets exist,
 * and a language is only playable once a word list has been built for it. The language's own
 * name for itself, because a Greek speaker looking for Greek is looking for Ελληνικά.
 */
export function LanguagePicker({
  catalogue,
  value,
  readIn,
  label,
  disabled = false,
  onChange,
}: LanguagePickerProps): React.JSX.Element {
  const named = namings(
    catalogue.map((entry) => entry.tag),
    readIn,
  )
  const collator = byName(readIn)
  const messages = messagesFor(readIn)
  const options: Choice[] = catalogue
    .map((entry) => {
      const badge = flagOf(entry.tag)
      const label = endonymOf(entry.tag, entry.endonym)
      const note = named.get(entry.tag)?.note
      // Spread rather than an always-present `badge: undefined`, which
      // exactOptionalPropertyTypes rightly refuses.
      const row =
        note === undefined ? { value: entry.tag, label } : { value: entry.tag, label, note }
      return badge === undefined ? row : { ...row, badge }
    })
    .sort((left, right) =>
      collator.compare(
        named.get(left.value)?.key ?? left.label,
        named.get(right.value)?.key ?? right.label,
      ),
    )

  return (
    <Dropdown
      options={options}
      value={value}
      label={label}
      disabled={disabled}
      filter={messages.filterLanguages}
      empty={messages.noMatches}
      onChange={onChange}
    />
  )
}

interface InterfacePickerProps {
  readonly value: string
  readonly label: string
  readonly onChange: (language: string) => void
}

/**
 * Picks the language the interface is written in, which is a separate question.
 *
 * Every locale is offered here whether or not its word list exists, because reading the
 * interface in a language needs no dictionary. Lives in nerd mode: choosing a language sets
 * both, and only somebody who wants them to differ needs to find this.
 */
export function InterfacePicker({
  value,
  label,
  onChange,
}: InterfacePickerProps): React.JSX.Element {
  // Sorted in whatever the interface is currently set to, which is this picker's own value:
  // changing it re-sorts the list, which is right, because the names have changed.
  const named = namings(
    LOCALES.map((locale) => locale.tag),
    value,
  )
  const collator = byName(value)
  const messages = messagesFor(value)
  const options: Choice[] = LOCALES.map((locale) => {
    const note = named.get(locale.tag)?.note
    const row = { value: locale.tag, label: locale.endonym, badge: locale.flag }
    return note === undefined ? row : { ...row, note }
  }).sort((left, right) =>
    collator.compare(
      named.get(left.value)?.key ?? left.label,
      named.get(right.value)?.key ?? right.label,
    ),
  )

  return (
    <Dropdown
      options={options}
      value={value}
      label={label}
      filter={messages.filterLanguages}
      empty={messages.noMatches}
      onChange={onChange}
    />
  )
}
