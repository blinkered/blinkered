import { createTransport } from 'nodemailer'
import type { LoginMail, Mailer } from './mail.js'

/**
 * Mail over SMTP, to whatever relay the environment names.
 *
 * One transport rather than a provider adapter per service. Google Workspace, Resend, Postmark,
 * SES and a relay on the host all speak SMTP, so `host:port:tls` plus credentials reaches any of
 * them, and choosing differently later is a change to a Kubernetes secret rather than to this
 * file. There is nothing a provider SDK would buy here: the outbound side of sending a
 * six-digit code is a subject and two lines.
 *
 * What a provider is eventually chosen *for* is the inbound side — bounce and complaint webhooks
 * and a suppression list — and none of that arrives through this interface. See docs/AUTH.md.
 */

export interface SmtpConfig {
  readonly host: string
  readonly port: number
  /**
   * TLS from the first byte (465) rather than STARTTLS (587).
   *
   * Both are encrypted; they differ in when. Getting it backwards is the classic SMTP
   * misconfiguration, and it fails as a hang rather than as an error, because one side is waiting
   * for a handshake and the other for a greeting.
   */
  readonly implicitTls: boolean
  /**
   * Credentials, together or not at all.
   *
   * One optional object rather than two optional strings, so "a user with no password" cannot be
   * written down. The first version had them separate and needed a `?? ''` to cope with a state
   * `smtpConfig` already refuses to produce — a branch no test could reach, which is the shape a
   * type is supposed to remove rather than a comment to explain. Absent entirely for a relay that
   * authorizes by address.
   */
  readonly auth?: { readonly user: string; readonly password: string }
  /**
   * The sender, as a mail header rather than as a bare address.
   *
   * `Blinkered <noreply@playblinkered.com>` and not `noreply@playblinkered.com`. Without the
   * display name an inbox shows the address, or just `noreply`, which reads as machinery before
   * anybody has opened it. The address inside the angle brackets still has to be one the relay
   * is allowed to send as.
   */
  readonly from: string
}

/** Subject and both bodies. English only for now; see the note in `loginMessage`. */
export interface Written {
  readonly subject: string
  readonly text: string
  readonly html: string
}

/**
 * What the mail says.
 *
 * Sent as both, because every real sign-in mail is: HTML where the code can be set large enough
 * to read across a desk, and plain text for the clients that refuse HTML and for anybody who
 * reads mail in a terminal. Nodemailer sends them as one multipart message and the client picks.
 *
 * The layout is the part that has to be right, because almost nobody reads the words: the code
 * is copied out of the subject or the first thing in the body and pasted back. So it stands
 * alone, bold and large, with nothing attached to it. A trailing full stop falls inside a
 * double-click selection on some clients, and a pasted `123456.` fails the six-digit check for
 * a reason the person cannot see.
 *
 * The words around it are deliberately the boring standard ones. The first draft wrote its own
 * — "It works once, and for ten minutes", "nothing has happened to your account" — and both
 * read as machinery, which is the one thing a mail asking somebody to trust a six-digit number
 * cannot afford.
 *
 * The HTML sets its own colours rather than inheriting. Mail clients in dark mode invert what
 * they are given, and a code that comes out dark grey on near-black is unreadable in exactly the
 * situation it is needed.
 *
 * Localization is still owed, and docs/AUTH.md is right about why: this is the one message a
 * player cannot route around, since it is the thing that lets them in. The blocker is mechanical
 * rather than hard — `Messages` requires every key in all fifty-one locales, so it cannot be
 * added partially.
 */
export function loginMessage(mail: LoginMail): Written {
  return {
    // Leads with the code, because a phone notification shows the subject and nothing else.
    subject: `${mail.code} is your Blinkered code`,
    text: [
      'Your sign-in code:',
      '',
      mail.code,
      '',
      'It expires in 10 minutes and can only be used once.',
      '',
      "If you didn't request this, you can safely ignore this email.",
      '',
      'Blinkered',
      'https://playblinkered.com',
    ].join('\n'),
    html: `<div style="background:#ffffff;color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;padding:24px;max-width:480px">
<p style="margin:0 0 16px">Your sign-in code:</p>
<p style="margin:0 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:0.12em;color:#111111">${mail.code}</p>
<p style="margin:0 0 24px">It expires in 10 minutes and can only be used once.</p>
<p style="margin:0 0 8px;color:#666666;font-size:13px">If you didn&rsquo;t request this, you can safely ignore this email.</p>
<p style="margin:0;color:#666666;font-size:13px"><a href="https://playblinkered.com" style="color:#666666">Blinkered</a></p>
</div>`,
  }
}

/** What this file needs of a transport, which is one method. Injected so a test needs no socket. */
export interface Transport {
  sendMail(message: {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }): Promise<unknown>
}

/**
 * Builds a mailer over an SMTP relay.
 *
 * `pool` is on because sign-in arrives in bursts around whatever brought people to the game, and
 * a fresh TCP and TLS handshake per code is the difference between a mail that arrives while
 * somebody is still looking at the screen and one that does not.
 *
 * The transport is a parameter so that what this file actually decides — the envelope and the
 * words — can be asserted without opening a connection. Nodemailer's own behaviour is
 * nodemailer's to test.
 */
export function smtpMailer(
  config: SmtpConfig,
  open: (config: SmtpConfig) => Transport = openSmtp,
): Mailer {
  const transport = open(config)
  return {
    send: async (mail) => {
      const written = loginMessage(mail)
      await transport.sendMail({
        from: config.from,
        to: mail.to,
        subject: written.subject,
        text: written.text,
        html: written.html,
      })
    },
  }
}

/**
 * The real transport.
 *
 * Exported so it can be checked, which it can be: `createTransport` builds an object and opens
 * nothing, so asserting that a config becomes the right options costs no socket. What it does
 * with those options afterwards is nodemailer's to test, not ours.
 */
export function openSmtp(config: SmtpConfig): Transport & { options?: unknown } {
  return createTransport({
    host: config.host,
    port: config.port,
    secure: config.implicitTls,
    pool: true,
    ...(config.auth === undefined
      ? {}
      : { auth: { user: config.auth.user, pass: config.auth.password } }),
  })
}
