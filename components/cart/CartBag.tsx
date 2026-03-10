"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Shield,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  X,
  Tag,
  Sparkles,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchCart,
  updateCartItemQuantity,
  updateCartItemSize,
  removeFromCart,
  moveToWishlist,
  toggleSelectItem,
  selectAllItems,
  clearCart,
  applyPromoCode,
  removePromoCode,
  CartItem,
} from "@/lib/redux/features/cart/cartSlice";
import { addToWishlist } from "@/lib/redux/features/wishlist/wishlistSlice";

interface CartBagProps {
  onProceed: () => void;
}

export default function CartBag({ onProceed }: CartBagProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    items,
    selectedItems,
    loading,
    operationLoading,
    subtotal,
    discountAmount,
    deliveryCharge,
    total,
    finalTotal,
    appliedDiscounts,
    promoCode,
    promoDiscount,
  } = useAppSelector((state) => state.cart);

  const [localLoading, setLocalLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showDiscountDetails, setShowDiscountDetails] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  
  // Use ref to prevent multiple fetches
  const hasFetchedCart = useRef(false);

  // Fetch cart only once
  useEffect(() => {
    if (!hasFetchedCart.current && !loading && items.length === 0) {
      hasFetchedCart.current = true;
      dispatch(fetchCart());
    }
  }, [dispatch, loading, items.length]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Size options based on category
  const getSizeOptions = (category: string) => {
    switch (category) {
      case "men":
      case "women":
        return ["XS", "S", "M", "L", "XL", "XXL"];
      case "kids":
        return ["XS", "S", "M"];
      default:
        return [];
    }
  };

  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;

    setLocalLoading((prev) => ({ ...prev, [`quantity-${productId}`]: true }));

    try {
      const result = await dispatch(
        updateCartItemQuantity({ productId, quantity: newQuantity }),
      );
      if (updateCartItemQuantity.fulfilled.match(result)) {
        showToast("Quantity updated");
      }
    } catch (error) {
      showToast("Failed to update quantity", "error");
    } finally {
      setLocalLoading((prev) => ({
        ...prev,
        [`quantity-${productId}`]: false,
      }));
    }
  };

  const handleUpdateSize = async (productId: string, size: string) => {
    setLocalLoading((prev) => ({ ...prev, [`size-${productId}`]: true }));

    try {
      const result = await dispatch(updateCartItemSize({ productId, size }));
      if (updateCartItemSize.fulfilled.match(result)) {
        showToast("Size updated");
      }
    } catch (error) {
      showToast("Failed to update size", "error");
    } finally {
      setLocalLoading((prev) => ({ ...prev, [`size-${productId}`]: false }));
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setLocalLoading((prev) => ({ ...prev, [`remove-${productId}`]: true }));

    try {
      const result = await dispatch(removeFromCart(productId));
      if (removeFromCart.fulfilled.match(result)) {
        showToast("Item removed from cart");
      }
    } catch (error) {
      showToast("Failed to remove item", "error");
    } finally {
      setLocalLoading((prev) => ({ ...prev, [`remove-${productId}`]: false }));
    }
  };

  const handleMoveToWishlist = async (item: CartItem) => {
    setLocalLoading((prev) => ({
      ...prev,
      [`wishlist-${item.productId}`]: true,
    }));

    try {
      // First remove from cart
      await dispatch(removeFromCart(item.productId));

      // Then add to wishlist
      const capitalizedCategory =
        item.category.charAt(0).toUpperCase() + item.category.slice(1);

      await dispatch(
        addToWishlist({
          productId: item.productId,
          title: item.title,
          description: item.description,
          price: item.price,
          image: item.image,
          category: capitalizedCategory,
        }),
      );

      showToast("Moved to wishlist");
    } catch (error) {
      showToast("Failed to move to wishlist", "error");
    } finally {
      setLocalLoading((prev) => ({
        ...prev,
        [`wishlist-${item.productId}`]: false,
      }));
    }
  };

  const handleToggleSelect = async (productId: string, selected: boolean) => {
    try {
      await dispatch(toggleSelectItem({ productId, selected }));
    } catch (error) {
      showToast("Failed to update selection", "error");
    }
  };

  const handleSelectAll = async () => {
    const selectAll = selectedItems.length !== items.length;
    try {
      await dispatch(selectAllItems(selectAll));
    } catch (error) {
      showToast("Failed to update selection", "error");
    }
  };

  const handleClearCart = async () => {
    if (items.length === 0) return;
    setShowClearCartModal(true);
  };

  const confirmClearCart = async () => {
    setShowClearCartModal(false);

    try {
      await dispatch(clearCart());
      showToast("Cart cleared successfully");
    } catch (error) {
      showToast("Failed to clear cart", "error");
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoInput.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    setPromoError(null);
    setPromoSuccess(null);

    try {
      const result = await dispatch(
        applyPromoCode({
          code: promoInput.trim().toUpperCase(),
          cartTotal: total,
        }),
      );

      if (applyPromoCode.fulfilled.match(result)) {
        setPromoSuccess(`Promo code "${promoInput.toUpperCase()}" applied successfully!`);
        setPromoInput("");
        showToast("Promo code applied successfully");
      } else if (applyPromoCode.rejected.match(result)) {
        // payload contains our error string when rejectWithValue is used
        const msg = (result.payload as string) || result.error?.message || "Failed to apply promo code";
        setPromoError(msg);
      }
    } catch (err) {
      // unexpected errors
      const errorMessage = (err as any)?.message || "Failed to apply promo code";
      setPromoError(errorMessage);
    }
  };

  const handleRemovePromoCode = async () => {
    try {
      await dispatch(removePromoCode());
      setPromoSuccess(null);
      showToast("Promo code removed");
    } catch (error) {
      showToast("Failed to remove promo code", "error");
    }
  };

  // Check if item should show size
  const shouldShowSize = (category: string) => {
    return ["men", "women", "kids"].includes(category);
  };

  // Calculate next discount tier
  const getNextDiscountTier = () => {
    if (subtotal < 1000) {
      return {
        amount: 1000 - subtotal,
        discount: "₹50 off",
        description: "Add ₹{(1000 - subtotal).toLocaleString()} more to get ₹50 off",
      };
    } else if (subtotal < 2000) {
      return {
        amount: 2000 - subtotal,
        discount: "₹150 off",
        description: `Add ₹{(2000 - subtotal).toLocaleString()} more to get ₹150 off`,
      };
    } else if (subtotal < 3000) {
      return {
        amount: 3000 - subtotal,
        discount: "₹300 off",
        description: `Add ₹{(3000 - subtotal).toLocaleString()} more to get ₹300 off`,
      };
    } else if (subtotal < 4000) {
      return {
        amount: 4000 - subtotal,
        discount: "10% off",
        description: `Add ₹{(4000 - subtotal).toLocaleString()} more to get 10% off`,
      };
    } else if (subtotal < 5000) {
      return {
        amount: 5000 - subtotal,
        discount: "₹500 off + Free Delivery",
        description: `Add ₹{(5000 - subtotal).toLocaleString()} more to get ₹500 off + Free Delivery`,
      };
    }
    return null;
  };

  const nextDiscountTier = getNextDiscountTier();
  const originalTotal = subtotal + deliveryCharge;
  const savings = discountAmount;

  // // Show loading state
  // if (loading && items.length === 0) {
  //   return (
  //     <div className="flex justify-center items-center min-h-[400px]">
  //       <div className="text-center">
  //         <Loader2
  //           size={40}
  //           className="text-[#5D5FEF] animate-spin mx-auto mb-4"
  //         />
  //         <p className="text-gray-600">Loading your cart...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 space-y-4">
        {/* Cart Header */}
        <div className="bg-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Select All Checkbox */}
            {items.length > 0 && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === items.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#5D5FEF] focus:ring-[#5D5FEF]"
                  />
                  <span className="text-sm text-gray-700">Select All</span>
                </label>
                <button
                  onClick={handleClearCart}
                  disabled={operationLoading}
                  className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Clear Cart
                </button>
              </>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </span>
        </div>


        {/* Cart Items */}
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const isLoading =
              localLoading[`quantity-${item.productId}`] ||
              localLoading[`size-${item.productId}`] ||
              localLoading[`remove-${item.productId}`] ||
              localLoading[`wishlist-${item.productId}`];

            return (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex gap-4">
                  {/* Selection Checkbox */}
                  <div className="flex items-start pt-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.productId)}
                      onChange={(e) =>
                        handleToggleSelect(item.productId, e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#5D5FEF] focus:ring-[#5D5FEF]"
                    />
                  </div>

                  {/* Product Image */}
                  <Link
                    href={`/product/${item.productId}`}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <Link href={`/product/${item.productId}`}>
                          <h3 className="font-semibold text-[#1B2559] text-sm sm:text-base hover:text-[#5D5FEF] transition-colors">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.description}
                        </p>

                        {/* Category Badge */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-md capitalize">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold text-[#1B2559] text-base sm:text-lg">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{item.price.toLocaleString()} each
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
                      {shouldShowSize(item.category) && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Size:</span>
                          <select
                            value={item.size || ""}
                            onChange={(e) =>
                              handleUpdateSize(item.productId, e.target.value)
                            }
                            disabled={operationLoading || isLoading}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#5D5FEF] disabled:opacity-50"
                          >
                            <option value="">Select size</option>
                            {getSizeOptions(item.category).map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.productId,
                              item.quantity - 1,
                            )
                          }
                          disabled={
                            item.quantity <= 1 || operationLoading || isLoading
                          }
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.productId,
                              item.quantity + 1,
                            )
                          }
                          disabled={operationLoading || isLoading}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMoveToWishlist(item)}
                          disabled={operationLoading || isLoading}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            localLoading[`wishlist-${item.productId}`]
                              ? "text-[#5D5FEF] bg-blue-50"
                              : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                          }`}
                          title="Move to wishlist"
                        >
                          <Heart size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={operationLoading || isLoading}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            localLoading[`remove-${item.productId}`]
                              ? "text-red-500 bg-red-50"
                              : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                          }`}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty Cart State */}
        {items.length === 0 && !loading && (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-[#1B2559] mb-2">
              Your cart is empty
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Looks like you haven't added anything to your cart yet
            </p>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5D5FEF] text-white rounded-xl font-medium hover:bg-[#4B4DC9] transition-all"
            >
              Continue Shopping
              <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl p-5 sticky top-24">
          <h3 className="font-bold text-[#1B2559] text-lg mb-4">
            Order Summary
          </h3>

          <div className="space-y-3 mb-4">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Subtotal ({selectedItems.length} items)
              </span>
              <span className="font-medium text-[#1B2559]">
                ₹{subtotal.toLocaleString()}
              </span>
            </div>

            {/* Discount Section */}
            {discountAmount > 0 && (
              <div className="space-y-2">
                <div 
                  className="flex justify-between text-sm text-green-600 cursor-pointer"
                  onClick={() => setShowDiscountDetails(!showDiscountDetails)}
                >
                  <span className="flex items-center gap-1">
                    <Tag size={14} />
                    Discount
                  </span>
                  <span className="font-medium">
                    -₹{discountAmount.toLocaleString()}
                  </span>
                </div>
                
                {/* Applied Discounts List */}
                <AnimatePresence>
                  {showDiscountDetails && appliedDiscounts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-green-50 rounded-lg p-3 space-y-2 overflow-hidden"
                    >
                      {appliedDiscounts.map((discount, index) => (
                        <div key={index} className="text-xs text-green-700">
                          <span className="font-medium">• {discount.description}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Delivery Charge */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Truck size={14} />
                Delivery Charge
              </span>
              {deliveryCharge === 0 ? (
                <span className="font-medium text-green-600">Free</span>
              ) : (
                <span className="font-medium text-[#1B2559]">
                  ₹{deliveryCharge}
                </span>
              )}
            </div>

            {/* Free delivery message */}
            {deliveryCharge > 0 && (
              <p className="text-xs text-gray-500">
                Add ₹{(5000 - subtotal).toLocaleString()} more for free delivery
              </p>
            )}

            {/* Promo Code Discount */}
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Sparkles size={14} />
                  Promo Code ({promoCode})
                </span>
                <span className="font-medium">
                  -₹{promoDiscount.toLocaleString()}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#1B2559]">
                  Total Amount
                </span>
                <div className="text-right">
                  {discountAmount > 0 || promoDiscount > 0 ? (
                    <p className="text-xs text-gray-500 line-through">
                      ₹{originalTotal.toLocaleString()}
                    </p>
                  ) : null}
                  <span className="text-xl font-bold text-[#5D5FEF]">
                    ₹{finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>
              {(discountAmount > 0 || promoDiscount > 0) && (
                <p className="text-xs text-green-600 mt-1 text-right">
                  You save ₹{(discountAmount + promoDiscount).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-[#1B2559] mb-3 flex items-center gap-2">
              <Tag size={16} />
              Have a Promo Code?
            </h4>

            {promoCode ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {promoCode} applied
                    </span>
                  </div>
                  <button
                    onClick={handleRemovePromoCode}
                    disabled={operationLoading}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#5D5FEF] focus:ring-1 focus:ring-[#5D5FEF]"
                    disabled={operationLoading}
                  />
                  <button
                    onClick={handleApplyPromoCode}
                    disabled={operationLoading || !promoInput.trim()}
                    className="px-4 py-2 bg-[#5D5FEF] text-white text-sm font-medium rounded-lg hover:bg-[#4B4DC9] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    
                      Apply
                  </button>
                </div>

                {promoError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {promoError}
                  </p>
                )}

                {promoSuccess && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} />
                    {promoSuccess}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Place Order Button */}
          <button
            onClick={onProceed}
            disabled={selectedItems.length === 0 || operationLoading}
            className="w-full bg-[#5D5FEF] text-white py-3 rounded-xl font-semibold hover:bg-[#4B4DC9] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
          >
            {operationLoading ? (
              <>
                Processing...
              </>
            ) : (
              "Place Order"
            )}
          </button>

          {/* Discount Tiers Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Tag size={14} />
              Discount Tiers
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• ₹1,000+ : ₹50 off</p>
              <p>• ₹2,000+ : ₹150 off</p>
              <p>• ₹3,000+ : ₹300 off</p>
              <p>• ₹4,000+ : 10% off</p>
              <p>• ₹5,000+ : ₹500 off + Free Delivery</p>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-[#5D5FEF]" />
              <span>Secure payment guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-[#5D5FEF]" />
              <span>7 days easy return</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
        {showClearCartModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => setShowClearCartModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 text-center">
                {/* Close Button */}
                <button
                  onClick={() => setShowClearCartModal(false)}
                  className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>

                {/* Warning Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={28} className="text-red-500" />
                </div>

                <h3 className="text-lg font-bold text-[#1B2559] mb-2">
                  Clear Cart
                </h3>

                <p className="text-sm text-gray-500 mb-2">
                  Are you sure you want to clear your cart?
                </p>
                <p className="text-xs text-red-500 mb-6">
                  This action will remove all {items.length} items from your
                  cart.
                </p>

                {/* Cart Summary */}
                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total items:</span>
                    <span className="font-semibold text-[#1B2559]">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-[#1B2559]">
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">You save:</span>
                      <span className="font-semibold text-green-600">
                        ₹{savings.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-[#1B2559]">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearCartModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClearCart}
                    disabled={operationLoading}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {operationLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      "Clear Cart"
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
            className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
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