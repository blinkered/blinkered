import { LOCALES, localeFor } from '@blinkered/i18n'
import type { CatalogueEntry } from './dictionary.js'

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
 * and a language is only playable once a word list has been built for it. A flag and the
 * language's own name for itself, because a Greek speaker looking for Greek is looking for
 * Ελληνικά, not for "Greek".
 */
export function LanguagePicker({
  catalogue,
  value,
  label,
  disabled = false,
  onChange,
}: LanguagePickerProps): React.JSX.Element {
  return (
    <label className="picker">
      <span className="picker-label">{label}</span>
      <select
        className="picker-select"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          // Hand the keyboard back to the game: a focused select swallows every letter,
          // because typing one jumps to the matching option instead.
          e.currentTarget.blur()
          onChange(e.target.value)
        }}
      >
        {catalogue.map((entry) => {
          const locale = localeFor(entry.tag)
          return (
            <option key={entry.tag} value={entry.tag}>
              {locale === undefined ? entry.endonym : `${locale.flag}  ${locale.endonym}`}
            </option>
          )
        })}
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
  const inline = layout === 'inline'
  return (
    <label className={inline ? 'picker' : 'nerd-row'}>
      <span className={inline ? 'picker-label' : undefined}>{label}</span>
      <select
        className={inline ? 'picker-select' : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
      >
        {LOCALES.map((locale) => (
          <option key={locale.tag} value={locale.tag}>
            {locale.flag} {locale.endonym}
          </option>
        ))}
      </select>
    </label>
  )
}
