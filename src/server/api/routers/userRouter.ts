import { account, type SelectAccount, user as users} from "@/server/db/user";
import { and, eq, ne } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { z } from "zod";
import { authenticated, type AuthVariables, getUserData } from "../authenticate";
import { zValidator } from "@hono/zod-validator";
import db from "@/server/db";
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

userRouter.post("/", authenticated, zValidator("json", z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  currency: z.string().optional(),
})), async (c) => {
  const { user } = await getUserData(c);

  const { email, username, currency } = c.req.valid("json");

  const userData = await db.query.user.findFirst({
    where: eq(users.id, user.id),
  });

  if (!userData) {
    return c.json({ error: "User not found" }, 400);
  }

  const updateData: Record<string, unknown> = {};
  if (typeof email !== "undefined") updateData.email = email;
  if (typeof username !== "undefined") updateData.username = username;
  if (typeof currency !== "undefined") updateData.currency = currency;

  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, user.id)).execute();
  }

  return c.json({ message: "User updated successfully" });
});

userRouter.post("/updatePassword", authenticated, zValidator("json", z.object({
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

  const credentialsProvider = userData?.accounts.find((account: Partial<SelectAccount>) => account.providerId === "credential");
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
})), async (c: Context<AuthVariables>) => {
  const { user, query } = await getUserData(c);
  const { providerId } = query;

  const accounts = await db.query.account.findMany({
    where: and(
      eq(account.userId, user.id),
      ne(account.providerId, providerId ?? ""),
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


export default userRouter;