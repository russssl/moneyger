import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCog, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { api } from "@/trpc/server"
import ConnectedAccount from "./account/connected-account"
import GitHub from "../icons/github"
import Google from "../icons/google"
export default async function AccountSettings() {
  const userAccounts = await api.user.getUserAccounts();
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCog className="h-5 w-5 mr-2" />
      Account Actions
          </CardTitle>
          <CardDescription>Manage your account status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Suspend Account</h3>
            <p className="text-sm text-muted-foreground">
        Temporarily disable your account. You can reactivate it anytime.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Suspend Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Suspend Account</DialogTitle>
                  <DialogDescription>
              Are you sure you want to suspend your account? Your data will be preserved, but you will not
              be able to access your account until you reactivate it.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="default">Suspend Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-medium text-destructive">Delete Account</h3>
            <p className="text-sm text-muted-foreground">
        Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription>
              Are you absolutely sure you want to delete your account? This action cannot be undone and
              all your data will be permanently lost.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                This will delete all your data including wallets, transactions, and settings.
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Manage accounts connected to your profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConnectedAccount accounts={userAccounts} provider={{ id: "github", name: "Github", icon: <GitHub /> }} />
          <ConnectedAccount accounts={userAccounts} provider={{ id: "google", name: "Google", icon: <Google /> }} />
        </CardContent>
      </Card>
    </>

  )
}