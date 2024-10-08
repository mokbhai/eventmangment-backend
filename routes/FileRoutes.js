import express from "express";
import {
  changeFile,
  deleteFile,
  deleteTempFiles,
  downloadFile,
  uploadFile,
  viewFile,
} from "../controllers/FilesController.js";
import userAuth from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route for UpdateUserById
router.post("/upload", userAuth, uploadFile);
router.post("/change/:fileId", userAuth, changeFile);
router.get("/download/:id", downloadFile);
router.get("/view/:id", viewFile);
router.delete("/:id", userAuth, deleteFile);
router.delete("/deleteTempFiles", deleteTempFiles);

export default router;
