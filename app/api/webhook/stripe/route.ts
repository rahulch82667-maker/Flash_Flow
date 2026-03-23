import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import RefundLog from "@/models/RefundLog";
import User from "@/models/User";
import { sendRefundEmail } from "@/lib/utils/email";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error("Webhook signature verification failed.", error.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  await connectDB();

  try {
    if (event.type === "charge.refunded") {
      const charge = event.data.object as any;
      const paymentIntentId = charge.payment_intent;

      const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });

      if (order) {
        order.refundStatus = "completed";
        // Mark paymentStatus as refunded only when fully processed
        order.paymentStatus = "refunded";
        await order.save();

        // Create log
        await RefundLog.create({
          orderId: order._id,
          refundId: charge.refunds?.data?.[0]?.id || charge.id,
          amount: charge.amount_refunded / 100, // Optional: adjust amount units based on Stripe's format
          status: "completed",
        });

        // Send Email
        const user = await User.findById(order.userId);
        if (user?.email) {
          sendRefundEmail(user.email, order.orderId, "completed", charge.amount_refunded / 100).catch(console.error);
        }
      }
    } else if (event.type === "refund.updated") {
      const refund = event.data.object as any;
      const paymentIntentId = refund.payment_intent;

      const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });

      if (order) {
        if (refund.status === "succeeded") {
          order.refundStatus = "completed";
          order.paymentStatus = "refunded";
        } else if (refund.status === "failed" || refund.status === "canceled") {
          order.refundStatus = "failed";
        } else if (refund.status === "pending") {
          order.refundStatus = "pending";
        }

        await order.save();

        // Check if log for this specific refund update already exists or just insert it
        await RefundLog.create({
          orderId: order._id,
          refundId: refund.id,
          amount: refund.amount / 100, // Optional: adjust amount
          status: refund.status,
        });

        // Send Email if status is terminal
        if (refund.status === "succeeded" || refund.status === "failed" || refund.status === "canceled") {
          const user = await User.findById(order.userId);
          if (user?.email) {
            sendRefundEmail(user.email, order.orderId, refund.status, refund.amount / 100).catch(console.error);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing webhook event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
