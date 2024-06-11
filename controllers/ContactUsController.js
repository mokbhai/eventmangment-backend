import redisClient from "../config/redis.js";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import ContactUs from "../models/ContactUsModel.js";
import { validateFields, sendError } from "./ErrorHandler.js";

export const createContactUs = async (req, res, next) => {
  try {
    const { fullname, phone, email, designation } = req.body;
    validateFields(
      [
        { field: fullname, message: "Full name is required" },
        { field: phone, message: "Phone number is required" },
        { field: email, message: "Email Id is required" },
        { field: designation, message: "Designation is required" },
      ],
      next
    );
    const newContactUs = new ContactUs({
      fullname,
      phone,
      email,
      designation,
    });
    const savedContactUs = await newContactUs.save();
    return res.status(STATUSCODE.CREATED).json(savedContactUs);
  } catch (error) {
    next(error);
  }
};

export const getAllContactUs = async (req, res, next) => {
  redisClient.get("ContactUs", async (err, redisContactUs) => {
    if (err) {
      return next(err);
    }

    if (redisContactUs) {
      return res.status(STATUSCODE.OK).json(JSON.parse(redisContactUs));
    } else {
      try {
        const data = await ContactUs.find({ isDeleted: false });

        if (!data) {
          return sendError(STATUSCODE.NOT_FOUND, "No Contact found", next);
        }

        redisClient.set("ContactUs", JSON.stringify(data));

        return res.status(STATUSCODE.OK).json(data);
      } catch (error) {
        return next(error);
      }
    }
  });
};

export const updateContactUs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullname, phone, email, designation } = req.body;
    validateFields(
      [
        { field: fullname, message: "Full name is required" },
        { field: phone, message: "Phone number is required" },
        { field: email, message: "Email Id is required" },
        { field: designation, message: "Designation is required" },
      ],
      next
    );
    const updatedContactUs = await ContactUs.findByIdAndUpdate(
      id,
      { fullname, phone, email, designation },
      { new: true }
    );
    if (!updatedContactUs) {
      return sendError(STATUSCODE.NOT_FOUND, "Contact not found", next);
    }
    redisClient.del("ContactUs");
    return res.status(STATUSCODE.OK).json(updatedContactUs);
  } catch (error) {
    next(error);
  }
};

export const deleteContactUs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedContactUs = await ContactUs.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!deletedContactUs) {
      return sendError(STATUSCODE.NOT_FOUND, "Contact not found", next);
    }
    redisClient.del("ContactUs");
    return res.status(STATUSCODE.OK).json(deletedContactUs);
  } catch (error) {
    next(error);
  }
};
