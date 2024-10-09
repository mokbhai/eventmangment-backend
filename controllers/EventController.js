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
      avengerCharacter,
      category,
    } = req.body;
    let { photos } = req.body;
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
        { field: avengerCharacter, message: "Organiser name is required" },
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
        { field: category, message: "category information is required" },
        { field: uploadedBy, message: "Uploader information is required" },
      ],
      next
    );

    // Check if ruleBook ID is valid
    if (!isValidMongoId(ruleBook)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Rulebook is not valid", next);
    }

    // Validate and format photos
    if (!Array.isArray(photos)) {
      photos = [photos]; // Wrap in an array if not already an array
    }

    // Create new event
    const newEvent = new EventModel({
      eventName,
      eventType,
      category,
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
      avengerCharacter,
    });

    // Check if event model creation failed
    if (!newEvent) {
      return sendError(
        STATUSCODE.BAD_GATEWAY,
        "Error while creating event model",
        next
      );
    }

    updateFileTill(photos, "EventPhotos");
    updateFileTill([ruleBook], "RuleBook");
    updateFileTill([avengerCharacter], "EventPhotos");

    // Save event to database
    const savedEvent = await newEvent.save();

    delEventRedis({ id: "Events" });

    res.status(STATUSCODE.CREATED).json(savedEvent);
  } catch (error) {
    next(error);
  }
};

export const filterEvents = async (req, res, next) => {
  // redisClient.get("Event:Events", async (err, redisEvents) => {
  //   if (redisEvents) {
  //     return res.status(STATUSCODE.OK).json({
  //       success: true,
  //       events: JSON.parse(redisEvents),
  //     });
  //   }
  // });

  try {
    // Construct filter object
    let filter = { isDeleted: { $ne: true } };

    const events = await EventModel.find(filter)
      .populate({
        path: "photos",
        select: "file",
      })
      .populate({ path: "avengerCharacter", select: "file" });

    const brochure = await getBrochure();

    // Combine sorting by day and shift
    events.sort((a, b) => {
      // Sort by day first
      if (a.day < b.day) return -1;
      if (a.day > b.day) return 1;

      // If day is the same, sort by shift
      if (a.day === b.day) {
        if (a.shift === "Morning" && b.shift === "Evening") return -1;
        if (a.shift === "Evening" && b.shift === "Morning") return 1;
      }

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
};

export const updateEvent = async (req, res, next) => {
  const { id } = req.params;
  const eventData = req.body;

  try {
    const prevEvent = await EventModel.findById(id);

    if (!prevEvent) {
      return res.status(STATUSCODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    if (eventData.hasOwnProperty("photos")) {
      updateFileTill(prevEvent.photos, "EventPhotos", "Temporary");
    }
    if (eventData.hasOwnProperty("ruleBook")) {
      updateFileTill(prevEvent.ruleBook, "RuleBook", "Temporary");
    }
    if (eventData.hasOwnProperty("avengerCharacter")) {
      updateFileTill(
        prevEvent.avengerCharacter,
        "AvengerCharacter",
        "Temporary"
      );
    }

    // Update the fields of prevEvent with the new data
    for (const key in eventData) {
      if (eventData.hasOwnProperty(key)) {
        prevEvent[key] = eventData[key];
      }
    }
    updateFileTill(prevEvent.photos, "EventPhotos");
    updateFileTill(prevEvent.avengerCharacter, "AvengerCharacter");
    updateFileTill(prevEvent.ruleBook, "RuleBook");

    const result = await prevEvent.save();

    delEventRedis({ id: "Events" });
    // delEventRedis({ id: prevEvent._id.toString() });

    return res.status(STATUSCODE.OK).json({
      success: true,
      event: prevEvent,
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

  try {
    let dbEvent = await EventModel.findById(eventId);

    if (!dbEvent || dbEvent.isDeleted) {
      return sendError(STATUSCODE.NOT_FOUND, "Event not found", next);
    }

    const brochure = await getBrochure();

    dbEvent = {
      ...dbEvent._doc,
      brochure,
    };

    return res.status(STATUSCODE.OK).json(dbEvent);
  } catch (error) {
    return next(error);
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
      res.status(STATUSCODE.OK).send({ success: true, price: Number(result) });
    } else {
      // If data is not in cache, fetch it from the database
      // const price = req.body.price;
      const price = 100;
      // Store data in cache for future use
      if (!price)
        return sendError(STATUSCODE.BAD_GATEWAY, "Price not found", next);

      redisClient.set("Accommodation:Price", price);

      // Redirect to the file path
      res.status(STATUSCODE.OK).send({ success: true, price: Number(price) });
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
