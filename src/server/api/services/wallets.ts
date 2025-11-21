import db from "@/server/db";
import { type Transaction, transactions, transactions as transactionsSchema} from "@/server/db/transaction";
import { and, eq, gte, lte, not } from "drizzle-orm";
import { env } from "@/env";
import { redis } from "@/server/api/cache/cache";
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

  async getMonthlyQuota() {
    const cache = await redis();
    const raw = await cache.get("exchange_rate_quota_monthly");
    if (raw) {
      return JSON.parse(raw);
    }
    // Initialize with 1000 requests per month
    return { requests_remaining: 1000, reset_date: new Date().toISOString() };
  }

  async setMonthlyQuota(quota: number) {
    const cache = await redis();
    const quotaData = { requests_remaining: quota, reset_date: new Date().toISOString() };
    await cache.set("exchange_rate_quota_monthly", JSON.stringify(quotaData));
  }

  async getHourlyQuota() {
    const cache = await redis();
    // Use current hour as key (resets every hour automatically)
    const now = new Date();
    const hourKey = `exchange_rate_quota_hourly:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    const raw = await cache.get(hourKey);
    if (raw) {
      return parseInt(raw, 10);
    }
    // Initialize with 60 requests per hour
    return 60;
  }

  async setHourlyQuota(remaining: number) {
    const cache = await redis();
    const now = new Date();
    const hourKey = `exchange_rate_quota_hourly:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    // Set with expiration of 1 hour (3600 seconds) so it auto-expires
    await cache.setEx(hourKey, 3600, remaining.toString());
  }

  async fetchData(currency: string) {
    // Check both monthly and hourly quotas before making request
    const monthlyQuota = await this.getMonthlyQuota();
    const hourlyQuota = await this.getHourlyQuota();
    
    // Use safety buffers: 50 for monthly, 5 for hourly
    if (monthlyQuota.requests_remaining <= 50) {
      console.warn(`Exchange rate API monthly quota low: ${monthlyQuota.requests_remaining} remaining`);
      return null;
    }
    
    if (hourlyQuota <= 5) {
      console.warn(`Exchange rate API hourly quota low: ${hourlyQuota} remaining`);
      return null;
    }

    if (!this.url || !this.apiKey) {
      throw new Error("URL and API key are required");
    }

    try {
      const symbols = "USD,EUR,PLN,GBP,CHF,JPY,UAH,CZK";
      const res = await fetch(`${this.url}/latest?base=${currency}&symbols=${symbols}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`Exchange rate API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      
      // Check if response has error
      if (data.error) {
        throw new Error(`Exchange rate API error: ${data.error}`);
      }
      
      // Only decrement quotas on successful request
      await this.setMonthlyQuota(monthlyQuota.requests_remaining - 1);
      await this.setHourlyQuota(hourlyQuota - 1);
      
      return data;
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
      // Don't decrement quota on error
      throw error;
    }
  }

  async getAllExchangeRates() {
    // Always fetch from USD base to get all currencies in one request
    // This way we only need 1 request per hour instead of 8
    const cache = await redis();
    const cacheKey = "exchange_rate:all";
    const raw = await cache.get(cacheKey);
    
    // If we have cached data, check its age
    if (raw) {
      const cached = JSON.parse(raw);
      const age = Date.now() - (cached.timestamp || 0);
      const ageInHours = age / 3600000; // Convert to hours
      
      // If data is fresh (< 1 hour), return it
      if (ageInHours < 1) {
        cached.isStale = false;
        return cached;
      }
      
      // Data is stale (> 1 hour), try to fetch fresh data
      try {
        const data = await this.fetchData("USD");
        
        const rates = data?.rates;
        if (!rates) {
          console.error("API response:", JSON.stringify(data, null, 2));
          throw new Error("Failed to fetch exchange rates: invalid response format");
        }

        // Delete old cache and save new data
        await cache.del(cacheKey);
        const now = Date.now();
        const cacheData = {
          rates,
          timestamp: now,
          isStale: false,
        };
        await cache.set(cacheKey, JSON.stringify(cacheData));
        
        return cacheData;
      } catch (error) {
        console.error("Failed to fetch exchange rates, returning stale cache:", error);
        cached.isStale = true;
        return cached;
      }
    }

    // No cache - must fetch from API
    try {
      const data = await this.fetchData("USD");
      
      const rates = data?.rates;
      if (!rates) {
        console.error("API response:", JSON.stringify(data, null, 2));
        throw new Error("Failed to fetch exchange rates: invalid response format");
      }

      // Cache the data with timestamp (no TTL - keep until manually cleared)
      const now = Date.now();
      const cacheData = {
        rates,
        timestamp: now,
        isStale: false,
      };
      await cache.set(cacheKey, JSON.stringify(cacheData));
      
      return cacheData;
    } catch (error) {
      console.error("Failed to fetch exchange rates and no cache available:", error);
      throw error;
    }
  }

  async convert(fromCurrency: string, toCurrency: string) {
    // Get all exchange rates from USD base (single API call, cached)
    const cachedData = await this.getAllExchangeRates();
    
    // Extract rates and metadata
    const allRates = cachedData.rates;
    
    // All rates are relative to USD, so we need to convert
    let rate: number;
    
    // If fromCurrency is USD, return the rate directly
    if (fromCurrency === "USD") {
      if (!allRates[toCurrency]) {
        throw new Error(`No exchange rate found for ${toCurrency}`);
      }
      rate = allRates[toCurrency];
    }
    // If toCurrency is USD, return the inverse
    else if (toCurrency === "USD") {
      if (!allRates[fromCurrency]) {
        throw new Error(`No exchange rate found for ${fromCurrency}`);
      }
      rate = 1 / allRates[fromCurrency];
    }
    // Both currencies are not USD, convert via USD
    else {
      if (!allRates[fromCurrency] || !allRates[toCurrency]) {
        throw new Error(`Could not find exchange rates for ${fromCurrency} or ${toCurrency}`);
      }
      // Convert fromCurrency -> USD -> toCurrency
      rate = allRates[toCurrency] / allRates[fromCurrency];
    }
    
    return {
      rate,
      timestamp: cachedData.timestamp,
      isStale: cachedData.isStale,
    };
  }
}

export async function getCurrentExchangeRate(fromCurrency: string, toCurrency: string) {
  const api = new CurrencyApi(env.EXCHANGE_RATE_URL, env.EXCHANGE_RATE_API_KEY);
  return api.convert(fromCurrency, toCurrency);
}

type WalletsStats = {
  totalBalance: number;
  wallets: WalletWithTransactions[];
}

type WalletTrends = {
  totalTrend: number;
  walletTrends: Record<string, number>;
}

type WalletWithTransactions = Wallet & {
  transactions: Transaction[];
}

export async function calculateTotalBalance(userId: string, userMainCurrency: string, startDate?: Date | null, endDate?: Date | null, isSavingAccount = false): Promise<WalletsStats> {
  let totalBalance = 0;
  const res_wallets: WalletWithTransactions[] = await db.query.wallets.findMany({
    where: and(eq(wallets.userId, userId), isSavingAccount ? eq(wallets.isSavingAccount, true) : undefined),
    with: {
      transactions: {
        where: and(startDate ? and(
          lte(transactions.transaction_date, endDate ?? new Date()),
          gte(transactions.transaction_date, startDate)
        ) : not(eq(transactions.type, "adjustment"))),
      },
    },
  });

  if (!userMainCurrency) {
    throw new Error("User main currency not found");
  }

  for (const wallet of res_wallets) {
    // If we're calculating a past balance, we need to sum only transactions up to that point
    const walletBalance = startDate 
      ? wallet.transactions.filter(t => t.type != "adjustment").reduce((acc: number, t: Transaction) => acc + (t.amount ?? 0), 0)
      : wallet.balance;

    const exchangeRateData = await getCurrentExchangeRate(wallet.currency, userMainCurrency);
    totalBalance += walletBalance * exchangeRateData.rate;
  }

  return {
    totalBalance: Number(totalBalance.toFixed(2)),
    wallets: res_wallets.map((wallet) => ({
      ...wallet,
      balance: startDate
        ? wallet.transactions.reduce((acc: number, t: Transaction) => acc + (t.amount ?? 0), 0)
        : wallet.balance,
    }))
  }
}

export async function calculateWalletTrends(
  userId: string, 
  userMainCurrency: string, 
  days = 30
): Promise<WalletTrends> {
  const now = DateTime.now().startOf("day");
  const startDate = now.minus({ days }).startOf("day").toJSDate();
  const endDate = now.endOf("day").toJSDate();

  // Get current balances (without date filter)
  const currentBalance = await calculateTotalBalance(userId, userMainCurrency);
  
  // Get balances from 30 days ago
  const pastBalance = await calculateTotalBalance(userId, userMainCurrency, startDate, endDate);

  // Calculate total trend with 1 decimal place
  const totalTrend = Number(
    (pastBalance.totalBalance !== 0
      ? ((currentBalance.totalBalance - pastBalance.totalBalance) / Math.abs(pastBalance.totalBalance)) * 100
      : currentBalance.totalBalance > 0 ? 100 : 0
    ).toFixed(1)
  );

  // Calculate individual wallet trends
  const walletTrends = currentBalance.wallets.reduce((acc, currentWallet) => {
    const pastWallet = pastBalance.wallets.find(w => w.id === currentWallet.id);
    
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