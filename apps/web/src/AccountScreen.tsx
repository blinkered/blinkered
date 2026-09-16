import { format } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import { useEffect, useState } from 'react'
import { Avatar } from './Avatar.js'
import { GameDetail } from './GameDetail.js'
import { GamesTable } from './GamesTable.js'
import { Dropdown } from './Dropdown.js'
import { LanguagePicker } from './LanguagePicker.js'
import { checkName, myGames, saveProfile } from './account.js'
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
 * English throughout, like the sign-in dialog, and for the reason recorded there.
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
  onTab,
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
  readonly onTab: (at: Destination) => void
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
          />
        ) : (
          <Games dictionary={dictionary} messages={messages} />
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
}: {
  readonly account: Account
  readonly messages: Messages
  readonly catalogue: readonly CatalogueEntry[]
  readonly readIn: string
  readonly onAccount: (account: Account) => void
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
          autoComplete="username"
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
    </form>
  )
}

function Games({
  dictionary,
  messages,
}: {
  readonly dictionary: TieredIndex | null
  readonly messages: Messages
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
        dictionary={dictionary}
        onBack={() => {
          setOpen(null)
        }}
      />
    )
  }

  return <GamesTable messages={messages} games={games} onOpen={setOpen} />
}
