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
  /** The envelope sender. Has to be a domain the relay is allowed to send as. */
  readonly from: string
}

/** Subject and body. English only for now; see the note in `loginMessage`. */
export interface Written {
  readonly subject: string
  readonly text: string
}

/**
 * What the mail says.
 *
 * English for now, deliberately, on the grounds that almost nobody reads it: the code is copied
 * out of the subject line or the first line and pasted back. That makes **layout** the part
 * that has to be right, and it is why the code sits alone on its own line with nothing attached
 * to it — a trailing full stop is inside a double-click selection on some clients, and pasting
 * `123456.` fails the six-digit check for a reason nobody can see. The subject leads with the
 * code for the same reason: a phone notification shows the subject and nothing else, so a person
 * can read it without opening anything.
 *
 * Localization is still owed, and docs/AUTH.md is right about why — this is the one message a
 * player cannot route around, since it is the thing that lets them in. The blocker is mechanical
 * rather than hard: `Messages` requires every key in all fifty-one locales, so it cannot be added
 * partially, and it is a hundred and two strings.
 */
export function loginMessage(mail: LoginMail): Written {
  return {
    subject: `${mail.code} is your Blinkered sign-in code`,
    text: [
      'Your Blinkered sign-in code is',
      '',
      mail.code,
      '',
      'It works once, and for ten minutes.',
      'If you did not ask for it, nothing has happened to your account and you can ignore this.',
    ].join('\n'),
  }
}

/** What this file needs of a transport, which is one method. Injected so a test needs no socket. */
export interface Transport {
  sendMail(message: { from: string; to: string; subject: string; text: string }): Promise<unknown>
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
