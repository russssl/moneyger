import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/client/hooks/use-auth"
import { QuickActions } from "@/client/components/dashboard/quick-actions/quick-actions"
import PagesHeader from "@/client/components/layout/pages-header"
import TotalBalance from "@/client/components/wallets/total-balance"
import { TransactionList } from "@/client/components/transactions/transaction-list"
import NetWorthChart from "@/client/components/stats/net-worth-chart"
import { Navigate } from "@tanstack/react-router"
import { AppLayout } from "@/client/components/app-layout"

function getWelcomeMessage() {
  const hour = new Date().getHours()
  if (hour < 12) return "good_morning"
  if (hour < 18) return "good_afternoon"
  return "good_evening"
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: session, isLoading } = useAuth()
  const { t } = useTranslation("HomePage")
  const { t: tBreadcrumbs } = useTranslation("breadcrumbs")

  if (isLoading) return null
  if (!session) return <Navigate to="/login" />

  const displayName = session.user.name?.trim() ?? ""

  return (
    <AppLayout>
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

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-6 items-stretch">
          <div className="lg:col-span-5 flex">
            <div className="w-full min-h-[280px]">
              <TotalBalance />
            </div>
          </div>
          <div className="lg:col-span-7 flex">
            <div className="w-full min-h-[280px]">
              <TransactionList />
            </div>
          </div>
          <div className="lg:col-span-12">
            <NetWorthChart />
          </div>
        </section>
      </main>
    </div>
    </AppLayout>
  )
}
