CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
ALTER TABLE "tb_users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;