"use client";

import { useRouter } from "next/navigation";
import CartAddress from "@/components/cart/CartAddress";
import { useCartUser } from "@/components/cart/CartLayoutWrapper";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setCheckoutAddress } from "@/lib/redux/features/cart/cartSlice";

export default function CartAddressPage() {
  const router = useRouter();
  const user = useCartUser();
  const dispatch = useAppDispatch();

  if (!user) return null; // Wait until context yields user

  return (
    <CartAddress
      user={user}
      onBack={() => router.push("/cart")}
      onProceed={(address) => {
        dispatch(setCheckoutAddress(address));
        sessionStorage.setItem("checkoutAddress", JSON.stringify(address));
        router.push("/cart/payment");
      }}
    />
  );
}
