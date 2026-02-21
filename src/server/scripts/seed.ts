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

  // --- 5. Prepare Data Arrays ---
  const availableCurrencies = ["USD", "EUR", "GBP", "JPY", "PLN"] as const;
  const walletNamesByType: Record<string, string[]> = {
    USD: ["Main Checking", "Savings - Emergency", "Cash USD", "Brokerage"],
    EUR: ["Euro Travel", "Revolut EUR", "Savings - House"],
    GBP: ["UK Account", "Pocket Money"],
    JPY: ["Japan Trip"],
    PLN: ["Polish Zloty", "Family PLN"],
  };
  const walletsToInsert: typeof wallets.$inferInsert[] = [];
  const transactionsToInsert: typeof transactions.$inferInsert[] = [];

  console.log("🧠 Generating data in memory...");

  const categoriesData: typeof categories.$inferInsert[] = [
    { name: "Salary", type: "income", iconName: "banknote", createdBy: demoUser.id },
    { name: "Investment", type: "income", iconName: "trending-up", createdBy: demoUser.id },
    { name: "Gifts", type: "income", iconName: "gift", createdBy: demoUser.id },
    { name: "Groceries", type: "expense", iconName: "shopping-cart", createdBy: demoUser.id },
    { name: "Housing", type: "expense", iconName: "home", createdBy: demoUser.id },
    { name: "Transport", type: "expense", iconName: "car", createdBy: demoUser.id },
    { name: "Entertainment", type: "expense", iconName: "gamepad-2", createdBy: demoUser.id },
    { name: "Health", type: "expense", iconName: "heart-pulse", createdBy: demoUser.id },
    { name: "Shopping", type: "expense", iconName: "shopping-bag", createdBy: demoUser.id },
    { name: "Dining", type: "expense", iconName: "utensils", createdBy: demoUser.id },
  ];
  console.log("💾 Inserting categories...");
  const insertedCategories = await db.insert(categories).values(categoriesData).returning();
  const incomeCategories = insertedCategories.filter(c => c.type === "income");
  const expenseCategories = insertedCategories.filter(c => c.type === "expense");

  let walletIndex = 0;
  for (const currency of availableCurrencies) {
    const names = walletNamesByType[currency] ?? [`Wallet ${currency}`];
    for (let n = 0; n < names.length; n++) {
      const walletId = crypto.randomUUID();
      const name = names[n];
      const isSavingAccount = (name?.toLowerCase().includes("savings")) || (currency === "EUR" && n === 2);
      const baseBalance = isSavingAccount ? Math.floor(Math.random() * 15000) + 5000 : Math.floor(Math.random() * 8000) + 500;
      const walletBalance = walletIndex === 0 ? baseBalance + 10000 : baseBalance;
      const savingAccountGoal = isSavingAccount ? walletBalance + Math.floor(Math.random() * 5000) + 2000 : 0;
      walletsToInsert.push({
        id: walletId,
        userId: demoUser.id,
        name: name ?? `Wallet ${walletIndex + 1}`,
        balance: walletBalance,
        isSavingAccount: !!isSavingAccount,
        savingAccountGoal,
        description: `${currency} account for debugging`,
        currency,
      });

      const txCount = walletIndex === 0 ? 35 : walletIndex === 1 ? 5 : 12 + Math.floor(Math.random() * 15);
      const daysSpread = 120;
      for (let j = 0; j < txCount; j++) {
        const isExpense = Math.random() > 0.45;
        const type = isExpense ? "expense" : "income";
        const list = type === "income" ? incomeCategories : expenseCategories;
        const randomCategory = list[Math.floor(Math.random() * list.length)]!;
        const amount = isExpense
          ? (Math.random() < 0.2 ? Math.floor(Math.random() * 20) + 1 : Math.floor(Math.random() * 800) + 10)
          : (Math.random() < 0.15 ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 1500) + 200);
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * daysSpread));
        date.setHours(0, 0, 0, 0);
        transactionsToInsert.push({
          userId: demoUser.id,
          walletId,
          amount,
          type,
          categoryId: randomCategory.id,
          transaction_date: date,
        });
      }
      walletIndex++;
    }
  }
  // Add recent transactions (today / yesterday) on first wallet for date-filter debugging
  const firstWallet = walletsToInsert[0];
  if (firstWallet && expenseCategories[0]) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const recentCats = [incomeCategories[0], expenseCategories[0], expenseCategories[1]].filter(Boolean);
    const fallbackCatId = expenseCategories[0].id;
    for (const d of [today, yesterday]) {
      const cat = recentCats[Math.floor(Math.random() * recentCats.length)];
      const categoryId: string = cat?.id ?? fallbackCatId;
      transactionsToInsert.push({
        userId: demoUser.id,
        walletId: firstWallet.id!,
        amount: Math.floor(Math.random() * 80) + 10,
        type: "expense",
        categoryId,
        transaction_date: d,
      });
    }
  }

  // --- 6. Execute Inserts with GUARDS ---
  
  // A. Wallets
  if (walletsToInsert.length > 0) {
    console.log(`💾 Inserting ${walletsToInsert.length} wallets...`);
    await db.insert(wallets).values(walletsToInsert);
  } else {
    console.log("⚠️ No wallets to insert.");
  }

  // B. Transactions
  if (transactionsToInsert.length > 0) {
    console.log(`💾 Inserting ${transactionsToInsert.length} transactions...`);
    await db.insert(transactions).values(transactionsToInsert);
  } else {
    console.log("⚠️ No transactions to insert.");
  }

  // Generate transfers: varied count, dates, and same- vs cross-currency
  let transfersCreated = 0;
  const maxTransferAttempts = 40;
  for (let i = 0; i < maxTransferAttempts && transfersCreated < 25; i++) {
    const fromWalletId = walletsToInsert[Math.floor(Math.random() * walletsToInsert.length)]?.id;
    const toWalletId = walletsToInsert[Math.floor(Math.random() * walletsToInsert.length)]?.id;
    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId) continue;

    const amount = Math.random() < 0.3 ? Math.floor(Math.random() * 200) + 20 : Math.floor(Math.random() * 1200) + 100;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    date.setHours(0, 0, 0, 0);
    const sameCurrency = Math.random() > 0.4;
    const exchangeRate = sameCurrency ? 1 : 0.8 + Math.random() * 0.4;
    const amountReceived = amount * exchangeRate;

    const [fromWallet, toWallet] = await Promise.all([
      db.query.wallets.findFirst({ where: eq(wallets.id, fromWalletId), columns: { balance: true } }),
      db.query.wallets.findFirst({ where: eq(wallets.id, toWalletId), columns: { balance: true } }),
    ]);
    if (!fromWallet || !toWallet || fromWallet.balance < amount) continue;

    const [transaction] = await db.insert(transactions).values({
      userId: demoUser.id,
      walletId: fromWalletId,
      amount,
      type: "transfer",
      transaction_date: date,
    }).returning({ id: transactions.id });
    if (!transaction) continue;

    await db.insert(transfers).values({
      userId: demoUser.id,
      transactionId: transaction.id,
      fromWalletId,
      toWalletId,
      amountSent: amount,
      amountReceived,
      exchangeRate,
      createdAt: date,
      updatedAt: date,
    });
    await Promise.all([
      db.update(wallets).set({ balance: fromWallet.balance - amount }).where(and(eq(wallets.id, fromWalletId), eq(wallets.userId, demoUser.id))),
      db.update(wallets).set({ balance: toWallet.balance + amountReceived }).where(and(eq(wallets.id, toWalletId), eq(wallets.userId, demoUser.id))),
    ]);
    transfersCreated++;
  }
  console.log(`💾 Transfers created: ${transfersCreated}.`);

  console.log("✨ Seeding complete, email: demo@demo.com, password: Tr0ub4dor&3-Correct-Horse-Battery-Staple");
}

// Run and log specific errors
seedDemoUser().catch((err) => {
  console.error("❌ Seeding failed fatally:");
  console.error(err);
  process.exit(1);
});