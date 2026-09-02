# Signing in: what to configure, and where

A runbook for the three sign-in methods in [ACCOUNTS.md](ACCOUNTS.md): a six-digit emailed code,
Google, and Apple. It covers what has to exist in somebody's console before any of it works, for
both environments.

Two environments, and they are not symmetrical:

|             | host                                      | notes                                     |
| ----------- | ----------------------------------------- | ----------------------------------------- |
| production  | `playblinkered.com`                       | live, proxied by Cloudflare               |
| development | `blinkered.devapps.tightlinesoftware.com` | does not exist yet, and Apple needs it to |
| local       | `http://localhost`                        | Google will accept it. Apple will not     |

## The shape of the flow, which decides most of the settings

Both providers only ever see a **web** client, and only ever see our domains. Nothing is
registered as an iOS client, and neither Google nor Apple is ever spoken to by the phone.

```
phone  ->  ASWebAuthenticationSession
           -> https://playblinkered.com/v1/auth/<provider>
              -> provider's consent page
                 -> https://playblinkered.com/v1/auth/<provider>/callback
                    -> blinkered://auth/callback?code=<one-time>
                       -> app exchanges it for a session token, into Keychain
```

That is worth knowing before touching either console, because the obvious reading of "we have an
iOS app" is that Google wants an iOS OAuth client and Apple wants a native configuration, and
neither is true here. The redirect target is always our own server.

**One prerequisite in the native shell.** `apps/mobile/capacitor.config.ts` sets
`limitsNavigationsToAppBoundDomains: true`, and its own comment predicted this: "Anything that
does want the network later (accounts, phase 4) has to say so deliberately." It has to change
before the shell can reach the API at all.

## Google

Cheap, and cheap for one specific reason worth protecting.

**Scopes are `openid`, `email`, `profile` and nothing else.** Those are non-sensitive, so the app
does not enter Google's verification process. Ask for one more scope than that, anything touching
Drive or contacts or a person's calendar, and publishing turns into a review with a security
questionnaire attached. There is no reason a word game needs a fourth scope; the point is to
notice if one ever gets added by accident.

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

What comes out is a client ID and a client secret per environment. The secret goes in a
Kubernetes secret and nowhere else.

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

Configure it, associate it with the App ID above, and fill in two lists whose formats disagree
with each other:

```
Domains and Subdomains   playblinkered.com
                         blinkered.devapps.tightlinesoftware.com      <- no scheme

Return URLs              https://playblinkered.com/v1/auth/apple/callback
                         https://blinkered.devapps.tightlinesoftware.com/v1/auth/apple/callback
```

Domains without `https://`, return URLs with it. That asymmetry is undocumented in the form
itself and is a standing source of `invalid redirect_uri`.

**No localhost, and no plain HTTP.** Apple refuses both, so local development cannot use Sign in
with Apple at all. Use the dev host, or a tunnel with a real HTTPS name. Google's localhost
exemption has no equivalent here.

### 3. Verify the domains, which means the dev host has to exist

Apple hands over an `apple-developer-domain-association.txt` and expects it at
`https://<domain>/.well-known/apple-developer-domain-association.txt` for **each** domain listed.

So `blinkered.devapps.tightlinesoftware.com` has to be live and serving HTTPS before its half of
Apple sign-in can be configured. That makes the dev environment a prerequisite for this work
rather than a convenience alongside it, which is the one piece of sequencing in this document
worth planning around.

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

What it buys is a real mailbox at the domain, which is needed anyway and is currently missing:
Apple asks for a support contact, a privacy policy has to name somewhere to write to, and a game
with a leaderboard will eventually need somewhere for "that name is impersonating me" to arrive.
`hello@playblinkered.com` and `support@playblinkered.com` want to exist and want to reach a human.

What it does not buy is transactional sending. Workspace is built for mail that people type:

- The sending limits are shaped for a person, not for bursts of machine mail at unpredictable
  hours.
- There are no bounce or complaint webhooks and no suppression list, so a code that failed to
  deliver is invisible. "It never arrived" becomes unanswerable, and it is the single most likely
  support question this feature will generate.
- It puts the company's own mail reputation and the game's on the same operational footing, which
  is fine right up until the first time it is not.

### So: a transactional sender, on playblinkered.com

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

Nothing below is in the repo. All of it is a Kubernetes secret per environment.

```
GOOGLE_CLIENT_ID          per environment
GOOGLE_CLIENT_SECRET      per environment
APPLE_TEAM_ID             one, the account's
APPLE_KEY_ID              one per key
APPLE_SERVICES_ID         the Services ID, shared by both environments
APPLE_PRIVATE_KEY         the .p8, and never a generated six-month secret
EMAIL_API_KEY             the transactional provider
SESSION_SECRET            for signing the cookie
```

The database is a secret of its own with a different shape, seven keys rather than environment
variable names, so that one secret can be swapped for a managed provider's without touching
anything here. [DEPLOY.md](DEPLOY.md) has it.

## The order to do it in

1. **Stand up the dev host.** Apple's domain verification needs it live over HTTPS, so it gates
   everything Apple, and it is the long pole rather than the easy first step it looks like.
2. **Email**, because Apple's relay registration depends on the sending domain existing with SPF
   on it, and because the code flow is the one sign-in method with no third party in it.
3. **Google**, which is an afternoon: consent screen, two clients, done.
4. **Apple**, once the enrolment is through and the two domains verify.
