import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import en from "./locales/en.json"

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
        ...en,
      },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
      prefix: "{",
      suffix: "}",
    },
    detection: {
      order: ["cookie", "localStorage", "navigator"],
      caches: ["cookie"],
    },
  })

export default i18n
