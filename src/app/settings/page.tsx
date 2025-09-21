import type React from "react"
import SettingsSelect from "@/components/settings/settings-select"
import ProfileSettings from "@/components/settings/profile-settings"
import ErrorBoundary from "@/components/error-boundary"
import PasswordSettings from "@/components/settings/password-settings"
import AccountSettings from "@/components/settings/account-settings"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Palette } from "lucide-react"
import {ThemeSwitch} from "@/components/theme-toggle"
import {getTranslations} from "next-intl/server";
import ConnectedAccountSettings from "@/components/settings/connected-account-settings"
export default async function SettingsPage(
  props: {
    searchParams: Promise<{ category?: string }>
  }
) {
  const categoryGroupStyle =
    "grid grid-cols-[repeat(auto-fit,350px)] gap-4 p-4 justify-center md:justify-start";
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const searchParams = await props.searchParams;
  const selectedCategory = searchParams?.category || "account";
  const t = await getTranslations("settings");
  return (
    <div className="h-full bg-background">
      <header className="p-6 border-b">
        <h1 className="text-2xl font-bold">{t("settings")}</h1>
      </header>
      <SettingsSelect className="mt-4 px-4"/>
      {selectedCategory === "account" && (
        <div className={categoryGroupStyle}>
          <ErrorBoundary><ProfileSettings /></ErrorBoundary>
          <PasswordSettings />
          <ConnectedAccountSettings/>
          <AccountSettings/>
        </div>
      )}
      {selectedCategory === "appearance" && (
        <div className={categoryGroupStyle}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                  Theme
              </CardTitle>
              <CardDescription>Customize the appearance of the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Mode</Label>
                <ThemeSwitch />
                <p className="text-sm text-muted-foreground">
                    Select a theme preference or use your system settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
