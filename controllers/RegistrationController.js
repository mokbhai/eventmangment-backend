import registrationModel from "../models/RegistrationModel.js";
import mongoose from "mongoose";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import { sendError, validateFields } from "./ErrorHandler.js";
import { parse } from "json2csv";

export const newRegistration = async (req, res, next) => {
  const { teamName, teamLeaderName, team, eventIds, amount } = req.body;

  try {
    validateFields(
      [
        { field: teamName, message: "Team name is required" },
        { field: teamLeaderName, message: "Team Leader Name is required" },
        { field: eventIds, message: "Event ID is required" },
        { field: team, message: "Team Member details are required" },
        { field: amount, message: "Amount is required" },
      ],
      next
    );

    const register = await registrationModel.create({
      teamName,
      teamLeaderName,

      team,

      amount,

      eventIds,
    });

    const result = await register.save();

    res.status(STATUSCODE.CREATED).send({
      success: true,
      message: "User Registration Processed\nPayment Staus: Pending",
      registrationId: result._id,
      user: {
        fullname: teamLeaderName,
        email: register.team[0].email,
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
    page = 1,
    limit = 10,
  } = req.body;

  try {
    const filterCriteria = { isDeleted: { $ne: true } };

    if (fullname) filterCriteria.fullname = { $regex: fullname, $options: "i" };
    if (gender) filterCriteria.gender = gender;
    if (email) filterCriteria.email = { $regex: email, $options: "i" };
    if (paymentStatus) filterCriteria.paymentStatus = paymentStatus;

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

export const downloadRegistrations = async (req, res, next) => {
  const { fullname, gender, email, paymentStatus } = req.body;

  try {
    const filterCriteria = { isDeleted: { $ne: true } };

    if (fullname) filterCriteria.fullname = { $regex: fullname, $options: "i" };
    if (gender) filterCriteria.gender = gender;
    if (email) filterCriteria.email = { $regex: email, $options: "i" };
    if (paymentStatus) filterCriteria.paymentStatus = paymentStatus;

    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid Event ID", next);
    }

    const registrations = await registrationModel.find(filterCriteria);

    // Convert JSON to CSV
    const csv = parse(registrations);

    // console.log(registrations);

    // Set appropriate headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="download-${Date.now()}.csv"`
    );

    // Send CSV as a response
    res.status(STATUSCODE.OK).end(csv);
  } catch (error) {
    next(error);
  }
};
