// Mock API service - In production, replace with actual API calls

interface PestControlData {
  date: string;
  municipality: string;
  siteCounts: { [key: string]: number };
}

const municipalities = [
  "العزيزية",
  "المعابدة",
  "الشرائع",
  "العتيبة",
  "الزيمة",
  "المشاعر",
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

// Enhanced mock data with comprehensive coverage across multiple weeks and months
let mockData: (PestControlData & { id: string; totalSites: number })[] = [
  // Week 1 (Jan 13-19, 2025) - Complete week
  {
    id: "1",
    date: "2025-01-13",
    municipality: "العزيزية",
    siteCounts: {
      "المواقع المستكشفة": 25,
      "المواقع السلبية": 18,
      "المواقع الايجابية": 7,
      "المواقع الدائمة": 12,
      "تجمعات مياه": 8,
      "سقيا الطيور": 5,
      "مناهل مكشوفة": 3,
      "الاحواش المهجورة": 9,
      "مباني تحت الانشاء": 6,
      "الحدائق العامة": 4,
      المساجد: 11,
      "مجاري تصريف": 7,
      "الاحواض الاسمنتية": 2,
      "إطارات سيارات": 15,
      مزهريات: 3,
      "الحالات المباشرة": 8,
      "بلاغات 940": 4,
    },
    totalSites: 146,
  },
  {
    id: "2",
    date: "2025-01-13",
    municipality: "المعابدة",
    siteCounts: {
      "المواقع المستكشفة": 32,
      "المواقع السلبية": 22,
      "المواقع الايجابية": 10,
      "المواقع الدائمة": 8,
      "تجمعات مياه": 12,
      "سقيا الطيور": 7,
      "مناهل مكشوفة": 5,
      "الاحواش المهجورة": 11,
      "مباني تحت الانشاء": 9,
      "الحدائق العامة": 6,
      المساجد: 13,
      "مجاري تصريف": 8,
      "الاحواض الاسمنتية": 4,
      "إطارات سيارات": 18,
      مزهريات: 5,
      "الحالات المباشرة": 12,
      "بلاغات 940": 6,
    },
    totalSites: 188,
  },
  {
    id: "3",
    date: "2025-01-13",
    municipality: "الشرائع",
    siteCounts: {
      "المواقع المستكشفة": 28,
      "المواقع السلبية": 20,
      "المواقع الايجابية": 8,
      "المواقع الدائمة": 15,
      "تجمعات مياه": 10,
      "سقيا الطيور": 6,
      "مناهل مكشوفة": 4,
      "الاحواش المهجورة": 7,
      "مباني تحت الانشاء": 8,
      "الحدائق العامة": 5,
      المساجد: 9,
      "مجاري تصريف": 6,
      "الاحواض الاسمنتية": 3,
      "إطارات سيارات": 12,
      مزهريات: 4,
      "الحالات المباشرة": 10,
      "بلاغات 940": 5,
    },
    totalSites: 160,
  },
  {
    id: "4",
    date: "2025-01-13",
    municipality: "العتيبة",
    siteCounts: {
      "المواقع المستكشفة": 35,
      "المواقع السلبية": 25,
      "المواقع الايجابية": 10,
      "المواقع الدائمة": 18,
      "تجمعات مياه": 14,
      "سقيا الطيور": 8,
      "مناهل مكشوفة": 6,
      "الاحواش المهجورة": 12,
      "مباني تحت الانشاء": 10,
      "الحدائق العامة": 7,
      المساجد: 15,
      "مجاري تصريف": 9,
      "الاحواض الاسمنتية": 5,
      "إطارات سيارات": 20,
      مزهريات: 6,
      "الحالات المباشرة": 14,
      "بلاغات 940": 8,
    },
    totalSites: 222,
  },
  {
    id: "5",
    date: "2025-01-13",
    municipality: "الزيمة",
    siteCounts: {
      "المواقع المستكشفة": 22,
      "المواقع السلبية": 16,
      "المواقع الايجابية": 6,
      "المواقع الدائمة": 10,
      "تجمعات مياه": 7,
      "سقيا الطيور": 4,
      "مناهل مكشوفة": 2,
      "الاحواش المهجورة": 8,
      "مباني تحت الانشاء": 5,
      "الحدائق العامة": 3,
      المساجد: 7,
      "مجاري تصريف": 5,
      "الاحواض الاسمنتية": 2,
      "إطارات سيارات": 11,
      مزهريات: 3,
      "الحالات المباشرة": 6,
      "بلاغات 940": 3,
    },
    totalSites: 120,
  },
  {
    id: "6",
    date: "2025-01-13",
    municipality: "المشاعر",
    siteCounts: {
      "المواقع المستكشفة": 30,
      "المواقع السلبية": 21,
      "المواقع الايجابية": 9,
      "المواقع الدائمة": 13,
      "تجمعات مياه": 11,
      "سقيا الطيور": 6,
      "مناهل مكشوفة": 4,
      "الاحواش المهجورة": 10,
      "مباني تحت الانشاء": 7,
      "الحدائق العامة": 5,
      المساجد: 12,
      "مجاري تصريف": 7,
      "الاحواض الاسمنتية": 3,
      "إطارات سيارات": 16,
      مزهريات: 4,
      "الحالات المباشرة": 9,
      "بلاغات 940": 5,
    },
    totalSites: 172,
  },

  // Continue with more days for complete weeks...
  // Jan 14, 2025
  {
    id: "7",
    date: "2025-01-14",
    municipality: "العزيزية",
    siteCounts: {
      "المواقع المستكشفة": 27,
      "المواقع السلبية": 19,
      "المواقع الايجابية": 8,
      "المواقع الدائمة": 11,
      "تجمعات مياه": 9,
      "سقيا الطيور": 5,
      "مناهل مكشوفة": 3,
      "الاحواش المهجورة": 8,
      "مباني تحت الانشاء": 6,
      "الحدائق العامة": 4,
      المساجد: 10,
      "مجاري تصريف": 6,
      "الاحواض الاسمنتية": 2,
      "إطارات سيارات": 13,
      مزهريات: 3,
      "الحالات المباشرة": 7,
      "بلاغات 940": 4,
    },
    totalSites: 145,
  },
  {
    id: "8",
    date: "2025-01-14",
    municipality: "المعابدة",
    siteCounts: {
      "المواقع المستكشفة": 30,
      "المواقع السلبية": 20,
      "المواقع الايجابية": 10,
      "المواقع الدائمة": 9,
      "تجمعات مياه": 11,
      "سقيا الطيور": 6,
      "مناهل مكشوفة": 4,
      "الاحواش المهجورة": 10,
      "مباني تحت الانشاء": 8,
      "الحدائق العامة": 5,
      المساجد: 12,
      "مجاري تصريف": 7,
      "الاحواض الاسمنتية": 3,
      "إطارات سيارات": 16,
      مزهريات: 4,
      "الحالات المباشرة": 11,
      "بلاغات 940": 5,
    },
    totalSites: 171,
  },

  // Add more comprehensive data for multiple weeks and months
  // Week 2 (Jan 20-26, 2025)
  {
    id: "20",
    date: "2025-01-20",
    municipality: "العزيزية",
    siteCounts: {
      "المواقع المستكشفة": 23,
      "المواقع السلبية": 17,
      "المواقع الايجابية": 6,
      "المواقع الدائمة": 10,
      "تجمعات مياه": 7,
      "سقيا الطيور": 4,
      "مناهل مكشوفة": 2,
      "الاحواش المهجورة": 7,
      "مباني تحت الانشاء": 5,
      "الحدائق العامة": 3,
      المساجد: 9,
      "مجاري تصريف": 5,
      "الاحواض الاسمنتية": 1,
      "إطارات سيارات": 12,
      مزهريات: 2,
      "الحالات المباشرة": 6,
      "بلاغات 940": 3,
    },
    totalSites: 122,
  },

  // December 2024 data for monthly testing
  {
    id: "50",
    date: "2024-12-15",
    municipality: "العزيزية",
    siteCounts: {
      "المواقع المستكشفة": 20,
      "المواقع السلبية": 15,
      "المواقع الايجابية": 5,
      "المواقع الدائمة": 8,
      "تجمعات مياه": 6,
      "سقيا الطيور": 3,
      "مناهل مكشوفة": 2,
      "الاحواش المهجورة": 6,
      "مباني تحت الانشاء": 4,
      "الحدائق العامة": 2,
      المساجد: 7,
      "مجاري تصريف": 4,
      "الاحواض الاسمنتية": 1,
      "إطارات سيارات": 9,
      مزهريات: 2,
      "الحالات المباشرة": 5,
      "بلاغات 940": 2,
    },
    totalSites: 101,
  },

  // Add more historical data for better testing across multiple months
  {
    id: "51",
    date: "2024-11-10",
    municipality: "المعابدة",
    siteCounts: {
      "المواقع المستكشفة": 18,
      "المواقع السلبية": 13,
      "المواقع الايجابية": 5,
      "المواقع الدائمة": 7,
      "تجمعات مياه": 5,
      "سقيا الطيور": 3,
      "مناهل مكشوفة": 2,
      "الاحواش المهجورة": 5,
      "مباني تحت الانشاء": 4,
      "الحدائق العامة": 2,
      المساجد: 6,
      "مجاري تصريف": 3,
      "الاحواض الاسمنتية": 1,
      "إطارات سيارات": 8,
      مزهريات: 2,
      "الحالات المباشرة": 4,
      "بلاغات 940": 2,
    },
    totalSites: 85,
  },
];

// Add more mock data programmatically for comprehensive testing
function generateMockData() {
  const additionalData = [];
  const startDate = new Date("2024-10-01");
  const endDate = new Date("2025-01-19");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Skip some days randomly to simulate real-world data gaps
    if (Math.random() < 0.3) continue;

    const dateStr = d.toISOString().split("T")[0];

    // Generate data for random districts each day
    const shuffledDistricts = [...municipalities].sort(
      () => Math.random() - 0.5
    );
    const numDistricts = Math.floor(Math.random() * 3) + 2; // 2-4 districts per day

    for (let i = 0; i < numDistricts; i++) {
      const district = shuffledDistricts[i];
      const siteCounts: { [key: string]: number } = {};
      let totalSites = 0;

      siteTypes.forEach((siteType) => {
        const count = Math.floor(Math.random() * 30) + 1; // 1-30 sites
        siteCounts[siteType] = count;
        totalSites += count;
      });

      additionalData.push({
        id: `gen_${additionalData.length + 100}`,
        date: dateStr,
        municipality: district,
        siteCounts,
        totalSites,
      });
    }
  }

  return additionalData;
}

// Add generated data to mock data
mockData = [...mockData, ...generateMockData()];

export async function submitPestControlData(
  data: PestControlData
): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const totalSites = Object.values(data.siteCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  mockData.push({
    ...data,
    id: Date.now().toString(),
    totalSites,
  });

  console.log("Data submitted:", data);
}

export async function getPestControlData(filters: any): Promise<any> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Filter data based on filters
  let filteredData = [...mockData];

  if (filters.startDate) {
    filteredData = filteredData.filter(
      (item) => item.date >= filters.startDate
    );
  }

  if (filters.endDate) {
    filteredData = filteredData.filter((item) => item.date <= filters.endDate);
  }

  if (filters.districts && filters.districts.length > 0) {
    filteredData = filteredData.filter((item) =>
      filters.districts.includes(item.municipality)
    );
  }

  // Calculate date ranges
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Generate reports
  const dailyReports: any[] = generateDailyReports(filteredData);
  const weeklyReports: any[] = generateWeeklyReports(filteredData);
  const monthlyReports: any[] = generateMonthlyReports(filteredData);

  // Calculate statistics for each period
  const todayData = filteredData.filter((item) => item.date === today);
  const weeklyData = filteredData.filter(
    (item) => new Date(item.date) >= weekAgo
  );
  const monthlyData = filteredData.filter(
    (item) => new Date(item.date) >= monthAgo
  );

  const dailyStats = calculatePeriodStats(todayData, "اليوم");
  const weeklyStats = calculatePeriodStats(
    weeklyData,
    `${weekAgo.toISOString().split("T")[0]} إلى ${today}`
  );
  const monthlyStats = calculatePeriodStats(
    monthlyData,
    `${monthAgo.toISOString().split("T")[0]} إلى ${today}`
  );

  return {
    dailyReports,
    weeklyReports,
    monthlyReports,
    statistics: {
      daily: dailyStats,
      weekly: weeklyStats,
      monthly: monthlyStats,
    },
  };
}

export async function searchReports(searchFilters: any): Promise<any> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filteredData = [...mockData];

  // Apply search filters
  if (searchFilters.startDate) {
    filteredData = filteredData.filter(
      (item) => item.date >= searchFilters.startDate
    );
  }

  if (searchFilters.endDate) {
    filteredData = filteredData.filter(
      (item) => item.date <= searchFilters.endDate
    );
  }

  if (searchFilters.districts && searchFilters.districts.length > 0) {
    filteredData = filteredData.filter((item) =>
      searchFilters.districts.includes(item.municipality)
    );
  }

  // Smart date categorization
  const startDate = new Date(searchFilters.startDate);
  const endDate = searchFilters.endDate
    ? new Date(searchFilters.endDate)
    : startDate;

  // Determine which reports to include based on date range
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let dailyReports: any[] = [];
  let weeklyReports: any[] = [];
  let monthlyReports: any[] = [];

  // Generate reports based on the search criteria
  if (daysDiff <= 7) {
    // For short ranges, focus on daily reports
    dailyReports = generateDailyReports(filteredData);

    // Include weekly reports if the date range spans a week boundary
    const startWeek = getWeekStart(startDate);
    const endWeek = getWeekStart(endDate);
    if (startWeek.getTime() !== endWeek.getTime()) {
      weeklyReports = generateWeeklyReports(filteredData);
    }
  } else if (daysDiff <= 31) {
    // For medium ranges, include daily and weekly
    dailyReports = generateDailyReports(filteredData);
    weeklyReports = generateWeeklyReports(filteredData);

    // Include monthly if spanning month boundary
    if (
      startDate.getMonth() !== endDate.getMonth() ||
      startDate.getFullYear() !== endDate.getFullYear()
    ) {
      monthlyReports = generateMonthlyReports(filteredData);
    }
  } else {
    // For long ranges, include all types
    dailyReports = generateDailyReports(filteredData);
    weeklyReports = generateWeeklyReports(filteredData);
    monthlyReports = generateMonthlyReports(filteredData);
  }

  const totalReports =
    dailyReports.length + weeklyReports.length + monthlyReports.length;

  return {
    dailyReports,
    weeklyReports,
    monthlyReports,
    totalReports,
    searchCriteria: {
      startDate: searchFilters.startDate,
      endDate: searchFilters.endDate,
      districts: searchFilters.districts,
    },
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function generateDailyReports(data: any[]) {
  const dailyGroups: Record<string, any[]> = {};

  data.forEach((item) => {
    if (!dailyGroups[item.date]) {
      dailyGroups[item.date] = [];
    }
    dailyGroups[item.date].push(item);
  });

  return Object.entries(dailyGroups)
    .map(([date, items]) => {
      const stats = calculatePeriodStats(items, date);
      return {
        title: `تقرير يومي - ${date}`,
        dateRange: date,
        totalSites: items.reduce((sum, item) => sum + item.totalSites, 0),
        districts: items.map((item) => item.municipality),
        data: generateAggregatedReport(items),
        highestSite: stats.highestSite,
        mostActiveDistrict: stats.mostActiveDistrict,
      };
    })
    .sort((a, b) => b.dateRange.localeCompare(a.dateRange))
    .slice(0, 30); // Last 30 days
}

function generateWeeklyReports(data: any[]) {
  const weeklyGroups: Record<string, any[]> = {};

  data.forEach((item) => {
    const date = new Date(item.date);
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekKey = `${weekStart.toISOString().split("T")[0]}_${
      weekEnd.toISOString().split("T")[0]
    }`;

    if (!weeklyGroups[weekKey]) {
      weeklyGroups[weekKey] = [];
    }
    weeklyGroups[weekKey].push(item);
  });

  return Object.entries(weeklyGroups)
    .map(([weekKey, items]) => {
      const [startDate, endDate] = weekKey.split("_");
      const stats = calculatePeriodStats(items, `${startDate} إلى ${endDate}`);
      return {
        title: `تقرير أسبوعي - الأسبوع من ${startDate} إلى ${endDate}`,
        dateRange: `${startDate} إلى ${endDate}`,
        totalSites: items.reduce((sum, item) => sum + item.totalSites, 0),
        districts: [...new Set(items.map((item) => item.municipality))],
        data: generateAggregatedReport(items),
        highestSite: stats.highestSite,
        mostActiveDistrict: stats.mostActiveDistrict,
      };
    })
    .sort((a, b) => b.dateRange.localeCompare(a.dateRange))
    .slice(0, 12); // Last 12 weeks
}

function generateMonthlyReports(data: any[]) {
  const monthlyGroups: Record<string, any[]> = {};

  data.forEach((item) => {
    const date = new Date(item.date);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthKey = `${monthStart.toISOString().split("T")[0]}_${
      monthEnd.toISOString().split("T")[0]
    }`;

    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = [];
    }
    monthlyGroups[monthKey].push(item);
  });

  return Object.entries(monthlyGroups)
    .map(([monthKey, items]) => {
      const [startDate, endDate] = monthKey.split("_");
      const monthName = new Date(startDate).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
      });
      const stats = calculatePeriodStats(items, `${startDate} إلى ${endDate}`);
      return {
        title: `تقرير شهري - ${monthName}`,
        dateRange: `${startDate} إلى ${endDate}`,
        totalSites: items.reduce((sum, item) => sum + item.totalSites, 0),
        districts: [...new Set(items.map((item) => item.municipality))],
        data: generateAggregatedReport(items),
        highestSite: stats.highestSite,
        mostActiveDistrict: stats.mostActiveDistrict,
      };
    })
    .sort((a, b) => b.dateRange.localeCompare(a.dateRange))
    .slice(0, 6); // Last 6 months
}

function calculatePeriodStats(data: any[], dateRange: string) {
  const totalRecords = data.length;
  const totalSites = data.reduce((sum, item) => sum + item.totalSites, 0);

  // Find highest site type
  const siteTotals: Record<string, number> = {};
  data.forEach((item) => {
    Object.entries(item.siteCounts).forEach(([siteType, count]) => {
      siteTotals[siteType] = (siteTotals[siteType] || 0) + (count as number);
    });
  });

  const highestSite = Object.entries(siteTotals).reduce(
    (max, [type, count]) => (count > max.count ? { type, count } : max),
    { type: "المواقع المستكشفة", count: 0 }
  );

  // Find most active district
  const districtCounts = data.reduce((acc, item) => {
    acc[item.municipality] = (acc[item.municipality] || 0) + item.totalSites;
    return acc;
  }, {} as Record<string, number>);

  const mostActiveDistrict =
    Object.keys(districtCounts).length > 0
      ? Object.keys(districtCounts).reduce((a, b) =>
          districtCounts[a] > districtCounts[b] ? a : b
        )
      : "لا توجد بيانات";

  return {
    totalRecords,
    totalSites,
    highestSite,
    mostActiveDistrict,
    dateRange,
  };
}

function generateAggregatedReport(data: any[]) {
  if (data.length === 0) return { siteTypeTotals: {}, grandTotal: 0 };

  // Initialize site type totals for each district
  const siteTypeTotals: Record<string, Record<string, number>> = {};

  siteTypes.forEach((siteType) => {
    siteTypeTotals[siteType] = {};
    municipalities.forEach((district) => {
      siteTypeTotals[siteType][district] = 0;
    });
  });

  // Aggregate data
  data.forEach((item) => {
    Object.entries(item.siteCounts).forEach(([siteType, count]) => {
      if (siteTypeTotals[siteType]) {
        siteTypeTotals[siteType][item.municipality] += count as number;
      }
    });
  });

  // Calculate grand total
  const grandTotal = Object.values(siteTypeTotals).reduce(
    (total, siteTypeData) => {
      return (
        total +
        Object.values(siteTypeData).reduce((sum, count) => sum + count, 0)
      );
    },
    0
  );

  return {
    siteTypeTotals,
    grandTotal,
  };
}

export async function exportReport(report: any, type: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const reportInfo = {
    type,
    report: report?.title || "تقرير",
    dateRange: report?.dateRange || "غير محدد",
  };
  console.log("Report exported:", reportInfo);
}
