# Signing in: what to configure, and where

A runbook for the three sign-in methods in [ACCOUNTS.md](ACCOUNTS.md): a six-digit emailed code,
Google, and Apple. It covers what has to exist in somebody's console before any of it works, for
both environments.

Two environments, and they are not symmetrical:

|             | host                                      | notes                                 |
| ----------- | ----------------------------------------- | ------------------------------------- |
| production  | `playblinkered.com`                       | live, proxied by Cloudflare           |
| development | `blinkered.devapps.tightlinesoftware.com` | live, behind basic auth in Caddy      |
| local       | `http://localhost`                        | Google will accept it. Apple will not |

## The shape of the flow, which decides most of the settings

**Google only ever sees a web client, and only ever sees our domains.** Nothing is registered as
an iOS client for Google, and Google is never spoken to by the phone:

```
phone  ->  ASWebAuthenticationSession
           -> https://playblinkered.com/v1/auth/google?native=1
              -> Google's consent page
                 -> https://playblinkered.com/v1/auth/google/callback
                    -> blinkered://auth?code=<one-time>
                       -> POST /v1/auth/native/exchange -> a bearer token
```

That is worth knowing before touching the console, because the obvious reading of "we have an iOS
app" is that Google wants an iOS OAuth client, and it does not. The redirect target is always our
own server.

**Apple is different, and this document used to say it was not.** The phone talks to Apple
directly, through the system sheet rather than a browser:

```
phone  ->  POST /v1/auth/native/nonce             -> a nonce, kept server-side
       ->  ASAuthorizationAppleIDProvider          -> the system sheet, on device
           -> an identity token, audience = the App ID
              -> POST /v1/auth/native/apple        -> a bearer token
```

So there are effectively two Apple client ids: the **Services ID** for the browser flow, and the
**App ID bundle identifier** for the native one. `appleNativeProvider` in `auth/apple.ts` is the
same verifier with the audience swapped, which is the whole difference. `BLINKERED_APPLE_BUNDLE_ID`
carries it.

Why both, rather than the native sheet everywhere: the native sheet offers only the Apple ID the
phone is signed in to, with no account picker. That is what the provider does, and the browser
flow was the only way to get a choice.

**The token goes to `localStorage`, not the Keychain.** An earlier version of this diagram said
Keychain, which was the intention: a secure-storage plugin needs `@capacitor/core` in `apps/web`,
which it deliberately does not have. It is behind three functions in `api.ts`, and STATUS.md
records it as accepted rather than done.

**One prerequisite in the native shell.** `apps/mobile/capacitor.config.ts` sets
`limitsNavigationsToAppBoundDomains: true`, and its own comment predicted this: "Anything that
does want the network later (accounts, phase 4) has to say so deliberately." It has to change
before the shell can reach the API at all.

## Google

Cheap, and cheap for one specific reason worth protecting.

**Scopes are `openid`, `email`, `profile` and nothing else.** Those are non-sensitive, so the app
does not enter Google's **app** verification, the review with the security questionnaire attached. Ask for one more scope than that, anything touching
Drive or contacts or a person's calendar, and publishing turns into a review with a security
questionnaire attached. There is no reason a word game needs a fourth scope; the point is to
notice if one ever gets added by accident. `google.test.ts` asserts the scope string, so an
accidental fourth is a failing test rather than a discovery made during a review.

**Brand verification is a different thing, and tame scopes do not exempt you from it.** It is
lighter, and it decides one thing: whether the consent screen shows your name and logo or just
the registrable domain from the authorized domains list. Uploading a logo is what raises the
banner reading "Your app requires verification", which appears next to a publishing status of
**In production** and reads like a contradiction. It is not:

- **Publishing status** decides who may sign in. In production means anybody, with no 100-user
  cap and no unverified-app warning screen.
- **Brand verification** decides what the consent screen is allowed to call you.

Ignoring it costs nothing functional: sign-in works for everybody either way. Clearing it needs
the authorized domains proven in Google Search Console, which means `tightlinesoftware.com` as
well as `playblinkered.com`, since the first is only in the list so the dev client works at all.
The logo to upload is `brand/logo-512.png`.

### Consent screen, once

Google Cloud console, under the Google Auth Platform section (it used to be called "OAuth consent
screen", and older instructions on the web still say that).

- User type **External**, publishing status **In production**. Left in "Testing" it works
  perfectly for you and for nobody else: a hard cap of 100 named test users.
- App name `Blinkered`, a logo, and a support email.
- **Authorized domains:** `playblinkered.com` and `tightlinesoftware.com`. The second one is what
  lets the dev host under `devapps.tightlinesoftware.com` be used at all.
- Links to the privacy policy and terms. Both have to be reachable before publishing, so they are
  a blocker on this step rather than a tidy-up afterwards.

### Two clients, one project

Create **two** OAuth clients of type _Web application_, on the Clients page. One project, so
there is one consent screen to fill in, but two clients so production and development hold
different secrets and a leaked dev secret is not a production incident.

Redirect URIs, exactly, with no trailing slash:

```
production   https://playblinkered.com/v1/auth/google/callback
development  https://blinkered.devapps.tightlinesoftware.com/v1/auth/google/callback
local        http://localhost:8080/v1/auth/google/callback
```

HTTPS is required except for localhost, which Google exempts on purpose. Put the localhost URI on
the **development** client, not production.

No "authorized JavaScript origins" are needed. That field is for the browser-side Google Identity
Services library, and this is a server-side redirect flow: the browser never holds a Google token.

What comes out is a client ID and a client secret per environment. The client ID is public, so
it sits in `values-dev.yaml` and `values-prod.yaml` beside the redirect URI; only the secret is a
Kubernetes secret:

```
kubectl --context tl-dev -n blinkered-dev create secret generic blinkered-google \
  --from-literal=client-secret=...
```

Then set `api.google.clientId` and `api.google.existingSecret` for that environment. Both empty
is a deployment with no Google button and a 501 behind it, which is the state of the repository
as it stands.

**Two differences from Apple worth carrying in your head**, both handled in `google.ts`:

- Google mints `id_token`s with `iss` as either `https://accounts.google.com` or the bare
  `accounts.google.com`, interchangeably. Accepting only the documented one rejects real tokens
  intermittently.
- Google's callback is an ordinary redirect rather than a form post, so its state cookie is
  `SameSite=Lax` where Apple's must be `None`. Lax is the stricter setting; do not "tidy" the two
  into agreement.

## Apple

More steps, a hard prerequisite, and one thing that expires.

**It needs the paid Apple Developer Program membership.** Sign in with Apple on the web is not
available on a free account. STATUS.md has the organization enrolment as decided, and notes that
the slow part, the D-U-N-S verification, is already done through Apple Business Manager. Nothing
below can be started until the enrolment completes.

### 1. App ID

Identifiers, type **App IDs**. Bundle ID `com.tightlinesoftware.blinkered`, which is what
`capacitor.config.ts` already declares. Enable the **Sign In with Apple** capability on it.

### 2. Services ID

Identifiers, type **Services IDs**. Something like `com.tightlinesoftware.blinkered.signin`.

This is the `client_id` for web sign-in. It is a different string from the App ID, and using the
App ID here is the most common way to get `invalid_client` back later.

Configure it, associate it with the App ID above, and fill in the Website URLs section. Three
traps live in that one form.

**Every field is comma-delimited, including the domains.** It is a textarea, so one entry per
line looks right and is quietly rejected: the value is read as a single malformed domain and the
error names only the last host typed, which sends you looking at that host rather than at the
separator. Commas, not newlines.

**Domains carry no scheme; return URLs do.**

```
Domains and Subdomains   playblinkered.com, blinkered.devapps.tightlinesoftware.com

Return URLs              https://playblinkered.com/v1/auth/apple/callback,
                         https://blinkered.devapps.tightlinesoftware.com/v1/auth/apple/callback
```

That asymmetry is undocumented in the form itself and is a standing source of
`invalid redirect_uri`.

**Leave `www` out.** Apple treats it as a separate host, and ours answers 301 to the apex on
every path, so the browser is already on the apex before any sign-in begins. A `www` row is
never an origin the flow can start from.

**No localhost, and no plain HTTP.** Apple refuses both, so local development cannot use Sign in
with Apple at all. Use the dev host, or a tunnel with a real HTTPS name. Google's localhost
exemption has no equivalent here.

### 3. There is no file to host, and there used to be

Nothing to do. The domains are registered the moment the form saves.

This keeps a heading of its own because most writing on the subject describes a different flow:
Apple used to hand over an `apple-developer-domain-association.txt` to be served from
`/.well-known/` on each domain, with a Download button per row and a Verify button beside it.
Both are gone. Apple's own help page now says so in one line: "You don't need to upload a file on
your server to complete the registration process for domains and subdomains."
([Configure Sign in with Apple for the web](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web))
A missing Download button is the current design, not a broken portal, which is still what the
forum threads conclude.

The consequence is the sequencing: Apple never fetches these hosts, so a domain can be registered
before it exists, before it serves HTTPS, and from behind whatever authentication you like. The
dev host was never a gate on any of this.

### 4. A key, downloadable exactly once

Keys, new key, **Sign in with Apple** enabled, associated with the App ID.

The `.p8` file downloads once and can never be downloaded again. Losing it means revoking the key
and issuing another. Record alongside it the **Key ID** and the **Team ID**.

### 5. The client secret is something we generate, and it expires

Apple does not issue a client secret. It is a JWT we sign with the `.p8`:

```
header   alg ES256, kid <Key ID>
claims   iss <Team ID>
         sub <Services ID>          the client_id, not the bundle ID
         aud https://appleid.apple.com
         iat now
         exp  at most now + 15777000   (six months, and Apple rejects anything longer)
```

**So Apple sign-in has an expiry date on it**, and the failure is silent until the day it is not.
The way to make that a non-problem is to never store a client secret at all: keep the `.p8` in a
Kubernetes secret and mint a short-lived JWT, minutes, per token exchange. Then nothing has to be
rotated and nothing has a date on it. Storing a six-month secret and setting a calendar reminder
is the other option, and it is the one that eventually fails on a Sunday.

### 6. Register the sending domain, or the hidden-email users bounce

A user who chooses "Hide My Email" arrives as `something@privaterelay.appleid.com`. Mail to those
addresses is **rejected** unless the sending domain and address are registered under Sign in with
Apple for Email Communication, in Certificates, Identifiers and Profiles.

For an app whose sign-in _is_ an emailed code, that is not a nicety at the edge. It is half the
Apple users being unable to receive the thing they need to sign in. It also needs SPF on the
sending domain, which is in the next section anyway.

### 7. The name arrives once

Apple returns the user's name only on the very first authorization, never again. We ask for a
username at sign-up regardless, so this costs us little, but code that assumes it can re-read the
name later is code that works in development and not in production.

## Email

### What is actually needed

Something that accepts "deliver this message to this address" and can tell us afterwards whether
it arrived. For a game whose sign-in is a six-digit code, **delivery is the product**: a code that
does not arrive is not a degraded experience, it is an account nobody can get into, and there is
no other door.

### Attaching playblinkered.com to Workspace: yes, but for a different reason

Worth doing, and not as the sending path.

What it buys is a real mailbox at the domain, which is needed anyway: Apple asks for a support
contact, a privacy policy has to name somewhere to write to, and a game with a leaderboard will
eventually need somewhere for "that name is impersonating me" to arrive.

**`help@playblinkered.com` is that mailbox, and it is now load-bearing.** Both legal pages name
it, the privacy policy makes it the route for deletion and for data requests, and Google's
consent screen points at those pages. It has to reach a human.

What it does not buy is transactional sending. Workspace is built for mail that people type:

- The sending limits are shaped for a person, not for bursts of machine mail at unpredictable
  hours.
- There are no bounce or complaint webhooks and no suppression list, so a code that failed to
  deliver is invisible. "It never arrived" becomes unanswerable, and it is the single most likely
  support question this feature will generate.
- It puts the company's own mail reputation and the game's on the same operational footing, which
  is fine right up until the first time it is not.

### What shipped: the Workspace relay, for now

**This section argued for a transactional sender and the deployment uses the Workspace relay**, so
the recommendation is a recommendation rather than a description. `values-prod.yaml` points
`BLINKERED_SMTP_HOST` at `smtp-relay.gmail.com`, and `auth/smtp.ts` sends through nodemailer. The
reasoning above is unchanged and none of it turned out to be wrong; it was deferred, because a
relay that works today beats a DNS afternoon before the first sign-in, and every objection below
is about what happens at volume this has not reached.

What that defers, precisely: no bounce or complaint webhooks, no suppression list, and Workspace's
own sending limits. The first unanswerable "it never arrived" is the signal to finish this.

### The sender it should become, on playblinkered.com

Any of Resend, Postmark or SES. All three DKIM-sign as the domain, all three have delivery and
bounce webhooks, and at this volume all three are free or cost cents. Postmark is the
deliverability-first option, SES the cheapest, Resend the quickest to wire up.

Send as `noreply@playblinkered.com`, and publish on the domain:

- **SPF**, including the provider, and required by Apple's relay registration in any case.
- **DKIM**, the provider's keys, so the signature aligns with playblinkered.com.
- **DMARC**, starting at `p=none` while the reports are read, then tightening. Going straight to
  `p=reject` before checking alignment is how a domain stops delivering its own mail.

The codes are localized, because the account already knows which of the game's languages the
player reads. Two templates, one per locale, and they are the first strings in this project
that live outside the app.

## What goes where

Secrets, one per environment:

```
BLINKERED_GOOGLE_CLIENT_SECRET   per environment
BLINKERED_APPLE_PRIVATE_KEY      the .p8, and never a generated six-month secret
BLINKERED_SMTP_USER              the relay account
BLINKERED_SMTP_PASSWORD          its app password
```

Every variable this server reads is `BLINKERED_`-prefixed; an earlier version of this list dropped
the prefix, which made none of them greppable. Two entries on it were imaginary:
**`EMAIL_API_KEY`** belonged to the transactional provider argued for below, and mail goes through
SMTP instead; **`SESSION_SECRET`** was for signing a cookie, and nothing is signed. A session token
is 32 random bytes, stored as a SHA-256 hash and looked up in Postgres, so there is no key to keep
-- which also means a leaked database cannot be used to mint one.

**Three of Apple's four values are in the chart rather than in a secret**, which the earlier
version of this document got wrong by listing everything together. The Team ID is the prefix on
every App ID the account owns, the Key ID is sent to Apple in the `kid` header of every token
exchange, and the Services ID is the public `client_id` in the authorize URL. None of them
authenticates anything without the key, and treating them as secrets means a deployment cannot be
reproduced from the repo for no gain. They live in `deploy/helm/blinkered/values.yaml`:

```
api.apple.teamId          ZJ3A78KXA4
api.apple.keyId           85Z9WXC2Q9
api.apple.servicesId      com.tightlinesoftware.blinkered.signin
api.apple.redirectUri     per environment, and byte-identical to a registered Return URL
api.apple.existingSecret  names the secret holding the .p8; empty leaves Apple unmounted
```

`GOOGLE_CLIENT_ID` is the same shape of thing and belongs in the chart too when Google is built.

The Apple block is gated on `existingSecret` the way sign-in is gated on `smtp.host`: with it
empty the deployment serves the game and offers no Apple button. Set it only once the secret is
actually in the namespace, because a `secretKeyRef` to a missing secret stops the pod rather than
degrading it.

```
kubectl --context tl-dev -n blinkered-dev create secret generic blinkered-apple \
  --from-file=private-key=AuthKey_85Z9WXC2Q9.p8
```

The database is a secret of its own with a different shape, seven keys rather than environment
variable names, so that one secret can be swapped for a managed provider's without touching
anything here. [DEPLOY.md](DEPLOY.md) has it.

## The order to do it in

1. ~~**Stand up the dev host.**~~ Done. `blinkered.devapps.tightlinesoftware.com` serves the
   game, the API and Postgres, behind basic auth in Caddy. It was long believed to gate
   everything Apple. It does not, and never did once the association file went away: Apple
   fetches nothing from the domains it registers.
2. **Email**, because Apple's relay registration depends on the sending domain existing with SPF
   on it, and because the code flow is the one sign-in method with no third party in it.
3. **Apple**, once the enrolment is through and the domains are registered.
4. **Google**, which is an afternoon: consent screen, two clients, done. The code is built and
   waiting on exactly that; until a client secret exists the route answers 501.

**Apple before Google, and the earlier ordering here was wrong.** It put Google third on the
grounds that it is cheap and Apple is slow, which is true and is not the question. The phone is
the platform this is being built for, iOS is where sign-in has to feel native, and Sign in with
Apple is mandatory on iOS the moment any other third-party sign-in exists; App Store guideline
4.8, already noted in ACCOUNTS.md. Shipping Google first would mean either shipping an app that
cannot pass review or holding Google back until Apple caught up. Do the constrained one first
and let the afternoon's work be the afternoon's work.

The one thing that can reorder this again is the enrolment: Sign in with Apple on the web is not
available on a free account, so if the Developer Program membership is not through, Apple is
blocked no matter where it sits on this list.
