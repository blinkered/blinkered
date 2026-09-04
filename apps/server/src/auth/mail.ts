/**
 * Where a login code goes, behind one function.
 *
 * The provider is not chosen yet — docs/AUTH.md has Resend, Postmark and SES as equivalent at
 * this volume, and picking one is a DNS afternoon rather than a code change. What matters now is
 * that the flow does not wait for that decision: `consoleMailer` makes the code available in the
 * pod's log, which is enough to build and exercise sign-in end to end on the dev host.
 *
 * The port is deliberately narrow. Delivery is the product for a game whose sign-in is a code, so
 * the thing a provider is chosen for is not an API shape, it is bounce and complaint webhooks and
 * a suppression list. Those arrive later as their own routes, not as parameters here.
 */

export interface LoginMail {
  readonly to: string
  readonly code: string
  /**
   * Which of the game's languages to write in.
   *
   * Carried from the start rather than added later: the account already knows what the player
   * reads, and a code arriving in English to somebody playing in Greek is the one message in the
   * product that cannot be shrugged off, because it is the message they need in order to get in.
   */
  readonly locale: string
}

export interface Mailer {
  /**
   * Delivers a code, or throws.
   *
   * Throwing matters. A route that cannot send has to answer differently from one that did, or
   * the player is told to check mail that was never sent and has no way to tell the difference
   * from mail that was slow.
   */
  send(mail: LoginMail): Promise<void>
}

/**
 * The development sink: writes the code where a developer can read it and sends nothing.
 *
 * It logs at `warn` and says what it is, because a sink that looks like a sender is how a
 * production deployment quietly stops delivering mail while every dashboard stays green.
 */
export function consoleMailer(log: (line: string) => void = console.warn): Mailer {
  return {
    send: (mail) => {
      log(
        `[mailer:console] NO MAIL SENT. login code for ${mail.to} (${mail.locale}) is ${mail.code}`,
      )
      return Promise.resolve()
    },
  }
}

/**
 * A mailer that refuses, for a deployment that has not been given one.
 *
 * The alternative is defaulting to `consoleMailer` everywhere, which would mean a production
 * environment missing its provider configuration comes up healthy, accepts sign-ups, and writes
 * every login code for the whole estate into a log aggregator. Failing the send is louder and
 * smaller.
 */
export function noMailer(): Mailer {
  return {
    send: () =>
      Promise.reject(
        new Error('no mailer is configured: set the transactional provider, or use consoleMailer'),
      ),
  }
}
