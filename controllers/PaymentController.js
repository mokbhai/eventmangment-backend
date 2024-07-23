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
    const payment = paymentMethod.create({
      paymentMethod,
      amount,
      paymentStatus: "Pending",
      paymentMethod,
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

    if (paymentStatus == "Completed") {
      const payment = { paymentStatus, paymentId };

      data.payment = payment;
      await data.save();
    }

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
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Payment id is not valid", next);
    }
    const data = await registrationModel.findById(registrationId);

    const pay = await newPaymentFunc({
      paymentMethod: "UPI",
      amount: data.amount,
      registrationId,
    });

    return res
      .status(STATUSCODE.CREATED)
      .send({ success: true, message: "New payment created. Please Pay now." });
  } catch (error) {
    next(error);
  }
};
