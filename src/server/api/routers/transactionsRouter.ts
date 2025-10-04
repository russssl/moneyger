import { Hono } from "hono";
import { type AuthVariables } from "../authenticate";
import { authenticated, getUserData } from "../authenticate";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, not } from "drizzle-orm";
import db from "@/server/db";
import { transactions } from "@/server/db/transaction";
import {  wallets } from "@/server/db/wallet";
import { getCurrentExchangeRate } from "../services/wallets";

const transactionsRouter = new Hono<AuthVariables>();

transactionsRouter.get("/", authenticated, zValidator("query", z.object({
  walletId: z.string().optional(),
  transaction_date: z.string().optional(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { walletId, transaction_date } = c.req.valid("query");

  const transactionsData = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, user.id),
      walletId ? eq(transactions.walletId, walletId) : undefined,
      transaction_date ? eq(transactions.transaction_date, new Date(transaction_date)) : undefined,
      not(eq(transactions.type, "adjustment")),
    ),
    with: {
      wallet: {
        columns: {
          name: true,
          currency: true,
        },
      },
    },
    orderBy: (transactions, { desc }) => [desc(transactions.transaction_date)],
  });

  return c.json(transactionsData);
})

transactionsRouter.get("/:id", authenticated, zValidator("param", z.object({
  id: z.string(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { id } = c.req.valid("param");
  const transactionData = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.userId, user.id),
      eq(transactions.id, id),
      not(eq(transactions.type, "adjustment")),
    ),
  });

  if (!transactionData) {
    throw new Error("Transaction not found");
  }

  return c.json(transactionData);
});

transactionsRouter.post("/", authenticated, zValidator("json", z.object({
  walletId: z.string(),
  toWalletId: z.string().optional(),
  amount: z.number(),
  transaction_date: z.coerce.date(),
  description: z.string(),
  category: z.string(),
  type: z.string(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { walletId, toWalletId, amount, transaction_date, description, category, type } = c.req.valid("json");

  const transactionData = await db.transaction(async (tx) => {

    const wallet = await tx.query.wallets.findFirst({
      where: and(
        eq(wallets.id, walletId),
        eq(wallets.userId, user.id),
      ),
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const transaction = await tx.insert(transactions).values({
      userId: user.id,
      walletId,
      fromWalletId: toWalletId, // if type is transfer, then fromWalletId is the walletId of the wallet that was transferred from
      amount,
      transaction_date,
      description,
      category,
      type,
    }).returning().execute().then((res) => res[0]);

    if (!transaction) {
      throw new Error("Transaction not created");
    }


    if (type !== "transfer") {
      const balance = type === "income" ? wallet.balance + amount : wallet.balance - amount; 
      await tx.update(wallets).set({
        balance,
      }).where(and(
        eq(wallets.id, walletId),
        eq(wallets.userId, user.id),
      )).execute();
    } else {
      if (!toWalletId) {
        throw new Error("To wallet ID is required");
      }
      const [sourceWallet, destinationWallet] = await Promise.all([
        tx.query.wallets.findFirst({
          where: and(
            eq(wallets.id, walletId),
            eq(wallets.userId, user.id),
          ),
        }),
        tx.query.wallets.findFirst({
          where: and(
            eq(wallets.id, toWalletId),
            eq(wallets.userId, user.id),
          ),
        }),
      ]);

      if (!sourceWallet?.currency || !destinationWallet?.currency) {
        throw new Error("Source or destination wallet not found");
      }

      let newSourceBalance, newDestinationBalance;
      if (sourceWallet.currency === destinationWallet.currency) {
        newSourceBalance = sourceWallet.balance - amount;
        newDestinationBalance = destinationWallet.balance + amount;
      } else {
        const exchangeRate = await getCurrentExchangeRate(sourceWallet.currency, destinationWallet.currency);
        newSourceBalance = sourceWallet.balance - amount;
        newDestinationBalance = destinationWallet.balance + amount * exchangeRate;
      }
      await Promise.all([
        tx.update(wallets).set({
          balance: newSourceBalance,
        }).where(and(
          eq(wallets.id, walletId),
          eq(wallets.userId, user.id),
        )).execute(),
        tx.update(wallets).set({
          balance: newDestinationBalance,
        }).where(and(
          eq(wallets.id, toWalletId),
          eq(wallets.userId, user.id),
        )).execute(),
      ]);
    }

    return transaction;
  });
  return c.json(transactionData);
});

transactionsRouter.post("/:id", authenticated, zValidator("param", z.object({
  id: z.string(),
})), zValidator("json", z.object({
  amount: z.number(),
  transaction_date: z.coerce.date(),
  description: z.string(),
  category: z.string(),
})),
async (c) => {
  const { user } = await getUserData(c);
  const { id } = c.req.valid("param");
  const { amount, transaction_date, description, category } = c.req.valid("json");
  
  const transactionData = await db.transaction(async (tx) => {
    const transaction = await tx.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        eq(transactions.userId, user.id),
      ),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const updatedTransaction = await tx.update(transactions).set({
      amount,
      transaction_date,
      description,
      category,
    }).where(and(
      eq(transactions.id, id),
      eq(transactions.userId, user.id),
    )).returning().execute().then((res) => res[0]);

    if (!updatedTransaction) {
      throw new Error("Transaction not updated");
    }

    return updatedTransaction;
  });

  if (!transactionData) {
    throw new Error("Transaction not found");
  }

  return c.json(transactionData);
});

transactionsRouter.delete("/:id", authenticated, zValidator("param", z.object({
  id: z.string(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { id } = c.req.valid("param");

  const transactionData = await db.transaction(async (tx) => {
    const params = c.req.param();
    const transaction = await tx.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        eq(transactions.userId, user.id),
      ),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const wallet = await tx.query.wallets.findFirst({
      where: and(
        eq(wallets.id, transaction.walletId),
        eq(wallets.userId, user.id),
      ),
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (transaction.type !== "transfer") {
      const balance = transaction.type === "income" ? wallet.balance - transaction.amount : wallet.balance + transaction.amount;
      await tx.update(wallets).set({
        balance,
      }).where(and(
        eq(wallets.id, transaction.walletId),
        eq(wallets.userId, user.id),
      )).execute();
    } else {
      const transactionWallet = await tx.query.wallets.findFirst({
        where: and(
          eq(wallets.id, transaction.walletId),
          eq(wallets.userId, user.id),
        ),
      });
      if (!transactionWallet) {
        throw new Error("Transaction wallet not found");
      }
      const balance = transactionWallet.balance - transaction.amount;
  
      await tx.update(wallets).set({
        balance,
      }).where(and(
        eq(wallets.id, transaction.walletId),
        eq(wallets.userId, user.id),
      )).execute();

      if (transactionWallet.currency != wallet.currency) {
        if (!transaction.fromWalletId) {
          throw new Error("From wallet ID is required");
        }
        const exchangeRate = await getCurrentExchangeRate(transactionWallet.currency, wallet.currency);
        const amount = transaction.amount * exchangeRate;
        await tx.update(wallets).set({
          balance: wallet.balance + amount,
        }).where(and(
          eq(wallets.id, transaction.fromWalletId),
          eq(wallets.userId, user.id),
        )).execute();

        // MAYBE: add the reversed transaction (something like "Automatic transfer after transaction deletion")
      }
    }

    await tx.delete(transactions).where(and(
      eq(transactions.id, id),
      eq(transactions.userId, user.id),
    )).execute();
    return transaction;
  });

  if (!transactionData) {
    throw new Error("Transaction not found");
  }

  return c.json(transactionData);
});

export default transactionsRouter;