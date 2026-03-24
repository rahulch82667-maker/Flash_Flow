"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  Star,
  StarHalf,
  ChevronLeft,
  ChevronRight,
  Truck,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle,
  X,
  Mail,
  LogOut,
  Calendar,
  ZoomIn,
  Move,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchProductById,
  clearProduct,
} from "@/lib/redux/features/product/productSlice";
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
import { fetchProductReviews } from "@/lib/redux/features/reviews/reviewsSlice";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/Footer";
import ProductReviews from "@/components/product/ProductReviews";
import SimilarProducts from "@/components/product/SimilarProducts";

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const productId = params.id as string;

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [customUser, setCustomUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [isZoomed, setIsZoomed] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Use refs to prevent multiple fetches
  const hasFetchedWishlist = useRef(false);
  const hasFetchedCart = useRef(false);
  const hasFetchedProduct = useRef(false);
  const hasFetchedReviews = useRef(false);

  const {
    product,
    loading: productLoading,
    error: productError,
  } = useAppSelector((state) => state.product);

  const { stats: reviewStats, loading: reviewsLoading } = useAppSelector(
    (state) => state.reviews,
  );

  const { items: wishlistItems, loading: wishlistLoading } = useAppSelector(
    (state) => state.wishlist,
  );

  const { items: cartItems, operationLoading: cartLoading } = useAppSelector(
    (state) => state.cart,
  );

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [localWishlistLoading, setLocalWishlistLoading] = useState(false);
  const [localCartLoading, setLocalCartLoading] = useState(false);

  // Fetch product and reviews only once
  useEffect(() => {
    if (productId) {
      if (!hasFetchedProduct.current) {
        hasFetchedProduct.current = true;
        dispatch(fetchProductById(productId));
      }

      if (!hasFetchedReviews.current) {
        hasFetchedReviews.current = true;
        dispatch(fetchProductReviews(productId));
      }
    }

    return () => {
      dispatch(clearProduct());
      // Reset refs when unmounting
      hasFetchedProduct.current = false;
      hasFetchedReviews.current = false;
    };
  }, [dispatch, productId]);

  // Fetch wishlist and cart only once when user is available
  useEffect(() => {
    const user = customUser || firebaseUser;
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
      }
    };
  }, [dispatch, customUser, firebaseUser]);

  // Update wishlist state
  useEffect(() => {
    if (product && wishlistItems.length > 0) {
      setIsWishlisted(
        wishlistItems.some((item) => item.productId === product._id),
      );
    } else {
      setIsWishlisted(false);
    }
  }, [product, wishlistItems]);

  // Update cart state
  useEffect(() => {
    if (product && cartItems.length > 0) {
      setIsInCart(cartItems.some((item) => item.productId === product._id));
    } else {
      setIsInCart(false);
    }
  }, [product, cartItems]);

  // Listen Firebase Auth State
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
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }

      setPageLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const user = customUser || firebaseUser;

  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", {
      method: "GET",
      credentials: "include",
    });
    router.replace("/");
  };

  const showToastMessage = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product || localCartLoading || cartLoading) return;

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

      await dispatch(addToCart(cartItem)).unwrap();
      showToastMessage(`${product.title} added to cart`, "success");
    } catch (error) {
      showToastMessage("Failed to add to cart", "error");
      console.error("Add to cart failed:", error);
    } finally {
      setLocalCartLoading(false);
    }
  };

  const handleRemoveFromCart = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product || localCartLoading || cartLoading) return;

    setLocalCartLoading(true);

    try {
      await dispatch(removeFromCart(product._id)).unwrap();
      showToastMessage(`${product.title} removed from cart`, "success");
    } catch (error) {
      showToastMessage("Failed to remove from cart", "error");
      console.error("Remove from cart failed:", error);
    } finally {
      setLocalCartLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product || localWishlistLoading || wishlistLoading) return;

    setLocalWishlistLoading(true);

    try {
      if (isWishlisted) {
        const result = await dispatch(removeFromWishlist(product._id));
        if (removeFromWishlist.fulfilled.match(result)) {
          showToastMessage(`${product.title} removed from wishlist`, "success");
        }
      } else {
        const capitalizedCategory =
          product.category.charAt(0).toUpperCase() + product.category.slice(1);

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
          showToastMessage(`${product.title} added to wishlist`, "success");
        }
      }
    } catch (error) {
      showToastMessage("Failed to update wishlist", "error");
      console.error("Error updating wishlist:", error);
    } finally {
      setLocalWishlistLoading(false);
    }
  };

  // Zoom handlers
  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  // Generate star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          size={16}
          className="fill-yellow-400 text-yellow-400"
        />,
      );
    }
    if (hasHalfStar) {
      stars.push(
        <StarHalf
          key="half"
          size={16}
          className="fill-yellow-400 text-yellow-400"
        />,
      );
    }
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} size={16} className="text-gray-300" />,
      );
    }
    return stars;
  };
    if ( pageLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={48} className="text-[#5D5FEF] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      );
    }


  if (productError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {productError ||
              "The product you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5D5FEF] text-white rounded-xl font-semibold hover:bg-[#4B4DC9] transition-all"
          >
            <ChevronLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  

  const isLoading = localWishlistLoading || localCartLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background decorative elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/20 rounded-full blur-[120px] pointer-events-none" />

      <Navbar
        user={user}
        onProfileClick={() => setShowProfile(true)}
        onLogout={handleLogout}
      />

      <main className="flex-grow pt-24 sm:pt-28 pb-24 lg:pb-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link
              href="/home"
              className="hover:text-[#5D5FEF] transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={14} />
            <Link
              href={`/category/${product.category}`}
              className="hover:text-[#5D5FEF] transition-colors"
            >
              {product.category.charAt(0).toUpperCase() +
                product.category.slice(1)}
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium truncate">
              {product.title}
            </span>
          </div>

          {/* Product Main Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="relative">
                <div
                  ref={imageRef}
                  className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden lg:max-w-md lg:mx-auto lg:w-full group cursor-zoom-in"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-110"
                    priority
                    sizes="(max-width: 768px) 100vw, 400px"
                  />

                  {/* Wishlist Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleWishlistToggle}
                    disabled={isLoading}
                    className="absolute cursor-pointer top-4 right-4 p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl transition-all z-10 disabled:opacity-50"
                  >
                    <Heart
                      size={20}
                      className={
                        isWishlisted
                          ? "fill-red-500 text-red-500"
                          : "text-gray-700"
                      }
                    />
                  </motion.button>

                  {/* Zoom Indicator */}
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn size={14} />
                    <span>Hover to zoom</span>
                  </div>
                </div>

                <AnimatePresence>
                  {isZoomed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                      onClick={() => setIsZoomed(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        className="relative w-full max-w-4xl aspect-square bg-white rounded-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="absolute top-4 right-4 z-10">
                          <button
                            onClick={() => setIsZoomed(false)}
                            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                          >
                            <X size={20} className="text-gray-700" />
                          </button>
                        </div>

                        <div className="relative w-full h-full">
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-contain"
                            priority
                            sizes="100vw"
                          />
                        </div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                          <Move size={16} />
                          <span>Use mouse wheel to zoom further</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-6">
                {/* Title and Category */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                      {product.category.charAt(0).toUpperCase() +
                        product.category.slice(1)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} /> In Stock
                    </span>
                    {product.isNewArrival && (
                      <span className="text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                        New Arrival
                      </span>
                    )}
                    {product.isTrending && (
                      <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                        Trending
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                    {product.title}
                  </h1>

                  {/* Rating*/}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {!reviewsLoading ? (
                        renderStars(reviewStats?.averageRating || 0)
                      ) : (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="w-4 h-4 bg-gray-200 rounded animate-pulse"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {reviewStats?.averageRating?.toFixed(1) || "0.0"} out of 5
                      ({reviewStats?.totalReviews || 0}{" "}
                      {reviewStats?.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="border-t border-b border-gray-100 py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {isInCart ? (
                    <button
                      onClick={handleRemoveFromCart}
                      disabled={localCartLoading || cartLoading}
                      className="flex-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 py-3 px-6 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <>
                        <Trash2 size={18} />
                        Remove from Cart
                      </>
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      disabled={localCartLoading || cartLoading}
                      className="flex-1 cursor-pointer bg-[#5D5FEF] hover:bg-[#4B4DC9] text-white py-3 px-6 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <>
                        <ShoppingBag size={18} />
                        Add to Cart
                      </>
                    </button>
                  )}

                  <button
                    onClick={handleWishlistToggle}
                    disabled={localWishlistLoading || wishlistLoading}
                    className={`flex-1 cursor-pointer py-3 px-6 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 border disabled:opacity-50 ${
                      isWishlisted
                        ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <>
                      <Heart
                        size={18}
                        className={isWishlisted ? "fill-red-500" : ""}
                      />
                      {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                    </>
                  </button>
                </div>

                {/* Shipping Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck size={18} className="text-[#5D5FEF]" />
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw size={18} className="text-[#5D5FEF]" />
                    <span>7 Days Return</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield size={18} className="text-[#5D5FEF]" />
                    <span>Secure Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mb-6">
            <ProductReviews productId={product._id} />
          </div>

          {/* Similar Products Section */}
          <SimilarProducts
            currentProductId={product._id}
            category={product.category}
          />
        </div>
      </main>
      <Footer />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
          >
            <div
              className={`px-4 py-3 rounded-lg shadow-xl font-medium text-sm flex items-center gap-2 ${
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

      {/* Profile Modal */}
      {showProfile && user && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowProfile(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-sm rounded-[35px] overflow-hidden shadow-2xl relative z-10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] p-6 text-center relative">
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              {/* Avatar */}
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 backdrop-blur-sm border-2 border-white/30">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user?.name || "User"}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  (user?.displayName || user?.name || user?.email)
                    ?.charAt(0)
                    .toUpperCase()
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {user?.displayName || user?.name || "User"}
              </h3>
              <p className="text-sm text-white/80">{user?.email}</p>
            </div>

            {/* User Details */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#5D5FEF]" />
                  <span className="text-sm text-gray-600">Role</span>
                </div>
                <span className="text-sm font-semibold text-[#1B2559]">
                  {customUser?.role || "user"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-[#5D5FEF]" />
                  <span className="text-sm text-gray-600">Verified</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    customUser?.isVerified ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {customUser?.isVerified ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#5D5FEF]" />
                  <span className="text-sm text-gray-600">Member since</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full mt-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
