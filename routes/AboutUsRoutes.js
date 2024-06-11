import express from "express";
import {
  createAboutUs,
  updateAboutUs,
  findAllAboutUs,
  findOneAboutUs,
  deleteAboutUs,
} from "../controllers/AboutUsController.js";
import userAuth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", findAllAboutUs);
router.get("/:id", findOneAboutUs);
router.delete("/:id", userAuth, deleteAboutUs);
router.put("/:id", userAuth, updateAboutUs);
router.post("/create", userAuth, createAboutUs);

export default router;
