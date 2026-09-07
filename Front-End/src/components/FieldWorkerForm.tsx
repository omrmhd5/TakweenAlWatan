import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Calendar,
  MapPin,
  Building2,
  Save,
  RotateCcw,
  User,
  Shield,
  MessageSquare,
  Navigation,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { submitPestControlData } from "../services/api";
import { districtsByMunicipality, controlTypes } from "../services/api";
import { useTranslation } from "react-i18next";
import { SITE_TYPES, MUNICIPALITIES, labelOf } from "../lib/domain";

interface Coordinates {
  latitude: number;
  longitude: number;
}

const siteTypes = SITE_TYPES;
const municipalities = [...MUNICIPALITIES];

export default function FieldWorkerForm() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customDistrict, setCustomDistrict] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "pending"
  >("pending");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    municipality: "",
    district: "",
    workerName: "",
    controlType: "",
    siteCounts: siteTypes.reduce(
      (acc, site) => ({ ...acc, [site]: "" }),
      {} as { [key: string]: string }
    ),
    bgTraps: { isPositive: false, count: "" },
    smartTraps: { isPositive: false, count: "" },
    comment: "",
  });

  // Get user location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast(t("form.geoUnsupported"), "error");
      setLocationPermission("denied");
      return;
    }

    setLocationPermission("pending");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationPermission("granted");
        showToast(t("form.geoOk"), "success");
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationPermission("denied");
        showToast(t("form.geoFail"), "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    if (field.startsWith("site_")) {
      const siteType = field.replace("site_", "");
      setFormData((prev) => {
        let newValue = value;
        if (
          prev.siteCounts[siteType] === "" &&
          typeof value === "string" &&
          value.length === 1 &&
          value !== "0"
        ) {
          newValue = value; // replace empty with new digit
        } else if (typeof value === "string" && value === "") {
          newValue = "";
        } else if (typeof value === "number") {
          newValue = value.toString();
        } else if (typeof value === "boolean") {
          newValue = value ? "1" : "0";
        }
        return {
          ...prev,
          siteCounts: {
            ...prev.siteCounts,
            [siteType]: newValue as string,
          },
        };
      });
    } else if (
      field === "bgTraps.isPositive" ||
      field === "smartTraps.isPositive"
    ) {
      const trapType = field.split(".")[0] as "bgTraps" | "smartTraps";
      const isPositive = value as boolean;
      setFormData((prev) => ({
        ...prev,
        [trapType]: {
          ...prev[trapType],
          isPositive,
          count: isPositive ? prev[trapType].count : "",
        },
      }));
    } else if (field === "bgTraps.count" || field === "smartTraps.count") {
      const trapType = field.split(".")[0] as "bgTraps" | "smartTraps";
      setFormData((prev) => {
        let newValue = value;
        if (
          prev[trapType].count === "" &&
          typeof value === "string" &&
          value.length === 1 &&
          value !== "0"
        ) {
          newValue = value; // replace empty with new digit
        } else if (typeof value === "string" && value === "") {
          newValue = "";
        } else if (typeof value === "number") {
          newValue = value.toString();
        } else if (typeof value === "boolean") {
          newValue = value ? "1" : "0";
        }
        return {
          ...prev,
          [trapType]: {
            ...prev[trapType],
            count: newValue as string,
          },
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      municipality: "",
      district: "",
      workerName: "",
      controlType: "",
      siteCounts: siteTypes.reduce(
        (acc, site) => ({ ...acc, [site]: "" }),
        {} as { [key: string]: string }
      ),
      bgTraps: { isPositive: false, count: "" },
      smartTraps: { isPositive: false, count: "" },
      comment: "",
    });
    setCustomDistrict("");
    setShowConfirmation(false);
  };

  const handleSubmit = async () => {
    if (!formData.municipality) {
      showToast(t("form.needMunicipality"), "error");
      return;
    }
    if (!formData.district) {
      showToast(t("form.needDistrict"), "error");
      return;
    }
    if (!formData.workerName) {
      showToast(t("form.needWorker"), "error");
      return;
    }
    if (!formData.controlType) {
      showToast(t("form.needControl"), "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert empty string number fields to 0 before submitting
      const submitData = {
        ...formData,
        siteCounts: Object.fromEntries(
          Object.entries(formData.siteCounts).map(([k, v]) => [
            k,
            v === "" ? 0 : Number(v),
          ])
        ),
        bgTraps: {
          ...formData.bgTraps,
          count:
            formData.bgTraps.count === "" ? 0 : Number(formData.bgTraps.count),
        },
        smartTraps: {
          ...formData.smartTraps,
          count:
            formData.smartTraps.count === ""
              ? 0
              : Number(formData.smartTraps.count),
        },
        coordinates: coordinates || undefined,
      };
      await submitPestControlData(submitData);
      showToast(t("form.saved"), "success");
      resetForm();
    } catch (error) {
      showToast(t("form.saveError"), "error");
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const totalSites = Object.values(formData.siteCounts).reduce(
    (sum, count) => sum + (count === "" ? 0 : Number(count)),
    0
  );

  // Get available districts for selected municipality
  const getAvailableDistricts = () => {
    if (!formData.municipality) return [];

    // Special case for المشاعر المقدسة which doesn't have "بلدية" prefix
    let municipalityKey: keyof typeof districtsByMunicipality;
    if (formData.municipality === "المشاعر المقدسة") {
      municipalityKey = "المشاعر المقدسة";
    } else {
      municipalityKey =
        `بلدية ${formData.municipality}` as keyof typeof districtsByMunicipality;
    }
    return districtsByMunicipality[municipalityKey] || [];
  };

  const availableDistricts = getAvailableDistricts();

  // Determine which fields should be enabled based on control type
  const isPreventiveControl = formData.controlType === "مكافحة وقائية";
  const isTrapControl =
    formData.controlType === "يرقي" || formData.controlType === "بالغ";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t("form.title")}
          </h2>
          <p className="text-gray-600">{t("form.subtitle")}</p>
        </div>

        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline me-2" />
              {t("form.date")}
            </label>
            <input
              type="date"
              value={formData.date}
              min="2025-01-01"
              max="2035-12-31"
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline me-2" />
              {t("form.controlType")} *
            </label>
            <select
              value={formData.controlType}
              onChange={(e) => handleInputChange("controlType", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required>
              <option value="">{t("form.selectControlType")}</option>
              {controlTypes.map((type) => (
                <option key={type} value={type}>
                  {labelOf(t, "controlTypes", type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline me-2" />
              {t("form.municipality")} *
            </label>
            <select
              value={formData.municipality}
              onChange={(e) => {
                handleInputChange("municipality", e.target.value);
                // Reset district when municipality changes
                handleInputChange("district", "");
                setCustomDistrict("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required>
              <option value="">{t("form.selectMunicipality")}</option>
              {municipalities.map((municipality) => (
                <option key={municipality} value={municipality}>
                  {labelOf(t, "municipalities", municipality)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline me-2" />
              {t("form.district")} *
            </label>
            <div className="space-y-2">
              <select
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
                disabled={!formData.municipality}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                required>
                <option value="">{t("form.selectDistrict")}</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {labelOf(t, "districts", district)}
                  </option>
                ))}
              </select>

              <div className="text-center">
                <span className="text-sm text-gray-500">{t("form.or")}</span>
              </div>

              <input
                type="text"
                placeholder={t("form.customDistrict")}
                value={customDistrict}
                onChange={(e) => {
                  setCustomDistrict(e.target.value);
                  handleInputChange("district", e.target.value);
                }}
                disabled={!formData.municipality}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline me-2" />
              {t("form.workerName")} *
            </label>
            <input
              type="text"
              value={formData.workerName}
              onChange={(e) => handleInputChange("workerName", e.target.value)}
              placeholder={t("form.workerPlaceholder")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Location Status */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Navigation className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {t("form.locationStatus")}
              </span>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  locationPermission === "granted"
                    ? "bg-green-100 text-green-800"
                    : locationPermission === "denied"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                {locationPermission === "granted"
                  ? t("form.locationGranted")
                  : locationPermission === "denied"
                  ? t("form.locationDenied")
                  : t("form.locationPending")}
              </span>
            </div>
            <button
              onClick={getCurrentLocation}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              {t("form.refreshLocation")}
            </button>
          </div>
          {coordinates && (
            <div className="mt-2 text-sm text-gray-600">
              {t("form.coordinates")}: {coordinates.latitude.toFixed(6)},{" "}
              {coordinates.longitude.toFixed(6)}
            </div>
          )}
        </div>

        {/* Trap Fields */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            {t("form.traps")}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* BG Traps */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {t("form.bgTraps")}
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.bgTraps.isPositive}
                      onChange={(e) =>
                        handleInputChange(
                          "bgTraps.isPositive",
                          e.target.checked
                        )
                      }
                      disabled={!isTrapControl}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="me-2 text-sm font-medium text-gray-700">
                      {t("form.positive")}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!formData.bgTraps.isPositive}
                      onChange={(e) =>
                        handleInputChange(
                          "bgTraps.isPositive",
                          !e.target.checked
                        )
                      }
                      disabled={!isTrapControl}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="me-2 text-sm font-medium text-gray-700">
                      {t("form.negative")}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.count")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.bgTraps.count}
                    onChange={(e) =>
                      handleInputChange("bgTraps.count", e.target.value)
                    }
                    disabled={!formData.bgTraps.isPositive || !isTrapControl}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Smart Traps */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {t("form.smartTraps")}
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.smartTraps.isPositive}
                      onChange={(e) =>
                        handleInputChange(
                          "smartTraps.isPositive",
                          e.target.checked
                        )
                      }
                      disabled={!isTrapControl}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="me-2 text-sm font-medium text-gray-700">
                      {t("form.positive")}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!formData.smartTraps.isPositive}
                      onChange={(e) =>
                        handleInputChange(
                          "smartTraps.isPositive",
                          !e.target.checked
                        )
                      }
                      disabled={!isTrapControl}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="me-2 text-sm font-medium text-gray-700">
                      {t("form.negative")}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.count")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.smartTraps.count}
                    onChange={(e) =>
                      handleInputChange("smartTraps.count", e.target.value)
                    }
                    disabled={!formData.smartTraps.isPositive || !isTrapControl}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Site Counts */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            {t("form.sites")}
            <span className="text-sm font-normal text-gray-600 me-2">
              ({t("form.total")}: {totalSites})
            </span>
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siteTypes.map((siteType, index) => (
              <div key={siteType} className="bg-gray-50 p-4 rounded-lg border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full me-2">
                    {index + 1}
                  </span>
                  {labelOf(t, "sites", siteType)}
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.siteCounts[siteType]}
                  onChange={(e) =>
                    handleInputChange(`site_${siteType}`, e.target.value)
                  }
                  disabled={!isPreventiveControl}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Comment Field */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline me-2" />
            {t("form.comment")}
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => handleInputChange("comment", e.target.value)}
            placeholder={t("form.commentPlaceholder")}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 rtl:space-x-reverse">
          <button
            onClick={resetForm}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2 rtl:space-x-reverse">
            <RotateCcw className="w-4 h-4" />
            <span>{t("form.reset")}</span>
          </button>

          <button
            onClick={() => setShowConfirmation(true)}
            disabled={
              !formData.municipality ||
              !formData.district ||
              !formData.workerName ||
              !formData.controlType
            }
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 rtl:space-x-reverse">
            <Save className="w-4 h-4" />
            <span>{t("form.save")}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          date={formData.date}
          municipality={formData.municipality}
          district={formData.district}
          workerName={formData.workerName}
          controlType={formData.controlType}
          totalSites={totalSites}
          bgTraps={{
            ...formData.bgTraps,
            count:
              formData.bgTraps.count === ""
                ? 0
                : Number(formData.bgTraps.count),
          }}
          smartTraps={{
            ...formData.smartTraps,
            count:
              formData.smartTraps.count === ""
                ? 0
                : Number(formData.smartTraps.count),
          }}
          comment={formData.comment}
          coordinates={coordinates}
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
  municipality,
  district,
  workerName,
  controlType,
  totalSites,
  bgTraps,
  smartTraps,
  comment,
  coordinates,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  date: string;
  municipality: string;
  district: string;
  workerName: string;
  controlType: string;
  totalSites: number;
  bgTraps: { isPositive: boolean; count: number };
  smartTraps: { isPositive: boolean; count: number };
  comment: string;
  coordinates: Coordinates | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          {t("form.confirmTitle")}
        </h3>
        <div className="space-y-2 mb-6 text-sm">
          <p>
            <strong>{t("form.date")}:</strong> {date}
          </p>
          <p>
            <strong>{t("form.controlType")}:</strong>{" "}
            {labelOf(t, "controlTypes", controlType)}
          </p>
          <p>
            <strong>{t("form.municipality")}:</strong>{" "}
            {labelOf(t, "municipalities", municipality)}
          </p>
          <p>
            <strong>{t("form.district")}:</strong>{" "}
            {labelOf(t, "districts", district)}
          </p>
          <p>
            <strong>{t("form.workerName")}:</strong> {workerName}
          </p>
          <p>
            <strong>{t("form.sites")}:</strong> {totalSites}
          </p>
          <p>
            <strong>{t("form.bgTraps")}:</strong>{" "}
            {bgTraps.isPositive
              ? `${t("form.positive")} (${bgTraps.count})`
              : t("form.negative")}
          </p>
          <p>
            <strong>{t("form.smartTraps")}:</strong>{" "}
            {smartTraps.isPositive
              ? `${t("form.positive")} (${smartTraps.count})`
              : t("form.negative")}
          </p>
          {coordinates && (
            <p>
              <strong>{t("form.coordinates")}:</strong> {coordinates.latitude.toFixed(6)},{" "}
              {coordinates.longitude.toFixed(6)}
            </p>
          )}
          {comment && (
            <p>
              <strong>{t("form.comment")}:</strong> {comment}
            </p>
          )}
        </div>
        <p className="text-gray-600 mb-6 text-center">
          {t("form.confirmBody")}
        </p>
        <div className="flex justify-center space-x-4 rtl:space-x-reverse">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors">
            {t("form.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2 rtl:space-x-reverse">
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isSubmitting ? t("form.saving") : t("form.confirm")}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
