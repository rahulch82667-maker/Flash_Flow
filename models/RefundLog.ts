import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRefundLog extends Document {
  orderId: mongoose.Types.ObjectId;
  refundId?: string;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const refundLogSchema = new Schema<IRefundLog>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    refundId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const RefundLog = (mongoose.models.RefundLog as Model<IRefundLog>) || 
  mongoose.model<IRefundLog>("RefundLog", refundLogSchema);

export default RefundLog;
