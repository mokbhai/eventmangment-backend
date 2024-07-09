import express from "express";
import {
  deleteFile,
  downloadFile,
  uploadFile,
  viewFile,
} from "../controllers/FilesController.js";
import userAuth from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route for UpdateUserById
router.post("/upload", userAuth, uploadFile);
router.get("/download/:id", downloadFile);
router.get("/view/:id", viewFile);
router.delete("/:id", userAuth, deleteFile);

export default router;
