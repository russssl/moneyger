import { Hono } from "hono";
import { type AuthVariables } from "../authenticate";
import { authenticated, getUserData } from "../authenticate";
import { zValidator } from "@hono/zod-validator"
import { z } from "zod";
import { transactions } from "@/server/db/transaction";
import { and, eq, sql, gte, lte } from "drizzle-orm";
import db from "@/server/db";


const statsRouter = new Hono<AuthVariables>();

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
    category: transactions.category,
    totalSpent: sql<number>`sum(${transactions.amount})`.as("totalSpent"),
  }).from(transactions).where(and(
    eq(transactions.userId, user.id),
    eq(transactions.type, "expense"),
    // avoid using sql in where clauses
    startDate ? gte(transactions.transaction_date, new Date(startDate)) : undefined,
    endDate ? lte(transactions.transaction_date, new Date(endDate)) : undefined,
    walletId ? eq(transactions.walletId, walletId) : undefined,
    category ? eq(transactions.category, category) : undefined,
  )).groupBy(transactions.category);

  return c.json(spendingData);
});


export default statsRouter;