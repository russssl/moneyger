import { Hono } from "hono";
import { type AuthVariables } from "../authenticate";
import { authenticated, getUserData } from "../authenticate";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, ilike, inArray, not, sql } from "drizzle-orm";
import db from "@/server/db";
import { type NewTransaction, transactions } from "@/server/db/transaction";
import {  wallets } from "@/server/db/wallet";
import { categories } from "@/server/db/category";
import { getCurrentExchangeRate } from "../services/wallets";
import { type NewTransfer, transfers } from "@/server/db/transfer";
import { HTTPException } from "hono/http-exception";

const transactionsRouter = new Hono<AuthVariables>();

transactionsRouter.get("/", authenticated, zValidator("query", z.object({
  walletId: z.string().optional(),
  transaction_date: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
  offset: z.coerce.number().min(0).optional(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { walletId, transaction_date, description, type: typeFilter, limit, offset } = c.req.valid("query");

  const pagination = {
    limit: limit ?? 100,
    offset: offset ?? 0,
  };

  const escapedDescription = description?.trim().replace(/[%_\\]/g, "\\$&");
  const where = and(
    eq(transactions.userId, user.id),
    walletId ? eq(transactions.walletId, walletId) : undefined,
    transaction_date ? eq(transactions.transaction_date, new Date(transaction_date)) : undefined,
    escapedDescription ? ilike(transactions.description, `%${escapedDescription}%`) : undefined,
    typeFilter ? eq(transactions.type, typeFilter) : undefined,
    not(eq(transactions.type, "adjustment")),
  );

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(${transactions.id}) as int)` })
    .from(transactions)
    .where(where);

  const transactionsData = await db.query.transactions.findMany({
    where,
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
      transfers: {
        columns: {
          id: true,
        },
        with: {
          fromWallet: {
            columns: {
              name: true,
            },
          },
          toWallet: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
    ...pagination,
    orderBy: (transactions, { desc }) => [desc(transactions.transaction_date)],
  });

  return c.json({
    items: transactionsData,
    total: countResult?.count ?? 0,
    limit: pagination.limit,
    offset: pagination.offset,
  });
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
  amount: z.number().positive("Amount must be positive").finite(),
  transaction_date: z.coerce.date().refine((d) => !isNaN(d.getTime()), { message: "Invalid date" }),
  description: z.string().max(255),
  categoryId: z.string().optional(),
  type: z.enum(["income", "expense", "transfer"]),
}).superRefine((data, ctx) => {
  if (data.type === "transfer" && !data.toWalletId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["toWalletId"], message: "Destination wallet required for transfers" });
  }
  if (data.type !== "transfer" && data.toWalletId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["toWalletId"], message: "Destination wallet only for transfers" });
  }
  if (data.type !== "transfer" && !data.categoryId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["categoryId"], message: "Category required for income/expense" });
  }
  if (data.type === "transfer" && data.walletId === data.toWalletId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["toWalletId"], message: "Source and destination must differ" });
  }
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

    if (type !== "transfer" && categoryId) {
      const cat = await tx.query.categories.findFirst({
        where: and(eq(categories.id, categoryId), eq(categories.createdBy, user.id)),
      });
      if (!cat) throw new HTTPException(400, { message: "Invalid category" });
      if (cat.type !== type) throw new HTTPException(400, { message: `Category type mismatch: expected ${type}` });
    } else if (type !== "transfer" && !categoryId) {
      throw new HTTPException(400, { message: "Category required" });
    }

    const transactionValues = {
      userId: user.id,
      walletId,
      amount: String(amount),
      transaction_date,
      description,
      type,
      ...(categoryId ? { categoryId } : { categoryId: null }),
    };
    const transaction = await tx.insert(transactions).values(transactionValues).returning().execute().then((res) => res[0]);
  
    if (!transaction) {
      throw new HTTPException(500, { message: "We couldn't save your transaction. Please try again." });
    }


    if (type !== "transfer") {
      const balance = type === "income" ? Number(wallet.balance) + amount : Number(wallet.balance) - amount; 
      await tx.update(wallets).set({
        balance: String(balance),
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
      amountSent: String(amount),
      amountReceived: String(amount),
      exchangeRate: "1",
    }
    if (wallet.currency === destinationWallet.currency) {
      newSourceBalance = Number(wallet.balance) - amount;
      newDestinationBalance = Number(destinationWallet.balance) + amount;
      
      transfer.exchangeRate = "1";
      transfer.amountReceived = String(amount);
      transfer.amountSent = String(amount);
    } else {
      const exchangeRateData = await getCurrentExchangeRate(wallet.currency, destinationWallet.currency);
      newSourceBalance = Number(wallet.balance) - amount;
      newDestinationBalance = Number(destinationWallet.balance) + amount * exchangeRateData.rate;

      transfer.exchangeRate = String(exchangeRateData.rate);
      transfer.amountReceived = String(amount * exchangeRateData.rate);
      transfer.amountSent = String(amount);
    }

    await Promise.all([
      tx.update(wallets).set({
        balance: String(newSourceBalance),
      }).where(and(
        eq(wallets.id, walletId),
        eq(wallets.userId, user.id),
      )).execute(),
      tx.update(wallets).set({
        balance: String(newDestinationBalance),
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
  amount: z.number().positive("Amount must be positive").finite(),
  transaction_date: z.coerce.date().refine((d) => !isNaN(d.getTime()), { message: "Invalid date" }),
  description: z.string().max(255),
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
    if (transaction.type === "transfer" && categoryId !== undefined) {
      throw new HTTPException(400, { message: "Cannot change category for transfers" });
    }
    if (transaction.type !== "transfer" && categoryId !== undefined && categoryId) {
      const cat = await tx.query.categories.findFirst({
        where: and(eq(categories.id, categoryId), eq(categories.createdBy, user.id)),
      });
      if (!cat) throw new HTTPException(400, { message: "Invalid category" });
      if (cat.type !== transaction.type) throw new HTTPException(400, { message: `Category type mismatch: expected ${transaction.type}` });
    }
    
    const updateValues: Partial<NewTransaction> = {
      amount: String(amount),
      transaction_date,
      description,
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
    };
    const updatedTransaction = await tx.update(transactions).set(updateValues).where(and(
      eq(transactions.id, id),
      eq(transactions.userId, user.id),
    )).returning().execute().then((res) => res[0]);

    if (!updatedTransaction) {
      throw new HTTPException(500, { message: "We couldn't update this transaction. Please try again." });
    }


    if (updatedTransaction.type !== "transfer") {
      const wallet = await tx.query.wallets.findFirst({
        where: and(
          eq(wallets.id, transaction.walletId),
          eq(wallets.userId, user.id),
        ),
      });
      if (!wallet) {
        throw new HTTPException(404, { message: "We couldn't find that wallet." });
      }

      const oldAmount = Number(transaction.amount);
      const delta = amount - oldAmount;
      const balanceAdjustment = updatedTransaction.type === "income" || updatedTransaction.type === "adjustment"
        ? delta
        : updatedTransaction.type === "expense"
          ? -delta
          : 0;
      if (updatedTransaction.type !== "income" && updatedTransaction.type !== "expense" && updatedTransaction.type !== "adjustment") {
        throw new HTTPException(400, { message: "Invalid transaction type." });
      }

      await tx.update(wallets).set({
        balance: String(Number(wallet.balance) + balanceAdjustment),
      }).where(and(
        eq(wallets.id, transaction.walletId),
        eq(wallets.userId, user.id),
      )).execute();
    } else if (updatedTransaction.type === "transfer") {

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

      const transferWallets = await tx.query.wallets.findMany({
        where: and(
          inArray(wallets.id, [transfer.fromWalletId, transfer.toWalletId]),
          eq(wallets.userId, user.id),
        ),
      });
      const fromWallet = transferWallets.find((w) => w.id === transfer.fromWalletId);
      const toWallet = transferWallets.find((w) => w.id === transfer.toWalletId);
      if (!fromWallet || !toWallet) {
        throw new HTTPException(404, { message: "We couldn't find that wallet." });
      }

      // Revert old transfer, then apply new amount with current exchange rate
      const interimFromBalance = Number(fromWallet.balance) + Number(transfer.amountSent);
      const interimToBalance = Number(toWallet.balance) - Number(transfer.amountReceived);

      let newExchangeRate = "1";
      let newAmountReceived = String(amount);
      const newAmountSent = String(amount);
      if (fromWallet.currency !== toWallet.currency) {
        const exchangeRateData = await getCurrentExchangeRate(fromWallet.currency, toWallet.currency);
        newExchangeRate = String(exchangeRateData.rate);
        newAmountReceived = String(amount * exchangeRateData.rate);
      }

      const finalFromBalance = interimFromBalance - Number(newAmountSent);
      const finalToBalance = interimToBalance + Number(newAmountReceived);

      await Promise.all([
        tx.update(wallets).set({
          balance: String(finalFromBalance),
        }).where(and(eq(wallets.id, transfer.fromWalletId), eq(wallets.userId, user.id))).execute(),
        tx.update(wallets).set({
          balance: String(finalToBalance),
        }).where(and(eq(wallets.id, transfer.toWalletId), eq(wallets.userId, user.id))).execute(),
        tx.update(transfers).set({
          amountSent: newAmountSent,
          amountReceived: newAmountReceived,
          exchangeRate: newExchangeRate,
        }).where(and(eq(transfers.transactionId, transaction.id), eq(transfers.userId, user.id))).execute(),
      ]);

    } else {
      throw new HTTPException(400, { message: "Invalid transaction type." });
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

      const balance = transaction.type === "income" ? Number(wallet.balance) - Number(transaction.amount) : Number(wallet.balance) + Number(transaction.amount);
      await tx.update(wallets).set({
        balance: String(balance),
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

    const sourceBalance = Number(wallet.balance) + Number(transfer.amountSent);
    const destinationBalance = Number(destinationWallet.balance) - Number(transfer.amountReceived);

    await Promise.all([
      tx.update(wallets).set({
        balance: String(sourceBalance),
      }).where(and(
        eq(wallets.id, transaction.walletId),
        eq(wallets.userId, user.id),
      )).execute(),
      tx.update(wallets).set({
        balance: String(destinationBalance),
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