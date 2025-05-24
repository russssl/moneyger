import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const passwordReset = pgTable("password_reset", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const passwordResetRelations = relations(passwordReset, ({ one }) => ({
  user: one(user, { fields: [passwordReset.userId], references: [user.id] }),
}));

export type PasswordReset = typeof passwordReset.$inferSelect;
export type NewPasswordReset = typeof passwordReset.$inferInsert;