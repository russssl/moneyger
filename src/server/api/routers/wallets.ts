import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { transactions } from "@/server/db/transaction";
import { userSettings, type Wallet, wallets } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { calculateTotalBalance, getCurrentExchangeRate, calculateWalletTrends } from "../services/wallets";

export const walletRouter = createTRPCRouter({
  getWallets: protectedProcedure
    .query(async ({ ctx }): Promise<Wallet[]> => {
      const res_wallets = await ctx.db.query.wallets.findMany({
        where: eq(wallets.userId, ctx.session.user.id),
      });
      return res_wallets;
    }),

  getWalletById: protectedProcedure
    .input(z.object({
      id: z.string().nullable(),
    }))
    .query(async ({ ctx, input }): Promise<Wallet> => {
      if (!input.id) {
        throw new Error("Wallet id not provided");
      }
      const res_wallet = await ctx.db.query.wallets.findFirst({
        where: and(
          eq(wallets.userId, ctx.session.user.id),
          eq(wallets.id, input.id),
        ),
        with: {
          transactions: true,
        },
      });

      if (!res_wallet) {
        throw new Error("Wallet not found");
      }
      return res_wallet;
    }),
  
  getExchangeRate: protectedProcedure
    .input(z.object({
      from: z.string(),
      to: z.string(),
    }))
    .query(async ({ input }) => {
      return await getCurrentExchangeRate(input.from, input.to);
    }),

  createWallet: protectedProcedure
    .input(z.object({
      name: z.string(),
      currency: z.string(),
      isSavingAccount: z.boolean().optional(),
      savingAccountGoal: z.number().optional(),
      initialBalance: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }): Promise<Wallet> => {
      const res_wallet = await ctx.db.transaction(async (tx) => {
        const wallet = await tx.insert(wallets).values({
          userId: ctx.session.user.id,
          name: input.name,
          currency: input.currency,
          isSavingAccount: input.isSavingAccount ?? false,
          balance: input.initialBalance ?? 0,
          savingAccountGoal: input.savingAccountGoal ?? 0,
        }).returning().execute().then((res) => res[0]);

        if (!wallet) {
          throw new Error("Failed to create wallet");
        }

        if (input.initialBalance && input.initialBalance !== 0) {
          await tx.insert(transactions).values({
            userId: ctx.session.user.id,
            walletId: wallet.id,
            amount: input.initialBalance,
            type: "adjustment",
            transaction_date: new Date(),
            description: "Initial balance",
            category: "Initial Balance",
          }).execute();
        }

        return wallet;
      });

      return res_wallet;
    }),

  updateWallet: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      currency: z.string(),
    }))
    .mutation(async ({ ctx, input }): Promise<Wallet> => {
      const res_wallet = await ctx.db.update(wallets).set({
        name: input.name,
        currency: input.currency,
      }).where(eq(wallets.id, input.id)).returning().execute().then((res) => res[0]);

      if (!res_wallet) {
        throw new Error("Wallet not found");
      }

      return res_wallet;
    }),

  deleteWallet: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }): Promise<Wallet> => {
      const res_wallet = await ctx.db.transaction(async (tx) => {
        const wallet = await tx.query.wallets.findFirst({
          where: and(
            eq(wallets.userId, ctx.session.user.id),
            eq(wallets.id, input.id),
          ),
        });

        if (!wallet) {
          throw new Error("Wallet not found");
        }

        await tx.delete(transactions).where(
          eq(transactions.walletId, wallet.id),
        ).execute();

        await tx.delete(wallets).where(
          eq(wallets.id, input.id),
        ).execute();

        return wallet;
      });
      return res_wallet;
    }),
  getFullData: protectedProcedure
    .query(async ({ ctx }): Promise<{ 
      totalBalance: number, 
      wallets: Wallet[], 
      userMainCurrency: string,
      totalTrend: number,
      walletTrends: Record<string, number>
    }> => {
      const res_wallets = await ctx.db.query.wallets.findMany({
        where: eq(wallets.userId, ctx.session.user.id),
        with: {
          transactions: true,
        },
      });

      const userMainCurrency = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, ctx.session.user.id),
        columns: {
          currency: true,
        },
      });
      
      if (!userMainCurrency?.currency) {
        throw new Error("User main currency not found");
      }

      const totalBalance = await calculateTotalBalance(ctx.session.user.id, userMainCurrency.currency, ctx);
      const { totalTrend, walletTrends } = await calculateWalletTrends(ctx.session.user.id, userMainCurrency.currency, ctx);

      return {
        totalBalance: totalBalance.totalBalance,
        wallets: res_wallets,
        userMainCurrency: userMainCurrency.currency,
        totalTrend,
        walletTrends
      }
    }),
});
