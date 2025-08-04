import type React from "react"
import SettingsSelect from "@/components/settings/settings-select"
import ProfileSettings from "@/components/settings/profile-settings"
import PasswordSettings from "@/components/settings/password-settings"
import AccountSettings from "@/components/settings/account-settings"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Palette } from "lucide-react"
import {ThemeSwitch} from "@/components/theme-toggle"
import ConnectedAccountSettings from "@/components/settings/connected-account-settings"
import PagesHeader from "../pages-header"

export default async function SettingsPage(
  props: {
    searchParams: Promise<{ category?: string }>
  }
) {
  const categoryGroupStyle = "grid grid-cols-[repeat(auto-fit,350px)] gap-4 p-4 justify-center md:justify-start";
  const searchParams = await props.searchParams;
  const selectedCategory = searchParams?.category || "account";
  return (
    <div className="h-full gap-6 p-6">
      <PagesHeader />
      <SettingsSelect className="mt-4 px-4"/>
      {selectedCategory === "account" && (
        <div className={categoryGroupStyle}>
          <ProfileSettings />
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
                <p className="text-sm text-muted-foreground">Select a theme preference or use your system settings.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
