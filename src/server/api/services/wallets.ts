import { db } from "@/server/db";
import { type Transaction, transactions as transactionsSchema} from "@/server/db/schema";
import { and, eq, inArray, lt } from "drizzle-orm";
import { type NewWallet, type Wallet } from "@/server/db/wallet";
import { env } from "process";
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

export async function getFormattedWallets(wallets: Wallet[] | NewWallet[]) {
  return await Promise.all(wallets.map(async (wallet: Wallet | NewWallet) => {
    if (!wallet.id) {
      throw new Error("Wallet ID is required");
    }
    const balance = await calculateWalletBalance(wallet.id);
    return {
      ...wallet,
      balance,
      type: "wallet",
    };
  }));
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

  if (await api.getQuota() < 10) {
    throw new Error("Rate limit exceeded");
  }

  const currenciesToUpdate : Array<SelectCurrencyExchangeRate> = await ctx.db.select({
    baseCurrency: currencyExchangeRates.baseCurrency,
    createdAt: currencyExchangeRates.createdAt,
  })
    .from(currencyExchangeRates)
    .where(
      and(
        ...[
          inArray(currencyExchangeRates.baseCurrency, ["USD", "EUR", "GBP", "JPY"]),
          lt(currencyExchangeRates.createdAt, DateTime.now().minus({ days: 1 }).toISODate())
        ]
      )
    )
    .execute()
  
  let currencyStrings: string[] = []
  if (currenciesToUpdate.length > 0) {
    currencyStrings = currenciesToUpdate.map(c => c.baseCurrency)
  } else {
    currencyStrings = ["USD", "EUR", "GBP", "JPY"]
  }
  const res = await Promise.all(currencyStrings.map(async (currency) => {
    const exchangeRate = await api.getExchangeRate(currency);
    
    if (!exchangeRate) {
      throw new Error("Exchange rate not found");
    }
    
    return {
      baseCurrency: currency,
      rates: exchangeRate.conversion_rates,
      createdAt: new Date(),
    }
  }));

  await ctx.db.insert(currencyExchangeRates).values(res).execute();

  if (currencyToRetrieve) {
    return res.find((rate) => rate.baseCurrency === currencyToRetrieve);
  }
}