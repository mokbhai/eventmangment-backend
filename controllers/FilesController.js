import multer from "multer";
import path from "path";
import File from "../models/FilesModel.js";
import mongoose from "mongoose";
import fs from "fs";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import { sendError } from "./ErrorHandler.js";
import redisClient from "../config/redis.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage }).single("upload");

export const uploadFile = (req, res, next) => {
  const { userId } = req.user;

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
    } else if (err) {
      return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
    }

    // Update the file data in MongoDB
    const { filename, mimetype, path } = req.file;
    const fileData = new File({
      name: filename,
      type: mimetype,
      file: path,
      userId,
    });

    fileData
      .save()
      .then((result) => {
        // Store data in cache for future use
        redisClient.set(
          "file:" + result._id.toString(),
          JSON.stringify(result)
        ); // Set expiry to 10 minutes
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

export const changeFile = (req, res, next) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
    } else if (err) {
      return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
    }

    // Update the file data in MongoDB
    const { filename, mimetype, path } = req.file;

    const fileData = File.findById(fileId);
    fileData.name = filename;
    fileData.type = mimetype;
    fileData.file = path;
    fileData.userId = userId;

    fileData
      .save()
      .then((result) => {
        // Update data in cache
        redisClient.set("file:" + fileId, JSON.stringify(result)); // Set expiry to 10 minutes
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

export const downloadFile = (req, res, next) => {
  const fileId = req.params.id;

  // Check if data is in cache
  redisClient.get("file:" + fileId, (err, result) => {
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
      File.findById(fileId)
        .then((file) => {
          // Store data in cache for future use
          redisClient.set("file:" + fileId, JSON.stringify(file));
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

export const viewFile = (req, res, next) => {
  const fileId = req.params.id;

  // Check if data is in cache
  redisClient.get("file:" + fileId, (err, result) => {
    if (result) {
      // If data is in cache, send it
      const file = JSON.parse(result);
      // Redirect to the file path
      res.redirect(`/${file.file}`);
    } else {
      // If data is not in cache, fetch it from the database
      File.findById(fileId)
        .then((file) => {
          // Store data in cache for future use
          redisClient.set("file:" + fileId, JSON.stringify(file)); // Set expiry to 10 minutes
          // Redirect to the file path
          res.redirect(`/${file.file}`);
        })
        .catch((err) => {
          return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, err, next);
        });
    }
  });
};

export const updateFileTill = (ids) => {
  const till = "Permanent";
  ids.forEach((id) => {
    try {
      const result = File.findByIdAndUpdate(id, { till }, { new: true });
      redisClient.set("file:" + id, JSON.stringify(result));
    } catch (error) {
      console.log(error);
    }
  });
};
