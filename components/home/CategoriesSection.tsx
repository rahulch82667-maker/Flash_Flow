"use client";

import { memo, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryCardProps {
  title: string;
  imagePath: string;
  href: string;
  index: number;
}

const CategoryCard = memo(({ title, imagePath, href, index }: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -6 }}
      className="group cursor-pointer flex-none w-[160px] sm:w-[180px]"
    >
      <Link href={`/shop?category=${title.toLowerCase().replace(' & living', '')}`}>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
          <Image
            src={imagePath}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 15vw"
          />
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>
    </motion.div>
  );
});

CategoryCard.displayName = "CategoryCard";

// Responsive Slider Component for Mobile
const ResponsiveSlider = memo(({ categories }: { categories: Array<{ title: string; image: string; href: string }> }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate items per view based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerView(2);
      } else if (width >= 640 && width < 1024) {
        setItemsPerView(3);
      } else {
        setItemsPerView(5);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalSlides = Math.ceil(categories.length / itemsPerView);

  const getCurrentCategories = () => {
    const start = currentIndex * itemsPerView;
    return categories.slice(start, start + itemsPerView);
  };

  const currentCategories = getCurrentCategories();

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsTransitioning(false), 300);
    },
    [isTransitioning],
  );

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    goToSlide((currentIndex + 1) % totalSlides);
  }, [currentIndex, isTransitioning, goToSlide, totalSlides]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    goToSlide(currentIndex === 0 ? totalSlides - 1 : currentIndex - 1);
  }, [currentIndex, isTransitioning, goToSlide, totalSlides]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      nextSlide();
    } else if (touchStart - touchEnd < -75) {
      prevSlide();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Determine grid columns based on items per view
  const getGridCols = () => {
    if (itemsPerView === 2) return "grid-cols-2";
    if (itemsPerView === 3) return "grid-cols-3";
    return `grid-cols-${itemsPerView}`;
  };

  // On desktop, show as normal grid
  if (itemsPerView === 5) {
    return (
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
        {categories.map((category, index) => (
          <CategoryCard
            key={category.title}
            title={category.title}
            imagePath={category.image}
            href={category.href}
            index={index}
          />
        ))}
      </div>
    );
  }

  // On mobile/tablet, show as slider
  return (
    <div className="block">
      <div
        className="relative px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className={`w-full grid ${getGridCols()} gap-3`}
            >
              {currentCategories.map((category, idx) => (
                <CategoryCard
                  key={category.title}
                  title={category.title}
                  imagePath={category.image}
                  href={category.href}
                  index={idx}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              disabled={isTransitioning}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 z-10"
              aria-label="Previous categories"
            >
              <ChevronLeft size={18} className="text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              disabled={isTransitioning}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 z-10"
              aria-label="Next categories"
            >
              <ChevronRight size={18} className="text-gray-700" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-6 bg-[#5D5FEF]"
                    : "w-1.5 bg-gray-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ResponsiveSlider.displayName = "ResponsiveSlider";

const CategoriesSection = memo(() => {
  const categories = [
    { title: "Men", image: "/men_sub_section.png", href: "/category/men" },
    { title: "Women", image: "/women_sub_section.png", href: "/category/women" },
    { title: "Kids", image: "/kids_sub_section.png", href: "/category/kids" },
    { title: "Home & Living", image: "/home_sub_section.png", href: "/category/home" },
    { title: "Beauty", image: "/beauty_sub_section.png", href: "/category/beauty" },
  ];

  return (
    <section className="w-full py-8 sm:py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B2559] mb-2">
            Shop by Category
          </h2>
          <p className="text-sm text-gray-600 pl-2">
            Explore our curated collections for every style
          </p>
        </div>

        {/* Responsive Categories Grid/Slider */}
        <ResponsiveSlider categories={categories} />
      </div>
    </section>
  );
});

CategoriesSection.displayName = "CategoriesSection";

export default CategoriesSection;