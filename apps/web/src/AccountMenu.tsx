import { useEffect, useRef, useState } from 'react'
import { Avatar } from './Avatar.js'
import type { Account } from './account.js'

/**
 * The one account control that is on screen at all times.
 *
 * Signed out it is a Sign in button; signed in it is the generated avatar, and clicking it opens
 * the destinations. That pair is the shape every site on the web uses, which is the argument for
 * it: this is not the place to be interesting, it is the place to be findable.
 *
 * Pinned to the end of the title bar, which the nerd-mode toggle deliberately is not — the
 * comment in styles.css explains why that one sits in the group at the start, and the reasoning
 * does not carry over. It was that a right-pinned toggle read as chrome belonging to the sidebar
 * it opens. An account menu at the end of a title bar reads as an account menu, because that is
 * where every reader has been trained to look for one.
 *
 * English, like the dialog it opens, and for the same reason: see the note in `SignInDialog`.
 */

export type Destination = 'profile' | 'games'

const ITEMS = [
  { id: 'profile', label: 'My profile' },
  { id: 'games', label: 'My games' },
] as const

export function AccountMenu({
  account,
  onSignIn,
  onGo,
  onSignOut,
}: {
  readonly account: Account | null
  readonly onSignIn: () => void
  readonly onGo: (destination: Destination) => void
  readonly onSignOut: () => void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  /*
   * Closing, by the three routes a menu has to answer to.
   *
   * Escape returns focus to the trigger, because a menu that closes and drops the keyboard
   * somewhere else strands whoever opened it without a mouse. A pointer anywhere outside closes
   * without moving focus, since the person is already looking somewhere else.
   */
  useEffect(() => {
    if (!open) return undefined
    const onKey = (press: KeyboardEvent): void => {
      if (press.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    const onDown = (event: MouseEvent): void => {
      const target = event.target as Node
      if (menu.current?.contains(target) === true) return
      if (trigger.current?.contains(target) === true) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  if (account === null) {
    return (
      <button type="button" className="btn account-cta" onClick={onSignIn} lang="en">
        Sign in
      </button>
    )
  }

  const close = (): void => {
    setOpen(false)
  }

  return (
    <div className="account">
      <button
        type="button"
        ref={trigger}
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        // The name, not "account menu". A screen reader saying "clever-beacon-1267, menu button"
        // answers the question the picture answers for everybody else: whose account is this.
        aria-label={account.username}
        title={account.username}
        onClick={() => {
          setOpen(!open)
        }}
      >
        <Avatar seed={account.avatarSeed} size={28} />
      </button>

      {open ? (
        <div className="account-menu" role="menu" ref={menu}>
          <p className="account-who" lang="en">
            Signed in as
            <strong>{account.username}</strong>
          </p>
          {ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="account-item"
              lang="en"
              onClick={() => {
                close()
                onGo(item.id)
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className="account-item"
            lang="en"
            onClick={() => {
              close()
              onSignOut()
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
