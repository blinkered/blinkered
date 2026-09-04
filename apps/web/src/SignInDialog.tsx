import { useEffect, useRef, useState } from 'react'
import { requestCode, submitCode, whoAmI } from './account.js'
import type { Account, SignInResult } from './account.js'

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
 * Strings are English here and nowhere else in the app is. docs/ACCOUNTS.md takes that decision
 * too: `Messages` requires every key in all fifty-one locales at once, so twenty new strings
 * cannot be added a little at a time, and translating a flow nobody has walked through is
 * translating a guess. One localization pass, afterwards.
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

/** The providers that are not built. The button is real; only the other end is missing. */
const PROVIDERS = [
  { id: 'apple', label: 'Continue with Apple' },
  { id: 'google', label: 'Continue with Google' },
] as const

export function SignInDialog({
  locale,
  reason,
  onSignedIn,
  onClose,
}: {
  /** The game's interface language, so the mail can be written in it once it is localized. */
  readonly locale: string
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
  const [provider, setProvider] = useState<string | null>(null)
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
    const result = await requestCode(email.trim(), locale)
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
    const account = await whoAmI()
    forget()
    setBusy(false)
    if (account === null) {
      setProblem('unavailable')
      return
    }
    onSignedIn(account)
  }

  const message =
    problem === 'bad-email'
      ? 'That does not look like an email address.'
      : problem === 'bad-code'
        ? 'That code did not work. Codes expire after 10 minutes and can only be used once.'
        : problem === 'unavailable'
          ? 'Could not reach the server. Try again in a moment.'
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
        <h2 id="signin-title" className="signin-title" lang="en">
          Sign in or sign up
        </h2>
        <p className="signin-lead" lang="en">
          {reason ?? 'An account keeps your games, on every device you play on.'}
        </p>

        <div className="signin-providers">
          {PROVIDERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="btn"
              lang="en"
              onClick={() => {
                setProvider(option.id)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        {provider === null ? null : (
          <p className="signin-note is-bad" role="alert" lang="en">
            {provider === 'apple' ? 'Sign in with Apple' : 'Sign in with Google'} is not ready yet.
            Use your email for now.
          </p>
        )}

        <p className="signin-or" lang="en">
          or
        </p>

        <form
          className="signin"
          onSubmit={(event) => {
            event.preventDefault()
            void (sent ? verify() : send())
          }}
        >
          <label className="signin-field">
            <span lang="en">Email</span>
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
              <span lang="en">Code</span>
              <input
                type="text"
                // `one-time-code` is what lets iOS and Android offer the code from the
                // notification without the mail being opened, which is most of the ergonomics
                // of this flow.
                autoComplete="one-time-code"
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

          <button type="submit" className="btn btn-primary" disabled={busy} lang="en">
            {busy ? 'Working…' : sent ? 'Sign in' : 'Email me a code'}
          </button>

          {sent ? (
            <button
              type="button"
              className="signin-again"
              disabled={busy}
              lang="en"
              onClick={() => {
                // Says what it costs, because it does: the code already sent stops working.
                forget()
                setSent(false)
                setCode('')
                setProblem(null)
              }}
            >
              Send a new code
            </button>
          ) : null}

          {sent && problem === null ? (
            <p className="signin-note" lang="en">
              Check your email. The code lasts 10 minutes.
            </p>
          ) : null}
          {message === null ? null : (
            <p className="signin-note is-bad" role="alert" lang="en">
              {message}
            </p>
          )}
        </form>

        <button type="button" className="signin-again" onClick={onClose} lang="en">
          Not now
        </button>
      </div>
    </div>
  )
}
