"use client";

import { memo, useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Shirt,
  Footprints,
  Award,
  Watch,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchMenCategoryProducts,
  setMenPage,
  CategoryProduct,
} from "@/lib/redux/features/categoryProducts/categoryProductsSlice";
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  WishlistItem,
} from "@/lib/redux/features/wishlist/wishlistSlice";
import {
  addToCart,
  removeFromCart,
  fetchCart,
} from "@/lib/redux/features/cart/cartSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SubcategoryCard = memo(({ subcategory, icon: Icon, isSelected, onClick }: { 
  subcategory: string; 
  icon: any; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  const getSubcategoryImage = () => {
    switch(subcategory) {
      case "Clothing":
        return "/men_clothing.png";
      case "Footwear":
        return "/men_footwear.png";
      case "Sports":
        return "/men_sports.png";
      case "Accessories":
        return "/men_accessories.png";
      default:
        return "/men_product_1.webp";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex-none w-[140px] sm:w-[160px] ${
        isSelected ? 'ring-2 ring-[#5D5FEF] ring-offset-2' : ''
      }`}
    >
      <div className="relative h-24 sm:h-28 w-full bg-gray-100">
        <img
          src={getSubcategoryImage()}
          alt={subcategory}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=" + subcategory;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-2 text-white">
          <div className="flex items-center gap-1">
            <Icon size={14} className="text-white" />
            <span className="text-xs font-bold">{subcategory}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

SubcategoryCard.displayName = "SubcategoryCard";

const SubcategoriesSlider = memo(({ 
  subcategories, 
  selectedSubcategory, 
  onSubcategoryClick 
}: { 
  subcategories: Array<{ name: string; icon: any }>;
  selectedSubcategory: string | null;
  onSubcategoryClick: (subcategory: string) => void;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      setTimeout(checkScrollPosition, 100);
      
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!isMobile) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Shop by Category</h3>
        <div className="grid grid-cols-4 gap-3">
          {subcategories.map((sub) => (
            <SubcategoryCard
              key={sub.name}
              subcategory={sub.name}
              icon={sub.icon}
              isSelected={selectedSubcategory === sub.name}
              onClick={() => onSubcategoryClick(sub.name)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Shop by Category</h3>
        
        {/* Mobile scroll hint */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Swipe →</span>
        </div>
      </div>

      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all border border-gray-200"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all border border-gray-200"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-3">
            <AnimatePresence mode="popLayout">
              {subcategories.map((sub) => (
                <SubcategoryCard
                  key={sub.name}
                  subcategory={sub.name}
                  icon={sub.icon}
                  isSelected={selectedSubcategory === sub.name}
                  onClick={() => onSubcategoryClick(sub.name)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Scroll Progress Indicator */}
        <div className="flex justify-center mt-2">
          <div className="flex gap-1">
            {subcategories.map((_, index) => {
              const activeIndex = selectedSubcategory 
                ? subcategories.findIndex(s => s.name === selectedSubcategory)
                : 0;
              
              if (Math.abs(index - activeIndex) <= 2) {
                return (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? 'w-6 bg-[#5D5FEF]'
                        : 'w-1 bg-gray-300'
                    }`}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

SubcategoriesSlider.displayName = "SubcategoriesSlider";

const ProductCard = memo(
  ({ product, uniqueKey, user }: { product: CategoryProduct; uniqueKey: string; user: any }) => {
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

    const productId =
      product?.id?.toString() || (product as any)?._id?.toString();

    const isWishlisted = productId
      ? wishlistItems.some((item) => item.productId === productId)
      : false;

    const isInCart = productId
      ? cartItems.some((item) => item.productId === productId)
      : false;

    const showToastMessage = (message: string, type: "success" | "error" = "success") => {
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

      if (localWishlistLoading || wishlistLoading || !productId) return;

      setLocalWishlistLoading(true);

      try {
        if (isWishlisted) {
          await dispatch(removeFromWishlist(productId)).unwrap();
          showToastMessage(`${product.title} removed from wishlist`);
        } else {
          const wishlistItem: Omit<WishlistItem, "id"> = {
            productId: productId,
            title: product.title || "Untitled Product",
            description: product.description || "",
            price: product.price || 0,
            image: product.image || "/placeholder-image.jpg",
            category: "Men",
          };
          await dispatch(addToWishlist(wishlistItem)).unwrap();
          showToastMessage(`${product.title} added to wishlist`);
        }
      } catch (error) {
        showToastMessage("Wishlist operation failed", "error");
        console.error("Wishlist operation failed:", error);
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

      if (localCartLoading || cartLoading || !productId) return;

      setLocalCartLoading(true);

      try {
        const cartItem = {
          productId: productId,
          title: product.title || "Untitled Product",
          description: product.description || "",
          price: product.price || 0,
          image: product.image || "/placeholder-image.jpg",
          category: "men",
          size: null,
          quantity: 1,
        };

        await dispatch(addToCart(cartItem)).unwrap();
        showToastMessage(`${product.title} added to cart`);
      } catch (error) {
        showToastMessage("Failed to add to cart", "error");
        console.error("Add to cart failed:", error);
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

      if (localCartLoading || cartLoading || !productId) return;

      setLocalCartLoading(true);

      try {
        await dispatch(removeFromCart(productId)).unwrap();
        showToastMessage(`${product.title} removed from cart`);
      } catch (error) {
        showToastMessage("Failed to remove from cart", "error");
        console.error("Remove from cart failed:", error);
      } finally {
        setLocalCartLoading(false);
      }
    };

    if (!product) return null;

    const isLoading = localWishlistLoading || localCartLoading;
    const isDisabled = !productId;

    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col"
        >
          <Link href={`/product/${product.id}`}>
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 flex-shrink-0">
              <Image
                src={product.image || "/placeholder-image.jpg"}
                alt={product.title || "Product image"}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {product.isNew && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm z-10">
                  NEW
                </div>
              )}

              {/* In Cart Badge */}
              {isInCart && (
                <div className="absolute top-2 left-2 bg-[#5D5FEF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm z-10 flex items-center gap-1">
                  <CheckCircle size={10} />
                  In Cart
                </div>
              )}

              <button
                onClick={handleWishlistClick}
                disabled={isLoading || isDisabled}
                className={`absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 z-20 hover:scale-110 ${
                  isWishlisted
                    ? "opacity-100 bg-red-50"
                    : "opacity-0 group-hover:opacity-100"
                } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
               
                  <Heart
                    size={16}
                    className={
                      isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700"
                    }
                  />
               
              </button>
            </div>
          </Link>

          <div className="p-2 sm:p-2.5 flex flex-col flex-1">
            <Link href={`/product/${product.id}`}>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 min-h-[2rem] mb-1 hover:text-[#5D5FEF] transition-colors">
                {product.title || "Untitled Product"}
              </h3>
            </Link>

            <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 min-h-[1.8rem] mb-1.5">
              {product.description || "No description available"}
            </p>

            <div className="mb-1.5">
              <span className="text-sm sm:text-base font-bold text-gray-900">
                ₹{(product.price || 0).toLocaleString()}
              </span>
            </div>

            <div className="mt-auto">
              {isInCart ? (
                <button
                  onClick={handleRemoveFromCart}
                  disabled={localCartLoading || !user}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-md font-medium text-[10px] sm:text-xs transition-all duration-300 flex items-center justify-center gap-1 disabled:opacity-50"
                >
                 
                    <>
                      <Trash2 size={10} />
                      <span>Remove from Cart</span>
                    </>
                  
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={localCartLoading || !user}
                  className="w-full bg-[#5D5FEF] hover:bg-[#4B4DC9] text-white py-1.5 rounded-md font-medium text-[10px] sm:text-xs transition-all duration-300 flex items-center justify-center gap-1 disabled:opacity-50"
                >
                 
                    <>
                      <ShoppingBag size={10} />
                      <span>Add to Cart</span>
                    </>
                 
                </button>
              )}
            </div>
          </div>

          {product.isTrending && (
            <div className="absolute -top-1 -left-1 w-10 h-10 overflow-hidden">
              <div className="absolute top-0 left-0 transform -rotate-45 translate-x-[-30%] translate-y-[-30%] bg-orange-500 text-white text-[7px] font-bold py-0.5 w-14 text-center">
                TRENDING
              </div>
            </div>
          )}
        </motion.div>

        {/* Toast Notification */}
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
                  toastType === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
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

const Pagination = memo(
  ({
    currentPage,
    totalPages,
    onPageChange,
    loading,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    loading: boolean;
  }) => {
    const getVisiblePages = (): (number | string)[] => {
      const delta = 2;
      const range: number[] = [];
      const rangeWithDots: (number | string)[] = [];
      let l: number | undefined;

      for (let i = 1; i <= totalPages; i++) {
        if (
          i === 1 ||
          i === totalPages ||
          (i >= currentPage - delta && i <= currentPage + delta)
        ) {
          range.push(i);
        }
      }

      range.forEach((i) => {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push("...");
          }
        }
        rangeWithDots.push(i);
        l = i;
      });

      return rangeWithDots;
    };

    const paginationId = useMemo(
      () => `pagination-${Math.random().toString(36).substr(2, 9)}`,
      [],
    );

    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6 sm:mt-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-xs ${
            currentPage === 1 || loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-600 hover:bg-[#5D5FEF] hover:text-white shadow-sm"
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {getVisiblePages().map((page, index) => {
          if (page === "...") {
            const dotsKey = `${paginationId}-dots-${index}-${currentPage}`;
            return (
              <span
                key={dotsKey}
                className="text-gray-400 px-1 text-xs select-none"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const pageKey = `${paginationId}-page-${page}`;

          return (
            <button
              key={pageKey}
              onClick={() => onPageChange(page as number)}
              disabled={loading}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md font-medium text-xs transition-all ${
                currentPage === page
                  ? "bg-[#5D5FEF] text-white shadow-sm hover:bg-[#4B4DC9]"
                  : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-xs ${
            currentPage === totalPages || loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-600 hover:bg-[#5D5FEF] hover:text-white shadow-sm"
          }`}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    );
  },
);

Pagination.displayName = "Pagination";

interface MenCollectionProps {
  user: any;
}

export default memo(function MenCollection({ user }: MenCollectionProps) {
  const dispatch = useAppDispatch();
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  
  // Use refs to prevent multiple fetches
  const hasFetchedWishlist = useRef(false);
  const hasFetchedCart = useRef(false);
  const hasInitialFetch = useRef(false);

  const { menProducts, menPagination, loading, error } = useAppSelector(
    (state) => ({
      menProducts: state.categoryProducts.menProducts,
      menPagination: state.categoryProducts.menPagination,
      loading: state.categoryProducts.loading.men,
      error: state.categoryProducts.error.men,
    }),
  );

  const subcategories = [
    { name: "Clothing", icon: Shirt },
    { name: "Footwear", icon: Footprints },
    { name: "Sports", icon: Award },
    { name: "Accessories", icon: Watch },
  ];

  // Fetch wishlist and cart only once
  useEffect(() => {
    if (user) {
      if (!hasFetchedWishlist.current) {
        hasFetchedWishlist.current = true;
        dispatch(fetchWishlist());
      }
      
      if (!hasFetchedCart.current) {
        hasFetchedCart.current = true;
        dispatch(fetchCart());
      }
    }
    
    // Reset refs when user logs out
    return () => {
      if (!user) {
        hasFetchedWishlist.current = false;
        hasFetchedCart.current = false;
        hasInitialFetch.current = false;
      }
    };
  }, [dispatch, user]);

  // Fetch products only when needed (initial load, page change, or subcategory change)
  useEffect(() => {
    // Only fetch if we have a user and we haven't fetched initial data OR if filters change
    if (user) {
      // Always fetch when subcategory or page changes, even if we've fetched before
      dispatch(
        fetchMenCategoryProducts({
          page: menPagination.page,
          limit: menPagination.productsPerPage,
          subcategory: selectedSubcategory || undefined,
        }),
      );
    }
  }, [
    dispatch, 
    user, 
    menPagination.page, 
    menPagination.productsPerPage, 
    selectedSubcategory
  ]);

  const handleSubcategoryClick = (subcategory: string) => {
    setSelectedSubcategory(prev => prev === subcategory ? null : subcategory);
    dispatch(setMenPage(1));
  };

  const handlePageChange = useCallback(
    (page: number) => {
      dispatch(setMenPage(page));
      const productsGrid = document.getElementById("products-grid");
      if (productsGrid) {
        productsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [dispatch],
  );

  if (error) {
    return (
      <section className="w-full py-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() =>
              dispatch(
                fetchMenCategoryProducts({
                  page: 1,
                  limit: menPagination.productsPerPage,
                }),
              )
            }
            className="px-4 py-2 bg-[#5D5FEF] text-white rounded-md hover:bg-[#4B4DC9] transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-3 sm:py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Men's Collection
          </h2>
          <p className="text-xs text-gray-500">
            {menPagination.totalProducts} products
            {selectedSubcategory && ` in ${selectedSubcategory}`}
          </p>
        </div>
        
        {/* Clear Filter Button */}
        {selectedSubcategory && (
          <button
            onClick={() => setSelectedSubcategory(null)}
            className="text-xs text-[#5D5FEF] font-medium hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      <SubcategoriesSlider
        subcategories={subcategories}
        selectedSubcategory={selectedSubcategory}
        onSubcategoryClick={handleSubcategoryClick}
      />

      {/* Products Grid */}
      <div id="products-grid" className="mt-8 sm:mt-10">
        {loading && menProducts.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 size={40} className="text-[#5D5FEF] animate-spin" />
          </div>
        ) : menProducts.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg">
            <p className="text-gray-500">No products found in this category</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSubcategory || 'all'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3"
            >
              {menProducts.map((product, index) => {
                const productId = product?.id || (product as any)?._id;
                const uniqueKey = productId
                  ? `product-${productId}`
                  : `product-fallback-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                return (
                  <ProductCard
                    key={uniqueKey}
                    product={product}
                    uniqueKey={uniqueKey}
                    user={user}
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {menPagination.totalPages > 1 && !loading && (
        <Pagination
          currentPage={menPagination.page}
          totalPages={menPagination.totalPages}
          onPageChange={handlePageChange}
          loading={loading}
        />
      )}
    </section>
  );
});