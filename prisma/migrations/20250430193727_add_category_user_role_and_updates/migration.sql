-- CreateEnum
CREATE TYPE "UserRole" AS ENUM (
    'USER',
    'ADMIN'
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- AlterTable
-- Rename column appointments to totalReviews in Professional table
ALTER TABLE "Professional" RENAME COLUMN "appointments" TO "totalReviews";

-- AlterTable
-- Make professionalId optional in Appointment table
ALTER TABLE "Appointment" ALTER COLUMN "professionalId" DROP NOT NULL;

-- DropForeignKey
-- Drop the old foreign key constraint which used ON DELETE RESTRICT
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_professionalId_fkey";

-- AddForeignKey
-- Add the new foreign key constraint using ON DELETE SET NULL as defined in the schema
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

