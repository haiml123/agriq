-- Add outside temperature/humidity to gateway_reading.
ALTER TABLE "gateway_reading"
ADD COLUMN "outside_temperature" DOUBLE PRECISION,
ADD COLUMN "outside_humidity" DOUBLE PRECISION;
