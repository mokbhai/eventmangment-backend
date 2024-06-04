import multer from "multer";
import path from "path";
import File from "../models/FilesModel.js";
import mongoose from "mongoose";
import fs from "fs";

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

export const uploadFile = (req, res) => {
  const { userId } = req.user;

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
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
        res.status(200).json({
          message: "File uploaded successfully",
          file: result,
          fileId: result._id,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  });
};

export const downloadFile = (req, res) => {
  const fileId = req.params.id;

  File.findById(fileId)
    .then((file) => {
      res.set({
        "Content-Type": file.type,
        "Content-Disposition": "attachment; filename=" + file.name,
      });
      fs.createReadStream(file.file).pipe(res);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};
export const viewFile = (req, res) => {
  const fileId = req.params.id;

  File.findById(fileId)
    .then((file) => {
      // Redirect to the file path
      res.redirect(`/${file.file}`);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};
