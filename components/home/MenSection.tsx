"use client";

import { memo, useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchMenProducts,
  Product,
} from "@/lib/redux/features/products/productsSlice";
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

// Product Card Component
const ProductCard = memo(
  ({
    product,
    index,
    user,
  }: {
    product: Product;
    index: number;
    user: any;
  }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { items: wishlistItems, loading: wishlistLoading } = useAppSelector(
      (state) => state.wishlist,
    );
    const { items: cartItems, operationLoading: cartLoading } = useAppSelector(
      (state) => state.cart,
    );

    const [localWishlistLoading, setLocalWishlistLoading] = useState(false);
    const [localCartLoading, setLocalCartLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

    const isWishlisted = wishlistItems.some(
      (item) => item.productId === product._id,
    );

    const isInCart = cartItems.some((item) => item.productId === product._id);

    const showToastMessage = (
      message: string,
      type: "success" | "error" = "success",
    ) => {
      setToastMessage(message);
      setToastType(type);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    const handleWishlistClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        router.push("/login");
        return;
      }

      if (localWishlistLoading || wishlistLoading) return;

      setLocalWishlistLoading(true);

      try {
        if (isWishlisted) {
          const result = await dispatch(removeFromWishlist(product._id));
          if (removeFromWishlist.fulfilled.match(result)) {
            showToastMessage(`${product.title} removed from wishlist`);
          }
        } else {
          // Capitalize category for wishlist
          const capitalizedCategory =
            product.category.charAt(0).toUpperCase() +
            product.category.slice(1);

          const wishlistItem = {
            productId: product._id,
            title: product.title,
            description: product.description,
            price: product.price,
            image: product.image,
            category: capitalizedCategory,
          };

          const result = await dispatch(addToWishlist(wishlistItem));
          if (addToWishlist.fulfilled.match(result)) {
            showToastMessage(`${product.title} added to wishlist`);
          }
        }
      } catch (error) {
        showToastMessage("Failed to update wishlist", "error");
      } finally {
        setLocalWishlistLoading(false);
      }
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        router.push("/login");
        return;
      }

      if (localCartLoading || cartLoading) return;

      setLocalCartLoading(true);

      try {
        const cartItem = {
          productId: product._id,
          title: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
          category: product.category,
          size: null,
          quantity: 1,
        };

        const result = await dispatch(addToCart(cartItem));
        if (addToCart.fulfilled.match(result)) {
          showToastMessage(`${product.title} added to cart`);
        }
      } catch (error) {
        showToastMessage("Failed to add to cart", "error");
      } finally {
        setLocalCartLoading(false);
      }
    };

    const handleRemoveFromCart = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        router.push("/login");
        return;
      }

      if (localCartLoading || cartLoading) return;

      setLocalCartLoading(true);

      try {
        const result = await dispatch(removeFromCart(product._id));
        if (removeFromCart.fulfilled.match(result)) {
          showToastMessage(`${product.title} removed from cart`);
        }
      } catch (error) {
        showToastMessage("Failed to remove from cart", "error");
      } finally {
        setLocalCartLoading(false);
      }
    };

    const cardVariants: Variants = {
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 15,
          delay: index * 0.1,
        },
      },
    };

    const isLoading = localWishlistLoading || localCartLoading;

    return (
      <>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col"
        >
          {/* Product Image Container */}
          <Link
            href={`/product/${product._id}`}
            className="block relative aspect-[3/4] overflow-hidden bg-gray-100 flex-shrink-0"
          >
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />

            {product.isNewArrival && (
              <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                NEW
              </div>
            )}

            {/* In Cart Badge */}
            {isInCart && (
              <div className="absolute top-3 left-3 bg-[#5D5FEF] text-white text-xs font-bold px-2 py-1 rounded-md z-10 flex items-center gap-1">
                <CheckCircle size={12} />
                In Cart
              </div>
            )}

            {/* Wishlist Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlistClick}
              disabled={isLoading}
              className={`absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 z-20 ${
                isWishlisted
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={
                isWishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
            >
              <Heart
                size={18}
                className={`transition-colors ${
                  isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700"
                }`}
              />
            </motion.button>
          </Link>

          {/* Product Details */}
          <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-1">
            <Link href={`/product/${product._id}`}>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] mb-1 hover:text-[#5D5FEF] transition-colors">
                {product.title}
              </h3>
            </Link>

            <Link href={`/product/${product._id}`}>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] mb-2 sm:mb-3">
                {product.description}
              </p>
            </Link>

            <div className="mb-2 sm:mb-3">
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                ₹{product.price.toLocaleString()}
              </span>
            </div>

            {/* Cart Button */}
            <div className="mt-auto">
              {isInCart ? (
                <button
                  onClick={handleRemoveFromCart}
                  disabled={localCartLoading || !user}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <>
                    <Trash2 size={14} />
                    <span>Remove from Cart</span>
                  </>
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={localCartLoading || !user}
                  className="w-full bg-[#5D5FEF] hover:bg-[#4B4DC9] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <>
                    <ShoppingBag size={14} />
                    <span>Add to Cart</span>
                  </>
                </button>
              )}
            </div>
          </div>

          {/* Trending Badge */}
          {product.isTrending && (
            <div className="absolute -top-1 -left-1 w-16 h-16 overflow-hidden">
              <div className="absolute top-0 left-0 transform -rotate-45 translate-x-[-30%] translate-y-[-30%] bg-orange-500 text-white text-[10px] font-bold py-1 w-20 text-center">
                TRENDING
              </div>
            </div>
          )}
        </motion.div>

        {/* Toast Notification  */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4 z-50"
            >
              <div
                className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
                  toastType === "success"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {toastType === "success" ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {toastMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  },
);

ProductCard.displayName = "ProductCard";

// Responsive Slider Component
const ResponsiveSlider = memo(
  ({ products, user }: { products: Product[]; user: any }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [itemsPerView, setItemsPerView] = useState(1);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate items per view based on screen size
    useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        if (width < 640) {
          setItemsPerView(2);
        } else if (width >= 640 && width < 1024) {
          setItemsPerView(3);
        } else {
          setItemsPerView(5);
        }
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const totalSlides =
      itemsPerView === 3 ? 2 : Math.ceil(products.length / itemsPerView);

    const getCurrentProducts = () => {
      if (itemsPerView === 3) {
        if (currentIndex === 0) {
          return products.slice(0, 3);
        } else {
          return products.slice(3, 5);
        }
      } else {
        const start = currentIndex * itemsPerView;
        return products.slice(start, start + itemsPerView);
      }
    };

    const currentProducts = getCurrentProducts();

    const goToSlide = useCallback(
      (index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsTransitioning(false), 300);
      },
      [isTransitioning],
    );

    const nextSlide = useCallback(() => {
      if (isTransitioning) return;
      goToSlide((currentIndex + 1) % totalSlides);
    }, [currentIndex, isTransitioning, goToSlide, totalSlides]);

    const prevSlide = useCallback(() => {
      if (isTransitioning) return;
      goToSlide(currentIndex === 0 ? totalSlides - 1 : currentIndex - 1);
    }, [currentIndex, isTransitioning, goToSlide, totalSlides]);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (touchStart - touchEnd > 75) {
        nextSlide();
      } else if (touchStart - touchEnd < -75) {
        prevSlide();
      }
      setTouchStart(0);
      setTouchEnd(0);
    };

    // Determine grid columns based on items per view
    const getGridCols = () => {
      if (itemsPerView === 2) return "grid-cols-2";
      if (itemsPerView === 3) return "grid-cols-3";
      return `grid-cols-${itemsPerView}`;
    };

    // Don't render slider on desktop
    if (itemsPerView === 5) {
      return (
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-5 xl:gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              index={index}
              user={user}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="block">
        <div
          className="relative px-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className={`w-full grid ${getGridCols()} gap-4`}
              >
                {currentProducts.map((product, idx) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    index={idx}
                    user={user}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prevSlide}
                disabled={isTransitioning}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 z-10"
                aria-label="Previous products"
              >
                <ChevronLeft size={18} className="text-gray-700" />
              </button>
              <button
                onClick={nextSlide}
                disabled={isTransitioning}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 z-10"
                aria-label="Next products"
              >
                <ChevronRight size={18} className="text-gray-700" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  disabled={isTransitioning}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-6 bg-[#5D5FEF]"
                      : "w-1.5 bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ResponsiveSlider.displayName = "ResponsiveSlider";

// Main MenSection Component
export default memo(function MenSection({ user }: { user: any }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { menProducts, loading, error } = useAppSelector((state) => ({
    menProducts: state.products.menProducts,
    loading: state.products.loading.men,
    error: state.products.error.men,
  }));

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlist());
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  useEffect(() => {
    if (menProducts.length === 0) {
      dispatch(fetchMenProducts());
    }
  }, [dispatch, menProducts.length]);

  if (loading) {
    return (
      <section className="w-full bg-gray-50 py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="text-center">
              <p className="text-gray-600">Loading latest styles...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || menProducts.length === 0) {
    return (
      <section className="w-full bg-gray-50 py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {error || "No products available at the moment."}
            </p>
            <button
              onClick={() => dispatch(fetchMenProducts())}
              className="mt-4 px-6 py-2 bg-[#5D5FEF] text-white rounded-lg hover:bg-[#4B4DC9] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-gray-50 py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden relative">
      {/* Background Decoration */}
      <div className="absolute left-0 top-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-100/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute right-0 bottom-0 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-100/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 md:mb-12">
          <div className="text-center sm:text-left">
            <span className="text-xs sm:text-sm font-semibold text-[#5D5FEF] uppercase tracking-wider">
              Latest Collection
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mt-2">
              Men's{" "}
              <span className="bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] bg-clip-text text-transparent">
                Latest Styles
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-2xl mx-auto sm:mx-0">
              Discover the newest arrivals in men's fashion. From casual wear to
              formal essentials.
            </p>
          </div>

          {/* View All Link */}
          <Link
            href="/category/men"
            className="inline-flex items-center gap-2 text-[#5D5FEF] font-semibold text-xs sm:text-sm md:text-base mt-4 sm:mt-0 hover:gap-3 transition-all group self-center sm:self-auto"
          >
            View All Collection
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Responsive Slider - Works on all devices */}
        <ResponsiveSlider products={menProducts} user={user} />
      </div>
    </section>
  );
});
