"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface AddPromoCodeFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

const categories = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "kids", label: "Kids" },
  { value: "beauty", label: "Beauty" },
  { value: "home", label: "Home" },
];

export default function AddPromoCodeForm({ onSuccess, onError }: AddPromoCodeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: "",
    usageLimit: 1,
    userUsageLimit: 1,
    startDate: "",
    expiryDate: "",
    applicableCategories: [] as string[],
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) newErrors.code = "Promo code is required";
    if (formData.discountValue <= 0) newErrors.discountValue = "Discount value must be greater than 0";
    if (formData.discountType === "percentage" && formData.discountValue > 100) {
      newErrors.discountValue = "Percentage discount cannot exceed 100";
    }
    if (formData.minOrderAmount < 0) newErrors.minOrderAmount = "Minimum order amount cannot be negative";
    if (formData.usageLimit < 1) newErrors.usageLimit = "Usage limit must be at least 1";
    if (formData.userUsageLimit < 1) newErrors.userUsageLimit = "User usage limit must be at least 1";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required";
    if (formData.startDate && formData.expiryDate) {
      const start = new Date(formData.startDate);
      const expiry = new Date(formData.expiryDate);
      if (expiry <= start) {
        newErrors.expiryDate = "Expiry date must be greater than start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(category)
        ? prev.applicableCategories.filter((c) => c !== category)
        : [...prev.applicableCategories, category],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxDiscountAmount: formData.maxDiscountAmount
            ? Number(formData.maxDiscountAmount)
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create promo code");
      }

      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error creating promo code";
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Promo Code */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Promo Code *
        </label>
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          placeholder="e.g., SAVE20"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.code ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.code && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} /> {errors.code}
          </p>
        )}
      </div>

      {/* Discount Type and Value */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Discount Type *
          </label>
          <select
            name="discountType"
            value={formData.discountType}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (₹)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Discount Value *
          </label>
          <input
            type="number"
            name="discountValue"
            value={formData.discountValue}
            onChange={handleInputChange}
            placeholder="0"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.discountValue ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.discountValue && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.discountValue}
            </p>
          )}
        </div>
      </div>

      {/* Minimum Order, Max Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Minimum Order Amount *
          </label>
          <input
            type="number"
            name="minOrderAmount"
            value={formData.minOrderAmount}
            onChange={handleInputChange}
            placeholder="0"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.minOrderAmount ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.minOrderAmount && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.minOrderAmount}
            </p>
          )}
        </div>

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
      </div>

      {/* Usage Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Total Usage Limit *
          </label>
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

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="datetime-local"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.startDate ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.startDate}
            </p>
          )}
        </div>

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
      </div>

      {/* Applicable Categories */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Applicable Categories (Optional)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.applicableCategories.includes(cat.value)}
                onChange={() => handleCategoryChange(cat.value)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          id="isActive"
          checked={formData.isActive}
          onChange={handleInputChange}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
          Activate this promo code immediately
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Creating..." : "Create Promo Code"}
        </button>
      </div>
    </form>
  );
}
