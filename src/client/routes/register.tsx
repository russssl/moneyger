
import { createFileRoute, Link, Navigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import RegisterForm from "@/client/components/auth/register-form"
import { ThemeToggle } from "@/client/components/common/theme-toggle"
import { LanguageToggle } from "@/client/components/common/language-select"
import { PublicLayout } from "@/client/components/public-layout"
import { useAuth } from "@/client/hooks/use-auth"

export const Route = createFileRoute("/register")({
  component: RegisterPage,
})

function RegisterPage() {
  const { data: session, isLoading: isPending } = useAuth()
  const { t } = useTranslation("register_login")

  if (isPending) return null
  if (session) return <Navigate to="/transactions" />

  return (
    <PublicLayout>
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2 py-1">
            <span className="h-2 w-2 rounded-full bg-accent shrink-0" aria-hidden="true" />
            <span className="text-[15px] font-semibold tracking-tight">Moneyger</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-4 sm:p-6 sm:py-8">
          <div className="w-full max-w-[400px]">
            <div className="mb-5 sm:mb-6">
              <h1 className="text-[22px] sm:text-2xl font-semibold tracking-tight leading-tight">
                {t("register")}
              </h1>
              <p className="mt-1.5 text-[13px] sm:text-sm leading-relaxed text-muted-foreground">
                {t("register_modal_description")}
              </p>
            </div>

            <RegisterForm />

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("already_have_account")}{" "}
              <Link
                to="/login"
                className="font-medium text-foreground underline underline-offset-4 decoration-foreground/20 hover:decoration-foreground/40 transition-colors"
              >
                {t("login")}
              </Link>
            </p>
          </div>
        </main>
      </div>
    </PublicLayout>
  )
}
