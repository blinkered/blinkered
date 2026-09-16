-- A report outlives everybody named in it.
--
-- `subject_user_id` and `subject_game_id` were `on delete cascade`, so deleting an account also
-- deleted every report about it, and our own count of how much moderating we had done shrank
-- quietly every time somebody left. `reporter_user_id` was already `set null` and is untouched.
-- All three now agree: the report survives, the link to the person does not.
--
-- What the subject side does **not** buy is any defence against the person coming back. The
-- delete path nulls `reason` too, so nothing here remembers them and nothing recognises a new
-- account as theirs. Ban evasion is undefended and this does not change that. What survives is
-- ours: the counts, and the reporter's link, so a reporter's record stands after their subjects
-- leave.
--
-- The rename to `_fkey` is drizzle 1.0 adopting Postgres's own constraint naming, where v0 used
-- `_fk`. It is done first so the two statements below can name one thing.
--
-- **Two statements were removed from what drizzle generated**, and that is worth recording rather
-- than leaving as a diff nobody can explain. It also wanted to drop and recreate
-- `games_leaderboard_idx`, because 1.0 renders the same index differently than v0 wrote it.
-- Compared against the live definition first, and it is identical --
-- `(language, difficulty, engine_version, score DESC NULLS LAST, rounds_played, finished_at)
-- WHERE (leaderboard_eligible AND (NOT hidden))` either way. So it is a no-op rebuild of the one
-- index the leaderboard's ordering depends on, in a migration about reports. Dropped from here;
-- the snapshot already carries the 1.0 rendering, so nothing re-proposes it.
ALTER TABLE "blinkered"."reports" RENAME CONSTRAINT "reports_subject_user_id_users_id_fk" TO "reports_subject_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "blinkered"."reports" RENAME CONSTRAINT "reports_subject_game_id_games_id_fk" TO "reports_subject_game_id_games_id_fkey";--> statement-breakpoint
ALTER TABLE "blinkered"."reports" DROP CONSTRAINT "reports_subject_user_id_users_id_fkey", ADD CONSTRAINT "reports_subject_user_id_users_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "blinkered"."users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "blinkered"."reports" DROP CONSTRAINT "reports_subject_game_id_games_id_fkey", ADD CONSTRAINT "reports_subject_game_id_games_id_fkey" FOREIGN KEY ("subject_game_id") REFERENCES "blinkered"."games"("id") ON DELETE SET NULL;
