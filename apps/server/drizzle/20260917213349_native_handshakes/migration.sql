-- The two short-lived secrets the native app's sign-in needs: an Apple nonce and a Google handoff.
--
-- **Zero-downtime.** One new table and nothing else -- no column added to a table in service, no
-- rename, no drop -- so pods that know nothing about it keep serving throughout and the new
-- routes simply have somewhere to write when they arrive. The foreign key is on `users`, which
-- already exists, and `ON DELETE CASCADE` means deleting an account takes its handshakes with it
-- rather than leaving rows pointing at nobody.
--
-- `schema.ts` has the argument for why this is one table with a `kind` rather than two.

CREATE TABLE "blinkered"."native_handshakes" (
	"id" text PRIMARY KEY,
	"kind" text NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "native_handshakes_user_idx" ON "blinkered"."native_handshakes" ("user_id");--> statement-breakpoint
ALTER TABLE "blinkered"."native_handshakes" ADD CONSTRAINT "native_handshakes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "blinkered"."users"("id") ON DELETE CASCADE;