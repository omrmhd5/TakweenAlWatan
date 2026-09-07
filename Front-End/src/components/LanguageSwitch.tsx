import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const next = i18n.language === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      className="px-3 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      aria-label={t("language.toggle")}
      title={t("language.toggle")}>
      <Globe className="w-4 h-4" />
      <span>{i18n.language === "ar" ? t("language.en") : t("language.ar")}</span>
    </button>
  );
}
