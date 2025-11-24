import type React from "react"
import SettingsSelect from "@/components/settings/settings-select"
import ProfileSettings from "@/components/settings/profile-settings"
import PasswordSettings from "@/components/settings/password-settings"
import AccountSettings from "@/components/settings/account-settings"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Palette } from "lucide-react"
import {ThemeSwitch} from "@/components/common/theme-toggle"
import ConnectedAccountSettings from "@/components/settings/connected-account-settings"
import PagesHeader from "../pages-header"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import db from "@/server/db"
import { eq } from "drizzle-orm"
import { account } from "@/server/db/user"
import { getTranslations } from "next-intl/server"

export default async function SettingsPage(
  props: {
    searchParams: Promise<{ category?: string }>
  }
) {
  const categoryGroupStyle = "grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,350px)] gap-4 px-0 sm:px-4 justify-center md:justify-start w-full";
  const searchParams = await props.searchParams;
  const user = await auth.api.getSession({
    headers: await headers()
  })

  if (!user) {
    return redirect("/login");
  }

  const accounts = await db.query.account.findMany({
    where: eq(account.userId, user.session.userId),
  })

  const passwordExists = accounts.length > 0 && accounts.find((account) => account.providerId === "credential") !== undefined;

  const selectedCategory = searchParams?.category || "account";
  const t = await getTranslations("settings");

  if (!user?.session?.userId) {
    throw new Error(t("user_not_found"));
  }

  return (
    <div className="h-full gap-6 p-4 sm:p-6">
      <PagesHeader />
      <SettingsSelect className="mt-4"/>
      {selectedCategory === "account" && (
        <div className={categoryGroupStyle}>
          <ProfileSettings session={user.session ?? null}/>
          <PasswordSettings passwordExists={passwordExists ?? false} />
          <ConnectedAccountSettings accounts={accounts}/>
          <AccountSettings/>
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
        </div>
      )}
    </div>
  )
}
