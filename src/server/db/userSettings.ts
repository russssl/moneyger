import {relations} from "drizzle-orm";
import {pgTable, varchar} from "drizzle-orm/pg-core";
import {user} from "./user";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id", {length: 255})
    .notNull().references(() => user.id, {onDelete: "cascade", onUpdate: "cascade"}).primaryKey(),
  currency: varchar("currency", {length: 255}).notNull(),
});

export const userSettingsRelations = relations(userSettings, ({one}) => ({
  user: one(user, {fields: [userSettings.userId], references: [user.id]}),
}));

export type SelectUserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const selectUserSettingsSchema = createSelectSchema(userSettings);