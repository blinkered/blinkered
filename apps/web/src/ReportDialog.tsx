import type { Messages } from '@blinkered/i18n'
import { useEffect, useRef, useState } from 'react'
import { report } from './account.js'
import type { ReportField, ReportResult } from './account.js'
import { draftKept, dropDraft, keepDraft, subjectKey } from './reportDraft.js'
import type { Subject } from './reportDraft.js'

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
 *
 * ## Being signed out is not a dead end
 *
 * Reporting needs a session, and the person best placed to write a good report is whoever just
 * read the thing they are objecting to -- who may well not have an account. The first version of
 * this let them write five hundred characters, press Send, and only then told them to sign in,
 * with the text gone. That punished exactly the reader who cared enough to explain.
 *
 * So the button is still offered to a stranger, because one invisible to everybody without an
 * account teaches nobody the feature exists; the dialog says up front that it needs a sign-in;
 * and pressing that keeps what they wrote. See `reportDraft.ts` for where it goes and why the
 * subject is enough to find the way back.
 */

export type { Subject } from './reportDraft.js'

/**
 * The button, and the dialog it opens.
 *
 * One component rather than two, because the button has no other purpose and a caller that had
 * to hold the open state itself would be three lines of the same thing in every place this
 * appears. It also owns resuming a kept draft, which only works if something outlives the
 * dialog.
 */
export function ReportButton({
  messages,
  subject,
  signedIn,
  onSignIn,
}: {
  readonly messages: Messages
  readonly subject: Subject
  /** Whether anybody is signed in. Decides what the dialog asks for, never what it is allowed. */
  readonly signedIn: boolean
  /** Opens the sign-in dialog. Called only after what somebody wrote has been kept. */
  readonly onSignIn: () => void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  /** A draft written before signing in, so the dialog reopens holding it rather than empty. */
  const [resumed, setResumed] = useState<{ field: ReportField; reason: string } | null>(null)

  /*
   * Picking a kept draft back up.
   *
   * Keyed on the subject, so a half-written report about one person does not reappear on
   * somebody else's page, and on `signedIn`, which is the two ways back in: an emailed code
   * flips it without a navigation, and a provider flips it on the next page load.
   *
   * It **opens** the dialog only once there is a session to send with. Restoring the text while
   * still signed out is worth doing, because they may press the button again; opening a modal
   * unprompted on a cold page load is not.
   */
  const key = subjectKey(subject)
  useEffect(() => {
    const kept = draftKept()
    if (kept === null || subjectKey(kept.subject) !== key) return
    setResumed({ field: kept.field, reason: kept.reason })
    if (signedIn) setOpen(true)
  }, [key, signedIn])

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
          signedIn={signedIn}
          initial={resumed}
          onSignIn={() => {
            // Closed first, because `SignInDialog` is drawn earlier in the document than the
            // page this sits on, so leaving both open would paint this one over the thing it
            // just asked somebody to use.
            setOpen(false)
            onSignIn()
          }}
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
  signedIn,
  initial,
  onSignIn,
  onClose,
}: {
  readonly messages: Messages
  readonly subject: Subject
  readonly signedIn: boolean
  readonly initial: { field: ReportField; reason: string } | null
  readonly onSignIn: () => void
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
  const [field, setField] = useState<ReportField>(initial?.field ?? (fields[0] as ReportField))
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<ReportResult | null>(null)

  /**
   * Whether this is asking for a sign-in rather than for a report.
   *
   * Two things set it: not being signed in when the dialog opens, and a session that died
   * between opening it and pressing the button. The second is why this is state rather than the
   * `signedIn` prop read directly -- a report refused with 401 has to end in the same place as
   * one that was never going to be allowed, holding the same text.
   */
  const [needsSignIn, setNeedsSignIn] = useState(!signedIn)

  const wording: Readonly<Record<ReportField, string>> = {
    username: messages.reportTheName,
    bio: messages.reportTheBio,
    score: messages.reportTheScore,
  }

  const draft = { subject, field, reason: reason.trim() }

  const askToSignIn = (): void => {
    keepDraft(draft)
    onSignIn()
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
    // A session that expired while the dialog was open. Keep what they wrote and ask, rather
    // than reporting a failure they can do nothing about.
    if (answer === 'signed-out') {
      keepDraft(draft)
      setNeedsSignIn(true)
      return
    }
    if (answer === 'filed' || answer === 'already') dropDraft()
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
              // Said before the typing rather than after it. The text is kept either way.
              if (needsSignIn) askToSignIn()
              else void send()
            }}
          >
            {/*
              Up front, not on the way out.
              
              The form is still drawn underneath it, because somebody who has just read something
              worth objecting to should be able to write it down while the thought is theirs. What
              they write survives the sign-in; `reportDraft.ts` says how.
            */}
            {needsSignIn ? (
              <p className="signin-note is-bad" role="alert">
                {messages.reportSignIn}
              </p>
            ) : null}

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

            {/* The failures that are not about signing in, kept apart: a vanished subject is
                nothing the reader can do anything about, and a busy server is worth retrying. */}
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
              {needsSignIn ? messages.signIn : sending ? messages.saving : messages.reportSend}
            </button>
            <button
              type="button"
              className="signin-again"
              onClick={() => {
                // Cancelling is an answer. A draft left behind would reopen this the next time
                // they passed the same page, which is not what pressing Cancel asked for.
                dropDraft()
                onClose()
              }}
            >
              {messages.reportCancel}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
