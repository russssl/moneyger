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
ALTER TABLE "transaction" RENAME COLUMN "category" TO "category_id";--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "note";