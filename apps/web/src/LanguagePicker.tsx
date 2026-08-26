import { LOCALES, localeFor } from '@blinkered/i18n'
import { useFocusRelease } from './focus.js'
import type { CatalogueEntry } from './dictionary.js'

/**
 * Flags belong beside the control, not inside its options.
 *
 * A native `select` renders its popup as an operating-system menu, and an emoji in an option
 * drags in a colour emoji font at a size the menu then sizes itself to: sixteen options became
 * an enormous list that on macOS spilled clear out of the browser window. The options are plain
 * text now, and the flag sits next to the closed control where it still does its job of making
 * the picker recognisable before you can read the label.
 *
 * The native control stays, rather than being replaced by a custom listbox. It brings keyboard
 * behaviour, type-ahead and the platform's own picker on a phone, none of which is worth
 * reimplementing for a cosmetic gain.
 */
function flagOf(tag: string): string {
  return localeFor(tag)?.flag ?? ''
}

/** The name a speaker of the language would look for, which is the one to sort by. */
function endonymOf(tag: string, fallback: string): string {
  return localeFor(tag)?.endonym ?? fallback
}

/**
 * Alphabetical by the language's own name for itself.
 *
 * The catalogue arrives sorted by BCP 47 tag, which is an ordering for machines: it put Suomi
 * before Français because `fi` sorts before `fr`, which is unfindable if you are looking for a
 * word rather than a code.
 */
const BY_NAME = new Intl.Collator('en', { sensitivity: 'base' })

interface LanguagePickerProps {
  /** Only the languages this build actually has a word list for. */
  readonly catalogue: readonly CatalogueEntry[]
  readonly value: string
  readonly label: string
  /** True while a game is running: the language it was dealt in cannot change under it. */
  readonly disabled?: boolean
  readonly onChange: (language: string) => void
}

/**
 * Picks the language the board is dealt in.
 *
 * Offers what the deployment has rather than what the engine knows: sixteen alphabets exist,
 * and a language is only playable once a word list has been built for it. The language's own
 * name for itself, because a Greek speaker looking for Greek is looking for Ελληνικά.
 */
export function LanguagePicker({
  catalogue,
  value,
  label,
  disabled = false,
  onChange,
}: LanguagePickerProps): React.JSX.Element {
  const focus = useFocusRelease()
  const ordered = [...catalogue].sort((left, right) =>
    BY_NAME.compare(endonymOf(left.tag, left.endonym), endonymOf(right.tag, right.endonym)),
  )

  return (
    <label className="picker">
      <span className="picker-label">{label}</span>
      <span className="picker-flag" aria-hidden="true">
        {flagOf(value)}
      </span>
      <select
        className="picker-select"
        value={value}
        disabled={disabled}
        {...focus.handlers}
        onChange={(e) => {
          // Hand the keyboard back to the game: a focused select swallows every letter,
          // because typing one jumps to the matching option instead.
          focus.release(e.currentTarget)
          onChange(e.target.value)
        }}
      >
        {ordered.map((entry) => (
          <option key={entry.tag} value={entry.tag}>
            {endonymOf(entry.tag, entry.endonym)}
          </option>
        ))}
      </select>
    </label>
  )
}

interface InterfacePickerProps {
  readonly value: string
  readonly label: string
  /** `row` sits in the nerd panel's two-column grid; `inline` stands on its own. */
  readonly layout?: 'row' | 'inline'
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
  layout = 'row',
  onChange,
}: InterfacePickerProps): React.JSX.Element {
  const focus = useFocusRelease()
  const inline = layout === 'inline'
  const ordered = [...LOCALES].sort((left, right) => BY_NAME.compare(left.endonym, right.endonym))

  return (
    <label className={inline ? 'picker' : 'nerd-row'}>
      <span className={inline ? 'picker-label' : undefined}>{label}</span>
      {/* Only in the inline layout. A nerd-panel row is a two-column flex with the label at one
          end and the control at the other, so a third child would be spread into the middle
          with a gulf on both sides, which is exactly the bug the title bar just had. */}
      {inline ? (
        <span className="picker-flag" aria-hidden="true">
          {flagOf(value)}
        </span>
      ) : null}
      <select
        className={inline ? 'picker-select' : undefined}
        value={value}
        {...focus.handlers}
        onChange={(e) => {
          focus.release(e.currentTarget)
          onChange(e.target.value)
        }}
      >
        {ordered.map((locale) => (
          <option key={locale.tag} value={locale.tag}>
            {locale.endonym}
          </option>
        ))}
      </select>
    </label>
  )
}
