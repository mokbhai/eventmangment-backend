import mongoose from "mongoose";

const { Schema } = mongoose;

const ContactUsSchema = new Schema(
  {
    fullname: { type: String, required: [true, "Name is required"] },
    phone: { type: String, required: [true, "Phone number is required"] },
    email: { type: String, required: [true, "Email is required"] },
    designation: {
      type: String,
      required: [true, "Designation is required"],
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const ContactUs = mongoose.model("ContactUs", ContactUsSchema);

export default ContactUs;
