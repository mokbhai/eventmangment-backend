import paymentModel from "../models/PaymentModel.js";
import mongoose, { Mongoose } from "mongoose";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import { sendError, validateFields } from "./ErrorHandler.js";
import registrationModel from "../models/RegistrationModel.js";

export const newPayment = async (req, res, next) => {
  const { paymentMethod, amount, registrationId } = req.body;

  try {
    validateFields(
      [
        { field: paymentMethod, message: "Payment Method is required" },
        { field: amount, message: "Amount is required" },
        { field: registrationId, message: "Registration Id is required" },
      ],
      next
    );

    const payment = paymentMethod.create({
      paymentMethod,
      amount,
      paymentStatus: "Pending",
      paymentMethod,
      registrationId,
    });

    const result = await payment.save();

    res.status(STATUSCODE.CREATED).send({
      success: true,
      id: result._id,
    });
  } catch (error) {
    next(error);
  }
};

export const changePaymentStatus = async (req, res, next) => {
  const { paymentId, paymentStatus } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return sendError(STATUSCODE.BAD_REQUEST, "Payment id is not valid", next);
    }

    validateFields(
      [{ field: paymentStatus, message: "Amount is required" }],
      next
    );

    const result = await paymentModel.findByIdAndUpdate(
      paymentId,
      { paymentStatus },
      { new: true }
    );

    if (paymentStatus == "Completed") {
      const payment = { paymentStatus, paymentId };

      await registrationModel.findByIdAndUpdate(
        result.registrationId,
        { payment },
        { new: true }
      );
    }

    res.status(STATUSCODE.CREATED).send({
      success: true,
      id: result._id,
    });
  } catch (error) {
    next(error);
  }
};
