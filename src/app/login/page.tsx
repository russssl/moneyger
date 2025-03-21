import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoginProviders from "@/components/login-providers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link"
import { type Metadata } from "next";
import ThemeToggle from "@/components/theme-toggle";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};
export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const t = await getTranslations("register_login");
  if (session) {
    redirect("/");
  }
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">
            {t("login")}
            <ThemeToggle />
          </CardTitle>
          <CardDescription>{t("login_modal_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginProviders />
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
