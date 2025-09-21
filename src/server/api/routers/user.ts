import { auth } from "@/lib/auth";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { account, type SelectAccount, user as users} from "@/server/db/user";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

export type UserAdditionalData = {
  currency: string | undefined;
  language?: string;
}

export const userRouter = createTRPCRouter({

  getUserByEmail: publicProcedure.input(z.object({
    email: z.string().email(),
  }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.user.findFirst({
        where: eq(users.email, input.email),
      });

      return user ?? null;
    }),

  updatePassword: protectedProcedure
    .input(z.object({
      oldPassword: z.string(),
      newPassword: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;

      const userData: any = await ctx.db.query.user.findFirst({
        where: eq(users.id, user.id),
        with: {
          accounts: {
            columns: {
              password: true,
              providerId: true,
            },
          },
        }});
      
      const credentialsProvider = userData?.accounts.find((account: Partial<SelectAccount>) => account.providerId === "credential");
      if (!credentialsProvider) {
        throw new Error("User does not have a credentials account");
      }

      
      const context = await auth.$context;
      const passwordsAreSame = await context.password.verify({
        password: input.oldPassword,
        hash: credentialsProvider.password,
      });

      if (!passwordsAreSame) {
        throw new Error("Old password is incorrect");
      }

      const hash = await context.password.hash(input.newPassword);

      await context.internalAdapter.updatePassword(user.id, hash);
    }),
  
  getUserAccounts: protectedProcedure
    .query(async ({ ctx }) => {
      const user = ctx.session.user;
      const userId = user.id;

      const accounts = await ctx.db.query.account.findMany({
        where: and(
          eq(account.userId, userId),
          ne(account.providerId, "credential"),
        ),
      });

      return accounts;
    }),
  
  removeUserAccount: protectedProcedure
    .input(z.object({
      providerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const userId = user.id;

      const accountToRemove = await ctx.db.query.account.findFirst({
        where: and(
          eq(account.userId, userId),
          eq(account.providerId, input.providerId),
        ),
      });

      if (!accountToRemove) {
        throw new Error("Account not found");
      }

      await ctx.db.delete(account).where(eq(account.id, accountToRemove.id)).execute();
    }),

  getUserData: protectedProcedure
    .query(async ({ ctx }) => {
      const user = ctx.session.user;
      const userId = user.id;

      const userData = await ctx.db.query.user.findFirst({
        where: eq(users.id, userId),
      });

      return userData;
    }),

  saveUserData: protectedProcedure
    .input(z.object({
      currency: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const userId = user.id;
      console.log("input", input);
      await ctx.db.update(users).set({
        currency: input.currency,
      }).where(eq(users.id, userId)).returning().execute().then((res) => res[0]);
    }),
});
