import type { Messages } from '@blinkered/i18n'
import { useEffect, useRef, useState } from 'react'
import { requestCode, submitCode, whoAmI } from './account.js'
import { ignoredByManagers } from './autofill.js'
import type { Account, SignInResult } from './account.js'
import { ssoAvailable, startUrl } from './sso.js'

/**
 * Signing in, as a dialog reached from somewhere that explains why.
 *
 * The first version of this was a bare email box on the setup screen, and every mechanism in it
 * worked while none of it was usable: a form with no heading, sitting under a game nobody had
 * played yet, asking for an address for no stated reason. docs/ACCOUNTS.md records that as a
 * false start. What replaced it is this — one dialog, opened from the title bar or from the
 * game-over panel, which says what an account is for before it asks for anything.
 *
 * Drawn **over** whatever opened it and never in place of it. That is not decoration: React
 * unmounts what it replaces, so a dialog that took over the game-over panel would take the game
 * with it, and a sign-up that failed halfway would have cost the player the result it existed to
 * preserve.
 *
 * Its strings were English while the flow was being built, for the reason docs/ACCOUNTS.md gave:
 * `Messages` requires every key in all fifty-one locales at once, so they could not be added a
 * little at a time, and translating a flow nobody had walked through is translating a guess.
 * That pass has since happened and they come from the catalogue like everything else.
 */

/**
 * Where the flow got to, kept across a reload.
 *
 * Asking for a code invalidates the last one, so a dialog that forgets it has already sent one
 * costs whoever reloads the page the code sitting in their inbox: the only way back to the
 * second step was to press the button again, which issues another and kills the first. Session
 * storage rather than local: this is one sign-in attempt in one tab, not a preference.
 *
 * Ten minutes, matching the code's own life, so a tab left open overnight does not offer to
 * enter a code that expired long ago.
 */
const RESUME_KEY = 'blinkered.signin'
const RESUME_MS = 10 * 60 * 1000

function remembered(): { email: string } | null {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as { email?: unknown; at?: unknown }
    if (typeof parsed.email !== 'string' || typeof parsed.at !== 'number') return null
    if (Date.now() - parsed.at > RESUME_MS) return null
    return { email: parsed.email }
  } catch {
    // Private browsing, or storage the browser refuses. Starting over is a worse experience
    // than resuming and a much better one than a sign-in dialog that will not render.
    return null
  }
}

function remember(email: string): void {
  try {
    sessionStorage.setItem(RESUME_KEY, JSON.stringify({ email, at: Date.now() }))
  } catch {
    /* Nothing to do: the flow still works, it just will not survive a reload. */
  }
}

function forget(): void {
  try {
    sessionStorage.removeItem(RESUME_KEY)
  } catch {
    /* As above. */
  }
}

/**
 * The two buttons above the email form. Both leave the page for a server route.
 *
 * Apple first, deliberately. It is the one iOS requires under App Store guideline 4.8 once any
 * other third-party sign-in exists, and putting the required one first costs nothing.
 */
const PROVIDERS = [{ id: 'apple' }, { id: 'google' }] as const

export function SignInDialog({
  messages,
  reason,
  onSignedIn,
  onClose,
}: {
  /** The whole catalogue: the dialog's own words, and the tag the mailed code is written in. */
  readonly messages: Messages
  /**
   * Why the dialog is open, when it was opened by something in particular.
   *
   * The game-over panel has a specific thing to say -- the score on the screen is what is at
   * stake -- and saying it here rather than in the caller keeps the dialog one component.
   */
  readonly reason?: string
  readonly onSignedIn: (account: Account) => void
  readonly onClose: () => void
}): React.JSX.Element {
  // Restored, so that a reload does not throw away a code that is already in somebody's inbox.
  const [email, setEmail] = useState(() => remembered()?.email ?? '')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(() => remembered() !== null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<SignInResult | null>(null)
  const card = useRef<HTMLDivElement>(null)

  // Escape closes, which is what every dialog on the web does and what the game's own
  // confirmations do. Bound to the document rather than to the card, so it works before anything
  // inside has been focused.
  useEffect(() => {
    const onKey = (press: KeyboardEvent): void => {
      if (press.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const send = async (): Promise<void> => {
    setBusy(true)
    setProblem(null)
    const result = await requestCode(email.trim(), messages.tag)
    setBusy(false)
    if (result === 'sent') {
      remember(email.trim())
      setSent(true)
      return
    }
    setProblem(result)
  }

  const verify = async (): Promise<void> => {
    setBusy(true)
    setProblem(null)
    const result = await submitCode(email.trim(), code.trim())
    if (result !== 'signed-in') {
      setBusy(false)
      setProblem(result)
      return
    }
    // The cookie is set by the response. Asking who we are now is what turns it into something
    // the interface can show, and it proves the cookie survived the round trip rather than
    // assuming it did.
    const identity = await whoAmI()
    forget()
    setBusy(false)
    // Only a live answer will do here. A code was just spent, so `offline` means the cookie may
    // well be set and we cannot see it; saying "unavailable" is the honest report either way, and
    // it is what the reader needs in order to try again rather than assume they are in.
    if (identity.state !== 'signed-in') {
      setProblem('unavailable')
      return
    }
    onSignedIn(identity.account)
  }

  const message =
    problem === 'bad-email'
      ? messages.badEmail
      : problem === 'bad-code'
        ? messages.badCode
        : problem === 'unavailable'
          ? messages.serverBusy
          : null

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      onMouseDown={(event) => {
        // The backdrop, not the card. Anything inside can be dragged across without closing.
        if (!(card.current?.contains(event.target as Node) ?? false)) onClose()
      }}
    >
      <div className="modal-card signin-card" ref={card}>
        <h2 id="signin-title" className="signin-title">
          {messages.signInTitle}
        </h2>
        <p className="signin-lead">{reason ?? messages.signInLead}</p>

        {/*
          Both buttons, and the word between them, only where they can work.
          
          In the native shell they cannot, and what they did instead was restart the app at the
          first screen of the tour -- a button that looks like sign-in and behaves like a crash.
          `ssoAvailable()` carries the three reasons why; the short version is that a WebView is
          not a browser and this handshake needs one. The mailed code is the way in there, and it
          works over the bearer token the shell already holds.
          
          The word "or" goes with them. On its own above the email form it would be an "or"
          with nothing on the other side of it.
        */}
        {ssoAvailable() ? (
          <>
            <div className="signin-providers">
              {PROVIDERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="btn"
                  onClick={() => {
                    // A whole navigation rather than a fetch. The handshake has to happen in the
                    // address bar: the provider shows its own sheet on its own origin, and the
                    // session cookie it results in is set by our server on the way back.
                    globalThis.location.assign(startUrl(option.id))
                  }}
                >
                  {option.id === 'apple' ? messages.continueWithApple : messages.continueWithGoogle}
                </button>
              ))}
            </div>
            <p className="signin-or">{messages.signInOr}</p>
          </>
        ) : null}

        <form
          className="signin"
          onSubmit={(event) => {
            event.preventDefault()
            void (sent ? verify() : send())
          }}
        >
          <label className="signin-field">
            <span>{messages.emailLabel}</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              // Editable after sending, because finding out you mistyped it means waiting for
              // mail that never comes, and the repair is right here rather than a step backwards.
              onChange={(event) => {
                setEmail(event.target.value)
              }}
              autoFocus={!sent}
              required
            />
          </label>

          {sent ? (
            <label className="signin-field">
              <span>{messages.codeLabel}</span>
              <input
                type="text"
                /*
                 * `one-time-code` stays, and the manager opt-outs go on beside it.
                 *
                 * The two are different mechanisms and only one is wanted here. That token is
                 * what lets iOS and Android offer the code from the notification without the
                 * mail being opened, which is most of the ergonomics of this flow; the `data-`
                 * attributes are what stop LastPass and its neighbours treating the field as a
                 * credential to suggest into. The address above is the one field in the app
                 * where a password manager should speak up, and it is the only one without them.
                 */
                autoComplete="one-time-code"
                {...ignoredByManagers}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(event) => {
                  // Pasting from a mail client can bring spaces or a stray full stop with it.
                  setCode(event.target.value.replace(/\D/gu, ''))
                }}
                autoFocus
                required
              />
            </label>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? messages.working : sent ? messages.signIn : messages.emailMeACode}
          </button>

          {sent ? (
            <button
              type="button"
              className="signin-again"
              disabled={busy}

              onClick={() => {
                // Says what it costs, because it does: the code already sent stops working.
                forget()
                setSent(false)
                setCode('')
                setProblem(null)
              }}
            >
              {messages.sendNewCode}
            </button>
          ) : null}

          {sent && problem === null ? <p className="signin-note">{messages.codeSent}</p> : null}
          {message === null ? null : (
            <p className="signin-note is-bad" role="alert">
              {message}
            </p>
          )}
        </form>

        <button type="button" className="signin-again" onClick={onClose}>
          {messages.notNow}
        </button>
      </div>
    </div>
  )
}
