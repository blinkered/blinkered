import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgSchema,
  primaryKey,
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

    /** The board as first dealt, in deal order. Not the board at the end: from 0.3.0 a letter
     * can be replaced at any deal, so those are different things and only one is a fact about
     * how the game started. */
    letters: text('letters').array().notNull(),

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

/** What a game found. `tiles`, not characters, because that is what scores. */
export const gameWords = blinkered.table(
  'game_words',
  {
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    ordinal: smallint('ordinal').notNull(),
    word: text('word').notNull(),
    tiles: smallint('tiles').notNull(),
    points: integer('points').notNull(),
  },
  (table) => [primaryKey({ columns: [table.gameId, table.ordinal] })],
)

/** Somebody objecting to a username, a bio, or a score. The other half of moderation. */
export const reports = blinkered.table(
  'reports',
  {
    id: text('id').primaryKey(),
    reporterUserId: text('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
    subjectUserId: text('subject_user_id').references(() => users.id, { onDelete: 'cascade' }),
    subjectGameId: text('subject_game_id').references(() => games.id, { onDelete: 'cascade' }),
    /** Which part is objected to: `username`, `bio`, or `score`. */
    field: text('field').notNull(),
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

export const usersRelations = relations(users, ({ many }) => ({
  identities: many(authIdentities),
  sessions: many(sessions),
  games: many(games),
}))

export const gamesRelations = relations(games, ({ one, many }) => ({
  user: one(users, { fields: [games.userId], references: [users.id] }),
  words: many(gameWords),
}))

export const gameWordsRelations = relations(gameWords, ({ one }) => ({
  game: one(games, { fields: [gameWords.gameId], references: [games.id] }),
}))
