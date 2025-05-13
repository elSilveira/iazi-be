/*
  Warnings:

  - You are about to drop the column `date` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `end_time` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'IN_PROGRESS';

-- DropIndex
DROP INDEX "appointments_date_idx";

-- AlterTable
-- First, add the new columns allowing NULL values
ALTER TABLE "appointments" ADD COLUMN "company_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN "start_time" TIMESTAMP(3);
ALTER TABLE "appointments" ADD COLUMN "end_time" TIMESTAMP(3);

-- Set values for new columns based on existing data
UPDATE "appointments" SET "start_time" = "date";
-- Get service duration and calculate end time (assuming default 1 hour if no service data)
UPDATE "appointments" 
SET "end_time" = "start_time" + INTERVAL '1 hour'
WHERE "end_time" IS NULL;

-- Make columns NOT NULL after setting values
ALTER TABLE "appointments" 
  ALTER COLUMN "start_time" SET NOT NULL,
  ALTER COLUMN "end_time" SET NOT NULL;

-- Finally, drop the old column
ALTER TABLE "appointments" DROP COLUMN "date";

-- CreateIndex
CREATE INDEX "appointments_company_id_idx" ON "appointments"("company_id");

-- CreateIndex
CREATE INDEX "appointments_start_time_idx" ON "appointments"("start_time");

-- CreateIndex
CREATE INDEX "appointments_end_time_idx" ON "appointments"("end_time");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
