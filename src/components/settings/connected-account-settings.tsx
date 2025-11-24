import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ConnectedAccount from "./account/connected-account"
import GitHub from "../icons/github"
import Google from "../icons/google"
import { getTranslations } from "next-intl/server";

export default async function ConnectedAccountSettings({...props}) {
  const t = await getTranslations("settings");

  return (
    <Card {...props} className="sm:max-w-md">
      <CardHeader>
        <CardTitle>{t("connected_accounts")}</CardTitle>
        <CardDescription>{t("connected_accounts_description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConnectedAccount accounts={props.accounts} provider={{ id: "github", name: "Github", icon: <GitHub /> }} />
        <ConnectedAccount accounts={props.accounts} provider={{ id: "google", name: "Google", icon: <Google /> }} />
      </CardContent>
    </Card>
  )
}