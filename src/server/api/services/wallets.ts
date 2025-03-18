import { db } from "@/server/db";
import { type Transaction, transactions as transactionsSchema} from "@/server/db/schema";
import { and, eq, inArray, lt } from "drizzle-orm";
import { type NewWallet, type Wallet } from "@/server/db/wallet";
import { env } from "process";
import { currencyExchangeRate, type SelectCurrencyExchangeRate } from "@/server/db/currencyExchangeRate";
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
  if (fromCurrency == toCurrency) {
    return 1;
  }

  const isOutdated = (createdAt: string | null): boolean => {
    if (!createdAt) {
      return true;
    }
    return DateTime.fromJSDate(new Date(createdAt)).diffNow("days").days > 1;
  }


  const api = new CurrencyApi(env.EXCHANGE_RATE_URL, env.EXCHANGE_RATE_API_KEY);

  if (await api.getQuota() < 10) {
    throw new Error("Rate limit exceeded");
  }

  // try to get exchange rate from database

  let exchangeRate= await ctx.db.query.currencyExchangeRate.findFirst({
    where: {
      baseCurrency: fromCurrency,
    },
  });

  if (exchangeRate) {
    if (exchangeRate.createdAt && isOutdated(exchangeRate.createdAt as string)) {
      exchangeRate = await updateCurrenciesExchangeRate(ctx, fromCurrency);
    }
    const rate = (exchangeRate.rates as Record<string, number>)[toCurrency];
    if (rate) {
      return rate;
    }
  }

  // if not found, get rate for USD and convert it

  const usdExchangeRate: SelectCurrencyExchangeRate = await ctx.db.query.currencyExchangeRate.findFirst({
    where: {
      baseCurrency: "USD",
    },
  });

  if (!usdExchangeRate || (usdExchangeRate.createdAt && isOutdated(usdExchangeRate.createdAt))) {
    await updateCurrenciesExchangeRate(ctx);
  }

  const rates = usdExchangeRate.rates as any; // FIXME: this is a hack
  const finalRate = rates[fromCurrency] / rates[toCurrency];
  return finalRate;
}

async function updateCurrenciesExchangeRate(ctx: any, currencyToRetrieve: string | null = null) {

  const api = new CurrencyApi(env.EXCHANGE_RATE_URL, env.EXCHANGE_RATE_API_KEY);

  if (await api.getQuota() < 10) {
    throw new Error("Rate limit exceeded");
  }

  const currenciesToUpdate : Array<string> = await ctx.db.select({
    baseCurrency: currencyExchangeRate.baseCurrency,
    createdAt: currencyExchangeRate.createdAt,
  })
    .from(currencyExchangeRate)
    .where(
      and(
        ...[
          inArray(currencyExchangeRate.baseCurrency, ["USD", "EUR", "GBP", "JPY"]),
          lt(currencyExchangeRate.createdAt, DateTime.now().minus({ days: 1 }).toISODate())
        ]
      )
    )
    .execute()
    .map((currency: SelectCurrencyExchangeRate) => currency.baseCurrency);

  const res = await Promise.all(currenciesToUpdate.map(async (currency) => {
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

  await ctx.db.insert(currencyExchangeRate).values(res).execute();

  if (currencyToRetrieve) {
    return res.find((rate) => rate.baseCurrency === currencyToRetrieve);
  }
}