-- Update sensor_reading payload to store temperature, humidity, and battery percent per row.
DROP INDEX IF EXISTS "sensor_reading_sensor_id_metric_recorded_at_idx";
DROP INDEX IF EXISTS "sensor_reading_cell_id_metric_recorded_at_idx";

ALTER TABLE "sensor_reading"
  DROP COLUMN IF EXISTS "metric",
  DROP COLUMN IF EXISTS "value",
  ADD COLUMN "temperature" DOUBLE PRECISION NOT NULL,
  ADD COLUMN "humidity" DOUBLE PRECISION NOT NULL,
  ADD COLUMN "battery_percent" DOUBLE PRECISION NOT NULL;

CREATE INDEX "sensor_reading_sensor_id_recorded_at_idx" ON "sensor_reading" ("sensor_id", "recorded_at");
CREATE INDEX "sensor_reading_cell_id_recorded_at_idx" ON "sensor_reading" ("cell_id", "recorded_at");
