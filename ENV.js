import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_EXPIRY = "1d";
const MONGODB_URI = process.env.MONGODB_URI;
const APP_PASSWORD = process.env.APP_PASSWORD;
const MAIL_ID = process.env.MAIL_ID;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

export {
  PORT,
  JWT_SECRET_EXPIRY,
  JWT_SECRET,
  MONGODB_URI,
  MAIL_ID,
  APP_PASSWORD,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
};
