import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usermodels",
      required: true,
    },

    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

    orderId: {
      type: String, 
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["razorpay", "paypal", "stripe"], 
      required: true,
      default: "razorpay",
    },

    // Razorpay specific fields
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },

    // PayPal specific fields
    paypal_payment_id: { type: String },
    paypal_payer_id: { type: String },

    // Stripe specific fields
    stripe_payment_intent_id: { type: String },
    stripe_charge_id: { type: String },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR", 
    },
  },
  { timestamps: true }
);

const PaymentModel = mongoose.model("payments", paymentSchema);

export default PaymentModel; 
