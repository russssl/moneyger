--> statement-breakpoint
-- Performance indexes for large datasets
CREATE INDEX IF NOT EXISTS transaction_user_id_transaction_date_idx
  ON "transaction" ("user_id", "transaction_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS transaction_user_id_created_at_idx
  ON "transaction" ("user_id", "created_at");
