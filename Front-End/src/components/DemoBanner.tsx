import { useTranslation } from "react-i18next";

export default function DemoBanner() {
  const { t } = useTranslation();
  return (
    <div className="bg-amber-500 text-white text-center text-sm sm:text-base font-semibold py-2 px-4 sticky top-0 z-50">
      {t("banner.demo")} · {t("banner.wake")}
    </div>
  );
}
