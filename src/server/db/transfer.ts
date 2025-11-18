import { pgTable, timestamp, varchar, doublePrecision } from "drizzle-orm/pg-core";
import { user } from "./user";
import { wallets } from "./wallet";
import { relations } from "drizzle-orm";
import { transactions } from "./transaction";

export const transfers = pgTable("transfer", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  transactionId: varchar("transaction_id", { length: 255 })
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade", onUpdate: "cascade" }),
  fromWalletId: varchar("from_wallet_id", { length: 255 })
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade", onUpdate: "cascade" }),
  toWalletId: varchar("to_wallet_id", { length: 255 })
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade", onUpdate: "cascade" }),
  amountSent: doublePrecision("amount_sent").notNull(),
  amountReceived: doublePrecision("amount_received").notNull(), // this can be different from amountSent if the currency is different
  exchangeRate: doublePrecision("exchange_rate").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transfersRelations = relations(transfers, ({ one }) => ({
  user: one(user, { fields: [transfers.userId], references: [user.id] }),
  transaction: one(transactions, { fields: [transfers.transactionId], references: [transactions.id], relationName: "transferTransaction" }),
  fromWallet: one(wallets, { fields: [transfers.fromWalletId], references: [wallets.id], relationName: "transferFromWallet" }),
  toWallet: one(wallets, { fields: [transfers.toWalletId], references: [wallets.id], relationName: "transferToWallet" }),
}));

export type Transfer = typeof transfers.$inferSelect;
export type NewTransfer = typeof transfers.$inferInsert;