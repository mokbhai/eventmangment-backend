import express from "express";
const router = express.Router();
import {
  newRegistration,
  filterRegistrations,
} from "../controllers/RegistrationController.js";

router.post("/new", newRegistration);
router.get("/filter", filterRegistrations);

export default router;
