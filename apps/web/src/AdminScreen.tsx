import { useCallback, useEffect, useState } from 'react'
import { Avatar } from './Avatar.js'
import {
  deleteUser,
  editUser,
  findGames,
  findReports,
  findUsers,
  hideGame,
  readUser,
  resolveReport,
  trouble,
} from './admin.js'
import type { AdminGame, AdminReport, AdminUser, Answer } from './admin.js'
import { countryName } from './countries.js'
import { goTo } from './route.js'

/**
 * Moderation: accounts, boards, and the reports queue.
 *
 * What docs/ACCOUNTS.md asked for, in the shape it asked for: "an `is_admin` on `users` and an
 * admin panel behind it: delete and modify accounts, curate leaderboards, resolve the `reports`
 * rows that already have a table and nothing reading them. A moderation queue with no way to act
 * on it is the current state, and one delete route would not change that."
 *
 * **English, and deliberately so.** Every other screen in this app goes through
 * `@blinkered/i18n` in fifty-one languages, and the account screens were translated on purpose.
 * This one is not, because the audience is us: forty strings nobody outside the project will read
 * would cost fifty-one files apiece, forever, for no reader. That is a decision rather than a gap,
 * and the day somebody moderating Blinkered does not read English it becomes a wrong one.
 *
 * An overlay over the page rather than a screen replacing it, like the rules and the account
 * screen, and for the reason App.tsx gives about both: React unmounts what it replaces, and a
 * game underneath has to still be there when this closes.
 */

type Tab = 'accounts' | 'games' | 'reports'

const TABS: readonly { readonly id: Tab; readonly label: string }[] = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'games', label: 'Games' },
  { id: 'reports', label: 'Reports' },
]

/** How long to wait after the last keystroke before searching. As on the profile screen. */
const SEARCH_MS = 300

export function AdminScreen({
  me,
  onClose,
}: {
  /**
   * Which account is doing the moderating, or null for nobody.
   *
   * Used to stop the panel offering the two things the server refuses on your own row: granting
   * or removing your own admin flag, and marking yourself deleted. Both would 409, and a control
   * that exists only to be refused is worse than no control -- the same rule the report button
   * follows about your own profile.
   *
   * It is not a permission check. The column on the session is what decides, on every route.
   */
  readonly me: string | null
  readonly onClose: () => void
}): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('accounts')

  /**
   * How many reports are waiting, shown on the tab.
   *
   * Read once when the panel opens rather than polled. It is a number to draw an eye, not a
   * dashboard, and a queue that updated itself every few seconds would be a request every few
   * seconds for the life of an open tab.
   */
  const [waiting, setWaiting] = useState<number | null>(null)
  useEffect(() => {
    let live = true
    void findReports(true).then((answer) => {
      if (live && answer.ok) setWaiting(answer.value.length)
    })
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="rules-overlay account-screen">
      <div className="account-page admin-page">
        <header className="account-head">
          <div>
            <h1 className="account-name">Moderation</h1>
            <p className="dim">Accounts, boards, and what people have objected to</p>
          </div>
          <button type="button" className="btn account-close" onClick={onClose}>
            Back to the game
          </button>
        </header>

        <div className="account-tabs" role="tablist">
          {TABS.map((one) => (
            <button
              key={one.id}
              type="button"
              role="tab"
              aria-selected={tab === one.id}
              className={`account-tab${tab === one.id ? ' is-on' : ''}`}
              onClick={() => {
                setTab(one.id)
              }}
            >
              {one.label}
              {one.id === 'reports' && waiting !== null && waiting > 0 ? (
                <span className="admin-count">{waiting}</span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === 'accounts' ? <Accounts me={me} /> : null}
        {tab === 'games' ? <Games /> : null}
        {tab === 'reports' ? (
          <Reports
            onCount={(open) => {
              setWaiting(open)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

/* ---------- accounts ---------- */

function Accounts({ me }: { readonly me: string | null }): React.JSX.Element {
  const [search, setSearch] = useState('')
  const [found, setFound] = useState<Answer<readonly AdminUser[]> | null>(null)
  /** Which account is open, by id. The listing stays mounted underneath. */
  const [open, setOpen] = useState<string | null>(null)

  const look = useCallback((text: string) => {
    void findUsers(text).then(setFound)
  }, [])

  useEffect(() => {
    // Debounced, so a request is not sent per character. The empty search is the one this opens
    // on, and it lists the newest accounts rather than nothing: a moderation screen with an
    // empty state is a screen that has to be used before it shows anything.
    let live = true
    const timer = setTimeout(() => {
      if (live) look(search)
    }, SEARCH_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [search, look])

  if (open !== null) {
    return (
      <Account
        userId={open}
        me={me}
        onBack={() => {
          setOpen(null)
          look(search)
        }}
      />
    )
  }

  return (
    <div className="admin-lane">
      <label className="signin-field admin-search">
        <span>Search a username or a sign-in address</span>
        <input
          type="search"
          value={search}
          placeholder="trout, or nick@example.com"
          onChange={(event) => {
            setSearch(event.target.value)
          }}
        />
      </label>

      {found === null ? <p className="dim">Reading accounts…</p> : null}
      {found !== null && !found.ok ? (
        <p className="signin-note is-bad" role="alert">
          {trouble(found)}
        </p>
      ) : null}
      {found?.ok === true && found.value.length === 0 ? (
        <p className="dim">Nobody by that name or address.</p>
      ) : null}
      {found?.ok === true && found.value.length > 0 ? (
        <table className="account-games admin-table admin-accounts">
          {/* Declared widths rather than letting the longest sign-in address decide them: with
              `table-layout: fixed` these hold, and the two number columns stay next to the data
              they count instead of drifting to the far edge. */}
          <colgroup>
            <col className="is-who" />
            <col className="is-how" />
            <col className="is-count" />
            <col className="is-count" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Who</th>
              <th scope="col">Signs in with</th>
              <th scope="col">Games</th>
              <th scope="col">Joined</th>
            </tr>
          </thead>
          <tbody>
            {found.value.map((user) => (
              <tr key={user.userId} className={user.deletedAt === null ? undefined : 'is-gone'}>
                <td>
                  <button
                    type="button"
                    className="game-open admin-who"
                    onClick={() => {
                      setOpen(user.userId)
                    }}
                  >
                    <Avatar seed={user.avatarSeed} size={24} />
                    {/* Somebody else's text in somebody else's script. It never becomes markup
                        and it never becomes a link; the same rule the bio follows. */}
                    <span className="admin-name">{user.username}</span>
                  </button>
                  <Badges user={user} />
                </td>
                <td className="admin-identities">
                  {user.identities.length === 0
                    ? '—'
                    : user.identities.map((identity) => (
                        <span key={`${identity.provider}-${identity.email ?? ''}`}>
                          {identity.provider}
                          {identity.email === null ? '' : ` · ${identity.email}`}
                        </span>
                      ))}
                </td>
                <td>{user.games}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}

/** The two things worth saying about an account at a glance. */
function Badges({ user }: { readonly user: AdminUser }): React.JSX.Element | null {
  if (!user.isAdmin && user.deletedAt === null) return null
  return (
    <span className="admin-badges">
      {user.isAdmin ? <span className="admin-badge is-admin">admin</span> : null}
      {user.deletedAt === null ? null : <span className="admin-badge is-gone">deleted</span>}
    </span>
  )
}

/**
 * One account, and everything that can be done to it.
 *
 * The rename is the point of the screen, and docs/ACCOUNTS.md says why: a blocklist cannot work
 * across fifty-one languages, so what defends the namespace is a report button and the power to
 * rename an account and tell its owner why. The telling is still a thing a person does by hand.
 */
function Account({
  userId,
  me,
  onBack,
}: {
  readonly userId: string
  readonly me: string | null
  readonly onBack: () => void
}): React.JSX.Element {
  const [user, setUser] = useState<Answer<AdminUser> | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [said, setSaid] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [games, setGames] = useState<readonly AdminGame[]>([])

  const load = useCallback(() => {
    void readUser(userId).then((answer) => {
      setUser(answer)
      if (answer.ok) {
        setName(answer.value.username)
        setBio(answer.value.bio ?? '')
      }
    })
    void findGames({ user: userId }).then((answer) => {
      if (answer.ok) setGames(answer.value)
    })
  }, [userId])

  useEffect(load, [load])

  /** One place that runs a change, says what happened, and reloads. */
  const act = async (what: () => Promise<Answer<unknown>>, done: string): Promise<void> => {
    setBusy(true)
    setSaid(null)
    const answer = await what()
    setBusy(false)
    setSaid(answer.ok ? done : trouble(answer))
    if (answer.ok) load()
  }

  if (user === null) return <p className="dim">Reading the account…</p>
  if (!user.ok) {
    return (
      <div className="admin-lane">
        <BackLink onBack={onBack} />
        <p className="signin-note is-bad" role="alert">
          {trouble(user)}
        </p>
      </div>
    )
  }

  const it = user.value
  const gone = it.deletedAt !== null

  return (
    <div className="admin-lane">
      <BackLink onBack={onBack} />

      <header className="account-head">
        <Avatar seed={it.avatarSeed} size={56} className="avatar-large" />
        <div>
          <h2 className="account-name">
            {it.username} <Badges user={it} />
          </h2>
          <p className="dim">
            {it.games} {it.games === 1 ? 'game' : 'games'} · joined{' '}
            {new Date(it.createdAt).toLocaleDateString()}
            {it.country === null ? '' : ` · ${countryName(it.country, 'en')}`}
          </p>
        </div>
        {/* The page everybody else sees, which is the only way to check what it says. Absent for
            a marked account, whose public page is a 404 by design. */}
        {gone ? null : (
          <button
            type="button"
            className="signin-again account-close"
            onClick={() => {
              goTo({ at: 'player', username: it.username })
            }}
          >
            Public page →
          </button>
        )}
      </header>

      <dl className="admin-facts">
        <dt>Signs in with</dt>
        <dd>
          {it.identities.length === 0
            ? 'nothing, which should not be possible'
            : it.identities.map((identity) => (
                <span key={`${identity.provider}-${identity.email ?? ''}`} className="admin-line">
                  {identity.provider}
                  {identity.email === null ? '' : ` · ${identity.email}`}
                  {identity.email !== null && !identity.emailVerified ? ' (unverified)' : ''}
                </span>
              ))}
        </dd>
        <dt>Languages</dt>
        <dd>
          {it.uiLanguage ?? 'unset'} reading · {it.gameLanguage ?? 'unset'} playing
        </dd>
        {it.deletedAt === null ? null : (
          <>
            <dt>Marked deleted</dt>
            <dd>{new Date(it.deletedAt).toLocaleString()}</dd>
          </>
        )}
      </dl>

      <form
        className="account-form"
        onSubmit={(event) => {
          event.preventDefault()
          void act(
            () =>
              editUser(userId, {
                ...(name.trim() === it.username ? {} : { username: name.trim() }),
                ...(bio.trim() === (it.bio ?? '')
                  ? {}
                  : { bio: bio.trim() === '' ? null : bio.trim() }),
              }),
            'Saved.',
          )
        }}
      >
        <label className="signin-field">
          <span>Username</span>
          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
            }}
          />
        </label>
        <label className="signin-field">
          <span>Bio</span>
          <textarea
            className="account-bio"
            rows={2}
            value={bio}
            onChange={(event) => {
              setBio(event.target.value)
            }}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>

      {said === null ? null : (
        <p className="signin-note" role="status">
          {said}
        </p>
      )}

      {/*
        The two things the server refuses on the caller's own row, so the panel does not offer
        them there either.
        
        The flag first: nobody edits their own, which is what stops the power being something an
        admin panel can hand to itself. With sign-up never writing the column, every admin was
        made by somebody else and the first one by hand against the database. Deleting yourself
        is the other one, and it is a misclick that would cost the account able to undo it.
      */}
      {userId === me ? (
        <p className="dim admin-own">
          This is your own account. Another admin changes your flag or deletes you; the panel does
          not, and neither does the server.
        </p>
      ) : (
        <div className="admin-actions">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => {
              void act(
                () => editUser(userId, { isAdmin: !it.isAdmin }),
                it.isAdmin ? 'No longer an admin.' : 'Now an admin.',
              )
            }}
          >
            {it.isAdmin ? 'Remove admin' : 'Make admin'}
          </button>

          {/*
            Marked rather than reaped, which is what the column is for: a cascade fired from here
            has no way back if it was aimed at the wrong row. Marking ends their sessions and
            takes their profile and games down with it; the row stays until something reaps it.
          */}
          <button
            type="button"
            className={`btn${gone ? '' : ' is-danger'}`}
            disabled={busy}
            onClick={() => {
              void act(
                () => deleteUser(userId, !gone),
                gone ? 'Restored.' : 'Marked deleted. Their sessions are over.',
              )
            }}
          >
            {gone ? 'Restore account' : 'Mark deleted'}
          </button>
        </div>
      )}

      <h3>Their games</h3>
      {games.length === 0 ? (
        <p className="dim">Nothing played yet.</p>
      ) : (
        <GamesList
          games={games}
          onHidden={() => {
            load()
          }}
        />
      )}
    </div>
  )
}

/* ---------- games ---------- */

function Games(): React.JSX.Element {
  /*
   * Three filters, held as three strings rather than as one partial query object.
   *
   * The object version needed a key *removed* when a box was cleared, because
   * `exactOptionalPropertyTypes` is on and `{ language: undefined }` is not the same type as
   * `{}` -- and the only way to remove a computed key is a dynamic `delete`, which this
   * repository's lint rules refuse for good reasons. Three strings and one spread at the point of
   * use says the same thing with nothing to get wrong: `''` is "do not filter on it".
   */
  const [language, setLanguage] = useState('')
  const [difficulty, setDifficulty] = useState('')
  /** `''`, `'true'` or `'false'`, which is what the select holds. */
  const [shown, setShown] = useState('')
  const [found, setFound] = useState<Answer<readonly AdminGame[]> | null>(null)

  const look = useCallback(() => {
    void findGames({
      ...(language === '' ? {} : { language }),
      ...(difficulty === '' ? {} : { difficulty }),
      ...(shown === '' ? {} : { hidden: shown === 'true' }),
    }).then(setFound)
  }, [language, difficulty, shown])

  useEffect(look, [look])

  return (
    <div className="admin-lane">
      <p className="dim">
        In the order a board has them: score down, then rounds up, then oldest first. Nothing is
        leaderboard-eligible yet, because the server issues no seeds.
      </p>

      <div className="admin-filters">
        <label className="signin-field">
          <span>Language</span>
          <input
            type="text"
            value={language}
            placeholder="en"
            onChange={(event) => {
              setLanguage(event.target.value.trim())
            }}
          />
        </label>
        <label className="signin-field">
          <span>Difficulty</span>
          <select
            value={difficulty}
            onChange={(event) => {
              setDifficulty(event.target.value)
            }}
          >
            <option value="">any</option>
            {['easy', 'medium', 'hard', 'insane'].map((one) => (
              <option key={one} value={one}>
                {one}
              </option>
            ))}
          </select>
        </label>
        <label className="signin-field">
          <span>Shown</span>
          <select
            value={shown}
            onChange={(event) => {
              setShown(event.target.value)
            }}
          >
            {/* Absent means both, which is not the same as `false`: a screen that silently hid
                the hidden ones would be the one screen that cannot do its job. */}
            <option value="">all</option>
            <option value="false">visible</option>
            <option value="true">hidden</option>
          </select>
        </label>
      </div>

      {found === null ? <p className="dim">Reading games…</p> : null}
      {found !== null && !found.ok ? (
        <p className="signin-note is-bad" role="alert">
          {trouble(found)}
        </p>
      ) : null}
      {found?.ok === true && found.value.length === 0 ? (
        <p className="dim">No games match that.</p>
      ) : null}
      {found?.ok === true && found.value.length > 0 ? (
        <GamesList games={found.value} withOwner onHidden={look} />
      ) : null}
    </div>
  )
}

/**
 * Games, with the button that hides one.
 *
 * Hiding is the whole anti-cheat apparatus, as docs/ACCOUNTS.md has it: the server scores a
 * submission from its own words, which stops the thirty-second attack, and anything that survives
 * that is dealt with by somebody looking at it. Reversible, which is the reason it is a column
 * rather than a delete.
 */
function GamesList({
  games,
  withOwner,
  onHidden,
}: {
  readonly games: readonly AdminGame[]
  readonly withOwner?: boolean
  readonly onHidden: () => void
}): React.JSX.Element {
  const [busy, setBusy] = useState<string | null>(null)
  const [said, setSaid] = useState<string | null>(null)

  return (
    <>
      {said === null ? null : (
        <p className="signin-note is-bad" role="alert">
          {said}
        </p>
      )}
      <table className="account-games admin-table">
        <thead>
          <tr>
            <th scope="col">When</th>
            {withOwner === true ? <th scope="col">Who</th> : null}
            <th scope="col">Game</th>
            <th scope="col">Score</th>
            <th scope="col">Words</th>
            <th scope="col">Rounds</th>
            {/* `sr-only` rather than an empty cell: every cell in this column is a control, so
                the column needs a name even though the buttons say what they do. */}
            <th scope="col">
              <span className="sr-only">Shown</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id} className={game.hidden ? 'is-gone' : undefined}>
              <td>
                <button
                  type="button"
                  className="game-open"
                  onClick={() => {
                    goTo({ at: 'played-game', id: game.id })
                  }}
                >
                  {new Date(game.finishedAt).toLocaleDateString()}
                </button>
              </td>
              {withOwner === true ? (
                <td>
                  <span className="admin-name">{game.owner.username}</span>
                </td>
              ) : null}
              <td>
                {game.language} · {game.difficulty}
                {game.canonical ? '' : ' · edited rules'}
                {game.imported ? ' · imported' : ''}
              </td>
              <td>{game.score}</td>
              <td>{game.words}</td>
              <td>{game.rounds}</td>
              <td>
                <button
                  type="button"
                  /*
                   * Not `is-danger`, deliberately, though hiding is the destructive direction.
                   * A column of red buttons makes red the resting state of every row, and then
                   * it has stopped marking anything. The red is spent on `Mark deleted`, which
                   * is one button on one account.
                   */
                  className="btn admin-small"
                  disabled={busy === game.id}
                  onClick={() => {
                    setBusy(game.id)
                    setSaid(null)
                    void hideGame(game.id, !game.hidden).then((answer) => {
                      setBusy(null)
                      if (answer.ok) onHidden()
                      else setSaid(trouble(answer))
                    })
                  }}
                >
                  {game.hidden ? 'Show' : 'Hide'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

/* ---------- reports ---------- */

/** What each objection is about, in words a queue can be read in. */
const ABOUT: Readonly<Record<string, string>> = {
  username: 'the name',
  bio: 'the bio',
  score: 'the score',
}

function Reports({ onCount }: { readonly onCount: (open: number) => void }): React.JSX.Element {
  const [openOnly, setOpenOnly] = useState(true)
  const [found, setFound] = useState<Answer<readonly AdminReport[]> | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const look = useCallback(() => {
    void findReports(openOnly).then((answer) => {
      setFound(answer)
      // The tab's count is the open ones, whichever list is showing.
      if (answer.ok && openOnly) onCount(answer.value.length)
      else if (answer.ok) onCount(answer.value.filter((one) => one.resolvedAt === null).length)
    })
  }, [openOnly, onCount])

  useEffect(look, [look])

  return (
    <div className="admin-lane">
      <div className="account-tabs admin-subtabs" role="tablist">
        {[
          { open: true, label: 'Waiting' },
          { open: false, label: 'Everything' },
        ].map((one) => (
          <button
            key={one.label}
            type="button"
            role="tab"
            aria-selected={openOnly === one.open}
            className={`account-tab${openOnly === one.open ? ' is-on' : ''}`}
            onClick={() => {
              setOpenOnly(one.open)
            }}
          >
            {one.label}
          </button>
        ))}
      </div>

      {found === null ? <p className="dim">Reading the queue…</p> : null}
      {found !== null && !found.ok ? (
        <p className="signin-note is-bad" role="alert">
          {trouble(found)}
        </p>
      ) : null}
      {found?.ok === true && found.value.length === 0 ? (
        <p className="dim">
          {openOnly ? 'Nothing waiting.' : 'Nobody has objected to anything yet.'}
        </p>
      ) : null}

      {found?.ok === true
        ? found.value.map((report) => (
            <article
              key={report.id}
              className={`admin-report${report.resolvedAt === null ? '' : ' is-done'}`}
            >
              <header>
                <h3>
                  {ABOUT[report.field] ?? report.field} of{' '}
                  <span className="admin-name">
                    {report.subjectUser?.username ?? 'somebody gone'}
                  </span>
                </h3>
                <p className="dim">
                  {/* Nullable because the column is: a report outlives the account that filed
                      it, and the objection is still worth reading afterwards. */}
                  from {report.reporter?.username ?? 'a deleted account'} ·{' '}
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </header>

              {/* Text, and only ever text, like the bio. React escapes by default and nothing
                  here looks for links. */}
              {report.reason === null ? (
                <p className="dim">No reason given.</p>
              ) : (
                <p className="admin-reason">{report.reason}</p>
              )}

              <footer className="admin-actions">
                {report.subjectUser === null ? null : (
                  <button
                    type="button"
                    className="signin-again"
                    onClick={() => {
                      goTo({ at: 'player', username: report.subjectUser?.username ?? '' })
                    }}
                  >
                    Their page →
                  </button>
                )}
                {report.subjectGame === null ? null : (
                  <button
                    type="button"
                    className="signin-again"
                    onClick={() => {
                      goTo({ at: 'played-game', id: report.subjectGame?.id ?? '' })
                    }}
                  >
                    The game, {report.subjectGame.score} points →
                  </button>
                )}
                <button
                  type="button"
                  className="btn admin-small"
                  disabled={busy === report.id}
                  onClick={() => {
                    setBusy(report.id)
                    void resolveReport(report.id, report.resolvedAt === null).then(() => {
                      setBusy(null)
                      look()
                    })
                  }}
                >
                  {report.resolvedAt === null ? 'Done with it' : 'Reopen'}
                </button>
              </footer>
            </article>
          ))
        : null}
    </div>
  )
}

function BackLink({ onBack }: { readonly onBack: () => void }): React.JSX.Element {
  return (
    <button type="button" className="signin-again game-back" onClick={onBack}>
      ← All accounts
    </button>
  )
}
