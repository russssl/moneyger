import { db } from '../db';
import { type InsertWallet, type SelectWallet, wallets } from '../db/wallet';
import { and, eq } from 'drizzle-orm/expressions';
import { authenticate } from '../services/userService';

export async function getWallets(): Promise<SelectWallet[]> {
  const authenticatedUser = await authenticate();
  const walletsData = await db.query.wallets.findMany({
    where: eq(wallets.userId, authenticatedUser.id),
  });
  return walletsData;
}

export async function getWalletById(id: string) {
  const authenticatedUser = await authenticate();

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.id, id),
  });
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  if (wallet.userId !== authenticatedUser.id) {
    throw new Error('Unauthorized');
  }
  return wallet;
}

export async function insertWallet(wallet: InsertWallet) {
  const authenticatedUser = await authenticate();
  return await db.insert(wallets).values({
    ...wallet,
    userId: authenticatedUser.id,
  }).returning();
}

export async function updateWallet(id: string, wallet: InsertWallet) {
  const authenticatedUser = await authenticate();
  const walletToUpdate = await db.query.wallets.findFirst({
    where: and(
      eq(wallets.id, id),
      eq(wallets.userId, authenticatedUser.id)
    )
  });

  if (!walletToUpdate) {
    throw new Error('Wallet not found');
  }
  if (wallet.userId !== authenticatedUser.id) {
    throw new Error('Unauthorized');
  }

  const updatedWallet = await db.update(wallets).set({
    ...wallet,
  }).where(
    eq(wallets.id, id)
  ).returning();
  return updatedWallet;
}

export async function deleteWallet(id: string) {
  const authenticatedUser = await authenticate();
  const walletToDelete = await db.query.wallets.findFirst({
    where: eq(wallets.id, id),
  });

  if (!walletToDelete) {
    throw new Error('Wallet not found');
  }

  if (walletToDelete.userId !== authenticatedUser.id) {
    throw new Error('Unauthorized');
  }
  const deletedWallet = await db.delete(wallets)
    .where(
      eq(wallets.id, id),
    ).returning();
  return deletedWallet;
}