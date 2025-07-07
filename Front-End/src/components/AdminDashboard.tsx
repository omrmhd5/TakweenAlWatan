import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Download, Filter, TrendingUp, MapPin, Building2, FileText, Users, Target, Eye, X, Search } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { getPestControlData, exportReport, searchReports } from '../services/api';

interface DashboardData {
  dailyReports: any[];
  weeklyReports: any[];
  monthlyReports: any[];
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

const districts = ['العزيزية', 'المعابدة', 'الشرائع', 'العتيبة', 'الزيمة', 'المشاعر'];
const siteTypes = [
  'المواقع المستكشفة', 'المواقع السلبية', 'المواقع الايجابية', 'المواقع الدائمة',
  'تجمعات مياه', 'سقيا الطيور', 'مناهل مكشوفة', 'الاحواش المهجورة',
  'مباني تحت الانشاء', 'الحدائق العامة', 'المساجد', 'مجاري تصريف',
  'الاحواض الاسمنتية', 'إطارات سيارات', 'مزهريات', 'الحالات المباشرة', 'بلاغات 940'
];

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    districts: [] as string[],
    reportType: 'all' as 'daily' | 'weekly' | 'monthly' | 'all'
  });

  const [searchFilters, setSearchFilters] = useState({
    startDate: '',
    endDate: '',
    districts: [] as string[]
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await getPestControlData({});
      setDashboardData(data);
    } catch (error) {
      showToast('حدث خطأ أثناء تحميل البيانات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleDownloadReport = async (report: any, type: string) => {
    try {
      await exportReport(report, type, filters.districts);
      showToast(`تم تصدير التقرير ${type === 'daily' ? 'اليومي' : type === 'weekly' ? 'الأسبوعي' : 'الشهري'} بنجاح`, 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
  };

  const handleDistrictChange = (district: string, isSearch = false) => {
    const targetFilters = isSearch ? searchFilters : filters;
    const setTargetFilters = isSearch ? setSearchFilters : setFilters;
    
    setTargetFilters(prev => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter(d => d !== district)
        : [...prev.districts, district]
    }));
  };

  const handleCustomExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      showToast('يرجى تحديد تاريخ البداية والنهاية', 'error');
      return;
    }

    if (new Date(filters.startDate) > new Date(today) || new Date(filters.endDate) > new Date(today)) {
      showToast('لا يمكن تحديد تواريخ مستقبلية', 'error');
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      showToast('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'error');
      return;
    }

    try {
      await exportReport(null, filters.reportType, filters.districts, filters.startDate, filters.endDate);
      showToast('تم تصدير التقرير المخصص بنجاح', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
  };

  const handleSearch = async () => {
    if (!searchFilters.startDate) {
      showToast('يرجى تحديد تاريخ البداية على الأقل', 'error');
      return;
    }

    if (new Date(searchFilters.startDate) > new Date(today)) {
      showToast('لا يمكن البحث في تواريخ مستقبلية', 'error');
      return;
    }

    if (searchFilters.endDate && new Date(searchFilters.startDate) > new Date(searchFilters.endDate)) {
      showToast('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'error');
      return;
    }

    try {
      const results = await searchReports(searchFilters);
      setSearchResults(results);
      setShowSearchResults(true);
      showToast(`تم العثور على ${results.totalReports} تقرير`, 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء البحث', 'error');
    }
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

  const currentStats = dashboardData?.statistics[activeTab];
  const currentReports = showSearchResults ? 
    (searchResults?.[`${activeTab}Reports`] || []) : 
    (dashboardData?.[`${activeTab}Reports`] || []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">لوحة الإدارة</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البداية *</label>
            <input
              type="date"
              max={today}
              value={searchFilters.startDate}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ النهاية (اختياري)</label>
            <input
              type="date"
              max={today}
              value={searchFilters.endDate}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
            >
              <Search className="w-4 h-4" />
              <span>بحث</span>
            </button>
          </div>
        </div>

        {/* Search Districts Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الأحياء المحددة للبحث</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchFilters(prev => ({ 
                ...prev, 
                districts: prev.districts.length === districts.length ? [] : [...districts] 
              }))}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                searchFilters.districts.length === districts.length
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {searchFilters.districts.length === districts.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </button>
            {districts.map(district => (
              <button
                key={district}
                onClick={() => handleDistrictChange(district, true)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  searchFilters.districts.includes(district)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {district}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {searchFilters.districts.length === 0 ? 'جميع الأحياء' : `${searchFilters.districts.length} من ${districts.length} محدد`}
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
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                إظهار جميع التقارير
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Export Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Download className="w-5 h-5 ml-2" />
          تصدير تقرير مخصص
        </h3>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              max={today}
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              max={today}
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع التقارير</option>
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCustomExport}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
            >
              <Download className="w-4 h-4" />
              <span>تصدير</span>
            </button>
          </div>
        </div>

        {/* Districts Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الأحياء المحددة للتصدير</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, districts: prev.districts.length === districts.length ? [] : [...districts] }))}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.districts.length === districts.length
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filters.districts.length === districts.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </button>
            {districts.map(district => (
              <button
                key={district}
                onClick={() => handleDistrictChange(district, false)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.districts.includes(district)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {district}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {filters.districts.length === 0 ? 'جميع الأحياء' : `${filters.districts.length} من ${districts.length} محدد`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 rtl:space-x-reverse px-6">
            {[
              { key: 'daily', label: 'التقارير اليومية', icon: Calendar },
              { key: 'weekly', label: 'التقارير الأسبوعية', icon: BarChart3 },
              { key: 'monthly', label: 'التقارير الشهرية', icon: TrendingUp }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 rtl:space-x-reverse ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Statistics Cards for Current Tab */}
        {currentStats && !showSearchResults && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              إحصائيات {activeTab === 'daily' ? 'يومية' : activeTab === 'weekly' ? 'أسبوعية' : 'شهرية'}
              {currentStats.dateRange && (
                <span className="text-sm font-normal text-gray-600 mr-2">({currentStats.dateRange})</span>
              )}
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">إجمالي التسجيلات</p>
                    <p className="text-2xl font-bold text-blue-900">{currentStats.totalRecords}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">إجمالي المواقع</p>
                    <p className="text-2xl font-bold text-green-900">{currentStats.totalSites}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">الموقع الأعلى</p>
                    <p className="text-sm font-bold text-orange-900">{currentStats.highestSite.type}</p>
                    <p className="text-lg font-bold text-orange-900">({currentStats.highestSite.count})</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">الحي الأكثر نشاطاً</p>
                    <p className="text-lg font-bold text-purple-900">{currentStats.mostActiveDistrict}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {showSearchResults ? 'نتائج البحث - ' : ''}
            التقارير {activeTab === 'daily' ? 'اليومية' : activeTab === 'weekly' ? 'الأسبوعية' : 'الشهرية'}
          </h4>
          
          {currentReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {showSearchResults ? 'لا توجد تقارير تطابق معايير البحث' : 'لا توجد تقارير متاحة'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {currentReports.map((report, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{report.title}</h5>
                    <p className="text-sm text-gray-600">{report.dateRange}</p>
                    <p className="text-sm text-gray-600">إجمالي المواقع: {report.totalSites}</p>
                    {report.districts && (
                      <p className="text-xs text-gray-500">الأحياء: {report.districts.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 rtl:space-x-reverse"
                    >
                      <Eye className="w-4 h-4" />
                      <span>عرض</span>
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report, activeTab)}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 rtl:space-x-reverse"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل</span>
                    </button>
                  </div>
                </div>
              ))}
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
    </div>
  );
}

function ReportModal({ report, onClose, onDownload }: { report: any; onClose: () => void; onDownload: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={onDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Download className="w-4 h-4" />
              <span>تحميل</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-600">الفترة: {report.dateRange}</p>
            <p className="text-sm text-gray-600">إجمالي المواقع: {report.totalSites}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع الموقع
                  </th>
                  {districts.map(district => (
                    <th key={district} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {district}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-100">
                    المجموع
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {siteTypes.map((siteType, index) => {
                  const rowData = report.data?.siteTypeTotals?.[siteType] || {};
                  const rowTotal = districts.reduce((sum, district) => sum + (rowData[district] || 0), 0);
                  
                  return (
                    <tr key={siteType} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {siteType}
                      </td>
                      {districts.map(district => (
                        <td key={district} className="px-4 py-3 text-center text-sm text-gray-900">
                          {rowData[district] || 0}
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
                  {districts.map(district => {
                    const districtTotal = siteTypes.reduce((sum, siteType) => {
                      return sum + (report.data?.siteTypeTotals?.[siteType]?.[district] || 0);
                    }, 0);
                    return (
                      <td key={district} className="px-4 py-3 text-center text-sm font-bold text-blue-900">
                        {districtTotal}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center text-sm font-bold text-blue-900">
                    {report.data?.grandTotal || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}