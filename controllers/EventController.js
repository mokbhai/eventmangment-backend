import mongoose from "mongoose";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import EventModel from "../models/EventModel.js";
import { isValidMongoId, sendError, validateFields } from "./ErrorHandler.js";
import redisClient, { redisDeleteKeysByPattern } from "../config/redis.js";
import {
  deleteFile,
  deleteFileFunction,
  updateFileTill,
} from "./FilesController.js";
import FilesModel from "../models/FilesModel.js";

export const createEvent = async (req, res, next) => {
  try {
    const {
      eventName,
      eventType,
      description,
      organiserName,
      location,
      eventDate,
      day,
      shift,
      structure,
      eligibilities,
      participants,
      rules,
      ruleBook,
      contacts,
      registrationCharge,
      photos,
    } = req.body;
    const uploadedBy = req.user.userId;

    // Validate required fields using helper function
    validateFields(
      [
        { field: eventName, message: "Event name is required" },
        { field: participants, message: "Participants is required" },
        { field: eventDate, message: "Event date is required" },
        { field: eventType, message: "Event type is required" },
        { field: description, message: "Description is required" },
        { field: photos, message: "Photos is required" },
        { field: organiserName, message: "Organiser name is required" },
        { field: structure, message: "Structure is required" },
        {
          field: location && location.landmark,
          message: "Location landmark is required",
        },
        {
          field: location && location.city,
          message: "Location city is required",
        },
        {
          field: location && location.state,
          message: "Location state is required",
        },
        {
          field: location && location.country,
          message: "Location country is required",
        },
        {
          field: day,
          message: "Day of Event is required",
        },
        { field: shift, message: "Shift of Event is required" },
        { field: eligibilities, message: "Eligibilities are required" },
        { field: rules, message: "Rules are required" },
        { field: ruleBook, message: "Rule book is required" },
        { field: contacts, message: "Contacts information is required" },
        {
          field: registrationCharge,
          message: "Registration charges are required",
        },
        { field: uploadedBy, message: "Uploader information is required" },
      ],
      next
    );

    // Check if ruleBook ID is valid
    if (!isValidMongoId(ruleBook)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Rulebook is not valid", next);
    }

    // Create new event
    const newEvent = new EventModel({
      eventName,
      eventType,
      description,
      organiserName,
      location,
      eventDate,
      day,
      shift,
      structure,
      eligibilities,
      rules,
      participants,
      ruleBook,
      contacts,
      registrationCharge,
      photos,
      uploadedBy,
    });

    // Check if event model creation failed
    if (!newEvent) {
      return sendError(
        STATUSCODE.BAD_GATEWAY,
        "Error while creating event model",
        next
      );
    }

    await updateFileTill(photos, "EventPhotos");
    await updateFileTill([ruleBook], "RuleBook");

    // Save event to database
    const savedEvent = await newEvent.save();

    res.status(STATUSCODE.CREATED).json(savedEvent);
  } catch (error) {
    next(error);
  }
};

export const filterEvents = async (req, res, next) => {
  redisClient.get("Event:Events", async (err, redisEvents) => {
    if (redisEvents) {
      return res.status(STATUSCODE.OK).json({
        success: true,
        events: JSON.parse(redisEvents),
      });
    }
    try {
      // Construct filter object
      let filter = { isDeleted: { $ne: true } };

      const events = await EventModel.find(filter);

      const brochure = await getBrochure();

      events.sort((a, b) => {
        // Sort by day first
        if (a.day < b.day) return -1;
        if (a.day > b.day) return 1;

        // If day is the same, sort by shift
        if (a.shift < b.shift) return -1;
        if (a.shift > b.shift) return 1;

        return 0;
      });

      const eventsWithBrochure = events.map((event) => ({
        ...event._doc,
        brochure,
      }));

      setEventRedis({ eventId: "Events", data: eventsWithBrochure });

      return res.status(STATUSCODE.OK).json({
        success: true,
        events: eventsWithBrochure,
      });
    } catch (error) {
      next(error);
    }
  });
};

export const getEventById = async (req, res, next) => {
  const { eventId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
  }

  // Try getting event data from Redis
  redisClient.get("Event:" + eventId, async (err, redisEvent) => {
    if (err) {
      return next(err);
    }

    if (redisEvent) {
      // If the event data is in the cache, return it
      return res.status(STATUSCODE.OK).json(JSON.parse(redisEvent));
    } else {
      // If the event data is not in the cache, query the database
      try {
        let dbEvent = await EventModel.findById(eventId);

        if (!dbEvent || dbEvent.isDeleted) {
          return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
        }

        dbEvent = {
          ...dbEvent._doc,
          brochure,
        };

        // Store the result in the cache
        setEventRedis({ eventId, data: dbEvent });

        return res.status(STATUSCODE.OK).json(dbEvent);
      } catch (error) {
        return next(error);
      }
    }
  });
};

export const updateEventName = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { eventName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { eventName },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventType = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { eventType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { eventType },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventDescription = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { description },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateOrganiserName = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { organiserName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { organiserName },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventLocation = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { landmark, city, state, country } = req.body.location;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const location = { landmark, city, state, country };
    console.log(location);

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { location },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventDay = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { day } = req.body.date;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { day },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventEligibilities = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { eligibilities } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { eligibilities },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventStructure = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { structure } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { structure },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventRules = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { rules } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { rules },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventPhotos = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { photos } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    const event = await EventModel.findById(eventId);

    updateFileTill([event.photos], "", "Temporary");
    updateFileTill([photos], "EventPhotos");

    event.photos = photos;

    delEventRedis(eventId);

    await event.save();

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventRuleBook = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { ruleBook } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { ruleBook },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventContact = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { contact } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { contact },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventRegistrationCharges = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { registrationCharges } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { registrationCharges },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEventUploadedBy = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { uploadedBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { uploadedBy },
      { new: true }
    );

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const event = await EventModel.findById(eventId);

    if (!event) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }
    event.isDeleted = true;
    event.deletedBy = req.user.userId;

    await event.save();

    delEventRedis(eventId);

    res.status(STATUSCODE.OK).json(event);
  } catch (error) {
    next(error);
  }
};

export const accommodationPrice = async (req, res, next) => {
  await redisClient.get("Accommodation:Price", async (err, result) => {
    if (result) {
      // send data
      res.status(STATUSCODE.OK).send({ success: true, price: result });
    } else {
      // If data is not in cache, fetch it from the database
      const price = req.body.price;
      // Store data in cache for future use
      if (!price)
        return sendError(STATUSCODE.BAD_GATEWAY, "Price not found", next);

      redisClient.set("Accommodation:Price", price);

      // Redirect to the file path
      res.status(STATUSCODE.OK).send({ success: true, price });
    }
  });
};

export const getBrochure = () => {
  return new Promise((resolve, reject) => {
    redisClient.get("Event:Brochure", async (err, result) => {
      if (err) {
        reject(err);
      }
      if (result) {
        // send data
        resolve(result);
      } else {
        // If data is not in cache, fetch it from the database
        const filter = {
          till: "Permanent",
          used: "Brochure",
          isdeleted: false,
        };
        const result = await FilesModel.findOne(filter);
        // Store data in cache for future use

        if (result) {
          redisClient.set("Event:Brochure", result._id);
          resolve(result._id);
        } else {
          resolve("");
        }
      }
    });
  });
};

export const deleteBrochure = async (req, res, next) => {
  const filter = {
    till: "Permanent",
    used: "Brochure",
    isdeleted: false,
  };

  const results = await FilesModel.find(filter);

  results.forEach((result) => {
    deleteFileFunction(result._id);
  });

  await redisDeleteKeysByPattern("Event:*");
  await redisDeleteKeysByPattern("event:*");

  res
    .status(STATUSCODE.CREATED)
    .send({ success: true, message: "Brochure is created" });
};

const setEventRedis = ({ eventId, ex, data }) => {
  if (ex) {
    redisClient.setex("Event:" + eventId, ex, JSON.stringify(data));
  } else {
    redisClient.set("Event:" + eventId, JSON.stringify(data));
  }
};

const delEventRedis = ({ id }) => {
  redisClient.del("Event:" + id);
};
