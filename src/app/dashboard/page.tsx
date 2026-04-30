import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { QuickActions } from "./quick-actions/quick-actions";
import PagesHeader from "../pages-header";
import TotalBalance from "@/components/wallets/total-balance";
import { TransactionList } from "@/components/transactions/transaction-list";
import NetWorthChart from "@/components/stats/net-worth-chart";

function getWelcomeMessage() {
  const hour = new Date().getHours();
  if (hour < 12) return "good_morning";
  if (hour < 18) return "good_afternoon";
  return "good_evening";
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const t = await getTranslations("HomePage");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const displayName = session.user.name?.trim() ?? "";

  return (
    <div className="min-h-screen bg-background">
      <PagesHeader />
      <main
        className="max-w-[1700px] mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-6 md:py-8 pb-20 md:pb-12"
        aria-label={tBreadcrumbs("dashboard")}
      >
        <header className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-1 sm:mb-2">
            {t(getWelcomeMessage(), { name: displayName })}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            {t("welcome_subtitle")}
          </p>
        </header>

        <div className="mb-4 sm:mb-6 md:mb-8 hidden sm:block">
          <QuickActions />
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-6 items-start">
          <div className="lg:col-span-5">
            <TotalBalance />
          </div>
          <div className="lg:col-span-7">
            <TransactionList />
          </div>
          <div className="lg:col-span-12">
            <NetWorthChart />
          </div>
        </section>
      </main>
    </div>
  );
}