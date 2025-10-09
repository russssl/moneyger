import { pgTable, timestamp, varchar, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { transactions } from "./transaction";



export const wallets = pgTable("wallet", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id),
  name: varchar("name", { length: 255 }).notNull(),
  balance: doublePrecision("balance").default(0).notNull(),
  isSavingAccount: boolean("is_saving_account").default(false),
  savingAccountGoal: doublePrecision("saving_account_goal").default(0),
  description: varchar("description", { length: 255 }),
  iconName: varchar("icon_name", { length: 255 }),
  currency: varchar("currency", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(user, { fields: [wallets.userId], references: [user.id] }),
  transactions: many(transactions, { relationName: "transactionWallet" }),
}));

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;