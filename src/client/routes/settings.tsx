
import type React from "react"
import { createFileRoute, useLocation, Navigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/client/hooks/use-auth"
import SettingsSelect from "@/client/components/settings/settings-select"
import ProfileSettings from "@/client/components/settings/profile-settings"
import PasswordSettings from "@/client/components/settings/password-settings"
import CategoriesSettings from "@/client/components/settings/categories-settings"
import ConnectedAccount from "@/client/components/settings/account/connected-account"
import DeleteAccountDialog from "@/client/components/settings/delete-account-dialog"
import TwoFactorSettings from "@/client/components/settings/two-factor-settings"
import ActiveSessions from "@/client/components/settings/active-sessions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/client/components/ui/card"
import { Label } from "@/client/components/ui/label"
import { Palette, UserCog } from "lucide-react"
import { ThemeSwitch } from "@/client/components/common/theme-toggle"
import { ThemePicker } from "@/client/components/common/theme-picker"
import GitHub from "@/client/components/icons/github"
import Google from "@/client/components/icons/google"
import PagesHeader from "@/client/components/layout/pages-header"
import { AppLayout } from "@/client/components/app-layout"

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const categoryGroupStyle = "grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,350px)] gap-4 justify-center md:justify-start w-full"
  const { data: session, isLoading: isPending } = useAuth()
  const { t } = useTranslation("settings")
  const location = useLocation()
  const selectedCategory = (location.search as Record<string, string>)?.category || "account"
  const accounts: any[] = []

  if (isPending) return null
  if (!session) return <Navigate to="/login" />

  if (!session?.user?.id) {
    throw new Error(t("user_not_found"))
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <PagesHeader />
        <div className="max-w-[1700px] mx-auto p-4 sm:p-6">
          <SettingsSelect />
          {selectedCategory === "account" && (
            <div className={categoryGroupStyle}>
              <ProfileSettings session={session} />
              <Card className="sm:max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center">{t("connected_accounts")}</CardTitle>
                  <CardDescription>{t("connected_accounts_description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ConnectedAccount accounts={accounts} provider={{ id: "github", name: "Github", icon: <GitHub /> }} />
                  <ConnectedAccount accounts={accounts} provider={{ id: "google", name: "Google", icon: <Google /> }} />
                </CardContent>
              </Card>
              <Card className="sm:max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCog className="h-5 w-5 mr-2" />
                    {t("account_actions")}
                  </CardTitle>
                  <CardDescription>{t("manage_account_status")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-medium text-destructive">{t("delete_account")}</h3>
                    <p className="text-sm text-muted-foreground">{t("delete_account_description")}</p>
                    <DeleteAccountDialog />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {selectedCategory === "security" && (
            <div className={categoryGroupStyle}>
              <PasswordSettings passwordExists={true} />
              <TwoFactorSettings />
              <ActiveSessions />
            </div>
          )}
          {selectedCategory === "appearance" && (
            <div className={categoryGroupStyle}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    {t("theme")}
                  </CardTitle>
                  <CardDescription>{t("customize_appearance")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>{t("mode")}</Label>
                    <ThemeSwitch />
                    <p className="text-sm text-muted-foreground">{t("select_theme_preference")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    {t("color_scheme")}
                  </CardTitle>
                  <CardDescription>{t("select_color_scheme")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemePicker />
                </CardContent>
              </Card>
            </div>
          )}
          {selectedCategory === "categories" && (
            <div className={categoryGroupStyle}>
              <CategoriesSettings />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
