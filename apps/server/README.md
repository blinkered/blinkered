# @blinkered/server

The API: accounts, history and, later, leaderboards. It owns no game rules. What a word is worth
and what counts as a canonical ruleset both live in `@blinkered/engine`, because the client has to
agree with the server about them and two implementations of a rule drift.

[docs/ACCOUNTS.md](../../docs/ACCOUNTS.md) is the design, [docs/AUTH.md](../../docs/AUTH.md) is
what has to be configured in Google's and Apple's consoles, and
[docs/DEPLOY.md](../../docs/DEPLOY.md) covers the Helm chart.

## Running it locally

The whole application, built and wired the way it is deployed, is one command at the repo root:

```
docker compose up          # http://localhost:8080, site at / and this at /v1
```

That builds images, so it is for checking the deployed shape rather than for editing. Nothing in
it reloads.

## The edit loop, which does reload

Three terminals, and everything in them is live:

```
pnpm --filter @blinkered/server db:up        # 1. Postgres on 55432, waits until it answers
pnpm --filter @blinkered/server dev          # 2. the API, restarts on save
pnpm dev                                     # 3. the site with hot reload, on :5173
```

**`pnpm dev` proxies `/v1` to the API**, so the dev server is one origin exactly as production
is. That matters more than convenience: the session is a same-origin cookie, and running the two
on separate ports would need CORS to work at all, which is a difference between development and
production that hides bugs in both directions.

The API's watcher is `tsx`, which runs the TypeScript directly, so a save is a restart in about
two seconds and there is no build step in the loop. What ships is still `tsc` output; `tsx` is
only ever the developer's.

Set the seven variables in the API's terminal, or it will refuse to start and tell you which are
missing:

```
export BLINKERED_DB_HOST=localhost BLINKERED_DB_PORT=55432 BLINKERED_DB_TLS=false \
       BLINKERED_DB_USER=blinkered BLINKERED_DB_PASSWORD=testpass \
       BLINKERED_DB_NAME=blinkered BLINKERED_DB_SCHEMA=blinkered
```

To run the built server instead of the watcher, `pnpm build` then
`pnpm --filter @blinkered/server start`.

Getting a variable wrong is not subtle on purpose: the process reports every problem at once and
refuses to start, rather than one problem per attempt.

`pnpm --filter @blinkered/server db:down` removes the container **and its volume**.

## Two health checks, on purpose

`/healthz` is the kubelet's: reached on the pod directly, never through the ingress, and it says
nothing about the database. A liveness probe that fails when a dependency is unreachable gets the
pod restarted, which does not reach the dependency either, so an outage downstream becomes a
crash loop upstream.

`/v1/healthz` is reached the way a browser reaches everything else. It answering is proof of the
whole path -- ingress rule, service, port -- which is a different fact from the process being
alive, and the one that is usually wrong after a deployment change.

The `/v1` prefix is **not** stripped on the way in. Traefik forwards the path as it stands, so the
app owns the prefix, and the local nginx proxy is configured to behave the same way rather than
helpfully rewriting it. A development stack that differs from production in its routing is one
that cannot show you a routing bug.

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

While iterating, `pnpm --filter @blinkered/server db:push` writes `schema.ts` straight into the
local database with no migration file in between, so a column can be tried and changed again
without leaving a trail of experiments in `drizzle/`. It is a development tool and nothing else:
**never push to a database holding rows somebody cares about.** There is also `db:studio`, which
opens drizzle's browser for the same database.

Once the shape has settled, generate the migration that ships:

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
