import multer from "multer";
import File from "../models/FilesModel.js";
import mongoose from "mongoose";
import fs from "fs";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import { sendError } from "./ErrorHandler.js";
import redisClient from "../config/redis.js";
import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../ENV.js";

// Cloudinary configuration
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Use memory storage for Multer
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("upload");

// Function to delete images from Cloudinary
export const deleteImgsFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: "raw" }, // Assuming you're uploading raw files
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// Function to upload files to Cloudinary
const uploadToCloudinary = async (buffer, id, mimetype) => {
  const options = {
    resource_type: 'auto',
    public_id: id,
  };

  // Additional options for images
  if (mimetype.startsWith('image/')) {
    options.fetch_format = 'auto';
    options.quality = 'auto';
  }

  try {
    const uploadResult = await cloudinary.uploader.upload(buffer, options);
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error; // Re-throw to handle in the calling function
  }
};

// Function to upload files 
export const uploadFile = async (req, res, next) => {
  const { userId } = req.user;

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
    } else if (err) {
      return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
    }

    if (!req.file) {
      return sendError(STATUSCODE.BAD_REQUEST, "Didn't get File", next);
    }

    const { originalname, mimetype, buffer } = req.file;
    const { type } = req.body;

    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(
        buffer,
        new mongoose.Types.ObjectId(), // Generate a new ID for Cloudinary
        mimetype
      );

      const fileData = new File({
        name: originalname,
        type: mimetype,
        file: cloudinaryUrl, 
        uplodedBy: userId,
        used: type,
      });

      if (type === "Gallery") redisClient.del("Gallery:Gallery");
      if (type === "AboutUs") redisClient.del("AboutUs:AboutUs");

      await fileData.save()
        .then((result) => {
          redisClient.set(`file:${result._id.toString()}`, JSON.stringify(result));
          res.status(200).json({
            message: "File uploaded successfully",
            file: result,
            fileId: result._id,
          });
        })
        .catch((err) => {
          return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
        });

    } catch (err) {
      return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
    }
  });
};


export const changeFile = async (req, res, next) => {
  const { userId } = req.user;
  const { fileId, width, length } = req.body;

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
    } else if (err) {
      return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
    }

    // Update the file data in MongoDB
    const { filename, mimetype, path } = req.file;

    const fileData = await File.findById(fileId);
    fileData.name = filename;
    fileData.type = mimetype;
    fileData.file = path;
    fileData.uplodedBy = userId;

    if (length) {
      fileData.length = length;
    }
    if (width) {
      fileData.width = width;
    }

    await fileData
      .save()
      .then((result) => {
        // Update data in cache
        redisClient.set("file:" + fileId, JSON.stringify(result));
        res.status(200).json({
          message: "File uploaded successfully",
          file: result,
          fileId: result._id,
        });
      })
      .catch((err) => {
        return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
      });
  });
};

export const downloadFile = async (req, res, next) => {
  const fileId = req.params.id;

  // Check if data is in cache
  await redisClient.get("file:" + fileId, async (err, result) => {
    if (result) {
      // If data is in cache, send it
      const file = JSON.parse(result);
      res.set({
        "Content-Type": file.type,
        "Content-Disposition": "attachment; filename=" + file.name,
      });
      fs.createReadStream(file.file).pipe(res);
    } else {
      // If data is not in cache, fetch it from the database
      await File.findById(fileId)
        .then(async (file) => {
          // Store data in cache for future use
          await redisClient.set("file:" + fileId, JSON.stringify(file));
          res.set({
            "Content-Type": file.type,
            "Content-Disposition": "attachment; filename=" + file.name,
          });
          fs.createReadStream(file.file).pipe(res);
        })
        .catch((err) => {
          return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
        });
    }
  });
};

export const viewFile = async (req, res, next) => {
  const fileId = req.params.id;
  if (!mongoose.isValidObjectId(fileId)) {
    return sendError(STATUSCODE.BAD_REQUEST, "Invalid File Id", next);
  }
  try {
    // Check if data is in cache
    await redisClient.get("file:" + fileId, async (err, result) => {
      if (result) {
        // If data is in cache, send it
        const file = JSON.parse(result);
        if (!file || file === null || file === undefined || !file.file)
          return sendError(STATUSCODE.NOT_FOUND, "File not found", next);

        if (file.type.startsWith("image/")) {
          return res.redirect(file.file);
        }
        // Redirect to the file path
        res.redirect(`/${file.file}?length=${file.length}&width=${file.width}`);
      } else {
        // If data is not in cache, fetch it from the database
        const file = await File.findById(fileId);
        // Store data in cache for future use
        if (!file || file === null || file === undefined || !file.file)
          return sendError(STATUSCODE.NOT_FOUND, "File not found", next);

        redisClient.set("file:" + fileId, JSON.stringify(file));

        if (file.type.startsWith("image/")) {
          return res.redirect(file.file);
        }

        // Redirect to the file path
        res.redirect(`/${file.file}`);
      }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;

    const responce = await deleteFileFunction(fileId);

    return res.status(STATUSCODE.OK).send(responce);
  } catch (err) {
    return sendError(
      STATUSCODE.INTERNAL_SERVER_ERROR,
      "File Not Deleted\n" + err,
      next
    );
  }
};

export const deleteFileFunction = async (fileId) => {
  try {
    if (!mongoose.isValidObjectId(fileId)) {
      return { success: false, message: "File Id is not Correct" };
    }

    // deleteTempFiles();

    const file = await File.findByIdAndDelete(fileId);

    if (file.type.startsWith("image/")) deleteImgsFromCloudinary(fileId);
    else {
      try {
        fs.unlinkSync(file.file);
      } catch (error) {
        return {
          success: false,
          message: "File Deleted failed as file not found\n" + error,
        };
      }
    }
    if (file.used === "Gallery") redisClient.del("Gallery:Gallery");
    if (file.used === "AboutUs") redisClient.del("AboutUs:AboutUs");

    redisClient.del("file:" + fileId);

    return { success: true, message: "File Deleted" };
  } catch (err) {
    return { success: false, message: "File Deleted failed\n" + error };
  }
};

export const deleteTempFiles = async (req, res) => {
  const files = await File.find({ till: "Temprary" });

  for (let file of files) {
    // Delete file from filesystem
    try {
      fs.unlinkSync(file.file);
    } catch (error) {}

    if (file.type.startsWith("image/")) deleteImgsFromCloudinary(file._id);

    // Delete file reference from MongoDB
    await File.deleteOne({ _id: file._id });
    redisClient.del("file:" + JSON.stringify(id));
  }
};

export const updateFileTill = async (ids, used = "", till = "Permanent") => {
  ids.forEach(async (id) => {
    try {
      const result = await File.findById(id);
      if (used && used !== "") result.used = used;
      result.till = till;
      await result.save();
      redisClient.del("file:" + JSON.stringify(id));
    } catch (error) {
      console.log(error);
    }
  });
};
