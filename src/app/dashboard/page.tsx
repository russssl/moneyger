import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { QuickActions } from "./quick-actions/quick-actions";
import PagesHeader from "../pages-header";
import TotalBalance from "@/components/wallets/total-balance";
import { TransactionList } from "@/components/transactions/transaction-list";

function getWelcomeMessage() {
  const hour = new Date().getHours();
  if (hour < 12) return "good_morning";
  if (hour < 18) return "good_afternoon";
  if (hour < 22) return "good_evening";
  return "good_evening"
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const t = await getTranslations("HomePage");
  return (
    <div className="min-h-screen bg-background">
      <PagesHeader />
      <div className="max-w-[1700px] mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-6 md:py-8 pb-20 md:pb-12">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-1 sm:mb-2">
            {t(getWelcomeMessage(), { name: session?.user.name ?? "" })}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            {t("welcome_subtitle")}
          </p>
        </div>
        
        <div className="mb-4 sm:mb-6 md:mb-8 hidden sm:block">
          <QuickActions />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 items-stretch">
          <div className="flex flex-col h-full">
            <TotalBalance />
          </div>
          
          <div className="flex flex-col h-full">
            <TransactionList />
          </div>
        </div>
      </div>
    </div>
  );
}