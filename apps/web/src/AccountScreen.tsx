import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { useEffect, useState } from 'react'
import { Avatar } from './Avatar.js'
import { GameDetail } from './GameDetail.js'
import { GamesTable } from './GamesTable.js'
import { Dropdown } from './Dropdown.js'
import { LanguagePicker } from './LanguagePicker.js'
import { checkName, deleteAccount, myGames, requestDeletionCode, saveProfile } from './account.js'
import { notACredential, ignoredByManagers } from './autofill.js'
import { countriesIn } from './countries.js'
import type { Account, PlayedGame } from './account.js'
import type { CatalogueEntry } from './dictionary.js'
import type { TieredIndex } from '@blinkered/words'
import type { Destination } from './AccountMenu.js'

/**
 * Where the account menu goes: the profile, and the games.
 *
 * One overlay with two tabs rather than two screens, because they are two views of one thing and
 * because the way back is the same button either way. It covers the page rather than replacing
 * it, for the reason the rules overlay already gives in App.tsx: React unmounts what it replaces,
 * and a game underneath has to still be there when this closes.
 *
 * Translated, like the rest of the game. This comment used to say the opposite and was left
 * behind by the pass that translated these screens; the one surface still deliberately in English
 * is the moderation panel, and `AdminScreen` records why.
 */

/**
 * What a form will accept, which is not what the server will.
 *
 * `USERNAME_MAX` on the server is 32 and deliberately looser: down there the job is to stop a
 * name that is an abuse of a text column. Up here it is to stop a name that will not fit a
 * leaderboard row, and the right place to say so is a live character count rather than a
 * rejection after the fact.
 */
const NAME_MAX = 20
const BIO_MAX = 140

/** How long to wait after the last keystroke before asking whether a name is free. */
const CHECK_MS = 400

/** The server's words for a bad name, in the reader's. */
/**
 * Why a name or a bio was refused, in the reader's own language.
 *
 * Built from the catalogue rather than held as a constant, because a constant would be fixed in
 * whatever language the module was first evaluated in. The server sends a tag; the words are
 * ours to choose.
 */
function nameTrouble(messages: Messages): Readonly<Record<string, string>> {
  return {
    taken: messages.nameTaken,
    'too-short': messages.nameTooShort,
    'too-long': messages.nameTooLong,
    'bad-characters': messages.nameBadCharacters,
    'bad-edges': messages.nameBadEdges,
    'mixed-scripts': messages.nameMixedScripts,
    reserved: messages.nameReserved,
    unavailable: messages.serverBusy,
  }
}

function bioTrouble(messages: Messages): Readonly<Record<string, string>> {
  return {
    'too-long': format(messages.bioTooLong, { max: BIO_MAX }),
    'has-link': messages.bioHasLink,
    'has-control': messages.bioHasControl,
    unavailable: messages.serverBusy,
  }
}

export function AccountScreen({
  account,
  messages,
  at,
  catalogue,
  readIn,
  dictionary,
  onAccount,
  onDeleted,
  onTab,
  onSignIn,
  onClose,
}: {
  readonly account: Account
  readonly messages: Messages
  readonly at: Destination
  readonly catalogue: readonly CatalogueEntry[]
  /** The interface language, which is what the country and language lists are read in. */
  readonly readIn: string
  /** The dictionary in hand, passed through to a game detail that may be able to use it. */
  readonly dictionary: TieredIndex | null
  readonly onAccount: (account: Account) => void
  /** Called once the account is really gone, so the interface can stop remembering it. */
  readonly onDeleted: () => void
  readonly onTab: (at: Destination) => void
  /**
   * Opens the sign-in dialog.
   *
   * Threaded through to the game detail, which is the same component the public pages use and so
   * carries the report button. Nothing here can reach it -- `GET /v1/me/games` returns only your
   * own games, and the button is never drawn on your own -- and it is wired anyway, because the
   * alternative is a component that renders a control with no handler behind it if that ever
   * stops being true.
   */
  readonly onSignIn: () => void
  readonly onClose: () => void
}): React.JSX.Element {
  return (
    <div className="rules-overlay account-screen">
      <div className="account-page">
        <header className="account-head">
          <Avatar seed={account.avatarSeed} size={56} className="avatar-large" />
          <div>
            <h1 className="account-name">{account.username}</h1>
            <p className="dim">{messages.accountTitle}</p>
          </div>
          <button type="button" className="btn account-close" onClick={onClose}>
            {messages.backToGame}
          </button>
        </header>

        <div className="account-tabs" role="tablist">
          {(['profile', 'games'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={at === tab}
              className={`account-tab${at === tab ? ' is-on' : ''}`}

              onClick={() => {
                onTab(tab)
              }}
            >
              {tab === 'profile' ? messages.tabProfile : messages.gamesHeading}
            </button>
          ))}
        </div>

        {at === 'profile' ? (
          <Profile
            account={account}
            messages={messages}
            catalogue={catalogue}
            readIn={readIn}
            onAccount={onAccount}
            onDeleted={onDeleted}
          />
        ) : (
          <Games
            dictionary={dictionary}
            messages={messages}
            me={account.userId}
            onSignIn={onSignIn}
          />
        )}
      </div>
    </div>
  )
}

function Profile({
  account,
  messages,
  catalogue,
  readIn,
  onAccount,
  onDeleted,
}: {
  readonly account: Account
  readonly messages: Messages
  readonly catalogue: readonly CatalogueEntry[]
  readonly readIn: string
  readonly onAccount: (account: Account) => void
  readonly onDeleted: () => void
}): React.JSX.Element {
  const [name, setName] = useState(account.username)
  const [bio, setBio] = useState(account.bio ?? '')
  const [nameProblem, setNameProblem] = useState<string | null>(null)
  const [bioProblem, setBioProblem] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  /*
   * Whether the name is free, asked after the typing stops.
   *
   * Debounced rather than per keystroke: a request per character is a request per character, and
   * the answer to a half-typed name is never the answer. Advisory either way — the save is what
   * decides, and the server says so too, because between this answer and the button somebody
   * else can take it.
   */
  const wanted = name.trim()
  useEffect(() => {
    if (wanted === account.username || wanted === '') {
      setNameProblem(null)
      return undefined
    }
    let live = true
    const timer = setTimeout(() => {
      void checkName(wanted).then((answer) => {
        if (!live) return
        // Null is "could not ask", which is not the same as "not available" and must not read
        // as though the name were the problem.
        setNameProblem(answer === null ? null : answer.problem)
      })
    }, CHECK_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [wanted, account.username])

  const save = async (): Promise<void> => {
    setBusy(true)
    setSaved(false)
    setNameProblem(null)
    setBioProblem(null)
    // Only what changed. A patch that mentions a field it is not changing is a patch that can
    // revert somebody else's edit in another tab.
    const edit = {
      ...(wanted === account.username ? {} : { username: wanted }),
      ...(bio.trim() === (account.bio ?? '') ? {} : { bio: bio.trim() === '' ? null : bio.trim() }),
    }
    const result = await saveProfile(edit)
    setBusy(false)
    if (result.ok) {
      onAccount(result.account)
      setSaved(true)
      return
    }
    // The server says which field it refused, which matters because `too-long` is a thing it
    // can say about either of these two.
    if (result.field === 'bio') setBioProblem(result.problem)
    else setNameProblem(result.problem)
  }

  const left = BIO_MAX - [...bio].length

  return (
    <form
      className="account-form"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <label className="signin-field">
        <span>{messages.usernameLabel}</span>
        <input
          type="text"
          value={name}
          maxLength={NAME_MAX}
          /*
           * `nickname`, not `username`.
           *
           * This said `username`, which is the hint that means "the username of a login form",
           * and every password manager read it exactly that way: LastPass offered to fill an
           * email address into a field nobody had focused. A public handle is a nickname. See
           * `autofill.ts` for the four vendor attributes that come with it.
           */
          {...notACredential('nickname')}
          onChange={(event) => {
            setName(event.target.value)
            setSaved(false)
          }}
        />
      </label>
      {nameProblem === null ? null : (
        <p className="signin-note is-bad" role="alert">
          {nameTrouble(messages)[nameProblem] ?? messages.nameUnusable}
        </p>
      )}

      <label className="signin-field">
        <span>{messages.bioLabel}</span>
        <textarea
          className="account-bio"
          rows={2}
          value={bio}
          {...notACredential()}
          onChange={(event) => {
            setBio(event.target.value)
            setSaved(false)
          }}
        />
      </label>
      <p className={`signin-note${left < 0 ? ' is-bad' : ''}`}>
        {/* Links are refused, and saying so before the save is cheaper than saying so after. */}
        {format(messages.bioHint, { left, max: BIO_MAX })}
      </p>
      {bioProblem === null ? null : (
        <p className="signin-note is-bad" role="alert">
          {bioTrouble(messages)[bioProblem] ?? messages.bioUnusable}
        </p>
      )}

      {/*
       * The country and both languages save the moment they change, unlike the two text fields.
       * A picker has no half-typed state to protect, so making somebody choose and then press
       * Save is a step that exists only because the fields above it need one.
       */}
      {/* No `<label>` around these three: `Dropdown` draws its own, wired to the trigger by
          `aria-labelledby`, and wrapping it in another produced the label twice on screen and a
          `<label>` pointing at a composite control, which is not what a label is for. */}
      <Dropdown
        options={[
          { value: '', label: messages.countryAny },
          ...countriesIn(readIn).map((country) => ({
            value: country.code,
            label: country.name,
          })),
        ]}
        value={account.country ?? ''}
        label={messages.countryLabel}
        filter={messages.findCountry}
        empty={messages.noMatches}
        onChange={(code) => {
          void saveProfile({ country: code === '' ? null : code }).then((result) => {
            if (result.ok) onAccount(result.account)
          })
        }}
      />

      {/*
       * Two languages, and this is the one screen where they can be set apart. The title bar's
       * picker sets both together, which is right there — somebody who cannot read the page has
       * to be able to fix it in one move. Here there is room for the distinction settings.ts
       * keeps deliberately: plenty of people play in a language they do not read menus in.
       */}
      <LanguagePicker
        catalogue={catalogue}
        value={account.uiLanguage ?? readIn}
        readIn={readIn}
        label={messages.interfaceLanguage}
        onChange={(tag) => {
          void saveProfile({ uiLanguage: tag }).then((result) => {
            if (result.ok) onAccount(result.account)
          })
        }}
      />

      <LanguagePicker
        catalogue={catalogue}
        value={account.gameLanguage ?? readIn}
        readIn={readIn}
        label={messages.gameLanguage}
        onChange={(tag) => {
          void saveProfile({ gameLanguage: tag }).then((result) => {
            if (result.ok) onAccount(result.account)
          })
        }}
      />

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? messages.saving : messages.save}
      </button>
      {saved ? (
        <p className="signin-note" role="status">
          {messages.saved}
        </p>
      ) : null}

      {/*
        Deletion, last on the screen and outside the form above it.
        
        Outside because it must not be what Enter does: this form's submit saves a name, and a
        destructive action sharing a submit handler with a text field is one keystroke from being
        a mistake. Last because it is the thing somebody scrolls to on purpose, never the thing
        they meet on the way to something else.
      */}
      <DeleteAccount messages={messages} readIn={readIn} onDeleted={onDeleted} />
    </form>
  )
}

/**
 * Deleting your own account, in two steps with a code between them.
 *
 * App Store guideline 5.1.1(v) requires this of anything offering account creation, and its
 * support page requires that it really delete: "only offering to temporarily deactivate or
 * disable an account is insufficient". So there is no deactivate here, and what the server does
 * is a real delete rather than the mark an admin sets.
 *
 * The code is the reason there are two steps. A session lasts thirty days, so a session on its
 * own means an open laptop is enough to erase somebody; Apple's guidance permits exactly this
 * remedy, "entering a code from an email or phone number already associated with the account".
 * It is the same six-digit code as signing in, which is why `codeLabel`, `codeSent` and
 * `badCode` are reused rather than written again -- the code expiring after ten minutes and
 * working once is the same fact in both places.
 */
function DeleteAccount({
  messages,
  readIn,
  onDeleted,
}: {
  readonly messages: Messages
  readonly readIn: string
  readonly onDeleted: () => void
}): React.JSX.Element {
  /** `closed` until asked for, then `asking`, then `sent` once a code is out, then `gone`. */
  const [step, setStep] = useState<'closed' | 'asking' | 'sent' | 'gone'>('closed')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [trouble, setTrouble] = useState<string | null>(null)

  const askForCode = async (): Promise<void> => {
    setBusy(true)
    setTrouble(null)
    const answer = await requestDeletionCode(readIn)
    setBusy(false)
    if (answer === 'sent') {
      setStep('sent')
      return
    }
    // `no-address` is the one worth its own words: nothing the reader typed is wrong, and the
    // repair is to get in touch rather than to try again.
    setTrouble(answer === 'no-address' ? messages.deleteNoAddress : messages.serverBusy)
  }

  const confirm = async (): Promise<void> => {
    setBusy(true)
    setTrouble(null)
    const answer = await deleteAccount(code.trim())
    setBusy(false)
    if (answer === 'deleted') {
      // Said before the interface forgets them, because the next thing that happens is the whole
      // screen closing.
      setStep('gone')
      onDeleted()
      return
    }
    if (answer === 'no-address') setTrouble(messages.deleteNoAddress)
    else if (answer === 'bad-code') setTrouble(messages.badCode)
    else setTrouble(messages.serverBusy)
  }

  if (step === 'gone') {
    // No button of its own: the account screen's header carries "Back to the game" at all times,
    // and that is what App listens on to stop remembering a deleted account. A second way out
    // would be a second thing to keep in step with it.
    return (
      <p className="signin-note account-danger" role="status">
        {messages.deleteGone}
      </p>
    )
  }

  return (
    <section className="account-danger">
      {step === 'closed' ? (
        <button
          type="button"
          className="btn is-danger"
          onClick={() => {
            setStep('asking')
          }}
        >
          {messages.deleteAccount}
        </button>
      ) : (
        <>
          <p className="signin-note is-bad">{messages.deleteAccountWhat}</p>
          {step === 'sent' ? (
            <>
              <p className="signin-note">{messages.codeSent}</p>
              <label className="signin-field">
                <span>{messages.codeLabel}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  maxLength={6}
                  // Not a credential a manager should offer into, like every field but one.
                  autoComplete="one-time-code"
                  {...ignoredByManagers}
                  onChange={(event) => {
                    setCode(event.target.value)
                  }}
                />
              </label>
            </>
          ) : null}

          <div className="admin-actions">
            <button
              type="button"
              className="btn is-danger"
              disabled={busy}
              onClick={() => {
                void (step === 'sent' ? confirm() : askForCode())
              }}
            >
              {busy
                ? messages.saving
                : step === 'sent'
                  ? messages.deleteConfirm
                  : messages.deleteAccountAsk}
            </button>
            <button
              type="button"
              className="signin-again"
              onClick={() => {
                setStep('closed')
                setCode('')
                setTrouble(null)
              }}
            >
              {messages.reportCancel}
            </button>
          </div>
          {trouble === null ? null : (
            <p className="signin-note is-bad" role="alert">
              {trouble}
            </p>
          )}
        </>
      )}
    </section>
  )
}

function Games({
  dictionary,
  messages,
  me,
  onSignIn,
}: {
  readonly dictionary: TieredIndex | null
  readonly messages: Messages
  /** Whose list this is, which is what keeps a report button off your own games. */
  readonly me: string
  readonly onSignIn: () => void
}): React.JSX.Element {
  const [games, setGames] = useState<readonly PlayedGame[] | null>(null)
  const [failed, setFailed] = useState(false)
  /**
   * Which game is open, by id.
   *
   * The listing stays mounted underneath rather than being replaced, so closing a game returns to
   * the list where it was rather than refetching it. The same rule the rules overlay and the
   * sign-in dialog follow, and for the same reason.
   */
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    void myGames().then((found) => {
      if (!live) return
      if (found === null) setFailed(true)
      else setGames(found)
    })
    return () => {
      live = false
    }
  }, [])

  if (failed) {
    return <p className="signin-note is-bad">{messages.serverDown}</p>
  }
  if (games === null) {
    return <p className="dim">{messages.gamesLoading}</p>
  }
  if (games.length === 0) {
    return <p className="dim">{messages.gamesEmpty}</p>
  }

  if (open !== null) {
    return (
      <GameDetail
        messages={messages}
        id={open}
        me={me}
        onSignIn={onSignIn}
        dictionary={dictionary}
        onBack={() => {
          setOpen(null)
        }}
      />
    )
  }

  return <GamesTable messages={messages} games={games} onOpen={setOpen} />
}
