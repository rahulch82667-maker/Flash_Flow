"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  ShoppingBag, 
  Trash2,
  ChevronRight,
  X,
  Mail,
  ShieldCheck,
  Calendar,
  LogOut,
  Loader2
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { 
  fetchWishlist, 
  removeFromWishlist, 
  clearWishlist,
  clearWishlistError 
} from "@/lib/redux/features/wishlist/wishlistSlice";
import Navbar from "@/components/home/Navbar";
import WishlistCard from "@/components/wishlist/WishlistCard";

export default function WishlistPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [customUser, setCustomUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const hasFetchedWishlist = useRef(false);
  const { items: wishlistItems, loading, error, totalItems, totalValue } = useAppSelector(
    (state) => state.wishlist
  );
  
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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
        } else {
          router.push("/");
        }
      } catch (error) {
        router.push("/");
      }

      setPageLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch wishlist on mount
useEffect(() => {
    const user = customUser || firebaseUser;
    if (user && !hasFetchedWishlist.current && !loading) {
      hasFetchedWishlist.current = true;
      dispatch(fetchWishlist());
    }
  }, [dispatch, customUser, firebaseUser, loading]);

  useEffect(() => {
    if (!customUser && !firebaseUser) {
      hasFetchedWishlist.current = false;
    }
  }, [customUser, firebaseUser]);

  // Show error toast
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearWishlistError());
    }
  }, [error, dispatch]);

  const user = customUser || firebaseUser;

  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", {
      method: "GET",
      credentials: "include",
    });
    router.replace("/");
  };

  const handleRemoveItem = async (id: string | number) => {
    const idToRemove = id.toString();
    const result = await dispatch(removeFromWishlist(idToRemove));
    if (removeFromWishlist.fulfilled.match(result)) {
      showToast("Item removed from wishlist", "success");
    }
  };

  const handleAddToCart = (id: string | number) => {
    const item = wishlistItems.find((item) => 
      item.id === id || item.productId === id.toString()
    );
    showToast(`${item?.title || 'Item'} added to cart`, "success");
    // Add to cart logic here
  };

  const handleClearWishlist = async () => {
    if (wishlistItems.length === 0) return;
    const result = await dispatch(clearWishlist());
    if (clearWishlist.fulfilled.match(result)) {
      showToast("Wishlist cleared", "success");
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5D5FEF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background decorative elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-100/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-100/20 rounded-full blur-[120px] pointer-events-none" />

      <Navbar 
        user={user} 
        onProfileClick={() => setShowProfile(true)}
        onLogout={handleLogout}
      />

      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Wishlist
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Showing {wishlistItems.length} {wishlistItems.length === 1 ? 'product' : 'products'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Total Value Badge */}
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">Total Value</p>
                <p className="text-sm font-bold text-gray-900">₹{totalValue.toLocaleString()}</p>
              </div>

              {/* Clear Wishlist Button */}
              {wishlistItems.length > 0 && (
                <button
                  onClick={handleClearWishlist}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-red-500 rounded-lg border border-red-200 hover:bg-red-50 transition-all active:scale-95 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  
                    <Trash2 size={16} />
                  
                  <span className="hidden sm:inline">Clear Wishlist</span>
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {loading && wishlistItems.length === 0 ? (
            <div className="flex justify-center items-center min-h-[400px]">
            </div>
          ) : wishlistItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={24} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Start adding items you love to your wishlist.
              </p>
              <Link
                href="/home"
                className="inline-block px-6 py-2 bg-[#5D5FEF] text-white rounded-lg font-medium text-sm hover:bg-[#4B4DC9] transition-all"
              >
                Shop Now
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Grid Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <AnimatePresence mode="popLayout">
                  {wishlistItems.map((item, index) => {
                    const itemId = item.id || item.productId;
                    const uniqueKey = itemId 
                      ? `wishlist-${itemId}`
                      : `wishlist-fallback-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    
                    return (
                      <WishlistCard
                        key={uniqueKey}
                        item={item}
                        onRemove={handleRemoveItem}
                        onAddToCart={handleAddToCart}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Bottom Navigation */}
              <div className="mt-8 flex justify-center">
                <Link
                  href="/home"
                  className="flex items-center gap-2 text-[#5D5FEF] font-medium text-sm hover:gap-3 transition-all group"
                >
                  <span>Continue Shopping</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

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
              className={`px-4 py-3 rounded-lg shadow-xl font-medium text-sm ${
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

      {/* Profile Modal */}
      {showProfile && user && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowProfile(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-sm rounded-[35px] overflow-hidden shadow-2xl relative z-10"
          >
            {/* Header with gradient */}
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
                  <NextImage
                    src={user.photoURL}
                    alt={user?.name || "User"}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  (user?.displayName || user?.name || user?.email)?.charAt(0).toUpperCase()
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
                <span className={`text-sm font-semibold ${
                  customUser?.isVerified ? "text-green-600" : "text-red-500"
                }`}>
                  {customUser?.isVerified ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#5D5FEF]" />
                  <span className="text-sm text-gray-600">Member since</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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