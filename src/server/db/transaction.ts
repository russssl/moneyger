import { pgTable, timestamp, varchar, doublePrecision } from "drizzle-orm/pg-core";
import { user } from "./user";
import { wallets } from "./wallet";
import { relations } from "drizzle-orm";

export const transactions = pgTable("transaction", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id),
  walletId: varchar("wallet_id", { length: 255 })
    .notNull()
    .references(() => wallets.id),
  fromWalletId: varchar("from_wallet_id", { length: 255 })
    .references(() => wallets.id), // was transferred from this wallet
  amount: doublePrecision("amount").notNull(),
  transaction_date: timestamp("transaction_date"),
  description: varchar("description", { length: 255 }),
  note: varchar("note", { length: 255 }),
  category: varchar("category", { length: 255 }),
  type: varchar("type", { length: 255 }), // should be one of the following: "income", "expense", "transfer", "adjustment"
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(user, { fields: [transactions.userId], references: [user.id] }),
  wallet: one(wallets, { 
    fields: [transactions.walletId], 
    references: [wallets.id],
    relationName: "transactionWallet"
  }),
  fromWallet: one(wallets, { 
    fields: [transactions.fromWalletId], 
    references: [wallets.id],
    relationName: "transactionFromWallet"
  }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionWithWallet = Transaction & { wallet: {
  name: string | null;
  currency: string | null;
} };