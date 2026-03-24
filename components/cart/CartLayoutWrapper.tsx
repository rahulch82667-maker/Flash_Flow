"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import NextImage from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  ChevronRight,
  CheckCircle,
  X,
  Mail,
  LogOut,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/cart/Footer";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchCart, setPromoData } from "@/lib/redux/features/cart/cartSlice";

export const CartUserContext = createContext<any>(null);

export function useCartUser() {
  return useContext(CartUserContext);
}

export default function CartLayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [customUser, setCustomUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Determine current step based on path
  const currentStep = 
    pathname === "/cart/payment" ? "payment" :
    pathname === "/cart/address" ? "address" : 
    "bag";

  const dispatch = useAppDispatch();
  const { items, loading: cartLoading } = useAppSelector(state => state.cart);
  const [cartFetched, setCartFetched] = useState(false);

  useEffect(() => {
    // Rehydrate promos securely natively before parsing the backend limits.
    const storedPromoCode = sessionStorage.getItem("promoCode");
    const storedPromoDiscount = sessionStorage.getItem("promoDiscount");
    
    if (storedPromoCode && storedPromoDiscount) {
      dispatch(setPromoData({
        promoCode: storedPromoCode,
        promoDiscount: Number(storedPromoDiscount)
      }));
    }

    dispatch(fetchCart()).finally(() => setCartFetched(true));
  }, [dispatch]);

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

      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, [router]);

  const user = customUser || firebaseUser;

  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", {
      method: "GET",
      credentials: "include",
    });
    router.replace("/");
  };

  const steps = [
    { id: "bag", label: "BAG", icon: ShoppingBag },
    { id: "address", label: "ADDRESS", icon: MapPin },
    { id: "payment", label: "PAYMENT", icon: CreditCard },
  ];

  if (loadingUser || !user || !cartFetched) {
    return null; // Return nothing or a full screen loader during auth check and initial cart fetch
  }

  // Prevent users from accessing address/payment with an empty cart
  if (items.length === 0 && currentStep !== "bag") {
    // Redirection is safer handled gracefully inside components, but here is a strong safeguard fallback
    router.replace("/cart");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/20 rounded-full blur-[120px] pointer-events-none" />

      <Navbar
        user={user}
        onProfileClick={() => setShowProfile(true)}
        onLogout={handleLogout}
      />

      <main className="flex-grow pt-24 sm:pt-28 pb-24 lg:pb-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link href="/home" className="hover:text-[#5D5FEF] transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link href="/cart" className="hover:text-[#5D5FEF] transition-colors">
              Shopping Cart
            </Link>
            {currentStep !== "bag" && (
              <>
                <ChevronRight size={14} />
                <span className="text-gray-900 font-medium capitalize">{currentStep}</span>
              </>
            )}
          </div>

          {/* Step Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = 
                  (currentStep === "address" && step.id === "bag") ||
                  (currentStep === "payment" && (step.id === "bag" || step.id === "address"));

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-[#5D5FEF] text-white shadow-lg shadow-indigo-200"
                            : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle size={18} />
                        ) : (
                          <Icon size={18} />
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium mt-2 ${
                          isActive ? "text-[#5D5FEF]" : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-[2px] mx-4 bg-gray-200 relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-[#5D5FEF] transition-all"
                          style={{
                            width: isCompleted ? "100%" : "0%",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content passed via Layout */}
          <CartUserContext.Provider value={user}>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </CartUserContext.Provider>

        </div>
      </main>

      <Footer />

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
            <div className="bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] p-6 text-center relative">
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

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
