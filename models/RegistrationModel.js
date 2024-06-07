import { Schema, model } from "mongoose";

const parentsGuardianSchema = new Schema({
  fullname: {
    type: String,
    required: [true, "Parents/Guardian fullname is required"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Parents/Guardian phone number is required"],
  },
  relation: {
    type: String,
    required: [true, "Relation is required"],
    enum: {
      values: ["Mother", "Father", "Guardian", "Other"],
      message: "{VALUE} is not supported as a valid relation",
    },
  },
});

const registrationSchema = new Schema({
  fullname: { type: String, required: [true, "Fullname is required"] },
  gender: {
    type: String,
    required: [true, "Gender is required"],
    enum: {
      values: ["Male", "Female", "Other", "Rather not say"],
      message: "{VALUE} is not supported",
    },
  },
  parentsGuardian: {
    type: parentsGuardianSchema,
    required: [true, "Parents/Guardian information is required"],
  },
  dateOfBirth: { type: Date, required: [true, "Date of birth is required"] },
  phoneNumber: { type: String, required: [true, "Phone number is required"] },
  email: { type: String, required: [true, "Email is required"] },
  paymentStatus: {
    type: String,
    required: [true, "Payment Status is required"],
    enum: {
      values: ["Completed", "Pending", "Failed", "Refundend"],
      message: "{VALUE} is not supported",
    },
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: "Recipt",
    required: [true, "Payment ID is required"],
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: [true, "Event ID is required"],
  },
  optServices: { type: [String], required: false },
  isDeleted: { type: Boolean, default: false },
});

export default model("Registration", registrationSchema);
