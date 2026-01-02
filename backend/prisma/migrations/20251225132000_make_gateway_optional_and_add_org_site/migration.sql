-- Make gateway cell optional and add organization/site references.
ALTER TABLE "gateway" ALTER COLUMN "cell_id" DROP NOT NULL;

ALTER TABLE "gateway" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "gateway" ADD COLUMN "site_id" TEXT;

CREATE INDEX "gateway_organization_id_idx" ON "gateway" ("organization_id");
CREATE INDEX "gateway_site_id_idx" ON "gateway" ("site_id");

ALTER TABLE "gateway"
ADD CONSTRAINT "gateway_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "gateway"
ADD CONSTRAINT "gateway_site_id_fkey"
FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
