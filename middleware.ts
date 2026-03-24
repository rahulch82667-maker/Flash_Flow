import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("authToken")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup";

  const isProtectedPage =
    pathname.startsWith("/home") || pathname.startsWith("/category/men") || pathname.startsWith("/category/women") ||
   pathname.startsWith("/category/kids") || pathname.startsWith("/wishlist") || pathname.startsWith("/category/beauty") || pathname.startsWith("/category/home") || pathname.startsWith("/admin")
   || pathname.startsWith("/product") || pathname.startsWith("/address") || pathname.startsWith("/cart") || pathname.startsWith("/cart/address") || pathname.startsWith("/orders")
   || pathname.startsWith("/cart/payment") || pathname.startsWith("/shop") || pathname.startsWith("/search");

  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/home/:path*",
    "/admin/:path*",
    "/cart/:path*",
    "/cart/address/:path*",
    "/cart/payment/:path*",
    "/orders/:path*",
    "/wishlist/:path*",
    "/shop/:path*",
    "/search/:path*",
    "/category/men/:path*",
    "/category/women/:path*",
    "/category/kids/:path*",
    "/category/home/:path*",
    "/category/beauty/:path*",
    "/product/:path*",
    "/address/:path*",
  ],
};
