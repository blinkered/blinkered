import { useState } from 'react'
import { requestCode, submitCode, whoAmI } from './account.js'
import type { Account, SignInResult } from './account.js'

/**
 * Signing in, in two steps and one panel.
 *
 * The address and the code are the same panel rather than two screens, because the second step
 * is worthless without the first still visible: somebody who mistyped their address finds out
 * by waiting, and the fix is to see what they typed and correct it, not to navigate back.
 *
 * Strings are English here and nowhere else in the app is. This is the first thing built on top
 * of the API and it is deliberately not wired into `Messages` yet — adding a key there means
 * adding it in fifty-one locales at once, and doing that before the flow has been used once
 * would be translating a guess.
 */
export function SignIn({
  locale,
  onSignedIn,
}: {
  /** The game's interface language, so the mail can be written in it once it is localized. */
  readonly locale: string
  readonly onSignedIn: (account: Account) => void
}): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<SignInResult | null>(null)

  const send = async (): Promise<void> => {
    setBusy(true)
    setProblem(null)
    const result = await requestCode(email.trim(), locale)
    setBusy(false)
    if (result === 'sent') {
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
    <form
      className="signin"
      onSubmit={(event) => {
        event.preventDefault()
        void (sent ? verify() : send())
      }}
    >
      <label className="signin-field">
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          // Editable after sending, because finding out you mistyped it means waiting for mail
          // that never comes, and the repair is right here rather than a step backwards.
          onChange={(event) => {
            setEmail(event.target.value)
          }}
          required
        />
      </label>

      {sent ? (
        <label className="signin-field">
          <span>Code</span>
          <input
            type="text"
            // `one-time-code` is what lets iOS and Android offer the code from the notification
            // without the mail being opened, which is most of the ergonomics of this flow.
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

      <button type="submit" disabled={busy}>
        {busy ? 'Working…' : sent ? 'Sign in' : 'Email me a code'}
      </button>

      {sent && problem === null ? (
        <p className="signin-note">Check your email. The code lasts 10 minutes.</p>
      ) : null}
      {message === null ? null : (
        <p className="signin-note is-bad" role="alert">
          {message}
        </p>
      )}
    </form>
  )
}
