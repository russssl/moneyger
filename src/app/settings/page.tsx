"use server"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeSwitch } from "@/components/theme-toggle"
import ProfileSettings from "@/components/settings/profile-settings"
import PasswordSettings from "@/components/settings/password-settings"
import AccountSettings from "@/components/settings/account-settings"
import { Palette } from "lucide-react"
import Sessions from "@/components/settings/sessions"

export default async function SettingsPage() {
  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="p-6 border-b">
          <h1 className="text-2xl font-bold">Settings</h1>
        </header>

        <div className="p-6 max-w-[2000px] mx-auto">
          <Tabs defaultValue="account" className="mb-6">
            <TabsList className="grid grid-cols-4 md:grid-cols-5 lg:w-[600px]">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="security" className="hidden md:block">
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="mt-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                <ProfileSettings />
                {/* Password Settings */}
                <PasswordSettings />
                {/* Account Actions */}
                <AccountSettings />
                
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="mt-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {/* Theme Settings */}
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

                    {/* <Separator /> */}

                    {/* <div className="space-y-3">
                      <Label>Color Theme</Label>
                      <RadioGroup
                        value={colorTheme}
                        onValueChange={handleColorThemeChange}
                        className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                      >
                        {colorThemes.map((theme) => (
                          <div key={theme.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={theme.value} id={`color-${theme.value}`} />
                            <Label htmlFor={`color-${theme.value}`} className="flex items-center cursor-pointer">
                              <span
                                className="w-4 h-4 rounded-full mr-2"
                                style={{ backgroundColor: theme.color }}
                              ></span>
                              {theme.name}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <p className="text-sm text-muted-foreground">Choose a color theme for the application.</p>
                    </div> */}
                  </CardContent>
                </Card>

                {/* Layout Settings */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle>Layout</CardTitle>
                    <CardDescription>Customize the layout of the application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Use a more compact layout to fit more content on screen.
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sidebar</Label>
                        <p className="text-sm text-muted-foreground">
                          Always show the sidebar even on smaller screens.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card> */}
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Manage your notification preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications on your device.</p>
                    </div>
                    <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="account-activity">Account Activity</Label>
                        <Switch id="account-activity" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="security-alerts">Security Alerts</Label>
                        <Switch id="security-alerts" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="marketing">Marketing & Updates</Label>
                        <Switch id="marketing" checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </TabsContent>

            <TabsContent value="privacy" className="mt-6">
              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Privacy
                  </CardTitle>
                  <CardDescription>Manage your privacy settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Data Collection</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="analytics">Analytics</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow us to collect anonymous usage data to improve our service.
                          </p>
                        </div>
                        <Switch id="analytics" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="personalization">Personalization</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow us to personalize your experience based on your usage.
                          </p>
                        </div>
                        <Switch id="personalization" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Data Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Download a copy of all your data stored in our system.
                    </p>
                    <Button variant="outline" className="flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card> */}
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Two-Factor Authentication */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Two-Factor Authentication
                    </CardTitle>
                    <CardDescription>Add an extra layer of security to your account.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable 2FA</Label>
                        <p className="text-sm text-muted-foreground">
                          Protect your account with two-factor authentication.
                        </p>
                      </div>
                      <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                    </div>

                    {twoFactorEnabled && (
                      <div className="pt-4">
                        <Button variant="outline">Set Up Two-Factor Authentication</Button>
                      </div>
                    )}
                  </CardContent>
                </Card> */}

                {/* Sessions Management */}
                <Sessions />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
