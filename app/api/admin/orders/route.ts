import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
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
    const payment = searchParams.get("payment") || "all";
    const sortBy = searchParams.get("sortBy") || "newest";

    const skip = (page - 1) * limit;

    // Build filter
    let filter: any = {};
    
    if (status !== "all") {
      filter.orderStatus = status;
    }
    
    if (payment !== "all") {
      filter.paymentStatus = payment;
    }

    // Get all orders
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get all users to map user details
    const userIds = [...new Set(orders.map(o => o.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Transform orders with user details
    const transformedOrders = orders.map(order => ({
      _id: order._id.toString(),
      orderId: order.orderId,
      userId: order.userId.toString(),
      userName: userMap.get(order.userId.toString())?.name || 'Unknown User',
      userEmail: userMap.get(order.userId.toString())?.email || 'Unknown Email',
      items: order.items.map((item: any) => ({
        ...item,
        productId: item.productId.toString(),
      })),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      refundStatus: order.refundStatus,
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      totalAmount: order.totalAmount,
      paymentId: order.paymentId,
      stripePaymentIntentId: order.stripePaymentIntentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    // Apply search filter (search in order ID, user name, or email)
    let filteredOrders = transformedOrders;
    if (search) {
      filteredOrders = transformedOrders.filter(order =>
        order.orderId.toLowerCase().includes(search.toLowerCase()) ||
        order.userName.toLowerCase().includes(search.toLowerCase()) ||
        order.userEmail.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filteredOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        filteredOrders.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case 'lowest':
        filteredOrders.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
    }

    const total = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice(0, limit);

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}