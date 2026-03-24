"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  SortDesc,
  User,
  Mail,
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchAllPayments,
  fetchPaymentById,
  fetchPaymentStats,
  setSelectedPayment,
  setSearchTerm,
  setFilterByStatus,
  setFilterByMethod,
  setSortBy,
  setPage,
  clearError,
  resetFilters,
  AdminPayment,
} from "@/lib/redux/features/adminPayments/adminPaymentsSlice";

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-600 border-yellow-200",
  succeeded: "bg-green-100 text-green-600 border-green-200",
  failed: "bg-red-100 text-red-600 border-red-200",
  refunded: "bg-purple-100 text-purple-600 border-purple-200",
};

const paymentStatusIcons = {
  pending: Clock,
  succeeded: CheckCircle,
  failed: XCircle,
  refunded: AlertCircle,
};

export default function PaymentsTab() {
  const dispatch = useAppDispatch();
  const {
    payments,
    filteredPayments,
    selectedPayment,
    stats,
    loading,
    error,
    searchTerm,
    filterByStatus,
    filterByMethod,
    sortBy,
    pagination,
  } = useAppSelector((state) => state.adminPayments);

  // Local state
  const [viewModal, setViewModal] = useState(false);
  const [statsModal, setStatsModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Fetch payments on mount and when dependencies change
  useEffect(() => {
    dispatch(fetchAllPayments({
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm,
      status: filterByStatus,
      method: filterByMethod,
      sortBy,
    }));
    dispatch(fetchPaymentStats());
  }, [dispatch, pagination.page, pagination.limit, searchTerm, filterByStatus, filterByMethod, sortBy]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearchTerm(localSearch));
      dispatch(setPage(1));
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, dispatch]);

  // Handle error
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  const handleViewPayment = async (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    const result = await dispatch(fetchPaymentById(paymentId));
    if (fetchPaymentById.fulfilled.match(result)) {
      setViewModal(true);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-200">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="text-[#5D5FEF] font-black text-xs tracking-widest uppercase">
              Payment Management
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B2559] tracking-tight">
            Payments
          </h2>
          <p className="text-[#A3AED0] font-semibold text-xs sm:text-sm mt-1">
            View all payment transactions - {pagination.total} total payments
          </p>
        </div>

        {/* Stats Button */}
        <button
          onClick={() => setStatsModal(true)}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-[#1B2559] rounded-xl font-black text-sm sm:text-base hover:shadow-xl transition-all active:scale-95 whitespace-nowrap border border-gray-200"
        >
          <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />
          View Statistics
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by payment ID, order ID, user..."
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl bg-[#F4F7FE] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white font-semibold text-sm transition-all outline-none text-[#1B2559]"
              />
            </div>

            {/* Filter by Status */}
            <div className="sm:w-40 relative">
              <Filter size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
              <select
                value={filterByStatus}
                onChange={(e) => dispatch(setFilterByStatus(e.target.value))}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl bg-[#F4F7FE] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white font-semibold text-sm transition-all outline-none text-[#1B2559] appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="succeeded">Succeeded</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Filter by Method */}
            <div className="sm:w-40 relative">
              <CreditCard size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
              <select
                value={filterByMethod}
                onChange={(e) => dispatch(setFilterByMethod(e.target.value))}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl bg-[#F4F7FE] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white font-semibold text-sm transition-all outline-none text-[#1B2559] appearance-none cursor-pointer"
              >
                <option value="all">All Methods</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
                <option value="wallet">Wallet</option>
                <option value="cod">COD</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="sm:w-40 relative">
              <SortDesc size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
              <select
                value={sortBy}
                onChange={(e) => dispatch(setSortBy(e.target.value as any))}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl bg-[#F4F7FE] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white font-semibold text-sm transition-all outline-none text-[#1B2559] appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                dispatch(resetFilters());
                setLocalSearch("");
              }}
              className="text-sm text-[#5D5FEF] font-medium hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Payments Grid */}
      {loading && payments.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="text-[#5D5FEF] animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-[#A3AED0] font-bold text-sm sm:text-base">Loading payments...</p>
          </div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F4F7FE] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CreditCard size={24} className="text-[#5D5FEF] sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#1B2559] mb-2">No Payments Found</h3>
          <p className="text-[#A3AED0] font-semibold text-xs sm:text-sm">
            {localSearch || filterByStatus !== 'all' || filterByMethod !== 'all'
              ? "Try adjusting your filters"
              : "No payments have been processed yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredPayments.map((payment, index) => {
              const StatusIcon = paymentStatusIcons[payment.status];

              return (
                <motion.div
                  key={payment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                  {/* Payment Header */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Payment ID</p>
                          <p className="font-medium text-[#1B2559]">{payment.paymentId}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div>
                          <p className="text-xs text-gray-500">Order</p>
                          <p className="font-medium text-[#1B2559]">{payment.orderNumber}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="font-bold text-[#5D5FEF]">{formatCurrency(payment.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Method</p>
                          <p className="text-sm font-medium text-[#1B2559] capitalize">{payment.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[payment.status]}`}>
                            <StatusIcon size={12} />
                            {payment.status}
                          </span>
                        </div>
                        {payment.orderStatus === 'cancelled' && payment.refundStatus && payment.refundStatus !== 'none' && (
                          <div>
                            <p className="text-xs text-gray-500">Refund</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.refundStatus === 'completed' ? "bg-green-100 text-green-600 border-green-200" :
                              payment.refundStatus === 'failed' ? "bg-red-100 text-red-600 border-red-200" :
                              "bg-yellow-100 text-yellow-600 border-yellow-200"
                            }`}>
                              {payment.refundStatus}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => handleViewPayment(payment._id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View payment details"
                        >
                          <Eye size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="text-gray-600">{payment.userName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-gray-600">{payment.userEmail}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-500">{formatDate(payment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100">
              <p className="text-xs sm:text-sm font-bold text-[#A3AED0] order-2 sm:order-1">
                Page <span className="text-[#1B2559]">{pagination.page}</span> of {pagination.pages}
              </p>
              
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 order-1 sm:order-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-all ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-white text-[#1B2559] hover:bg-[#F4F7FE] shadow-sm hover:shadow'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === pagination.pages || 
                    Math.abs(page - pagination.page) <= 2
                  )
                  .map((page, index, array) => {
                    if (index > 0 && page - array[index - 1] > 1) {
                      return (
                        <span key={`dots-${page}`} className="text-[#A3AED0] px-1">...</span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-xs transition-all ${
                          pagination.page === page
                            ? 'bg-[#5D5FEF] text-white shadow-md'
                            : 'bg-white text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#1B2559] border border-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || loading}
                  className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-all ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-white text-[#1B2559] hover:bg-[#F4F7FE] shadow-sm hover:shadow'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Payment Modal */}
      <AnimatePresence>
        {viewModal && selectedPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-xl bg-black/20">
            <div className="absolute inset-0" onClick={() => setViewModal(false)} />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-[35px] overflow-hidden shadow-2xl relative z-10 max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="relative pt-2 pb-1 sm:pb-2 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex justify-center sm:hidden">
                  <div className="w-12 h-1 bg-gray-300 rounded-full mb-2" />
                </div>
                <div className="flex items-center justify-between px-4 sm:px-6 pb-2">
                  <h3 className="text-lg sm:text-xl font-bold text-[#1B2559] flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></span>
                    Payment Details
                  </h3>
                  <button
                    onClick={() => setViewModal(false)}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                  >
                    <X size={18} className="sm:w-5 sm:h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-4 sm:p-6">
                {/* Payment Info Header */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-600 mb-1">Payment ID</p>
                    <p className="font-bold text-[#1B2559] text-sm">{selectedPayment.paymentId}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-600 mb-1">Order ID</p>
                    <p className="font-bold text-[#1B2559] text-sm">{selectedPayment.orderNumber}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-xs text-purple-600 mb-1">Date</p>
                    <p className="font-bold text-[#1B2559] text-sm">{formatDate(selectedPayment.createdAt)}</p>
                  </div>
                </div>

                {/* Status and Amount */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">Status</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${paymentStatusColors[selectedPayment.status]}`}>
                      {selectedPayment.status === 'succeeded' && <CheckCircle size={16} />}
                      {selectedPayment.status === 'pending' && <Clock size={16} />}
                      {selectedPayment.status === 'failed' && <XCircle size={16} />}
                      {selectedPayment.status === 'refunded' && <AlertCircle size={16} />}
                      {selectedPayment.status}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">Amount</p>
                    <p className="text-2xl font-bold text-[#5D5FEF]">{formatCurrency(selectedPayment.amount)}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedPayment.currency.toUpperCase()}</p>
                  </div>
                  {selectedPayment.orderStatus === 'cancelled' && selectedPayment.refundStatus && selectedPayment.refundStatus !== 'none' && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-2">Refund Status</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                        selectedPayment.refundStatus === 'completed' ? "bg-green-100 text-green-600" :
                        selectedPayment.refundStatus === 'failed' ? "bg-red-100 text-red-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        <AlertCircle size={14} />
                        {selectedPayment.refundStatus}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h4 className="font-bold text-[#1B2559] mb-3">Payment Method</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-[#1B2559] capitalize">{selectedPayment.paymentMethod}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h4 className="font-bold text-[#1B2559] mb-3">Customer Information</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedPayment.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#1B2559]">{selectedPayment.userName}</p>
                        <p className="text-sm text-gray-500">{selectedPayment.userEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stripe Details */}
                <div>
                  <h4 className="font-bold text-[#1B2559] mb-3">Stripe Details</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-gray-600">Payment Intent ID:</span>{' '}
                      <span className="text-[#1B2559]">{selectedPayment.stripePaymentIntentId}</span>
                    </p>
                    {selectedPayment.stripeCustomerId && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">Customer ID:</span>{' '}
                        <span className="text-[#1B2559]">{selectedPayment.stripeCustomerId}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <button
                  onClick={() => setViewModal(false)}
                  className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Statistics Modal */}
      <AnimatePresence>
        {statsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-xl bg-black/20">
            <div className="absolute inset-0" onClick={() => setStatsModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-[35px] overflow-hidden shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#1B2559]">Payment Statistics</h3>
                  <button
                    onClick={() => setStatsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl text-center">
                    <CreditCard size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase opacity-90 mb-1">Total Payments</p>
                    <p className="text-2xl font-black">{stats.totalPayments}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl text-center">
                    <DollarSign size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase opacity-90 mb-1">Total Amount</p>
                    <p className="text-2xl font-black">{formatCurrency(stats.totalAmount)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-400 to-green-500 text-white rounded-xl text-center">
                    <CheckCircle size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase opacity-90 mb-1">Successful</p>
                    <p className="text-2xl font-black">{stats.successfulPayments}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-400 to-red-500 text-white rounded-xl text-center">
                    <XCircle size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase opacity-90 mb-1">Failed</p>
                    <p className="text-2xl font-black">{stats.failedPayments}</p>
                  </div>
                </div>

                {/* Payment Method Distribution */}
                <div className="mb-6">
                  <h4 className="font-bold text-[#1B2559] mb-3">Payment Method Distribution</h4>
                  <div className="space-y-3">
                    {Object.entries(stats.paymentMethodDistribution).map(([method, count]) => (
                      <div key={method} className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded w-20 text-center capitalize">
                          {method}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                            style={{
                              width: `${(count / stats.totalPayments) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1B2559] w-16 text-right">
                          {count} ({((count / stats.totalPayments) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Revenue Chart */}
                {stats.dailyRevenue.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[#1B2559] mb-3">Daily Revenue (Last 30 Days)</h4>
                    <div className="bg-gray-50 rounded-xl p-4 h-64 flex items-center justify-center">
                      <p className="text-gray-500">Revenue chart will be displayed here</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[200]"
          >
            <div
              className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl font-bold text-xs sm:text-sm ${
                toast.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}