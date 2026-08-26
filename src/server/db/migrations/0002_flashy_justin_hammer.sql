CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
ALTER TABLE "wallet" ALTER COLUMN "balance" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "wallet" ALTER COLUMN "balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "wallet" ALTER COLUMN "saving_account_goal" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "wallet" ALTER COLUMN "saving_account_goal" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "amount" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "amount_sent" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "amount_received" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "exchange_rate" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;