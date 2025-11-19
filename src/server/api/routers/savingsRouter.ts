import { Hono } from "hono";
import { type AuthVariables } from "../authenticate";
import { authenticated, getUserData } from "../authenticate";
import db from "@/server/db";
import { z } from "zod";
import { and, eq, not } from "drizzle-orm";
import { wallets } from "@/server/db/wallet";
import { transactions } from "@/server/db/transaction";
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

  // Calculate amountLeftToGoal with currency conversion
  let amountLeftToGoal = 0;
  for (const wallet of wallets) {
    if (wallet.savingAccountGoal && wallet.savingAccountGoal > 0) {
      const exchangeRateData = await getCurrentExchangeRate(wallet.currency, user.currency);
      const goalInMainCurrency = wallet.savingAccountGoal * exchangeRateData.rate;
      const balanceInMainCurrency = wallet.balance * exchangeRateData.rate;
      const remaining = Math.max(goalInMainCurrency - balanceInMainCurrency, 0);
      amountLeftToGoal += remaining;
    }
  }

  return c.json({
    wallets,
    totalBalance: totalBalance,
    amountLeftToGoal: Number(amountLeftToGoal.toFixed(2)),
    userMainCurrency: user.currency
  });
});

export default savingsRouter;