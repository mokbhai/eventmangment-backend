import Busboy from "busboy";
import path from "path";
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

export const deleteImgsFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: "raw" },
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

export const uploadFile = async (req, res, next) => {
  const { userId } = req.user;

  const busboy = Busboy({ headers: req.headers });

  let fileData = new File();

  busboy.on("field", (fieldname, val) => {
    // ... (Handle other form fields like 'type')
    if (fieldname === "type") {
      fileData.used = val;

      if (fileData.used === "Gallery") redisClient.del("Gallery:Gallery");
      if (fileData.used === "AboutUs") redisClient.del("AboutUs:AboutUs");
    }
  });

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    // Generate a unique filename (optional, but recommended)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(filename.filename.toString());
    const newFilename = uniqueSuffix + extension;

    // Populate fileData
    fileData.name = newFilename;
    fileData.type = filename.mimeType;
    fileData.uplodedBy = userId;
    fileData._id = new mongoose.Types.ObjectId();

    // Create a Cloudinary upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        // ... (Your Cloudinary upload options, e.g., folder, resource_type)
        folder: "/TechSprint",
        public_id: fileData._id.toString(), // Use the MongoDB _id as public_id
      },
      async (error, result) => {
        if (error) {
          console.error("Error uploading to Cloudinary:", error);
          return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, error, next);
        }

        if (result && result.url) {
          try {
            // Save the Cloudinary URL to your database
            fileData.file = result.url;

            const savedFile = await fileData.save();

            // Cache the result
            redisClient.set(
              "file:" + savedFile._id.toString(),
              JSON.stringify(savedFile)
            );

            res.status(200).json({
              message: "File uploaded successfully",
              file: savedFile,
              fileId: savedFile._id,
            });
          } catch (dbError) {
            console.error("Error saving file data to database:", dbError);
            return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, dbError, next);
          }
        } else {
          console.error("Unexpected Cloudinary upload result:", result);
          return sendError(
            STATUSCODE.INTERNAL_SERVER_ERROR,
            "File upload failed",
            next
          );
        }
      }
    );

    // Pipe the incoming file stream to the Cloudinary upload stream
    file.pipe(uploadStream);
  });

  // Handle potential errors with Busboy parsing
  busboy.on("error", (err) => {
    console.error("Busboy parsing error:", err);
    return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
  });

  req.pipe(busboy);
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

        // Redirect to the file path
        if (file.type.startsWith("/")) {
          return res.redirect(
            `/${file.file}?length=${file.length}&width=${file.width}`
          );
        }

        return res.redirect(file.file);
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

    deleteImgsFromCloudinary(fileId);

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

    deleteImgsFromCloudinary(file._id);

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
