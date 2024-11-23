import { relations } from 'drizzle-orm';
import { integer, pgTable, text , varchar } from 'drizzle-orm/pg-core';
import { users } from './user';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';


export const wallets = pgTable('wallet', {
  id: varchar('id', { length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  balance: integer('balance'),
  currency: varchar('currency', { length: 255 }),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
});

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
}));

export const selectWallet = createSelectSchema(wallets);
export const insertWallet = createSelectSchema(wallets, {
  name: z.string().min(1).max(255),
  description: z.string().max(255),
  balance: z.number().int().min(0),
  currency: z.string().min(1).max(255),
  userId: z.string().uuid(),
});

export type SelectWallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;