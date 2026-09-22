import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ENGINE_VERSION, alphabetFor } from '@blinkered/engine'
import type { Effect, GameEvent, GameResult, GameState } from '@blinkered/engine'
import { format, messagesFor } from '@blinkered/i18n'
import type { Messages } from '@blinkered/i18n'
import type { TieredIndex } from '@blinkered/words'
import { Board, HIDE_MS } from './Board.js'
import { LetterSwap, SWAP_MS } from './LetterSwap.js'
import type { Swap } from './LetterSwap.js'
import { TooFewLetters } from './TooFewLetters.js'
import { GameSetup } from './GameSetup.js'
import { Tutorial } from './Tutorial.js'
import { HowToPlay } from './HowToPlay.js'
import { HowToPlayLink } from './HowToPlayLink.js'
import { Hud, countOf, formatFinalResult } from './Hud.js'
import { Icon } from './Icon.js'
import type { Feedback, WordGain } from './Hud.js'
import { Dropdown } from './Dropdown.js'
import { LanguagePicker } from './LanguagePicker.js'
import { BoardStanding } from './BoardStanding.js'
import { PersonalBest } from './PersonalBest.js'
import { LeaderboardPage } from './LeaderboardPage.js'
import { NerdPanel } from './NerdPanel.js'
import { Splash } from './Splash.js'
import { Title } from './Title.js'
import { loadCatalogue, loadDictionary } from './dictionary.js'
import { overFixture } from './fixtures.js'
import type { CatalogueEntry } from './dictionary.js'
import { useFocusRelease, withoutStealingFocus } from './focus.js'
import { Share } from './Share.js'
import { AccountMenu } from './AccountMenu.js'
import type { Destination } from './AccountMenu.js'
import { AboutPage } from './AboutPage.js'
import { AccountScreen } from './AccountScreen.js'
import { AdminScreen } from './AdminScreen.js'
import { SignInDialog } from './SignInDialog.js'
import { clearSignInParam, returnedFromSso, ssoProblem } from './sso.js'
import { draftKept, routeOfDraft } from './reportDraft.js'
import { drainGames, saveProfile, signOut, whoAmI } from './account.js'
import { claim, enqueue } from './pendingGames.js'
import { dismissTour, tourDismissed } from './visit.js'
import { useFitRow } from './fitRow.js'
import { cached } from './identity.js'
import type { Account, BoardAtRound, GameToKeep, Identity } from './account.js'
import { isNativeApp } from './platform.js'
import { PlayedGamePage, PlayerPage } from './PlayerPage.js'
import { goTo, routeOf, urlOf } from './route.js'
import type { Route } from './route.js'
import { isPersonalBest, recordScore, standingOf } from './scores.js'
import { spellingFor } from './spelling.js'
import type { Standing } from './scores.js'
import {
  configOf,
  isCanonical,
  THEMES,
  applyTheme,
  loadSettings,
  saveSettings,
  withOverride,
  withNerdMode,
  withRuleset,
} from './settings.js'
import type { Ruleset, Settings } from './settings.js'
import { useGame } from './useGame.js'
import type { GameSpec } from './useGame.js'
import { ignoredByManagers } from './autofill.js'

/**
 * A game is set up, played, and then over. Nothing starts on its own.
 *
 * `setup` is where the game-time choices are made and where the rules can be edited; `playing`
 * locks all of them, because a game whose rules changed underneath it cannot honestly be ranked
 * against anything; `over` shows where the game came and offers the same choices again.
 */
type Phase = 'setup' | 'playing' | 'over'

/** What a finished game leaves behind, once the board itself is gone. */
interface Finished {
  readonly result: GameResult
  readonly standing: Standing
  readonly words: readonly { word: string; points: number }[]
  /**
   * Everything the server needs in order to keep this game, assembled while the facts are still
   * in hand.
   *
   * Optional because the development fixture invents a finished game without ever having dealt
   * one, so it has no board and no ruleset to send. A game with nothing to keep simply is not
   * offered, which is the honest answer rather than a disabled button.
   *
   * Note what is not in it: a score. `wordScore` is a function of tile count and nothing else,
   * so the words are sufficient and the server does its own addition. See docs/ACCOUNTS.md.
   */
  readonly keepable?: GameToKeep
}

export function App(): React.JSX.Element {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [catalogue, setCatalogue] = useState<readonly CatalogueEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const messages = useMemo(() => messagesFor(settings.uiLanguage), [settings.uiLanguage])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // The palette, whenever it changes. `index.html` has already applied the stored one before the
  // first paint; this is what makes choosing a different one take effect without a reload.
  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  // The interface language belongs on the document too, or a screen reader announces Greek in
  // an English voice and the browser hyphenates Finnish by English rules. With it goes the
  // direction, which flips the whole layout: every physical offset in the stylesheet is written
  // as a logical one, so the page mirrors from this line alone.
  useEffect(() => {
    document.documentElement.lang = settings.uiLanguage
    document.documentElement.dir = alphabetFor(settings.uiLanguage).direction
  }, [settings.uiLanguage])

  useEffect(() => {
    const controller = new AbortController()
    loadCatalogue(controller.signal)
      .then(setCatalogue)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      controller.abort()
    }
  }, [])

  if (error !== null) {
    return (
      <main className="shell centered">
        <h1 lang="en">Blinkered</h1>
        <p className="error">{error}</p>
      </main>
    )
  }
  if (catalogue === null) {
    return (
      <main className="shell centered">
        <h1 lang="en">Blinkered</h1>
        <p className="dim">{messages.readingDictionary}</p>
      </main>
    )
  }
  return (
    <Session catalogue={catalogue} settings={settings} messages={messages} onChange={setSettings} />
  )
}

/** Loads the dictionary for a language, and reports honestly while it is doing so. */
function useDictionary(
  language: string,
  messages: Messages,
): { dictionary: TieredIndex | null; error: string | null } {
  const [dictionary, setDictionary] = useState<TieredIndex | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setDictionary(null)
    setError(null)
    loadDictionary(language, messages, controller.signal)
      .then(setDictionary)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      controller.abort()
    }
    // `messages` only supplies the wording of a failure. Re-fetching a dictionary because
    // somebody changed interface language would be silly.
  }, [language])

  return { dictionary, error }
}

function Session({
  catalogue,
  settings,
  messages,
  onChange,
}: {
  catalogue: readonly CatalogueEntry[]
  settings: Settings
  messages: Messages
  onChange: (next: Settings) => void
}): React.JSX.Element {
  // A stored game language this deployment has no list for falls back to one it does have,
  // rather than to a loading state that never finishes.
  const language = catalogue.some((entry) => entry.tag === settings.gameLanguage)
    ? settings.gameLanguage
    : (catalogue[0]?.tag ?? settings.gameLanguage)

  const { dictionary, error } = useDictionary(language, messages)

  /*
   * Whether anybody is signed in, asked once on load.
   *
   * Null covers signed out and no API at all, which is deliberate: a build served without one is
   * still a game, and refusing to start because it could not learn that nobody is signed in
   * would be a poor trade. The panel below simply offers to sign in, and the offer fails
   * honestly if there is nothing behind it.
   */
  /*
   * Seeded from the cache, then confirmed or corrected by `whoAmI`.
   *
   * Starting at null and waiting would render every load as signed out for as long as the round
   * trip takes, which on the website is a flicker and in the native shell with no network is
   * however long the platform takes to give up on a connection -- long enough to start a game
   * in. That window is also what decides `beganAsGuest` below, so a slow answer would file a
   * signed-in player's game as a guest import.
   *
   * Optimistic, and safe because it is overwritten: a 401 clears both this and the cache.
   */
  const [account, setAccount] = useState<Account | null>(() => cached())
  /**
   * Whether the last attempt to reach the API went unanswered.
   *
   * Separate from `account` because the two are independent: somebody can be offline and signed
   * in (the interesting case, and the one this exists for), offline and signed out, or online
   * and either. Collapsing them is what made an offline session render as a sign-out.
   *
   * Only ever set from an `Identity`, so there is one place that decides it.
   */
  const [offline, setOffline] = useState(false)
  /** Open, and why. The reason is shown in the dialog; `null` means it is not open. */
  const [signingIn, setSigningIn] = useState<{ reason?: string } | null>(null)

  /*
   * The title bar, measured so it stays one row. See `fitRow.ts`.
   *
   * The signature is what changes the words in it: the language changes every label at once, and
   * an account swaps a Sign in button for an avatar, which is 35 pixels the row gets back.
   */
  const titlebar = useRef<HTMLDivElement>(null)
  const fit = useFitRow(titlebar, `${settings.uiLanguage}|${account === null ? 'out' : 'in'}`)
  /**
   * Whether the wordmark is down to its single tile, which is when its animation stops earning.
   *
   * Nick, on a phone: "a B appears, gets highlighted, a few seconds later it slides around and
   * comes back as a B." Which is exactly what nine tiles shuffling look like when the stylesheet
   * is showing one of them. Measured rather than guessed at a width, because the step it happens
   * at is different in every language -- see `fitRow.ts`.
   */
  const markOnly = fit.includes('mark')

  /*
   * Coming back from Apple or Google.
   *
   * The callback is a server redirect to `/?signin=<reason>`, so this runs on an ordinary page
   * load and has to be harmless on every load that is not one. Success needs nothing done to it:
   * the session cookie is already set, and the `whoAmI()` on arrival finds the account the same
   * way it does after a reload. Only a failure has anything to say, and it says it by reopening
   * the dialog the person was last looking at.
   *
   * The parameter is stripped either way, so a refresh does not repeat the message and Back does
   * not return to something that looks like a second attempt.
   */
  useEffect(() => {
    const returned = returnedFromSso(globalThis.location.search)
    if (returned === null) return
    clearSignInParam()
    if (!returned.ok) {
      setSigningIn({ reason: ssoProblem(messages, returned.reason) })
      return
    }
    /*
     * Back to the page the sign-in was for, when it was for one.
     *
     * The callback redirects to `/?signin=ok` rather than to wherever the reader was, which is
     * the server keeping its redirect simple and is the right call: a return path in a query
     * parameter is an open redirect waiting to be written. So the thing that remembers is the
     * half-written report itself, which knows its own subject and therefore its own address.
     *
     * Only for a report, deliberately. Signing in from somebody's profile for any other reason
     * still lands on the game, which is a rougher edge than this one and a separate decision.
     */
    const draft = draftKept()
    if (draft === null) return
    const back = routeOfDraft(draft)
    // Both, as every other in-app move does: `goTo` fires `popstate` for the address bar, and
    // the listener that answers it is not attached until after this effect has run.
    goTo(back)
    setRoute(back)
  }, [])
  const [visiting, setVisiting] = useState<Destination | null>(null)
  /**
   * Whether the account on screen has just been deleted.
   *
   * Held here rather than in the account screen because the screen unmounts the moment `account`
   * is null, so the panel cannot both announce the deletion and be the thing that triggers
   * forgetting it. This defers the forgetting to whenever the screen is closed.
   */
  const [deletedAccount, setDeletedAccount] = useState(false)

  /*
   * Where the address bar points.
   *
   * Two public shapes, `/g/<id>` and `/u/<name>`, and everything else is the game. Read from
   * `location` on arrival and kept in step with Back and Forward through `popstate`, which
   * `goTo` also fires so that a link inside the app moves the page without a reload.
   */
  const [route, setRoute] = useState<Route>(() => routeOf(globalThis.location.pathname))
  useEffect(() => {
    const onPop = (): void => {
      setRoute(routeOf(globalThis.location.pathname))
    }
    globalThis.addEventListener('popstate', onPop)
    return () => {
      globalThis.removeEventListener('popstate', onPop)
    }
  }, [])

  /*
   * Taking an account on, which is more than remembering it.
   *
   * docs/ACCOUNTS.md: the account is authoritative on sign-in and `localStorage` is authoritative
   * while signed out. So both languages come down from the account when a session starts and
   * overwrite what this device had. Any other rule produces a device that quietly disagrees with
   * the account and a player who cannot tell which one they are editing.
   *
   * A field the account has never been given stays null and is left alone, so a brand-new
   * account does not reset the language somebody picked before they signed up.
   */
  const adopt = useCallback(
    (identity: Identity): void => {
      setOffline(identity.state === 'offline')
      if (identity.state === 'signed-out') {
        setAccount(null)
        return
      }
      const found = identity.account
      setAccount(found)
      /*
       * Languages come down from the account on a live answer only.
       *
       * The rule above is that the account wins on sign-in. An `offline` answer is not a sign-in:
       * it is this device remembering one, and those languages were already adopted when it was
       * live. Applying them again would overwrite a language somebody picked while offline with
       * the one the cache happens to hold, which is the device disagreeing with itself rather
       * than with the account.
       */
      if (identity.state !== 'signed-in') return
      const ui = identity.account.uiLanguage
      const game = identity.account.gameLanguage
      if (ui === null && game === null) return
      onChange({
        ...settings,
        ...(ui === null ? {} : { uiLanguage: ui }),
        ...(game === null ? {} : { gameLanguage: game }),
      })
    },
    [onChange, settings],
  )

  /*
   * Asked once, on arrival.
   *
   * A ref rather than an empty dependency array, because `adopt` closes over the settings and so
   * changes identity whenever anything in them does. An honest dependency list would therefore
   * ask the server who we are every time somebody moved a slider; an empty one would be a lie
   * about what the effect uses. The flag says what is actually meant, which is that this happens
   * once per page load.
   */
  const asked = useRef(false)
  useEffect(() => {
    if (asked.current) return
    asked.current = true
    void whoAmI().then(adopt)
  }, [adopt])
  /*
   * `?fixture=over` opens straight onto the game-over panel with a canned game behind it, because
   * reaching that panel for real is several minutes of deliberately playing badly. The components
   * and the leaderboard logic are the real ones; only the game that preceded them is invented.
   *
   * Development only, and `import.meta.env.DEV` is what keeps it out of a production bundle
   * entirely. A URL that fakes a finished game is a URL that fakes a personal best, and
   * screenshots travel. See fixtures.ts for the parameters.
   */
  const fixture = import.meta.env.DEV ? overFixture(globalThis.location.search) : null
  const [phase, setPhase] = useState<Phase>(fixture === null ? 'setup' : 'over')
  const [spec, setSpec] = useState<GameSpec | null>(null)
  const [finished, setFinished] = useState<Finished | null>(fixture)

  // The wordmark deals itself as a hand of Blinkered on arrival. Pressing Start during it hurries
  // it along rather than cutting it off, so the game begins on a title that reads BLINKERED.
  /**
   * The app's opening, in the shell only.
   *
   * `isNativeApp()` at mount rather than a setting: a website should show somebody the game, and
   * an app has a launch moment to fill. Reachable exactly once per launch, which in a WebView with
   * no address bar means once.
   */
  const [splash, setSplash] = useState(() => isNativeApp())
  const [titleDone, setTitleDone] = useState(false)
  const [hurried, setHurried] = useState(false)
  const [waitingToStart, setWaitingToStart] = useState(false)
  // Only ever true in the native shell, which has no second tab to put the rules in. On the web
  // the link is a link and this stays false forever.
  const [readingRules, setReadingRules] = useState(false)
  /*
   * Closing the tour without ticking the box has to hold for this visit, or the tour reopens the
   * instant it closes: `tutorialSeen` stays false on purpose in that case, since "not now" and
   * "never again" are different answers and only the box means the second one.
   *
   * **"This visit" outlives a page load, which this used to get wrong.** It was React state, so
   * signing in with Google reopened the tour: that round trip is a full page navigation, the
   * state went with the page, and somebody who had dismissed the tour and then signed in to keep
   * a game landed back on its first screen. `sessionStorage` has exactly the right lifetime; see
   * `visit.ts`.
   */
  const [tourDone, setTourDone] = useState(tourDismissed)

  const config = useMemo(() => configOf(settings), [settings])
  const playing = phase === 'playing'
  const nerdFocus = useFocusRelease()

  /*
   * When the game on screen began.
   *
   * A ref rather than state, because nothing renders from it: it is written once when a game
   * starts and read once when it ends. The server takes it as the client's claim and nothing
   * more — an imported game is never leaderboard-eligible, so this is a fact about somebody's
   * own history rather than a number anything is checked against.
   */
  const startedAt = useRef(0)
  /**
   * Whether nobody was signed in when the game on screen began.
   *
   * Read here rather than at the end, because by then it may have changed: signing up on the
   * game-over panel is the whole point of that panel, and the account exists by the time the
   * game is sent. This is what makes `games.imported` mean what the schema says it means.
   */
  const beganAsGuest = useRef(true)

  const begin = useCallback((): void => {
    setFinished(null)
    startedAt.current = Date.now()
    beganAsGuest.current = account === null
    setSpec({ config, seed: freshSeed() })
    setPhase('playing')
  }, [account, config])

  const start = (): void => {
    if (titleDone) {
      begin()
      return
    }
    setHurried(true)
    setWaitingToStart(true)
  }

  useEffect(() => {
    if (!waitingToStart || !titleDone) return
    setWaitingToStart(false)
    begin()
  }, [waitingToStart, titleDone, begin])

  const quit = (): void => {
    // A quit is not a result. A game abandoned at a good score is not a good game.
    setSpec(null)
    setPhase('setup')
  }

  const onFinish = useCallback(
    (state: GameState, seed: number, boards: readonly BoardAtRound[], stopped: boolean): void => {
      const result: GameResult = {
        score: state.score,
        words: state.wordsFound.length,
        rounds: state.roundIndex + 1,
        language,
        difficulty: settings.difficulty,
        canonical: isCanonical(settings),
        at: Date.now(),
        seed,
        engineVersion: ENGINE_VERSION,
        // Which build of the word list this was played against, read off the dictionary in
        // hand rather than looked up, so it cannot describe a different one. Spread rather
        // than defaulted: no dictionary means the field is absent, which is the honest
        // answer, and a game cannot have been finished without one anyway.
        ...(dictionary === null ? {} : { dictionaryVersion: dictionary.digest }),
      }
      const stored = recordScore(result)
      setFinished({
        result,
        standing: standingOf(stored, result, {
          language,
          difficulty: settings.difficulty,
          engineVersion: ENGINE_VERSION,
        }),
        words: state.wordsFound,
        keepable: {
          startedAt: startedAt.current,
          finishedAt: result.at,
          seed,
          difficulty: settings.difficulty,
          // The shell and the browser write the same row and say which they were, because
          // "where was this played" is a question a history is asked and an engine version
          // cannot answer.
          source: isNativeApp() ? 'ios' : 'web',
          guest: beganAsGuest.current,
          /*
           * Whether the clock ever stopped, which is what costs a game its place on a board.
           *
           * Reported by the client, like everything else in phase A, and worth exactly what the
           * client is worth: the point is not that it cannot be lied about but that the honest
           * path is closed -- screen-cap, pause, read the photograph, resume. Phase C's event log
           * is what makes it checkable rather than reported.
           */
          paused: stopped,
          // The whole ruleset, not the difficulty label. A label's meaning changes -- medium has
          // been retuned once already -- and a row carrying its own numbers stays explainable
          // after the next retune.
          config,
          boards,
          // Everything the engine already knew about each word. It costs nothing to send -- the
          // reducer computed all of it during play -- and it is what turns a history from a
          // receipt into something worth opening twice.
          words: state.wordsFound.map((found) => ({
            word: found.word,
            round: found.roundIndex,
            flips: found.flips,
            tick: found.tick,
            ...(found.wilds.length === 0 ? {} : { wilds: found.wilds }),
          })),
          rounds: result.rounds,
          ...(dictionary === null ? {} : { dictionaryVersion: dictionary.digest }),
        },
      })
      setPhase('over')
    },
    [config, dictionary, language, settings],
  )

  /*
   * A finished game reaches the server the moment there is somebody to attach it to.
   *
   * One effect rather than two paths, and that is what makes the game-over sign-up work: playing
   * signed in keeps the game as it ends, and signing in *on* the game-over panel keeps the game
   * that is still on screen, because both are the same two facts becoming true. Nothing
   * anonymous is ever uploaded — no account, no request.
   *
   * The ref holds the payload rather than a flag, so a second game in the same session is kept
   * too while the one already sent is not sent twice.
   */
  const kept = useRef<GameToKeep | null>(null)
  /**
   * The id the server gave this game, once it has one.
   *
   * What makes Share a permalink rather than an advertisement. Null for a guest, because a
   * guest's game is not on the server and there is nothing to link to -- the Keep this game
   * button beside it is the offer to change that.
   */
  const [keptId, setKeptId] = useState<string | null>(null)
  /*
   * Queue the finished game, then try to empty the queue.
   *
   * Two steps rather than one upload, and the order is the point: the game is on the device
   * before anything is attempted, so a failed send is a game that waits rather than a game that
   * is gone. This used to be a single `keepGame`, whose comment read "Nothing is shown if this
   * fails. The game is in `localStorage` either way" -- true, and it stayed there forever,
   * because nothing tried again.
   *
   * Still silent on failure, for the reason that comment gave: an error about a background upload
   * on top of somebody's final score is noise at the worst moment. The difference is that it is
   * now silent and pending rather than silent and lost.
   *
   * The drain sends everything waiting, not only this game, which is what makes "uploaded at the
   * completion of the next connected game" true without a second mechanism.
   */
  useEffect(() => {
    const keepable = finished?.keepable
    if (keepable === undefined || kept.current === keepable) return
    kept.current = keepable
    setKeptId(null)
    /*
     * Queued whether or not anybody is signed in, which is the fix for a real bug.
     *
     * This used to require an account, so a guest's game was only ever queued at the moment they
     * signed in -- reached from `finished`, which is React state. Signing in with Google or Apple
     * is a **full page navigation**: away to the provider and back to `/?signin=ok`, with the app
     * torn down and rebuilt in between. By the time the account existed the finished game did
     * not, so the upload effect found nothing and did nothing, silently. The email code kept the
     * page alive and so happened to work, which is why this survived.
     *
     * An unclaimed entry outlives the round trip because it is in `localStorage`, and `claim`
     * below hands it to whoever arrives.
     */
    const mine = enqueue(account?.userId ?? null, keepable)
    if (account === null) return
    void drainGames(account.userId).then((drained) => {
      // Only this game's id reaches the screen. The others were queued on earlier visits and
      // have nothing on screen to point at.
      const id = drained.stored.get(mine.key)
      if (id !== undefined) setKeptId(id)
    })
  }, [account, finished])

  /*
   * The other two moments a queue can empty, both of them cheap because a drain with nothing
   * waiting sends no requests at all.
   *
   * `online` is the browser telling us the interface came back, which is the closest thing to
   * "an internet connection is restored" that a page gets. It is not reliable on its own -- it
   * fires for a connection that turns out to lead nowhere -- and it does not have to be, because
   * an attempt that fails leaves the queue exactly as it was.
   *
   * On mount covers the case `online` cannot: the app was closed with games waiting and opened
   * again somewhere with a connection, so there was never a transition to hear about.
   */
  useEffect(() => {
    if (account === null) return undefined
    const userId = account.userId
    const flush = (): void => {
      /*
       * Claim first, then send.
       *
       * This is where a guest's game finds its owner, and it runs whenever an account appears --
       * a code typed into the dialog, or a return from a provider that rebuilt the whole app. The
       * second case is the one that was broken: there is no `finished` to read on that load, and
       * this effect needs none.
       */
      claim(userId)
      void drainGames(userId)
    }
    flush()
    globalThis.addEventListener('online', flush)
    return () => {
      globalThis.removeEventListener('online', flush)
    }
  }, [account])

  const setup = (startLabel: string): React.JSX.Element => (
    <GameSetup
      settings={settings}
      messages={messages}
      ready={dictionary !== null && !waitingToStart}
      startLabel={startLabel}
      onRuleset={(ruleset: Ruleset) => {
        onChange(withRuleset(settings, ruleset))
      }}
      onStart={start}
    />
  )

  return (
    <>
      {/*
       * The rules in the native shell, drawn over the top rather than in place of the game.
       *
       * Returning them instead of the shell was the first attempt and it was wrong: React
       * unmounts what it replaces, so `Playing` went with it, and coming back mounted a fresh
       * game on the same seed. The player lost the word they were holding and the board started
       * over, which is worse than the dropped link this exists to fix. Rendering both keeps the
       * game mounted, so it is still there, still paused, still holding its selection.
       */}
      {/*
       * The tour, over the setup screen rather than in place of it.
       *
       * Only on a phase where there is no game to interrupt, and only while it has not been
       * dismissed for good. Rendered before the shell so it is the first thing in the document
       * for a screen reader, and over it so the setup screen is already there when it closes:
       * finishing the tour should reveal the choice it just described, not navigate to it.
       */}
      {/*
        `route.at === 'game'` is not decoration. Somebody following a shared permalink is in
        `setup` too -- they have not started a game, because they did not come to play one -- so
        without it the welcome tour opens on top of the game they were sent to look at.
      */}
      {splash ? (
        <Splash
          onDone={() => {
            setSplash(false)
          }}
        />
      ) : null}

      {!settings.tutorialSeen && !tourDone && phase === 'setup' && route.at === 'game' ? (
        <Tutorial
          messages={messages}
          language={language}
          catalogue={catalogue}
          onLanguage={(tag) => {
            // Both, the same way the setup screen's picker sets both: the tour is read and
            // played at once, so its board and its words are the same choice.
            onChange({ ...settings, gameLanguage: tag, uiLanguage: tag })
          }}
          onSignIn={() => {
            setSigningIn({})
          }}
          onDone={(hideAgain) => {
            onChange({ ...settings, tutorialSeen: hideAgain })
            // Both: the setting is "never again" and only the box sets it, and this is "not now",
            // which has to survive a reload without becoming permanent.
            dismissTour()
            setTourDone(true)
          }}
        />
      ) : null}

      {signingIn === null ? null : (
        <SignInDialog
          messages={messages}
          {...(signingIn.reason === undefined ? {} : { reason: signingIn.reason })}
          onSignedIn={(found) => {
            adopt({ state: 'signed-in', account: found })
            setSigningIn(null)
          }}
          onClose={() => {
            setSigningIn(null)
          }}
        />
      )}

      {/*
        The profile and the games, over the page rather than in place of it — the same rule the
        rules overlay follows below, and for the same reason: React unmounts what it replaces,
        and a game underneath has to still be there when this closes.
      */}
      {visiting === null || account === null ? null : (
        <AccountScreen
          messages={messages}
          account={account}
          at={visiting}
          catalogue={catalogue}
          readIn={settings.uiLanguage}
          dictionary={dictionary}
          onAccount={(saved) => {
            adopt({ state: 'signed-in', account: saved })
          }}
          onDeleted={() => {
            /*
             * Noted rather than acted on, and that is not squeamishness -- it is that this screen
             * only renders while `account` is set, so clearing it here would unmount the very
             * panel that says the account is gone. Found by wiring it the obvious way first.
             *
             * There is nothing to sign out of either way: the session row went with the account
             * and the cookie it presented is already dead. What is left is the interface still
             * remembering somebody, and `onClose` below forgets them however the screen is
             * dismissed.
             */
            setDeletedAccount(true)
          }}
          onTab={setVisiting}
          onSignIn={() => {
            setSigningIn({})
          }}
          onClose={() => {
            setVisiting(null)
            // Whichever way they left -- the header button or the one under the message -- this
            // is where the interface stops remembering a deleted account.
            if (deletedAccount) {
              setDeletedAccount(false)
              setAccount(null)
            }
          }}
        />
      )}

      {/*
        A permalink, over everything.
        
        Over rather than instead of, like the rules and the account screen, and for the reason
        App.tsx already gives about both: React unmounts what it replaces, and the game
        underneath has to still be there when this closes. Arriving directly at one of these is
        the common case, and then there is nothing underneath yet, which costs nothing.
      */}
      {/*
        Moderation, which draws its own overlay rather than sharing the one below.
        
        Separate because it is wider than a profile and because it is not one of the two public
        pages: those two are a pair, reached by a shared link, and pretending this is a third of
        them would mean one component branching three ways on which audience it has.
      */}
      {route.at === 'admin' ? (
        <AdminScreen
          me={account?.userId ?? null}
          onClose={() => {
            goTo({ at: 'game' })
            setRoute({ at: 'game' })
          }}
        />
      ) : null}

      {route.at === 'game' || route.at === 'admin' ? null : (
        <div className="rules-overlay account-screen">
          {route.at === 'about' ? (
            /* In the overlay with the other public pages, for the same reason: it is reached by a
               link, from the rules page and from the account menu, and it draws over the game
               rather than instead of it. */
            <AboutPage
              messages={messages}
              onHome={() => {
                goTo({ at: 'game' })
                setRoute({ at: 'game' })
              }}
            />
          ) : route.at === 'board' ? (
            /*
             * A board belongs in this overlay with the other two public pages: all three are
             * reached by a shared link, all three draw over the game rather than instead of it.
             * The note above about not making a third of a pair was about the moderation panel,
             * which has a different audience; this has exactly theirs.
             */
            <LeaderboardPage
              language={route.language}
              difficulty={route.difficulty}
              catalogue={catalogue}
              myUsername={account?.username ?? null}
              onHome={() => {
                setRoute({ at: 'game' })
              }}
            />
          ) : route.at === 'player' ? (
            <PlayerPage
              messages={messages}
              username={route.username}
              me={account?.userId ?? null}
              onSignIn={() => {
                setSigningIn({})
              }}
              onHome={() => {
                setRoute({ at: 'game' })
              }}
            />
          ) : (
            <PlayedGamePage
              messages={messages}
              id={route.id}
              me={account?.userId ?? null}
              onSignIn={() => {
                setSigningIn({})
              }}
              dictionary={dictionary}
              onHome={() => {
                setRoute({ at: 'game' })
              }}
            />
          )}
        </div>
      )}

      {readingRules ? (
        <div className="rules-overlay">
          <HowToPlay
            messages={messages}
            language={settings.uiLanguage}
            onLanguage={(tag) => {
              onChange({ ...settings, uiLanguage: tag })
            }}
            onBack={() => {
              setReadingRules(false)
            }}
            onAbout={() => {
              setReadingRules(false)
              goTo({ at: 'about' })
              setRoute({ at: 'about' })
            }}
          />
        </div>
      ) : null}

      <main
        className={`shell${settings.nerdMode ? ' has-nerd' : ''}`}
        /*
         * The offline state, on the root as well as on the badge.
         *
         * The badge in `AccountMenu` is what a reader sees, and this is what a stylesheet or a
         * test can reach without one: the state is a fact about the whole app rather than about
         * the account control, and anything else that needs to know it later should hang off
         * this rather than grow a second source of truth.
         */
        data-offline={offline ? 'yes' : undefined}
      >
        <div className="titlebar" ref={titlebar}>
          {/*
            Keyed on whether it is playing, so that turning still is a fresh start rather than a
            prop nobody reads: the animation's state is set up once, at mount, from `still`.
            Remounting nine spans costs nothing and is honest about what changed.
          */}
          <Title
            key={markOnly ? 'still' : 'played'}
            still={markOnly}
            skip={hurried}
            onDone={() => {
              setTitleDone(true)
            }}
          />
          {/*
           * One How to play, for every phase of the game. It used to be two: one under the Start
           * button and one at the end of the legend, where it was an unstyled blue link hanging
           * off the bottom of the page. A control always in the same place is easier to find than
           * one that moves with the phase.
           *
           * Beside the wordmark rather than after the language picker, which is packing rather
           * than taste. The title bar wraps greedily in this order, and with the help control
           * further along, the second row came to 290px against 288px available at 320px wide and
           * pushed the nerd toggle onto a third row. Here the rows are 266px and 234px.
           */}
          <HowToPlayLink
            language={settings.uiLanguage}
            messages={messages}
            onShowInApp={() => {
              setReadingRules(true)
            }}
          />

          {/*
            The way to a board, beside How to play rather than beside the nerd toggle.
            
            It goes to **the board for what is currently selected**, which is the only default
            that needs no explaining: somebody looking at an English insane setup wants the
            English insane board. Both parts are still in the address, so the selectors on the
            page can move from there and the link stays shareable.
            
            **Here because of where it wraps.** The bar is the tightest row in the layout, and
            next to the nerd toggle this pushed the account button onto a third row at 320px --
            the exact regression IOS.md records fixing once already, where the third row is what
            put Complete word off the bottom of an iPhone SE. The wordmark's row has room beside
            the How to play control and this one takes it. Shaving pixels off the picker would
            have bought eight of them and still lost in Spanish, where Sign in is "Iniciar
            sesion".

            It also groups better: How to play and the leaderboard are both places to go and
            read, where the nerd toggle changes the game in front of you.

            A medal rather than a word for the same reason of space. The name is in the tooltip
            and in the accessibility tree, where a screen reader reads it instead of the glyph.
          */}
          <button
            type="button"
            className="board-link"
            title={messages.leaderboardTitle}
            aria-label={messages.leaderboardTitle}
            onClick={() => {
              const to = {
                at: 'board' as const,
                language: settings.gameLanguage,
                difficulty: settings.difficulty,
              }
              goTo(to)
              setRoute(to)
            }}
          >
            <span aria-hidden="true">🥇</span>
          </button>

          {/*
            The palette, as one glyph and a caret.
            
            Up here rather than on the setup screen, which is where it started: most people will
            never touch it, and the ones who need it need it on every screen rather than only
            before a game. Nick's shape -- "offer a half-and-half logo up top and a drop-down".
            
            `◐` rather than `☯`, which was the other suggestion: the half-filled circle is the
            glyph every operating system already uses for brightness and contrast, and it carries
            no other meaning that somebody might read into it. The label is hidden visually and
            kept for `aria-labelledby`, because a listbox named by a glyph is a listbox with no
            name at all.
          */}
          <div className="theme-picker">
            <Dropdown
              options={THEMES.map((name) => ({ value: name, label: messages.themeNames[name] }))}
              value={settings.theme}
              label={messages.themeLabel}
              mark="◐"
              onChange={(chosen) => {
                const found = THEMES.find((name) => name === chosen)
                if (found !== undefined) onChange({ ...settings, theme: found })
              }}
            />
          </div>

          {/* Always here, and live except while a game is running. Somebody arriving at a page
            in a language they cannot read has to be able to fix that before anything else. */}
          <LanguagePicker
            catalogue={catalogue}
            value={language}
            readIn={settings.uiLanguage}
            label={messages.gameLanguage}
            disabled={playing}
            onChange={(tag) => {
              onChange({ ...settings, gameLanguage: tag, uiLanguage: tag })
              // And on the account, when there is one. Without this the device and the account
              // disagree from the next sign-in onwards, and the account wins -- so a language
              // picked here would silently revert on the next machine. Fire and forget: the
              // change has already happened locally and a failed save is not worth a message.
              if (account !== null) void saveProfile({ uiLanguage: tag, gameLanguage: tag })
            }}
          />
          <label className="toggle" title={messages.nerdMode}>
            <input
              type="checkbox"
              checked={settings.nerdMode}
              {...ignoredByManagers}
              {...nerdFocus.handlers}
              onChange={(e) => {
                // Give the keyboard back, or the board stops hearing anything typed at it.
                nerdFocus.release(e.currentTarget)
                onChange(withNerdMode(settings, e.target.checked))
              }}
            />
            {/*
              The face is always there; the words go when the row is tight.
              
              The title bar is the most expensive thing on a small screen -- IOS.md records it
              taking 108px of a 568px iPhone before the language picker's label was dropped -- and
              a medal has since been added to the same row. So this follows that precedent rather
              than inventing a second one: the glyph carries the control at every width, and the
              text collapses to the accessibility tree below 30rem, where the `title` is what
              explains it to a pointer.
              
              `aria-hidden` on the glyph because the label's text is the checkbox's accessible
              name, hidden or not, and a screen reader saying "nerd face nerd mode" is worse than
              either alone.
            */}
            <span className="toggle-icon" aria-hidden="true">
              🤓
            </span>
            <span className="toggle-text">{messages.nerdMode}</span>
          </label>

          {/*
            The account, at the end of the bar.

            Pinned there rather than kept in the group at the start, which is the opposite of what
            the nerd toggle does two lines up. That comment's reasoning was about the toggle: a
            right-pinned control read as chrome belonging to the sidebar it opens. An account
            menu at the end of a title bar reads as an account menu, because that is where
            everybody has been trained to look for one.
          */}
          <AccountMenu
            messages={messages}
            account={account}
            offline={offline}
            onSignIn={() => {
              setSigningIn({})
            }}
            onGo={setVisiting}
            onPublicProfile={(username) => {
              goTo({ at: 'player', username })
              setRoute({ at: 'player', username })
            }}
            onAbout={() => {
              goTo({ at: 'about' })
              setRoute({ at: 'about' })
            }}
            onModerate={() => {
              // A route rather than an overlay flag, so the panel survives a reload -- which
              // matters on the one screen somebody works in for twenty minutes at a time.
              goTo({ at: 'admin' })
              setRoute({ at: 'admin' })
            }}
            onSignOut={() => {
              setVisiting(null)
              // A deliberate sign-out is not an offline state, and leaving the marker up would
              // read as "we could not reach the server" rather than "you asked to leave".
              setOffline(false)
              // The interface signs out immediately and the request goes on its own; the server
              // revokes so a copied token dies too, but nobody should watch a spinner for it.
              setAccount(null)
              void signOut()
            }}
          />
        </div>

        <div className={`body${settings.nerdMode ? ' has-nerd' : ''}`}>
          <div className={`play${playing ? ' has-board' : ''}`}>
            {error !== null ? <p className="error">{error}</p> : null}

            {phase === 'setup' ? <div className="panel">{setup(messages.start)}</div> : null}

            {phase === 'over' && finished !== null ? (
              /*
               * `panel-over`, because this panel is the one that can outgrow a screen.
               *
               * Everything in it earns its place -- the score, where it would rank, your best
               * games, every word you found -- and on a long game that adds up to roughly twice
               * an iPhone. Nick found the consequence: "at the end of a game with sufficiently
               * many words, I can't see the button to start a new game." The class is what lets
               * the stylesheet cap the word rail and pin the action to the bottom of the screen.
               */
              <div className="panel panel-over">
                <p className="veil-title">{messages.outOfFlips}</p>
                <p className="result-line">
                  {formatFinalResult(messages, {
                    score: finished.result.score,
                    words: finished.result.words,
                    rounds: finished.result.rounds,
                  })}
                </p>
                {/*
                  Your own games, then everybody's, and that order is the answer to a complaint.

                  It used to be the other way, on the argument that the projected board is the
                  reason somebody might sign up and so belongs at the top. What that produced,
                  game after game, was a panel whose first line under the score was about not
                  having made the top five -- most scores do not -- and whose shape changed
                  depending on whether this one had. Widening scope instead: what you scored, how
                  that compares with your own games, how it compares with everybody's. Each
                  section a wider frame than the one above it, in the same place every time.
                */}
                <PersonalBest
                  standing={finished.standing}
                  current={finished.result}
                  signedIn={account !== null}
                  messages={messages}
                />
                <BoardStanding
                  result={finished.result}
                  paused={finished.keepable?.paused === true}
                  messages={messages}
                  me={
                    account === null
                      ? null
                      : { username: account.username, avatarSeed: account.avatarSeed }
                  }
                  onSignIn={() => {
                    setSigningIn({ reason: messages.signInKeepGame })
                  }}
                  onGlobalBoard={() => {
                    /*
                     * The board for the game just played, not a menu of boards.
                     *
                     * Taken from the finished result rather than from settings, which can have
                     * moved on: the panel stays open while somebody changes the language for
                     * their next game, and the link under a finished game has to mean that game.
                     */
                    const to = {
                      at: 'board' as const,
                      language: finished.result.language,
                      difficulty: finished.result.difficulty,
                    }
                    goTo(to)
                    setRoute(to)
                  }}
                />
                <FoundWords
                  words={finished.words}
                  messages={messages}
                  language={finished.result.language}
                  dictionary={dictionary}
                />
                <Share
                  result={finished.result}
                  personalBest={isPersonalBest(finished.standing)}
                  messages={messages}
                  permalink={keptId === null ? undefined : urlOf({ at: 'played-game', id: keptId })}
                />
                {/*
                  Keep this game.

                  The one moment a score stops being anonymous, and the worst possible time to
                  lose one: it is the score that just persuaded somebody to sign up. The dialog
                  opens *over* this panel and never in place of it, so a sign-up that fails halfway
                  leaves the result exactly where it was.

                  Signed in, there is nothing to offer — the effect above has already sent it —
                  and the line says so rather than leaving somebody wondering.
                */}
                {finished.keepable === undefined ? null : account === null ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setSigningIn({ reason: messages.signInKeepGame })
                    }}
                  >
                    {messages.keepThisGame}
                  </button>
                ) : (
                  <p className="signin-note">{messages.savedToYourGames}</p>
                )}
                {setup(messages.newGame)}
              </div>
            ) : null}

            {playing && spec !== null && dictionary !== null ? (
              <Playing
                key={spec.seed}
                dictionary={dictionary}
                spec={spec}
                settings={settings}
                messages={messages}
                onRestart={start}
                onQuit={quit}
                onFinish={onFinish}
                rulesOpen={readingRules}
              />
            ) : null}
          </div>

          {settings.nerdMode ? (
            <NerdPanel
              settings={settings}
              config={config}
              dictionary={dictionary}
              locked={playing}
              messages={messages}
              onChange={onChange}
              onOverride={(overrides) => {
                onChange(withOverride(settings, overrides))
              }}
            />
          ) : null}
        </div>
      </main>
    </>
  )
}

function Playing({
  dictionary,
  spec,
  settings,
  messages,
  onRestart,
  onQuit,
  onFinish,
  rulesOpen,
}: {
  dictionary: TieredIndex
  spec: GameSpec
  settings: Settings
  messages: Messages
  onRestart: () => void
  onQuit: () => void
  onFinish: (
    state: GameState,
    seed: number,
    boards: readonly { tiles: string; wilds?: readonly number[] }[],
    /** Whether the clock ever stopped. See `stopped` on `Game`, and what it costs below. */
    stopped: boolean,
  ) => void
  /**
   * True while the in-app rules cover the game, which only happens in the native shell. Reading
   * the rules must not cost flips, and the clock lives in here rather than in Session, so Session
   * says the rules are open and this decides what that means.
   */
  rulesOpen: boolean
}): React.JSX.Element {
  const portrait = usePortrait()
  // Both of the two ways to lose a game in progress ask first, so this is which question is
  // being asked rather than a flag per button.
  const [confirming, setConfirming] = useState<'quit' | 'restart' | null>(null)
  const game = useGame(dictionary, spec, settings.keyScheme)
  const feedback = useFeedback(game.effects, game.cause, game.epoch, messages, spec.config.language)
  const gain = useWordGain(game.effects, game.epoch)
  const swap = useSwap(game.effects, game.epoch)
  const hiding = useHiding(game.effects)

  useEffect(() => {
    if (rulesOpen) game.setPaused(true)
  }, [rulesOpen, game])

  const over = game.state.status === 'over'
  // Reported once the reducer says so; the parent then takes over and unmounts this.
  const finalState = game.state
  const { seed } = spec

  /*
   * The board at the start of each round, which only this component ever sees.
   *
   * Not the first deal alone. From 0.3.0 a letter can be replaced at any deal, and under `spend`
   * a completed word takes its letters off, so a game has several boards and only the first is a
   * fact about how it started. Snapshotting at each boundary is what makes "which words on which
   * board" answerable without keeping an event log, which docs/ACCOUNTS.md rejected.
   *
   * A ref, because nothing renders from it, and indexed by round rather than pushed, so a
   * re-render inside the same round cannot record the board twice.
   */
  const boards = useRef<{ tiles: string; wilds?: readonly number[] }[]>([])
  const round = game.state.roundIndex
  const tiles = game.state.tiles
  useEffect(() => {
    // Letters and the wild mask separately, because that is what they are: a wild is showing over
    // a letter that is still underneath and comes back next round. Written into one string they
    // would be one or the other, and the history would either forget the card or forget the
    // board.
    //
    // Rewritten on every change within the round rather than only at its start, so what is kept
    // is the round as it ended -- every tile turned over, and any wild that appeared partway
    // through. A snapshot taken at the boundary would miss most of them.
    const wilds = tiles.flatMap((tile, at) => (tile.wild ? [at] : []))
    const faces = tiles.map((tile) => tile.letter).join(' ')
    boards.current[round] = wilds.length === 0 ? { tiles: faces } : { tiles: faces, wilds }
  }, [round, tiles])

  useEffect(() => {
    if (over) onFinish(finalState, seed, [...boards.current], game.stopped)
  }, [over, finalState, seed, onFinish, game.stopped])

  return (
    <>
      <Hud state={game.state} feedback={feedback} gain={gain} messages={messages} />

      <div className="board-wrap">
        <Board
          state={game.state}
          portrait={portrait}
          concealed={game.paused}
          hiding={hiding}
          messages={messages}
          onTapTile={(tileId) => {
            game.dispatch({ type: 'TAP_TILE', tileId })
          }}
        />
        {/* Over the board rather than on a tile: which tile changed is exactly what this must
            not give away, since the deal has already happened and naming a position would hand
            the player a free reveal every time. */}
        {swap === null ? null : <LetterSwap swap={swap} messages={messages} />}
        {/* Why the next board arrived early. The clock is held for exactly as long as this is
            up, so it costs the player nothing to read.
            
            Keyed on the round rather than on `game.epoch`, which is what `useSwap` latches for
            itself and for the same reason: the epoch moves on every dispatch, so a player who
            typed while reading this would remount it and restart its fade. One cut belongs to
            one round, and two cuts in a row are two rounds, so the round index both holds still
            while it is up and changes when it should replay. */}
        {game.fewerLetters ? (
          <TooFewLetters round={game.state.roundIndex} messages={messages} />
        ) : null}
        {game.paused && confirming === null ? (
          <div className="veil">
            <p>{messages.paused}</p>
            {/*
              What the stop costs, said while it is happening.
              
              Afterwards it would be a penalty nobody was told about, and this veil is also where
              a tab going away lands -- so somebody who took a phone call finds out here rather
              than on the game-over panel. Only once the clock has actually stopped something:
              `game.stopped` is latched, so this stays on for the rest of the game and does not
              blink off when they resume.
            */}
            {game.stopped ? <p className="veil-cost">{messages.pausedNoBoard}</p> : null}
            <button
              type="button"
              className="btn"
              onMouseDown={withoutStealingFocus}
              onClick={() => {
                game.setPaused(false)
              }}
            >
              {messages.resume}
            </button>
          </div>
        ) : null}
      </div>

      {/*
       * The confirmations, outside the board rather than over it.
       *
       * They used to be a `.veil` inside `.board-wrap`, which made them 266px wide on a phone:
       * "Quit this game?" wrapped mid-phrase and the two buttons could not fit the track, so they
       * spilled out to the right and looked misaligned because they were. `.board-wrap` is also an
       * inline-size container, and containment makes it the containing block for `position: fixed`,
       * so a full-screen modal could not be built in there at all. Out here it can.
       */}
      {confirming === null ? null : (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <p className="veil-title">
              {confirming === 'quit' ? messages.quitTitle : messages.restartTitle}
            </p>
            <div className="modal-choices">
              <button
                type="button"
                className="btn"
                onMouseDown={withoutStealingFocus}
                onClick={() => {
                  if (confirming === 'quit') onQuit()
                  else {
                    setConfirming(null)
                    onRestart()
                  }
                }}
              >
                {confirming === 'quit' ? messages.quitConfirm : messages.restartConfirm}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onMouseDown={withoutStealingFocus}
                onClick={() => {
                  setConfirming(null)
                  game.setPaused(false)
                }}
              >
                {messages.keepPlaying}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
       * One row, on every screen and in every language. Five word-labelled buttons cannot do
       * that: at 320px they wrapped onto a second line, which cost a row of the board.
       *
       * So the primary keeps words, because "press Complete" is what the instruction above the
       * board tells you to do, and it uses `completeShort` so the two always agree. The other
       * four are drawings with their full localised name on `aria-label` and `title`.
       */}
      <div className="controls">
        <button
          type="button"
          className="btn btn-primary"
          disabled={game.paused}
          onMouseDown={withoutStealingFocus}
          onClick={() => {
            game.dispatch({ type: 'SUBMIT_WORD' })
          }}
        >
          {messages.completeShort} <kbd>enter</kbd>
        </button>
        <IconButton
          label={messages.reset}
          icon="reset"
          hint="esc"
          disabled={game.paused}
          onClick={() => {
            game.dispatch({ type: 'RESET_WORD' })
          }}
        />
        <IconButton
          label={game.paused ? messages.resume : messages.pause}
          icon={game.paused ? 'resume' : 'pause'}
          disabled={confirming !== null}
          onClick={() => {
            game.setPaused(!game.paused)
          }}
        />
        {/*
         * Both of these ask first, and the clock stops while they do: a mis-tap must not throw
         * away a game in progress, and the offer to keep playing must not cost flips. Restart used
         * to go straight through, which on a phone meant an accidental brush of the thumb silently
         * dealt a new board with no explanation of where the old one went.
         */}
        <IconButton
          label={messages.restart}
          icon="restart"
          onClick={() => {
            setConfirming('restart')
            game.setPaused(true)
          }}
        />
        <IconButton
          label={messages.quit}
          icon="quit"
          onClick={() => {
            setConfirming('quit')
            game.setPaused(true)
          }}
        />
      </div>

      {/* Only the bindings the buttons cannot advertise. Enter and Escape are already written
          on the two buttons that own them, so repeating them here is noise, and the keyboard
          items are hidden where there is no keyboard. How to play moved to the title bar, which
          leaves every item here a keyboard item, so the whole list goes on a touch screen.


          A list rather than a paragraph of spans, because the items are only separated by a
          flex gap: visually that reads fine, but as one run of text it does not, and a screen
          reader gets the text. */}
      <ul className="legend">
        <li className="keys-only">{messages.lettersSelect}</li>
        <li className="keys-only">
          <kbd>shift-X</kbd> {format(messages.clearsEvery, { letter: 'X' })}
        </li>
        <li className="keys-only">
          <kbd>&#x232b;</kbd> {messages.undoLastLetter}
        </li>
      </ul>

      <FoundWords
        words={game.state.wordsFound}
        messages={messages}
        language={spec.config.language}
        dictionary={dictionary}
      />
    </>
  )
}

/**
 * A secondary control: a drawing, and its name everywhere a drawing cannot be read.
 *
 * `aria-label` for a screen reader, `title` for a pointer that hovers, and the `hint` is the
 * keyboard binding, which the stylesheet already hides where there is no keyboard.
 */
function IconButton({
  label,
  icon,
  hint,
  disabled = false,
  onClick,
}: {
  label: string
  icon: 'reset' | 'pause' | 'resume' | 'restart' | 'quit'
  hint?: string
  disabled?: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="btn btn-icon"
      disabled={disabled}
      aria-label={label}
      title={label}
      onMouseDown={withoutStealingFocus}
      onClick={onClick}
    >
      <Icon name={icon} />
      {/* Drawn only where there is room, which is a desktop. The drawing is what makes five
          controls fit a phone; the word is what makes them obvious anywhere else. */}
      <span className="btn-text">{label}</span>
      {hint === undefined ? null : <kbd>{hint}</kbd>}
    </button>
  )
}

function FoundWords({
  words,
  messages,
  language,
  dictionary,
}: {
  words: readonly { word: string; points: number; wilds?: readonly number[] }[]
  messages: Messages
  /** The game's language, not the interface's: these are its words, spelled its way. */
  language: string
  /**
   * The dictionary the words came from, which is also the only thing that knows how they are
   * written. Optional because a finished game can outlive the fetch that produced it, and a
   * word rendered as it was tiled beats a rail that will not draw.
   */
  dictionary?: TieredIndex | null
}): React.JSX.Element {
  if (words.length === 0) {
    return <p className="found dim">{messages.noWordsYet}</p>
  }
  const alphabet = alphabetFor(language)
  // Shared with the history screen, which marks the same wilds on the same words. See
  // `spelling.ts` for why `wilds` cannot be applied by character position.
  const { spell, laid } = spellingFor(language, dictionary)

  return (
    <ul className="found">
      {[...words].reverse().map((found) => (
        // `--len` is how many characters are about to be drawn, which the narrow rail uses to
        // size the text so that a long word shrinks to fit rather than being cut. Counted here
        // rather than measured: the length is already known, and a ResizeObserver per word
        // would be a lot of machinery for an answer arithmetic can give. The title still
        // carries the whole thing, for the rare word too long even at the smallest size.
        <li
          key={found.word}
          title={`${spell(found.word)} +${String(found.points)}`}
          style={{ ['--len' as string]: String(laid(found.word).length) }}
        >
          <span className="found-word" dir={alphabet.direction}>
            {/* Letters the wild was given are marked, so the player can see what the board
                handed them rather than what they chose. Marked per character rather than
                highlighting the whole word, because usually only one of them was a gift. */}
            {laid(found.word).map(({ letter, tile }, at) => (
              <span
                key={`${String(at)}-${letter}`}
                className={found.wilds?.includes(tile) === true ? 'from-wild' : undefined}
              >
                {letter}
              </span>
            ))}
          </span>
          <span className="found-points">{found.points}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * What the last accepted word was worth, for the badges that float over the figures.
 *
 * Gains only. Flips are also spent, one per tile that turns, and a round can charge for the ones
 * it did not use; animating those would mean a number floating over the HUD several times a
 * round, which is the difference between a reward and a nag.
 */
function useWordGain(effects: readonly Effect[], epoch: number): WordGain | null {
  // Latched, not derived. Deriving it from the current effects tied the badge's life to the next
  // dispatch, and the next dispatch is a TICK: measured, the badge was destroyed 745ms into its
  // own 1000ms animation, and where a submit fell in the tick cycle decided whether the player
  // saw the whole thing, a fragment, or nothing. Holding the last gain hands the timing back to
  // the animation, which is the only thing that knows when it has finished. Nothing clears it,
  // because the last keyframe is transparent and a new word replaces it with a fresh key.
  const [gain, setGain] = useState<WordGain | null>(null)
  useEffect(() => {
    for (const effect of effects) {
      if (effect.type === 'WORD_ACCEPTED') {
        setGain({ points: effect.points, flips: effect.flips, epoch })
        return
      }
    }
  }, [effects, epoch])
  return gain
}

/**
 * The letter change to play over its tile, latched for the same reason the gain badge is.
 *
 * Deriving it from the current effects would end the animation at the next dispatch, and a player
 * who taps a tile while watching would cancel the very thing they were watching.
 *
 * Unlike the gain badge this one is also cleared, rather than being left to fade to nothing on its
 * last keyframe. An invisible cover is still two letters in the DOM, one of which is what that
 * tile is now: the board goes to some trouble to keep face-down letters out of the document at
 * all, and leaving one behind here would undo that for the tile the game just drew attention to.
 */
/**
 * Which tile just turned back over, for as long as its animation runs.
 *
 * The mechanic needed this because it was invisible without it. A letter leaving used the same
 * 260ms flip as every other tile, and the whole board flips at the end of every round, so one
 * tile turning over mid-round was indistinguishable from the furniture. Nick played eleven rounds
 * of insane and saw one, against a measured six in ten.
 *
 * Held for the length of the animation and then dropped, which is the part that matters for the
 * rule underneath: the board must not carry a mark saying which face-down tile is the one that
 * was taken, because that is exactly the history the deal goes to such trouble not to record.
 */
function useHiding(effects: readonly Effect[]): number | null {
  const [hiding, setHiding] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )
  useEffect(() => {
    for (const effect of effects) {
      if (effect.type === 'TILE_HIDDEN') {
        setHiding(effect.tileId)
        if (timer.current !== null) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          setHiding(null)
        }, HIDE_MS)
        return
      }
    }
  }, [effects])
  return hiding
}

function useSwap(effects: readonly Effect[], epoch: number): Swap | null {
  const [swap, setSwap] = useState<Swap | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )
  useEffect(() => {
    for (const effect of effects) {
      if (effect.type === 'LETTER_REPLACED') {
        setSwap({ from: effect.from, to: effect.to, epoch })
        if (timer.current !== null) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          setSwap(null)
        }, SWAP_MS)
        return
      }
    }
  }, [effects, epoch])
  return swap
}

/** Turns the most interesting effect of the last dispatch into one line of feedback. */
function useFeedback(
  effects: readonly Effect[],
  cause: GameEvent | null,
  epoch: number,
  messages: Messages,
  language: string,
): Feedback | null {
  return useMemo(() => {
    // Folded through the alphabet rather than upper-cased, so the letter named is the one on the
    // tile the player was refused. `toUpperCase` would call a Turkish i an I, which is a
    // different letter and a different tile.
    const alphabet = alphabetFor(language)
    const letter = cause !== null && 'letter' in cause ? alphabet.fold(cause.letter) : null
    for (const effect of [...effects].reverse()) {
      switch (effect.type) {
        case 'WORD_ACCEPTED':
          // Nothing to say here. The word arrives in the rail with its points, announcing itself
          // by turning green and settling, and the flips it paid back are the FLIPS figure
          // changing. Saying it a third time in the word line was what made that line wrap and
          // shove the board down at the exact moment the player was looking at it.
          return null
        case 'WORD_REJECTED': {
          const reason =
            effect.reason === 'duplicate'
              ? messages.reasonDuplicate
              : effect.reason === 'too-short'
                ? messages.reasonTooShort
                : effect.reason === 'all-found'
                  ? messages.reasonAllFound
                  : messages.reasonNotAWord
          return {
            kind: 'rejected',
            epoch,
            text: format(messages.wordRejected, { word: effect.word || '—', reason }),
          }
        }
        case 'LETTER_REPLACED':
          /*
           * Found before ROUND_ENDED because the loop runs backwards, so the swap displaces the
           * "shuffled" line rather than adding a row to a bar that has none to give. It is also
           * the more useful of the two: every round shuffles, and this one did something else.
           *
           * An arrow rather than a sentence. It is the same in every language, and it is
           * short enough not to wrap, which matters because this bar is fixed-height and a line
           * that wrapped would push the board.
           */
          return {
            kind: 'note',
            epoch,
            text: `${effect.from} \u2192 ${effect.to}`,
            label: format(messages.letterReplaced, { from: effect.from, to: effect.to }),
          }
        case 'ROUND_ENDED':
          return {
            kind: 'note',
            epoch,
            text:
              effect.flipsCharged > 0
                ? format(messages.shuffledAndBilled, {
                    flips: countOf(messages, 'flips', effect.flipsCharged),
                  })
                : messages.shuffled,
          }
        case 'INPUT_IGNORED':
          // Being refused a letter has to be loud. A player typing ALIAS cannot see how many
          // A tiles the board holds, and silently building ALIS instead is how a word gets
          // submitted that nobody meant to submit.
          if (effect.reason === 'no-such-letter') {
            return {
              kind: 'rejected',
              epoch,
              text:
                letter === null ? messages.nothingUp : format(messages.noSuchLetterUp, { letter }),
            }
          }
          // Nothing to say for 'already-selected'. Under `cycle` the letters are canceled
          // and the word line shows that plainly; under `advance` the word simply does not
          // grow. Neither needs narrating.
          return null
        case 'TILE_HIDDEN':
          /*
           * Said, because a player who cannot see the board gets nothing otherwise: the tile
           * turning back over is the whole signal, and it is a visual one.
           *
           * Without the letter, deliberately. Somebody watching sees which tile went and cannot
           * re-read it; printing the letter here would hand it back, against the one mechanic
           * that is about remembering the board.
           */
          return { kind: 'note', epoch, text: messages.letterHidden }
        case 'REVEALED':
        case 'SELECTED':
        case 'DESELECTED':
        case 'GAME_OVER':
          break
      }
    }
    return null
  }, [effects, cause, epoch, messages, language])
}

function usePortrait(): boolean {
  const [portrait, setPortrait] = useState(
    () => globalThis.matchMedia('(orientation: portrait)').matches,
  )
  useEffect(() => {
    const query = globalThis.matchMedia('(orientation: portrait)')
    const onChange = (): void => {
      setPortrait(query.matches)
    }
    query.addEventListener('change', onChange)
    return () => {
      query.removeEventListener('change', onChange)
    }
  }, [])
  return portrait
}

function freshSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1
}
