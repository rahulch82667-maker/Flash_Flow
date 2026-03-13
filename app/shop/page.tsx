"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  Star,
  Heart,
  ShoppingBag,
  ChevronLeft,
  Loader2,
  Check,
  ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchFilteredProducts,
  fetchPriceRange,
  setSelectedCategory,
  toggleSubcategory,
  setPriceRange,
  setSortBy,
  setPage,
  clearFilters,
} from "@/lib/redux/features/categoryFilter/categoryFilterSlice";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/Footer";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Category data with subcategories
const categoryData = {
  men: {
    name: "Men",
    subcategories: ["Clothing", "Footwear", "Sports", "Accessories"],
  },
  women: {
    name: "Women",
    subcategories: ["Clothing", "Footwear", "Accessories", "Jewelery", "Beauty"],
  },
  kids: {
    name: "Kids",
    subcategories: ["Boys", "Girls", "Footwear", "Toys"],
  },
  home: {
    name: "Home & Living",
    subcategories: ["Home decor", "Furnishing", "Kitchen", "Groceries", "Electronics", "Gadgets", "Books"],
  },
  beauty: {
    name: "Beauty",
    subcategories: ["Makeup", "Skincare", "Haircare", "Fragrance"],
  },
};

// Price ranges presets
const priceRanges = [
  { label: "Under ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 - ₹3,000", min: 1000, max: 3000 },
  { label: "₹3,000 - ₹5,000", min: 3000, max: 5000 },
  { label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
  { label: "Above ₹10,000", min: 10000, max: 100000 },
];

// Sort options
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [customUser, setCustomUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    subcategory: true,
    price: true,
  });

  const {
    selectedCategory,
    selectedSubcategories,
    priceRange,
    minPrice,
    maxPrice,
    sortBy,
    products,
    loading,
    pagination,
  } = useAppSelector((state) => state.categoryFilter);

  // Get initial category from URL
  useEffect(() => {
    const category = searchParams.get('category');
    if (category && category !== selectedCategory) {
      dispatch(setSelectedCategory(category));
    }
  }, [searchParams]);

  // Fetch price range when category changes
  useEffect(() => {
    if (selectedCategory) {
      dispatch(fetchPriceRange(selectedCategory));
    } else {
      dispatch(fetchPriceRange(null));
    }
  }, [selectedCategory, dispatch]);

  // Fetch products when filters change
  useEffect(() => {
    dispatch(fetchFilteredProducts({
      category: selectedCategory,
      subcategories: selectedSubcategories,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sortBy,
      page: pagination.page,
      limit: pagination.limit,
    }));
  }, [
    selectedCategory,
    selectedSubcategories,
    priceRange,
    sortBy,
    pagination.page,
    dispatch,
  ]);

  // Auth effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) setFirebaseUser(user);

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

      setPageLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const user = customUser || firebaseUser;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePriceRangeSelect = (min: number, max: number) => {
    dispatch(setPriceRange([min, max]));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onProfileClick={() => setShowProfile(true)} />

      <main className="pt-20 sm:pt-24 pb-12 mt-6 mb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2559]">
              {selectedCategory ? categoryData[selectedCategory as keyof typeof categoryData]?.name || 'All Products' : 'All Products'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Showing {products.length} of {pagination.total} products
            </p>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden w-full mb-6 flex items-center justify-center gap-2 bg-white py-3 rounded-xl shadow-sm border border-gray-200"
          >
            <SlidersHorizontal size={18} />
            <span className="font-medium">Filters</span>
            {(selectedSubcategories.length > 0 || sortBy || priceRange[0] > minPrice || priceRange[1] < maxPrice) && (
              <span className="w-2 h-2 bg-[#5D5FEF] rounded-full" />
            )}
          </button>

          <div className="flex gap-8">
            {/* Filters Sidebar - Desktop */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#1B2559]">Filters</h3>
                  {(selectedSubcategories.length > 0 || sortBy || priceRange[0] > minPrice || priceRange[1] < maxPrice) && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-[#5D5FEF] hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="mb-4 border-b border-gray-100 pb-4">
                  <button
                    onClick={() => toggleSection('category')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="font-medium text-[#1B2559]">Category</span>
                    {expandedSections.category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedSections.category && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => dispatch(setSelectedCategory(null))}
                        className={`block w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                          !selectedCategory
                            ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        All Categories
                      </button>
                      {Object.entries(categoryData).map(([key, { name }]) => (
                        <button
                          key={key}
                          onClick={() => dispatch(setSelectedCategory(key))}
                          className={`block w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedCategory === key
                              ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subcategory Filter */}
                {selectedCategory && categoryData[selectedCategory as keyof typeof categoryData] && (
                  <div className="mb-4 border-b border-gray-100 pb-4">
                    <button
                      onClick={() => toggleSection('subcategory')}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <span className="font-medium text-[#1B2559]">Subcategory</span>
                      {expandedSections.subcategory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSections.subcategory && (
                      <div className="mt-3 space-y-2">
                        {categoryData[selectedCategory as keyof typeof categoryData].subcategories.map((sub) => (
                          <label key={sub} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSubcategories.includes(sub)}
                              onChange={() => dispatch(toggleSubcategory(sub))}
                              className="w-4 h-4 rounded border-gray-300 text-[#5D5FEF] focus:ring-[#5D5FEF]"
                            />
                            <span className="text-sm text-gray-600">{sub}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Price Range Filter */}
                <div className="mb-4 border-b border-gray-100 pb-4">
                  <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="font-medium text-[#1B2559]">Price Range</span>
                    {expandedSections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedSections.price && (
                    <div className="mt-3 space-y-2">
                      {priceRanges.map((range) => (
                        <button
                          key={range.label}
                          onClick={() => handlePriceRangeSelect(range.min, range.max)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                            priceRange[0] === range.min && priceRange[1] === range.max
                              ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort By */}
                <div>
                  <h4 className="font-medium text-[#1B2559] mb-3">Sort By</h4>
                  <select
                    value={sortBy || ''}
                    onChange={(e) => dispatch(setSortBy(e.target.value as any || null))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5D5FEF]"
                  >
                    <option value="">Default</option>
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Filters Modal */}
            <AnimatePresence>
              {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-[#1B2559] text-lg">Filters</h3>
                        <button
                          onClick={() => setMobileFiltersOpen(false)}
                          className="p-2 hover:bg-gray-100 rounded-full"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Category Filter */}
                        <div>
                          <h4 className="font-medium text-[#1B2559] mb-3">Category</h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                dispatch(setSelectedCategory(null));
                                setMobileFiltersOpen(false);
                              }}
                              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                !selectedCategory
                                  ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              All Categories
                            </button>
                            {Object.entries(categoryData).map(([key, { name }]) => (
                              <button
                                key={key}
                                onClick={() => {
                                  dispatch(setSelectedCategory(key));
                                  setMobileFiltersOpen(false);
                                }}
                                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  selectedCategory === key
                                    ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Subcategory Filter */}
                        {selectedCategory && categoryData[selectedCategory as keyof typeof categoryData] && (
                          <div>
                            <h4 className="font-medium text-[#1B2559] mb-3">Subcategory</h4>
                            <div className="space-y-2">
                              {categoryData[selectedCategory as keyof typeof categoryData].subcategories.map((sub) => (
                                <label key={sub} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedSubcategories.includes(sub)}
                                    onChange={() => dispatch(toggleSubcategory(sub))}
                                    className="w-4 h-4 rounded border-gray-300 text-[#5D5FEF] focus:ring-[#5D5FEF]"
                                  />
                                  <span className="text-sm text-gray-600">{sub}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Price Range Filter */}
                        <div>
                          <h4 className="font-medium text-[#1B2559] mb-3">Price Range</h4>
                          <div className="space-y-2">
                            {priceRanges.map((range) => (
                              <button
                                key={range.label}
                                onClick={() => {
                                  handlePriceRangeSelect(range.min, range.max);
                                  setMobileFiltersOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  priceRange[0] === range.min && priceRange[1] === range.max
                                    ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {range.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sort By */}
                        <div>
                          <h4 className="font-medium text-[#1B2559] mb-3">Sort By</h4>
                          <select
                            value={sortBy || ''}
                            onChange={(e) => {
                              dispatch(setSortBy(e.target.value as any || null));
                              setMobileFiltersOpen(false);
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          >
                            <option value="">Default</option>
                            {sortOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1B2559] mb-2">No products found</h3>
                  <p className="text-sm text-gray-500 mb-6">Try adjusting your filters</p>
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-2 bg-[#5D5FEF] text-white rounded-lg text-sm font-medium hover:bg-[#4B4DC9]"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map((product, index) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden group"
                      >
                        <Link href={`/product/${product._id}`}>
                          <div className="relative aspect-square overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {product.isNewArrival && (
                              <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                NEW
                              </span>
                            )}
                            {product.isTrending && (
                              <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                HOT
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="p-3">
                          <Link href={`/product/${product._id}`}>
                            <h3 className="text-sm font-medium text-[#1B2559] line-clamp-2 mb-1 hover:text-[#5D5FEF]">
                              {product.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-[#5D5FEF]">
                              ₹{product.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] px-2 py-1 bg-gray-100 rounded-full capitalize">
                              {product.subcategory}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#5D5FEF] transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (pagination.pages > 5) {
                          if (pagination.page > 3) {
                            pageNum = pagination.page - 3 + i + 1;
                          }
                        }
                        if (pageNum <= pagination.pages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-10 rounded-lg font-medium ${
                                pagination.page === pageNum
                                  ? 'bg-[#5D5FEF] text-white'
                                  : 'border border-gray-200 hover:border-[#5D5FEF]'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return null;
                      })}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#5D5FEF] transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Profile Modal */}
      {showProfile && user && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg">
            <div className="bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] text-white p-6 text-center relative rounded-t-2xl">
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-3 right-4 text-white/80 hover:text-white"
              >
                ✕
              </button>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
              <div className="text-xl font-bold mb-1">
                {user?.displayName || user?.name || "User"}
              </div>
              <p className="text-white/80 text-sm">{user?.email}</p>
            </div>
            <div className="p-6">
              <button
                onClick={() => {
                  setShowProfile(false);
                  // Add logout logic here if needed
                }}
                className="w-full py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}