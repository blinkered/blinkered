import { sql } from 'drizzle-orm'
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgSchema,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * The schema every table lives in, and it is a constant rather than a setting. That is a
 * concession to the migration tool, and it was found by running the thing rather than by reading
 * about it.
 *
 * The first attempt declared the tables unqualified and put the schema on the connection's
 * `search_path`, so that the deployment's `schema` key could name anything. `drizzle-kit`
 * generated `CREATE TABLE "users"`, which honours `search_path`, and in the same file
 * `REFERENCES "public"."users"`, which does not: it hardcodes the schema into every foreign key.
 * The tables were created in the right schema and every foreign key pointed at an empty one, and
 * the migration failed with `relation "public.users" does not exist`.
 *
 * Declared this way, the generated SQL is qualified consistently and creates the schema itself.
 * The cost is that the name is now in the committed migrations, so the secret's `schema` key has
 * to agree with this constant; `runMigrations` checks that and says so rather than half-applying.
 * Changing it means regenerating the migrations.
 */
export const DATABASE_SCHEMA = 'blinkered'

const blinkered = pgSchema(DATABASE_SCHEMA)

/**
 * A person.
 *
 * `deletedAt` rather than a delete, but only briefly: App Store guideline 5.1.1(v) requires
 * in-app account deletion, and honouring that means the row goes. This column exists so a
 * deletion is a two-step, marked and then reaped, rather than a cascade fired from an HTTP
 * handler with no way back if it was a mistake.
 */
export const users = blinkered.table(
  'users',
  {
    id: text('id').primaryKey(),
    /** What the world sees. The only public identifier, and renameable, so it is not the key. */
    username: text('username').notNull(),
    /**
     * The username case-folded and NFKC-normalised, which is what uniqueness is actually on.
     * Without it `nick` and a `nick` with a fullwidth i are two accounts, which is impersonation
     * with extra steps.
     */
    usernameNormalized: text('username_normalized').notNull(),
    /** ISO 3166-1 alpha-2, self-declared, optional. Never geo-IP. */
    country: text('country'),
    /** Both languages, because the app has always kept them apart and merging them here would
     * quietly undo that: plenty of people play in a language they do not read menus in. */
    uiLanguage: text('ui_language'),
    gameLanguage: text('game_language'),
    bio: text('bio'),
    /** The seed for the generated avatar. There are no uploads, so there is no URL. */
    avatarSeed: text('avatar_seed').notNull(),
    /**
     * Whether this person can moderate.
     *
     * A column on `users` rather than a roles table, because there is exactly one power and it
     * is not going to grow into a permission system for a word game. The day it needs two, that
     * is the day to build the table, and a boolean is a cheap thing to migrate off.
     *
     * Nobody can grant it to themselves: `POST /v1/auth/*` never writes it and the admin routes
     * refuse to change the flag on the account making the request, so the first one is set by
     * hand against the database. That is the correct amount of ceremony for the power to delete
     * anybody's account, and it means an admin panel bug cannot mint an admin.
     */
    isAdmin: boolean('is_admin').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('users_username_normalized_key').on(table.usernameNormalized)],
)

/**
 * How somebody proves they are that person. One row per provider per user.
 *
 * Separate from `users` because a person can have more than one, and because the day somebody
 * signs in with Google having previously used the code flow on the same address, the right answer
 * is another row rather than a second account.
 */
export const authIdentities = blinkered.table(
  'auth_identities',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** `google`, `apple`, or `email`. */
    provider: text('provider').notNull(),
    /**
     * The provider's own id for them. For Apple this is the `sub`, which is stable per developer
     * team and is the only durable handle: a user who hides their email can change the relay
     * address, and the email is therefore not an identity.
     */
    providerAccountId: text('provider_account_id').notNull(),
    email: text('email'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('auth_identities_provider_account_key').on(table.provider, table.providerAccountId),
    index('auth_identities_user_idx').on(table.userId),
  ],
)

export const sessions = blinkered.table(
  'sessions',
  {
    /** A hash of the token, never the token. A leaked table should not be a leaked login. */
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** `cookie` on the web, `bearer` in the native shell. They expire differently. */
    kind: text('kind').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [index('sessions_user_idx').on(table.userId)],
)

/**
 * A six-digit code, in flight.
 *
 * The hash, not the code, for the same reason a password table would, and `attempts` because six
 * digits is a million guesses and an endpoint that will answer a million times is not a secret.
 */
export const loginCodes = blinkered.table(
  'login_codes',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    codeHash: text('code_hash').notNull(),
    attempts: smallint('attempts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
  },
  (table) => [index('login_codes_email_idx').on(table.email)],
)

/**
 * A finished game.
 *
 * `userId` is nullable on purpose: the server deals a game to whoever asks, including somebody
 * who has not signed up, and that is what makes "keep this score" at the end of a guest's game
 * something better than a promise. The row is claimed when they sign up.
 *
 * The whole ruleset is stored per row rather than only the difficulty, because a difficulty is a
 * label whose meaning changes: `ENGINE_VERSION` is at 0.3.0 and medium has already been retuned
 * once. A row that carries its own numbers stays explainable after the next retune.
 */
export const games = blinkered.table(
  'games',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    /** The server's seed, so the board is reproducible from the row. */
    seed: integer('seed').notNull(),
    status: text('status').notNull(),
    /** `web` or `ios`. */
    source: text('source').notNull(),
    /** True for a game brought in from a browser's localStorage. Never leaderboard-eligible. */
    imported: boolean('imported').notNull().default(false),

    difficulty: text('difficulty').notNull(),
    language: text('language').notNull(),
    canonical: boolean('canonical').notNull(),

    /*
     * The rates are float8 rather than text or numeric, which was worth a moment's thought.
     *
     * `isCanonical` compares a config against a preset with `===`, so what matters is that a
     * value survives the round trip unchanged. float8 is IEEE 754 double, the same thing the
     * engine holds, so 0.02 comes back as the identical double it went in as. numeric would
     * arrive as a string and text certainly does, and either would put a parse between the
     * database and a comparison that has to be exact.
     */
    n: smallint('n').notNull(),
    speedMultiplier: doublePrecision('speed_multiplier').notNull(),
    holdTicks: smallint('hold_ticks').notNull(),
    initialFlips: integer('initial_flips').notNull(),
    wMin: integer('w_min').notNull(),
    minWordLength: smallint('min_word_length').notNull(),
    wordCompleteMode: text('word_complete_mode').notNull(),
    flipEconomy: text('flip_economy').notNull(),
    chargeFullRound: boolean('charge_full_round').notNull(),
    wildChance: doublePrecision('wild_chance').notNull(),
    replaceChance: doublePrecision('replace_chance').notNull(),

    score: integer('score').notNull().default(0),
    wordsCount: integer('words_count').notNull().default(0),
    roundsPlayed: integer('rounds_played').notNull().default(0),

    engineVersion: text('engine_version').notNull(),
    dictionaryVersion: text('dictionary_version'),

    leaderboardEligible: boolean('leaderboard_eligible').notNull().default(false),
    /** The whole anti-cheat apparatus. Reversible, which a delete is not. */
    hidden: boolean('hidden').notNull().default(false),

    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [
    index('games_user_finished_idx').on(table.userId, table.finishedAt.desc()),
    /*
     * The leaderboard, and the column order is not a matter of taste.
     *
     * `compareResults` in @blinkered/engine orders by score descending, then rounds ascending,
     * then the timestamp ascending, and any ORDER BY that differs from it produces a board that
     * disagrees with the ranking the client computes from the same rows. Partial, because the
     * ineligible rows are most of them and none of them are ever on a board.
     */
    index('games_leaderboard_idx')
      .on(
        table.language,
        table.difficulty,
        table.engineVersion,
        table.score.desc(),
        table.roundsPlayed.asc(),
        table.finishedAt.asc(),
      )
      .where(sql`${table.leaderboardEligible} and not ${table.hidden}`),
  ],
)

/**
 * Everything about a game that nothing ever queries: the words it found, and the board as it
 * stood at the start of each round.
 *
 * One versioned document rather than a `game_words` table and a `game_rounds` table, and the
 * reason is that the split here is by **access pattern** rather than by entity shape. Nothing
 * filters, sorts, joins or aggregates on a found word. The leaderboard sorts scalars on `games`;
 * My Games sorts scalars on `games`; moderation reads a scalar. This is written once, read whole,
 * and never partially updated, which is what a document is for.
 *
 * The arithmetic agreed. As rows, fourteen words cost about 1.7KB of which **fifty-seven percent
 * was tuple headers and index entries** rather than game: 68 bytes of bookkeeping to hold a
 * five-letter word and three small integers. The same content as jsonb is smaller before
 * compression and roughly a third of the size after it, because consecutive boards differ by one
 * letter and the keys repeat once per word. Fifteen rows per game become one, and the write-ahead
 * log -- which is what point-in-time recovery actually stores -- falls with them.
 *
 * A table of its own rather than a column on `games`, for two reasons that outlive the byte
 * count. `games` is what the leaderboard scans, and it cannot do an index-only scan because it
 * needs `user_id` to reach a username, so a detail column would ride along on every page; TOAST
 * would usually prevent that, but a document this size sits right at the threshold and would be
 * inline for short games and out of line for long ones. And retention here is a `delete`, which
 * gives space back, rather than an `update ... set detail = null`, which bloats the table it is
 * trying to shrink.
 *
 * `jsonb` rather than `bytea` or compressed text, deliberately, and the cost is a canonicalizing
 * parse on write. What it buys is `detail -> 'words'` in psql at two in the morning when somebody
 * disputes a score, which is the only time anybody will ever look at this column by hand.
 */
export const gameDetail = blinkered.table('game_detail', {
  gameId: text('game_id')
    .primaryKey()
    .references(() => games.id, { onDelete: 'cascade' }),
  /**
   * Which shape `detail` is in.
   *
   * A column rather than a key inside the document, so that "how many rows are still on version
   * 1" is a query rather than a scan. The rule that goes with it, and it has to be written down
   * somewhere: **a migration rewrites old documents; readers do not accumulate.** The alternative
   * leaves a reader for every shape ever written and nobody willing to delete one.
   */
  version: smallint('version').notNull(),
  detail: jsonb('detail').notNull(),
})

/**
 * Somebody objecting to a username, a bio, or a score. The other half of moderation.
 *
 * **A report outlives everybody named in it, and all three links are `set null`.** Each direction
 * buys something different, and they are worth keeping straight because one argument does not
 * cover both.
 *
 * **The reporter side** is the one that stops evidence being waited out. If a report died with
 * its author, a subject could outlast the people who reported them and the record would go with
 * them. This was already `set null` and was never at risk.
 *
 * **The subject side** buys something much narrower, and it is not about the subject at all:
 * `deleteAccount` nulls `reason` as well as the link, so nothing about the person who left
 * survives and nothing here recognises them if they come back. What survives is our own
 * bookkeeping -- how many reports arrived and how many were resolved -- and the reporter's link,
 * so "this person files real reports" stays true after some of their subjects leave. Modest, and
 * the reason it is still worth more than `cascade`, which used to silently shrink the history of
 * our own moderation every time somebody deleted an account.
 *
 * What a nulled link does **not** do is erase the person from `reason`, which is prose one player
 * wrote about another and can name them in any spelling. `deleteAccount` in `pgStore.ts` nulls
 * `reason` for a deleted subject before the row goes, and redacting it is not attempted:
 * usernames here are renameable by design and nothing records the old ones, so the name in a
 * report may be one the account no longer has.
 *
 * **Neither is a defence against ban evasion**, which nothing in this schema attempts. A deleted
 * address can sign up again at once. See docs/ACCOUNTS.md.
 */
export const reports = blinkered.table(
  'reports',
  {
    id: text('id').primaryKey(),
    reporterUserId: text('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
    subjectUserId: text('subject_user_id').references(() => users.id, { onDelete: 'set null' }),
    subjectGameId: text('subject_game_id').references(() => games.id, { onDelete: 'set null' }),
    /** Which part is objected to: `username`, `bio`, or `score`. */
    field: text('field').notNull(),
    /**
     * Why, in the reporter's words, and the one column here that is erased rather than unlinked.
     *
     * It is prose about the subject, so it is personal data about them: nulling the foreign key
     * removes the join and leaves "nickmarden is posting a slur" sitting in a text column.
     */
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [
    index('reports_unresolved_idx')
      .on(table.createdAt)
      .where(sql`resolved_at is null`),
  ],
)

/*
 * There are deliberately no relation declarations here.
 *
 * There were three -- `usersRelations`, `gamesRelations`, `gameDetailRelations` -- and nothing
 * ever queried them: every read in `pgStore.ts` is an explicit `select` with its own join, which
 * is what lets each one choose its columns and its `where`. The declarations existed so that
 * `db.query.users.findMany({ with: … })` would work, and that call was never written.
 *
 * Drizzle 1.0 removed the API they were built on -- relational queries v1 -- and replaced it with
 * `defineRelations()`. Porting them would have meant writing the new form of something with no
 * callers, so they are gone instead. The foreign keys are on the columns, where they do the work;
 * these were only ever a convenience for a query style this store does not use.
 */
