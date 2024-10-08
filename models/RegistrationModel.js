import { Schema, model } from "mongoose";

const registrationSchema = new Schema({
  // Self
  teamName: { type: String, required: [true, "Team Name is required"] },
  teamId: {type: String},
  team: [
    {
      fullname: {
        type: String,
        required: [true, "Fullname of teammate is required"],
      },
      gender: {
        type: String,
        enum: {
          values: ["Male", "Female", "Other", "Rather not say"],
          message: "{VALUE} is not supported",
        },
      },
      phoneNumber: {
        type: String,
        required: [true, "Phone number is required"],
      },
      email: { type: String },
      class: { type: String },
      optAccomodation: { type: Boolean, default: false },
    },
  ],

  amount: { type: Number, required: [true, "Amount is required"] },

  // Payment
  payment: {
    paymentStatus: {
      type: String,
      enum: {
        values: ["Completed", "Pending", "Failed", "Refundend"],
        message: "{VALUE} is not supported",
      },
      default: "Pending",
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: false,
    },
  },
  // Opt Services
  eventIds: [
    {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event IDs is required"],
    },
  ],

  isDeleted: { type: Boolean, default: false },
});

//JSON WEBTOKEN
registrationSchema.methods.createJWT = function () {
  return JWT.sign(
    { _id: this._id, email: this.email, fullname: this.fullname },
    JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
};

export default model("Registration", registrationSchema);
