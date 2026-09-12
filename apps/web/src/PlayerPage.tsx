import { useEffect, useState } from 'react'
import type { TieredIndex } from '@blinkered/words'
import { Avatar } from './Avatar.js'
import { GameDetail } from './GameDetail.js'
import { GamesTable } from './GamesTable.js'
import { playerGames, playerProfile } from './account.js'
import type { PlayedGame, PublicProfile } from './account.js'
import { countryName } from './countries.js'
import { goTo } from './route.js'

/**
 * Somebody's profile, as anybody sees it.
 *
 * The same three facts the account screen shows about you -- the picture, the name, the country
 * and the bio -- and the same list of games, because there is no second version of what a game
 * is. What it never carries is the address the account signs in with: the server returns a
 * `PublicProfile` rather than a `Profile` for exactly that reason, and the two types stay
 * separate so that whatever a profile gains next is not public by default.
 *
 * A missing name and a deleted account read the same, deliberately. Telling them apart would
 * make this page report who used to be here.
 */
export function PlayerPage({
  username,
  onHome,
}: {
  readonly username: string
  readonly onHome: () => void
}): React.JSX.Element {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [games, setGames] = useState<readonly PlayedGame[] | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let live = true
    setProfile(null)
    setGames(null)
    setMissing(false)
    void playerProfile(username).then((found) => {
      if (!live) return
      if (found === null) {
        setMissing(true)
        return
      }
      setProfile(found)
      void playerGames(username).then((played) => {
        if (live) setGames(played ?? [])
      })
    })
    return () => {
      live = false
    }
  }, [username])

  if (missing) {
    return (
      <div className="account-page">
        <HomeLink onHome={onHome} />
        <p className="signin-note is-bad" lang="en">
          There is nobody here by that name.
        </p>
      </div>
    )
  }
  if (profile === null) {
    return (
      <div className="account-page">
        <HomeLink onHome={onHome} />
        <p className="dim" lang="en">
          Reading the profile…
        </p>
      </div>
    )
  }

  return (
    <div className="account-page">
      <HomeLink onHome={onHome} />
      <header className="account-head">
        <Avatar seed={profile.avatarSeed} size={56} className="avatar-large" />
        <div>
          <h1 className="account-name">{profile.username}</h1>
          {profile.country === null ? null : (
            <p className="dim">{countryName(profile.country, 'en')}</p>
          )}
        </div>
      </header>
      {/* Text, and only ever text. React escapes by default and nothing here parses the string
          looking for links; see docs/ACCOUNTS.md on why the bio is never markup. */}
      {profile.bio === null ? null : <p className="player-bio">{profile.bio}</p>}

      <h2 lang="en">Games</h2>
      {games === null ? (
        <p className="dim" lang="en">
          Reading their games…
        </p>
      ) : games.length === 0 ? (
        <p className="dim" lang="en">
          Nothing here yet.
        </p>
      ) : (
        <GamesTable games={games} />
      )}
    </div>
  )
}

/**
 * One player's game, reached by its permalink.
 *
 * Thin on purpose: the detail view is the same component the account screen uses, because a
 * game is one thing and a second renderer for the public copy would eventually disagree with
 * the private one about what a round was.
 */
export function PlayedGamePage({
  id,
  dictionary,
  onHome,
}: {
  readonly id: string
  readonly dictionary: TieredIndex | null
  readonly onHome: () => void
}): React.JSX.Element {
  return (
    <div className="account-page">
      <HomeLink onHome={onHome} />
      <GameDetail id={id} dictionary={dictionary} onBack={undefined} />
    </div>
  )
}

function HomeLink({ onHome }: { readonly onHome: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      className="signin-again game-back"
      lang="en"
      onClick={() => {
        goTo({ at: 'game' })
        onHome()
      }}
    >
      ← Play Blinkered
    </button>
  )
}
