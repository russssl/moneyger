import { type Transaction, transactions } from "@/server/db/transaction";
import { and, eq, gte, inArray, lte, sql, type SQLWrapper } from "drizzle-orm";

type SpendingOptions = {
  startDate: Date | null,
  endDate: Date | null,
  categories: string[] | null,
  walletId: string | null,
  userId: string
  ctx: any // TODO: add type
}
// TODO: add Transaction && totalSpending: number as union type
export async function getSpendingsInRange({userId, startDate, endDate, categories, walletId, ctx} : SpendingOptions): Promise<Transaction> {
  const whereClause: SQLWrapper[] = [eq(transactions.userId, userId), eq(transactions.type, "expense")];

  if (startDate) {
    whereClause.push(gte(transactions.transaction_date, startDate));
  }
  if (endDate) {
    whereClause.push(lte(transactions.transaction_date, endDate));
  }
  if (walletId) {
    whereClause.push(eq(transactions.walletId, walletId));
  }
  if (categories && categories.length > 0) {
    whereClause.push(inArray(transactions.category, categories));
  }

  const spendingData = await ctx.db
    .select({
      category: transactions.category,
      totalSpent: sql<number>`sum(${transactions.amount})`.as("totalSpent"),
    })  
    .from(transactions)
    .where(and(...whereClause))
    .groupBy(transactions.category);

  return spendingData;
}