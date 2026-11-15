-- Align migration history with the schema: guest snapshot columns were removed
-- from the Order model and the local database, but no migration dropped them.
ALTER TABLE "Order"
DROP COLUMN IF EXISTS "guestName",
DROP COLUMN IF EXISTS "guestPhone";
