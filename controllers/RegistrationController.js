import registrationModel from "../models/RegistrationModel.js";
import mongoose from "mongoose";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import { sendError, validateFields } from "./ErrorHandler.js";

export const newRegistration = async (req, res, next) => {
  const {
    fullname,
    gender,
    parentsGuardian,
    dateOfBirth,
    phoneNumber,
    email,
    paymentStatus,
    paymentId,
    eventId,
    optServices,
  } = req.body;

  try {
    validateFields(
      [
        { field: fullname, message: "Full name is required" },
        { field: gender, message: "Gender is required" },
        {
          field: parentsGuardian.fullname,
          message: "Parents/Guardian fullname is required",
        },
        {
          field: parentsGuardian.phoneNumber,
          message: "Parents/Guardian phone number is required",
        },
        { field: parentsGuardian.relation, message: "Relation is required" },
        { field: dateOfBirth, message: "Date of birth is required" },
        { field: phoneNumber, message: "Phone number is required" },
        { field: email, message: "Email is required" },
        { field: paymentStatus, message: "Payment status is required" },
        { field: paymentId, message: "Payment ID is required" },
        { field: eventId, message: "Event ID is required" },
      ],
      next
    );

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Payement ID", next);
    }

    const register = await registrationModel.create({
      fullname,
      gender,
      parentsGuardian,
      dateOfBirth,
      phoneNumber,
      email,
      paymentStatus,
      paymentId,
      eventId,
      optServices,
    });

    if (paymentStatus === "Pending" || paymentStatus === "Failed") {
      return res.status(STATUSCODE.CREATED).send({
        success: false,
        message: "Payemet status: " + paymentStatus,
        user: {
          fullname: register.fullname,
          email: register.email,
        },
      });
    }

    res.status(STATUSCODE.CREATED).send({
      success: true,
      message: "Registration successfully",
      user: {
        fullname: register.fullname,
        email: register.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const filterRegistrations = async (req, res, next) => {
  const {
    fullname,
    gender,
    email,
    paymentStatus,
    eventId,
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const filterCriteria = { isDeleted: { $ne: true } };

    if (fullname) filterCriteria.fullname = { $regex: fullname, $options: "i" };
    if (gender) filterCriteria.gender = gender;
    if (email) filterCriteria.email = { $regex: email, $options: "i" };
    if (paymentStatus) filterCriteria.paymentStatus = paymentStatus;
    if (eventId) filterCriteria.eventId = mongoose.Types.ObjectId(eventId);

    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    // Pagination
    const pageInt = parseInt(page, 10);
    let limitInt = parseInt(limit, 10);
    if (limitInt <= 0) limitInt = 10;

    const skip = (pageInt - 1) * limitInt;

    const totalRegistrations = await registrationModel.countDocuments(
      filterCriteria
    );
    const totalPages = Math.ceil(totalRegistrations / limitInt);

    if (pageInt > totalPages) {
      return sendError(STATUSCODE.NOT_FOUND, "Page not found", next);
    }

    const registrations = await registrationModel
      .find(filterCriteria)
      .skip(skip)
      .limit(limitInt);

    // console.log(registrations);

    res.status(STATUSCODE.OK).send({
      success: true,
      message: "Filtered registrations retrieved successfully",
      registrations: registrations,
      totalRegistrations,
      totalPages: totalPages,
      currentPage: pageInt,
    });
  } catch (error) {
    next(error);
  }
};
