import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoginProviders from "@/components/login-providers";
import Link from "next/link"
import { type Metadata } from "next";
import {ThemeToggle} from "@/components/theme-toggle";
import { getTranslations } from "next-intl/server";
import { type Provider } from "@/hooks/use-session";
import { api } from "@/trpc/server"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default async function Page() {
  const t = await getTranslations("register_login");
  const availableProviders: Provider[] = await api.globalConfig.getGlobalConfig();
  return (
    <div className="fixed inset-0 flex items-center justify-center min-h-screen w-full overflow-hidden">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">
            {t("login")}
            <ThemeToggle />
          </CardTitle>
          <CardDescription>{t("login_modal_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginProviders providers={availableProviders} />
        </CardContent>
        <CardFooter className="text-sm text-center text-gray-500 flex flex-col space-y-2">
          <div>
            {t("terms_and_conditions")}
          </div>
          <div>
            {t("no_account")}{" "}
            <Link href="/register" className="text-blue-500 ml-2">
              {t("register")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
