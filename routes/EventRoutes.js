import express from "express";
import {
  createEvent,
  deleteEvent,
  filterEvents,
  getEventById,
  updateEventContact,
  updateEventDate,
  updateEventDescription,
  updateEventEligibilities,
  updateEventLocation,
  updateEventName,
  updateEventRegistrationCharges,
  updateEventRuleBook,
  updateEventRules,
  updateEventType,
  updateEventUploadedBy,
  updateOrganiserName,
  accommodationPrice,
} from "../controllers/EventController.js";
import userAuth from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route for createEvent
router.post("/create", userAuth, createEvent);
router.get("/filter", filterEvents);

router.get("/accommodationPrice", accommodationPrice);

router.get("/:eventId", getEventById);
router.patch("/:eventId/name", updateEventName);
router.patch("/:eventId/type", updateEventType);
router.patch("/:eventId/description", updateEventDescription);
router.patch("/:eventId/organiserName", updateOrganiserName);
router.patch("/:eventId/location", updateEventLocation);
router.patch("/:eventId/date", updateEventDate);
router.patch("/:eventId/eligibilities", updateEventEligibilities);
router.patch("/:eventId/rules", updateEventRules);
router.patch("/:eventId/ruleBook", updateEventRuleBook);
router.patch("/:eventId/contact", updateEventContact);
router.patch("/:eventId/registrationCharges", updateEventRegistrationCharges);
router.patch("/:eventId/uploadedBy", updateEventUploadedBy);
router.delete("/:eventId", userAuth, deleteEvent);

export default router;
