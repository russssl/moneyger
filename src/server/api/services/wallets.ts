import { db } from "@/server/db";
import { type Transaction, transactions as transactionsSchema} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { type NewWallet, type Wallet } from "@/server/db/wallet";
export async function calculateWalletBalance(walletId: string) {
  const transactions: Transaction[] = await db.query.transactions.findMany({
    where: eq(transactionsSchema.walletId, walletId),
  });

  const balance = transactions.reduce((acc, transaction) => {
    if (!transaction.amount) return acc;
    return acc + transaction.amount;
  }, 0);

  return balance;
}

export async function getFormattedWallets(wallets: Wallet[] | NewWallet[]) {
  return await Promise.all(wallets.map(async (wallet: Wallet | NewWallet) => {
    if (!wallet.id) {
      throw new Error("Wallet ID is required");
    }
    const balance = await calculateWalletBalance(wallet.id);
    return {
      ...wallet,
      balance,
      type: "wallet",
    };
  }));
}