-- Add latest reading snapshot fields to gateway
ALTER TABLE "gateway"
ADD COLUMN "last_temperature" DOUBLE PRECISION,
ADD COLUMN "last_humidity" DOUBLE PRECISION,
ADD COLUMN "last_battery" DOUBLE PRECISION,
ADD COLUMN "last_reading_at" TIMESTAMP(3);
