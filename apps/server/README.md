# @blinkered/server

The API: accounts, history and, later, leaderboards. It owns no game rules. What a word is worth
and what counts as a canonical ruleset both live in `@blinkered/engine`, because the client has to
agree with the server about them and two implementations of a rule drift.

[docs/ACCOUNTS.md](../../docs/ACCOUNTS.md) is the design, [docs/AUTH.md](../../docs/AUTH.md) is
what has to be configured in Google's and Apple's consoles, and
[docs/DEPLOY.md](../../docs/DEPLOY.md) covers the Helm chart.

## Running it locally

```
pnpm --filter @blinkered/server db:up        # Postgres on 55432, waits until it answers
pnpm build                                   # or `pnpm typecheck`; the server runs from dist
pnpm --filter @blinkered/server migrate      # creates the schema and the tables
pnpm --filter @blinkered/server start        # http://localhost:8080/healthz
```

`migrate` and `start` read the same seven environment variables the deployment secret carries, so
running them by hand means setting them:

```
export BLINKERED_DB_HOST=localhost BLINKERED_DB_PORT=55432 BLINKERED_DB_TLS=false \
       BLINKERED_DB_USER=blinkered BLINKERED_DB_PASSWORD=testpass \
       BLINKERED_DB_NAME=blinkered BLINKERED_DB_SCHEMA=blinkered
```

Getting one of them wrong is not subtle on purpose: the process reports every problem at once and
refuses to start, rather than reporting the first one per deploy.

`pnpm --filter @blinkered/server db:down` removes the container **and its volume**.

## Testing it

```
pnpm test                # the unit suite, no database, 100% coverage gate
pnpm test:integration    # needs the Postgres above
```

Two suites rather than one with a skip in it. The CI matrix includes a macOS runner and GitHub's
macOS runners have no Docker, so a database test in the main suite would fail there and nowhere
else; and a suite that quietly skips everything looks exactly like a suite that passed. CI runs
the integration one in a ubuntu-only job with a Postgres service.

The integration suite drops and recreates the schema on every run, so it never inherits state
from the last one. It does that to the database named above and nothing else.

## Migrations

`src/schema.ts` is the source of truth. After changing it:

```
cd apps/server && npx drizzle-kit generate --name=<what-changed>
```

Then commit the generated SQL. It is applied by `runMigrations`, which is an entrypoint of its
own rather than something the API does at startup: there is more than one replica, and two pods
starting together would race.

**The schema name is a constant, not a setting**, and this is the one place the deployment's
seven-key contract is not a free dial. `drizzle-kit` writes the schema into every foreign key it
generates, so tables declared unqualified are created wherever `search_path` points while their
foreign keys still say `"public"`. `DATABASE_SCHEMA` in `src/schema.ts` is what the generated SQL
names; `BLINKERED_DB_SCHEMA` has to match it, and `runMigrations` refuses to start if it does not
rather than half-applying and leaving an application that connects perfectly and sees no tables.
