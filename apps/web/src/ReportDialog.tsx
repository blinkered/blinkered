import type { Messages } from '@blinkered/i18n'
import { useRef, useState } from 'react'
import { report } from './account.js'
import type { ReportField, ReportResult } from './account.js'

/**
 * Objecting to a username, a bio, or a score.
 *
 * The other half of what docs/ACCOUNTS.md decided about moderating free text, and the reason the
 * admin queue exists at all: "a blocklist is not going to work across this many languages and
 * pretending otherwise is worse than not having one. What works is a report button and the power
 * to rename an account and tell its owner why."
 *
 * Translated, unlike the panel that reads what it writes. That asymmetry is the point: the queue
 * has one audience and it is us, and this has fifty-one.
 *
 * A dialog rather than an inline form, and drawn **over** whatever opened it, which is the rule
 * every overlay in this app follows for the reason `SignInDialog` states: React unmounts what it
 * replaces, and the page somebody is objecting to has to still be there afterwards.
 */

/** What is being objected to, and which fields that makes available. */
export type Subject =
  | { readonly kind: 'person'; readonly username: string }
  | { readonly kind: 'game'; readonly gameId: string }

/**
 * The button, and the dialog it opens.
 *
 * One component rather than two, because the button has no other purpose and a caller that had
 * to hold the open state itself would be three lines of the same thing in every place this
 * appears.
 */
export function ReportButton({
  messages,
  subject,
}: {
  readonly messages: Messages
  readonly subject: Subject
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="report-open"
        onClick={() => {
          setOpen(true)
        }}
      >
        {messages.reportThis}
      </button>
      {open ? (
        <ReportDialog
          messages={messages}
          subject={subject}
          onClose={() => {
            setOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

function ReportDialog({
  messages,
  subject,
  onClose,
}: {
  readonly messages: Messages
  readonly subject: Subject
  readonly onClose: () => void
}): React.JSX.Element {
  const card = useRef<HTMLDivElement>(null)

  /*
   * Which field, and a game has only one.
   *
   * A score is objected to as a score and nothing else, so there is no choice to make and none is
   * drawn. A person has two free-text surfaces and the name is the default, because a name is the
   * thing shown next to them everywhere and the bio is the thing you have to go and read.
   */
  const fields: readonly ReportField[] = subject.kind === 'game' ? ['score'] : ['username', 'bio']
  const [field, setField] = useState<ReportField>(fields[0] as ReportField)
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<ReportResult | null>(null)

  const wording: Readonly<Record<ReportField, string>> = {
    username: messages.reportTheName,
    bio: messages.reportTheBio,
    score: messages.reportTheScore,
  }

  const send = async (): Promise<void> => {
    setSending(true)
    const answer = await report({
      field,
      ...(subject.kind === 'person' ? { username: subject.username } : { gameId: subject.gameId }),
      ...(reason.trim() === '' ? {} : { reason: reason.trim() }),
    })
    setSending(false)
    setResult(answer)
  }

  /* A duplicate reads as a success, because from here it is one: they reported it and it is
     reported. Saying "you already did that" only invites a third attempt. */
  const done = result === 'filed' || result === 'already'

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      onMouseDown={(event) => {
        // The backdrop, not the card, exactly as the sign-in dialog does it: a drag that starts
        // inside and ends outside is not a click on the backdrop.
        if (!(card.current?.contains(event.target as Node) ?? false)) onClose()
      }}
    >
      <div className="modal-card signin-card" ref={card}>
        <h2 id="report-title" className="signin-title">
          {messages.reportHeading}
        </h2>

        {done ? (
          <>
            <p className="signin-note" role="status">
              {messages.reportSent}
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              {messages.backToGame}
            </button>
          </>
        ) : (
          <form
            className="signin"
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
          >
            {fields.length === 1 ? (
              <p className="signin-lead">{wording[field]}</p>
            ) : (
              <div className="report-fields" role="radiogroup" aria-labelledby="report-title">
                {fields.map((one) => (
                  <label key={one} className="report-field">
                    <input
                      type="radio"
                      name="report-field"
                      value={one}
                      checked={field === one}
                      onChange={() => {
                        setField(one)
                      }}
                    />
                    <span>{wording[one]}</span>
                  </label>
                ))}
              </div>
            )}

            <label className="signin-field">
              <span>{messages.reportWhy}</span>
              <textarea
                className="account-bio"
                rows={3}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                }}
              />
            </label>

            {/* The failures, in the reader's own language and kept apart: a signed-out reader has
                something to do about it, and a vanished subject does not. */}
            {result === 'signed-out' ? (
              <p className="signin-note is-bad" role="alert">
                {messages.reportSignIn}
              </p>
            ) : null}
            {result === 'no-subject' ? (
              <p className="signin-note is-bad" role="alert">
                {messages.reportGone}
              </p>
            ) : null}
            {result === 'unavailable' ? (
              <p className="signin-note is-bad" role="alert">
                {messages.serverBusy}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? messages.saving : messages.reportSend}
            </button>
            <button type="button" className="signin-again" onClick={onClose}>
              {messages.reportCancel}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
