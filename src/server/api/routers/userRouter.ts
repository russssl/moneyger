import { account, type Account, user as users} from "@/server/db/user";
import { wallets } from "@/server/db/wallet";
import { and, eq, ne } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { authenticated, type AuthVariables, getUserData } from "../authenticate";
import { zValidator } from "@hono/zod-validator";
import db from "@/server/db";
import { createRateLimiter } from "../middleware/rateLimit";
import bcrypt from "bcryptjs";

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
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
})), async (c) => {
  const { user } = await getUserData(c);
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

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: user.id,
    providerId: "credential",
    userId: user.id,
    password: passwordHash,
  }).execute();

  return c.json({ message: "Password set successfully" });
});

const ALLOWED_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "PLN", "CHF", "UAH", "CZK"] as const;

userRouter.post("/", authenticated, zValidator("json", z.object({
  email: z.string().email().optional(),
  currency: z.string().optional().refine((v) => !v || (ALLOWED_CURRENCIES as readonly string[]).includes(v), { message: `Currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}` }),
})), async (c) => {
  const { user } = await getUserData(c);

  const { email, currency } = c.req.valid("json");

  const userData = await db.query.user.findFirst({
    where: eq(users.id, user.id),
  });

  if (!userData) {
    return c.json({ error: "User not found" }, 400);
  }

  if (typeof email !== "undefined" && email.toLowerCase() !== userData.email.toLowerCase()) {
    const existing = await db.query.user.findFirst({ where: eq(users.email, email.toLowerCase()) });
    if (existing) {
      return c.json({ error: "Email already in use" }, 409);
    }
  }

  const updateData: Record<string, unknown> = {};
  if (typeof email !== "undefined") updateData.email = email.toLowerCase();
  if (typeof currency !== "undefined") updateData.currency = currency;

  if (Object.keys(updateData).length > 0) {
    try {
      await db.update(users).set(updateData).where(eq(users.id, user.id)).execute();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("user_email_unique")) {
        return c.json({ error: "Email already in use" }, 409);
      }
      throw e;
    }
  }

  return c.json({ message: "User updated successfully" });
});

userRouter.post("/updatePassword", authenticated, createRateLimiter("sensitive"), zValidator("json", z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number"),
})), async (c) => {
  const { user } = await getUserData(c);
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

  const credentialsProvider = userData?.accounts.find((acc: Partial<Account>) => acc.providerId === "credential");
  if (!credentialsProvider) {
    return c.json({ error: "Credentials provider not found" }, 400);
  }

  const isValid = credentialsProvider.password ? await bcrypt.compare(oldPassword, credentialsProvider.password) : false;

  if (!isValid) {
    return c.json({ error: "Old password is incorrect" }, 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(account).set({ password: passwordHash }).where(and(eq(account.userId, user.id), eq(account.providerId, "credential"))).execute();

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

  const remainingAccounts = await db.query.account.findMany({
    where: eq(account.userId, user.id),
  });
  const remainingAfter = remainingAccounts.filter((a) => a.id !== accountToRemove.id);
  if (remainingAfter.length === 0) {
    return c.json({ error: "Cannot remove last login method. Set a password first." }, 400);
  }

  await db.delete(account).where(eq(account.id, accountToRemove.id)).execute();

  return c.json({ message: "Account deleted successfully" });
});

userRouter.delete("/", authenticated, createRateLimiter("sensitive"), async (c) => {
  const { user: currentUser } = await getUserData(c);

  // wallets.userId FK is NO ACTION in migration 0000_dark_shinobi_shaw.sql; delete dependents first to avoid FK violation
  await db.delete(wallets).where(eq(wallets.userId, currentUser.id)).execute();
  await db.delete(users).where(eq(users.id, currentUser.id)).execute();

  return c.json({ message: "User deleted successfully" });
});

export default userRouter;