"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Plus,
  Search,
  Eye,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import AddPromoCodeForm from "./AddPromoCodeForm";
import EditPromoCodeForm from "./EditPromoCodeForm";

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
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function PromoCodesTab() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<string | null>(null);
  const [viewingPromo, setViewingPromo] = useState<PromoCode | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    promoId: null as string | null,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPromoCodes = useCallback(
    async (
      page: number = pagination.page,
      searchTerm: string = search,
      status: string = statusFilter,
      expiry: string = expiryFilter
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        if (searchTerm) params.append("search", searchTerm);
        if (status !== "all") params.append("status", status);
        if (expiry !== "all") params.append("expiry", expiry);

        const response = await fetch(`/api/admin/promos?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch promo codes");
        }

        const data = await response.json();
        setPromoCodes(data.promoCodes);
        setPagination(data.pagination);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error fetching promo codes";
        setError(errorMsg);
        showToast(errorMsg, "error");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, search, statusFilter, expiryFilter]
  );

  useEffect(() => {
    fetchPromoCodes(1, search, statusFilter, expiryFilter);
  }, [search, statusFilter, expiryFilter]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeletePromo = async () => {
    if (!deleteModal.promoId) return;

    setOperationLoading(true);
    try {
      const response = await fetch(`/api/admin/promos/${deleteModal.promoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete promo code");
      }

      showToast("Promo code deleted successfully", "success");
      setDeleteModal({ show: false, promoId: null });
      fetchPromoCodes(1);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error deleting promo code";
      showToast(errorMsg, "error");
    } finally {
      setOperationLoading(false);
    }
  };

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promo Codes</h2>
          <p className="text-sm text-gray-600">Manage promotional codes and discounts</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingPromo(null);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Promo Code</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search promo code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Expiry</option>
          <option value="active-expiry">Active (Not Expired)</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      )}

      {/* Table */}
      {!loading && promoCodes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {windowWidth >= 768 ? "Discount" : "Disc."}
                </th>
                {windowWidth >= 1024 && (
                  <>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Min Order</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Usage</th>
                  </>
                )}
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Expires</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promoCodes.map((promo) => (
                <motion.tr
                  key={promo._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">{promo.code}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatCurrency(promo.discountValue, promo.discountType)}
                  </td>
                  {windowWidth >= 1024 && (
                    <>
                      <td className="px-4 py-3 text-gray-700">₹{promo.minOrderAmount}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {promo.usedCount}/{promo.usageLimit}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isExpired(promo.expiryDate) ? (
                        <AlertCircle size={16} className="text-red-500" />
                      ) : (
                        <Clock size={16} className="text-green-500" />
                      )}
                      <span
                        className={
                          isExpired(promo.expiryDate) ? "text-red-600" : "text-green-600"
                        }
                      >
                        {formatDate(promo.expiryDate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        promo.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {promo.isActive ? (
                        <>
                          <CheckCircle2 size={12} /> Active
                        </>
                      ) : (
                        <>
                          <X size={12} /> Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewingPromo(promo)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => setEditingPromo(promo._id)}
                        className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({ show: true, promoId: promo._id })
                        }
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && promoCodes.length === 0 && (
        <div className="text-center py-12">
          <Tag size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No promo codes found</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Create First Promo Code
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() =>
              pagination.page > 1 &&
              fetchPromoCodes(pagination.page - 1, search, statusFilter, expiryFilter)
            }
            disabled={pagination.page === 1}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() =>
              pagination.page < pagination.pages &&
              fetchPromoCodes(pagination.page + 1, search, statusFilter, expiryFilter)
            }
            disabled={pagination.page === pagination.pages}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddForm || editingPromo) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingPromo ? "Edit Promo Code" : "Add New Promo Code"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingPromo(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                {showAddForm && !editingPromo ? (
                  <AddPromoCodeForm
                    onSuccess={() => {
                      setShowAddForm(false);
                      fetchPromoCodes(1);
                      showToast("Promo code created successfully", "success");
                    }}
                    onError={(err: string) => showToast(err, "error")}
                  />
                ) : editingPromo ? (
                  <EditPromoCodeForm
                    promoId={editingPromo}
                    onSuccess={() => {
                      setEditingPromo(null);
                      fetchPromoCodes(pagination.page);
                      showToast("Promo code updated successfully", "success");
                    }}
                    onError={(err: string) => showToast(err, "error")}
                  />
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewingPromo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Promo Code Details</h3>
                <button
                  onClick={() => setViewingPromo(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Code</p>
                    <p className="font-semibold text-gray-900">{viewingPromo.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold">
                      <span
                        className={
                          viewingPromo.isActive
                            ? "text-green-600"
                            : "text-gray-600"
                        }
                      >
                        {viewingPromo.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Discount</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(viewingPromo.discountValue, viewingPromo.discountType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Minimum Order</p>
                    <p className="font-semibold text-gray-900">₹{viewingPromo.minOrderAmount}</p>
                  </div>
                  {viewingPromo.maxDiscountAmount && (
                    <div>
                      <p className="text-sm text-gray-600">Max Discount</p>
                      <p className="font-semibold text-gray-900">
                        ₹{viewingPromo.maxDiscountAmount}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Usage Limit</p>
                    <p className="font-semibold text-gray-900">
                      {viewingPromo.usedCount}/{viewingPromo.usageLimit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(viewingPromo.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p
                      className={
                        isExpired(viewingPromo.expiryDate)
                          ? "font-semibold text-red-600"
                          : "font-semibold text-green-600"
                      }
                    >
                      {formatDate(viewingPromo.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-sm w-full"
            >
              <div className="p-6 text-center space-y-4">
                <AlertCircle size={48} className="mx-auto text-red-600" />
                <h3 className="text-lg font-bold text-gray-900">Delete Promo Code?</h3>
                <p className="text-gray-600">
                  This action cannot be undone. The promo code will be permanently deleted.
                </p>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setDeleteModal({ show: false, promoId: null })}
                    disabled={operationLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePromo}
                    disabled={operationLoading}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {operationLoading && <Loader2 size={16} className="animate-spin" />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
