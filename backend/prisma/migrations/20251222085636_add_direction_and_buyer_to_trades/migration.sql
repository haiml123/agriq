-- AlterTable
ALTER TABLE "trade" ADD COLUMN     "buyer" TEXT,
ADD COLUMN     "direction" TEXT DEFAULT 'IN';
