import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Calendar, MapPin, Building2, Save, RotateCcw } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { submitPestControlData } from "../services/api";

interface SiteCounts {
  [key: string]: number;
}

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

// Updated to only include the 6 specific municipalities
const municipalities = [
  "العزيزية",
  "المعابدة",
  "الشرائع",
  "العتيبة",
  "الزيمة",
  "المشاعر",
];

export default function FieldWorkerForm() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    municipality: "",
    siteCounts: siteTypes.reduce(
      (acc, site) => ({ ...acc, [site]: 0 }),
      {} as SiteCounts
    ),
  });

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith("site_")) {
      const siteType = field.replace("site_", "");
      setFormData((prev) => ({
        ...prev,
        siteCounts: {
          ...prev.siteCounts,
          [siteType]: Number(value),
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      municipality: "",
      siteCounts: siteTypes.reduce(
        (acc, site) => ({ ...acc, [site]: 0 }),
        {} as SiteCounts
      ),
    });
    setShowConfirmation(false);
  };

  const handleSubmit = async () => {
    if (!formData.municipality) {
      showToast("يرجى تعبئة جميع الحقول المطلوبة", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPestControlData(formData);
      showToast("تم حفظ البيانات بنجاح", "success");
      resetForm();
    } catch (error) {
      showToast("حدث خطأ أثناء حفظ البيانات", "error");
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const totalSites = Object.values(formData.siteCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            نموذج إدخال البيانات الميدانية
          </h2>
          <p className="text-gray-600">يرجى تعبئة جميع البيانات بدقة</p>
        </div>

        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline ml-2" />
              التاريخ
            </label>
            <input
              type="date"
              value={formData.date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline ml-2" />
              البلدية *
            </label>
            <select
              value={formData.municipality}
              onChange={(e) =>
                handleInputChange("municipality", e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required>
              <option value="">اختر البلدية</option>
              {municipalities.map((municipality) => (
                <option key={municipality} value={municipality}>
                  {municipality}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Site Counts */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            المواقع المستهدفة
            <span className="text-sm font-normal text-gray-600 mr-2">
              (المجموع: {totalSites})
            </span>
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siteTypes.map((siteType, index) => (
              <div key={siteType} className="bg-gray-50 p-4 rounded-lg border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
                    {index + 1}
                  </span>
                  {siteType}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.siteCounts[siteType]}
                  onChange={(e) =>
                    handleInputChange(`site_${siteType}`, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 rtl:space-x-reverse">
          <button
            onClick={resetForm}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2 rtl:space-x-reverse">
            <RotateCcw className="w-4 h-4" />
            <span>إعادة تعيين</span>
          </button>

          <button
            onClick={() => setShowConfirmation(true)}
            disabled={!formData.municipality}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 rtl:space-x-reverse">
            <Save className="w-4 h-4" />
            <span>حفظ البيانات</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          date={formData.date}
          district={formData.municipality}
          totalSites={totalSites}
          isSubmitting={isSubmitting}
          onCancel={() => setShowConfirmation(false)}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  );
}

function ConfirmationModal({
  date,
  district,
  totalSites,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  date: string;
  district: string;
  totalSites: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          تأكيد الحفظ
        </h3>
        <div className="space-y-2 mb-6 text-sm">
          <p>
            <strong>التاريخ:</strong> {date}
          </p>
          <p>
            <strong>البلدية:</strong> {district}
          </p>
          <p>
            <strong>إجمالي المواقع:</strong> {totalSites}
          </p>
        </div>
        <p className="text-gray-600 mb-6 text-center">
          هل أنت متأكد من صحة البيانات المدخلة؟
        </p>
        <div className="flex space-x-4 rtl:space-x-reverse">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
            {isSubmitting ? "جاري الحفظ..." : "تأكيد الحفظ"}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
