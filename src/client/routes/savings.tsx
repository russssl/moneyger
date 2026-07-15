
import { createFileRoute, Navigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/client/hooks/use-auth"
import PagesHeader from "@/client/components/layout/pages-header"
import SavingsPageContent from "@/client/components/savings/savings-content"
import { AppLayout } from "@/client/components/app-layout"

export const Route = createFileRoute("/savings")({
  component: SavingsPage,
})

function SavingsPage() {
  const { data: session, isLoading: isPending } = useAuth()
  const { t } = useTranslation("finances")

  if (isPending) return null
  if (!session) return <Navigate to="/login" />

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <PagesHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              {t("savings_title")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {t("savings_description")}
            </p>
          </div>

          <SavingsPageContent />
        </div>
      </div>
    </AppLayout>
  )
}
