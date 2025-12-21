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
import { type NewTransfer, transfers } from "@/server/db/transfer";
import { HTTPException } from "hono/http-exception";

const transactionsRouter = new Hono<AuthVariables>();

transactionsRouter.get("/", authenticated, zValidator("query", z.object({
  walletId: z.string().optional(),
  transaction_date: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { walletId, transaction_date, limit, offset } = c.req.valid("query");

  const pagination = {
    limit: limit ? limit : 5, // 5 for main page
    offset: offset ?? 0,
  }
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
      category: {
        columns: {
          id: true,
          name: true,
          iconName: true,
          type: true,
        },
      },
    },
    ...pagination,
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
    throw new HTTPException(404, { message: "We couldn't find that transaction." });
  }

  return c.json(transactionData);
});

transactionsRouter.post("/", authenticated, zValidator("json", z.object({
  walletId: z.string(),
  toWalletId: z.string().optional(),
  amount: z.number(),
  transaction_date: z.coerce.date(),
  description: z.string(),
  categoryId: z.string(),
  type: z.string(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { walletId, toWalletId, amount, transaction_date, description, categoryId, type } = c.req.valid("json");

  const transactionData = await db.transaction(async (tx) => {

    const wallet = await tx.query.wallets.findFirst({
      where: and(
        eq(wallets.id, walletId),
        eq(wallets.userId, user.id),
      ),
    });

    if (!wallet) {
      throw new HTTPException(404, { message: "We couldn't find that wallet." });
    }

    const transactionValues = {
      userId: user.id,
      walletId,
      amount,
      transaction_date,
      description,
      type,
      categoryId,
    };
    const transaction = await tx.insert(transactions).values(transactionValues).returning().execute().then((res) => res[0]);
  
    if (!transaction) {
      throw new HTTPException(500, { message: "We couldn't save your transaction. Please try again." });
    }


    if (type !== "transfer") {
      const balance = type === "income" ? wallet.balance + amount : wallet.balance - amount; 
      await tx.update(wallets).set({
        balance,
      }).where(and(
        eq(wallets.id, walletId),
        eq(wallets.userId, user.id),
      )).execute();
      return transaction;
    }
    
    if (!toWalletId) {
      throw new HTTPException(400, { message: "Select a destination wallet to create a transfer." });
    }

    const destinationWallet = await tx.query.wallets.findFirst({
      where: and(
        eq(wallets.id, toWalletId),
        eq(wallets.userId, user.id),
      ),
    });

    if (!wallet?.currency || !destinationWallet?.currency) {
      throw new HTTPException(404, { message: "We couldn't find one of the wallets needed for this transfer." });
    }

    let newSourceBalance, newDestinationBalance;

    const transfer: NewTransfer = {
      userId: user.id,
      transactionId: transaction.id,
      fromWalletId: walletId,
      toWalletId: toWalletId,
      amountSent: amount,
      amountReceived: amount,
      exchangeRate: 1,
    }
    if (wallet.currency === destinationWallet.currency) {
      newSourceBalance = wallet.balance - amount;
      newDestinationBalance = destinationWallet.balance + amount;
      
      transfer.exchangeRate = 1;
      transfer.amountReceived = amount;
      transfer.amountSent = amount;
    } else {
      const exchangeRateData = await getCurrentExchangeRate(wallet.currency, destinationWallet.currency);
      newSourceBalance = wallet.balance - amount;
      newDestinationBalance = destinationWallet.balance + amount * exchangeRateData.rate;
      
      transfer.exchangeRate = exchangeRateData.rate;
      transfer.amountReceived = amount * exchangeRateData.rate;
      transfer.amountSent = amount;
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
      tx.insert(transfers).values(transfer).execute(),
    ]);

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
  categoryId: z.string().optional(),
})),
async (c) => {
  const { user } = await getUserData(c);
  const { id } = c.req.valid("param");
  const { amount, transaction_date, description, categoryId } = c.req.valid("json");
  
  const transactionData = await db.transaction(async (tx) => {
    const transaction = await tx.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        eq(transactions.userId, user.id),
      ),
    });

    if (!transaction) {
      throw new HTTPException(404, { message: "We couldn't find that transaction." });
    }

    const updateValues = {
      amount,
      transaction_date,
      description,
      ...(categoryId !== undefined && { categoryId: categoryId || undefined }),
    };
    const updatedTransaction = await tx.update(transactions).set(updateValues as Partial<typeof transactions.$inferInsert>).where(and(
      eq(transactions.id, id),
      eq(transactions.userId, user.id),
    )).returning().execute().then((res) => res[0]);

    if (!updatedTransaction) {
      throw new HTTPException(500, { message: "We couldn't update this transaction. Please try again." });
    }

    return updatedTransaction;
  });

  if (!transactionData) {
    throw new HTTPException(404, { message: "We couldn't find that transaction." });
  }

  return c.json(transactionData);
});

transactionsRouter.delete("/:id", authenticated, zValidator("param", z.object({
  id: z.string(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { id } = c.req.valid("param");

  const transaction = await db.transaction(async (tx) => {
    const transaction = await tx.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        eq(transactions.userId, user.id),
      ),
    });

    if (!transaction) {
      throw new HTTPException(404, { message: "We couldn't find that transaction." });
    }

    const wallet = await tx.query.wallets.findFirst({
      where: and(
        eq(wallets.id, transaction.walletId),
        eq(wallets.userId, user.id),
      ),
    });
  
    if (!wallet) {
      throw new HTTPException(404, { message: "We couldn't find that wallet." });
    }

    if (transaction.type !== "transfer") {

      const balance = transaction.type === "income" ? wallet.balance - transaction.amount : wallet.balance + transaction.amount;
      await tx.update(wallets).set({
        balance,
      }).where(and(
        eq(wallets.id, transaction.walletId),
        eq(wallets.userId, user.id),
      )).execute();

      // delete transaction
      await tx.delete(transactions).where(eq(transactions.id, transaction.id)).execute();

      return transaction;
    }

    const transfer = await tx.query.transfers.findFirst({
      where: and(
        eq(transfers.transactionId, transaction.id),
        eq(transfers.fromWalletId, transaction.walletId),
        eq(transfers.userId, user.id),
      ),
    });

    if (!transfer) {
      throw new HTTPException(404, { message: "We couldn't find that transfer." });
    }

    const destinationWallet = await tx.query.wallets.findFirst({
      where: and(
        eq(wallets.id, transfer.toWalletId),
        eq(wallets.userId, user.id),
      ),
    });
  
    if (!destinationWallet) {
      throw new HTTPException(404, { message: "We couldn't find the destination wallet for this transfer." });
    }

    const sourceBalance = wallet.balance + transfer.amountSent;
    const destinationBalance = destinationWallet.balance - transfer.amountReceived;

    await Promise.all([
      tx.update(wallets).set({
        balance: sourceBalance,
      }).where(and(
        eq(wallets.id, transaction.walletId),
        eq(wallets.userId, user.id),
      )).execute(),
      tx.update(wallets).set({
        balance: destinationBalance,
      }).where(and(
        eq(wallets.id, transfer.toWalletId),
        eq(wallets.userId, user.id),
      )).execute(),
      tx.delete(transfers).where(and(
        eq(transfers.transactionId, transaction.id),
        eq(transfers.userId, user.id),
      )).execute(),
      tx.delete(transactions).where(and(
        eq(transactions.id, transaction.id),
        eq(transactions.userId, user.id),
      )).execute(),
    ]);

    return transaction;
  });
  return c.json(transaction);
});

export default transactionsRouter;