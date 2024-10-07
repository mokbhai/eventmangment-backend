import RegistrationModel from "../models/RegistrationModel.js";
import mongoose from "mongoose";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import { sendError, validateFields } from "./ErrorHandler.js";
import { parse } from "json2csv";
import { newPaymentFunc } from "./PaymentController.js";
import { newRegistrationButtonClick } from "../templates/registrationHtmltemplates.js";
import { createMailOptions, sendMail } from "./MailController.js";

export const newRegistration = async (req, res, next) => {
  const { teamName, team, eventIds, amount } = req.body;
  const data = { teamName, team, eventIds, amount };

  try {
    validateFields(
      [
        { field: teamName, message: "Team name is required" },
        { field: eventIds, message: "Event ID is required" },
        { field: team, message: "Team Member details are required" },
        { field: amount, message: "Amount is required" },
      ],
      next
    );

    const register = await RegistrationModel.create({
      teamName,
      team,
      amount,
      eventIds,
    });

    // const pay = await newPaymentFunc({
    //   amount,
    //   paymentMethod: "UPI",
    //   registrationId: register._id,
    // });

    // if (!pay || !pay.success) {
    //   return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, pay.error, next);
    // }

    // register.payment = { paymentStatus: "Pending", paymentId: pay.payId };

    const result = await register.save();

    // res.render("payment", {
    //   registrationId: result._id,
    //   amount,
    //   payId: pay.payId,
    // });

    // Prepare email content
    const data = await getRegistrationById(result._id);

    const mailTo = team[0].email;
    const subject = "Registration Successful";
    const text = `Dear ${teamName},\n\nYour registration has been successfully processed. Your payment status is currently pending.\n\nThank you for registering!`;
    const html = newRegistrationButtonClick(data);

    const mailOptions = createMailOptions({
      to: mailTo,
      subject: subject,
      text: text,
      html: html,
    });

    // Send email
    const emailSent = await sendMail(mailOptions);

    if (!emailSent) {
      console.error("Failed to send registration email");
    }

    return res.status(STATUSCODE.CREATED).send({
      success: true,
      message: "User Registration Processed\nPayment Staus: Pending",
      registrationId: result._id,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getRegistrationById = async (id) => {
  try {
    const registration = await RegistrationModel.findById(id).populate(
      "eventIds"
    );

    return registration;
  } catch (error) {
    throw new Error(error);
  }
};

export const filterRegistrations = async (req, res, next) => {
  try {
    const {
      teamName,
      isDeleted,
      paymentStatus,
      teamId,
      page = 1,
      limit = 10,
    } = req.body;

    const filterCriteria = { isDeleted: { $ne: true } }; // Default to not deleted

    if (teamName) filterCriteria.teamName = { $regex: teamName, $options: "i" };
    if (teamId) filterCriteria.teamId = { $regex: teamId, $options: "i" };
    if (paymentStatus) filterCriteria["payment.paymentStatus"] = paymentStatus;
    if (isDeleted !== undefined && isDeleted !== "")
      filterCriteria.isDeleted = isDeleted;

    const pageInt = parseInt(page, 10) || 1; // Ensure page is an integer or default to 1
    const limitInt = parseInt(limit, 10) || 10; // Ensure limit is an integer or default to 10
    const skip = (pageInt - 1) * limitInt;

    const totalRegistrations = await RegistrationModel.countDocuments(
      filterCriteria
    );
    const totalPages = Math.ceil(totalRegistrations / limitInt);

    if (pageInt > totalPages && totalPages > 0) {
      // Check if totalPages is greater than 0 to avoid errors when there are no results
      return sendError(STATUSCODE.NOT_FOUND, "Page not found", next);
    }

    const registrations = await RegistrationModel.find(filterCriteria)
      .populate({
        path: "eventIds",
        select: "eventName",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitInt);

    res.status(STATUSCODE.OK).json({
      success: true,
      message: "Filtered registrations retrieved successfully",
      registrations,
      totalRegistrations,
      totalPages,
      currentPage: pageInt,
    });
  } catch (error) {
    next(error); // Pass the error to your error handling middleware
  }
};

export const downloadRegistrations = async (req, res, next) => {
  const { teamName, isDeleted, paymentStatus, teamId } = req.body;

  try {
    const filterCriteria = { isDeleted: { $ne: true } };

    if (teamName) filterCriteria.teamName = { $regex: teamName, $options: "i" };
    if (teamId) filterCriteria.teamId = { $regex: teamId, $options: "i" };
    if (paymentStatus) filterCriteria["payment.paymentStatus"] = paymentStatus;
    if (isDeleted !== undefined) filterCriteria.isDeleted = isDeleted;

    const registrations = await RegistrationModel.find(filterCriteria).populate(
      {
        path: "eventIds",
        select: "eventName",
      }
    );

    // Prepare data for CSV conversion
    const csvFields = [
      { label: "Team Name", value: "teamName" },
      { label: "Payment Status", value: "payment.paymentStatus" },
      { label: "Amount", value: "amount" },
      { label: "Event 1", value: (row) => row.eventIds[0]?.eventName || "" },
      { label: "Event 2", value: (row) => row.eventIds[1]?.eventName || "" },
      { label: "Event 3", value: (row) => row.eventIds[2]?.eventName || "" },
      { label: "Event 4", value: (row) => row.eventIds[3]?.eventName || "" },
      { label: "Member 1", value: (row) => row.team[0]?.fullname || "" },
      { label: "Member 1 Email", value: (row) => row.team[0]?.email || "" },
      {
        label: "Member 1 Phone",
        value: (row) => row.team[0]?.phoneNumber || "",
      },
      { label: "Member 2", value: (row) => row.team[1]?.fullname || "" },
      { label: "Member 2 Email", value: (row) => row.team[1]?.email || "" },
      {
        label: "Member 2 Phone",
        value: (row) => row.team[1]?.phoneNumber || "",
      },
      { label: "Member 3", value: (row) => row.team[2]?.fullname || "" },
      { label: "Member 3 Email", value: (row) => row.team[2]?.email || "" },
      {
        label: "Member 3 Phone",
        value: (row) => row.team[2]?.phoneNumber || "",
      },
      { label: "Member 4", value: (row) => row.team[3]?.fullname || "" },
      { label: "Member 4 Email", value: (row) => row.team[3]?.email || "" },
      {
        label: "Member 4 Phone",
        value: (row) => row.team[3]?.phoneNumber || "",
      },
      { label: "Member 5", value: (row) => row.team[4]?.fullname || "" },
      { label: "Member 5 Email", value: (row) => row.team[4]?.email || "" },
      {
        label: "Member 5 Phone",
        value: (row) => row.team[4]?.phoneNumber || "",
      },
    ];

    const csv = parse(registrations, { fields: csvFields });

    // Set appropriate headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="registrations-${Date.now()}.csv"`
    );

    // Send CSV as a response
    res.status(STATUSCODE.OK).end(csv);
  } catch (error) {
    next(error);
  }
};

export const callbackRegistration = async (req, res) => {
  const { registrationId, paymentStatus, paymentId } = req.body;

  try {
    // Find the registration by ID and update the payment status
    const registration = await RegistrationModel.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    registration.teamId = await generateTeamId();

    // Update the payment status
    registration.payment.paymentStatus = paymentStatus;
    registration.payment.paymentId = paymentId;
    await registration.save();

    return res
      .status(200)
      .json({ message: "Payment status updated successfully" });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

async function generateTeamId() {
  const lastTeam = await RegistrationModel.findOne({}, { teamId: 1 }) // Project only teamId
    .sort({ teamId: -1 }) // Sort descending to get the highest teamId
    .limit(1);
  
  if (!lastTeam) {
    return "1";
  }

  const nextTeamId = lastTeam ? parseInt(lastTeam.teamId) + 1 : 1; // Increment or start at 1

  return nextTeamId.toString(); // Convert back to string if needed
}
