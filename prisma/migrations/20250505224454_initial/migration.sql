/*
  Warnings:

  - A unique constraint covering the columns `[name,company_id]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `price` on the `services` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "user_role" ADD VALUE 'PROFESSIONAL';

-- AlterTable
ALTER TABLE "professionals" ADD COLUMN     "working_hours" JSONB;

-- AlterTable
ALTER TABLE "services" DROP COLUMN "price",
ADD COLUMN     "price" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "schedule_blocks" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_url" TEXT,
    "points_threshold" INTEGER,
    "event_trigger" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("user_id","badge_id")
);

-- CreateTable
CREATE TABLE "gamification_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "related_entity_id" TEXT,
    "related_entity_type" TEXT,

    CONSTRAINT "gamification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_entity_id" TEXT,
    "related_entity_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT,
    "comment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_blocks_professional_id_idx" ON "schedule_blocks"("professional_id");

-- CreateIndex
CREATE INDEX "schedule_blocks_start_time_idx" ON "schedule_blocks"("start_time");

-- CreateIndex
CREATE INDEX "schedule_blocks_end_time_idx" ON "schedule_blocks"("end_time");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE INDEX "badges_name_idx" ON "badges"("name");

-- CreateIndex
CREATE INDEX "user_badges_badge_id_idx" ON "user_badges"("badge_id");

-- CreateIndex
CREATE INDEX "gamification_events_user_id_idx" ON "gamification_events"("user_id");

-- CreateIndex
CREATE INDEX "gamification_events_event_type_idx" ON "gamification_events"("event_type");

-- CreateIndex
CREATE INDEX "gamification_events_awarded_at_idx" ON "gamification_events"("awarded_at");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "activity_logs_type_idx" ON "activity_logs"("type");

-- CreateIndex
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");

-- CreateIndex
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "comments_created_at_idx" ON "comments"("created_at");

-- CreateIndex
CREATE INDEX "likes_post_id_idx" ON "likes"("post_id");

-- CreateIndex
CREATE INDEX "likes_comment_id_idx" ON "likes"("comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_post_id_key" ON "likes"("user_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_comment_id_key" ON "likes"("user_id", "comment_id");

-- CreateIndex
CREATE INDEX "appointments_user_id_idx" ON "appointments"("user_id");

-- CreateIndex
CREATE INDEX "appointments_service_id_idx" ON "appointments"("service_id");

-- CreateIndex
CREATE INDEX "appointments_professional_id_idx" ON "appointments"("professional_id");

-- CreateIndex
CREATE INDEX "appointments_date_idx" ON "appointments"("date");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_rating_idx" ON "companies"("rating");

-- CreateIndex
CREATE INDEX "companies_categories_idx" ON "companies" USING GIN ("categories");

-- CreateIndex
CREATE INDEX "company_addresses_city_idx" ON "company_addresses"("city");

-- CreateIndex
CREATE INDEX "company_addresses_state_idx" ON "company_addresses"("state");

-- CreateIndex
CREATE INDEX "professional_education_professional_id_idx" ON "professional_education"("professional_id");

-- CreateIndex
CREATE INDEX "professional_experiences_professional_id_idx" ON "professional_experiences"("professional_id");

-- CreateIndex
CREATE INDEX "professional_services_service_id_idx" ON "professional_services"("service_id");

-- CreateIndex
CREATE INDEX "professionals_name_idx" ON "professionals"("name");

-- CreateIndex
CREATE INDEX "professionals_rating_idx" ON "professionals"("rating");

-- CreateIndex
CREATE INDEX "professionals_company_id_idx" ON "professionals"("company_id");

-- CreateIndex
CREATE INDEX "professionals_role_idx" ON "professionals"("role");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_service_id_idx" ON "reviews"("service_id");

-- CreateIndex
CREATE INDEX "reviews_professional_id_idx" ON "reviews"("professional_id");

-- CreateIndex
CREATE INDEX "reviews_company_id_idx" ON "reviews"("company_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "services_name_idx" ON "services"("name");

-- CreateIndex
CREATE INDEX "services_price_idx" ON "services"("price");

-- CreateIndex
CREATE INDEX "services_category_id_idx" ON "services"("category_id");

-- CreateIndex
CREATE INDEX "services_company_id_idx" ON "services"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_company_id_key" ON "services"("name", "company_id");

-- CreateIndex
CREATE INDEX "user_addresses_user_id_idx" ON "user_addresses"("user_id");

-- CreateIndex
CREATE INDEX "user_addresses_city_idx" ON "user_addresses"("city");

-- CreateIndex
CREATE INDEX "user_addresses_state_idx" ON "user_addresses"("state");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_points_idx" ON "users"("points");

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_events" ADD CONSTRAINT "gamification_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
