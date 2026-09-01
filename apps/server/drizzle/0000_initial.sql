CREATE TABLE "blinkered"."auth_identities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"email" text,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blinkered"."game_words" (
	"game_id" text NOT NULL,
	"ordinal" smallint NOT NULL,
	"word" text NOT NULL,
	"tiles" smallint NOT NULL,
	"points" integer NOT NULL,
	CONSTRAINT "game_words_game_id_ordinal_pk" PRIMARY KEY("game_id","ordinal")
);
--> statement-breakpoint
CREATE TABLE "blinkered"."games" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"seed" integer NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"imported" boolean DEFAULT false NOT NULL,
	"difficulty" text NOT NULL,
	"language" text NOT NULL,
	"canonical" boolean NOT NULL,
	"n" smallint NOT NULL,
	"speed_multiplier" double precision NOT NULL,
	"hold_ticks" smallint NOT NULL,
	"initial_flips" integer NOT NULL,
	"w_min" integer NOT NULL,
	"min_word_length" smallint NOT NULL,
	"word_complete_mode" text NOT NULL,
	"flip_economy" text NOT NULL,
	"charge_full_round" boolean NOT NULL,
	"wild_chance" double precision NOT NULL,
	"replace_chance" double precision NOT NULL,
	"letters" text[] NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"words_count" integer DEFAULT 0 NOT NULL,
	"rounds_played" integer DEFAULT 0 NOT NULL,
	"engine_version" text NOT NULL,
	"dictionary_version" text,
	"leaderboard_eligible" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "blinkered"."login_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "blinkered"."reports" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_user_id" text,
	"subject_user_id" text,
	"subject_game_id" text,
	"field" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "blinkered"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "blinkered"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"username_normalized" text NOT NULL,
	"country" text,
	"ui_language" text,
	"game_language" text,
	"bio" text,
	"avatar_seed" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "blinkered"."auth_identities" ADD CONSTRAINT "auth_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "blinkered"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blinkered"."game_words" ADD CONSTRAINT "game_words_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "blinkered"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blinkered"."games" ADD CONSTRAINT "games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "blinkered"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blinkered"."reports" ADD CONSTRAINT "reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "blinkered"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blinkered"."reports" ADD CONSTRAINT "reports_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "blinkered"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blinkered"."reports" ADD CONSTRAINT "reports_subject_game_id_games_id_fk" FOREIGN KEY ("subject_game_id") REFERENCES "blinkered"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blinkered"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "blinkered"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_provider_account_key" ON "blinkered"."auth_identities" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "auth_identities_user_idx" ON "blinkered"."auth_identities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "games_user_finished_idx" ON "blinkered"."games" USING btree ("user_id","finished_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "games_leaderboard_idx" ON "blinkered"."games" USING btree ("language","difficulty","engine_version","score" DESC NULLS LAST,"rounds_played","finished_at") WHERE "blinkered"."games"."leaderboard_eligible" and not "blinkered"."games"."hidden";--> statement-breakpoint
CREATE INDEX "login_codes_email_idx" ON "blinkered"."login_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "reports_unresolved_idx" ON "blinkered"."reports" USING btree ("created_at") WHERE resolved_at is null;--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "blinkered"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_normalized_key" ON "blinkered"."users" USING btree ("username_normalized");