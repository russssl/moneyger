import {json, pgTable, varchar, date} from "drizzle-orm/pg-core";

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const currencyExchangeRate = pgTable("currency_exchange_rate", {
  baseCurrency: varchar("base_currency", {length: 255}).notNull().primaryKey(),
  rates: json("rates").notNull(),
  createdAt: date().defaultNow()
});

export type SelectCurrencyExchangeRate = typeof currencyExchangeRate.$inferSelect
export type InsertCurrencyExchangeRate = typeof currencyExchangeRate.$inferInsert

export const insertCurrencyExchangeRateSchema = createInsertSchema(currencyExchangeRate)
export const selectCurrencyExchangeRateSchema = createSelectSchema(currencyExchangeRate) 