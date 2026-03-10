import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPromoCode extends Document {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  userUsageLimit: number;
  startDate: Date;
  expiryDate: Date;
  applicableProducts?: mongoose.Types.ObjectId[];
  applicableCategories?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: [true, "Promo code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    minOrderAmount: {
      type: Number,
      required: [true, "Minimum order amount is required"],
      min: [0, "Minimum order amount cannot be negative"],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount amount cannot be negative"],
    },
    usageLimit: {
      type: Number,
      required: [true, "Usage limit is required"],
      min: [1, "Usage limit must be greater than 0"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },
    userUsageLimit: {
      type: Number,
      required: [true, "User usage limit is required"],
      min: [1, "User usage limit must be greater than 0"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    applicableProducts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Product",
      default: null,
    },
    applicableCategories: {
      type: [String],
      enum: ["men", "women", "kids", "beauty", "home"],
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  } as any,
  {
    timestamps: true,
  }
);

// Validation for percentage discount
// Use synchronous middleware; throwing errors triggers validation
promoCodeSchema.pre('save', function(this: IPromoCode) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    throw new Error('Percentage discount cannot exceed 100');
  }

  if (this.expiryDate <= this.startDate) {
    throw new Error('Expiry date must be greater than start date');
  }
});

const PromoCode =
  (mongoose.models.PromoCode as Model<IPromoCode>) ||
  mongoose.model<IPromoCode>("PromoCode", promoCodeSchema);

export default PromoCode;