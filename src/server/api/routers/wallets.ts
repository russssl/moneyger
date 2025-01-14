import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { transactions as transactionsSchema } from "@/server/db/transaction";
import { wallets } from "@/server/db/wallet";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {  getFormattedWallets } from "../services/wallets";

export const walletRouter = createTRPCRouter({
  getWallets: protectedProcedure.
    query(async ({ ctx }) => {
      const loggedInUser = ctx.session.user;
      if (!loggedInUser) {
        throw new Error("User not logged in");
      }
      const res_wallets = await ctx.db.query.wallets.findMany({
        where: eq(wallets.userId, loggedInUser.id),

      })

      return await getFormattedWallets(res_wallets);
    }),

  getWalletById: protectedProcedure.
    input(z.object({
      id: z.string().nullable(),
    }))
    .query(async ({ ctx, input }) => {
      const loggedInUser = ctx.session.user;
      if (!loggedInUser) {
        throw new Error("User not logged in");
      }
      if (!input.id) {
        throw new Error("Wallet id not provided");
      }
      const res_wallet = await ctx.db.query.wallets.findFirst({
        where: (wallet) => input.id ? and(
          eq(wallet.userId, loggedInUser.id),
          eq(wallet.id, input?.id),
        ) : eq(wallet.userId, loggedInUser.id),
      });

      if (!res_wallet) {
        throw new Error("Wallet not found");
      }
      return {
        name: res_wallet.name,
        currency: res_wallet.currency,
        id: res_wallet.id,
        type: "wallet",
      };
    }),
  
  updateWallet: protectedProcedure.
    input(z.object({
      id: z.string().optional(),
      name: z.string(),
      initialBalance: z.number().optional(),
      currency: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const loggedInUser = ctx.session.user;
      if (!loggedInUser.id) {
        console.log(loggedInUser);
        throw new Error("User not logged in");
      }
      let res_wallet;
      if (input.id) {
        const wallet = await ctx.db.query.wallets.findFirst({
          where: and(
            eq(wallets.userId, loggedInUser.id),
            eq(wallets.id, input.id),
          ),
        });
    
        if (!wallet) {
          throw new Error("Wallet not found");
        }
    
        // update the wallet
        res_wallet = await ctx.db.update(wallets).set({
          name: input.name,
          currency: input.currency,
        }).where(
          and(
            eq(wallets.userId, loggedInUser.id),
            eq(wallets.id, input.id),
          )).returning().execute();
      } else {
        res_wallet = await ctx.db.insert(wallets).values({
          userId: loggedInUser.id,
          name: input.name,
          currency: input.currency,
        }).returning().execute();

        if (input.initialBalance && res_wallet[0]) {
          await ctx.db.insert(transactions).values({
            walletId: res_wallet[0].id,
            amount: input.initialBalance,
            type: "adjustment",
            userId: loggedInUser.id,
          }).execute();
        }
      }
      
      if (!res_wallet) {
        throw new Error("Wallet not found");
      }
      return await getFormattedWallets(res_wallet);
    }),
  deleteWallet: protectedProcedure.
    input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const loggedInUser = ctx.session.user;
      if (!loggedInUser) {
        throw new Error("User not logged in");
      }

      await ctx.db.transaction(async (tx) => {
        const wallet = await tx.query.wallets.findFirst({
          where: and(
            eq(wallets.userId, loggedInUser.id),
            eq(wallets.id, input.id),
          ),
        });

        if (!wallet) {
          throw new Error("Wallet not found");
        }
        
        await tx.delete(transactionsSchema).where(
          eq(transactionsSchema.walletId, wallet.id),
        ).execute();
        
        await tx.delete(wallets).where(
          eq(wallets.id, input.id),
        ).execute();

        return wallet;
      })
    }),
});
