-- DropForeignKey
ALTER TABLE "gateway" DROP CONSTRAINT "gateway_cell_id_fkey";

-- DropIndex
DROP INDEX "gateway_organization_id_idx";

-- DropIndex
DROP INDEX "gateway_site_id_idx";

-- DropIndex
DROP INDEX "sensor_gateway_id_idx";

-- AddForeignKey
ALTER TABLE "gateway" ADD CONSTRAINT "gateway_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "cell"("id") ON DELETE SET NULL ON UPDATE CASCADE;
