import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { transactions, type TransactionWithWallet } from "@/server/db/transaction";
import { wallets } from "@/server/db/wallet";
import { and, eq, not } from "drizzle-orm";
import { z } from "zod";
import { type Transaction } from "@/server/db/transaction";
import { getCurrentExchangeRate } from "../services/wallets";

export const transactionsRouter = createTRPCRouter({
  getTransactions: protectedProcedure
    .input(z.object({
      walletId: z.string().optional(),
      transaction_date: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }): Promise<TransactionWithWallet[]> => {
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
    .query(async ({ ctx, input }): Promise<Partial<Transaction>> => {
      const res_transaction = await ctx.db.query.transactions.findFirst({
        where: (transaction) => input.id ? and(
          eq(transaction.userId, ctx.session.user.id),
          eq(transaction.id, input?.id),
          not(eq(transaction.type, "adjustment"))
        ) : undefined,
      });
      if (!res_transaction) {
        throw new Error("Transaction not found");
      }
      return res_transaction;
    }),

  createTransaction: protectedProcedure
    .input(z.object({
      walletId: z.string(),
      toWalletId: z.string().optional(),
      amount: z.number(),
      type: z.enum(["income", "expense", "transfer"]),
      transaction_date: z.date(),
      description: z.string(),
      category: z.string(),
    }))
    .mutation(async ({ ctx, input }): Promise<TransactionWithWallet> => {
      const res = await ctx.db.transaction(async (tx) => {
        const wallet = await tx.query.wallets.findFirst({
          where: eq(wallets.id, input.walletId),
        });
        if (!wallet) {
          throw new Error("Wallet not found");
        }
  
        const createdTransaction = await tx.insert(transactions).values({
          userId: ctx.session.user.id,
          walletId: input.walletId,
          amount: input.amount,
          transaction_date: input.transaction_date,
          description: input.description,
          category: input.category,
          type: input.type,
        }).returning({ id: transactions.id }).execute().then((res) => res[0]);

        if (!createdTransaction?.id) {
          throw new Error("Transaction not created");
        }

        const res_transaction = await tx.query.transactions.findFirst({
          where: eq(transactions.id, createdTransaction.id),
          with: {
            wallet: {
              columns: {
                name: true,
                currency: true,
              },
            },
          },
        });

        if (!res_transaction) {
          throw new Error("Transaction not created");
        }
        if (input.type !== "transfer") {
          const balance = input.type === "income" ? wallet.balance + input.amount : wallet.balance - input.amount; 
          await tx.update(wallets).set({
            balance,
          }).where(eq(wallets.id, input.walletId));
        } else {
          if (!input.toWalletId) {
            throw new Error("To wallet ID is required");
          }
          const [sourceWallet, destinationWallet] = await Promise.all([
            tx.query.wallets.findFirst({
              where: eq(wallets.id, input.walletId),
            }),
            tx.query.wallets.findFirst({
              where: eq(wallets.id, input.toWalletId),
            }),
          ]);
          if (!sourceWallet || !destinationWallet) {
            throw new Error("Wallet not found");
          }
          if (!sourceWallet.currency || !destinationWallet.currency) {
            throw new Error("Currency not found");
          }
          let newSourceBalance; let newDestinationBalance;
          if (sourceWallet.currency !== destinationWallet.currency) {
            const exchangeRate = await getCurrentExchangeRate(sourceWallet.currency, destinationWallet.currency, ctx);
            newSourceBalance = sourceWallet.balance - input.amount;
            newDestinationBalance = destinationWallet.balance + input.amount * exchangeRate;
          } else {
            newSourceBalance = sourceWallet.balance - input.amount;
            newDestinationBalance = destinationWallet.balance + input.amount;
          }
          await Promise.all([
            tx.update(wallets).set({
              balance: newSourceBalance,
            }).where(eq(wallets.id, input.walletId)),
            tx.update(wallets).set({
              balance: newDestinationBalance,
            }).where(eq(wallets.id, input.toWalletId)),
          ]);
        }
        
        if (!res_transaction) {
          throw new Error("Transaction not created");
        }
        return res_transaction;
      });
      return res;
    }),

  updateTransaction: protectedProcedure
    .input(z.object({
      id: z.string(),
      amount: z.number(),
      transaction_date: z.date(),
      description: z.string(),
      category: z.string(),
    }))
    .mutation(async ({ ctx, input }): Promise<Transaction> => {
      const transaction = await ctx.db.transaction(async (tx) => {
        const transaction = await tx.query.transactions.findFirst({
          where: eq(transactions.id, input.id),
        });
        if (!transaction) {
          throw new Error("Transaction not found");
        }

        const res = await tx.update(transactions).set({
          amount: input.amount,
          transaction_date: input.transaction_date,
          description: input.description,
          category: input.category,
        }).where(eq(transactions.id, input.id)).returning().execute().then((res) => res[0]);

        if (!res) {
          throw new Error("Transaction not updated");
        }

        return res;
      });
      return transaction;
    }),

  deleteTransaction: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }): Promise<void> => {
      await ctx.db.transaction(async (tx) => {
        const transaction = await tx.query.transactions.findFirst({
          where: eq(transactions.id, input.id),
        });
        if (!transaction) {
          throw new Error("Transaction not found");
        }

        const wallet = await tx.query.wallets.findFirst({
          where: eq(wallets.id, transaction.walletId),
        });
        if (!wallet) {
          throw new Error("Wallet not found");
        }
        await tx.update(wallets).set({
          balance: transaction.type === "income" ? wallet.balance - transaction.amount : wallet.balance + transaction.amount,
        }).where(eq(wallets.id, transaction.walletId));

        await tx.delete(transactions).where(eq(transactions.id, input.id));
      });
    }),
});