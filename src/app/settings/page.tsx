import type React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import SettingsSelect from "@/components/settings/settings-select"
import ProfileSettings from "@/components/settings/profile-settings"
import PasswordSettings from "@/components/settings/password-settings"
import AccountSettings from "@/components/settings/account-settings"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Palette } from "lucide-react"
import {ThemeSwitch} from "@/components/theme-toggle"
import {getTranslations} from "next-intl/server";
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }

  const categoryGroupStyle =
  "grid gap-4 px-4 py-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]";

  // eslint-disable-next-line @typescript-eslint/await-thenable
  searchParams = await searchParams;
  const selectedCategory = searchParams?.category || "account";
  const t = await getTranslations("settings");
  return (
    <div className="flex justify-start h-100 bg-background w-[100vw]">
      <div className="flex-1 overflow-auto">
        <header className="p-6 border-b">
          <h1 className="text-2xl font-bold">{t("settings")}</h1>
        </header>
        <SettingsSelect className="mt-4 px-3"/>
        {selectedCategory === "account" && (
          <div className={categoryGroupStyle}>
            <ProfileSettings />
            <PasswordSettings />
            <AccountSettings className="sm:mb-4"/>
          </div>
        )}
        {
          selectedCategory === "appearance" && (
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
    </div>
  )
}
