CREATE TABLE "blinkered"."game_detail" (
	"game_id" text PRIMARY KEY NOT NULL,
	"version" smallint NOT NULL,
	"detail" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blinkered"."game_detail" ADD CONSTRAINT "game_detail_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "blinkered"."games"("id") ON DELETE cascade ON UPDATE no action;