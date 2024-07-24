import { Schema, model } from "mongoose";

const paymentSchema = new Schema({
  paymentStatus: {
    type: String,
    required: [true, "Payment Status is required"],
    enum: {
      values: ["Completed", "Pending", "Failed", "Refunded"],
      message: "{VALUE} is not supported",
    },
    default: "Pending",
  },
  amount: {
    type: Number,
    required: [true, "Payment amount is required"],
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ["Credit Card", "Debit Card", "PayPal", "Bank Transfer", "UPI"],
      message: "{VALUE} is not supported",
    },
    required: [true, "Payment method is required"],
  },
  transactionDate: {
    type: Date,
    default: Date.now,
  },
  registrationId: {
    type: Schema.Types.ObjectId,
    ref: "Registration",
    required: [true, "Registration ID is required"],
  },
});

export default model("Payment", paymentSchema);
