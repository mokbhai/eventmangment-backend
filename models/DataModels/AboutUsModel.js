// AboutUsModel.js
import mongoose from "mongoose";

//#region About Us

const AboutUsSchema = mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"] },
    description: { type: String, required: [true, "Description is required"] },
    isDeleted: { type: String, default: false },
  },
  {
    timestamps: true,
  }
);

const AboutUs = mongoose.model("AboutUs", AboutUsSchema);

//#endregion

//#region SocialMedia

const SocialMediaSchema = mongoose.Schema(
  {
    icons: { type: String, required: [true, "Icon is required"] },
    alt: { type: String, required: [true, "Alt Text is required"] },
    link: { type: String, required: [true, "Link is required"] },
    platform: { type: String, required: [true, "Link is required"] },
    isDeleted: { type: String, default: false },
  },
  {
    timestamps: true,
  }
);

export const SocialMedia = mongoose.model("SocialMedia", SocialMediaSchema);

//#endregion

// //#region Galary

// const GalarySchema = mongoose.Schema(
//   {
//     photo: { type: String, required: [true, "Icon is required"] },
//     alt: { type: String, required: [true, "Alt Text is required"] },
//     description: { type: String, required: [true, "Description is required"] },
//     type: { type: String, required: [true, "Type is required"] },
//     isDeleted: { type: String, default: false },
//   },
//   {
//     timestamps: true,
//   }
// );

// export const Galary = mongoose.model("Galary", GalarySchema);

// //#endregion

//#region Media

const MediaSchema = mongoose.Schema(
  {
    alt: { type: String, required: [true, "Alt Text is required"] },
    link: { type: String, required: [true, "Link is required"] },
    platform: { type: String, required: [true, "Link is required"] },
    type: { type: String, required: [true, "Type is required"] },
    isDeleted: { type: String, default: false },
  },
  {
    timestamps: true,
  }
);

export const Media = mongoose.model("Media", MediaSchema);

//#endregion

export default AboutUs;
