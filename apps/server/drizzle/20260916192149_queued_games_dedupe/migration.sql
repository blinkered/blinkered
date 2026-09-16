-- The client's own id for a game, so a queued upload is safe to retry.
--
-- A game finished with no network is queued on the device and posted when there is one, so the
-- same game can arrive twice: a retry whose response was lost is indistinguishable from a second
-- attempt. The key makes the second one a no-op instead of a phantom game in somebody's history.
--
-- **This one is zero-downtime, unlike 20260916170529.** The column is nullable and additive, so
-- old pods that know nothing about it keep writing valid rows throughout, and new pods reading it
-- get null for every row written before now -- which is the truth rather than a gap. Nothing is
-- renamed and nothing is dropped, so there is no window where a pod in service queries a column
-- that is not there.
--
-- The index is not `CONCURRENTLY`, which is a real choice rather than an oversight: drizzle wraps
-- each migration in a transaction and `CREATE INDEX CONCURRENTLY` cannot run in one. It takes a
-- write lock on `games` for the length of the build. At the current size that is imperceptible,
-- and at a size where it is not, the answer is to take this statement out of the migration and
-- run it by hand rather than to make the migration runner cleverer.
--
-- Partial on `client_key is not null`. Two nulls never collide in Postgres, so the predicate is
-- not what makes the old rows legal; it is there so the reason they are legal is written down.

ALTER TABLE "blinkered"."games" ADD COLUMN "client_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "games_user_client_key_key" ON "blinkered"."games" ("user_id","client_key") WHERE "client_key" is not null;