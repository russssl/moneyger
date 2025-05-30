import db from "@/server/db";
import { type Transaction, transactions as transactionsSchema} from "@/server/db/transaction";
import { eq, inArray } from "drizzle-orm";
import { env } from "@/env";
import { currencyExchangeRates, type SelectCurrencyExchangeRate } from "@/server/db/currencyExchangeRate";
import { DateTime } from "luxon";

export async function calculateWalletBalance(walletId: string) {
  const transactions: Transaction[] = await db.query.transactions.findMany({
    where: eq(transactionsSchema.walletId, walletId),
  });

  const balance = transactions.reduce((acc, transaction) => {
    if (!transaction.amount) return acc;
    return acc + transaction.amount;
  }, 0);

  return balance;
}

/**
 * class to interact with exchange rate API
 */
class CurrencyApi {

  // totally optional thing to create but honestly I just felt like it (@russssl)

  url: string | undefined;
  apiKey: string | undefined;

  constructor(url: string | undefined, apiKey: string | undefined) {
    this.url = url;
    this.apiKey = apiKey;
  }

  async getQuota() {
    if (!this.url || !this.apiKey) {
      throw new Error("URL and API key are required");
    }
    const res = await fetch(`${this.url}/${this.apiKey}/quota`);
    return await res.json();
  }

  async getExchangeRate(currency: string) {
    if (!this.url || !this.apiKey) {
      throw new Error("URL and API key are required");
    }
    const res = await fetch(`${this.url}${this.apiKey}/latest/${currency}`);
    return await res.json();
  }
}

/**
 * 
 * @param fromCurrency currency to get exchange rate for (if given is not stored in database we will use other currency and convert it)
 * @param toCurrency currency to convert to
 * @param ctx database to use/write data 
 * @returns 
 */
export async function getCurrentExchangeRate(fromCurrency: string, toCurrency: string, ctx: any) : Promise<number> {
  const isOutdated = (createdAt: string | null): boolean => {
    if (!createdAt) {
      return true;
    }
    return DateTime.fromJSDate(new Date(createdAt)).diffNow("days").days > 1;
  };

  const formatRate = (rate: number): number => {
    return Math.round(rate * 100) / 100;
  }

  // Try to get exchange rate from database first
  const exchangeRate = await ctx.db.query.currencyExchangeRates.findFirst({
    where: eq(currencyExchangeRates.baseCurrency, fromCurrency),
  });

  // If exchange rate exists and is not outdated, return it immediately
  if (exchangeRate && !isOutdated(exchangeRate.createdAt as string)) {
    const rate = (exchangeRate.rates as Record<string, number>)[toCurrency];
    if (rate) {
      return formatRate(rate);
    }
  }

  // If exchange rate is outdated or not found, check API quota before calling API
  const api = new CurrencyApi(env.EXCHANGE_RATE_URL, env.EXCHANGE_RATE_API_KEY);

  // if not found, get rate for USD and convert it
  const usdExchangeRate = await ctx.db.query.currencyExchangeRates.findFirst({
    where: eq(currencyExchangeRates.baseCurrency, "USD"),
  });

  if (!usdExchangeRate || (usdExchangeRate.createdAt && isOutdated(usdExchangeRate.createdAt as string))) {
    await updateCurrenciesExchangeRate(api, ctx);
  }

  const rates = usdExchangeRate.rates

  // rates are rates from USD to other currencies (e.g. 1 USD = 0.85 EUR)
  const dollarAmount = 1 / rates[fromCurrency];
  const finalRate = dollarAmount * rates[toCurrency];
  return formatRate(finalRate);
}

async function updateCurrenciesExchangeRate(api: any, ctx: any, currencyToRetrieve: string | null = null) {
  // Supported base currencies
  const supportedCurrencies = ["USD", "EUR", "GBP", "JPY"];

  // If a specific currency is requested, only update that one
  const currenciesToCheck = currencyToRetrieve ? [currencyToRetrieve] : supportedCurrencies;

  // Get current rates from DB for these currencies
  const dbRates: Array<SelectCurrencyExchangeRate> = await ctx.db.select({
    baseCurrency: currencyExchangeRates.baseCurrency,
    createdAt: currencyExchangeRates.createdAt,
  })
    .from(currencyExchangeRates)
    .where(inArray(currencyExchangeRates.baseCurrency, currenciesToCheck))
    .execute();

  // Determine which currencies need updating (missing or outdated)
  const outdatedOrMissing = currenciesToCheck.filter((currency) => {
    const dbEntry = dbRates.find((r) => r.baseCurrency === currency);
    if (!dbEntry) return true;
    if (!dbEntry.createdAt) return true;
    return dbEntry.createdAt < DateTime.now().minus({ days: 1 }).toISODate();
  });

  // If nothing to update, return the requested currency from DB if needed
  if (outdatedOrMissing.length === 0) {
    if (currencyToRetrieve) {
      return dbRates.find((rate) => rate.baseCurrency === currencyToRetrieve);
    }
    return;
  }

  // Check quota once before making API calls
  const quota = await api.getQuota();
  if (typeof quota === "object" && quota?.requests_left !== undefined) {
    if (quota?.requests_left < outdatedOrMissing.length) {
      throw new Error("Rate limit exceeded");
    }
  } else if (typeof quota === "number" && quota < outdatedOrMissing.length) {
    throw new Error("Rate limit exceeded");
  }

  // Fetch and store new rates only for outdated/missing currencies
  const res = await Promise.all(outdatedOrMissing.map(async (currency) => {
    const exchangeRate = await api.getExchangeRate(currency);
    if (!exchangeRate?.conversion_rates) {
      throw new Error(`Exchange rate not found for ${currency}`);
    }
    return {
      baseCurrency: currency,
      rates: exchangeRate.conversion_rates,
      createdAt: new Date(),
    };
  }));

  if (res.length > 0) {
    await ctx.db.insert(currencyExchangeRates).values(res).execute();
  }

  // Return the requested currency if needed
  if (currencyToRetrieve) {
    // Prefer the just-fetched one, fallback to DB
    return (
      res.find((rate) => rate.baseCurrency === currencyToRetrieve) ||
      dbRates.find((rate) => rate.baseCurrency === currencyToRetrieve)
    );
  }
}