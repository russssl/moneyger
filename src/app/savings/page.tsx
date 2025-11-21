import { getTranslations } from "next-intl/server";
import PagesHeader from "../pages-header";
import SavingsPageContent from "./savings-content";

export default async function SavingsPage() {
  const t = await getTranslations("finances");

  return (
    <div className="min-h-screen bg-background">
      <PagesHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {t("savings_title")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("savings_description")}
          </p>
        </div>

        <SavingsPageContent />
      </div>
    </div>
  );
}
