import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCog } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { getTranslations } from "next-intl/server"
import DeleteAccountDialog from "./delete-account-dialog"
export default async function AccountSettings({...props}) {
  const t = await getTranslations("settings")
  const tService = await getTranslations("service")
  return (
    <>
      <Card {...props} className="sm:max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCog className="h-5 w-5 mr-2" />
            {t("account_actions")}
          </CardTitle>
          <CardDescription>{t("manage_account_status")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">{t("suspend_account")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("suspend_account_description")}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">{t("suspend_account")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("suspend_account_confirm_title")}</DialogTitle>
                  <DialogDescription>
                    {t("suspend_account_confirm_description")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" className="mb-3">{tService("cancel")}</Button>
                  <Button variant="default">{t("suspend_account")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-medium text-destructive">{t("delete_account")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("delete_account_description")}
            </p>
            <DeleteAccountDialog />
          </div>
        </CardContent>
      </Card>
    </>

  )
}