
import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import LoginProviders from "@/client/components/auth/login-providers"
import { ThemeToggle } from "@/client/components/common/theme-toggle"
import { LanguageToggle } from "@/client/components/common/language-select"
import { PublicLayout } from "@/client/components/public-layout"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation("register_login")

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
                {t("login")}
              </h1>
              <p className="mt-1.5 text-[13px] sm:text-sm leading-relaxed text-muted-foreground">
                {t("login_modal_description")}
              </p>
            </div>

            <LoginProviders providers={[]} />

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("no_account")}{" "}
              <Link
                to="/register"
                className="font-medium text-foreground underline underline-offset-4 decoration-foreground/20 hover:decoration-foreground/40 transition-colors"
              >
                {t("register")}
              </Link>
            </p>

            <p className="mt-4 px-2 text-center text-xs leading-relaxed text-muted-foreground/60">
              {t("terms_and_conditions")}
            </p>
          </div>
        </main>
      </div>
    </PublicLayout>
  )
}
