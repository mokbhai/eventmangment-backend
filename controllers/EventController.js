// import StatusCode from "../Enums/HttpStatusCodes.js";
// import EventModel from "../models/EventModel.js";

// const status = (code, message, next) => {
//   const err = new Error(message);
//   err.statusCode = code;
//   return next(err);
// };

// export const createEvent = async (req, res, next) => {
//   try {
//     const {
//       eventName,
//       eventType,
//       description,
//       organiserName,
//       location,
//       date,
//       eligibilities,
//       rules,
//       ruleBook,
//       contact,
//       registrationCharges,
//     } = req.body;
//     const uplodedBy = req.user.userId;

//     // Validate required fields
//     if (!eventName) {
//       return status(StatusCode.BAD_REQUEST, "Event name is required", next);
//     }
//     if (!eventType) {
//       return status(StatusCode.BAD_REQUEST, "Event type is required", next);
//     }
//     if (!description) {
//       return status(StatusCode.BAD_REQUEST, "Description is required", next);
//     }
//     if (!organiserName) {
//       return status(StatusCode.BAD_REQUEST, "Organiser name is required", next);
//     }
//     if (
//       !location ||
//       !location.landmark ||
//       !location.city ||
//       !location.state ||
//       !location.country
//     ) {
//       return status(
//         StatusCode.BAD_REQUEST,
//         "Complete location information is required",
//         next
//       );
//     }
//     if (
//       !date ||
//       !date.startDate ||
//       !date.endDate ||
//       !date.lastDateOfRegistration
//     ) {
//       return status(
//         StatusCode.BAD_REQUEST,
//         "Complete date information is required",
//         next
//       );
//     }
//     if (!eligibilities) {
//       return status(StatusCode.BAD_REQUEST, "Eligibilities are required", next);
//     }
//     if (!rules) {
//       return status(StatusCode.BAD_REQUEST, "Rules are required", next);
//     }
//     if (!ruleBook) {
//       return status(StatusCode.BAD_REQUEST, "Rule book is required", next);
//     }
//     if (!contact) {
//       return status(
//         StatusCode.BAD_REQUEST,
//         "Contact information is required",
//         next
//       );
//     }
//     if (!registrationCharges) {
//       return status(
//         StatusCode.BAD_REQUEST,
//         "Registration charges are required",
//         next
//       );
//     }
//     if (!uplodedBy) {
//       return status(
//         StatusCode.BAD_REQUEST,
//         "Uploader information is required",
//         next
//       );
//     }

//     // Create new event
//     const newEvent = new EventModel({
//       eventName,
//       eventType,
//       description,
//       organiserName,
//       location,
//       date,
//       eligibilities,
//       rules,
//       ruleBook,
//       contact,
//       registrationCharges,
//       uplodedBy,
//     });

//     // Save event to database
//     const savedEvent = await newEvent.save();
//     res.status(201).json(savedEvent);
//   } catch (error) {
//     next(error);
//   }
// };

import StatusCode from "../Enums/HttpStatusCodes.js";
import EventModel from "../models/EventModel.js";

const validateFields = (fields, next) => {
  fields.forEach((field) => {
    if (!field.field) {
      const err = new Error(field.message);
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }
  });
};

const status = (code, message, next) => {
  const err = new Error(message);
  err.statusCode = code;
  return next(err);
};

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
    } = req.body;
    const uplodedBy = req.user.userId;

    // Validate required fields using helper function
    validateFields(
      [
        { field: eventName, message: "Event name is required" },
        { field: eventType, message: "Event type is required" },
        { field: description, message: "Description is required" },
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
        { field: uplodedBy, message: "Uploader information is required" },
      ],
      next
    );

    if (!mongoose.Types.ObjectId.isValid(ruleBook)) {
      status(StatusCode.BAD_REQUEST, "Rulebook is not vaild", next);
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
      uplodedBy,
    });

    if (!newEvent) {
      status(StatusCode.BAD_GATEWAY, "Error while creating event model", next);
    }

    // Save event to database
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    next(error);
  }
};
