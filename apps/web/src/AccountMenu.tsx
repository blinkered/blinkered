import type { Messages } from '@blinkered/i18n'
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
 * Translated, like the dialog it opens. The one item that is not is **Moderation**, which is
 * drawn only for an admin and opens a panel that is English on purpose; `AdminScreen` records why.
 */

export type Destination = 'profile' | 'games'

/** The two panels the menu opens. Labels come from the catalogue, by the same key names. */
const ITEMS = [{ id: 'profile' }, { id: 'games' }] as const

export function AccountMenu({
  account,
  messages,
  offline,
  onSignIn,
  onGo,
  onPublicProfile,
  onModerate,
  onSignOut,
}: {
  readonly account: Account | null
  readonly messages: Messages
  /**
   * Whether the last attempt to reach the API went unanswered.
   *
   * Shown here because this is where somebody looks to find out who they are, and the answer
   * "you, but we cannot check" belongs next to the answer "you". It marks the state rather than
   * disabling anything: the menu's items all still work, and the ones that need the network fail
   * with `serverBusy`, which already says so in every language.
   */
  readonly offline: boolean
  readonly onSignIn: () => void
  readonly onGo: (destination: Destination) => void
  /** Opens the page everybody else sees, which is the only way to check what it says. */
  readonly onPublicProfile: (username: string) => void
  /** Opens the admin panel. Only ever called from the item that appears for an admin. */
  readonly onModerate: () => void
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
      <button type="button" className="btn account-cta" onClick={onSignIn}>
        {messages.signIn}
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
        /*
         * The name, not "account menu". A screen reader saying "clever-beacon-1267, menu button"
         * answers the question the picture answers for everybody else: whose account is this.
         *
         * Offline, the state joins it, because the dot below is the only other thing that says
         * so and a dot says nothing out loud. Parenthesised so it reads as a state rather than
         * as part of somebody's name.
         */
        aria-label={offline ? `${account.username} (${messages.offline})` : account.username}
        title={offline ? `${account.username} (${messages.offline})` : account.username}
        onClick={() => {
          setOpen(!open)
        }}
      >
        <Avatar seed={account.avatarSeed} size={28} />
        {/*
          A dot on the avatar, and nothing for a screen reader to read: the same fact is already
          in the button's label above, and saying it twice is how a control starts announcing
          itself as "Nick offline offline, menu button".
        */}
        {offline ? <span className="account-offline" aria-hidden="true" /> : null}
      </button>

      {open ? (
        <div className="account-menu" role="menu" ref={menu}>
          <p className="account-who">
            {messages.menuSignedInAs}
            <strong>{account.username}</strong>
          </p>
          {ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="account-item"
              onClick={() => {
                close()
                onGo(item.id)
              }}
            >
              {item.id === 'profile' ? messages.menuProfile : messages.menuGames}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className="account-item"
            onClick={() => {
              close()
              onPublicProfile(account.username)
            }}
          >
            {messages.menuPublicPage}
          </button>
          {/*
            Moderation, for the accounts that can.
            
            Shown from `Profile.isAdmin`, which decides only what is drawn: every route under
            `/v1/admin` reads the column itself, so a browser that lies about this gets a menu
            item and a 403 behind it.
            
            Untranslated, alone in a translated menu, which is the visible edge of the decision
            recorded in `AdminScreen`: the panel it opens is English because its audience is us.
            An English item above a translated one looks like a mistake to anybody else, and
            nobody else ever sees it.
          */}
          {account.isAdmin ? (
            <button
              type="button"
              role="menuitem"
              className="account-item"
              onClick={() => {
                close()
                onModerate()
              }}
            >
              Moderation
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="account-item"
            onClick={() => {
              close()
              onSignOut()
            }}
          >
            {messages.signOut}
          </button>
        </div>
      ) : null}
    </div>
  )
}
