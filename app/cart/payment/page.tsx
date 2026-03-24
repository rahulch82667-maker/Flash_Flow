"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CartPayment from "@/components/cart/CartPayment";
import { useCartUser } from "@/components/cart/CartLayoutWrapper";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { setCheckoutAddress } from "@/lib/redux/features/cart/cartSlice";

export default function CartPaymentPage() {
  const router = useRouter();
  const user = useCartUser();
  const checkoutAddress = useAppSelector((state) => state.cart.checkoutAddress);
  const dispatch = useAppDispatch();
  const [isRehydrating, setIsRehydrating] = useState(true);

  useEffect(() => {
    // Attempt rehydration first
    if (!checkoutAddress) {
      const stored = sessionStorage.getItem("checkoutAddress");
      if (stored) {
        try {
          dispatch(setCheckoutAddress(JSON.parse(stored)));
        } catch (e) {
          console.error("Failed to parse address from session storage", e);
        }
      } else {
        router.replace("/cart/address");
      }
    }
    setIsRehydrating(false);
  }, [checkoutAddress, router, dispatch]);

  if (!user || isRehydrating || !checkoutAddress) return null;

  return (
    <CartPayment
      user={user}
      selectedAddress={checkoutAddress}
      onBack={() => router.push("/cart/address")}
      onComplete={() => router.push("/orders")}
    />
  );
}
