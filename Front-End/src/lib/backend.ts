import i18n, { normalizeLanguage } from "../i18n";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.PROD
    ? "https://takween-al-watan-demo.onrender.com"
    : "http://localhost:3000");

export function langHeaders(): HeadersInit {
  const lang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  return {
    "Accept-Language": lang,
    "X-Language": lang,
  };
}
