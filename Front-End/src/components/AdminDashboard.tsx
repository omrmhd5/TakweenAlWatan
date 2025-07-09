import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  TrendingUp,
  MapPin,
  Building2,
  FileText,
  Users,
  Target,
  Eye,
  X,
  Search,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { getPestControlData, exportReport } from "../services/api";
import ReactDOM from "react-dom";

interface DashboardData {
  dailyReports: any[];
  weeklyReports: any[];
  monthlyReports: any[];
  detailedReports: any[];
  statistics: {
    daily: {
      totalRecords: number;
      highestSite: { type: string; count: number };
      mostActiveDistrict: string;
      totalSites: number;
      dateRange: string;
    };
    weekly: {
      totalRecords: number;
      highestSite: { type: string; count: number };
      mostActiveDistrict: string;
      totalSites: number;
      dateRange: string;
    };
    monthly: {
      totalRecords: number;
      highestSite: { type: string; count: number };
      mostActiveDistrict: string;
      totalSites: number;
      dateRange: string;
    };
  };
}

const municipalities = [
  "العزيزية",
  "المعابدة",
  "الشرائع",
  "العتيبة",
  "الزيمة",
  "المشاعر المقدسة",
];
const siteTypes = [
  "المواقع المستكشفة",
  "المواقع السلبية",
  "المواقع الايجابية",
  "المواقع الدائمة",
  "تجمعات مياه",
  "سقيا الطيور",
  "مناهل مكشوفة",
  "الاحواش المهجورة",
  "مباني تحت الانشاء",
  "الحدائق العامة",
  "المساجد",
  "مجاري تصريف",
  "الاحواض الاسمنتية",
  "إطارات سيارات",
  "مزهريات",
  "الحالات المباشرة",
  "بلاغات 940",
];

// Utility to get current week (Sunday-Saturday) date range
function getCurrentWeekRange() {
  const today = new Date();
  // 0 = Sunday, 6 = Saturday
  const dayOfWeek = today.getDay();
  // Start: most recent Sunday
  const start = new Date(today);
  start.setDate(today.getDate() - dayOfWeek);
  // End: next Saturday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const format = (d: Date) => d.toLocaleDateString("en-GB");
  return `${format(start)} - ${format(end)}`;
}

// Utility to get current month date range
function getCurrentMonthRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const format = (d: Date) => d.toLocaleDateString("en-GB");
  return `${format(start)} - ${format(end)}`;
}

function getWeekRange(dateStr: string) {
  const date = new Date(dateStr);
  // Find previous (or same) Sunday
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  // Saturday is 6 days after Sunday
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  const format = (d: Date) => d.toISOString().split("T")[0];
  return { start: format(sunday), end: format(saturday) };
}

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "daily" | "weekly" | "monthly" | "detailed"
  >("daily");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedDetailedReport, setSelectedDetailedReport] =
    useState<any>(null);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [allReports, setAllReports] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    districts: [] as string[],
    reportType: "all" as "daily" | "weekly" | "monthly" | "all",
  });

  const [searchFilters, setSearchFilters] = useState({
    startDate: "",
    endDate: "",
    districts: [] as string[],
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await getPestControlData({});
      setDashboardData(data);
      setAllReports(data.detailedReports || []);
    } catch (error) {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleDownloadReport = async (
    report: any,
    type: string,
    customFilters?: any
  ) => {
    try {
      await exportReport(report, type, customFilters || filters);
      showToast(
        `تم تصدير التقرير ${
          type === "daily"
            ? "اليومي"
            : type === "weekly"
            ? "الأسبوعي"
            : "الشهري"
        } بنجاح`,
        "success"
      );
    } catch (error) {
      showToast("حدث خطأ أثناء تصدير التقرير", "error");
    }
  };

  const handleDistrictChange = (district: string, isSearch = false) => {
    const targetFilters = isSearch ? searchFilters : filters;
    const setTargetFilters = isSearch ? setSearchFilters : setFilters;

    setTargetFilters((prev: any) => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter((d: any) => d !== district)
        : [...prev.districts, district],
    }));
  };

  const handleViewDetailedReport = (report: any) => {
    setSelectedDetailedReport(report);
    setShowDetailedModal(true);
  };

  const handleDownloadDetailedReport = async (report: any) => {
    try {
      await exportReport(report, "detailed", { ...filters, id: report._id });
      showToast("تم تصدير التقرير المفصل بنجاح", "success");
    } catch (error) {
      showToast("حدث خطأ أثناء تصدير التقرير", "error");
    }
  };

  const handleSearch = async () => {
    if (!searchFilters.startDate) {
      showToast("يرجى تحديد تاريخ البداية على الأقل", "error");
      return;
    }
    if (new Date(searchFilters.startDate) > new Date(today)) {
      showToast("لا يمكن البحث في تواريخ مستقبلية", "error");
      return;
    }
    if (
      searchFilters.endDate &&
      new Date(searchFilters.startDate) > new Date(searchFilters.endDate)
    ) {
      showToast("تاريخ البداية يجب أن يكون قبل تاريخ النهاية", "error");
      return;
    }
    // Filter allReports by date and municipalities
    let filtered = allReports.filter((r) => {
      const dateOk =
        (!searchFilters.startDate || r.date >= searchFilters.startDate) &&
        (!searchFilters.endDate || r.date <= searchFilters.endDate);
      const muniOk =
        searchFilters.districts.length === 0 ||
        searchFilters.districts.includes(r.municipality);
      return dateOk && muniOk;
    });
    // Grouping helpers
    const groupBy = (arr: any[], keyFn: (r: any) => string) => {
      return arr.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, any[]>);
    };
    const getDate = (r: any) => r.date;
    const getWeek = (r: any) => {
      const d = new Date(r.date);
      const day = d.getDay();
      const sunday = new Date(d);
      sunday.setDate(d.getDate() - day);
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      const format = (dt: Date) => dt.toISOString().split("T")[0];
      return `${format(sunday)} إلى ${format(saturday)}`;
    };
    const getMonth = (r: any) => {
      const d = new Date(r.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    // Group filtered reports
    const dailyGroups = groupBy(filtered, getDate);
    const weeklyGroups = groupBy(filtered, getWeek);
    const monthlyGroups = groupBy(filtered, getMonth);
    // Prepare grouped arrays
    const dailyReports = (Object.values(dailyGroups) as any[]).map((group) => ({
      date: group[0].date,
      reports: group,
    }));
    const weeklyReports = (
      Object.entries(weeklyGroups) as [string, any[]][]
    ).map(([week, group]) => ({
      week,
      reports: group,
    }));
    const monthlyReports = (
      Object.entries(monthlyGroups) as [string, any[]][]
    ).map(([month, group]) => ({
      month,
      reports: group,
    }));
    // Set searchResults
    setSearchResults({
      dailyReports,
      weeklyReports,
      monthlyReports,
      detailedReports: filtered,
      totalReports: filtered.length,
    });
    setShowSearchResults(true);
    showToast(`تم العثور على ${filtered.length} تقرير`, "success");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  let currentStats =
    activeTab === "detailed" ? null : dashboardData?.statistics?.[activeTab];
  let currentReports = [];
  if (showSearchResults) {
    currentReports = searchResults?.[`${activeTab}Reports`] || [];
  } else if (activeTab === "detailed") {
    currentReports = dashboardData?.detailedReports || [];
  } else {
    currentReports = dashboardData?.[`${activeTab}Reports`] || [];
  }

  // Sort groups so the most recent is first
  if (activeTab === "daily") {
    currentReports = [...currentReports].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } else if (activeTab === "weekly") {
    // Sort by the start of the week (descending)
    currentReports = [...currentReports].sort((a, b) => {
      const aStart = a.reports?.[0]?.date
        ? new Date(a.reports[0].date).getTime()
        : 0;
      const bStart = b.reports?.[0]?.date
        ? new Date(b.reports[0].date).getTime()
        : 0;
      return bStart - aStart;
    });
  } else if (activeTab === "monthly") {
    // Sort by year and month (descending)
    currentReports = [...currentReports].sort((a, b) => {
      const [aYear, aMonth] = a.month.split("-").map(Number);
      const [bYear, bMonth] = b.month.split("-").map(Number);
      if (bYear !== aYear) return bYear - aYear;
      return bMonth - aMonth;
    });
  }

  let statsDateRange = currentStats?.dateRange;
  if (activeTab === "weekly") {
    statsDateRange = getCurrentWeekRange();
  } else if (activeTab === "monthly") {
    statsDateRange = getCurrentMonthRange();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة الإدارة
          </h2>
          <p className="text-gray-600">إحصائيات وتقارير شاملة لمكافحة الآفات</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Search className="w-5 h-5 ml-2" />
          البحث في التقارير
        </h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ البداية *
            </label>
            <input
              type="date"
              min="2025-01-01"
              max="2035-12-31"
              value={searchFilters.startDate}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ النهاية (اختياري)
            </label>
            <input
              type="date"
              min="2025-01-01"
              max="2035-12-31"
              value={searchFilters.endDate}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse">
              <Search className="w-4 h-4" />
              <span>بحث</span>
            </button>
          </div>
        </div>

        {/* Search Districts Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            البلديات المحددة للبحث
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setSearchFilters((prev) => ({
                  ...prev,
                  districts:
                    prev.districts.length === municipalities.length
                      ? []
                      : [...municipalities],
                }))
              }
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                searchFilters.districts.length === municipalities.length
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}>
              {searchFilters.districts.length === municipalities.length
                ? "إلغاء تحديد الكل"
                : "تحديد الكل"}
            </button>
            {municipalities.map((municipality) => (
              <button
                key={municipality}
                onClick={() => handleDistrictChange(municipality, true)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  searchFilters.districts.includes(municipality)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}>
                {municipality}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {searchFilters.districts.length === 0
              ? "جميع البلديات"
              : `${searchFilters.districts.length} من ${municipalities.length} محدد`}
          </p>
        </div>

        {showSearchResults && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-800">
                نتائج البحث: {searchResults?.totalReports || 0} تقرير
                {searchFilters.startDate && (
                  <span className="mr-2">من {searchFilters.startDate}</span>
                )}
                {searchFilters.endDate && (
                  <span className="mr-2">إلى {searchFilters.endDate}</span>
                )}
              </p>
              <button
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchResults(null);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                إظهار جميع التقارير
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-2 rtl:space-x-reverse px-2 sm:px-6 min-w-max md:space-x-8">
            {[
              { key: "daily", label: "التقارير اليومية", icon: Calendar },
              { key: "weekly", label: "التقارير الأسبوعية", icon: BarChart3 },
              { key: "monthly", label: "التقارير الشهرية", icon: TrendingUp },
              { key: "detailed", label: "التقارير المفصلة", icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-3 px-2 sm:py-4 sm:px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 rtl:space-x-reverse whitespace-nowrap ${
                  activeTab === key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Statistics Cards for Current Tab */}
        {currentStats && !showSearchResults && (
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              إحصائيات{" "}
              {activeTab === "daily"
                ? "يومية"
                : activeTab === "weekly"
                ? "أسبوعية"
                : "شهرية"}
              {statsDateRange && (
                <span className="text-xs sm:text-sm font-normal text-gray-600 mr-2">
                  ({statsDateRange})
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 sm:p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-blue-600 font-medium">
                      إجمالي التسجيلات
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900">
                      {currentStats.totalRecords}
                    </p>
                  </div>
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 sm:p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-green-600 font-medium">
                      إجمالي المواقع
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-green-900">
                      {currentStats.totalSites}
                    </p>
                  </div>
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-2 sm:p-4 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-orange-600 font-medium">
                      الموقع الأعلى
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-orange-900">
                      {currentStats.highestSite.type}
                    </p>
                    <p className="text-base sm:text-lg font-bold text-orange-900">
                      ({currentStats.highestSite.count})
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2 sm:p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-purple-600 font-medium">
                      البلدية الأكثر نشاطاً
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-purple-900">
                      {currentStats.mostActiveDistrict}
                    </p>
                  </div>
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        <div className="p-2 sm:p-6">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            {showSearchResults ? "نتائج البحث - " : ""}
            {activeTab === "detailed"
              ? "التقارير المفصلة"
              : `التقارير ${
                  activeTab === "daily"
                    ? "اليومية"
                    : activeTab === "weekly"
                    ? "الأسبوعية"
                    : "الشهرية"
                }`}
          </h4>
          {currentReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {showSearchResults
                  ? "لا توجد تقارير تطابق معايير البحث"
                  : "لا توجد تقارير متاحة"}
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:gap-4">
              {activeTab === "detailed"
                ? currentReports
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((report: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-2 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div className="flex-1 mb-2 sm:mb-0">
                          <h5 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {`${report.workerName} - ${report.date} - ${report.municipality}`}
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {`الحي: ${report.district} | نوع المكافحة: ${report.controlType}`}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            إجمالي المواقع:{" "}
                            {(
                              Object.values(report.siteCounts || {}) as number[]
                            ).reduce((a: number, b: number) => a + b, 0)}
                          </p>
                        </div>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleViewDetailedReport(report)}
                            className="bg-blue-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 rtl:space-x-reverse text-xs sm:text-sm">
                            <Eye className="w-4 h-4" />
                            <span>عرض</span>
                          </button>
                          <button
                            onClick={() => handleDownloadDetailedReport(report)}
                            className="bg-green-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 rtl:space-x-reverse text-xs sm:text-sm">
                            <Download className="w-4 h-4" />
                            <span>تحميل</span>
                          </button>
                        </div>
                      </div>
                    ))
                : currentReports.map((group: any, index: number) => {
                    // Aggregate stats for the group
                    const totalSites = group.reports
                      ? (
                          group.reports
                            .map(
                              (r: any) =>
                                Object.values(r.siteCounts || {}) as number[]
                            )
                            .flat() as number[]
                        ).reduce((a: number, b: number) => a + b, 0)
                      : 0;
                    const allDistricts = group.reports
                      ? Array.from(
                          new Set(group.reports.map((r: any) => r.district))
                        )
                      : [];
                    const allMunicipalities = group.reports
                      ? Array.from(
                          new Set(group.reports.map((r: any) => r.municipality))
                        )
                      : [];
                    // Title and date range
                    let title = "";
                    let dateRange = "";
                    if (activeTab === "daily") {
                      title = `تقرير يومي - ${group.date}`;
                      dateRange = group.date;
                    } else if (activeTab === "weekly") {
                      const firstReportDate = group.reports?.[0]?.date || "";
                      const weekRange = firstReportDate
                        ? getWeekRange(firstReportDate)
                        : { start: "", end: "" };
                      title = `تقرير أسبوعي - الأسبوع من ${weekRange.start} إلى ${weekRange.end}`;
                      dateRange = `${weekRange.start} إلى ${weekRange.end}`;
                    } else if (activeTab === "monthly") {
                      const [year, month] = group.month.split("-");
                      const computedTitle = `تقرير شهري - ${year}/${parseInt(
                        month,
                        10
                      )}`;
                      title = computedTitle;
                      const firstDay = `${year}-${month}-01`;
                      // Fix: get last day of month correctly
                      const lastDay = new Date(Number(year), Number(month), 0)
                        .toISOString()
                        .split("T")[0];
                      dateRange = `${firstDay} إلى ${lastDay}`;
                    }
                    return (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-2 sm:p-4 mb-2 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div className="flex-1 mb-2 sm:mb-0">
                          <h5 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                            {title}
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">
                            {dateRange}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">
                            إجمالي المواقع: {totalSites}
                          </p>
                          <p className="text-xs text-gray-500">
                            البلديات: {allMunicipalities.join(", ")}
                          </p>
                        </div>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleViewReport(group)}
                            className="bg-blue-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 rtl:space-x-reverse text-xs sm:text-sm">
                            <Eye className="w-4 h-4" />
                            <span>عرض</span>
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadReport(
                                group,
                                activeTab,
                                activeTab === "daily"
                                  ? { ...filters, startDate: group.date }
                                  : activeTab === "weekly"
                                  ? {
                                      ...filters,
                                      startDate: getWeekRange(
                                        group.reports?.[0]?.date || ""
                                      ).start,
                                      endDate: getWeekRange(
                                        group.reports?.[0]?.date || ""
                                      ).end,
                                    }
                                  : activeTab === "monthly"
                                  ? {
                                      ...filters,
                                      startDate: `${group.month}-01`,
                                    }
                                  : filters
                              )
                            }
                            className="bg-green-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 rtl:space-x-reverse text-xs sm:text-sm">
                            <Download className="w-4 h-4" />
                            <span>تحميل</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showModal && selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setShowModal(false)}
          onDownload={() => handleDownloadReport(selectedReport, activeTab)}
        />
      )}

      {/* Detailed Report Modal */}
      {showDetailedModal && selectedDetailedReport && (
        <DetailedReportModal
          report={selectedDetailedReport}
          onClose={() => setShowDetailedModal(false)}
          onDownload={() =>
            handleDownloadDetailedReport(selectedDetailedReport)
          }
        />
      )}
    </div>
  );
}

function ReportModal({
  report,
  onClose,
  onDownload,
}: {
  report: any;
  onClose: () => void;
  onDownload: () => void;
}) {
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // If report has .reports, aggregate stats
  let modalStats = report;
  if (report.reports && Array.isArray(report.reports)) {
    // Aggregate totalSites
    const totalSites = (
      report.reports
        .map((r: any) => Object.values(r.siteCounts || {}) as number[])
        .flat() as number[]
    ).reduce((a: number, b: number) => a + b, 0);
    // Aggregate siteType counts by municipality
    const siteTypeTotals: Record<string, Record<string, number>> = {};
    const municipalityCounts: Record<string, number> = {};
    const siteTypeCounts: Record<string, number> = {};
    report.reports.forEach((r: any) => {
      Object.entries(r.siteCounts || {}).forEach(([type, count]) => {
        siteTypeTotals[type] = siteTypeTotals[type] || {};
        siteTypeTotals[type][r.municipality] =
          (siteTypeTotals[type][r.municipality] || 0) + (count as number);
        siteTypeCounts[type] = (siteTypeCounts[type] || 0) + (count as number);
      });
      municipalityCounts[r.municipality] =
        (municipalityCounts[r.municipality] || 0) + 1;
    });
    // Highest site type
    const highestSiteType = Object.entries(siteTypeCounts).sort(
      (a, b) => b[1] - a[1]
    )[0] || ["", 0];
    // Most active municipality
    const mostActiveMunicipality =
      Object.entries(municipalityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "";
    // Grand total
    const grandTotal = totalSites;
    // Compose modalStats
    modalStats = {
      ...report,
      totalSites,
      highestSite: { type: highestSiteType[0], count: highestSiteType[1] },
      mostActiveDistrict: mostActiveMunicipality,
      data: {
        siteTypeTotals,
        grandTotal,
      },
    };
  }

  let dateRange = "";
  if (report.week) {
    // Weekly group
    const firstReportDate = report.reports?.[0]?.date || "";
    const weekRange = firstReportDate
      ? getWeekRange(firstReportDate)
      : { start: "", end: "" };
    dateRange = `${weekRange.start} إلى ${weekRange.end}`;
  } else if (report.month) {
    // Monthly group
    const [year, month] = report.month.split("-");
    const computedTitle = `تقرير شهري - ${year}/${parseInt(month, 10)}`;
    const firstDay = `${year}-${month}-01`;
    const lastDay = new Date(Number(year), Number(month), 0)
      .toISOString()
      .split("T")[0];
    dateRange = `${firstDay} إلى ${lastDay}`;
    modalStats = {
      ...modalStats,
      title: computedTitle,
    };
  } else if (report.date) {
    // Daily group
    dateRange = report.date;
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-auto p-0 flex flex-col shadow-2xl"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-xl font-bold text-gray-900">
            {modalStats.title}
          </h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={onDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 rtl:space-x-reverse">
              <Download className="w-4 h-4" />
              <span>تحميل</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 min-h-0 overflow-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-600">الفترة: {dateRange}</p>
            <p className="text-sm text-gray-600">
              إجمالي المواقع: {modalStats.totalSites}
            </p>
            <p className="text-sm text-gray-600">
              الموقع الأعلى:{" "}
              {modalStats.highestSite?.type
                ? `${modalStats.highestSite.type} (${modalStats.highestSite.count})`
                : "غير متوفر"}
            </p>
            <p className="text-sm text-gray-600">
              البلدية الأكثر نشاطاً:{" "}
              {modalStats.mostActiveDistrict || "غير متوفر"}
            </p>
            {modalStats.workerName && (
              <p className="text-sm text-gray-600">
                الأخصائي: {modalStats.workerName}
              </p>
            )}
            {modalStats.controlType && (
              <p className="text-sm text-gray-600">
                نوع المكافحة: {modalStats.controlType}
              </p>
            )}
            {modalStats.bgTraps && (
              <p className="text-sm text-gray-600">
                مصائد BG brow:{" "}
                {modalStats.bgTraps.isPositive
                  ? `ايجابي (${modalStats.bgTraps.count})`
                  : "سلبي"}
              </p>
            )}
            {modalStats.smartTraps && (
              <p className="text-sm text-gray-600">
                مصائد ذكية:{" "}
                {modalStats.smartTraps.isPositive
                  ? `ايجابي (${modalStats.smartTraps.count})`
                  : "سلبي"}
              </p>
            )}
            {modalStats.comment && (
              <p className="text-sm text-gray-600">
                الملاحظات: {modalStats.comment}
              </p>
            )}
            {modalStats.coordinates && (
              <p className="text-sm text-gray-600">
                الإحداثيات: {modalStats.coordinates.latitude.toFixed(6)},{" "}
                {modalStats.coordinates.longitude.toFixed(6)}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع الموقع
                  </th>
                  {municipalities.map((municipality) => (
                    <th
                      key={municipality}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {municipality}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-100">
                    المجموع
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {siteTypes.map((siteType, index) => {
                  const rowData =
                    modalStats.data?.siteTypeTotals?.[siteType] || {};
                  const rowTotal = municipalities.reduce(
                    (sum, municipality) => sum + (rowData[municipality] || 0),
                    0
                  );

                  return (
                    <tr
                      key={siteType}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {siteType}
                      </td>
                      {municipalities.map((municipality) => (
                        <td
                          key={municipality}
                          className="px-4 py-3 text-center text-sm text-gray-900">
                          {rowData[municipality] || 0}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center text-sm font-bold text-blue-900 bg-blue-50">
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals Row */}
                <tr className="bg-blue-100 font-bold sticky bottom-0">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    المجموع
                  </td>
                  {municipalities.map((municipality) => {
                    const municipalityTotal = siteTypes.reduce(
                      (sum, siteType) => {
                        return (
                          sum +
                          (modalStats.data?.siteTypeTotals?.[siteType]?.[
                            municipality
                          ] || 0)
                        );
                      },
                      0
                    );
                    return (
                      <td
                        key={municipality}
                        className="px-4 py-3 text-center text-sm font-bold text-blue-900">
                        {municipalityTotal}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center text-sm font-bold text-blue-900">
                    {modalStats.data?.grandTotal || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

function DetailedReportModal({
  report,
  onClose,
  onDownload,
}: {
  report: any;
  onClose: () => void;
  onDownload: () => void;
}) {
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-0 flex flex-col shadow-2xl"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-xl font-bold text-gray-900">
            تقرير مفصل - {report.workerName}
          </h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={onDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 rtl:space-x-reverse">
              <Download className="w-4 h-4" />
              <span>تحميل</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 min-h-0 overflow-auto">
          {/* Basic Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              المعلومات الأساسية
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>التاريخ:</strong> {report.date}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>اسم الأخصائي:</strong> {report.workerName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>البلدية:</strong> {report.municipality}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>الحي:</strong> {report.district}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <strong>نوع المكافحة:</strong> {report.controlType}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>إجمالي المواقع:</strong> {report.totalSites}
                </p>
                {report.coordinates && (
                  <p className="text-sm text-gray-600">
                    <strong>الإحداثيات:</strong>{" "}
                    {report.coordinates.latitude.toFixed(6)},{" "}
                    {report.coordinates.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Trap Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              المصائد
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">
                  مصائد BG brow
                </h5>
                <p className="text-sm text-gray-600">
                  الحالة: {report.bgTraps?.isPositive ? "ايجابي" : "سلبي"}
                </p>
                {report.bgTraps?.isPositive && (
                  <p className="text-sm text-gray-600">
                    العدد: {report.bgTraps.count}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">مصائد ذكية</h5>
                <p className="text-sm text-gray-600">
                  الحالة: {report.smartTraps?.isPositive ? "ايجابي" : "سلبي"}
                </p>
                {report.smartTraps?.isPositive && (
                  <p className="text-sm text-gray-600">
                    العدد: {report.smartTraps.count}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Site Counts */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              المواقع المستهدفة
            </h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {siteTypes.map((siteType) => (
                <div key={siteType} className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-medium text-gray-900 text-sm mb-1">
                    {siteType}
                  </h5>
                  <p className="text-lg font-bold text-blue-600">
                    {report.siteCounts?.[siteType] || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          {report.comment && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                الملاحظات
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{report.comment}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
