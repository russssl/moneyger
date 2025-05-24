import { auth } from "@/lib/auth";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { PasswordReset, passwordReset } from "@/server/db/passwordReset";
import { account, type SelectAccount, user as users} from "@/server/db/user";
import { type SelectUserSettings, userSettings } from "@/server/db/userSettings";
import { and, eq, gte, ne } from "drizzle-orm";
import { DateTime } from "luxon";
import { z } from "zod";

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
      try {
        const user = ctx.session.user;
        const userId = user.id;
        
        return await ctx.db.transaction(async (tx) => {
          const existingSettings = await tx.query.userSettings.findFirst({
            where: eq(userSettings.userId, userId),
          });
          
          if (existingSettings) {
            return existingSettings;
          }

          await tx.insert(userSettings).values({
            userId,
            currency: input.currency,
          })

          const inserted = await tx.query.userSettings.findMany({
            where: eq(userSettings.userId, userId),
          });

          if (!inserted || inserted.length === 0) {
            throw new Error("User settings not created");
          }
          
          const result = inserted[0] ?? null;
          console.log("Returning result:", result);
          return result;
        });
      } catch (error) {
        throw error;
      }
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

      return { ...userSettingsData, email: userData.email };
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
    .query(async ({ ctx }): Promise<{ currency: string | undefined }> => {
      const user = ctx.session.user;
      const userId = user.id;

      const userSettingsData = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
      });

      const currency = userSettingsData?.currency ?? undefined;
      return { currency: currency === null ? undefined : currency };
    }),
  
  checkCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string(),
    }))
    .query(async ({ ctx, input }): Promise<boolean> => {
      const res_user = await ctx.db.query.user.findFirst({
        where: eq(users.email, input.email),
      });

      if (!res_user) {
        throw new Error("User not found");
      }

      const existingCode: PasswordReset | undefined = await ctx.db.query.passwordReset.findFirst({
        where: and(
          eq(passwordReset.userId, res_user.id),
          gte(passwordReset.expiresAt, DateTime.now().minus({ minutes: 30 }).toJSDate())
        ),
      });
      if (!existingCode) {
        throw new Error("No valid reset code found for this user");
      }

      return existingCode.token === input.code;
    }),
});
