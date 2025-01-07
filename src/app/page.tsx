import { TransactionList } from "@/components/app/transaction-list";
import WalletsAndCards from "@/components/app/wallets-and-cards";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return (
    <>
      <div className="ps-4">
        <h1 className="text-4xl font-bold mb-8 mt-4">Welcome back, {session.user.name}</h1>
        {/* <ExpenseStatsCard className="ms-4"/> */}
        {/* <WalletsAndCards className="ms-4"/> */}
        <TransactionList />
      </div>
    </>
  );
}
