"use client";

import { memo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  ShoppingBag, 
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { addToCart } from "@/lib/redux/features/cart/cartSlice";

interface WishlistItem {
  id?: number | string;
  productId?: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistCardProps {
  item: WishlistItem;
  onRemove: (id: string | number) => void;
  onAddToCart?: (id: string | number) => void;  
}

const WishlistCard = memo(({ item, onRemove }: WishlistCardProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { operationLoading: cartLoading } = useAppSelector((state) => state.cart);
  
  const [isWishlisted, setIsWishlisted] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const productId = item.productId || item.id;
  const productIdStr = productId?.toString();

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRemove = () => {
    setIsWishlisted(false);
    if (productId) {
      onRemove(productId);
    }
  };

  const handleAddToCart = async () => {
    if (!productIdStr || localLoading || cartLoading) return;

    setLocalLoading(true);

    try {
      const cartItem = {
        productId: productIdStr,
        title: item.title,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category.toLowerCase(),
        size: null,
        quantity: 1,
      };

      await dispatch(addToCart(cartItem)).unwrap();
      showToastMessage(`${item.title} added to cart`);
      
      handleRemove();
    } catch (error) {
      showToastMessage("Failed to add to cart", "error");
      console.error("Add to cart failed:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Fallback image URL
  const imageUrl = imageError
    ? "https://via.placeholder.com/200?text=No+Image"
    : item.image;

  const isLoading = localLoading || cartLoading;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      >
        <div className="p-3">
          {/* Product Image */}
          <div className="relative w-full aspect-square overflow-hidden bg-gray-100 rounded-lg mb-3">
            <Link href={`/product/${productId}`}>
              <Image
                src={imageUrl}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, 200px"
                onError={() => setImageError(true)}
              />
            </Link>

            {/* Wishlist Heart Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRemove}
              disabled={isLoading}
              className="absolute cursor-pointer top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-all z-10 disabled:opacity-50"
              aria-label="Remove from wishlist"
            >
              
                <Heart size={16} className="fill-red-500 text-red-500" />
            
            </motion.button>
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <Link href={`/product/${productId}`}>
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem] hover:text-[#5D5FEF] transition-colors">
                {item.title}
              </h3>
            </Link>

            <p className="text-xs text-gray-500 line-clamp-1">
              {item.description}
            </p>

            {/* Category Badge */}
            <div className="mt-1">
              <span className="text-[10px] px-2 py-1 bg-gray-100 rounded-full capitalize">
                {item.category}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-base font-bold text-gray-900">
                ₹{item.price.toLocaleString()}
              </span>

              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="cursor-pointer bg-[#5D5FEF] hover:bg-[#4B4DC9] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 shadow-sm hover:shadow flex items-center gap-1 disabled:opacity-50"
              >
                {localLoading ? (
                  <>
                  
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={12} />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div
              className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
                toastType === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
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
    </>
  );
});

WishlistCard.displayName = "WishlistCard";
export default WishlistCard;