import { transactions } from "@/server/db/transaction";
import { wallets } from "@/server/db/wallet";
import { user } from "@/server/db/user";
import { and, eq, lt, sql } from "drizzle-orm";
import db from "@/server/db";
import { getCurrentExchangeRate } from "./wallets";

export async function getNetWorthForMonth(userId: string, month: number, year: number, cachedUserCurrency?: string | null): Promise<number> {
  const endExclusive = new Date(Date.UTC(year, month + 1, 1));

  let userMainCurrency = cachedUserCurrency ?? null;
  if (!userMainCurrency) {
    const [userRow] = await db
      .select({ currency: user.currency })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    userMainCurrency = userRow?.currency ?? "USD";
  }
  const mainCurrency = userMainCurrency ?? "USD";

  const grouped = await db
    .select({
      currency: wallets.currency,
      net: sql<number>`
        coalesce(
          sum(
            case
              when ${transactions.type} = 'income' then ${transactions.amount}
              when ${transactions.type} = 'expense' then -${transactions.amount}
              when ${transactions.type} = 'adjustment' then ${transactions.amount}
              else 0
            end
          ),
          0
        )
      `.as("net"),
    })
    .from(transactions)
    .leftJoin(wallets, eq(transactions.walletId, wallets.id))
    .where(and(
      eq(transactions.userId, userId),
      lt(transactions.transaction_date, endExclusive),
    ))
    .groupBy(wallets.currency);

  if (grouped.length === 0) return 0;

  // Fetch exchange rates in parallel with per-request cache
  const rateCache = new Map<string, number>();
  const conversions = await Promise.all(grouped.map(async (row) => {
    const fromCurrency = row.currency ?? mainCurrency;
    const net = Number(row.net ?? 0);
    if (fromCurrency === mainCurrency) return net;
    if (rateCache.has(fromCurrency)) return net * rateCache.get(fromCurrency)!;
    try {
      const data = await getCurrentExchangeRate(fromCurrency, mainCurrency);
      rateCache.set(fromCurrency, data.rate);
      return net * data.rate;
    } catch {
      // Fallback: treat as main currency on rate fetch failure (avoid aborting whole series)
      return net;
    }
  }));

  const total = conversions.reduce((acc, v) => acc + v, 0);

  return Number(total.toFixed(2));
}