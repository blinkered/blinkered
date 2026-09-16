-- Detail document version 1 -> 2.
--
-- `boards` was an array of strings and is now an array of objects, so that a round can say which
-- of its slots were showing as a wild as well as what the faces were. Hand-written rather than
-- generated: drizzle-kit diffs the schema, and nothing about the schema changed. The shape lives
-- inside a jsonb column, which is exactly the trade the document was chosen for -- this is a
-- migration instead of an `alter table`, and it is the whole reason `version` is a column.
--
-- The rule this exists to honour, from src/schema.ts: a migration rewrites old documents, and
-- readers do not accumulate. There is one reader, and after this runs there is one shape.
--
-- Version 1 documents recorded no wild information at all, so `wilds` is simply absent on every
-- board they carry. Absent is the honest answer: it says the game had no wilds recorded, not that
-- it had none.
UPDATE "blinkered"."game_detail"
SET
  detail = jsonb_set(
    detail,
    '{boards}',
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object('tiles', face) ORDER BY ordinality)
        FROM jsonb_array_elements_text(detail -> 'boards') WITH ORDINALITY AS t (face, ordinality)
      ),
      '[]'::jsonb
    )
  ),
  version = 2
WHERE
  version = 1;
