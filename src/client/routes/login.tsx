import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import LoginProviders from "@/client/components/auth/login-providers"
import { PublicLayout } from "@/client/components/public-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/client/components/ui/card"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation("register_login")

  return (
    <PublicLayout>
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{t("login")}</CardTitle>
            <CardDescription>{t("login_modal_description")}</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
