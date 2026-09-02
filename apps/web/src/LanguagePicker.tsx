import { LOCALES, localeFor } from '@blinkered/i18n'
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
 * Offers what the deployment has rather than what the engine knows: more alphabets exist,
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
  const options: Choice[] = catalogue
    .map((entry) => {
      const badge = flagOf(entry.tag)
      const label = endonymOf(entry.tag, entry.endonym)
      // Spread rather than an always-present `badge: undefined`, which
      // exactOptionalPropertyTypes rightly refuses.
      return badge === undefined ? { value: entry.tag, label } : { value: entry.tag, label, badge }
    })
    .sort((left, right) => BY_NAME.compare(left.label, right.label))

  return (
    <Dropdown
      options={options}
      value={value}
      label={label}
      disabled={disabled}
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
  const options: Choice[] = LOCALES.map((locale) => ({
    value: locale.tag,
    label: locale.endonym,
    badge: locale.flag,
  })).sort((left, right) => BY_NAME.compare(left.label, right.label))

  return <Dropdown options={options} value={value} label={label} onChange={onChange} />
}
