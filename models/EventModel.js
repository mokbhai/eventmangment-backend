import mongoose from "mongoose";

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    eventName: { type: String, required: [true, "Event name is required"] },
    eventType: { type: String, required: [true, "Event name is required"] },
    description: { type: String, required: [true, "Description is required"] },
    photos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Photos is required"],
      },
    ],
    organiserName: {
      type: String,
      required: [true, "Organiser name is required"],
    },
    location: {
      landmark: { type: String, required: [true, "Landmark is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, required: [true, "State is required"] },
      country: { type: String, required: [true, "Country is required"] },
    },
    eventDate: { type: Date, required: [true, "Event date is required"] },
    day: {
      type: Number,
      required: [true, "Day of Event is required"],
    },
    shift: {
      type: String,
      required: [true, "Shift of Event is required"],
      enum: {
        values: ["Morning", "Evening"],
        message: "{VALUE} is not supported as a valid relation",
      },
    },
    structure: [{ type: String, required: [true, "Structure are required"] }],
    eligibilities: [
      { type: String, required: [true, "eligibilities are required"] },
    ],
    rules: [{ type: String, required: [true, "Rules are required"] }],
    ruleBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: [true, "Rules are required"],
    },
    participants: {
      min: {
        type: Number,
        default: 2,
      },
      max: {
        type: Number,
        default: 4,
      },
    },
    contacts: [
      {
        name: {
          type: String,
          required: [true, "Contact Information is required"],
        },
        phone: {
          type: String,
          required: [true, "Contact Information is required"],
        },
      },
    ],
    registrationCharge: {
      currency: {
        type: String,
        required: [true, "Charges Information is required"],
        default: "INR",
      },
      amount: {
        type: String,
        required: [true, "Charges Information is required"],
        default: "0",
      },
      isMandatory: {
        type: Boolean,
        required: [true, "Charges Information is required"],
        default: false,
      },
    },
    uplodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

eventSchema.pre("save", function (next) {
  next();
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
