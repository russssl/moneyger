import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { transactions } from "@/server/db/transaction";
import { type Wallet, wallets } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

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

  // updateWallet: protectedProcedure
  //   .input(z.object({
  //     id: z.string().optional(),
  //     name: z.string(),
  //     initialBalance: z.number().optional(),
  //     currency: z.string(),
  //   }))
  //   .mutation(async ({ ctx, input }): Promise<Wallet> => {
  //     let res_wallet: Wallet;
  //     let updatedWallet;
  //     if (input.id) {
  //       const wallet = await ctx.db.query.wallets.findFirst({
  //         where: and(
  //           eq(wallets.userId, ctx.session.user.id),
  //           eq(wallets.id, input.id),
  //         ),
  //       });

  //       if (!wallet) {
  //         throw new Error("Wallet not found");
  //       }

  //       // update the wallet
  //       updatedWallet = await ctx.db.update(wallets).set({
  //         name: input.name,
  //         currency: input.currency,
  //       }).where(
  //         and(
  //           eq(wallets.userId, ctx.session.user.id),
  //           eq(wallets.id, input.id),
  //         )).returning().execute();
  //     } else {
  //       updatedWallet = await ctx.db.insert(wallets).values({
  //         userId: ctx.session.user.id,
  //         name: input.name,
  //         currency: input.currency,
  //         balance: input.initialBalance ?? 0,
  //       }).returning().execute().then((res) => res[0]);
        
  //       if (!updatedWallet) {
  //         throw new Error("Wallet not found");
  //       }

  //       if (input.initialBalance) {
  //         await ctx.db.insert(transactions).values({
  //           walletId: res_wallet.id,
  //           amount: input.initialBalance,
  //           type: "adjustment",
  //           userId: ctx.session.user.id,
  //         }).execute();
  //       }
  //     }
      
  //   }),
  
  createWallet: protectedProcedure
    .input(z.object({
      name: z.string(),
      currency: z.string(),
      initialBalance: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }): Promise<Wallet> => {
      const res_wallet = await ctx.db.insert(wallets).values({
        userId: ctx.session.user.id,
        name: input.name,
        currency: input.currency,
        balance: input.initialBalance ?? 0,
      }).returning().execute().then((res) => res[0]);

      if (!res_wallet) {
        throw new Error("Wallet not found");
      }

      if (input.initialBalance) {
        await ctx.db.insert(transactions).values({
          walletId: res_wallet.id,
          amount: input.initialBalance,
          type: "adjustment",
          userId: ctx.session.user.id,
        }).execute();
      }

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
});
