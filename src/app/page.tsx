import { TransactionList } from "@/components/app/transaction-list";
import WalletsAndCards from "@/components/app/wallets";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";


export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) {
    redirect("/login");
  }
  const t = await getTranslations("HomePage");
  return (
    <div className="ms-4">
      <h1 className="text-3xl ms-2 mt-4 mb-4 font-bold">
        {t("welcome_message", { name: session.user.name })}
      </h1>
      <WalletsAndCards className="mb-3"/>
      <TransactionList />
    </div>
  );
}