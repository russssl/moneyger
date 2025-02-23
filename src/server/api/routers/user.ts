import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { hashPassword } from "@/server/auth/util";
import { users, insertUserSchema} from "@/server/db/user";
import { userSettings } from "@/server/db/userSettings";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const userRouter = createTRPCRouter({

  getUserByEmail: publicProcedure.input(z.object({
    email: z.string().email(), // Validate input to ensure it's an email
  }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      return user ?? null;
    }),

  createUser: publicProcedure.
    input(insertUserSchema)
    .mutation(async ({ ctx, input }) => {

      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        throw new Error("Email already in use");
      }

      if (input.username) {
        const existingUsername = await ctx.db.query.users.findFirst({
          where: eq(users.username, input.username),
        });
        if (existingUsername) {
          throw new Error("Username already in use");
        }
      }
      if (!input.password) {
        throw new Error("Password is required");
      }

      const password = await hashPassword(input.password);

      await ctx.db.insert(users).values({
        ...input,
        password,
      }).execute();

      const user = await ctx.db.query.users.findFirst({
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

      const userData = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!userSettingsData || !userData) {
        return null;
      }

      return { ...userSettingsData, username: userData.username } ?? null;
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
