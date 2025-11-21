import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoginProviders from "@/components/login-providers";
import Link from "next/link"
import { type Metadata } from "next";
import {ThemeToggle} from "@/components/theme-toggle";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import GitHub from "@/components/icons/github";
import Google from "@/components/icons/google";
import { type SocialProvider } from "@/hooks/use-session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("register_login");
  return {
    title: t("login"),
    description: t("login_description"),
  };
}

export default async function Page() {
  const t = await getTranslations("register_login");
  const providerIcons: Record<string, React.ReactNode> = {
    github: <GitHub noBackground/>,
    google: <Google noBackground/>
  };

  const providerNames: Record<string, string> = {
    github: "Github",
    google: "Google"
  };
  const availableProviders: SocialProvider[] = Object.keys(auth.options.socialProviders)
    .filter((provider): provider is "github" | "google" => 
      provider === "github" || provider === "google"
    )
    .map((provider) => ({
      provider,
      name: providerNames[provider] || provider.charAt(0).toUpperCase() + provider.slice(1),
      icon: providerIcons[provider] || null
    }));
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
