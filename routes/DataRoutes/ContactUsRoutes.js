import express from "express";
import {
  createContactUs,
  updateContactUs,
  deleteContactUs,
  getAllContactUs,
} from "../../controllers/DataControllers/ContactUsController.js";
import userAuth from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getAllContactUs);
router.delete("/:id", userAuth, deleteContactUs);
router.put("/:id", userAuth, updateContactUs);
router.post("/create", userAuth, createContactUs);

export default router;
