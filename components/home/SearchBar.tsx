"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// useDebounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

interface Suggestion {
  _id: string;
  title: string;
  image: string;
  price: number;
}

interface SearchBarProps {
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

const categoryData = {
  men: { name: "Men", subcategories: ["Clothing", "Footwear", "Sports", "Accessories"] },
  women: { name: "Women", subcategories: ["Clothing", "Footwear", "Accessories", "Jewelery", "Beauty"] },
  kids: { name: "Kids", subcategories: ["Boys", "Girls", "Footwear", "Toys"] },
  home: { name: "Home & Living", subcategories: ["Home decor", "Furnishing", "Kitchen", "Groceries", "Electronics", "Gadgets", "Books"] },
  beauty: { name: "Beauty", subcategories: ["Makeup", "Skincare", "Haircare", "Fragrance"] },
};

export default function SearchBar({ isMobile, onCloseMobile }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Local Category Matching
  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setCategorySuggestions([]);
      return;
    }
    const qObj = query.trim().toLowerCase();
    let matched: any[] = [];
    
    // Exact match scoring: startsWith gets higher priority than includes
    Object.entries(categoryData).forEach(([catKey, cat]) => {
      if (cat.name.toLowerCase().includes(qObj)) {
        matched.push({
          type: 'category',
          label: cat.name,
          url: `/search?category=${catKey}`,
          priority: cat.name.toLowerCase().startsWith(qObj) ? 2 : 1
        });
      }
      cat.subcategories.forEach(sub => {
        const combined = `${cat.name} ${sub}`;
        if (combined.toLowerCase().includes(qObj) || sub.toLowerCase().includes(qObj)) {
          matched.push({
            type: 'subcategory',
            label: combined,
            url: `/search?category=${catKey}&subcategory=${encodeURIComponent(sub)}`,
            priority: combined.toLowerCase().startsWith(qObj) ? 3 : (sub.toLowerCase().startsWith(qObj) ? 2 : 1)
          });
        }
      });
    });
    
    // Sort by priority and alphabet
    matched.sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label));
    setCategorySuggestions(matched.slice(0, 4));
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to fetch search suggestions", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
    setSelectedIndex(-1);
  }, [debouncedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    if (isMobile && onCloseMobile) onCloseMobile();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const totalSuggestions = categorySuggestions.length + suggestions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || totalSuggestions === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalSuggestions - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < totalSuggestions) {
        if (selectedIndex < categorySuggestions.length) {
           const selectedCat = categorySuggestions[selectedIndex];
           router.push(selectedCat.url);
        } else {
           const selectedProd = suggestions[selectedIndex - categorySuggestions.length];
           router.push(`/search?q=${encodeURIComponent(selectedProd.title)}`);
        }
        setIsOpen(false);
        if (isMobile && onCloseMobile) onCloseMobile();
      } else {
        handleSearch(e);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${isMobile ? "w-full" : "w-[300px] lg:w-[400px] xl:w-[500px]"}`} ref={dropdownRef}>
      <form onSubmit={handleSearch} className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Search products..."
          className={`w-full bg-gray-50/80 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/30 focus:border-[#5D5FEF] transition-all text-sm text-[#1B2559] placeholder-gray-400 ${
            isMobile ? "pl-11 pr-4 py-3 rounded-xl" : "pl-10 pr-10 py-2.5 rounded-full"
          }`}
        />
        
        {/* Left Icon */}
        <Search
          size={isMobile ? 20 : 18}
          className={`absolute ${isMobile ? "left-4" : "left-3.5"} top-1/2 -translate-y-1/2 text-gray-400`}
        />

        {/* Right Action (Clear or Loader) */}
        <div className={`absolute ${isMobile ? "right-4" : "right-3.5"} top-1/2 -translate-y-1/2 flex items-center`}>
          { query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {isOpen && query.length >= 1 && (totalSuggestions > 0 || isLoading || query.length >= 2) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 bg-white border border-gray-100 shadow-xl overflow-hidden ${
              isMobile 
                ? "left-0 right-0 top-full mt-2 rounded-xl" 
                : "left-0 right-0 top-full mt-3 rounded-2xl"
            }`}
          >
            {/* Category Suggestions */}
            {categorySuggestions.length > 0 && (
              <div className="py-2 border-b border-gray-50">
                {categorySuggestions.map((catItem, idx) => (
                  <button
                    key={catItem.label}
                    onClick={() => {
                      router.push(catItem.url);
                      setIsOpen(false);
                      if (isMobile && onCloseMobile) onCloseMobile();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 transition-colors ${
                      selectedIndex === idx ? "bg-[#5D5FEF]/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <Search size={16} className={selectedIndex === idx ? "text-[#5D5FEF]" : "text-gray-400"} />
                    <span className={`text-sm font-medium ${selectedIndex === idx ? "text-[#5D5FEF]" : "text-[#1B2559]"}`}>
                      {catItem.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Product Suggestions */}
            {suggestions.length > 0 && (
              <div className="py-2">
                {suggestions.map((item, index) => {
                  const actualIndex = index + categorySuggestions.length;
                  return (
                  <button
                    key={item._id}
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(item.title)}`);
                      setIsOpen(false);
                      if (isMobile && onCloseMobile) onCloseMobile();
                    }}
                    onMouseEnter={() => setSelectedIndex(actualIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      selectedIndex === actualIndex ? "bg-[#5D5FEF]/5" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Tiny Square Thumbnail */}
                    <div className="w-10 h-10 relative flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Text Details */}
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-sm font-medium line-clamp-1 ${selectedIndex === actualIndex ? "text-[#5D5FEF]" : "text-[#1B2559]"}`}>
                        {item.title}
                      </p>
                      <p className="text-xs font-bold text-gray-500 mt-0.5">₹{item.price.toLocaleString()}</p>
                    </div>
                  </button>
                )})}
              </div>
            )}
            
            {/* View All Results Button */}
            {(suggestions.length > 0 || categorySuggestions.length > 0) && (
                <div className="p-3 border-t border-gray-50 mt-1 bg-gray-50/50">
                  <button
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                      setIsOpen(false);
                      if (isMobile && onCloseMobile) onCloseMobile();
                    }}
                    className="w-full text-center text-xs font-bold text-[#5D5FEF] hover:text-[#4B4DC9] transition-colors py-1"
                  >
                    View all results for "{query}"
                  </button>
                </div>
            )}

            {/* Empty State */}
            {totalSuggestions === 0 && !isLoading && query.length >= 2 && (
              <div className="p-6 text-center text-sm text-gray-500">
                No products match "<span className="font-medium text-[#1B2559]">{query}</span>"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
