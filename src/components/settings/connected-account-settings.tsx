import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import ConnectedAccount from "./account/connected-account"
import GitHub from "../icons/github"
import Google from "../icons/google"
import { api } from "@/trpc/server"
import { getTranslations } from "next-intl/server";

export default async function ConnectedAccountSettings({...props}) {
  const t = await getTranslations("settings");
  const userAccounts = await api.user.getUserAccounts();
  console.log("userAccounts", userAccounts);
  return (
    <Card {...props} className="sm:max-w-md">
      <CardHeader>
        <CardTitle>{t("connected_accounts")}</CardTitle>
        <CardDescription>{t("connected_accounts_description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConnectedAccount accounts={userAccounts} provider={{ id: "github", name: "Github", icon: <GitHub /> }} />
        <ConnectedAccount accounts={userAccounts} provider={{ id: "google", name: "Google", icon: <Google /> }} />
      </CardContent>
    </Card>
  )
}