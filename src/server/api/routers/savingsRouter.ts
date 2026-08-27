import { Hono } from "hono";
import { type AuthVariables } from "../authenticate";
import { authenticated, getUserData } from "../authenticate";
// import db from "@/server/db";
// import { z } from "zod";
// import { and, eq, not } from "drizzle-orm";
// import { wallets } from "@/server/db/wallet";
// import { transactions } from "@/server/db/transaction";
import { calculateTotalBalance, getCurrentExchangeRate } from "../services/wallets";

const savingsRouter = new Hono<AuthVariables>();

savingsRouter.get("/", authenticated, async (c) => {
  const { user } = await getUserData(c);
  if (!user.currency) {
    return c.json({
      totalBalance: 0,
      wallets: [],
      userMainCurrency: null,
    });
  }

  const { wallets, totalBalance } = await calculateTotalBalance(user.id, user.currency, null, null, true);

  // Calculate amountLeftToGoal with currency conversion (parallel)
  const results = await Promise.all(wallets.map(async (wallet) => {
    if (!wallet.savingAccountGoal || Number(wallet.savingAccountGoal) <= 0) return 0;
    if (!wallet.currency) return 0;
    try {
      const exchangeRateData = await getCurrentExchangeRate(wallet.currency, user.currency!);
      const goalInMainCurrency = Number(wallet.savingAccountGoal) * exchangeRateData.rate;
      const balanceInMainCurrency = Number(wallet.balance) * exchangeRateData.rate;
      return Math.max(goalInMainCurrency - balanceInMainCurrency, 0);
    } catch {
      const goal = Number(wallet.savingAccountGoal);
      const bal = Number(wallet.balance);
      return Math.max(wallet.currency === user.currency ? goal - bal : 0, 0);
    }
  }));
  const amountLeftToGoal = results.reduce((acc, v) => acc + v, 0);

  return c.json({
    wallets,
    totalBalance: totalBalance,
    amountLeftToGoal: Number(amountLeftToGoal.toFixed(2)),
    userMainCurrency: user.currency
  });
});

export default savingsRouter;