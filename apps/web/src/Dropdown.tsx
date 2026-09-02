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
}

interface DropdownProps {
  readonly options: readonly Choice[]
  readonly value: string
  readonly label: string
  readonly disabled?: boolean
  readonly onChange: (value: string) => void
}

export function Dropdown({
  options,
  value,
  label,
  disabled = false,
  onChange,
}: DropdownProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const chosen = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const [active, setActive] = useState(chosen)

  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const listId = useId()
  const current = options[chosen]

  const show = (): void => {
    setActive(chosen)
    setOpen(true)
  }

  const hide = (): void => {
    setOpen(false)
    trigger.current?.focus()
  }

  const pick = (index: number): void => {
    const option = options[index]
    setOpen(false)
    // Focus goes back to the trigger and no further: leaving it on a list that no longer
    // exists would drop the player's keyboard on the floor.
    trigger.current?.focus()
    if (option !== undefined && option.value !== value) onChange(option.value)
  }

  // The list takes focus when it opens, so the arrow keys reach it without another Tab.
  useEffect(() => {
    if (open) list.current?.focus()
  }, [open])

  // Anywhere else is a dismissal. Pointer-down rather than click, so it closes on the way
  // down and does not also activate whatever was underneath.
  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target
      if (target instanceof Node && list.current?.contains(target) === true) return
      if (target instanceof Node && trigger.current?.contains(target) === true) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  /** First letter jumps to the next option starting with it, wrapping. */
  const typeAhead = (letter: string): void => {
    const lower = letter.toLowerCase()
    const order = [...options.keys()].map((index) => (active + 1 + index) % options.length)
    const hit = order.find((index) => (options[index]?.label ?? '').toLowerCase().startsWith(lower))
    if (hit !== undefined) setActive(hit)
  }

  const onListKeyDown = (event: React.KeyboardEvent): void => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive((at) => (at + 1) % options.length)
        return
      case 'ArrowUp':
        event.preventDefault()
        setActive((at) => (at - 1 + options.length) % options.length)
        return
      case 'Home':
        event.preventDefault()
        setActive(0)
        return
      case 'End':
        event.preventDefault()
        setActive(options.length - 1)
        return
      case 'Enter':
      case ' ':
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
    if (event.key.length === 1) {
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
          <ul
            ref={list}
            className="drop-list"
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${listId}-label`}
            aria-activedescendant={`${listId}-${String(active)}`}
            onKeyDown={onListKeyDown}
          >
            {options.map((option, index) => (
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
                <span className="drop-value">{option.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
