import db from "@/server/db";
import { type Transaction, transactions as transactionsSchema} from "@/server/db/transaction";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { redis } from "@/server/api/cache/cache";

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

  // totally optional thing to create but honestly I just felt like it

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
    if ((await this.getQuota()).requests_remaining <= 20) {
      return null;
    }
    if (!this.url || !this.apiKey) {
      throw new Error("URL and API key are required");
    }
    const res = await fetch(`${this.url}${this.apiKey}/latest/${currency}`);
    return await res.json();
  }
}

export async function getCurrentExchangeRate(fromCurrency: string, toCurrency: string) {
  const cache = await redis();
  const mainCurrencies = ["USD", "EUR", "PLN", "GBP", "CHF", "JPY"];
  const api = new CurrencyApi(env.EXCHANGE_RATE_URL, env.EXCHANGE_RATE_API_KEY);

  const getData = async (currency: string) => {
    const cacheKey = `exchange_rate:${currency}`;
    const raw = await cache.get(cacheKey);
    if (raw) {
      return JSON.parse(raw);
    }

    const apiData = await api.getExchangeRate(currency);
    if (!apiData?.conversion_rates) {
      throw new Error(`Could not fetch exchange rates for ${currency}`);
    }
    
    await cache.setEx(cacheKey, 86400, JSON.stringify(apiData.conversion_rates));
    return apiData.conversion_rates;
  }

  if (mainCurrencies.includes(fromCurrency)) {
    const data = await getData(fromCurrency);
    if (!data[toCurrency]) throw new Error(`No rate for ${toCurrency} in ${fromCurrency}`);
    return data[toCurrency];
  }

  if (mainCurrencies.includes(toCurrency)) {
    const data = await getData(toCurrency);
    if (!data[fromCurrency]) throw new Error(`No rate for ${fromCurrency} in ${toCurrency}`);
    return 1 / data[fromCurrency];
  }

  const usdData = await getData("USD");
  if (usdData[fromCurrency] && usdData[toCurrency]) {
    return usdData[toCurrency] / usdData[fromCurrency];
  }

  for (const currency of mainCurrencies) {
    if (currency === fromCurrency || currency === toCurrency) continue;

    const data = await getData(currency);
    if (data[fromCurrency] && data[toCurrency]) {
      return data[toCurrency] / data[fromCurrency];
    }
  }

  throw new Error(`Could not calculate exchange rate from ${fromCurrency} to ${toCurrency}`);
}
