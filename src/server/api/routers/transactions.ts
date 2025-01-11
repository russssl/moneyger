import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { type Transaction, transactions } from "@/server/db/transaction";
import { wallets } from "@/server/db/wallet";
import { and, eq, not } from "drizzle-orm";
import { z } from "zod";

export const transactionsRouter = createTRPCRouter({
  getTransactions: protectedProcedure
    .input(z.object({
      walletId: z.string().optional(),
      transaction_date: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const loggedInUser = ctx.session.user;
      if (!loggedInUser) {
        throw new Error("User not logged in");
      }

      const { walletId, transaction_date } = input || {};
      const res_transactions = await ctx.db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, loggedInUser.id),
          walletId ? eq(transactions.walletId, walletId) : undefined,
          transaction_date ? eq(transactions.transaction_date, transaction_date) : undefined,
          not(eq(transactions.type, "adjustment"))
        ),
        orderBy: (transactions, { desc }) => [desc(transactions.transaction_date)],
      });

      return res_transactions.map((transaction) => ({
        amount: transaction.amount,
        transaction_date: transaction.transaction_date,
        description: transaction.description,
        category: transaction.category,
        created_at: transaction.created_at,
        note: transaction.note,
        type: transaction.type,
        id: transaction.id,
      })) as Transaction[];
    }),

  getTransactionById: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const loggedInUser = ctx.session.user;
      if (!loggedInUser) {
        throw new Error("User not logged in");
      }

      const res_transaction = await ctx.db.query.transactions.findFirst({
        where: (transaction) => input.id ? and(
          eq(transaction.userId, loggedInUser.id),
          eq(transaction.id, input?.id),
          not(eq(transaction.type, "adjustment"))
        ) : and(
          eq(transaction.userId, loggedInUser.id),
          not(eq(transaction.type, "adjustment"))
        ),
        orderBy: (transactions, { desc }) => [desc(transactions.transaction_date)],
      });

      if (!res_transaction) {
        throw new Error("Transaction not found");
      }
      return {
        amount: res_transaction.amount,
        transaction_date: res_transaction.transaction_date,
        description: res_transaction.description,
        category: res_transaction.category,
        created_at: res_transaction.created_at,
        note: res_transaction.note,
        type: res_transaction.type,
        id: res_transaction.id,
      };
    }),
  
  updateTransaction: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      amount: z.number(),
      transaction_date: z.date(),
      walletId: z.string(),
      description: z.string(),
      category: z.string(),
      note: z.string().optional(),
      type: z.enum(["income", "expense", "transfer", "adjustment"]),
    })).mutation(async ({ ctx, input }) => {
      const loggedInUser = ctx.session.user;

      if (!loggedInUser) {
        throw new Error("User not logged in");
      }
      const wallet = await ctx.db.query.wallets.findFirst({
        where: and(
          eq(wallets.userId, loggedInUser.id),
          eq(wallets.id, input.walletId),
        ),
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      let res_transaction;
      if (input.id) {
        const transaction = await ctx.db.query.transactions.findFirst({
          where: and(
            eq(transactions.userId, loggedInUser.id),
            eq(transactions.id, input.id),
          ),
        });

        if (!transaction) {
          throw new Error("Transaction not found");
        }

        res_transaction = await ctx.db.update(transactions).set({
          amount: input.amount,
          walletId: input.walletId,
          transaction_date: input.transaction_date,
          description: input.description,
          category: input.category,
          note: input.note,
          type: input.type,
        }).where(
          and(
            eq(transactions.userId, loggedInUser.id),
            eq(transactions.id, input.id),
          ),
        ).returning().execute();
      } else {
        res_transaction = await ctx.db.insert(transactions).values({
          userId: loggedInUser.id,
          walletId: input.walletId,
          amount: input.amount,
          transaction_date: input.transaction_date,
          description: input.description,
          category: input.category,
          note: input.note,
          type: input.type,
        }).returning().execute();
      }

      if (input.type === "adjustment") {
        return;
      }
      return res_transaction.map((transaction) => ({
        amount: transaction.amount,
        transaction_date: transaction.transaction_date,
        description: transaction.description,
        category: transaction.category,
        created_at: transaction.created_at,
        note: transaction.note,
        type: transaction.type,
        id: transaction.id,
      }));
    })
});