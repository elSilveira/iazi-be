/*
  Warnings:

  - The `schedule` column on the `professional_services` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "professional_services" DROP COLUMN "schedule",
ADD COLUMN     "schedule" JSONB;
