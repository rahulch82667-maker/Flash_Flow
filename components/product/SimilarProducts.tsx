"use client";

import { useEffect, useState, useRef } from "react";
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
  AlertCircle
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { 
  fetchSimilarProducts, 
  clearSimilarProducts,
  SimilarProduct 
} from "@/lib/redux/features/similarProducts/similarProductsSlice";
import { 
  fetchWishlist, 
  addToWishlist, 
  removeFromWishlist 
} from "@/lib/redux/features/wishlist/wishlistSlice";
import { 
  addToCart, 
  removeFromCart,
  fetchCart 
} from "@/lib/redux/features/cart/cartSlice";

interface SimilarProductsProps {
  currentProductId: string;
  category: string;
}

export default function SimilarProducts({ currentProductId, category }: SimilarProductsProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { products, loading, error } = useAppSelector((state) => state.similarProducts);
  const { items: wishlistItems, loading: wishlistLoading } = useAppSelector((state) => state.wishlist);
  const { items: cartItems, operationLoading: cartLoading } = useAppSelector((state) => state.cart);
  
  const [wishlistedStates, setWishlistedStates] = useState<Record<string, boolean>>({});
  const [cartStates, setCartStates] = useState<Record<string, boolean>>({});
  const [localWishlistLoading, setLocalWishlistLoading] = useState<Record<string, boolean>>({});
  const [localCartLoading, setLocalCartLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 5;

  // Use refs to prevent multiple fetches
  const hasFetchedCart = useRef(false);
  const hasFetchedWishlist = useRef(false);
  const hasFetchedSimilarProducts = useRef(false);

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

  // Fetch similar products only when needed
  useEffect(() => {
    if (category && currentProductId && !hasFetchedSimilarProducts.current) {
      hasFetchedSimilarProducts.current = true;
      dispatch(fetchSimilarProducts({ 
        category, 
        currentProductId, 
        limit: 5 
      }));
    }

    return () => {
      dispatch(clearSimilarProducts());
      // Reset the ref when component unmounts
      hasFetchedSimilarProducts.current = false;
    };
  }, [dispatch, category, currentProductId]);

  // Update wishlist states
  useEffect(() => {
    if (products.length > 0 && wishlistItems.length > 0) {
      const states: Record<string, boolean> = {};
      products.forEach(product => {
        states[product._id] = wishlistItems.some(item => item.productId === product._id);
      });
      setWishlistedStates(states);
    } else {
      setWishlistedStates({});
    }
  }, [products, wishlistItems]);

  // Update cart states
  useEffect(() => {
    if (products.length > 0 && cartItems.length > 0) {
      const states: Record<string, boolean> = {};
      products.forEach(product => {
        states[product._id] = cartItems.some(item => item.productId === product._id);
      });
      setCartStates(states);
    } else {
      setCartStates({});
    }
  }, [products, cartItems]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleWishlist = async (product: SimilarProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const productId = product._id;
    const isWishlisted = wishlistedStates[productId];

    if (localWishlistLoading[productId] || wishlistLoading) return;

    setLocalWishlistLoading(prev => ({ ...prev, [productId]: true }));

    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(productId)).unwrap();
        showToast(`${product.title} removed from wishlist`);
      } else {
        const capitalizedCategory = product.category.charAt(0).toUpperCase() + product.category.slice(1);
        
        await dispatch(addToWishlist({
          productId: productId,
          title: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
          category: capitalizedCategory,
        })).unwrap();
        showToast(`${product.title} added to wishlist`);
      }
      
      setWishlistedStates(prev => ({
        ...prev,
        [productId]: !isWishlisted
      }));
    } catch (error) {
      showToast("Wishlist operation failed", "error");
      console.error("Wishlist operation failed:", error);
    } finally {
      setLocalWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = async (product: SimilarProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const productId = product._id;
    const isInCart = cartStates[productId];

    if (localCartLoading[productId] || cartLoading) return;

    setLocalCartLoading(prev => ({ ...prev, [productId]: true }));

    try {
      if (isInCart) {
        await dispatch(removeFromCart(productId)).unwrap();
        showToast(`${product.title} removed from cart`);
        
        setCartStates(prev => ({
          ...prev,
          [productId]: false
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
        
        setCartStates(prev => ({
          ...prev,
          [productId]: true
        }));
      }
    } catch (error) {
      showToast("Cart operation failed", "error");
      console.error("Cart operation failed:", error);
    } finally {
      setLocalCartLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('similar-products-container');
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-center items-center">
          <Loader2 size={32} className="text-[#5D5FEF] animate-spin" />
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null; 
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
        {/* Header  */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Similar Products
            </h2>
            <p className="text-sm text-gray-600">
              You might also like these
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Products Scroll Container */}
        <div
          id="similar-products-container"
          className="overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-4 pb-4">
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => {
                const isWishlisted = wishlistedStates[product._id] || false;
                const isInCart = cartStates[product._id] || false;
                const isWishlistLoading = localWishlistLoading[product._id] || false;
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
                    className="flex-none w-[200px] sm:w-[220px] group"
                  >
                    <Link href={`/product/${product._id}`}>
                      <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="200px"
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
                          className={`absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50`}
                          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        >
                         
                            <Heart 
                              size={14} 
                              className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'} 
                            />
                          
                        </button>
                      </div>
                    </Link>

                    {/* Product Info */}
                    <Link href={`/product/${product._id}`}>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1 hover:text-[#5D5FEF] transition-colors">
                        {product.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-2 h-8">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">
                        ₹{product.price.toLocaleString()}
                      </span>
                      
                      {/* Cart Button */}
                      {isInCart ? (
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={isCartLoading || cartLoading}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                          
                            <Trash2 size={12} />
                         
                          <span>Remove</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={isCartLoading || cartLoading}
                          className="px-3 py-1.5 bg-[#5D5FEF] text-white rounded-lg hover:bg-[#4B4DC9] transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                          
                            <>
                              <ShoppingBag size={12} />
                              <span>Add</span>
                            </>
                         
                        </button>
                      )}
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