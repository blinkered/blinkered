-- How often an exposed, unselected letter turns back over of its own accord.
--
-- The game is called Blinkered and until this rule the letters did not hide from anybody: they
-- queued, in an order the grid could be read for, and nothing on the board ever took itself away.
-- Recorded per game because it is part of the ruleset, and `isCanonical` compares a stored
-- ruleset field by field against the preset it claims to be.
--
-- **Zero-downtime.** Additive, `not null default 0`, so pods that know nothing about it keep
-- writing valid rows, and every game stored before now reads as a game where no letter ever hid.
-- That is the honest value rather than a convenient one: those games really were played without
-- the rule. It does mean they stop matching the presets that now hide, so they stop being
-- canonical, which is what `engine_version` exists to keep off the same board as the new ones.

ALTER TABLE "blinkered"."games" ADD COLUMN "hide_chance" double precision DEFAULT 0 NOT NULL;
