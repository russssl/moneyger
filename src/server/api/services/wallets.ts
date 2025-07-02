import db from "@/server/db";
import { type Transaction, transactions, transactions as transactionsSchema} from "@/server/db/transaction";
import { and, eq, gte, lte } from "drizzle-orm";
import { env } from "@/env";
import { redis } from "@/server/api/cache/cache";
import { type SelectUserSettings, userSettings } from "@/server/db/userSettings";
import { type Wallet, wallets } from "@/server/db/wallet";
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

type WalletsStats = {
  totalBalance: number;
  walletsBalances: {
    id: string;
    name: string;
    balance: number;
  }[];
}

type WalletTrends = {
  totalTrend: number;
  walletTrends: Record<string, number>;
}

type WalletWithTransactions = Wallet & {
  transactions: Transaction[];
}

export async function calculateTotalBalance(userId: string, userMainCurrency: string, ctx: any, startDate?: Date | null, endDate?: Date | null): Promise<WalletsStats> {
  let totalBalance = 0;
  const res_wallets: WalletWithTransactions[] = await ctx.db.query.wallets.findMany({
    where: eq(wallets.userId, userId),
    with: {
      transactions: {
        where: startDate ? and(
          lte(transactions.transaction_date, endDate ?? new Date()),
          gte(transactions.transaction_date, startDate)
        ) : undefined,
      },
    },
  });

  if (!userMainCurrency) {
    throw new Error("User main currency not found");
  }

  for (const wallet of res_wallets) {
    // If we're calculating a past balance, we need to sum only transactions up to that point
    const walletBalance = startDate 
      ? wallet.transactions.reduce((acc: number, t: Transaction) => acc + (t.amount ?? 0), 0)
      : wallet.balance;

    const exchangeRate = await getCurrentExchangeRate(wallet.currency, userMainCurrency);
    totalBalance += walletBalance * exchangeRate;
  }

  return {
    totalBalance: Number(totalBalance.toFixed(2)),
    walletsBalances: res_wallets.map((wallet) => ({
      id: wallet.id,
      name: wallet.name ?? "",
      balance: startDate
        ? wallet.transactions.reduce((acc: number, t: Transaction) => acc + (t.amount ?? 0), 0)
        : wallet.balance,
    })),
  }
}

export async function calculateWalletTrends(
  userId: string, 
  userMainCurrency: string, 
  ctx: any, 
  days = 30
): Promise<WalletTrends> {
  const now = DateTime.now().startOf("day");
  const startDate = now.minus({ days }).startOf("day").toJSDate();
  const endDate = now.endOf("day").toJSDate();

  // Get current balances (without date filter)
  const currentBalance = await calculateTotalBalance(userId, userMainCurrency, ctx);
  
  // Get balances from 30 days ago
  const pastBalance = await calculateTotalBalance(userId, userMainCurrency, ctx, startDate, endDate);

  // Calculate total trend with 1 decimal place
  const totalTrend = Number(
    (pastBalance.totalBalance !== 0
      ? ((currentBalance.totalBalance - pastBalance.totalBalance) / Math.abs(pastBalance.totalBalance)) * 100
      : currentBalance.totalBalance > 0 ? 100 : 0
    ).toFixed(1)
  );

  // Calculate individual wallet trends
  const walletTrends = currentBalance.walletsBalances.reduce((acc, currentWallet) => {
    const pastWallet = pastBalance.walletsBalances.find(w => w.id === currentWallet.id);
    
    // Calculate trend with 1 decimal place
    const trend = Number(
      (!pastWallet || pastWallet.balance === 0)
        ? (currentWallet.balance > 0 ? 100 : 0)
        : ((currentWallet.balance - pastWallet.balance) / Math.abs(pastWallet.balance)) * 100
    ).toFixed(1);

    acc[currentWallet.id] = Number(trend);
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTrend,
    walletTrends,
  };
}