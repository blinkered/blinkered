#!/bin/sh
# Runs the Postgres suite from `pnpm check` when a Postgres answers, and says so loudly when
# one does not.
#
# `pnpm check` did not cover `pnpm test:integration`, for a good reason: those suites need a
# live database, and GitHub's macOS runners have no Docker, so CI keeps them in a separate
# `database` job. The side effect was that nothing ran them on a development machine, and the
# day a table was added to `schema.ts` the one test holding a copy of the table list went red
# on six consecutive pushes before anybody looked at GitHub.
#
# So: probe, then run or report. The report is deliberately shouty, because the whole reason
# these suites are a separate config rather than a skip inside `pnpm test` is that a suite
# quietly running nothing looks exactly like a suite that passed -- and a gate that skips in
# silence would reintroduce that in a new place.
#
# A real query rather than an open port, because the port is open well before Postgres will
# answer -- the same race CI's `--health-cmd` is there to win. Connecting to `postgres` rather
# than to the test database, which the suite creates for itself.
set -eu

host=${BLINKERED_DB_HOST:-localhost}
port=${BLINKERED_DB_PORT:-55432}

# The other copy of these defaults is `apps/server/test/integrationDb.ts`, which is what the
# suite itself connects with. Two places, and they have to agree for this gate to mean
# anything; the alternative was importing TypeScript from a shell script.
if (cd apps/server && node --input-type=module -e "
  import postgres from 'postgres'
  const sql = postgres({
    host: process.env.BLINKERED_DB_HOST ?? 'localhost',
    port: Number(process.env.BLINKERED_DB_PORT ?? '55432'),
    user: process.env.BLINKERED_DB_USER ?? 'blinkered',
    password: process.env.BLINKERED_DB_PASSWORD ?? 'testpass',
    database: 'postgres',
    ssl: false,
    max: 1,
    connect_timeout: 3,
    onnotice: () => {},
  })
  try {
    await sql\`select 1\`
  } catch {
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 3 })
  }
") 2>/dev/null; then
  exec pnpm test:integration
fi

cat <<MSG

  ==> INTEGRATION SUITES SKIPPED <==

  Nothing answered Postgres at $host:$port, so the suites in
  \`vitest.integration.config.ts\` did not run. They are the only tests that check the
  committed migrations against a real database, and CI runs them in its \`database\` job
  either way -- so this is a gap in *this* run, not in the build.

  To close it here:  docker compose up -d

MSG
