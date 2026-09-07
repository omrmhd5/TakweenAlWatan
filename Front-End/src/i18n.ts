import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import en from "./locales/en.json";

const STORAGE_KEY = "language";

export function getStoredLanguage(): "ar" | "en" {
  if (typeof window === "undefined") return "ar";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "ar";
}

export function applyDocumentLanguage(lng: string) {
  const lang = lng === "en" ? "en" : "ar";
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = lang === "ar" ? ar.meta.title : en.meta.title;
}

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

applyDocumentLanguage(i18n.language);

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng === "en" ? "en" : "ar");
  applyDocumentLanguage(lng);
});

export default i18n;
