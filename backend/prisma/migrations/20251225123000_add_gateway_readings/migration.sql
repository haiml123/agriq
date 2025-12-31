-- Add gateway_reading table to store readings sent by gateway devices.
CREATE TABLE "gateway_reading" (
    "id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "cell_id" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "battery_percent" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gateway_reading_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gateway_reading_gateway_id_recorded_at_idx" ON "gateway_reading" ("gateway_id", "recorded_at");
CREATE INDEX "gateway_reading_cell_id_recorded_at_idx" ON "gateway_reading" ("cell_id", "recorded_at");

ALTER TABLE "gateway_reading"
ADD CONSTRAINT "gateway_reading_gateway_id_fkey"
FOREIGN KEY ("gateway_id") REFERENCES "gateway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "gateway_reading"
ADD CONSTRAINT "gateway_reading_cell_id_fkey"
FOREIGN KEY ("cell_id") REFERENCES "cell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
