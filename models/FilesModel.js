import mongoose from "mongoose";

const { Schema } = mongoose;

const FileSchema = new Schema(
  {
    name: { type: String, required: [true, "File name is required"] },
    type: { type: String, required: [true, "File type is required"] },
    file: { type: String, required: [true, "File is required"] },
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model("Files", FileSchema);

export default File;
