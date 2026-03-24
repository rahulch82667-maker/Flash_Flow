import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifySessionCookie(token, true);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();

    // Check if user is admin
    const adminUser = await User.findOne({ email: decoded.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const method = searchParams.get("method") || "all";
    const sortBy = searchParams.get("sortBy") || "newest";

    const skip = (page - 1) * limit;

    // Build filter
    let filter: any = {};
    
    if (status !== "all") {
      filter.status = status;
    }
    
    if (method !== "all") {
      filter.paymentMethod = method;
    }

    // Get all payments
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get orders and users for each payment
    const orderIds = [...new Set(payments.map(p => p.orderId.toString()))];
    const orders = await Order.find({ _id: { $in: orderIds } }).select('orderId refundStatus orderStatus').lean();
    const orderMap = new Map(orders.map(o => [o._id.toString(), o]));

    const userIds = [...new Set(payments.map(p => p.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Transform payments with order and user details
    const transformedPayments = payments.map(payment => ({
      _id: payment._id.toString(),
      paymentId: payment.paymentId,
      orderId: payment.orderId.toString(),
      orderNumber: orderMap.get(payment.orderId.toString())?.orderId || 'Unknown',
      orderStatus: orderMap.get(payment.orderId.toString())?.orderStatus || 'Unknown',
      refundStatus: orderMap.get(payment.orderId.toString())?.refundStatus || 'none',
      userId: payment.userId.toString(),
      userName: userMap.get(payment.userId.toString())?.name || 'Unknown User',
      userEmail: userMap.get(payment.userId.toString())?.email || 'Unknown Email',
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeCustomerId: payment.stripeCustomerId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    // Apply search filter
    let filteredPayments = transformedPayments;
    if (search) {
      filteredPayments = transformedPayments.filter(payment =>
        payment.paymentId.toLowerCase().includes(search.toLowerCase()) ||
        payment.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        payment.userName.toLowerCase().includes(search.toLowerCase()) ||
        payment.userEmail.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filteredPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filteredPayments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        filteredPayments.sort((a, b) => b.amount - a.amount);
        break;
      case 'lowest':
        filteredPayments.sort((a, b) => a.amount - b.amount);
        break;
    }

    const total = filteredPayments.length;
    const paginatedPayments = filteredPayments.slice(0, limit);

    return NextResponse.json({
      payments: paginatedPayments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}