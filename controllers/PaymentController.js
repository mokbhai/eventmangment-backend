import paymentModel from "../models/PaymentModel.js";
import mongoose, { Mongoose } from "mongoose";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import { sendError, validateFields } from "./ErrorHandler.js";
import registrationModel from "../models/RegistrationModel.js";

export const newPaymentFunc = async ({
  paymentMethod,
  amount,
  registrationId,
}) => {
  try {
    const payment = await paymentModel.create({
      paymentMethod,
      amount,
      paymentStatus: "Pending",
      registrationId,
    });

    const result = await payment.save();

    // res.status(STATUSCODE.CREATED).send({
    //   success: true,
    //   id: result._id,
    // });
    return { success: true, payId: result._id };
  } catch (error) {
    // next(error);
    return { success: false, error };
  }
};

export const changePaymentStatus = async ({ paymentId, paymentStatus }) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return {
        success: false,
        statuscode: STATUSCODE.BAD_REQUEST,
        error: "Payment id is not valid",
      };
    }
    const result = await paymentModel.findByIdAndUpdate(
      paymentId,
      { paymentStatus },
      { new: true }
    );

    const data = await registrationModel.findById(result.registrationId);

    const payment = { paymentStatus, paymentId };

    data.payment = payment;
    await data.save();

    return {
      success: true,
      statuscode: STATUSCODE.OK,
      name: data.teamName,
      email: data.team[0].email,
      message: "Payment Status updated: " + paymentStatus,
    };
  } catch (error) {
    next(error);
  }
};

export const successPayment = async (req, res) => {
  const { paymentId } = req.body;

  const result = await changePaymentStatus({
    paymentId,
    paymentStatus: "Completed",
  });

  res.status(result.statuscode).send(result);
};

export const failedPayment = async (req, res) => {
  const { paymentId } = req.body;

  const result = await changePaymentStatus({
    paymentId,
    paymentStatus: "Failed",
  });

  res.status(result.statuscode).send(result);
};

export const createPayment = async (req, res, next) => {
  const { registrationId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return sendError(
        STATUSCODE.BAD_REQUEST,
        "Registration id is not valid",
        next
      );
    }

    const data = await registrationModel.findById(registrationId);

    if (!data) {
      return sendError(
        STATUSCODE.INTERNAL_SERVER_ERROR,
        "Registration not found",
        next
      );
    }

    let pay = await paymentModel.findById(data.payment.paymentId);

    if (pay && pay.paymentStatus == "Completed") {
      return res.status(STATUSCODE.OK).send("<h2>You have already paid</h2>");
    } else if (pay && pay.paymentStatus == "Refunded") {
      return res
        .status(STATUSCODE.OK)
        .send("<h2>Your Payment is refunded</h2>");
    } else if (!pay || pay.paymentStatus != "Failed") {
      pay = await newPaymentFunc({
        paymentMethod: "UPI",
        amount: data.amount,
        registrationId,
      });

      if (!pay.success) {
        return sendError(STATUSCODE.INTERNAL_SERVER_ERROR, pay.error, next);
      }

      data.payment = { paymentStatus: "Pending", paymentId: pay.payId };
      await data.save();
    }

    res.render("payment", {
      registrationId,
      amount: data.amount,
      payId: data.payment.paymentId,
    });
    // return res
    //   .status(STATUSCODE.CREATED)
    //   .send({ success: true, message: "New payment created. Please Pay now." });
  } catch (error) {
    next(error);
  }
};
