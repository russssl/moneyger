import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./user";
import { relations } from "drizzle-orm";



export const wallets = pgTable("wallet", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }),
  description: varchar("description", { length: 255 }),
  iconName: varchar("icon_name", { length: 255 }),
  isCard: boolean("is_card").default(false),
  currency: varchar("currency", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
}));

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;