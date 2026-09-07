import type { TFunction } from "i18next";

export const SITE_TYPES = [
  "المواقع المستكشفة",
  "المواقع السلبية",
  "المواقع الإيجابية",
  "المواقع الدائمة",
  "تجمعات مياه",
  "سقيا الطيور",
  "مناهل مكشوفه",
  "احواش مهجورة",
  "مباني تحت الانشاء",
  "حدائق عامة",
  "مرافق عامة",
  "الاستراحات",
  "المساجد",
  "حوض اسمنتي",
  "الإطارات",
  "مزهريات",
  "تسريبات مياه",
  "البرادات",
  "مجاري تصريف",
  "الحالات المباشرة",
  "بلاغات 940",
] as const;

export const MUNICIPALITIES = [
  "العزيزية",
  "المعابدة",
  "الشرائع",
  "العتيبة",
  "الزيمة",
  "المشاعر المقدسة",
] as const;

export type DomainGroup = "sites" | "municipalities" | "districts" | "controlTypes";

export function labelOf(
  t: TFunction,
  group: DomainGroup,
  value: string | undefined | null
) {
  if (!value) return "";
  return t(`data.${group}.${value}`, { defaultValue: value });
}
