import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { wallets } from "./wallet";
import { categories } from "./category";

const commonFields = () => ({
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fullWalletDigest = pgTable("full_digest", {
  ...commonFields(),
  walletId: varchar("wallet_id", { length: 255 })
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const partialWalletDigest = pgTable("partial_digest", {
  ...commonFields(),
  walletId: varchar("wallet_id", { length: 255 })
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade", onUpdate: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  type: varchar("type", { length: 255 }).notNull().default("monthly"),
});

export const fullCategoryDigest = pgTable("category_digest", {
  ...commonFields(),
  categoryId: varchar("category_id", { length: 255 })
    .notNull()
    .references(() => categories.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
