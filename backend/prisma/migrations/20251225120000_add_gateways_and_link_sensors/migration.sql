-- Create gateways and re-link sensors to gateways instead of cells.
CREATE TABLE "gateway" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT,
    "status" "entity_status" NOT NULL,
    "cell_id" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gateway_external_id_key" ON "gateway"("external_id");
CREATE UNIQUE INDEX "gateway_cell_id_key" ON "gateway"("cell_id");

ALTER TABLE "gateway"
ADD CONSTRAINT "gateway_cell_id_fkey"
FOREIGN KEY ("cell_id") REFERENCES "cell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sensor" ADD COLUMN "gateway_id" TEXT;

INSERT INTO "gateway" (
    "id",
    "external_id",
    "name",
    "status",
    "cell_id",
    "created_by",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    'GW-' || "id",
    'Gateway - ' || "name",
    "status",
    "id",
    "created_by",
    "created_at",
    "updated_at"
FROM "cell";

UPDATE "sensor" SET "gateway_id" = "cell_id";

ALTER TABLE "sensor" ALTER COLUMN "gateway_id" SET NOT NULL;

ALTER TABLE "sensor" DROP CONSTRAINT "sensor_cell_id_fkey";
ALTER TABLE "sensor" DROP COLUMN "cell_id";

CREATE INDEX "sensor_gateway_id_idx" ON "sensor"("gateway_id");

ALTER TABLE "sensor"
ADD CONSTRAINT "sensor_gateway_id_fkey"
FOREIGN KEY ("gateway_id") REFERENCES "gateway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
