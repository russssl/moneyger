import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // Get the locale from cookies
  const cookiesData = await cookies();
  const locale = cookiesData?.get("locale")?.value ?? "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});