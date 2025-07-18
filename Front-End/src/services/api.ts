// Backend API base URL
const API_URL = import.meta.env.VITE_BACKEND_URL;
console.log(API_URL);

// Site type mapping to handle data migration from old names to new names
const siteTypeMapping: { [key: string]: string } = {
  // Old names -> New names
  "المواقع الايجابية": "المواقع الإيجابية",
  "مناهل مكشوفة": "مناهل مكشوفه",
  "الاحواش المهجورة": "احواش مهجورة",
  "الحدائق العامة": "حدائق عامة",
  "الاحواض الاسمنتية": "حوض اسمنتي",
  "إطارات سيارات": "الإطارات",
  // Keep the extra types that weren't in the image
  "الحالات المباشرة": "الحالات المباشرة",
  "بلاغات 940": "بلاغات 940",
};

// Function to transform site counts from old format to new format
export const transformSiteCounts = (siteCounts: { [key: string]: number }) => {
  const transformed: { [key: string]: number } = {};

  Object.entries(siteCounts).forEach(([oldKey, value]) => {
    const newKey = siteTypeMapping[oldKey] || oldKey;
    transformed[newKey] = value;
  });

  return transformed;
};

export interface PestControlData {
  date: string;
  municipality: string;
  district: string;
  workerName: string;
  controlType: string;
  siteCounts: { [key: string]: number };
  bgTraps: { isPositive: boolean; count: number };
  smartTraps: { isPositive: boolean; count: number };
  comment?: string;
  coordinates?: { latitude: number; longitude: number };
}

// Example detailed report (for reference only, not used in API calls)
export const exampleReport: PestControlData & {
  id: string;
  totalSites: number;
} = {
  id: "1",
  date: "2025-01-13",
  municipality: "العزيزية",
  district: "العزيزية",
  workerName: "أحمد محمد",
  controlType: "مكافحة وقائية",
  siteCounts: {
    "المواقع المستكشفة": 25,
    "المواقع السلبية": 18,
    "المواقع الإيجابية": 7,
    "المواقع الدائمة": 12,
    "تجمعات مياه": 8,
    "سقيا الطيور": 5,
    "مناهل مكشوفه": 3,
    "احواش مهجورة": 9,
    "مباني تحت الانشاء": 6,
    "حدائق عامة": 4,
    "مرافق عامة": 2,
    الاستراحات: 3,
    المساجد: 11,
    "حوض اسمنتي": 2,
    الإطارات: 15,
    مزهريات: 3,
    "تسريبات مياه": 4,
    البرادات: 2,
    "مجاري تصريف": 7,
    "الحالات المباشرة": 8,
    "بلاغات 940": 4,
  },
  bgTraps: { isPositive: false, count: 0 },
  smartTraps: { isPositive: false, count: 0 },
  totalSites: 146,
};

export const controlTypes = ["يرقي", "بالغ", "مكافحة وقائية"];

export const districtsByMunicipality = {
  "بلدية الشرائع": [
    "المقام",
    "أحد",
    "الثنية",
    "الصفا",
    "الكوثر",
    "العسيلة",
    "الخضراء",
    "معاد",
    "المغمس",
    "التروية",
    "زمزم",
    "الشرائع",
    "اليمامة",
    "السلام",
    "الراشدية",
    "بدر",
    "جعرانة",
    "البركة",
    "حنين",
    "الحطيم",
    "الصفا الشرقي",
    "البيعة",
    "حنين الشمالي",
  ],
  "بلدية المعابدة": [
    "المعابدة",
    "وادي جليل",
    "السليمانية الشرقي",
    "الخنساء",
    "جبل النور",
    "قرطبة",
    "الجميزة",
    "العدل",
    "ريع أذاخر",
    "الروضة",
  ],
  "بلدية العتيبة": [
    "النزهة",
    "الزاهر",
    "الضيافة",
    "الزهراء",
    "التيسير",
    "السليمانية الغربي",
    "الحجون",
    "البيبان",
    "العتيبية",
    "الأندلس",
    "الشهداء",
  ],
  "بلدية العزيزية": [
    "العوالي",
    "الهجرة",
    "الجامعة",
    "السنابل",
    "ملكان",
    "الحسينية",
    "الصفرة",
    "وادي نعمان",
    "العزيزية",
    "النسيم",
  ],
  "بلدية الزيمة": ["حنين", "الحطيم", "البيعة", "الصفا الشرقي"],
  "المشاعر المقدسة": ["منى", "مزدلفة", "عرفات"],
};

export async function submitPestControlData(
  data: PestControlData
): Promise<void> {
  const res = await fetch(`${API_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit pest control report");
}

export async function getPestControlData(filters: any): Promise<any> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.districts && filters.districts.length > 0) {
    filters.districts.forEach((d: string) => params.append("districts", d));
  }
  const res = await fetch(`${API_URL}/api/reports?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch pest control reports");
  const data = await res.json();

  // Transform site counts for each report to handle old data format
  if (data.reports) {
    data.reports = data.reports.map((report: any) => ({
      ...report,
      siteCounts: transformSiteCounts(report.siteCounts || {}),
    }));
  }

  return data;
}

export async function exportReport(
  report: any,
  type: string,
  filters: any = {}
): Promise<void> {
  const params = new URLSearchParams();
  params.append("type", type);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.districts && filters.districts.length > 0) {
    filters.districts.forEach((d: string) => params.append("districts", d));
  }
  if (filters.id) params.append("id", filters.id);
  const url = `${API_URL}/api/reports/export?${params.toString()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("Failed to export report");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = `report_${type}_${Date.now()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
