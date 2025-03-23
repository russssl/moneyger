import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { user as users} from "@/server/db/user";
import { userSettings } from "@/server/db/userSettings";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const userRouter = createTRPCRouter({

  getUserByEmail: publicProcedure.input(z.object({
    email: z.string().email(), // Validate input to ensure it's an email
  }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.user.findFirst({
        where: eq(users.email, input.email),
      });

      return user ?? null;
    }),

  createUserSettings: publicProcedure.
    input(z.object({
      userId: z.string(),
      currency: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(userSettings).values({
        userId: input.userId,
        currency: input.currency,
      }).execute();

      const newUserSettings = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, input.userId),
      });

      return newUserSettings ?? null;
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

      return { ...userSettingsData, username: userData.username };
    }),
  
  updateUserSettings: protectedProcedure.input(z.object({
    currency: z.string(),
    username: z.string(),
  }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const userId = user.id;

      await ctx.db.update(userSettings).set({
        currency: input.currency ,
      }).where(eq(userSettings.userId, userId)).execute();

      await ctx.db.update(users).set({
        username: input.username,
      }).where(eq(users.id, userId)).execute();

      const updatedUserSettings = await ctx.db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
      });

      return updatedUserSettings ?? null;
    }),
});
