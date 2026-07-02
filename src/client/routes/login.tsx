
import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import LoginProviders from "@/components/auth/login-providers"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { PublicLayout } from "@/client/components/public-layout"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation("register_login")

  return (
    <PublicLayout>
      <div className="fixed inset-0 flex items-center justify-center min-h-screen w-full overflow-hidden">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex justify-between">
              {t("login")}
              <ThemeToggle />
            </CardTitle>
            <CardDescription>{t("login_modal_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginProviders providers={[]} />
          </CardContent>
          <CardFooter className="text-sm text-center text-gray-500 flex flex-col space-y-2">
            <div>
              {t("terms_and_conditions")}
            </div>
            <div>
              {t("no_account")}{" "}
              <Link to="/register" className="text-blue-500 ml-2">
                {t("register")}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  )
}
