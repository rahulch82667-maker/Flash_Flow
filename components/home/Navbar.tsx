"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  LogOut,
  ChevronDown,
  Heart,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  Search,
  MapPin,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchWishlist } from "@/lib/redux/features/wishlist/wishlistSlice";
import SearchBar from "@/components/home/SearchBar";

interface NavbarProps {
  user?: {
    name?: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  } | null;
  onProfileClick?: () => void;
  onLogout?: () => void;
  authLoading?: boolean;
}

export default function Navbar({
  user,
  onProfileClick,
  onLogout,
  authLoading,
}: NavbarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const hasFetchedWishlist = useRef(false);
  const dispatch = useAppDispatch();
  const { items: cartItems } = useAppSelector((state) => state.cart);
  const { items: wishlistItems, loading: wishlistLoading } = useAppSelector(
    (state) => state.wishlist,
  );

  useEffect(() => {
    if (user && !hasFetchedWishlist.current && !wishlistLoading && wishlistItems.length === 0) {
      hasFetchedWishlist.current = true;
      dispatch(fetchWishlist());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!user) {
      hasFetchedWishlist.current = false;
    }
  }, [user]);

  // Navigation menus
  const navMenus = [
    { name: "Men", href: "/category/men" },
    { name: "Women", href: "/category/women" },
    { name: "Kids", href: "/category/kids" },
    { name: "Home", href: "/category/home" },
    { name: "Beauty", href: "/category/beauty" },
  ];

  const isActiveMenu = (href: string) => {
    return pathname === href;
  };

  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  return (
    <nav className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-xl z-50 border-b border-gray-200/50 shadow-md">
      <div className="px-6 sm:px-8 md:px-10 max-w-[1500px] mx-auto">
        {/* Main Row - Logo, Menu Items, Icons and Profile */}
        <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
          {/* Left Section - Logo and Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={24} className="text-[#1B2559]" />
              ) : (
                <MenuIcon size={24} className="text-[#1B2559]" />
              )}
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-4 group cursor-pointer"
            >
              <div
                className="transform transition-all duration-500 ease-in-out 
              group-hover:scale-125 
              group-hover:rotate-[15deg] 
              group-hover:drop-shadow-[0_10px_12px_rgba(93,95,239,0.35)]"
              >
                <Image
                  src="/Flow_logo_.png"
                  alt="Flash Flow"
                  width={42}
                  height={42}
                  className="object-contain w-9 h-9 sm:w-11 sm:h-11"
                />
              </div>

              <h1
                className="hidden sm:block text-base sm:text-lg md:text-xl font-black tracking-tighter uppercase 
              text-[#1B2559] transition-colors duration-300 group-hover:text-[#5D5FEF]"
              >
                Flash{" "}
                <span className="text-[#5D5FEF] group-hover:text-[#1B2559]">
                  Flow
                </span>
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation Menus - Centered */}
          <div className="hidden lg:flex items-center gap-8">
            {navMenus.map((menu) => {
              const active = isActiveMenu(menu.href);
              return (
                <Link
                  key={menu.name}
                  href={menu.href}
                  className={`relative text-[15px] font-bold transition-colors duration-300 group ${
                    active
                      ? "text-[#5D5FEF] font-extrabold"
                      : "text-[#1B2559] hover:text-[#5D5FEF]"
                  }`}
                >
                  {menu.name}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />

                  {active && (
                    <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-[#5D5FEF] rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section - Icons and Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Search Inline */}
            <div className="hidden lg:block shrink-0 mr-1">
               <SearchBar />
            </div>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
              aria-label="Wishlist"
            >
              <Heart
                size={22}
                className="text-[#1B2559] group-hover:text-[#5D5FEF] transition-colors"
              />
              
              {/* Badge */}
              <span
                className={`absolute -top-1 -right-1 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 font-medium shadow-md ${
                  wishlistItems.length > 0 
                    ? "bg-red-500" 
                    : "bg-gray-300"
                }`}
              >
                {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
              </span>
            </Link>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
              aria-label="Cart"
            >
              <ShoppingBag
                size={22}
                className="text-[#1B2559] group-hover:text-[#5D5FEF] transition-colors"
              />
              
              {/* Badge */}
              <span
                className={`absolute -top-1 -right-1 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 font-medium shadow-md ${
                  cartItems.length > 0 
                    ? "bg-[#5D5FEF]" 
                    : "bg-gray-300"
                }`}
              >
                {cartItems.length > 99 ? "99+" : cartItems.length}
              </span>
            </Link>

            {/* Profile Button */}
            {authLoading ? (
              <div className="relative flex items-center justify-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 animate-pulse border border-white/50 shadow-sm" />
              </div>
            ) : user ? (
              <div className="relative">
                <motion.button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm rounded-full pl-1 pr-3 sm:pr-4 py-1 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/50"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#5D5FEF] to-[#868CFF] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg">
                    {user?.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full object-cover w-full h-full"
                      />
                    ) : (
                      getUserInitial()
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1B2559]">
                      {getDisplayName()}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[#5D5FEF] transition-transform duration-300 ${
                        isProfileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 sm:w-56 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100/50 overflow-hidden z-50"
                    >
                      <div className="sm:hidden px-4 py-3 border-b border-gray-100/50">
                        <p className="text-sm font-bold text-[#1B2559]">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onProfileClick?.();
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-gray-700 hover:bg-[#5D5FEF]/10 transition-colors"
                      >
                        <User size={16} className="text-[#5D5FEF]" />
                        <span>My Profile</span>
                      </button>

                      <Link
                        href="/address"
                        className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-gray-700 hover:bg-[#5D5FEF]/10 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <MapPin size={16} className="text-[#5D5FEF]" />
                        <span>Manage Addresses</span>
                      </Link>

                      <Link
                        href="/orders"
                        className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-gray-700 hover:bg-[#5D5FEF]/10 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Package size={16} className="text-[#5D5FEF]" />
                        <span>Orders</span>
                      </Link>

                      <div className="lg:hidden">
                        <Link
                          href="/wishlist"
                          className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-700 hover:bg-[#5D5FEF]/10 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <div className="flex items-center gap-3">
                            <Heart size={16} className="text-[#5D5FEF]" />
                            <span>Wishlist</span>
                          </div>
                          {wishlistItems.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center font-bold">
                              {wishlistItems.length}
                            </span>
                          )}
                        </Link>

                        <Link
                          href="/cart"
                          className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-700 hover:bg-[#5D5FEF]/10 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <div className="flex items-center gap-3">
                            <ShoppingBag size={16} className="text-[#5D5FEF]" />
                            <span>Cart</span>
                          </div>
                          {cartItems.length > 0 && (
                            <span className="bg-[#5D5FEF] text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center font-bold">
                              {cartItems.length}
                            </span>
                          )}
                        </Link>
                      </div>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout?.();
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100/50"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="hidden sm:inline-block relative text-sm font-bold text-[#1B2559] hover:text-[#5D5FEF] transition-colors group"
                >
                  Log in
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] transition-all duration-300 group-hover:w-full" />
                </Link>

                <Link
                  href="/signup"
                  className="relative overflow-hidden bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] text-white px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-[#5D5FEF]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute top-0 -inset-full h-full w-1/2 transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu with Search Bar Inside */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden overflow-hidden border-t border-gray-100/50 bg-white/90 backdrop-blur-xl"
          >
            <div className="p-4 space-y-3 max-w-7xl mx-auto">
              {/* Search Bar inside Mobile Menu */}
              <div className="mb-2">
                <SearchBar isMobile onCloseMobile={() => setIsMobileMenuOpen(false)} />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100/50"></div>

              {/* Navigation Links */}
              {navMenus.map((menu) => {
                const active = isActiveMenu(menu.href);
                return (
                  <Link
                    key={menu.name}
                    href={menu.href}
                    className={`block px-5 py-4 rounded-xl transition-all font-bold ${
                      active
                        ? "bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] text-white shadow-lg font-extrabold"
                        : "text-[#1B2559] hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{menu.name}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Wishlist Link for Logged-in Users */}
              {user && (
                <>
                  <div className="border-t border-gray-100/50"></div>
                  <Link
                    href="/wishlist"
                    className="block px-5 py-4 text-[#1B2559] hover:bg-gray-50 rounded-xl transition-all font-bold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Heart size={20} className="text-[#5D5FEF]" />
                        <span className="text-base">Wishlist</span>
                      </div>
                      {wishlistItems.length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center font-bold">
                          {wishlistItems.length}
                        </span>
                      )}
                    </div>
                  </Link>

                  <Link
                    href="/cart"
                    className="block px-5 py-4 text-[#1B2559] hover:bg-gray-50 rounded-xl transition-all font-bold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShoppingBag size={20} className="text-[#5D5FEF]" />
                        <span className="text-base">Cart</span>
                      </div>
                      {cartItems.length > 0 && (
                        <span className="bg-[#5D5FEF] text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center font-bold">
                          {cartItems.length}
                        </span>
                      )}
                    </div>
                  </Link>
                </>
              )}

              {/* Auth Links for Non-logged-in Users */}
              {!user && (
                <div className="pt-2 space-y-2">
                  <div className="border-t border-gray-100/50"></div>
                  <Link
                    href="/login"
                    className="block px-5 py-4 text-[#1B2559] hover:bg-gray-50 rounded-xl transition-all font-bold text-base"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-5 py-4 bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] text-white rounded-xl font-bold text-base shadow-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}