import { user, wallets, transactions, transfers } from "../db/schema";
import db from "../db";
import { eq } from "drizzle-orm";
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
  const availableCurrencies = ["USD", "EUR", "GBP", "JPY", "PLN"];
  const incomeCategories = ["Salary", "Freelance", "Gift", "Investment"];
  const expenseCategories = ["Groceries", "Housing", "Transport", "Entertainment"];

  const walletsToInsert: typeof wallets.$inferInsert[] = [];
  const transactionsToInsert: typeof transactions.$inferInsert[] = [];
  const transfersToInsert: typeof transfers.$inferInsert[] = [];

  console.log("🧠 Generating data in memory...");

  // Generate 10 Wallets
  for (let i = 0; i < 10; i++) {
    // Generate UUID manually so we can link transactions immediately
    const walletId = crypto.randomUUID(); 
    const currency = availableCurrencies[i % availableCurrencies.length] ?? "USD";
    const walletBalance = Math.floor(Math.random() * 5000) + 1000;

    walletsToInsert.push({
      id: walletId,
      userId: demoUser.id,
      name: `Wallet ${i + 1}`,
      balance: walletBalance,
      isSavingAccount: Math.random() > 0.5,
      savingAccountGoal: Math.random() > 0.5 ? walletBalance * 20 : 0,
      description: `Main wallet for ${currency}`,
      currency: currency,
    });

    // Generate Transactions for this Wallet
    const transactionCount = 15;
    for (let j = 0; j < transactionCount; j++) {
      const isExpense = Math.random() > 0.4;
      const type = isExpense ? "expense" : "income";
      const categoryList = isExpense ? expenseCategories : incomeCategories;
      const category = categoryList[Math.floor(Math.random() * categoryList.length)];
      const amount = isExpense 
        ? Math.floor(Math.random() * 500) + 10 
        : Math.floor(Math.random() * 2000) + 500;

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 60));

      transactionsToInsert.push({
        userId: demoUser.id,
        walletId: walletId, // Link to the ID we just generated
        amount: amount,
        type: type,
        category: category,
        description: `${type === "income" ? "Received" : "Paid"} ${category}`,
        transaction_date: date,
      });
    }
  }

  // Generate Transfers (Only if we have at least 2 wallets)
  // if (walletsToInsert.length >= 2) {
  //   for (let k = 0; k < 10; k++) {
  //     const fromIndex = Math.floor(Math.random() * walletsToInsert.length);
  //     let toIndex = Math.floor(Math.random() * walletsToInsert.length);
      
  //     // Ensure distinct wallets
  //     while (toIndex === fromIndex) {
  //       toIndex = Math.floor(Math.random() * walletsToInsert.length);
  //     }

  //     const fromWallet = walletsToInsert[fromIndex];
  //     const toWallet = walletsToInsert[toIndex];

  //     if (!fromWallet || !toWallet) {
  //       console.error("❌ Error: From or to wallet not found.");
  //       return;
  //     }
  //     // FIX: Ensure we don't push undefined if logic fails (Double check)
  //     if (fromWallet && toWallet) {
  //       // Explicitly assert that fromWallet.id and toWallet.id are strings to fix type error
  //       transfersToInsert.push({
  //         userId: demoUser.id,
  //         fromWalletId: fromWallet.id!,
  //         toWalletId: toWallet.id!,
  //         amountSent: Math.floor(Math.random() * 500) + 50,
  //         amountReceived: Math.floor(Math.random() * 500) + 50, // or = amountSent for no FX
  //         exchangeRate: 1,
  //         description: `Transfer from ${fromWallet.name} to ${toWallet.name}`,
  //       });
  //       });
  //     }
  //   }
  // }

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

  // C. Transfers
  if (transfersToInsert.length > 0) {
    console.log(`💾 Inserting ${transfersToInsert.length} transfers...`);
    await db.insert(transfers).values(transfersToInsert);
  } else {
    console.log("⚠️ No transfers to insert.");
  }

  console.log("✨ Seeding complete, email: demo@demo.com, password: Tr0ub4dor&3-Correct-Horse-Battery-Staple");
}

// Run and log specific errors
seedDemoUser().catch((err) => {
  console.error("❌ Seeding failed fatally:");
  console.error(err);
  process.exit(1);
});