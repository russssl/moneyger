import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./user";
import { wallets } from "./wallet";
import { relations } from "drizzle-orm";

export const transactions = pgTable("transaction", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  walletId: varchar("wallet_id", { length: 255 })
    .notNull()
    .references(() => wallets.id),
  amount: integer("amount"),
  transaction_date: timestamp("transaction_date"),
  description: varchar("description", { length: 255 }),
  note: varchar("note", { length: 255 }),
  category: varchar("category", { length: 255 }),
  type: varchar("type", { length: 255 }), // should be one of the following: "income", "expense", "transfer", "adjustment"
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [transactions.walletId], references: [wallets.id] }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;