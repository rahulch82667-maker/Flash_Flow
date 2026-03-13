"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Calendar,
  CreditCard,
  ShoppingBag,
  Home,
  Briefcase,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Circle,
  Check,
  IndianRupee,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchUserOrders, fetchOrderById, Order } from "@/lib/redux/features/order/orderSlice";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/Footer";

const orderStatusColors = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  processing: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  shipped: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  delivered: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

const orderStatusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const trackingSteps = [
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export default function OrdersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [customUser, setCustomUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

  const { orders, loading } = useAppSelector((state) => state.order);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
      }

      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setCustomUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      }

      setPageLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (customUser || firebaseUser) {
      dispatch(fetchUserOrders({ page: 1, limit: 10 }));
    }
  }, [dispatch, customUser, firebaseUser]);

  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      setSelectedOrder(orders[0]);
    }
  }, [orders]);

  const user = customUser || firebaseUser;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    
    setCancelling(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder._id}/cancel`, {
        method: "PUT",
        credentials: "include",
      });

      if (response.ok) {
        setCancelModal(false);
        showToast("Order cancelled successfully", "success");
        dispatch(fetchUserOrders({ page: 1, limit: 10 }));
        setSelectedOrder({ ...selectedOrder, orderStatus: "cancelled" });
      } else {
        showToast("Failed to cancel order", "error");
      }
    } catch (error) {
      showToast("Failed to cancel order", "error");
    } finally {
      setCancelling(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home size={14} className="text-blue-500" />;
      case "work":
        return <Briefcase size={14} className="text-purple-500" />;
      default:
        return <MapPin size={14} className="text-gray-500" />;
    }
  };

  const getTrackingStepStatus = (stepKey: string) => {
    if (!selectedOrder) return "pending";
    
    const statusOrder = ["confirmed", "processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(selectedOrder.orderStatus);
    const stepIndex = statusOrder.indexOf(stepKey);
    
    if (selectedOrder.orderStatus === "cancelled") return "cancelled";
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };


  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar user={user} onProfileClick={() => setShowProfile(true)} />

      <main className="flex-grow pt-20 sm:pt-24 pb-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/home" className="text-gray-600 hover:text-[#5D5FEF] transition-colors">
              Home
            </Link>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-gray-900 font-medium">My Orders</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2559] mb-8">My Orders</h1>

          {loading && orders.length === 0 ? (
            <div className="flex justify-center items-center min-h-[400px]">
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-[#1B2559] mb-2">No Orders Yet</h2>
              <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
              <Link
                href="/home"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5D5FEF] text-white rounded-xl font-medium hover:bg-[#4B4DC9] transition-all"
              >
                Start Shopping
                <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              {isMobileDetailsOpen && (
                <button
                  onClick={() => setIsMobileDetailsOpen(false)}
                  className="lg:hidden flex items-center gap-2 text-[#5D5FEF] font-medium mb-4"
                >
                  <ChevronLeft size={18} />
                  Back to Orders
                </button>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-1 ${isMobileDetailsOpen ? 'hidden lg:block' : 'block'}`}>
                  <div className="lg:sticky lg:top-24">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-[#1B2559]">All Orders ({orders.length})</h2>
                      </div>
                      <div className="divide-y divide-gray-100 max-h-[calc(100vh-250px)] overflow-y-auto">
                        {orders.map((order) => {
                          const StatusIcon = orderStatusIcons[order.orderStatus];
                          const statusColor = orderStatusColors[order.orderStatus];
                          const isSelected = selectedOrder?._id === order._id;
                          const firstItem = order.items[0];

                          return (
                            <motion.div
                              key={order._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsMobileDetailsOpen(true);
                              }}
                              className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                                isSelected ? 'bg-indigo-50/50 border-l-4 border-l-[#5D5FEF]' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* Product Image */}
                                <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  {firstItem && (
                                    <Image
                                      src={firstItem.image}
                                      alt={firstItem.title}
                                      fill
                                      className="object-cover"
                                    />
                                  )}
                                </div>

                                {/* Order Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="text-xs text-gray-500">#{order.orderId}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor.bg} ${statusColor.text}`}>
                                      {order.orderStatus}
                                    </span>
                                  </div>
                                  
                                  <h3 className="text-sm font-medium text-[#1B2559] line-clamp-1 mb-1">
                                    {firstItem?.title}
                                  </h3>
                                  
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • {formatDate(order.createdAt)}
                                    </p>
                                    <p className="text-sm font-bold text-[#5D5FEF]">
                                      ₹{order.totalAmount.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column  */}
                <div className={`lg:col-span-2 ${!isMobileDetailsOpen ? 'hidden lg:block' : 'block'}`}>
                  {selectedOrder && (
                    <motion.div
                      key={selectedOrder._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Order ID</p>
                          <p className="text-lg font-bold text-[#1B2559]">{selectedOrder.orderId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Placed on</p>
                          <p className="font-medium text-[#1B2559]">{formatDate(selectedOrder.createdAt)}</p>
                        </div>
                      </div>

                      {/* Product Summary */}
                      <div className="mb-8">
                        <h3 className="font-semibold text-[#1B2559] mb-4 flex items-center gap-2">
                          <ShoppingBag size={18} className="text-[#5D5FEF]" />
                          Product Details
                        </h3>
                        <div className="space-y-4">
                          {selectedOrder.items.map((item, index) => (
                            <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                              <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-2">
                                  <h4 className="font-medium text-[#1B2559]">{item.title}</h4>
                                  <span className="font-bold text-[#5D5FEF]">₹{item.price * item.quantity}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-gray-600">Qty: {item.quantity}</span>
                                  {item.size && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <span className="text-gray-600">Size: {item.size}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Status Timeline */}
                      {selectedOrder.orderStatus !== "cancelled" && (
                        <div className="mb-8">
                          <h3 className="font-semibold text-[#1B2559] mb-6 flex items-center gap-2">
                            <Truck size={18} className="text-[#5D5FEF]" />
                            Order Status
                          </h3>
                          <div className="relative">
                            {/* Vertical Timeline */}
                            <div className="space-y-6">
                              {trackingSteps.map((step, index) => {
                                const status = getTrackingStepStatus(step.key);
                                const isCompleted = status === "completed";
                                const isCurrent = status === "current";
                                const isPending = status === "pending";
                                const Icon = step.icon;

                                return (
                                  <div key={step.key} className="flex items-start gap-4">
                                    {/* Status Icon */}
                                    <div className="relative">
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                          isCompleted
                                            ? "bg-green-500 text-white"
                                            : isCurrent
                                            ? "bg-[#5D5FEF] text-white"
                                            : isPending
                                            ? "bg-gray-200 text-gray-400"
                                            : "bg-gray-200 text-gray-400"
                                        }`}
                                      >
                                        {isCompleted ? (
                                          <Check size={16} />
                                        ) : (
                                          <Icon size={16} />
                                        )}
                                      </div>
                                      {index < trackingSteps.length - 1 && (
                                        <div
                                          className={`absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 ${
                                            isCompleted ? "bg-green-500" : "bg-gray-200"
                                          }`}
                                        />
                                      )}
                                    </div>

                                    {/* Status Info */}
                                    <div className="flex-1 pb-6">
                                      <p
                                        className={`font-medium ${
                                          isCompleted || isCurrent
                                            ? "text-[#1B2559]"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        {step.label}
                                      </p>
                                      {isCurrent && (
                                        <p className="text-xs text-[#5D5FEF] mt-1">
                                          Current Status
                                        </p>
                                      )}
                                      {isCompleted && index === 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {formatDate(selectedOrder.createdAt)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cancelled Status */}
                      {selectedOrder.orderStatus === "cancelled" && (
                        <div className="mb-8 p-4 bg-red-50 rounded-xl flex items-center gap-3">
                          <XCircle size={20} className="text-red-500" />
                          <div>
                            <p className="font-medium text-red-600">Order Cancelled</p>
                            <p className="text-sm text-red-500">This order has been cancelled</p>
                          </div>
                        </div>
                      )}

                      {/* Delivery Address */}
                      <div className="mb-8">
                        <h3 className="font-semibold text-[#1B2559] mb-4 flex items-center gap-2">
                          <MapPin size={18} className="text-[#5D5FEF]" />
                          Delivery Address
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            {getAddressTypeIcon(selectedOrder.shippingAddress.addressType)}
                            <span className="text-xs font-medium capitalize text-gray-600">
                              {selectedOrder.shippingAddress.addressType}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p className="font-medium text-[#1B2559]">{selectedOrder.shippingAddress.fullName}</p>
                            <p className="text-gray-600 flex items-center gap-2">
                              <Phone size={14} />
                              {selectedOrder.shippingAddress.phoneNumber}
                            </p>
                            <p className="text-gray-600">
                              {selectedOrder.shippingAddress.houseNumber}, {selectedOrder.shippingAddress.street}
                            </p>
                            <p className="text-gray-600">
                              {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{" "}
                              {selectedOrder.shippingAddress.pincode}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Price Details */}
                      <div className="mb-8">
                        <h3 className="font-semibold text-[#1B2559] mb-4 flex items-center gap-2">
                          <CreditCard size={18} className="text-[#5D5FEF]" />
                          Payment Summary
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-medium text-[#1B2559]">₹{selectedOrder.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Delivery Charge</span>
                              {selectedOrder.deliveryCharge === 0 ? (
                                <span className="font-medium text-green-600">Free</span>
                              ) : (
                                <span className="font-medium text-[#1B2559]">₹{selectedOrder.deliveryCharge}</span>
                              )}
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Payment Method</span>
                              <span className="font-medium text-[#1B2559] capitalize">
                                {selectedOrder.paymentMethod === "cod" ? "Cash on Delivery" : selectedOrder.paymentMethod}
                              </span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-3">
                              <div className="flex justify-between">
                                <span className="font-semibold text-[#1B2559]">Total</span>
                                <span className="text-xl font-bold text-[#5D5FEF]">
                                  ₹{selectedOrder.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cancel Button */}
                      {selectedOrder.orderStatus !== "cancelled" && 
                       selectedOrder.orderStatus !== "delivered" && 
                       selectedOrder.orderStatus !== "shipped" && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => setCancelModal(true)}
                            className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all active:scale-95 flex items-center gap-2"
                          >
                            <AlertTriangle size={16} />
                            Cancel Order
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Cancel Order Confirmation Modal */}
      <AnimatePresence>
        {cancelModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setCancelModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={28} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-[#1B2559] mb-2">Cancel Order</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCancelModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all text-sm"
                  >
                    No, Keep It
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Yes, Cancel"
                    )}
                  </button>
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
              className={`px-4 py-3 rounded-lg shadow-xl font-medium text-sm flex items-center gap-2 ${
                toast.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}