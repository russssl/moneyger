import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  // Get the locale from cookies
  let locale = (await cookies())?.get("locale")?.value;

  if (!locale) {
    const navigatorLocale = navigator.language;
    const supportedLocales = ["en", "pl", "ua"];
    if (navigatorLocale && supportedLocales.includes(navigatorLocale)) {
      locale = navigatorLocale;
    } else {
      locale = "en";
    }
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});