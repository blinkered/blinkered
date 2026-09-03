import { useEffect, useId, useRef, useState } from 'react'
import { withoutStealingFocus } from './focus.js'

/**
 * A menu the page draws itself.
 *
 * A native `select` would be the right answer, and was the first one. Chrome on macOS draws its
 * popup as an operating-system menu: system font size whatever the CSS says, sized to the
 * longest option, and in a window that is not clipped to the browser, so the language list
 * opened as an enormous list hanging off the side of the window and over the desktop. None of
 * that is reachable from a stylesheet.
 *
 * So this reimplements what the native control gave us for free, and the list is what has to be
 * earned back: `role="listbox"`, arrow keys, Home and End, type-ahead on first letter, Escape
 * to abandon, click-outside to close, and focus returning to the trigger. A listbox also owns
 * every key while it is open, which the game's key handler is told about by role rather than by
 * this component reaching into it.
 */
export interface Choice {
  readonly value: string
  readonly label: string
  /** Shown before the label. Decorative: the label carries the meaning. */
  readonly badge?: string
  /**
   * A second line under the label, and the string the caller sorted by.
   *
   * The language list is ordered by what the *reader* calls each language while showing what
   * each language calls itself, so for one row the sort key and the label are different
   * strings — and for two years the key was the invisible one. An English reader saw Ελληνικά
   * between Deutsch and עברית for an excellent reason they could not see. Showing the key is
   * the whole fix.
   */
  readonly note?: string
}

interface DropdownProps {
  readonly options: readonly Choice[]
  readonly value: string
  readonly label: string
  readonly disabled?: boolean
  /**
   * Placeholder for a box that narrows the list, and the switch that puts one there.
   *
   * Absent for the short lists — difficulty has four options and a search box over four options
   * is furniture. Present for the languages, where no sort order makes fifty rows scannable.
   */
  readonly filter?: string
  /** Shown when the filter matches nothing. Required with `filter`, unused without it. */
  readonly empty?: string
  readonly onChange: (value: string) => void
}

/**
 * Case- and accent-blind, because a reader searching for a language should not have to
 * reproduce its diacritics: `espanol` finds Español and `turkce` finds Türkçe.
 */
function loosely(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Whether a choice answers to what was typed.
 *
 * Every handle a reader might have for a language: what it calls itself, what they call it,
 * and its tag. `greek`, `Ελληνικά` and `el` all reach the same row.
 */
function matches(option: Choice, needle: string): boolean {
  const hay = [option.label, option.note ?? '', option.value].map(loosely)
  return hay.some((text) => text.includes(needle))
}

export function Dropdown({
  options,
  value,
  label,
  disabled = false,
  filter,
  empty,
  onChange,
}: DropdownProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const chosen = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const [active, setActive] = useState(chosen)

  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const listId = useId()
  const current = options[chosen]

  // What the list is showing right now, which is what every index below counts against.
  const needle = loosely(query.trim())
  const shown = needle === '' ? options : options.filter((option) => matches(option, needle))

  const show = (): void => {
    setQuery('')
    setActive(chosen)
    setOpen(true)
  }

  const hide = (): void => {
    setOpen(false)
    trigger.current?.focus()
  }

  const pick = (index: number): void => {
    const option = shown[index]
    setOpen(false)
    // Focus goes back to the trigger and no further: leaving it on a list that no longer
    // exists would drop the player's keyboard on the floor.
    trigger.current?.focus()
    if (option !== undefined && option.value !== value) onChange(option.value)
  }

  const retype = (text: string): void => {
    setQuery(text)
    // The old highlight indexed a list that no longer exists, so it starts again at the top.
    setActive(0)
  }

  // Focus goes where the typing should: the search box when there is one, the list otherwise.
  // Either way the arrow keys reach the options without another Tab.
  useEffect(() => {
    if (!open) return
    if (filter === undefined) list.current?.focus()
    else search.current?.focus()
  }, [open, filter])

  // Anywhere else is a dismissal. Pointer-down rather than click, so it closes on the way
  // down and does not also activate whatever was underneath.
  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target
      if (target instanceof Node && list.current?.contains(target) === true) return
      if (target instanceof Node && trigger.current?.contains(target) === true) return
      // The search box sits outside the list, so clicking into it is not a dismissal.
      if (target instanceof Node && search.current?.contains(target) === true) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  /**
   * First letter jumps to the next option starting with it, wrapping.
   *
   * Only where there is no search box. With one, every keystroke belongs to the box, and a
   * type-ahead that also moved the highlight would fight it.
   */
  const typeAhead = (letter: string): void => {
    const lower = letter.toLowerCase()
    const order = [...shown.keys()].map((index) => (active + 1 + index) % shown.length)
    const hit = order.find((index) => (shown[index]?.label ?? '').toLowerCase().startsWith(lower))
    if (hit !== undefined) setActive(hit)
  }

  const onListKeyDown = (event: React.KeyboardEvent): void => {
    // Nothing matched, so there is nothing to move through or choose. Escape still works,
    // which is the only way out that matters.
    if (shown.length === 0 && event.key !== 'Escape' && event.key !== 'Tab') return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive((at) => (at + 1) % shown.length)
        return
      case 'ArrowUp':
        event.preventDefault()
        setActive((at) => (at - 1 + shown.length) % shown.length)
        return
      case 'Home':
        event.preventDefault()
        setActive(0)
        return
      case 'End':
        event.preventDefault()
        setActive(shown.length - 1)
        return
      case 'Enter':
        event.preventDefault()
        pick(active)
        return
      // A space chooses the highlighted option in a plain list, and is a character somebody is
      // typing when there is a search box. `Bahasa Melayu` has one in the middle of it.
      case ' ':
        if (filter !== undefined) return
        event.preventDefault()
        pick(active)
        return
      case 'Escape':
      case 'Tab':
        event.preventDefault()
        hide()
        return
      default:
        break
    }
    if (filter === undefined && event.key.length === 1) {
      event.preventDefault()
      typeAhead(event.key)
    }
  }

  const onTriggerKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      show()
    }
  }

  return (
    <div className="drop">
      <span className="picker-label" id={`${listId}-label`}>
        {label}
      </span>
      <div className="drop-anchor">
        <button
          ref={trigger}
          type="button"
          className="drop-trigger"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${listId}-label`}
          onKeyDown={onTriggerKeyDown}
          onClick={() => {
            if (open) setOpen(false)
            else show()
          }}
        >
          {current?.badge === undefined ? null : (
            <span className="drop-badge" aria-hidden="true">
              {current.badge}
            </span>
          )}
          <span className="drop-value">{current?.label ?? value}</span>
          <span className="drop-caret" aria-hidden="true">
            ▾
          </span>
        </button>

        {open ? (
          <div className="drop-popup">
            {filter === undefined ? null : (
              <input
                ref={search}
                type="text"
                className="drop-search"
                placeholder={filter}
                value={query}
                role="combobox"
                aria-expanded={true}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  shown.length === 0 ? undefined : `${listId}-${String(active)}`
                }
                onKeyDown={onListKeyDown}
                onChange={(event) => {
                  retype(event.target.value)
                }}
              />
            )}
            <ul
              ref={list}
              id={listId}
              className="drop-list"
              role="listbox"
              tabIndex={-1}
              aria-labelledby={`${listId}-label`}
              aria-activedescendant={
                filter === undefined && shown.length > 0 ? `${listId}-${String(active)}` : undefined
              }
              onKeyDown={onListKeyDown}
            >
              {shown.length === 0 ? <li className="drop-empty">{empty}</li> : null}
              {shown.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listId}-${String(index)}`}
                  role="option"
                  aria-selected={option.value === value}
                  className={`drop-option${index === active ? ' is-active' : ''}${
                    option.value === value ? ' is-chosen' : ''
                  }`}
                  onMouseDown={withoutStealingFocus}
                  onMouseEnter={() => {
                    setActive(index)
                  }}
                  onClick={() => {
                    pick(index)
                  }}
                >
                  {option.badge === undefined ? null : (
                    <span className="drop-badge" aria-hidden="true">
                      {option.badge}
                    </span>
                  )}
                  <span className="drop-names">
                    <span className="drop-value">{option.label}</span>
                    {option.note === undefined || option.note === option.label ? null : (
                      <span className="drop-note">{option.note}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
