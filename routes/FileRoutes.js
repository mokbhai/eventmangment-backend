import express from "express";
import {
  downloadFile,
  uploadFile,
  viewFile,
} from "../controllers/FilesController.js";
import userAuth from "../middlewares/authMiddleware.js";

// import multer from "multer";
// import {
//   getAllFilesDropBox,
//   uploadFileDropBox,
//   downloadFileDropBox,
//   deleteFileDropBox,
// } from "../controllers/FilesController.js";
import { callbackDBX, loginDBX } from "../config/dropBox.js";

const router = express.Router();

// Route for UpdateUserById
router.get("/dbx/login", loginDBX);
router.get("/dbx/callback", callbackDBX);
router.post("/upload", userAuth, uploadFile);
router.get("/download/:id", downloadFile);
router.get("/view/:id", viewFile);

// // Multer setup for file upload
// const upload = multer({ dest: "uploads/" });

// // Route to list all files
// router.get("/", async (req, res) => {
//   try {
//     const files = await getAllFilesDropBox(req.query.path);
//     res.json(files);
//   } catch (error) {
//     res.status(500).json({ error: error.toString() });
//   }
// });

// // Route to upload a file
// router.post("/", upload.single("file"), async (req, res) => {
//   try {
//     const fileuploaded = await uploadFileDropBox(req.file.path, req.body.path);
//     res.json(fileuploaded);
//   } catch (error) {
//     res.status(500).json({ error: error.toString() });
//   }
// });

// // Route to download a file
// router.get("/download", async (req, res) => {
//   try {
//     const fileDownloadedIntoServer = await downloadFileDropBox(
//       req.query.file,
//       req.query.path
//     );
//     res.download(fileDownloadedIntoServer);
//   } catch (error) {
//     res.status(500).json({ error: error.toString() });
//   }
// });

// // Route to delete a file
// router.delete("/:file", async (req, res) => {
//   try {
//     const fileDeleted = await deleteFileDropBox(req.params.file);
//     res.json(fileDeleted);
//   } catch (error) {
//     res.status(500).json({ error: error.toString() });
//   }
// });

export default router;
