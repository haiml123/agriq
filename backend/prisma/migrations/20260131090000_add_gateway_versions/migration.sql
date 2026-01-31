-- Add gateway_version table to track available gateway firmware versions.
CREATE TABLE "gateway_version" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_version_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gateway_version_version_key" ON "gateway_version" ("version");
CREATE INDEX "gateway_version_is_active_idx" ON "gateway_version" ("is_active");
CREATE UNIQUE INDEX "gateway_version_single_active" ON "gateway_version" ("is_active") WHERE "is_active";
