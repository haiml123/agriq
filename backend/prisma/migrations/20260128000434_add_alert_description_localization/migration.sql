-- AlterTable
ALTER TABLE "alert" ADD COLUMN     "description_key" TEXT,
ADD COLUMN     "description_params" JSONB;
