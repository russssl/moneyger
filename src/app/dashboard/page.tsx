import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { QuickActions } from "./quick-actions/quick-actions";
import PagesHeader from "../pages-header";
import TotalBalance from "@/components/app/TotalBalance";
import { TransactionList } from "@/components/app/transaction-list";

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

  const t = await getTranslations("HomePage");
  return (
    <div className="min-h-screen bg-background">
      <PagesHeader />
      <div className="max-w-[1700px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {t(getWelcomeMessage(), { name: session?.user.name })}
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome to your personal finance dashboard
          </p>
        </div>
        
        <div className="mb-8">
          <QuickActions />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
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