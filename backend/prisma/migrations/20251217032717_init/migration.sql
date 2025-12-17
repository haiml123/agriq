-- CreateEnum
CREATE TYPE "role_type" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "alert_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "alert_status" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "metric_type" AS ENUM ('TEMPERATURE', 'HUMIDITY', 'EMC');

-- CreateEnum
CREATE TYPE "trigger_scope" AS ENUM ('ORGANIZATION', 'ALL');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "invite_status" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "entity_status" AS ENUM ('ACTIVE', 'PENDING', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR');

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "entity_status" NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "status" "entity_status" NOT NULL DEFAULT 'ACTIVE',
    "user_role" "user_role" NOT NULL DEFAULT 'OPERATOR',
    "language_preference" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "site_id" TEXT,
    "status" "invite_status" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "accepted_by_id" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_user" (
    "user_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "site_role" "user_role" NOT NULL DEFAULT 'OPERATOR',

    CONSTRAINT "site_user_pkey" PRIMARY KEY ("user_id","site_id")
);

-- CreateTable
CREATE TABLE "compound" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "entity_status" NOT NULL,
    "site_id" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cell" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "entity_status" NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "compound_id" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT,
    "status" "entity_status" NOT NULL,
    "cell_id" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_reading" (
    "id" TEXT NOT NULL,
    "sensor_id" TEXT NOT NULL,
    "cell_id" TEXT NOT NULL,
    "metric" "metric_type" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_trigger" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope_type" "trigger_scope" NOT NULL DEFAULT 'ALL',
    "commodity_type_id" TEXT,
    "commodity_id" TEXT,
    "organization_id" TEXT,
    "site_id" TEXT,
    "compound_id" TEXT,
    "sensor_id" TEXT,
    "cell_id" TEXT,
    "conditionLogic" TEXT NOT NULL DEFAULT 'AND',
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "severity" "alert_severity" NOT NULL DEFAULT 'MEDIUM',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "entity_status" NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_trigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert" (
    "id" TEXT NOT NULL,
    "trigger_id" TEXT,
    "site_id" TEXT NOT NULL,
    "compound_id" TEXT,
    "cell_id" TEXT,
    "sensor_id" TEXT,
    "commodity_id" TEXT,
    "organization_id" TEXT,
    "user_id" TEXT,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "severity" "alert_severity" NOT NULL,
    "status" "alert_status" NOT NULL DEFAULT 'OPEN',
    "threshold_value" DOUBLE PRECISION,
    "unit" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_notification" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "user_id" TEXT,
    "channel" "notification_channel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "notification_status" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "external_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commodity_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "entity_status" NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commodity_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_table" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "commodity_type_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lookup_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commodity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT,
    "commodity_type_id" TEXT,
    "organization_id" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commodity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade" (
    "id" TEXT NOT NULL,
    "commodity_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "compound_id" TEXT,
    "cell_id" TEXT,
    "amount_kg" DOUBLE PRECISION NOT NULL,
    "traded_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_status_idx" ON "organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_idx" ON "refresh_token"("user_id");

-- CreateIndex
CREATE INDEX "refresh_token_expires_at_idx" ON "refresh_token"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "invite_token_key" ON "invite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invite_accepted_by_id_key" ON "invite"("accepted_by_id");

-- CreateIndex
CREATE INDEX "invite_email_idx" ON "invite"("email");

-- CreateIndex
CREATE INDEX "invite_status_idx" ON "invite"("status");

-- CreateIndex
CREATE INDEX "invite_organization_id_idx" ON "invite"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "sensor_external_id_key" ON "sensor"("external_id");

-- CreateIndex
CREATE INDEX "sensor_reading_sensor_id_metric_recorded_at_idx" ON "sensor_reading"("sensor_id", "metric", "recorded_at");

-- CreateIndex
CREATE INDEX "sensor_reading_cell_id_metric_recorded_at_idx" ON "sensor_reading"("cell_id", "metric", "recorded_at");

-- CreateIndex
CREATE INDEX "event_trigger_is_active_scope_type_idx" ON "event_trigger"("is_active", "scope_type");

-- CreateIndex
CREATE INDEX "event_trigger_site_id_idx" ON "event_trigger"("site_id");

-- CreateIndex
CREATE INDEX "event_trigger_organization_id_idx" ON "event_trigger"("organization_id");

-- CreateIndex
CREATE INDEX "alert_site_id_status_idx" ON "alert"("site_id", "status");

-- CreateIndex
CREATE INDEX "alert_cell_id_status_idx" ON "alert"("cell_id", "status");

-- CreateIndex
CREATE INDEX "alert_trigger_id_status_idx" ON "alert"("trigger_id", "status");

-- CreateIndex
CREATE INDEX "alert_sensor_id_idx" ON "alert"("sensor_id");

-- CreateIndex
CREATE INDEX "alert_commodity_id_idx" ON "alert"("commodity_id");

-- CreateIndex
CREATE INDEX "alert_organization_id_idx" ON "alert"("organization_id");

-- CreateIndex
CREATE INDEX "alert_notification_alert_id_idx" ON "alert_notification"("alert_id");

-- CreateIndex
CREATE INDEX "alert_notification_user_id_idx" ON "alert_notification"("user_id");

-- CreateIndex
CREATE INDEX "alert_notification_status_attempts_idx" ON "alert_notification"("status", "attempts");

-- CreateIndex
CREATE UNIQUE INDEX "commodity_type_name_key" ON "commodity_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_table_commodity_type_id_key" ON "lookup_table"("commodity_type_id");

-- CreateIndex
CREATE INDEX "commodity_name_idx" ON "commodity"("name");

-- CreateIndex
CREATE INDEX "commodity_commodity_type_id_idx" ON "commodity"("commodity_type_id");

-- CreateIndex
CREATE INDEX "commodity_organization_id_idx" ON "commodity"("organization_id");

-- CreateIndex
CREATE INDEX "trade_site_id_traded_at_idx" ON "trade"("site_id", "traded_at");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site" ADD CONSTRAINT "site_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_user" ADD CONSTRAINT "site_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_user" ADD CONSTRAINT "site_user_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compound" ADD CONSTRAINT "compound_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell" ADD CONSTRAINT "cell_compound_id_fkey" FOREIGN KEY ("compound_id") REFERENCES "compound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor" ADD CONSTRAINT "sensor_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "cell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_reading" ADD CONSTRAINT "sensor_reading_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_reading" ADD CONSTRAINT "sensor_reading_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "cell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_trigger" ADD CONSTRAINT "event_trigger_commodity_type_id_fkey" FOREIGN KEY ("commodity_type_id") REFERENCES "commodity_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_trigger" ADD CONSTRAINT "event_trigger_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "commodity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_trigger" ADD CONSTRAINT "event_trigger_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_trigger" ADD CONSTRAINT "event_trigger_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_trigger" ADD CONSTRAINT "event_trigger_compound_id_fkey" FOREIGN KEY ("compound_id") REFERENCES "compound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_trigger" ADD CONSTRAINT "event_trigger_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_trigger" ADD CONSTRAINT "event_trigger_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "cell"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_trigger" ADD CONSTRAINT "event_trigger_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_trigger" ADD CONSTRAINT "event_trigger_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_trigger_id_fkey" FOREIGN KEY ("trigger_id") REFERENCES "event_trigger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_compound_id_fkey" FOREIGN KEY ("compound_id") REFERENCES "compound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "cell"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "commodity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_notification" ADD CONSTRAINT "alert_notification_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_notification" ADD CONSTRAINT "alert_notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookup_table" ADD CONSTRAINT "lookup_table_commodity_type_id_fkey" FOREIGN KEY ("commodity_type_id") REFERENCES "commodity_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commodity" ADD CONSTRAINT "commodity_commodity_type_id_fkey" FOREIGN KEY ("commodity_type_id") REFERENCES "commodity_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commodity" ADD CONSTRAINT "commodity_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_compound_id_fkey" FOREIGN KEY ("compound_id") REFERENCES "compound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "cell"("id") ON DELETE SET NULL ON UPDATE CASCADE;
