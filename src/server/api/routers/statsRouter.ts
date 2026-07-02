import { Hono } from "hono";
import { type AuthVariables } from "../authenticate";
import { authenticated, getUserData } from "../authenticate";
import { zValidator } from "@hono/zod-validator"
import { z } from "zod";
import { transactions } from "@/server/db/transaction";
import { categories } from "@/server/db/category";
import { and, eq, sql, gte, lte } from "drizzle-orm";
import db from "@/server/db";
import { getNetWorthForMonth } from "../services/spendingsService";


const statsRouter = new Hono<AuthVariables>();

statsRouter.get("/net-worth", authenticated, async (c) => {
  const { user } = await getUserData(c);

  // Return net worth for the last 12 months
  const now = new Date();
  const points: Array<{ month: string; netWorth: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const netWorth = await getNetWorthForMonth(user.id, d.getMonth(), d.getFullYear());
    points.push({ month: d.toISOString().slice(0, 7), netWorth });
  }

  return c.json(points);
});

statsRouter.get("/spendings", authenticated, zValidator(
  "query",
  z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    walletId: z.string().optional(),
    category: z.string().optional(),
  }),
), async (c) => {
  const { user } = await getUserData(c);
  const { startDate, endDate, walletId, category } = c.req.valid("query");


  const spendingData = await db.select({
    category: categories.name,
    totalSpent: sql<number>`sum(${transactions.amount})`.as("totalSpent"),
  })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(
      eq(transactions.userId, user.id),
      eq(transactions.type, "expense"),
      startDate ? gte(transactions.transaction_date, new Date(startDate)) : undefined,
      endDate ? lte(transactions.transaction_date, new Date(endDate)) : undefined,
      walletId ? eq(transactions.walletId, walletId) : undefined,
      category ? eq(transactions.categoryId, category) : undefined,
    ))
    .groupBy(categories.name);

  return c.json(spendingData);
});


export default statsRouter;