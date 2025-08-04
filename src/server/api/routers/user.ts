import { auth } from "@/lib/auth";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { account, type SelectAccount, user as users} from "@/server/db/user";
import { type SelectUserSettings, userSettings } from "@/server/db/userSettings";
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

  createUserSettings: protectedProcedure
    .input(z.object({
      currency: z.string(),
    }))
    .mutation(async ({ ctx, input }): Promise<SelectUserSettings | null> => {
      const user = ctx.session.user;
      const userId = user.id;
      
      const res =  await ctx.db.transaction(async (tx) => {
        const existingSettings = await tx.query.userSettings.findFirst({
          where: eq(userSettings.userId, userId),
        });
        
        if (existingSettings) {
          return existingSettings;
        }

        const result = await tx.insert(userSettings).values({
          userId,
          currency: input.currency,
        }).returning().execute().then((res) => res[0]);

        if (!result) {
          throw new Error("User settings not created");
        }
        
        return result;
      });
      return res;
    }),
  
  getUserSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const user = ctx.session.user;
      const userId = user.id;
      const userSettingsData = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
      });

      const userData = await ctx.db.query.user.findFirst({
        where: eq(users.id, userId),
      });

      if (!userSettingsData || !userData) {
        return null;
      }
      return { ...userSettingsData, email: userData.email, username: userData.displayUsername };
    }),


  updateUserSettings: protectedProcedure.input(z.object({
    currency: z.string().optional(),
    email: z.string().optional(),
  }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const userId = user.id;

      const us = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
      });
      if (!us) {
        throw new Error("User settings not found");
      }

      if (input.currency) {
        await ctx.db.update(userSettings).set({
          currency: input.currency ,
        }).where(eq(userSettings.userId, userId)).execute();
      }

      if (input.email) {
        await ctx.db.update(users).set({
          email: input.email,
        }).where(eq(users.id, userId)).execute();
      }

      const updatedUserSettings = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
      });

      return updatedUserSettings ?? null;
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

  getUserAdditionalData: protectedProcedure
    .query(async ({ ctx }): Promise<UserAdditionalData> => {
      const user = ctx.session.user;
      const userId = user.id;

      const userSettingsData = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
      });

      const currency = userSettingsData?.currency ?? undefined;
      return { currency: currency === null ? undefined : currency };
    }),
});
