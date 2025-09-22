import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { transactions } from "@/server/db/transaction";
import { and, eq, gte, lte, sql, type SQLWrapper } from "drizzle-orm";
import { z } from "zod";

// this router returns the money usage statistics for the user (transactions/ spendings / income in a given period and a lot more)
export const statisticsRouter = createTRPCRouter({
  getSpendings: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        walletId: z.string().optional(),
        category: z.string().optional(), // for filtering to a single category if desired
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const whereClause: SQLWrapper[] = [eq(transactions.userId, userId), eq(transactions.type, "expense")];

      if (input.startDate) {
        whereClause.push(gte(transactions.transaction_date, input.startDate));
      }
      if (input.endDate) {
        whereClause.push(lte(transactions.transaction_date, input.endDate));
      }
      if (input.walletId) {
        whereClause.push(eq(transactions.walletId, input.walletId));
      }
      if (input.category) {
        whereClause.push(eq(transactions.category, input.category));
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
    }),
});