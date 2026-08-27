import { createFileRoute, Link, Navigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import RegisterForm from "@/client/components/auth/register-form"
import { PublicLayout } from "@/client/components/public-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/client/components/ui/card"
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
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{t("register")}</CardTitle>
            <CardDescription>{t("register_modal_description")}</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
