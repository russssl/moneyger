import { TransactionList } from "@/components/app/transaction-list";
import WalletsAndCards from "@/components/app/wallets";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";


export default async function HomePage() {

  const sessionHeaders = await headers();
  const session = await auth.api.getSession({
    headers: sessionHeaders
  });
  if (!session) {
    redirect("/login");
  }
  const t = await getTranslations("HomePage");
  return (
    session ? (
      <div className="flex justify-center pb-24 md:pb-0">
        <div className="max-w-3xl w-full px-4 md:px-6">
          <div className="flex flex-col gap-6">
            <h1 className="text-xl md:text-4xl font-bold mt-4 text-center">
              {t("welcome_message", { name: session.user.name })}
            </h1>
            <WalletsAndCards />
            <TransactionList />
          </div>
        </div>
      </div>
    ) : null
  );
}