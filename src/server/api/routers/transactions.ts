import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { transactions } from "@/server/db/transaction";
import { wallets } from "@/server/db/wallet";
import { and, eq, not } from "drizzle-orm";
import { z } from "zod";
import { getCurrentExchangeRate } from "../services/wallets";

export const transactionsRouter = createTRPCRouter({
  getTransactions: protectedProcedure
    .input(z.object({
      walletId: z.string().optional(),
      transaction_date: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { walletId, transaction_date } = input || {};
      const res_transactions = await ctx.db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, ctx.session.user.id),
          walletId ? eq(transactions.walletId, walletId) : undefined,
          transaction_date ? eq(transactions.transaction_date, transaction_date) : undefined,
          not(eq(transactions.type, "adjustment"))
        ),
        with: {
          wallet: {
            columns: {
              currency: true,
              name: true,
            },
          },
        },
        orderBy: (transactions, { desc }) => [desc(transactions.transaction_date)],
      });
      return res_transactions;
    }),

  getTransactionById: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const res_transaction = await ctx.db.query.transactions.findFirst({
        where: (transaction) => input.id ? and(
          eq(transaction.userId, ctx.session.user.id),
          eq(transaction.id, input?.id),
          not(eq(transaction.type, "adjustment"))
        ) : and(
          eq(transaction.userId, ctx.session.user.id),
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
      type: z.enum(["income", "expense", "adjustment"]),
    })).mutation(async ({ ctx, input }) => {
      const wallet = await ctx.db.query.wallets.findFirst({
        where: and(
          eq(wallets.userId, ctx.session.user.id),
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
            eq(transactions.userId, ctx.session.user.id),
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
            eq(transactions.userId, ctx.session.user.id),
            eq(transactions.id, input.id),
          ),
        ).returning().execute();
      } else {
        res_transaction = await ctx.db.insert(transactions).values({
          userId: ctx.session.user.id,
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

      if (!res_transaction || res_transaction.length === 0) {
        throw new Error("Transaction not found");
      }

      return ctx.db.query.transactions.findFirst({
        where: and(
          eq(transactions.userId, ctx.session.user.id),
          eq(transactions.id, res_transaction?.[0]?.id ?? ""),
        ),
        with: {
          wallet: {
            columns: {
              currency: true,
              name: true,
            },
          },
        },
      });
    }),

  removeTransaction: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {

      const transaction = await ctx.db.query.transactions.findFirst({
        where: and(
          eq(transactions.userId, ctx.session.user.id),
          eq(transactions.id, input.id),
        ),
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const deleted = await ctx.db.delete(transactions).where(
        eq(transactions.id, transaction.id),
      ).returning().execute();

      console.log(deleted);
      return deleted;
    }),
  
  transferFunds: protectedProcedure
    .input(z.object({
      fromWalletId: z.string(),
      toWalletId: z.string(),
      amount: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { fromWalletId, toWalletId, amount } = input;

      const fromWallet = await ctx.db.query.wallets.findFirst({
        where: and(
          eq(wallets.userId, ctx.session.user.id),
          eq(wallets.id, fromWalletId),
        ),
      });

      if (!fromWallet) {
        throw new Error("Source wallet not found");
      }

      const toWallet = await ctx.db.query.wallets.findFirst({
        where: and(
          eq(wallets.userId, ctx.session.user.id),
          eq(wallets.id, toWalletId),
        ),
      });

      if (!toWallet) {
        throw new Error("Destination wallet not found");
      }

      const originalCurrency = fromWallet.currency; const newCurrency = toWallet.currency;

      if (!originalCurrency || !newCurrency) {
        // theoretically will never happen
        throw new Error("missing currencies")
      }
      let convertedAmount = amount;
    
      // If currencies are different, apply exchange rate
      if (originalCurrency !== newCurrency) {
        const exchangeRate = await getCurrentExchangeRate(originalCurrency, newCurrency, ctx);
        convertedAmount = amount * exchangeRate;
      }
  
      await ctx.db.transaction(async (tx) => {
        await tx.insert(transactions).values({
          userId: ctx.session.user.id,
          walletId: fromWalletId,
          amount: amount,
          transaction_date: new Date(),
          category: "transfer",
          type: "expense",
        }).execute();

        await tx.insert(transactions).values({
          userId: ctx.session.user.id,
          walletId: toWalletId,
          amount: convertedAmount,
          transaction_date: new Date(),
          category: "transfer",
          type: "income",
        }).execute();
      });

      return { success: true };
    })
    
});