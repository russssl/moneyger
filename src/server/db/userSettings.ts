import {relations} from "drizzle-orm";
import {pgTable, varchar} from "drizzle-orm/pg-core";
import {users} from "./user";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id", {length: 255})
    .notNull().references(() => users.id, {onDelete: "cascade", onUpdate: "cascade"}).primaryKey(),
  currency: varchar("currency", {length: 255}),
});

export const userSettingsRelations = relations(userSettings, ({one}) => ({
  user: one(users, {fields: [userSettings.userId], references: [users.id]}),
}));

export type SelectUserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const selectUserSettingsSchema = createSelectSchema(userSettings);