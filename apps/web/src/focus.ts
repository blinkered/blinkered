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
