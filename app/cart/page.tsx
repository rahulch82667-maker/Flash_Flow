"use client";

import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/redux/hooks";
import CartBag from "@/components/cart/CartBag";
import YouMayAlsoLike from "@/components/cart/YouMayAlsoLike";

export default function CartPage() {
  const router = useRouter();
  const { items, loading } = useAppSelector((state) => state.cart);

  return (
    <>
      <div className="w-full">
        {loading && items.length === 0 ? (
          <CartBagSkeleton />
        ) : (
          <CartBag onProceed={() => router.push("/cart/address")} />
        )}
      </div>
      <div className="mt-12">
        <YouMayAlsoLike />
      </div>
    </>
  );
}

function CartBagSkeleton() {
  return (
    <div className="animate-pulse flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
      </div>
      <div className="w-full lg:w-[380px]">
        <div className="h-80 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    </div>
  );
}