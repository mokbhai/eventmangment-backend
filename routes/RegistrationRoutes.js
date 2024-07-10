import express from "express";
const router = express.Router();
import {
  newRegistration,
  filterRegistrations,
  downloadRegistrations,
} from "../controllers/RegistrationController.js";

router.post("/new", newRegistration);
router.post("/filter", filterRegistrations);
router.post("/download", downloadRegistrations);

export default router;
