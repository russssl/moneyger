import { db } from "@/server/db";
import { type Transaction, transactions as transactionsSchema} from "@/server/db/schema";
import { eq } from "drizzle-orm";
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
  const api = new CurrencyApi(env.EXCHANGE_RATE_URL, env.EXCHANGE_RATE_API_KEY);

  if (await api.getQuota() < 10) {
    throw new Error("Rate limit exceeded");
  }

  // try to get record with base "fromCurrency" if exists
  const fromCurrencyExchangeRate = await ctx.db.query.currencyExchangeRate.findFirst({
    where: {
      baseCurrency: fromCurrency,
    },
  });

  if (fromCurrencyExchangeRate) {
    const res = fromCurrencyExchangeRate.conversion_rates[toCurrency];
    if (res) {
      return res;
    }
    throw new Error("Exchange rate not found");
  }
  
  const getDollarExchangeRate = async (): Promise<SelectCurrencyExchangeRate | null> => {
    return ctx.db.query.currencyExchangeRate.findFirst({
      where: (eq: any) => eq.baseCurrency("USD"),
    });
  }
  // if not found get dollar record and convert it to "toCurrency"
  let exchangeRate = await getDollarExchangeRate();

  if (!exchangeRate || (exchangeRate.createdAt && DateTime.fromJSDate(new Date(exchangeRate.createdAt)).diffNow("days").days > 1)) {
    await Promise.all(["USD", "EUR", "GBP", "JPY"].map(async (currency) => {
      const exchangeRate = await api.getExchangeRate(currency);
      await ctx.db.insert(currencyExchangeRate).values({
        baseCurrency: currency,
        rates: exchangeRate.conversion_rates,
        createdAt: new Date(),
      }).execute();
    }));

    exchangeRate = await getDollarExchangeRate()
  }

  if (!exchangeRate) {
    throw new Error("Exchange rate not found");
  }

  const rates = exchangeRate.rates as any; // FIXME: this is a hack
  const finalRate = rates[fromCurrency] / rates[toCurrency];
  return finalRate;
}