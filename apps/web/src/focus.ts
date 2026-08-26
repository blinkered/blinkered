import { useRef } from 'react'

/**
 * Stops a mouse click from parking focus on a control.
 *
 * Blinkered is played with the keyboard while the mouse is used for the odd button, and a
 * focused button keeps Enter and Space for itself. Without this, clicking "New game" and then
 * pressing Enter to submit a word starts another new game instead, which costs the player the
 * word they had built.
 *
 * Preventing the default on mousedown is what suppresses focus-on-click. Clicking still
 * works, and so does tabbing to the button and pressing Enter, so nothing is taken away from
 * anyone navigating by keyboard.
 */
export function withoutStealingFocus(event: React.MouseEvent): void {
  event.preventDefault()
}

export interface FocusRelease {
  /** Spread onto the control, so it can tell a click from a keystroke. */
  readonly handlers: {
    readonly onPointerDown: () => void
    readonly onKeyDown: () => void
  }
  /** Call from the control's change handler, with the control itself. */
  readonly release: (element: HTMLElement | null) => void
}

/**
 * Hands the keyboard back to the game once a control has been used with the mouse.
 *
 * A checkbox or a `select` keeps focus after a click, and the game's key handler defers every
 * key to a focused form control, so clicking the nerd-mode toggle silently stopped the board
 * from hearing anything. `withoutStealingFocus` cannot fix these two the way it fixes buttons,
 * because both of them need focus to work at all.
 *
 * Only on a pointer, which is the part worth being careful about. Blurring on every change
 * would break keyboard use of a `select`: arrowing through the options fires a change for each
 * one, so a keyboard user would be thrown out of the control on their first press. Somebody who
 * reached the control with the keyboard is left holding it, which is where they want to be.
 */
export function useFocusRelease(): FocusRelease {
  const fromPointer = useRef(false)

  return {
    handlers: {
      onPointerDown: () => {
        fromPointer.current = true
      },
      onKeyDown: () => {
        fromPointer.current = false
      },
    },
    release: (element) => {
      if (fromPointer.current) element?.blur()
      fromPointer.current = false
    },
  }
}
