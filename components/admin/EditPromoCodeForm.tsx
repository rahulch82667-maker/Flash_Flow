"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface EditPromoCodeFormProps {
  promoId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface PromoCode {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  userUsageLimit: number;
  startDate: string;
  expiryDate: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
  isActive: boolean;
}

export default function EditPromoCodeForm({
  promoId,
  onSuccess,
  onError,
}: EditPromoCodeFormProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promoData, setPromoData] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    discountValue: 0,
    usageLimit: 1,
    userUsageLimit: 1,
    maxDiscountAmount: "" as string | number,
    expiryDate: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const response = await fetch(`/api/admin/promos/${promoId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch promo code");
        }
        const data = await response.json();
        const promo = data.promoCode;
        setPromoData(promo);
        setFormData({
          discountValue: promo.discountValue,
          usageLimit: promo.usageLimit,
          userUsageLimit: promo.userUsageLimit,
          maxDiscountAmount: promo.maxDiscountAmount || "",
          expiryDate: new Date(promo.expiryDate).toISOString().slice(0, 16),
          isActive: promo.isActive,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error loading promo code";
        onError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, [promoId, onError]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.discountValue <= 0) {
      newErrors.discountValue = "Discount value must be greater than 0";
    }

    if (promoData?.discountType === "percentage" && formData.discountValue > 100) {
      newErrors.discountValue = "Percentage discount cannot exceed 100";
    }

    if (formData.usageLimit < 1) {
      newErrors.usageLimit = "Usage limit must be at least 1";
    }

    if (formData.userUsageLimit < 1) {
      newErrors.userUsageLimit = "User usage limit must be at least 1";
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    }

    if (formData.expiryDate && promoData?.startDate) {
      const expiry = new Date(formData.expiryDate);
      const start = new Date(promoData.startDate);
      if (expiry <= start) {
        newErrors.expiryDate = "Expiry date must be greater than start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !promoData) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/promos/${promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountValue: formData.discountValue,
          usageLimit: formData.usageLimit,
          userUsageLimit: formData.userUsageLimit,
          maxDiscountAmount: formData.maxDiscountAmount
            ? Number(formData.maxDiscountAmount)
            : null,
          expiryDate: new Date(formData.expiryDate).toISOString(),
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update promo code");
      }

      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error updating promo code";
      onError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!promoData) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={40} className="mx-auto text-red-600 mb-2" />
        <p className="text-gray-600">Failed to load promo code</p>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value: number, type: string) => {
    return type === "percentage" ? `${value}%` : `₹${value}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Read-only fields */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900">Promo Code Information (Read-only)</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Code</p>
            <p className="font-semibold text-gray-900">{promoData.code}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Discount Type</p>
            <p className="font-semibold text-gray-900">
              {promoData.discountType === "percentage" ? "Percentage (%)" : "Fixed (₹)"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Min Order Amount</p>
            <p className="font-semibold text-gray-900">₹{promoData.minOrderAmount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Start Date</p>
            <p className="font-semibold text-gray-900">{formatDate(promoData.startDate)}</p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Edit Promo Code</h3>

        {/* Discount Value */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Discount Value *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="discountValue"
              value={formData.discountValue}
              onChange={handleInputChange}
              placeholder="0"
              className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.discountValue ? "border-red-500" : "border-gray-300"
              }`}
            />
            <span className="text-gray-600 font-semibold min-w-12">
              {promoData.discountType === "percentage" ? "%" : "₹"}
            </span>
          </div>
          {errors.discountValue && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.discountValue}
            </p>
          )}
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Total Usage Limit *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              ({promoData.usedCount}/{formData.usageLimit} used)
            </p>
            <input
              type="number"
              name="usageLimit"
              value={formData.usageLimit}
              onChange={handleInputChange}
              placeholder="1"
              min="1"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.usageLimit ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.usageLimit && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.usageLimit}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Per User Usage Limit *
            </label>
            <input
              type="number"
              name="userUsageLimit"
              value={formData.userUsageLimit}
              onChange={handleInputChange}
              placeholder="1"
              min="1"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.userUsageLimit ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.userUsageLimit && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.userUsageLimit}
              </p>
            )}
          </div>
        </div>

        {/* Max Discount Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Maximum Discount Amount (Optional)
          </label>
          <input
            type="number"
            name="maxDiscountAmount"
            value={formData.maxDiscountAmount}
            onChange={handleInputChange}
            placeholder="Leave empty for no limit"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Expiry Date *
          </label>
          <input
            type="datetime-local"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.expiryDate ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.expiryDate && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.expiryDate}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            name="isActive"
            id="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
            {formData.isActive ? "Active" : "Inactive"} - Click to toggle
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {submitting ? "Updating..." : "Update Promo Code"}
        </button>
      </div>
    </form>
  );
}
