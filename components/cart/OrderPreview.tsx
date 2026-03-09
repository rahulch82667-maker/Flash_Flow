"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Truck,
  Shield,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  createOrder,
  confirmOrder,
  clearCurrentOrder,
} from "@/lib/redux/features/order/orderSlice";
import StripePayment from "@/components/payment/StripePayment";

interface OrderPreviewProps {
  user: any;
  selectedAddress: any;
  paymentMethod: string;
  onBack: () => void;
  onComplete: () => void;
}

export default function OrderPreview({
  user,
  selectedAddress,
  paymentMethod,
  onBack,
  onComplete,
}: OrderPreviewProps) {
  const dispatch = useAppDispatch();
  const {
    items: cartItems,
    selectedItems,
    subtotal,
    deliveryCharge,
    total,
  } = useAppSelector((state) => state.cart);
  const { currentOrder, processing, clientSecret, error } = useAppSelector(
    (state) => state.order,
  );

  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  const selectedCartItems = cartItems
    .filter((item) => selectedItems.includes(item.productId))
    .map((item) => ({
      ...item,
      size: item.size === null ? undefined : item.size, 
    }));

  useEffect(() => {
    if (!currentOrder && !processing && !orderCreated) {
      handleCreateOrder();
    }
  }, []);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setOrderError(error);
    }
  }, [error]);

  const handleCreateOrder = async () => {
    if (orderCreated) return;
    
    setOrderError(null);
    setOrderCreated(true);

    const orderData = {
      shippingAddress: {
        fullName: selectedAddress.fullName,
        phoneNumber: selectedAddress.phoneNumber,
        houseNumber: selectedAddress.houseNumber,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        addressType: selectedAddress.addressType,
      },
      paymentMethod,
      items: selectedCartItems.map((item) => ({
        productId: item.productId,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        category: item.category,
        size: item.size,
      })),
      subtotal,
      deliveryCharge,
      totalAmount: total,
    };

    const result = await dispatch(createOrder(orderData));
    if (createOrder.fulfilled.match(result)) {
    } else {
      setOrderCreated(false); 
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!currentOrder) return;

    const result = await dispatch(
      confirmOrder({
        orderId: currentOrder._id,
        paymentIntentId,
        paymentMethod,
      }),
    );

    if (confirmOrder.fulfilled.match(result)) {
      setPaymentSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const handleCODConfirm = async () => {
    if (!currentOrder) return;

    const result = await dispatch(
      confirmOrder({
        orderId: currentOrder._id,
        paymentMethod,
      }),
    );

    if (confirmOrder.fulfilled.match(result)) {
      setPaymentSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setOrderError(errorMessage);
  };

  if (paymentSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#1B2559] mb-2">
          Order Confirmed!
        </h2>
        <p className="text-gray-600 mb-4">
          Your order has been placed successfully.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 max-w-md mx-auto">
          <p className="text-sm text-gray-600">
            Order ID: {currentOrder?.orderId}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Total Amount: ₹{total.toLocaleString()}
          </p>
        </div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#5D5FEF] text-white rounded-xl font-medium hover:bg-[#4B4DC9] transition-all"
        >
          View My Orders
          <ChevronRight size={16} />
        </Link>
      </motion.div>
    );
  }

  if (processing && !currentOrder) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 size={32} className="text-[#5D5FEF] animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Creating your order...</p>
        </div>
      </div>
    );
  }

  if (!currentOrder && !processing) {
    return (
      <div className="text-center py-8">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">
          <p className="text-sm">Failed to create order. Please try again.</p>
        </div>
        <button
          onClick={() => {
            setOrderCreated(false);
            handleCreateOrder();
          }}
          className="px-8 py-3 bg-[#5D5FEF] text-white rounded-xl font-semibold hover:bg-[#4B4DC9] transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-white rounded-xl p-5">
        <h3 className="font-bold text-[#1B2559] text-lg mb-4">Order Summary</h3>

        {/* Items */}
        <div className="space-y-3 mb-4">
          {selectedCartItems.map((item) => (
            <div key={item.productId} className="flex gap-3">
              <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[#1B2559] text-sm">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                </p>
                {item.size && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Size: {item.size}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#1B2559]">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-[#1B2559]">
              ₹{subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Charge</span>
            {deliveryCharge === 0 ? (
              <span className="font-medium text-green-600">Free</span>
            ) : (
              <span className="font-medium text-[#1B2559]">
                ₹{deliveryCharge}
              </span>
            )}
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-[#1B2559]">Total</span>
              <span className="text-xl font-bold text-[#5D5FEF]">
                ₹{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-xl p-5">
        <h3 className="font-bold text-[#1B2559] text-lg mb-3 flex items-center gap-2">
          <MapPin size={18} />
          Delivery Address
        </h3>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-[#1B2559]">
            {selectedAddress.fullName}
          </p>
          <p className="text-gray-600">{selectedAddress.phoneNumber}</p>
          <p className="text-gray-600">
            {selectedAddress.houseNumber}, {selectedAddress.street}
          </p>
          <p className="text-gray-600">
            {selectedAddress.city}, {selectedAddress.state} -{" "}
            {selectedAddress.pincode}
          </p>
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-white rounded-xl p-5">
        <h3 className="font-bold text-[#1B2559] text-lg mb-3">Payment</h3>

        {paymentMethod === "cod" ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                You've selected Cash on Delivery. Please keep ₹
                {total.toLocaleString()} ready at the time of delivery.
              </p>
            </div>

            {orderError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {orderError}
              </div>
            )}

            <button
              onClick={handleCODConfirm}
              disabled={processing}
              className="w-full bg-[#5D5FEF] text-white py-3 rounded-xl font-semibold hover:bg-[#4B4DC9] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm COD Order"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {clientSecret ? (
              <StripePayment
                clientSecret={clientSecret}
                orderId={currentOrder!._id}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            ) : (
              <div className="flex justify-center py-4">
                <Loader2 size={24} className="text-[#5D5FEF] animate-spin" />
              </div>
            )}

            {orderError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {orderError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={processing}
        className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
      >
        <ChevronLeft size={16} />
        Back to Payment
      </button>

      {/* Shipping Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Truck size={14} className="text-[#5D5FEF]" />
          <span>Free Shipping</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw size={14} className="text-[#5D5FEF]" />
          <span>7 Days Return</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield size={14} className="text-[#5D5FEF]" />
          <span>Secure Payment</span>
        </div>
      </div>
    </div>
  );
}