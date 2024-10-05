import OTPTYPE from "../Enums/OtpTypes.js";
import userModel from "../models/UserModel.js";
import otpModel from "../models/OtpModel.js";
import { sendError, validateFields } from "./ErrorHandler.js";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import { createMailOptions, sendMail } from "./MailController.js";
import { generateOtpEmailHtml } from "../templates/emailHtmlTemplate.js";

export const createOtp = async (req, res, next) => {
  const { mailId, otpType } = req.body;

  try {
    validateFields(
      [
        { field: mailId, message: "Email Id is required" },
        { field: otpType, message: "otpType is required" },
      ],
      next
    );

    if (otpType === OTPTYPE.PASSWORD_RESET) {
      const existingUser = await userModel.findOne({ mailId });
      if (!existingUser) {
        return sendError(
          STATUSCODE.BAD_REQUEST,
          "Email is not registered. Please register",
          next
        );
      }
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const recentOtp = await otpModel.findOne({
      mailId,
      createdAt: { $gte: oneMinuteAgo },
    });

    if (recentOtp) {
      return sendError(
        STATUSCODE.TOO_MANY_REQUESTS,
        "You can only request an OTP once per minute. Please try again later.",
        next
      );
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    const result = await otpModel.create({
      otp,
      mailId,
      type: otpType,
    });

    //#region Sending Mail

    const mailOptions = createMailOptions({
      to: mailId,
      subject: "OTP for " + otpType,
      html: generateOtpEmailHtml(otp, otpType),
    });

    await sendMail(mailOptions);

    //#endregion

    // Assuming your otpModel schema has a method to create a JWT
    const token = result.createJWT();
    res.status(STATUSCODE.CREATED).send({
      success: true,
      message: "OTP sent to email",
      mail: mailId,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const createOtpFunc = async (mailId, otpType) => {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const recentOtp = await otpModel.findOne({
      mailId,
      createdAt: { $gte: oneMinuteAgo },
    });

    if (recentOtp) {
      return {
        status: false,
        statusCode: STATUSCODE.TOO_MANY_REQUESTS,
        message:
          "You can only request an OTP once per minute. Please try again later.",
      };
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    const result = await otpModel.create({
      otp,
      mailId,
      type: otpType,
    });

    //#region Sending Mail

    const mailOptions = createMailOptions({
      to: mailId,
      subject: "OTP for " + otpType,
      html: generateOtpEmailHtml(otp, otpType),
    });

    await sendMail(mailOptions);

    //#endregion

    // Assuming your otpModel schema has a method to create a JWT
    const token = result.createJWT();
    // res.status(STATUSCODE.CREATED).send({
    //   success: true,
    //   message: "OTP sent to email",
    //   mail: mailId,
    //   token,
    // });
    return {
      status: true,
      message: "OTP sent to email",
      email: mailId,
      token,
    };
  } catch (error) {
    throw new Error(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  const { otp } = req.body;
  const { otpId } = req.user;

  try {
    validateFields([{ field: otp, message: "Otp is required" }]);

    const Otp = await otpModel.findById(otpId);
    const isMatch = await Otp.compareotp(otp);
    if (!isMatch) {
      return sendError(STATUSCODE.BAD_REQUEST, "Invalid OTP", next);
    }

    return res.status(200).json({ status: true, message: "Otp Verified" });
  } catch (error) {
    next(error);
  }
};

export const verifyOtpFunc = async (otp, otpId) => {
  try {
    const Otp = await otpModel.findById(otpId);
    const isMatch = await Otp.compareotp(otp);
    if (!isMatch) {
      return {
        status: false,
        message: "Incorrect Otp",
      };
    }
    return {
      status: true,
      email: Otp.mailId,
    };
  } catch (error) {
    throw new Error(error);
  }
};
