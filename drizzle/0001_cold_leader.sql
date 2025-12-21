CREATE TABLE "category" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon_name" varchar(255) DEFAULT '',
	"type" varchar(255) DEFAULT 'expense' NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
-- Insert categories from existing transactions, ensuring each user gets their own categories
INSERT INTO "category" ("id", "name", "icon_name", "type", "created_by", "created_at", "updated_at")
SELECT 
	gen_random_uuid()::text as "id",
	t."category" as "name",
	'' as "icon_name",
	COALESCE(MAX(t."type"), 'expense') as "type",
	t."user_id" as "created_by",
	now() as "created_at",
	now() as "updated_at"
FROM "transaction" t
WHERE t."category" IS NOT NULL AND t."category" != ''
GROUP BY t."user_id", t."category";
--> statement-breakpoint
-- Add category_id column to transaction table
ALTER TABLE "transaction" ADD COLUMN "category_id" varchar(255);
--> statement-breakpoint
-- Update transactions to use category IDs based on matching category name and user_id
UPDATE "transaction" t
SET "category_id" = c."id"
FROM "category" c
WHERE t."category" = c."name" AND t."user_id" = c."created_by" AND t."category" IS NOT NULL AND t."category" != '';
--> statement-breakpoint
-- Drop the old category column
ALTER TABLE "transaction" DROP COLUMN "category";
--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "note";