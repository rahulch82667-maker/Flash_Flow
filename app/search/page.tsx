"use client";

import { useState, useEffect, Suspense } from "react";
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
  Loader2,
  ChevronRight,
  ChevronLeft,
  Search,
} from "lucide-react";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/Footer";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useAppSelector } from "@/lib/redux/hooks";

const categoryData = {
  men: { name: "Men", subcategories: ["Clothing", "Footwear", "Sports", "Accessories"] },
  women: { name: "Women", subcategories: ["Clothing", "Footwear", "Accessories", "Jewelery", "Beauty"] },
  kids: { name: "Kids", subcategories: ["Boys", "Girls", "Footwear", "Toys"] },
  home: { name: "Home & Living", subcategories: ["Home decor", "Furnishing", "Kitchen", "Groceries", "Electronics", "Gadgets", "Books"] },
  beauty: { name: "Beauty", subcategories: ["Makeup", "Skincare", "Haircare", "Fragrance"] },
};

const priceRanges = [
  { label: "Under ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 - ₹3,000", min: 1000, max: 3000 },
  { label: "₹3,000 - ₹5,000", min: 3000, max: 5000 },
  { label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
  { label: "Above ₹10,000", min: 10000, max: 100000 },
];

const sortOptions = [
  { value: "", label: "Default" },
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const genericKeywords = [
  "men", "women", "kids", "home", "beauty", 
  "clothing", "footwear", "sports", "accessories", "jewelery", 
  "boys", "girls", "toys", "decor", "furnishing", "kitchen", 
  "groceries", "electronics", "gadgets", "books", 
  "makeup", "skincare", "haircare", "fragrance",
  "shirt", "tshirt", "jeans", "pants", "shoes", "sneakers", "bag"
];

function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [customUser, setCustomUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [products, setProducts] = useState<any[]>([]);
  const [isSpecificProduct, setIsSpecificProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    subcategory: true,
    price: true,
  });

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const showFilters = !isSpecificProduct && products.length !== 1;

  // Handle Auth
  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;
      setFirebaseUser(fbUser || null);
      try {
        const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setCustomUser(data.user);
        } else {
          if (mounted) setCustomUser(null);
        }
      } catch (error) {
        if (mounted) setCustomUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const user = customUser || firebaseUser;

  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "GET", credentials: "include" });
    router.replace("/");
  };

  // Fetch product search
  useEffect(() => {
    const fetchSearchedProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.append("q", q);
        if (category) params.append("category", category);
        if (subcategory) params.append("subcategory", subcategory);
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (sortBy) params.append("sortBy", sortBy);
        params.append("page", page.toString());
        params.append("limit", "12");

        const res = await fetch(`/api/products/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setIsSpecificProduct(data.isSpecificProduct || false);
          setPagination(data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
        }
      } catch (e) {
        console.error("Search fetch failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchedProducts();
  }, [q, category, subcategory, minPrice, maxPrice, sortBy, page]);

  // URL Updaters
  const updateURL = (updates: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    // Reset page to 1 when filters change (unless updating page specifically)
    if (!updates.hasOwnProperty('page')) {
      current.set('page', '1');
    }
    router.push(`/search?${current.toString()}`, { scroll: false });
  };

  const setCategoryFilter = (cat: string | null) => {
    updateURL({ category: cat, subcategory: null }); // Clear subcategory on cat bound
  };

  const setSubcategoryFilter = (sub: string | null) => {
    updateURL({ subcategory: sub === subcategory ? null : sub });
  };

  const setPriceFilter = (min: number | null, max: number | null) => {
    updateURL({ 
      minPrice: min !== null ? min.toString() : null, 
      maxPrice: max !== null ? max.toString() : null 
    });
  };

  const setPageFilter = (p: number) => {
    updateURL({ page: p.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setSortByFilter = (val: string | null) => {
    updateURL({ sortBy: val });
  };

  const clearAllFilters = () => {
    updateURL({ category: null, subcategory: null, minPrice: null, maxPrice: null, sortBy: null, page: '1' });
  };

  if (authLoading) return null;

  const hasActiveFilters = category || subcategory || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} onProfileClick={() => setShowProfile(true)} onLogout={handleLogout} />
      <main className="flex-grow pt-24 pb-12 mt-4 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2559]">
              Search Results
              {q ? <span className="text-[#5D5FEF] block sm:inline sm:ml-2">"{q}"</span> : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-3">
              {!loading && `Found ${pagination.total} products`}
              {(!showFilters && hasActiveFilters && pagination.total > 0) && (
                 <button onClick={clearAllFilters} className="text-[#5D5FEF] hover:underline font-bold text-xs ml-2">Clear Applied Filters</button>
              )}
            </p>
          </div>

          {showFilters && (
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden w-full mb-6 flex items-center justify-center gap-2 bg-white py-3 rounded-xl shadow-sm border border-gray-200"
            >
              <SlidersHorizontal size={18} />
              <span className="font-medium">Filters</span>
              {(hasActiveFilters || sortBy) && <span className="w-2 h-2 bg-[#5D5FEF] rounded-full" />}
            </button>
          )}

          <div className="flex gap-8 items-start">
            {/* Desktop Filters */}
            {showFilters && (
              <div className="hidden lg:block w-64 flex-shrink-0 sticky top-28 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1B2559]">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="text-xs font-bold text-[#5D5FEF] hover:underline">
                    Clear All
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mb-4 border-b border-gray-100 pb-4">
                <button onClick={() => setExpandedSections(s => ({...s, category: !s.category}))} className="flex justify-between w-full text-left font-medium text-[#1B2559]">
                  Category {expandedSections.category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.category && (
                  <div className="mt-3 space-y-2">
                    <button onClick={() => setCategoryFilter(null)} className={`w-full text-left px-2 py-1.5 rounded-lg text-sm ${!category ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>All</button>
                    {Object.entries(categoryData).map(([key, { name }]) => (
                      <button key={key} onClick={() => setCategoryFilter(key)} className={`w-full text-left px-2 py-1.5 rounded-lg text-sm ${category === key ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>{name}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subcategory */}
              {category && categoryData[category as keyof typeof categoryData] && (
                <div className="mb-4 border-b border-gray-100 pb-4">
                  <button onClick={() => setExpandedSections(s => ({...s, subcategory: !s.subcategory}))} className="flex justify-between w-full text-left font-medium text-[#1B2559]">
                    Subcategory {expandedSections.subcategory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedSections.subcategory && (
                    <div className="mt-3 space-y-2">
                      {categoryData[category as keyof typeof categoryData].subcategories.map((sub) => (
                        <button key={sub} onClick={() => setSubcategoryFilter(sub)} className={`w-full text-left px-2 py-1.5 rounded-lg text-sm ${subcategory === sub ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>{sub}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Price Range */}
              <div>
                <button onClick={() => setExpandedSections(s => ({...s, price: !s.price}))} className="flex justify-between w-full text-left font-medium text-[#1B2559]">
                  Price {expandedSections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.price && (
                  <div className="mt-3 space-y-2">
                    <button onClick={() => setPriceFilter(null, null)} className={`w-full text-left px-2 py-1.5 rounded-lg text-sm ${!minPrice && !maxPrice ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>Any Price</button>
                    {priceRanges.map((range) => {
                      const isActive = minPrice === range.min.toString() && maxPrice === range.max.toString();
                      return (
                        <button key={range.label} onClick={() => setPriceFilter(range.min, range.max)} className={`w-full text-left px-2 py-1.5 rounded-lg text-sm ${isActive ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                          {range.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sort By */}
              <div className="pt-6 mt-6 border-t border-gray-100">
                <h4 className="font-medium text-[#1B2559] mb-3">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortByFilter(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#5D5FEF]"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

            </div>
            )}

            {/* Mobile Filters Drawer */}
            <AnimatePresence>
              {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
                  <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl p-5 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-[#1B2559]">Filters</h3>
                      <button onClick={() => setMobileFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Similar Filter Implementation for Native Mobile mapping */}
                      <div>
                        <h4 className="font-bold text-[#1B2559] mb-3">Category</h4>
                        <div className="space-y-2">
                          <button onClick={() => { setCategoryFilter(null); setMobileFiltersOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!category ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'bg-gray-50 text-gray-700'}`}>All</button>
                          {Object.entries(categoryData).map(([key, { name }]) => (
                            <button key={key} onClick={() => { setCategoryFilter(key); setMobileFiltersOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${category === key ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'bg-gray-50 text-gray-700'}`}>{name}</button>
                          ))}
                        </div>
                      </div>
                      
                      {category && categoryData[category as keyof typeof categoryData] && (
                        <div>
                          <h4 className="font-bold text-[#1B2559] mb-3">Subcategory</h4>
                          <div className="space-y-2">
                            {categoryData[category as keyof typeof categoryData].subcategories.map((sub) => (
                              <button key={sub} onClick={() => { setSubcategoryFilter(sub); setMobileFiltersOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${subcategory === sub ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'bg-gray-50 text-gray-700'}`}>{sub}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-bold text-[#1B2559] mb-3">Price</h4>
                        <div className="space-y-2">
                          <button onClick={() => { setPriceFilter(null, null); setMobileFiltersOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!minPrice && !maxPrice ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'bg-gray-50 text-gray-700'}`}>Any Price</button>
                          {priceRanges.map((range) => {
                            const isActive = minPrice === range.min.toString() && maxPrice === range.max.toString();
                            return (
                               <button key={range.label} onClick={() => { setPriceFilter(range.min, range.max); setMobileFiltersOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold' : 'bg-gray-50 text-gray-700'}`}>{range.label}</button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sort By Mobile */}
                      <div>
                        <h4 className="font-bold text-[#1B2559] mb-3">Sort By</h4>
                        <select
                          value={sortBy}
                          onChange={(e) => { setSortByFilter(e.target.value || null); setMobileFiltersOpen(false); }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#5D5FEF]"
                        >
                          {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Grid Area */}
            <div className="flex-1 w-full min-h-[600px] relative">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-5 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1B2559] mb-2">No results found</h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-6">
                    We couldn't find any products matching your search. Try adjusting your filters or search term.
                  </p>
                  {(q || hasActiveFilters) && (
                    <button onClick={clearAllFilters} className="px-6 py-2.5 bg-[#5D5FEF] text-white font-bold text-sm rounded-xl">
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {products.map((product, idx) => (
                      <motion.div key={product.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 overflow-hidden group">
                        <Link href={`/product/${product.id}`}>
                          <div className="relative aspect-square overflow-hidden bg-gray-50">
                            <Image src={product.image} alt={product.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          </div>
                          <div className="p-4">
                            <h3 className="text-sm font-bold text-[#1B2559] line-clamp-1 group-hover:text-[#5D5FEF] transition-colors">{product.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1 mb-3">{product.description}</p>
                            <div className="font-bold text-base text-[#5D5FEF]">₹{product.price.toLocaleString()}</div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {pagination.pages > 1 && (
                    <div className="flex justify-center mt-12 gap-2">
                       <button onClick={() => setPageFilter(pagination.page - 1)} disabled={pagination.page <= 1} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft size={18} /></button>
                       {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                         let num = i + 1;
                         if (pagination.pages > 5 && pagination.page > 3) num = pagination.page - 3 + num;
                         if (num > pagination.pages) return null;
                         return (
                           <button key={num} onClick={() => setPageFilter(num)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${pagination.page === num ? 'bg-[#5D5FEF] text-white shadow-md' : 'border border-gray-200 hover:bg-gray-50'}`}>
                             {num}
                           </button>
                         )
                       })}
                       <button onClick={() => setPageFilter(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 disabled:opacity-50 hover:bg-gray-50"><ChevronRight size={18} /></button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-[#5D5FEF]" /></div>}>
      <SearchClient />
    </Suspense>
  );
}
