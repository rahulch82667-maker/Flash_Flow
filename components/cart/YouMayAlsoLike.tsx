"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { SimilarProduct } from "@/lib/redux/features/similarProducts/similarProductsSlice";
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/redux/features/wishlist/wishlistSlice";
import {
  addToCart,
  removeFromCart,
  fetchCart,
} from "@/lib/redux/features/cart/cartSlice";

export default function YouMayAlsoLike() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { items: wishlistItems, loading: wishlistLoading } = useAppSelector(
    (state) => state.wishlist,
  );
  const { items: cartItems, operationLoading: cartLoading } = useAppSelector(
    (state) => state.cart,
  );

  const [recommendedProducts, setRecommendedProducts] = useState<
    SimilarProduct[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistedStates, setWishlistedStates] = useState<
    Record<string, boolean>
  >({});
  const [cartStates, setCartStates] = useState<Record<string, boolean>>({});
  const [localWishlistLoading, setLocalWishlistLoading] = useState<
    Record<string, boolean>
  >({});
  const [localCartLoading, setLocalCartLoading] = useState<
    Record<string, boolean>
  >({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Use refs to prevent multiple fetches
  const hasFetchedCart = useRef(false);
  const hasFetchedWishlist = useRef(false);
  const hasFetchedRecommendations = useRef(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get cart product IDs as a stable string for dependency
  const cartProductIdsString = useMemo(() => {
    return cartItems
      .map((item) => item.productId)
      .sort()
      .join(",");
  }, [cartItems]);

  // Fetch cart and wishlist only once
  useEffect(() => {
    if (!hasFetchedCart.current) {
      hasFetchedCart.current = true;
      dispatch(fetchCart());
    }

    if (!hasFetchedWishlist.current) {
      hasFetchedWishlist.current = true;
      dispatch(fetchWishlist());
    }
  }, [dispatch]);

  // Fetch recommendations only once
  useEffect(() => {
    const fetchRecommendations = async () => {
      // Prevent multiple fetches
      if (hasFetchedRecommendations.current) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get IDs of products already in cart to exclude them
        const cartProductIds = cartItems.map((item) => item.productId);

        // Build URL with cart product IDs to exclude
        let url = "/api/products/similar?limit=10";
        if (cartProductIds.length > 0) {
          url += `&excludeIds=${cartProductIds.join(",")}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = await response.json();
        setRecommendedProducts(data.products || []);
        hasFetchedRecommendations.current = true;
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []); // Empty dependency array - run only once on mount

  // Update wishlist states
  useEffect(() => {
    if (recommendedProducts.length > 0 && wishlistItems.length > 0) {
      const states: Record<string, boolean> = {};
      recommendedProducts.forEach((product) => {
        states[product._id] = wishlistItems.some(
          (item) => item.productId === product._id,
        );
      });
      setWishlistedStates(states);
    } else {
      setWishlistedStates({});
    }
  }, [recommendedProducts, wishlistItems]);

  // Update cart states
  useEffect(() => {
    if (recommendedProducts.length > 0 && cartItems.length > 0) {
      const states: Record<string, boolean> = {};
      recommendedProducts.forEach((product) => {
        states[product._id] = cartItems.some(
          (item) => item.productId === product._id,
        );
      });
      setCartStates(states);
    } else {
      setCartStates({});
    }
  }, [recommendedProducts, cartItems]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleWishlist = async (
    product: SimilarProduct,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const productId = product._id;
    const isWishlisted = wishlistedStates[productId];

    if (localWishlistLoading[productId] || wishlistLoading) return;

    setLocalWishlistLoading((prev) => ({ ...prev, [productId]: true }));

    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(productId)).unwrap();
        showToast(`${product.title} removed from wishlist`);
      } else {
        const capitalizedCategory =
          product.category.charAt(0).toUpperCase() + product.category.slice(1);

        await dispatch(
          addToWishlist({
            productId: productId,
            title: product.title,
            description: product.description,
            price: product.price,
            image: product.image,
            category: capitalizedCategory,
          }),
        ).unwrap();
        showToast(`${product.title} added to wishlist`);
      }

      setWishlistedStates((prev) => ({
        ...prev,
        [productId]: !isWishlisted,
      }));
    } catch (error) {
      showToast("Wishlist operation failed", "error");
      console.error("Wishlist operation failed:", error);
    } finally {
      setLocalWishlistLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = async (
    product: SimilarProduct,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const productId = product._id;
    const isInCart = cartStates[productId];

    if (localCartLoading[productId] || cartLoading) return;

    setLocalCartLoading((prev) => ({ ...prev, [productId]: true }));

    try {
      if (isInCart) {
        await dispatch(removeFromCart(productId)).unwrap();
        showToast(`${product.title} removed from cart`);

        setCartStates((prev) => ({
          ...prev,
          [productId]: false,
        }));
      } else {
        const cartItem = {
          productId: productId,
          title: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
          category: product.category,
          size: null,
          quantity: 1,
        };

        await dispatch(addToCart(cartItem)).unwrap();
        showToast(`${product.title} added to cart`);

        setCartStates((prev) => ({
          ...prev,
          [productId]: true,
        }));
      }
    } catch (error) {
      showToast("Cart operation failed", "error");
      console.error("Cart operation failed:", error);
    } finally {
      setLocalCartLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (error || recommendedProducts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1B2559] mb-1">
              You May Also Like
            </h2>
            <p className="text-sm text-gray-600">
              Hand-picked recommendations for you
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Products Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-4 pb-4">
            <AnimatePresence mode="popLayout">
              {recommendedProducts.map((product, index) => {
                const isWishlisted = wishlistedStates[product._id] || false;
                const isInCart = cartStates[product._id] || false;
                const isWishlistLoading =
                  localWishlistLoading[product._id] || false;
                const isCartLoading = localCartLoading[product._id] || false;
                const isLoading = isWishlistLoading || isCartLoading;

                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="flex-none w-[160px] sm:w-[180px] group"
                  >
                    <Link href={`/product/${product._id}`} className="block">
                      <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="160px"
                        />

                        {/* In Cart Badge */}
                        {isInCart && (
                          <div className="absolute top-2 left-2 bg-[#5D5FEF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10 flex items-center gap-1">
                            <CheckCircle size={10} />
                            In Cart
                          </div>
                        )}

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => handleWishlist(product, e)}
                          disabled={isWishlistLoading || wishlistLoading}
                          className={`absolute cursor-pointer top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50`}
                          aria-label={
                            isWishlisted
                              ? "Remove from wishlist"
                              : "Add to wishlist"
                          }
                        >
                          <Heart
                            size={14}
                            className={
                              isWishlisted
                                ? "fill-red-500 text-red-500"
                                : "text-gray-700"
                            }
                          />
                        </button>
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="flex flex-col flex-grow min-h-[140px]">
                      <Link href={`/product/${product._id}`} className="block">
                        <h3 className="text-xs sm:text-sm font-medium text-[#1B2559] line-clamp-2 mb-1 hover:text-[#5D5FEF] transition-colors">
                          {product.title}
                        </h3>
                      </Link>

                      <p className="text-[10px] text-gray-500 line-clamp-3 mb-2 flex-grow">
                        {product.description}
                      </p>

                      <div className="flex flex-col gap-2 mt-auto pt-2">
                        <span className="text-sm font-bold text-[#1B2559]">
                          ₹{product.price.toLocaleString()}
                        </span>

                        {isInCart ? (
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={isCartLoading || cartLoading}
                            className="w-full cursor-pointer flex items-center justify-center gap-2 p-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-xs font-semibold"
                          >
                            <>
                              <Trash2 size={14} />
                              <span>Remove from Cart</span>
                            </>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={isCartLoading || cartLoading}
                            className="w-full cursor-pointer bg-[#5D5FEF] hover:bg-[#4B4DC9] text-white py-1.5 rounded-md font-medium text-[10px] sm:text-xs transition-all duration-300 flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <>
                              <ShoppingBag size={14} />
                              <span>Add to Cart</span>
                            </>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

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
    </>
  );
}
