import { transactions } from "@/server/db/transaction";
import { wallets } from "@/server/db/wallet";
import { user } from "@/server/db/user";
import { and, eq, lt, sql } from "drizzle-orm";
import db from "@/server/db";
import { getCurrentExchangeRate } from "./wallets";

export async function getNetWorthForMonth(userId: string, month: number, year: number): Promise<number> {
  const endExclusive = new Date(year, month + 1, 1);

  const [userRow] = await db
    .select({ currency: user.currency })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const userMainCurrency = userRow?.currency ?? "USD";

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

  let total = 0;
  for (const row of grouped) {
    const fromCurrency = row.currency ?? userMainCurrency;
    const net = Number(row.net ?? 0);
    if (fromCurrency === userMainCurrency) {
      total += net;
      continue;
    }
    const exchangeRateData = await getCurrentExchangeRate(fromCurrency, userMainCurrency);
    total += net * exchangeRateData.rate;
  }

  return Number(total.toFixed(2));
}