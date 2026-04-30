import { user, wallets, transactions, transfers, categories } from "../db/schema";
import db from "../db";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { execSync } from "child_process";

// Helper for running shell commands
const runCommand = (command: string) => {
  try {
    // stdio: 'inherit' prints the command output to your console in real-time
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    throw error;
  }
};

async function seedDemoUser() {
  console.log("🚀 Starting seeding process...");

  const SEED_WALLETS = Number(process.env.SEED_WALLETS ?? 250);
  const SEED_TRANSACTIONS = Number(process.env.SEED_TRANSACTIONS ?? 1_000_000);
  const SEED_TRANSFERS = Number(process.env.SEED_TRANSFERS ?? 25_000);
  const INSERT_BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE ?? 5_000);
  const DAYS_SPREAD = Number(process.env.SEED_DAYS_SPREAD ?? 365 * 3);
  const MAX_TX_PER_WALLET = Number(process.env.SEED_MAX_TX_PER_WALLET ?? 25_000);

  // 1. Reset Docker
  console.log("♻️  Resetting Docker...");
  runCommand("docker compose down -v");
  runCommand("docker compose -f docker-compose.dev.yml up -d");

  // 2. Wait for Postgres to initialize
  console.log("⏳ Waiting 5 seconds for Postgres to initialize...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // 3. Migrate database
  console.log("🛠  Migrating database...");
  runCommand("bun run db:migrate");
  console.log("✅ Database migrated.");

  let demoUser = await db
    .select()
    .from(user)
    .where(eq(user.email, "demo@demo.com"))
    .then((res) => res[0]);

  if (!demoUser) {
    console.log("👤 Creating 'demo@demo.com'...");
    const authResponse = await auth.api.signUpEmail({
      body: {
        email: "demo@demo.com",
        password: "Tr0ub4dor&3-Correct-Horse-Battery-Staple",
        name: "Demo User",
      },
    });

    if (!authResponse) {
      console.error("❌ Failed to create user via Better Auth");
      return;
    }

    // Re-fetch to ensure we have the DB record
    demoUser = await db
      .select()
      .from(user)
      .where(eq(user.email, "demo@demo.com"))
      .then((res) => res[0]);
  }

  if (!demoUser) {
    console.error("❌ Error: Demo user could not be found or created.");
    return;
  }

  // Ensure currency is USD
  console.log("💲 Setting currency to USD...");
  await db
    .update(user)
    .set({ currency: "USD" })
    .where(eq(user.email, "demo@demo.com"));

  // --- 5. Prepare seed data ---
  const availableCurrencies = ["USD", "EUR", "GBP", "JPY", "PLN"] as const;

  console.log("🧠 Preparing categories...");

  const categoriesData: typeof categories.$inferInsert[] = [
    { name: "Salary", type: "income", iconName: "banknote", createdBy: demoUser.id },
    { name: "Investment", type: "income", iconName: "trending-up", createdBy: demoUser.id },
    { name: "Gifts", type: "income", iconName: "gift", createdBy: demoUser.id },
    { name: "Bonus", type: "income", iconName: "sparkles", createdBy: demoUser.id },
    { name: "Side Hustle", type: "income", iconName: "briefcase", createdBy: demoUser.id },
    { name: "Groceries", type: "expense", iconName: "shopping-cart", createdBy: demoUser.id },
    { name: "Housing", type: "expense", iconName: "home", createdBy: demoUser.id },
    { name: "Transport", type: "expense", iconName: "car", createdBy: demoUser.id },
    { name: "Entertainment", type: "expense", iconName: "gamepad-2", createdBy: demoUser.id },
    { name: "Health", type: "expense", iconName: "heart-pulse", createdBy: demoUser.id },
    { name: "Shopping", type: "expense", iconName: "shopping-bag", createdBy: demoUser.id },
    { name: "Dining", type: "expense", iconName: "utensils", createdBy: demoUser.id },
    { name: "Subscriptions", type: "expense", iconName: "receipt", createdBy: demoUser.id },
    { name: "Travel", type: "expense", iconName: "plane", createdBy: demoUser.id },
    { name: "Education", type: "expense", iconName: "graduation-cap", createdBy: demoUser.id },
  ];
  console.log("💾 Inserting categories...");
  const insertedCategories = await db.insert(categories).values(categoriesData).returning();
  const incomeCategories = insertedCategories.filter((c) => c.type === "income");
  const expenseCategories = insertedCategories.filter((c) => c.type === "expense");

  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;
  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  console.log(`💼 Generating ${SEED_WALLETS} wallets...`);
  const walletsToInsert: typeof wallets.$inferInsert[] = [];
  const walletIds: string[] = [];
  const walletCurrencyById = new Map<string, string>();
  const walletBalanceById = new Map<string, number>();

  for (let i = 0; i < SEED_WALLETS; i++) {
    const currency = pick([...availableCurrencies]);
    const walletId = crypto.randomUUID();
    const isSavingAccount = Math.random() < 0.18;
    const initialBalance = isSavingAccount ? randInt(2_000, 50_000) : randInt(0, 20_000);
    const savingAccountGoal = isSavingAccount ? initialBalance + randInt(1_000, 20_000) : 0;

    walletsToInsert.push({
      id: walletId,
      userId: demoUser.id,
      name: `${currency} Wallet ${String(i + 1).padStart(3, "0")}`,
      balance: initialBalance,
      isSavingAccount,
      savingAccountGoal,
      description: `Seed wallet ${i + 1}`,
      currency,
    });

    walletIds.push(walletId);
    walletCurrencyById.set(walletId, currency);
    walletBalanceById.set(walletId, initialBalance);
  }

  // --- 6. Execute Inserts with GUARDS ---
  
  // A. Wallets
  if (walletsToInsert.length > 0) {
    console.log(`💾 Inserting ${walletsToInsert.length} wallets...`);
    await db.insert(wallets).values(walletsToInsert);
  } else {
    console.log("⚠️ No wallets to insert.");
  }

  console.log(`💸 Seeding ~${SEED_TRANSACTIONS.toLocaleString()} transactions in batches of ${INSERT_BATCH_SIZE.toLocaleString()}...`);
  let insertedTx = 0;
  const maxTxPerWallet = Math.max(1, Math.floor(Math.min(MAX_TX_PER_WALLET, SEED_TRANSACTIONS / Math.max(walletIds.length, 1) * 2)));
  const txCountByWallet = new Map<string, number>();

  let batch: typeof transactions.$inferInsert[] = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const flushBatch = async () => {
    if (batch.length === 0) return;
    await db.insert(transactions).values(batch);
    insertedTx += batch.length;
    batch = [];
    if (insertedTx % (INSERT_BATCH_SIZE * 10) === 0) {
      console.log(`✅ Inserted ${insertedTx.toLocaleString()} / ${SEED_TRANSACTIONS.toLocaleString()} transactions...`);
    }
  };

  while (insertedTx < SEED_TRANSACTIONS) {
    const walletId = pick(walletIds);
    const wCount = (txCountByWallet.get(walletId) ?? 0);
    if (wCount >= maxTxPerWallet) continue;
    txCountByWallet.set(walletId, wCount + 1);

    const expenseWeight = 0.58;
    const isExpense = Math.random() < expenseWeight;
    const type = isExpense ? "expense" : "income";
    const catList = isExpense ? expenseCategories : incomeCategories;
    const cat = pick(catList);

    const amount = isExpense
      ? (Math.random() < 0.75 ? randInt(5, 180) : randInt(181, 2200))
      : (Math.random() < 0.85 ? randInt(80, 1800) : randInt(1801, 20000));

    const daysAgo = randInt(0, DAYS_SPREAD);
    const txDate = new Date(baseDate);
    txDate.setDate(txDate.getDate() - daysAgo);

    const delta = type === "income" ? amount : -amount;
    walletBalanceById.set(walletId, (walletBalanceById.get(walletId) ?? 0) + delta);

    batch.push({
      userId: demoUser.id,
      walletId,
      amount,
      type,
      categoryId: cat.id,
      transaction_date: txDate,
    });

    if (batch.length >= INSERT_BATCH_SIZE) {
      await flushBatch();
    }
  }
  await flushBatch();
  console.log(`💾 Transactions inserted: ${insertedTx.toLocaleString()}.`);

  // Generate transfers: varied count, dates, and same- vs cross-currency
  console.log(`🔁 Creating ${SEED_TRANSFERS.toLocaleString()} transfers (batched)...`);
  let transfersCreated = 0;
  let transferBatch: typeof transfers.$inferInsert[] = [];
  let transferTxBatch: typeof transactions.$inferInsert[] = [];

  const flushTransfers = async () => {
    if (transferTxBatch.length) {
      const inserted = await db.insert(transactions).values(transferTxBatch).returning({ id: transactions.id });
      for (let i = 0; i < inserted.length; i++) {
        const txId = inserted[i]?.id;
        const tr = transferBatch[i];
        if (txId && tr) tr.transactionId = txId;
      }
      await db.insert(transfers).values(transferBatch.filter((t) => !!t.transactionId));
      transferBatch = [];
      transferTxBatch = [];
    }
  };

  while (transfersCreated < SEED_TRANSFERS) {
    const fromWalletId = pick(walletIds);
    const toWalletId = pick(walletIds);
    if (fromWalletId === toWalletId) continue;

    const fromBal = walletBalanceById.get(fromWalletId) ?? 0;
    const amount = Math.random() < 0.7 ? randInt(10, 400) : randInt(401, 5_000);
    if (fromBal < amount) continue;

    const fromCurrency = walletCurrencyById.get(fromWalletId) ?? "USD";
    const toCurrency = walletCurrencyById.get(toWalletId) ?? "USD";
    const sameCurrency = fromCurrency === toCurrency;
    const exchangeRate = sameCurrency ? 1 : 0.7 + Math.random() * 0.8;
    const amountReceived = Math.round(amount * exchangeRate * 100) / 100;

    const daysAgo = randInt(0, Math.min(365, DAYS_SPREAD));
    const date = new Date(baseDate);
    date.setDate(date.getDate() - daysAgo);

    walletBalanceById.set(fromWalletId, fromBal - amount);
    walletBalanceById.set(toWalletId, (walletBalanceById.get(toWalletId) ?? 0) + amountReceived);

    transferTxBatch.push({
      userId: demoUser.id,
      walletId: fromWalletId,
      amount,
      type: "transfer",
      transaction_date: date,
    });

    transferBatch.push({
      userId: demoUser.id,
      transactionId: "",
      fromWalletId,
      toWalletId,
      amountSent: amount,
      amountReceived,
      exchangeRate,
      createdAt: date,
      updatedAt: date,
    });

    transfersCreated++;
    if (transferTxBatch.length >= Math.min(INSERT_BATCH_SIZE, 2000)) {
      await flushTransfers();
      if (transfersCreated % 10_000 === 0) console.log(`✅ Transfers created: ${transfersCreated.toLocaleString()}`);
    }
  }
  await flushTransfers();
  console.log(`💾 Transfers created: ${transfersCreated.toLocaleString()}.`);

  console.log("🏦 Syncing final wallet balances...");
  for (const w of walletsToInsert) {
    const finalBalance = walletBalanceById.get(w.id!) ?? w.balance ?? 0;
    await db.update(wallets).set({ balance: finalBalance }).where(and(eq(wallets.id, w.id!), eq(wallets.userId, demoUser.id)));
  }

  console.log("✨ Seeding complete, email: demo@demo.com, password: Tr0ub4dor&3-Correct-Horse-Battery-Staple");
}

// Run and log specific errors
seedDemoUser().catch((err) => {
  console.error("❌ Seeding failed fatally:");
  console.error(err);
  process.exit(1);
});