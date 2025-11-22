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
import { HTTPException } from "hono/http-exception";

const walletsRouter = new Hono<AuthVariables>();

walletsRouter.get("/", authenticated, async (c) => {
  const { user } = await getUserData(c);
  const res_wallets = await db.query.wallets.findMany({
    where: eq(wallets.userId, user.id),
    orderBy: (wallets, { asc }) => [asc(wallets.name)],
  });
  return c.json(res_wallets);
});

walletsRouter.get("/full", authenticated, async (c) => {
  const { user } = await getUserData(c);

  if (!user.currency) {
    // user still doesn't have a currency, return empty data
    return c.json({
      totalBalance: 0,
      wallets: [],
      userMainCurrency: null,
      savingsStats: null,
    });
  }

  const { totalBalance, wallets } = await calculateTotalBalance(user.id, user.currency);

  // Calculate savings stats with currency conversion
  const savingsWallets = wallets.filter(w => w.isSavingAccount);
  let savingsStats = null;
  
  if (savingsWallets.length > 0) {
    // Get savings-only total balance (already converted)
    const { totalBalance: savingsTotalBalance } = await calculateTotalBalance(user.id, user.currency, null, null, true);
    
    // Calculate amount left to goal with currency conversion
    let amountLeftToGoal = 0;
    for (const wallet of savingsWallets) {
      if (wallet.savingAccountGoal && wallet.savingAccountGoal > 0) {
        const exchangeRateData = await getCurrentExchangeRate(wallet.currency, user.currency);
        const goalInMainCurrency = wallet.savingAccountGoal * exchangeRateData.rate;
        const balanceInMainCurrency = wallet.balance * exchangeRateData.rate;
        const remaining = Math.max(goalInMainCurrency - balanceInMainCurrency, 0);
        amountLeftToGoal += remaining;
      }
    }
    
    const totalGoal = savingsTotalBalance + amountLeftToGoal;
    const progress = totalGoal > 0 ? Math.min((savingsTotalBalance / totalGoal) * 100, 100) : 0;
    
    savingsStats = {
      totalSavings: savingsTotalBalance,
      totalGoal,
      progress,
      amountLeftToGoal: Number(amountLeftToGoal.toFixed(2)),
    };
  }

  return c.json({
    totalBalance: totalBalance,
    wallets: wallets.slice(0, 5), // TODO: improve this, add pagination for full page, also leaving for now since db limit is not applicable since we still need all wallets for total balance calculation
    userMainCurrency: user.currency,
    savingsStats,
  });
});

// still authenticated so this wont be abused
walletsRouter.get("/exchange-rate", authenticated, zValidator("query", z.object({
  from: z.string(),
  to: z.string(),
})), async (c) => {
  const { from, to } = c.req.valid("query");
  const res_exchange_rate = await getCurrentExchangeRate(from, to);
  return c.json({
    rate: res_exchange_rate.rate.toFixed(2),
    timestamp: res_exchange_rate.timestamp,
    isStale: res_exchange_rate.isStale,
  });
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
    iconName: z.string().optional(),
  }),
), async (c) => {
  const { user } = await getUserData(c);

  const wallet = await db.transaction(async (tx) => {
    const { name, currency, isSavingAccount, balance, savingAccountGoal, iconName } = c.req.valid("json");
    const wallet = await tx.insert(wallets).values({
      userId: user.id,
      name,
      currency,
      isSavingAccount: isSavingAccount ?? false,
      savingAccountGoal: savingAccountGoal ?? 0,
      balance: balance ?? 0,
      iconName: iconName ?? undefined,
    }).returning().execute().then((res) => res[0]);

    if (!wallet) {
      throw new HTTPException(500, { message: "We couldn't create your wallet. Please try again." });
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
    isSavingAccount: z.boolean().optional(),
    savingAccountGoal: z.number().optional(),
    iconName: z.string().optional(),
  }),
), async (c) => {
  const { user } = await getUserData(c);

  const wallet = await db.transaction(async (tx) => {
    const { id } = c.req.param();
  
    const { name, currency, isSavingAccount, savingAccountGoal, iconName } = c.req.valid("json");
    
    const wallet = await tx.update(wallets).set({
      name,
      currency,
      ...(isSavingAccount !== undefined && { isSavingAccount }),
      ...(savingAccountGoal !== undefined && { savingAccountGoal: savingAccountGoal ?? 0 }),
      ...(iconName !== undefined && { iconName: iconName ?? undefined }),
    }).where(and(
      eq(wallets.userId, user.id),
      eq(wallets.id, id),
    )).returning().execute().then((res) => res[0]);

    if (!wallet) {
      throw new HTTPException(404, { message: "We couldn't find that wallet." });
    }

    return wallet;
  });
  return c.json(wallet);
});

walletsRouter.delete("/:id", authenticated, async (c) => {
  const { user } = await getUserData(c);
  const { id } = c.req.param();
  const deletedWallets = await db.delete(wallets).where(and(
    eq(wallets.userId, user.id),
    eq(wallets.id, id),
  )).returning({ id: wallets.id }).execute();

  if (!deletedWallets.length) {
    throw new HTTPException(404, { message: "We couldn't find that wallet." });
  }

  return c.json({ message: "Wallet deleted successfully" });
});

export default walletsRouter;