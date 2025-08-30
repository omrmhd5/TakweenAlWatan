import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  BarChart3,
  FileText,
  LogOut,
  Calendar,
  MapPin,
  Building2,
  Menu,
} from "lucide-react";
import FieldWorkerForm from "./components/FieldWorkerForm";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import { useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./contexts/ToastContext";
import Toast from "./components/Toast";

function App() {
  const { isAuthenticated, login, logout } = useAuth();
  const [currentView, setCurrentView] = useState<"home" | "form" | "admin">(
    "home"
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ToastProvider>
      <div
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url(/BG.jpg)" }}>
        <div className="min-h-screen bg-white/90 backdrop-blur-sm">
          {/* Header */}
          <header className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <img
                    src="/Logo.png"
                    alt="شركة تكوين الوطن"
                    className="h-12 w-auto"
                  />
                  <div className="text-right rtl:text-right">
                    <h1 className="text-xl font-bold text-gray-900">
                      شركة تكوين الوطن
                    </h1>
                    <p className="text-sm text-gray-600">
                      نظام إدارة بيانات مكافحة الآفات
                    </p>
                  </div>
                </div>
                {/* Burger menu for mobile */}
                <button
                  className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none"
                  onClick={() => setMobileNavOpen((open) => !open)}
                  aria-label="Open navigation menu">
                  <Menu className="w-7 h-7" />
                </button>
              </div>
              {/* Main nav links */}
              <nav
                className={`flex-col md:flex-row md:flex items-center space-y-2 md:space-y-0 md:space-x-4 rtl:space-x-reverse transition-all duration-200 md:static ${
                  mobileNavOpen
                    ? "flex absolute top-full left-0 w-full bg-white shadow-lg p-4 z-40"
                    : "hidden md:flex"
                }`}>
                <button
                  onClick={() => {
                    setCurrentView("home");
                    setMobileNavOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === "home"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}>
                  الرئيسية
                </button>
                {/* Show form button only for non-authenticated users */}
                {!isAuthenticated && (
                  <button
                    onClick={() => {
                      setCurrentView("form");
                      setMobileNavOpen(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === "form"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}>
                    إدخال البيانات
                  </button>
                )}
                {!isAuthenticated ? (
                  <button
                    onClick={() => {
                      setCurrentView("admin");
                      setMobileNavOpen(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 rtl:space-x-reverse ${
                      currentView === "admin"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}>
                    <Shield className="w-4 h-4" />
                    <span>لوحة الإدارة</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setCurrentView("admin");
                        setMobileNavOpen(false);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 rtl:space-x-reverse ${
                        currentView === "admin"
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}>
                      <BarChart3 className="w-4 h-4" />
                      <span>لوحة الإدارة</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setMobileNavOpen(false);
                      }}
                      className="px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2 rtl:space-x-reverse">
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </>
                )}
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === "home" && (
              <HomePage
                setCurrentView={setCurrentView}
                isAuthenticated={isAuthenticated}
              />
            )}
            {currentView === "form" && <FieldWorkerForm />}
            {currentView === "admin" &&
              (isAuthenticated ? (
                <AdminDashboard />
              ) : (
                <AdminLogin onLogin={login} />
              ))}
          </main>
        </div>
        <Toast />
      </div>
    </ToastProvider>
  );
}

function HomePage({
  setCurrentView,
  isAuthenticated,
}: {
  setCurrentView: (view: "home" | "form" | "admin") => void;
  isAuthenticated: boolean;
}) {
  return (
    <div className="text-center space-y-12">
      {/* Hero Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          مشروع مكافحة البعوض الناقل لحمى الضنك بمكة المكرمة والقرى التابعة لها{" "}
        </h2>
        <div className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
          {/* Pyramid Layout for Team Members */}
          <div className="flex flex-col items-center space-y-6">
            {/* Top Level - Project Manager */}
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-700 mb-1">
                مدير مشروع
              </div>
              <div className="text-xl font-medium">م/ ماجد محمد ابو شناق</div>
            </div>

            {/* Middle Level - Youssef and Amro side by side */}
            <div className="flex justify-center space-x-12 rtl:space-x-reverse">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-700 mb-1">
                  مدير العمليات
                </div>
                <div className="text-xl font-medium">
                  م/ يوسف عبدالنور الفكي
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-700 mb-1">
                  مساعد مدير العمليات
                </div>
                <div className="text-xl font-medium">م/ عمرو محمد ناصف</div>
              </div>
            </div>

            {/* Bottom Level - Basheer and Shaker side by side */}
            <div className="flex justify-center space-x-12 rtl:space-x-reverse">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-700 mb-1">
                  مدير المكتب الفني
                </div>
                <div className="text-xl font-medium">بشير شبير احمد</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-700 mb-1">
                  الاداري
                </div>
                <div className="text-xl font-medium">شاكر الحسن الشريف</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              للموظفين{" "}
            </h3>
            <p className="text-gray-600 mb-4">
              إدخال سريع وسهل لبيانات المواقع المستهدفة
            </p>
            {!isAuthenticated && (
              <button
                onClick={() => setCurrentView("form")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                بدء إدخال البيانات
              </button>
            )}
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              للإدارة
            </h3>
            <p className="text-gray-600 mb-4">تقارير شاملة وإحصائيات تفصيلية</p>
            <button
              onClick={() => setCurrentView("admin")}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              {isAuthenticated ? "عرض لوحة الإدارة" : "دخول لوحة الإدارة"}
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 text-center transition-transform duration-200 hover:scale-105 hover:shadow-xl hover:bg-white/90 cursor-pointer">
          <Calendar className="w-10 h-10 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            تتبع يومي
          </h3>
          <p className="text-gray-600">
            متابعة البيانات اليومية والأسبوعية والشهرية
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 text-center transition-transform duration-200 hover:scale-105 hover:shadow-xl hover:bg-white/90 cursor-pointer">
          <MapPin className="w-10 h-10 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            تصنيف جغرافي
          </h3>
          <p className="text-gray-600">تنظيم البيانات حسب البلديات الستة</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 text-center transition-transform duration-200 hover:scale-105 hover:shadow-xl hover:bg-white/90 cursor-pointer">
          <FileText className="w-10 h-10 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            تقارير Excel
          </h3>
          <p className="text-gray-600">
            تصدير التقارير بصيغة Excel جاهزة للطباعة
          </p>
        </div>
      </div>

      {/* Site Types Overview */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          المواقع المستهدفة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          {[
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
          ].map((site, index) => (
            <div
              key={index}
              className="bg-gray-50 p-3 rounded-lg text-center border transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer">
              <span className="font-medium text-gray-700">{site}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Districts Overview */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          البلديات المستهدفة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            "العزيزية",
            "المعابدة",
            "الشرائع",
            "العتيبة",
            "الزيمة",
            "المشاعر المقدسة",
          ].map((district, index) => (
            <div
              key={index}
              className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200 transition-transform duration-200 hover:scale-105 hover:shadow-xl hover:border-blue-400 cursor-pointer">
              <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <span className="font-semibold text-blue-900">{district}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
