import { account, type Account, user as users} from "@/server/db/user";
import { and, eq, ne } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { authenticated, type AuthVariables, getUserData } from "../authenticate";
import { zValidator } from "@hono/zod-validator";
import db from "@/server/db";
import { createRateLimiter } from "../middleware/rateLimit";

const userRouter = new Hono<AuthVariables>();

userRouter.get("/", authenticated, async (c) => {
  const { user } = await getUserData(c);
  return c.json(user);
});

userRouter.get("/me", authenticated, async (c) => {
  const { user } = await getUserData(c);
  const userData = await db.query.user.findFirst({
    where: eq(users.id, user.id),
  });
  return c.json(userData);
});

userRouter.post("/setPassword", authenticated, createRateLimiter("sensitive"), zValidator("json", z.object({
  password: z.string(),
  confirmPassword: z.string(),
})), async (c) => {
  const { user, context } = await getUserData(c);
  const { password, confirmPassword } = c.req.valid("json");

  if (password !== confirmPassword) {
    return c.json({ error: "Passwords do not match" }, 400);
  }

  // check if user already has credentials provider
  const credentialsAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, user.id), eq(account.providerId, "credential")),
  });

  if (credentialsAccount) {
    return c.json({ error: "Password is already set" }, 400);
  }

  const passwordHash = await context.password.hash(password);
  await context.internalAdapter.updatePassword(user.id, passwordHash);

  return c.json({ message: "Password set successfully" });
});

userRouter.post("/", authenticated, zValidator("json", z.object({
  email: z.string().email().optional(),
  currency: z.string().optional(),
})), async (c) => {
  const { user } = await getUserData(c);

  const { email, currency } = c.req.valid("json");

  const userData = await db.query.user.findFirst({
    where: eq(users.id, user.id),
  });

  if (!userData) {
    return c.json({ error: "User not found" }, 400);
  }

  const updateData: Record<string, unknown> = {};
  if (typeof email !== "undefined") updateData.email = email;
  if (typeof currency !== "undefined") updateData.currency = currency;

  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, user.id)).execute();
  }

  return c.json({ message: "User updated successfully" });
});

userRouter.post("/updatePassword", authenticated, createRateLimiter("sensitive"), zValidator("json", z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
})), async (c) => {
  const { user, context } = await getUserData(c);
  const { oldPassword, newPassword } = c.req.valid("json");

  const userData = await db.query.user.findFirst({
    where: eq(users.id, user.id),
    with: {
      accounts: {
        columns: {
          password: true,
          providerId: true,
        },
      },
    },
  });

  const credentialsProvider = userData?.accounts.find((account: Partial<Account>) => account.providerId === "credential");
  if (!credentialsProvider) {
    return c.json({ error: "Credentials provider not found" }, 400);
  }

  const passwordsAreSame = await context.password.verify({
    password: oldPassword,
    hash: credentialsProvider.password ?? "",
  });

  if (!passwordsAreSame) {
    return c.json({ error: "Old password is incorrect" }, 400);
  }

  const passwordHash = await context.password.hash(newPassword);
  await context.internalAdapter.updatePassword(user.id, passwordHash);

  return c.json({ message: "Password updated successfully" });
});

userRouter.get("/accounts", authenticated, zValidator("query", z.object({
  providerId: z.string(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { providerId } = c.req.valid("query");

  const accounts = await db.query.account.findMany({
    where: and(
      eq(account.userId, user.id),
      ne(account.providerId, providerId),
    ),
  });

  return c.json(accounts);
});

userRouter.delete("/accounts", authenticated, zValidator("query", z.object({
  providerId: z.string(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { providerId } = c.req.valid("query");
  
  const accountToRemove = await db.query.account.findFirst({
    where: and(
      eq(account.userId, user.id),
      eq(account.providerId, providerId),
    ),
  });
  
  if (!accountToRemove) {
    return c.json({ error: "Account not found" }, 400);
  }

  await db.delete(account).where(eq(account.id, accountToRemove.id)).execute();

  return c.json({ message: "Account deleted successfully" });
});

userRouter.delete("/", authenticated, createRateLimiter("sensitive"), async (c) => {
  const { user: currentUser } = await getUserData(c);

  await db.delete(users).where(eq(users.id, currentUser.id)).execute();

  return c.json({ message: "User deleted successfully" });
});

export default userRouter;