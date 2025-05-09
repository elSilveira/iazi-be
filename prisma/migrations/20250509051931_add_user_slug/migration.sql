/*
  Warnings:

  - You are about to drop the column `message` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `related_entity_id` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `related_entity_type` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `author_id` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `awarded_at` on the `gamification_events` table. All the data in the column will be lost.
  - You are about to drop the column `related_entity_id` on the `gamification_events` table. All the data in the column will be lost.
  - You are about to drop the column `related_entity_type` on the `gamification_events` table. All the data in the column will be lost.
  - You are about to drop the column `author_id` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `reviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `activity_type` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STAFF';

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_author_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_fkey";

-- DropIndex
DROP INDEX "activity_logs_created_at_idx";

-- DropIndex
DROP INDEX "activity_logs_type_idx";

-- DropIndex
DROP INDEX "comments_author_id_idx";

-- DropIndex
DROP INDEX "gamification_events_awarded_at_idx";

-- DropIndex
DROP INDEX "posts_author_id_idx";

-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN "message",
DROP COLUMN "related_entity_id",
DROP COLUMN "related_entity_type",
DROP COLUMN "type",
ADD COLUMN     "activity_type" TEXT NOT NULL,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "reference_id" TEXT;

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "author_id",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "gamification_events" DROP COLUMN "awarded_at",
DROP COLUMN "related_entity_id",
DROP COLUMN "related_entity_type",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "details" JSONB,
ALTER COLUMN "points_awarded" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "author_id",
DROP COLUMN "imageUrl",
DROP COLUMN "title",
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "video_url" TEXT;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "created_at";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "slug" TEXT NOT NULL DEFAULT 'temp-slug';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "activity_logs_activity_type_idx" ON "activity_logs"("activity_type");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
