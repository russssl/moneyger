import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { QuickActions } from "./quick-actions/quick-actions";
import PagesHeader from "../pages-header";
import TotalBalance from "@/components/app/TotalBalance";

function getWelcomeMessage() {
  const hour = new Date().getHours();
  if (hour < 12) return "good_morning";
  if (hour < 18) return "good_afternoon";
  if (hour < 22) return "good_evening";
  return "good_evening"
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const t = await getTranslations("HomePage");
  return (
    <div className="flex flex-col gap-6 p-6">
      <PagesHeader />
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">
          {t(getWelcomeMessage(), { name: session?.user.name })}
        </h1>
        <p className="text-muted-foreground">
          Welcome to your personal finance dashboard
        </p>
        <QuickActions className="hidden md:block" />
        <div className="max-w-2xl">
          <TotalBalance />
        </div>
      </div>
    </div>
  );
}