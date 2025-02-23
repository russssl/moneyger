import { TransactionList } from "@/components/app/transaction-list";
import WalletsAndCards from "@/components/app/wallets";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const session = await auth();
  const t = await getTranslations("HomePage");
  if (!session) {
    redirect("/login");
  }
  return (
    <div className="container pb-24 md:pb-0 md:pl-6">
      <div className="flex flex-col gap-6 px-4 md:px-0">
        <h1 className="text-2xl md:text-4xl font-bold mt-4">
          {t("welcome_message", { name: session.user.name })}
        </h1>
        <WalletsAndCards />
        <TransactionList />
      </div>
    </div>
  );
}