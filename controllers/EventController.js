import mongoose from "mongoose";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import EventModel from "../models/EventModel.js";
import { isValidMongoId, sendError, validateFields } from "./ErrorHandler.js";
import redisClient from "../config/redis.js";
import { updateFileTill } from "./FilesController.js";

export const createEvent = async (req, res, next) => {
  try {
    const {
      eventName,
      eventType,
      description,
      organiserName,
      location,
      date,
      eligibilities,
      rules,
      ruleBook,
      contact,
      registrationCharges,
      photos,
    } = req.body;
    const uploadedBy = req.user.userId;

    // Validate required fields using helper function
    validateFields(
      [
        { field: eventName, message: "Event name is required" },
        { field: eventType, message: "Event type is required" },
        { field: description, message: "Description is required" },
        { field: photos, message: "Photos is required" },
        { field: organiserName, message: "Organiser name is required" },
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
          field: date && date.startDate,
          message: "Event start date is required",
        },
        { field: date && date.endDate, message: "Event end date is required" },
        {
          field: date && date.lastDateOfRegistration,
          message: "Last date of registration is required",
        },
        { field: eligibilities, message: "Eligibilities are required" },
        { field: rules, message: "Rules are required" },
        { field: ruleBook, message: "Rule book is required" },
        { field: contact, message: "Contact information is required" },
        {
          field: registrationCharges,
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
      date,
      eligibilities,
      rules,
      ruleBook,
      contact,
      registrationCharges,
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

    updateFileTill([photos]);
    updateFileTill([ruleBook]);

    // Save event to database
    const savedEvent = await newEvent.save();
    setEventRedis({
      eventId: JSON.stringify(savedEvent._id),
      data: savedEvent,
    });
    res.status(STATUSCODE.CREATED).json(savedEvent);
  } catch (error) {
    next(error);
  }
};

export const filterEvents = async (req, res, next) => {
  try {
    const {
      eventType,
      city,
      state,
      country,
      startDate,
      duration,
      organiserName,
      page = 1,
      limit = 10,
    } = req.query;

    // Construct filter object
    let filter = { isDeleted: { $ne: true } };

    if (eventType) filter.eventType = eventType;
    if (city) filter["location.city"] = city;
    if (state) filter["location.state"] = state;
    if (country) filter["location.country"] = country;
    if (startDate) {
      filter["date.startDate"] = { $gte: new Date(startDate) };
    }
    if (duration) {
      filter["date.duration"] = { $lte: parseInt(duration, 10) };
    }
    if (organiserName) filter.organiserName = new RegExp(organiserName, "i");

    // Pagination
    const pageInt = parseInt(page, 10);
    let limitInt = parseInt(limit, 10);
    if (limitInt <= 0) limitInt = 10;

    const skip = (pageInt - 1) * limitInt;

    const totalEvents = await EventModel.countDocuments(filter);
    const totalPages = Math.ceil(totalEvents / limitInt);

    if (pageInt > totalPages) {
      return sendError(STATUSCODE.NOT_FOUND, "Page not found", next);
    }

    const events = await EventModel.find(filter).skip(skip).limit(limitInt);

    res.status(STATUSCODE.OK).json({
      events,
      totalPages: totalPages,
      currentPage: pageInt,
      totalEvents,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  const { eventId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
  }

  // Try getting event data from Redis
  redisClient.get("event:" + eventId, async (err, redisEvent) => {
    if (err) {
      return next(err);
    }

    if (redisEvent) {
      // If the event data is in the cache, return it
      return res.status(STATUSCODE.OK).json(JSON.parse(redisEvent));
    } else {
      // If the event data is not in the cache, query the database
      try {
        const dbEvent = await EventModel.findById(eventId);

        if (!dbEvent || dbEvent.isDeleted) {
          return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
        }

        // Store the result in the cache
        setEventRedis({ eventId, ex: 24 * 3600, data: dbEvent });

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

export const updateEventDate = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { startDate, endDate, lastDateOfRegistration } = req.body.date;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const date = { startDate, endDate, lastDateOfRegistration };

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { date },
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

    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { photos },
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

const setEventRedis = ({ eventId, ex, data }) => {
  if (ex) {
    redisClient.setex("event:" + eventId, ex, JSON.stringify(data));
  } else {
    redisClient.set("event:" + eventId, JSON.stringify(data));
  }
};

const delEventRedis = ({ id }) => {
  redisClient.del("event:" + id);
};
