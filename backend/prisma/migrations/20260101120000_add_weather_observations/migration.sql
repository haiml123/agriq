-- Add weather_observation table to store outside weather snapshots per site.
CREATE TABLE "weather_observation" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_observation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "weather_observation_site_id_recorded_at_key" ON "weather_observation" ("site_id", "recorded_at");
CREATE INDEX "weather_observation_site_id_recorded_at_idx" ON "weather_observation" ("site_id", "recorded_at");

ALTER TABLE "weather_observation"
ADD CONSTRAINT "weather_observation_site_id_fkey"
FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
