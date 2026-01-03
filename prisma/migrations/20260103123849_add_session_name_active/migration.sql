-- Align Player.name nullability with schema
ALTER TABLE "Player" ALTER COLUMN "name" DROP NOT NULL;

-- Add Session name/active in a backfill-safe way
ALTER TABLE "Session" ADD COLUMN "name" TEXT;
ALTER TABLE "Session" ADD COLUMN "active" BOOLEAN DEFAULT true;

-- Backfill existing sessions
UPDATE "Session"
SET "name" = COALESCE("name", 'Session ' || to_char("date", 'YYYY-MM-DD'));

UPDATE "Session"
SET "active" = COALESCE("active", true);

-- Enforce constraints/defaults
ALTER TABLE "Session" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "active" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "active" SET DEFAULT true;
