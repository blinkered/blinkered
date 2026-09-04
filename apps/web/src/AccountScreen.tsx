import { useEffect, useState } from 'react'
import { Avatar } from './Avatar.js'
import { Dropdown } from './Dropdown.js'
import { LanguagePicker } from './LanguagePicker.js'
import { checkName, myGames, saveProfile } from './account.js'
import { countriesIn } from './countries.js'
import type { Account, PlayedGame } from './account.js'
import type { CatalogueEntry } from './dictionary.js'
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
const NAME_TROUBLE: Readonly<Record<string, string>> = {
  taken: 'Somebody already has that name.',
  'too-short': 'A bit longer, please.',
  'too-long': 'That is too long.',
  'bad-characters': 'Letters, digits, hyphens and underscores only.',
  'bad-edges': 'It has to start and end with a letter or a digit.',
  'mixed-scripts': 'Pick one alphabet and stay in it.',
  reserved: 'That looks like a name we hand out. Choose another.',
  unavailable: 'Could not reach the server. Try again in a moment.',
}

const BIO_TROUBLE: Readonly<Record<string, string>> = {
  'too-long': `Bios are ${String(BIO_MAX)} characters or fewer.`,
  'has-link': 'Links are not allowed in a bio.',
  'has-control': 'That contains characters a bio cannot hold.',
  unavailable: 'Could not reach the server. Try again in a moment.',
}

export function AccountScreen({
  account,
  at,
  catalogue,
  readIn,
  onAccount,
  onTab,
  onClose,
}: {
  readonly account: Account
  readonly at: Destination
  readonly catalogue: readonly CatalogueEntry[]
  /** The interface language, which is what the country and language lists are read in. */
  readonly readIn: string
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
            <p className="dim" lang="en">
              Your account
            </p>
          </div>
          <button type="button" className="btn account-close" onClick={onClose} lang="en">
            Back to the game
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
              lang="en"
              onClick={() => {
                onTab(tab)
              }}
            >
              {tab === 'profile' ? 'Profile' : 'Games'}
            </button>
          ))}
        </div>

        {at === 'profile' ? (
          <Profile account={account} catalogue={catalogue} readIn={readIn} onAccount={onAccount} />
        ) : (
          <Games />
        )}
      </div>
    </div>
  )
}

function Profile({
  account,
  catalogue,
  readIn,
  onAccount,
}: {
  readonly account: Account
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
        <span lang="en">Username</span>
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
        <p className="signin-note is-bad" role="alert" lang="en">
          {NAME_TROUBLE[nameProblem] ?? 'That name cannot be used.'}
        </p>
      )}

      <label className="signin-field">
        <span lang="en">Bio</span>
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
      <p className={`signin-note${left < 0 ? ' is-bad' : ''}`} lang="en">
        {/* Links are refused, and saying so before the save is cheaper than saying so after. */}
        {String(left)} characters left. No links.
      </p>
      {bioProblem === null ? null : (
        <p className="signin-note is-bad" role="alert" lang="en">
          {BIO_TROUBLE[bioProblem] ?? 'That bio cannot be used.'}
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
          { value: '', label: 'Not saying' },
          ...countriesIn(readIn).map((country) => ({
            value: country.code,
            label: country.name,
          })),
        ]}
        value={account.country ?? ''}
        label="Country"
        filter="Find a country"
        empty="No matches"
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
        label="Interface language"
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
        label="Game language"
        onChange={(tag) => {
          void saveProfile({ gameLanguage: tag }).then((result) => {
            if (result.ok) onAccount(result.account)
          })
        }}
      />

      <button type="submit" className="btn btn-primary" disabled={busy} lang="en">
        {busy ? 'Saving…' : 'Save'}
      </button>
      {saved ? (
        <p className="signin-note" role="status" lang="en">
          Saved.
        </p>
      ) : null}
    </form>
  )
}

function Games(): React.JSX.Element {
  const [games, setGames] = useState<readonly PlayedGame[] | null>(null)
  const [failed, setFailed] = useState(false)

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
    return (
      <p className="signin-note is-bad" lang="en">
        Could not reach the server.
      </p>
    )
  }
  if (games === null) {
    return (
      <p className="dim" lang="en">
        Reading your games…
      </p>
    )
  }
  if (games.length === 0) {
    return (
      <p className="dim" lang="en">
        Nothing here yet. Games you play while signed in will show up here.
      </p>
    )
  }

  return (
    <table className="account-games">
      <thead>
        <tr lang="en">
          <th scope="col">When</th>
          <th scope="col">Game</th>
          <th scope="col">Score</th>
          <th scope="col">Words</th>
          <th scope="col">Rounds</th>
        </tr>
      </thead>
      <tbody>
        {games.map((game) => (
          <tr key={game.id}>
            <td>{new Date(game.finishedAt).toLocaleDateString()}</td>
            <td>
              {game.language} · {game.difficulty}
              {/* Not a footnote: an imported game can never be on a leaderboard, and the row it
                  sits in is the only place that fact is ever visible to its owner. */}
              {game.imported ? (
                <span className="dim" lang="en">
                  {' '}
                  · kept from a guest game
                </span>
              ) : null}
            </td>
            <td>{game.score}</td>
            <td>{game.words}</td>
            <td>{game.rounds}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
