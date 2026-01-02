-- Drop capacity and add dimensions with defaults for existing rows
ALTER TABLE "cell"
DROP COLUMN "capacity",
ADD COLUMN "height" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "length" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "width" DOUBLE PRECISION NOT NULL DEFAULT 0;
