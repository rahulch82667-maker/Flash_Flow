import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import PromoCode from "@/models/PromoCode";
import User from "@/models/User";
import mongoose from "mongoose";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = (await cookies()).get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await verifyAdmin(token);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid promo code ID" }, { status: 400 });
    }

    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ promoCode });
  } catch (error) {
    console.error("Error fetching promo code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = (await cookies()).get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await verifyAdmin(token);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid promo code ID" }, { status: 400 });
    }

    const body = await req.json();
    const {
      discountValue,
      usageLimit,
      expiryDate,
      isActive,
      maxDiscountAmount,
      userUsageLimit,
    } = body;

    // Find the promo code
    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }

    // Validate percentage discount if updating discount value
    if (discountValue !== undefined) {
      if (promoCode.discountType === "percentage" && discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount cannot exceed 100" },
          { status: 400 }
        );
      }
      promoCode.discountValue = discountValue;
    }

    // Validate dates if updating expiry date
    if (expiryDate !== undefined) {
      const expiryDateObj = new Date(expiryDate);
      if (expiryDateObj <= promoCode.startDate) {
        return NextResponse.json(
          { error: "Expiry date must be greater than start date" },
          { status: 400 }
        );
      }
      promoCode.expiryDate = expiryDateObj;
    }

    // Update allowed fields
    if (usageLimit !== undefined) {
      if (usageLimit < 1) {
        return NextResponse.json(
          { error: "Usage limit must be greater than 0" },
          { status: 400 }
        );
      }
      promoCode.usageLimit = usageLimit;
    }

    if (userUsageLimit !== undefined) {
      if (userUsageLimit < 1) {
        return NextResponse.json(
          { error: "User usage limit must be greater than 0" },
          { status: 400 }
        );
      }
      promoCode.userUsageLimit = userUsageLimit;
    }

    if (maxDiscountAmount !== undefined) {
      promoCode.maxDiscountAmount = maxDiscountAmount;
    }

    if (isActive !== undefined) {
      promoCode.isActive = isActive;
    }

    await promoCode.save();

    return NextResponse.json({
      message: "Promo code updated successfully",
      promoCode,
    });
  } catch (error) {
    console.error("Error updating promo code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = (await cookies()).get("authToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await verifyAdmin(token);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid promo code ID" }, { status: 400 });
    }

    const promoCode = await PromoCode.findByIdAndDelete(id);

    if (!promoCode) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Promo code deleted successfully",
      promoCode,
    });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
