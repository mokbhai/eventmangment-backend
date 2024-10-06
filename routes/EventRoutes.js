import express from "express";
import {
  createEvent,
  deleteEvent,
  filterEvents,
  getEventById,
  accommodationPrice,
  deleteBrochure,
  updateEvent,
} from "../controllers/EventController.js";
import userAuth from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route for createEvent
router.post("/create", userAuth, createEvent);
router.post("/:id", userAuth, updateEvent);

router.get("/filter", filterEvents);
router.get("/accommodationPrice", accommodationPrice);
router.get("/:eventId", getEventById);

router.delete("/brochure", userAuth, deleteBrochure);
router.delete("/:eventId", userAuth, deleteEvent);

export default router;
