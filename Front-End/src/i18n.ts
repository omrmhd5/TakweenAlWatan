import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import en from "./locales/en.json";

const STORAGE_KEY = "language";

export function normalizeLanguage(lng?: string): "ar" | "en" {
  return lng?.toLowerCase().startsWith("en") ? "en" : "ar";
}

export function getStoredLanguage(): "ar" | "en" {
  if (typeof window === "undefined") return "ar";
  return normalizeLanguage(localStorage.getItem(STORAGE_KEY) || "ar");
}

export function applyDocumentLanguage(lng?: string) {
  const lang = normalizeLanguage(lng);
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.body.lang = lang;
  document.body.dir = dir;
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

applyDocumentLanguage(i18n.resolvedLanguage || i18n.language);

i18n.on("languageChanged", (lng) => {
  const lang = normalizeLanguage(lng);
  localStorage.setItem(STORAGE_KEY, lang);
  applyDocumentLanguage(lang);
});

export default i18n;
