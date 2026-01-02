-- Add gateway_id to sensor_reading and backfill from sensor.gateway_id.
ALTER TABLE "sensor_reading" ADD COLUMN "gateway_id" TEXT;

UPDATE "sensor_reading" AS sr
SET "gateway_id" = s."gateway_id"
FROM "sensor" AS s
WHERE sr."sensor_id" = s."id";

ALTER TABLE "sensor_reading" ALTER COLUMN "gateway_id" SET NOT NULL;

CREATE INDEX "sensor_reading_gateway_id_recorded_at_idx" ON "sensor_reading" ("gateway_id", "recorded_at");

ALTER TABLE "sensor_reading"
ADD CONSTRAINT "sensor_reading_gateway_id_fkey"
FOREIGN KEY ("gateway_id") REFERENCES "gateway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
