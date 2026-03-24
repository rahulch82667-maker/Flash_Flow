import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import CartLayoutWrapper from "@/components/cart/CartLayoutWrapper";

export default async function AddressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("authToken")?.value;

  if (!token) {
    redirect("/login");
  }

  let decoded;

  try {
    decoded = await adminAuth.verifySessionCookie(token, true);
  } catch (err) {
    console.error("Session verify error (wishlist):", err);
    redirect("/login");
  }

  await connectDB();

  const user = await User.findOne({ email: decoded.email });

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    redirect("/admin");
  }

  return <CartLayoutWrapper>{children}</CartLayoutWrapper>;
}