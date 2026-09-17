-- Whether a game's clock ever stopped, which is what costs it a place on a board.
--
-- The exploit is Nick's and has no technical fix: screen-cap the board, pause, pick the words out
-- of the photograph at leisure, resume, miss nothing. iOS cannot hide a view from a screenshot on
-- request, and a second phone photographing the screen defeats anything that could. So the game
-- declines to rank a game whose clock stopped instead of pretending to prevent the capture.
--
-- **Zero-downtime.** Additive, `not null default false`, so pods that know nothing about it keep
-- writing valid rows and every game stored before now reads as never paused -- which is the
-- honest answer for games played before the client reported it, and the one that leaves the
-- boards as they are rather than emptying them.

ALTER TABLE "blinkered"."games" ADD COLUMN "paused" boolean DEFAULT false NOT NULL;