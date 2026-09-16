/**
 * Telling browsers and password managers that a field is not a credential.
 *
 * Every text field in this app except two is an ordinary form field: a display name, a bio, a
 * search box, a filter. Two are credentials and want the opposite treatment -- the address and
 * the six-digit code in `SignInDialog`, which say `email` and `one-time-code` and should keep
 * saying them, because a manager filling those is a manager being useful.
 *
 * ## The bug this was written for
 *
 * The profile screen's rename field said `autoComplete="username"`, which is not a description of
 * a display handle, it is the hint that means "this is the username of a login form". LastPass
 * read it exactly as written and offered to fill in an email address on a field nobody had even
 * focused. That was our mistake rather than the extension's: the field lied about what it was.
 *
 * So the first half of the fix is honesty. `nickname` is a real autofill token and it is what a
 * public handle actually is, so a browser that wants to help offers a handle rather than a login.
 *
 * ## The second half is four vendor attributes, and they are not standard
 *
 * `autocomplete="off"` is advice that browsers are free to ignore and, for anything that is not a
 * password, mostly do. Managers also match on placeholders, labels and neighbouring fields, which
 * is why the admin search box -- a `type="search"` whose placeholder reads
 * `trout, or nick@example.com` -- is a target no standard attribute talks it out of.
 *
 * Each vendor therefore has its own opt-out, and there is no specification behind any of them:
 *
 * | attribute                 | who reads it |
 * | ------------------------- | ------------ |
 * | `data-lpignore="true"`    | LastPass     |
 * | `data-1p-ignore`          | 1Password    |
 * | `data-bwignore`           | Bitwarden    |
 * | `data-form-type="other"`  | Dashlane     |
 *
 * All four, because a person has one manager and we do not get to know which. They are inert
 * everywhere else -- unknown `data-` attributes are just attributes -- so the cost of the ones
 * that do not apply is the bytes.
 *
 * ## The rule, so a field added later does not have to be argued about
 *
 * **Every control in the app carries these except one**: the address on the email sign-in flow,
 * which is the single place a password manager should speak up. That includes the controls no
 * manager has ever been seen to touch -- checkboxes, selects, number spinners, a read-only
 * textarea -- because "all of them but one" is a rule somebody can check, and "the ones that
 * looked like targets to me in 2026" is not.
 *
 * **It is a request, not a guarantee.** An extension can fill anything it likes, and a future
 * version of any of these may rename its attribute. What this buys is the common case going
 * quiet, and it is worth checking again the next time one of them starts misbehaving.
 */

/**
 * The four attributes, and nothing else.
 *
 * For a control that has no business carrying an `autocomplete` token at all -- a checkbox, a
 * radio, a select, a read-only box -- and for the one field that has its own and wants to keep
 * it. Spread these and say your own.
 */
export const ignoredByManagers = {
  'data-lpignore': 'true',
  // Presence rather than a value, which is what 1Password documents.
  'data-1p-ignore': '',
  'data-bwignore': 'true',
  'data-form-type': 'other',
} as const

/**
 * Props for a field somebody types into that is not a credential.
 *
 * `autoComplete` defaults to `off`, which is right for a search box, a filter or a number -- there
 * is nothing a browser could usefully remember about any of them. Pass a real autofill token where
 * the field has one: `nickname` for a public handle, which is the truthful answer and the reason
 * the original bug happened at all.
 */
export function notACredential(
  autoComplete = 'off',
): typeof ignoredByManagers & { readonly autoComplete: string } {
  return { autoComplete, ...ignoredByManagers }
}
