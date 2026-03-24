"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Package,
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
  ShoppingBag,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Truck,
  Home,
  Briefcase,
  MapPin,
  Phone,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchAllOrders,
  fetchOrderById,
  fetchOrderStats,
  updateOrderStatus,
  setSelectedOrder,
  setSearchTerm,
  setFilterByStatus,
  setFilterByPayment,
  setSortBy,
  setPage,
  clearError,
  resetFilters,
  AdminOrder,
} from "@/lib/redux/features/adminOrders/adminOrdersSlice";

// Define proper types for color maps
const orderStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-600 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-600 border-blue-200",
  processing: "bg-purple-100 text-purple-600 border-purple-200",
  shipped: "bg-indigo-100 text-indigo-600 border-indigo-200",
  delivered: "bg-green-100 text-green-600 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-600",
  completed: "bg-green-100 text-green-600",
  failed: "bg-red-100 text-red-600",
  refunded: "bg-purple-100 text-purple-600",
};

const orderStatusOptions = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrdersTab() {
  const dispatch = useAppDispatch();
  const {
    orders,
    filteredOrders,
    selectedOrder,
    stats,
    loading,
    updating,
    error,
    searchTerm,
    filterByStatus,
    filterByPayment,
    sortBy,
    pagination,
  } = useAppSelector((state) => state.adminOrders);

  // Local state
  const [viewModal, setViewModal] = useState(false);
  const [statsModal, setStatsModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [localSearch, setLocalSearch] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Fetch orders on mount and when dependencies change
  useEffect(() => {
    dispatch(fetchAllOrders({
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm,
      status: filterByStatus,
      payment: filterByPayment,
      sortBy,
    }));
    dispatch(fetchOrderStats());
  }, [dispatch, pagination.page, pagination.limit, searchTerm, filterByStatus, filterByPayment, sortBy]);

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

  const handleViewOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    const result = await dispatch(fetchOrderById(orderId));
    if (fetchOrderById.fulfilled.match(result)) {
      setViewModal(true);
    }
  };

  const handleUpdateStatus = (order: AdminOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedOrder || newStatus === selectedOrder.orderStatus) {
      setStatusModal(false);
      return;
    }

    const result = await dispatch(updateOrderStatus({
      orderId: selectedOrder._id,
      status: newStatus,
    }));

    if (updateOrderStatus.fulfilled.match(result)) {
      setStatusModal(false);
      showToast(`Order status updated to ${newStatus}`, "success");
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

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home size={16} className="text-blue-500" />;
      case "work":
        return <Briefcase size={16} className="text-purple-500" />;
      default:
        return <MapPin size={16} className="text-gray-500" />;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="text-[#5D5FEF] animate-spin mx-auto mb-3 sm:mb-4" />
          <p className="text-[#A3AED0] font-bold text-sm sm:text-base">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F4F7FE] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Package size={24} className="text-[#5D5FEF] sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-lg sm:text-xl font-black text-[#1B2559] mb-2">No Orders Found</h3>
        <p className="text-[#A3AED0] font-semibold text-xs sm:text-sm">
          {localSearch || filterByStatus !== 'all' || filterByPayment !== 'all'
            ? "Try adjusting your filters"
            : "No orders have been placed yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-[#5D5FEF] font-black text-xs tracking-widest uppercase">
              Order Management
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B2559] tracking-tight">
            Orders
          </h2>
          <p className="text-[#A3AED0] font-semibold text-xs sm:text-sm mt-1">
            Manage all customer orders - {pagination.total} total orders
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
                placeholder="Search by order ID, user name or email..."
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
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Filter by Payment */}
            <div className="sm:w-40 relative">
              <CreditCard size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
              <select
                value={filterByPayment}
                onChange={(e) => dispatch(setFilterByPayment(e.target.value))}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl bg-[#F4F7FE] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white font-semibold text-sm transition-all outline-none text-[#1B2559] appearance-none cursor-pointer"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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
                <option value="highest">Highest Value</option>
                <option value="lowest">Lowest Value</option>
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

      {/* Orders Grid */}
      <div className="space-y-4">
        {filteredOrders.map((order, index) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100"
          >
            {/* Order Header */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Order ID</p>
                    <p className="font-medium text-[#1B2559]">{order.orderId}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium text-[#1B2559] flex items-center gap-1">
                      <User size={12} />
                      {order.userName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-[#5D5FEF]">{formatCurrency(order.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${orderStatusColors[order.orderStatus] || "bg-gray-100 text-gray-600"}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  {order.orderStatus === 'cancelled' && order.refundStatus && order.refundStatus !== 'none' && (
                    <div>
                      <p className="text-xs text-gray-500">Refund</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.refundStatus === 'completed' ? "bg-green-100 text-green-600 border-green-200" :
                        order.refundStatus === 'failed' ? "bg-red-100 text-red-600 border-red-200" :
                        "bg-yellow-100 text-yellow-600 border-yellow-200"
                      }`}>
                        {order.refundStatus}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewOrder(order._id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View order details"
                    >
                      <Eye size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Update status"
                    >
                      <Clock size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="p-4">
              <div className="flex gap-4 overflow-x-auto pb-2">
                {order.items.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex-none w-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mb-1">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-600 truncate">x{item.quantity}</p>
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="flex-none w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-500">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
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

      {/* View Order Modal */}
      <AnimatePresence>
        {viewModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-xl bg-black/20">
            <div className="absolute inset-0" onClick={() => setViewModal(false)} />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-4xl rounded-t-3xl sm:rounded-[35px] overflow-hidden shadow-2xl relative z-10 max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="relative pt-2 pb-1 sm:pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-center sm:hidden">
                  <div className="w-12 h-1 bg-gray-300 rounded-full mb-2" />
                </div>
                <div className="flex items-center justify-between px-4 sm:px-6 pb-2">
                  <h3 className="text-lg sm:text-xl font-bold text-[#1B2559] flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
                    Order Details
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
                {/* Order Info Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-600 mb-1">Order ID</p>
                    <p className="font-bold text-[#1B2559] text-sm truncate">{selectedOrder.orderId}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-600 mb-1">Order Date</p>
                    <p className="font-bold text-[#1B2559] text-sm">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-xs text-purple-600 mb-1">Payment</p>
                    <p className="font-bold text-[#1B2559] text-sm capitalize">{selectedOrder.paymentMethod}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xs text-amber-600 mb-1">Total</p>
                    <p className="font-bold text-[#1B2559] text-sm">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Order Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${orderStatusColors[selectedOrder.orderStatus] || "bg-gray-100 text-gray-600"}`}>
                      <Package size={14} />
                      {selectedOrder.orderStatus}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${paymentStatusColors[selectedOrder.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                      <CreditCard size={14} />
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                  {selectedOrder.orderStatus === 'cancelled' && selectedOrder.refundStatus && selectedOrder.refundStatus !== 'none' && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">Refund Status</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                        selectedOrder.refundStatus === 'completed' ? "bg-green-100 text-green-600" :
                        selectedOrder.refundStatus === 'failed' ? "bg-red-100 text-red-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        <AlertCircle size={14} />
                        {selectedOrder.refundStatus}
                      </span>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h4 className="font-bold text-[#1B2559] mb-3">Customer Information</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedOrder.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#1B2559]">{selectedOrder.userName}</p>
                        <p className="text-sm text-gray-500">{selectedOrder.userEmail}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-gray-600">
                        <Phone size={14} />
                        {selectedOrder.shippingAddress.phoneNumber}
                      </p>
                      <p className="flex items-center gap-2 text-gray-600">
                        <MapPin size={14} />
                        {selectedOrder.shippingAddress.houseNumber}, {selectedOrder.shippingAddress.street}
                      </p>
                      <p className="flex items-center gap-2 text-gray-600">
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h4 className="font-bold text-[#1B2559] mb-3">Items ({selectedOrder.items.length})</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-3 flex gap-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-[#1B2559] text-sm">{item.title}</h5>
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[#1B2559]">
                                ₹{item.price} × {item.quantity}
                              </span>
                              {item.size && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">
                                  Size: {item.size}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-[#5D5FEF]">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="mb-6">
                  <h4 className="font-bold text-[#1B2559] mb-3">Payment Summary</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-[#1B2559]">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Charge</span>
                      {selectedOrder.deliveryCharge === 0 ? (
                        <span className="font-medium text-green-600">Free</span>
                      ) : (
                        <span className="font-medium text-[#1B2559]">{formatCurrency(selectedOrder.deliveryCharge)}</span>
                      )}
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#1B2559]">Total</span>
                        <span className="text-lg font-bold text-[#5D5FEF]">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details (if available) */}
                {selectedOrder.stripePaymentIntentId && (
                  <div>
                    <h4 className="font-bold text-[#1B2559] mb-3">Payment Details</h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Payment Intent ID:</span> {selectedOrder.stripePaymentIntentId}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setViewModal(false);
                      handleUpdateStatus(selectedOrder);
                    }}
                    className="flex-1 py-3 bg-[#5D5FEF] text-white rounded-xl font-medium hover:bg-[#4B4DC9] transition-all"
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => setViewModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update Status Modal */}
      <AnimatePresence>
        {statusModal && selectedOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setStatusModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-[#1B2559] mb-4">Update Order Status</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Order ID: {selectedOrder.orderId}
                </p>

                <div className="space-y-3 mb-6">
                  {orderStatusOptions.map((status) => (
                    <label
                      key={status}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        newStatus === status
                          ? 'border-[#5D5FEF] bg-[#5D5FEF]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${orderStatusColors[status]}`}>
                          {status}
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={newStatus === status}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-4 h-4 text-[#5D5FEF] focus:ring-[#5D5FEF]"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStatusModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStatusUpdate}
                    disabled={updating || newStatus === selectedOrder.orderStatus}
                    className="flex-1 py-2.5 bg-[#5D5FEF] text-white rounded-lg font-medium hover:bg-[#4B4DC9] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {updating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Status'
                    )}
                  </button>
                </div>
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
                  <h3 className="text-xl font-bold text-[#1B2559]">Order Statistics</h3>
                  <button
                    onClick={() => setStatsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl text-center">
                    <Package size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase opacity-90 mb-1">Total Orders</p>
                    <p className="text-2xl font-black">{stats.totalOrders}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl text-center">
                    <DollarSign size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase opacity-90 mb-1">Total Revenue</p>
                    <p className="text-2xl font-black">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl text-center">
                    <TrendingUp size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase opacity-90 mb-1">Avg Order Value</p>
                    <p className="text-2xl font-black">{formatCurrency(stats.averageOrderValue)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl text-center">
                    <Clock size={24} className="mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase opacity-90 mb-1">Pending</p>
                    <p className="text-2xl font-black">{stats.pendingOrders}</p>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="mb-6">
                  <h4 className="font-bold text-[#1B2559] mb-3">Order Status Distribution</h4>
                  <div className="space-y-3">
                    {Object.entries(stats.statusDistribution).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded w-24 text-center ${orderStatusColors[status] || "bg-gray-100 text-gray-600"}`}>
                          {status}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                            style={{
                              width: `${(count / stats.totalOrders) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1B2559] w-16 text-right">
                          {count} ({((count / stats.totalOrders) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method Distribution */}
                <div>
                  <h4 className="font-bold text-[#1B2559] mb-3">Payment Method Distribution</h4>
                  <div className="space-y-3">
                    {Object.entries(stats.paymentMethodDistribution).map(([method, count]) => (
                      <div key={method} className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded w-20 text-center capitalize">
                          {method}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{
                              width: `${(count / stats.totalOrders) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1B2559] w-16 text-right">
                          {count} ({((count / stats.totalOrders) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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