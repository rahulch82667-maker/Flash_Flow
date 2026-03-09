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

interface NavbarProps {
  user?: {
    name?: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  } | null;
  onProfileClick?: () => void;
  onLogout?: () => void;
}

export default function Navbar({
  user,
  onProfileClick,
  onLogout,
}: NavbarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
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
  }, [dispatch, user]); // Remove wishlistItems.length and wishlistLoading from dependencies

  // Reset the ref when user changes (login/logout)
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
    <nav className="fixed top-0 inset-x-0 bg-white/70 backdrop-blur-xl z-50 border-b border-white/20 shadow-sm">
      <div className="h-16 sm:h-20 px-4 sm:px-6 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
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
            className="flex items-center gap-1 sm:gap-4 group cursor-pointer"
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
                width={40}
                height={40}
                className="object-contain w-8 h-8 sm:w-12 sm:h-12"
              />
            </div>

            <h1
              className="hidden sm:block text-sm sm:text-lg md:text-xl font-black tracking-tighter uppercase 
            text-[#1B2559] transition-colors duration-300 group-hover:text-[#5D5FEF]"
            >
              Flash{" "}
              <span className="text-[#5D5FEF] group-hover:text-[#1B2559]">
                Flow
              </span>
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation Menus */}
        <div className="hidden lg:flex items-center gap-6">
          {navMenus.map((menu) => {
            const active = isActiveMenu(menu.href);
            return (
              <Link
                key={menu.name}
                href={menu.href}
                className={`relative text-sm font-medium transition-colors group ${
                  active
                    ? "text-[#5D5FEF] font-semibold"
                    : "text-[#1B2559] hover:text-[#5D5FEF]"
                }`}
              >
                {menu.name}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-[#5D5FEF] transition-all duration-300 ${
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

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Search"
          >
            <Search size={20} className="text-[#1B2559]" />
          </button>

          <Link
            href="/wishlist"
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
            aria-label="Wishlist"
          >
            <Heart
              size={20}
              className="text-[#1B2559] group-hover:text-[#5D5FEF] transition-colors"
            />
            {user && wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 font-medium animate-in zoom-in">
                {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
              </span>
            )}
            {user && wishlistItems.length === 0 && (
              <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs w-[18px] h-[18px] rounded-full flex items-center justify-center">
                0
              </span>
            )}
            {!user && (
              <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs w-[18px] h-[18px] rounded-full flex items-center justify-center">
                0
              </span>
            )}
           
          </Link>

          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
            aria-label="Cart"
          >
            <ShoppingBag
              size={20}
              className="text-[#1B2559] group-hover:text-[#5D5FEF] transition-colors"
            />
            {user && cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#5D5FEF] text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 font-medium">
                {cartItems.length > 99 ? "99+" : cartItems.length}
              </span>
            )}
            {user && cartItems.length === 0 && (
              <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs w-[18px] h-[18px] rounded-full flex items-center justify-center">
                0
              </span>
            )}
            {!user && (
              <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs w-[18px] h-[18px] rounded-full flex items-center justify-center">
                0
              </span>
            )}
          </Link>

          {/* Profile Button */}
          {user ? (
            <div className="relative">
              <motion.button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm rounded-full pl-1 pr-3 sm:pr-4 py-1 shadow-md hover:shadow-lg transition-all duration-300 border border-white/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Avatar */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#5D5FEF] to-[#868CFF] rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-lg">
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
                  <span className="text-sm font-medium text-[#1B2559]">
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
                    className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="sm:hidden px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-[#1B2559]">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>

                    {/* Profile link */}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onProfileClick?.();
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} className="text-[#5D5FEF]" />
                      <span>My Profile</span>
                    </button>

                    {/* Settings link */}
                    <Link
                      href="/address"
                      className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <MapPin size={16} className="text-[#5D5FEF]" />
                      <span>Manage Addresses</span>
                    </Link>
                    <Link
                      href="/orders"
                      className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Package size={16} className="text-[#5D5FEF]" />
                      <span>Orders</span>
                    </Link>

                    <Link
                      href="/wishlist"
                      className="lg:hidden w-full px-4 py-3 flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <Heart size={16} className="text-[#5D5FEF]" />
                        <span>Wishlist</span>
                      </div>
                      {wishlistItems.length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {wishlistItems.length}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/cart"
                      className="lg:hidden w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <ShoppingBag size={16} className="text-[#5D5FEF]" />
                      <span>Cart</span>
                      {user && cartItems.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#5D5FEF] text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 font-medium">
                          {cartItems.length > 99 ? "99+" : cartItems.length}
                        </span>
                      )}
                      {user && cartItems.length === 0 && (
                        <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs w-[18px] h-[18px] rounded-full flex items-center justify-center">
                          0
                        </span>
                      )}
                      {!user && (
                        <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs w-[18px] h-[18px] rounded-full flex items-center justify-center">
                          0
                        </span>
                      )}
                    </Link>

                    {/* Logout button */}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout?.();
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // User is not logged in - Show auth buttons
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-block relative text-sm font-semibold text-[#1B2559] hover:text-[#5D5FEF] transition-colors group"
              >
                Log in
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#5D5FEF] transition-all duration-300 group-hover:w-full"></span>
              </Link>

              <Link
                href="/signup"
                className="relative overflow-hidden bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] text-white px-4 sm:px-6 py-2 rounded-full text-sm font-semibold shadow-indigo-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 group"
              >
                <span className="relative z-10">Sign Up</span>
                <div className="absolute top-0 -inset-full h-full w-1/2 transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-gray-100"
          >
            <div className="p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden overflow-hidden border-t border-gray-100"
          >
            <div className="p-4 space-y-2">
              {navMenus.map((menu) => {
                const active = isActiveMenu(menu.href);
                return (
                  <Link
                    key={menu.name}
                    href={menu.href}
                    className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                      active
                        ? "bg-[#5D5FEF] text-white"
                        : "text-[#1B2559] hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{menu.name}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Mobile Wishlist link with count */}
              {user && (
                <Link
                  href="/wishlist"
                  className="block px-4 py-3 text-[#1B2559] hover:bg-gray-50 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart size={18} className="text-[#5D5FEF]" />
                      <span>Wishlist</span>
                    </div>
                    {wishlistItems.length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {wishlistItems.length}
                      </span>
                    )}
                  </div>
                </Link>
              )}

              {/* Mobile Auth Links */}
              {!user && (
                <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                  <Link
                    href="/login"
                    className="block px-4 py-3 text-[#1B2559] hover:bg-gray-50 rounded-lg transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-4 py-3 bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] text-white rounded-lg font-medium"
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
