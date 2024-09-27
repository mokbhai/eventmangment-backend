import express from "express";
import {
  createEvent,
  deleteEvent,
  filterEvents,
  getEventById,
  updateEventContact,
  updateEventDay,
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
  deleteBrochure,
  updateEvent,
} from "../controllers/EventController.js";
import userAuth from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route for createEvent
router.post("/create", userAuth, createEvent);
router.post("/:id", userAuth, updateEvent);

router.get("/filter", filterEvents);
router.get("/:eventId", getEventById);

router.get("/accommodationPrice", accommodationPrice);
router.delete("/brochure", userAuth, deleteBrochure);
router.delete("/:eventId", userAuth, deleteEvent);

// router.post("/:eventId/name", userAuth, updateEventName);
// router.post("/:eventId/type", userAuth, updateEventType);
// router.post("/:eventId/description", userAuth, updateEventDescription);
// router.post("/:eventId/organiserName", userAuth, updateOrganiserName);
// router.post("/:eventId/location", userAuth, updateEventLocation);
// router.post("/:eventId/date", userAuth, updateEventDay);
// router.post("/:eventId/eligibilities", userAuth, updateEventEligibilities);
// router.post("/:eventId/rules", userAuth, updateEventRules);
// router.post("/:eventId/ruleBook", userAuth, updateEventRuleBook);
// router.post("/:eventId/contact", userAuth, updateEventContact);
// router.post(
//   "/:eventId/registrationCharges",
//   userAuth,
//   updateEventRegistrationCharges
// );
// router.post("/:eventId/uploadedBy", userAuth, updateEventUploadedBy);

export default router;
