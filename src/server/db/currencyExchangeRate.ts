import { pgTable, varchar, date, jsonb} from "drizzle-orm/pg-core";

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const currencyExchangeRates = pgTable("currency_exchange_rate", {
  baseCurrency: varchar("base_currency", {length: 255}).notNull().primaryKey(),
  rates: jsonb("rates").notNull(),
  createdAt: date("created_at").defaultNow()
});

export type SelectCurrencyExchangeRate = typeof currencyExchangeRates.$inferSelect
export type InsertCurrencyExchangeRate = typeof currencyExchangeRates.$inferInsert

export const insertCurrencyExchangeRateSchema = createInsertSchema(currencyExchangeRates)
export const selectCurrencyExchangeRateSchema = createSelectSchema(currencyExchangeRates) 