import {
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { transactions } from "./transaction";

export const categories = pgTable("category", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  iconName: varchar("icon_name", { length: 255 }).default(""),
  type: varchar("type", { length: 255 }).notNull().default("expense"), // should be one of the following: "income", "expense"
  createdBy: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  createdBy: one(user, { fields: [categories.createdBy], references: [user.id] }),
  transactions: many(transactions, { relationName: "transactionCategory" }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;