import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // Get the locale from cookies
  const locale = (await cookies())?.get("locale")?.value || navigator.language || "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});