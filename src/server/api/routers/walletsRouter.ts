import { Hono } from "hono";
import { type AuthVariables } from "../authenticate";
import { authenticated, getUserData } from "../authenticate";
import { zValidator } from "@hono/zod-validator"
import { z } from "zod";
import { wallets } from "@/server/db/wallet";
import { and, eq } from "drizzle-orm";
import db from "@/server/db";
import { calculateTotalBalance, getCurrentExchangeRate } from "../services/wallets";
import { transactions } from "@/server/db/transaction";

const walletsRouter = new Hono<AuthVariables>();

walletsRouter.get("/", authenticated, async (c) => {
  const { user } = await getUserData(c);
  const res_wallets = await db.query.wallets.findMany({
    where: eq(wallets.userId, user.id),
  });
  return c.json(res_wallets);
});

walletsRouter.get("/full", authenticated, async (c) => {
  const { user } = await getUserData(c);
  const res_wallets = await db.query.wallets.findMany({
    where: eq(wallets.userId, user.id),
  });

  if (!user.currency) {
    // user still dont have a currency, return empty data
    return c.json({
      totalBalance: 0,
      wallets: [],
      userMainCurrency: null,
    });
  }

  const totalBalance = await calculateTotalBalance(user.id, user.currency);

  return c.json({
    totalBalance: totalBalance.totalBalance,
    wallets: res_wallets,
    userMainCurrency: user.currency,
  });
});

// still authenticated so this wont be abused
walletsRouter.get("/exchange-rate", authenticated, zValidator("query", z.object({
  from: z.string(),
  to: z.string(),
})), async (c) => {
  const { from, to } = c.req.valid("query");
  const res_exchange_rate = await getCurrentExchangeRate(from, to);
  return c.json(res_exchange_rate);
});

walletsRouter.get("/:id", authenticated, async (c) => {
  const { user } = await getUserData(c);
  const { id } = c.req.param();
  const res_wallet = await db.query.wallets.findFirst({
    where: and(
      eq(wallets.userId, user.id),
      eq(wallets.id, id),
    ),
  });
  return c.json(res_wallet);
});

walletsRouter.post("/", authenticated, zValidator(
  "json",
  z.object({
    name: z.string(),
    currency: z.string(),
    isSavingAccount: z.boolean().optional(),
    savingAccountGoal: z.number().optional(),
    balance: z.number().optional(),
  }),
), async (c) => {
  const { user } = await getUserData(c);

  const wallet = await db.transaction(async (tx) => {
    const { name, currency, isSavingAccount, balance, savingAccountGoal } = c.req.valid("json");
    const wallet = await tx.insert(wallets).values({
      userId: user.id,
      name,
      currency,
      isSavingAccount: isSavingAccount ?? false,
      savingAccountGoal: savingAccountGoal ?? 0,
      balance: balance ?? 0,
    }).returning().execute().then((res) => res[0]);

    if (!wallet) {
      throw new Error("Failed to create wallet");
    }

    if (balance && balance !== 0) {
      await tx.insert(transactions).values({
        userId: user.id,
        walletId: wallet.id,
        amount: balance,
        type: "adjustment",
        transaction_date: new Date(),
        description: "Initial balance", // TODO: improve this. maybe distinguish initials more
        category: "Initial Balance",
      }).execute();
    }
    return wallet;
  });
  return c.json(wallet);
});

walletsRouter.post("/:id", authenticated, zValidator(
  "json",
  z.object({
    name: z.string(),
    currency: z.string(),
  }),
), async (c) => {
  const { user } = await getUserData(c);

  const wallet = await db.transaction(async (tx) => {
    const { id } = c.req.param();
  
    const { name, currency } = c.req.valid("json");
    
    const wallet = await tx.update(wallets).set({
      name,
      currency,
    }).where(and(
      eq(wallets.userId, user.id),
      eq(wallets.id, id),
    )).returning().execute().then((res) => res[0]);

    if (!wallet) {
      throw new Error("Failed to update wallet");
    }

    return wallet;
  });
  return c.json(wallet);
});

walletsRouter.delete("/:id", authenticated, async (c) => {
  const { user } = await getUserData(c);
  const { id } = c.req.param();
  await db.delete(wallets).where(and(
    eq(wallets.userId, user.id),
    eq(wallets.id, id),
  )).execute();
  return c.json({ message: "Wallet deleted successfully" });
});

export default walletsRouter;