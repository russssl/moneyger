// import { transactions } from "@/server/db/transaction";
// import { and, eq, gte, lte, sql, type SQLWrapper } from "drizzle-orm";
import { z } from "zod";
import { type Context, Hono } from "hono";
import { authenticated, getUserData, type AuthVariables } from "../authenticate";
import { zValidator } from "@hono/zod-validator"
const statsRouter = new Hono();

statsRouter.get(
  "/spendings",
  zValidator(
    "query",
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      walletId: z.string().optional(),
      category: z.string().optional(),
    })
  ),
  authenticated,
  async (c: Context<AuthVariables>) => {
    const { user, session, query } = await getUserData(c);
    return c.json({
      message: `Hello Stats, ${user?.email ?? "unknown"} ${session?.id ?? "none"} ${query.startDate ?? ""} ${query.endDate ?? ""} ${query.walletId ?? ""} ${query.category ?? ""}`,
    })
  }
)

export default statsRouter;

// // this router returns the money usage statistics for the user (transactions/ spendings / income in a given period and a lot more)
// export const statisticsRouter = createTRPCRouter({
//   getSpendings: protectedProcedure
//     .input(
//       z.object({
//         startDate: z.date().optional(),
//         endDate: z.date().optional(),
//         walletId: z.string().optional(),
//         category: z.string().optional(), // for filtering to a single category if desired
//       })
//     )
//     .query(async ({ ctx, input }) => {
//       const userId = ctx.session.user.id;

//       const whereClause: SQLWrapper[] = [eq(transactions.userId, userId), eq(transactions.type, "expense")];

//       if (input.startDate) {
//         whereClause.push(gte(transactions.transaction_date, input.startDate));
//       }
//       if (input.endDate) {
//         whereClause.push(lte(transactions.transaction_date, input.endDate));
//       }
//       if (input.walletId) {
//         whereClause.push(eq(transactions.walletId, input.walletId));
//       }
//       if (input.category) {
//         whereClause.push(eq(transactions.category, input.category));
//       }

//       const spendingData = await ctx.db
//         .select({
//           category: transactions.category,
//           totalSpent: sql<number>`sum(${transactions.amount})`.as("totalSpent"),
//         })  
//         .from(transactions)
//         .where(and(...whereClause))
//         .groupBy(transactions.category);
//       return spendingData;
//     }),
// });

