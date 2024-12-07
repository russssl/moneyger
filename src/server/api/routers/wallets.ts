import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { wallets } from "@/server/db/wallet";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

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
      return res_wallets.map((wallet) => ({
        name: wallet.name,
        balance: wallet.balance,
        currency: wallet.currency,
        id: wallet.id,
        type: "wallet",
      }));
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
        balance: res_wallet.balance,
        currency: res_wallet.currency,
        id: res_wallet.id,
        type: "wallet",
      };
    }),
  
  createWallet: protectedProcedure.
    input(z.object({
      name: z.string(),
      balance: z.number(),
      currency: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const loggedInUser = ctx.session.user;
      if (!loggedInUser) {
        throw new Error("User not logged in");
      }
      const res_wallet = await ctx.db.insert(wallets).values({
        userId: loggedInUser.id,
        name: input.name,
        balance: input.balance,
        currency: input.currency,
      }).execute();

      return res_wallet;
    }),
});