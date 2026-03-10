import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import PromoCode from "@/models/PromoCode";
import User from "@/models/User";

// Middleware to verify admin
async function verifyAdmin(token: string) {
  try {
    const decoded = await adminAuth.verifySessionCookie(token, true);
    await connectDB();
    const user = await User.findOne({ email: decoded.email });
    if (!user || user.role !== "admin") {
      return { error: "Forbidden", status: 403 };
    }
    return { user, decoded };
  } catch (err) {
    return { error: "Unauthorized", status: 401 };
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = (await cookies()).get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await verifyAdmin(token);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit,
      startDate,
      expiryDate,
      applicableProducts,
      applicableCategories,
      isActive,
    } = body;

    // Validate required fields
    if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      minOrderAmount === undefined ||
      usageLimit === undefined ||
      userUsageLimit === undefined ||
      !startDate ||
      !expiryDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!["percentage", "fixed"].includes(discountType)) {
      return NextResponse.json(
        { error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate percentage discount
    if (discountType === "percentage" && discountValue > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const expiryDateObj = new Date(expiryDate);
    if (expiryDateObj <= startDateObj) {
      return NextResponse.json(
        { error: "Expiry date must be greater than start date" },
        { status: 400 }
      );
    }

    // Create promo code
    const promoCode = await PromoCode.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount: maxDiscountAmount || null,
      usageLimit,
      usedCount: 0,
      userUsageLimit,
      startDate: startDateObj,
      expiryDate: expiryDateObj,
      applicableProducts: applicableProducts || null,
      applicableCategories: applicableCategories || null,
      isActive: isActive ?? true,
    });

    return NextResponse.json(
      { message: "Promo code created successfully", promoCode },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 400 }
      );
    }
    console.error("Error creating promo code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await verifyAdmin(token);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get query parameters for pagination and filters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const expiry = searchParams.get("expiry");

    const skip = (page - 1) * limit;
    let filter: any = {};

    // Search filter
    if (search) {
      filter.code = { $regex: search, $options: "i" };
    }

    // Status filter
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    // Expiry filter
    const now = new Date();
    if (expiry === "expired") {
      filter.expiryDate = { $lt: now };
    } else if (expiry === "active-expiry") {
      filter.expiryDate = { $gte: now };
    }

    // Get promo codes with pagination
    const promoCodes = await PromoCode.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PromoCode.countDocuments(filter);

    return NextResponse.json({
      promoCodes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
