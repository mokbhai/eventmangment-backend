import userModel from "../models/userModel.js";
import mongoose from "mongoose";
import StatusCode from "../Enums/HttpStatusCodes.js";

export const signup = async (req, res, next) => {
  const { fullname, email, password } = req.body;

  try {
    if (!fullname || !email || !password) {
      const err = new Error("Please Provide All Fields");
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      const err = new Error("Email already registered. Please login");
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }
    if (!password || password.length < 6) {
      const err = new Error(
        "Password is required and should be at least 6 characters long"
      );
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }
    const user = await userModel.create({
      fullname,
      email,
      password,
    });
    //token
    const token = user.createJWT();
    res.status(StatusCode.CREATED).send({
      success: true,
      message: "User created successfully",
      user: {
        fullname: user.fullname,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  // Validation
  if (!email || !password) {
    const err = new Error("Please Provide All Fields");
    err.statusCode = StatusCode.BAD_REQUEST;
    return next(err);
  }

  try {
    // Find user by email
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      const err = new Error("Invalid email or password");
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }

    if (user.isDeleted) {
      const err = new Error("Account not found");
      err.statusCode = StatusCode.NOT_FOUND;
      return next(err);
    }

    const isMatch = await user.comparePassword(password);

    // Check if password matches
    if (!isMatch) {
      const err = new Error("Invalid email or password");
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }

    user.password = undefined;
    const token = user.createJWT();

    res.status(StatusCode.OK).json({
      success: true,
      message: "Login Successfully",
      user,
      token,
    });
  } catch (error) {
    next(error); // Pass error to the error middleware
  }
};

export const getUserById = async (req, res, next) => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Check if the provided user ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error("Invalid user ID");
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }

    // Find the user by ID in the database
    const user = await userModel.findById(userId);

    // Check if the user exists
    if (!user || user.isDeleted) {
      const err = new Error("Account not found");
      err.statusCode = StatusCode.NOT_FOUND;
      return next(err);
    }

    // Omit password from user object
    const { password, ...userData } = user.toObject();

    // Return the user details
    res.status(StatusCode.OK).json({ message: "found", user: userData });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    // Extract user ID from request parameters
    const { userId } = req.user;

    // Check if the provided user ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error("Invalid user ID");
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }

    // Find the user by ID in the database
    let user = await userModel.findById(userId);

    // Check if the user exists
    if (!user || user.isDeleted) {
      const err = new Error("Account not found");
      err.statusCode = StatusCode.NOT_FOUND;
      return next(err);
    }

    // Update user fields based on request body
    const { fullname, email } = req.body;

    if (user.email != email) {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        const err = new Error(
          "Email already registered. Please use another one"
        );
        err.statusCode = StatusCode.BAD_REQUEST;
        return next(err);
      }
    }
    // Update only the fields that are provided
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;

    // Save the updated user to the database
    user = await user.save();

    const { password, ...userData } = user.toObject();

    // Return success response with updated user details
    res
      .status(StatusCode.OK)
      .json({ message: "User updated successfully", user: userData });
  } catch (error) {
    // Return error response
    res
      .status(StatusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error", error });
  }
};

//Update PASSWORD
export const changePassword = async (req, res, next) => {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;

  try {
    // Validate input
    if (!userId || !currentPassword || !newPassword) {
      const err = new Error("Please provide all fields");
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }

    // Check if the provided user ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error("Invalid user ID");
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }

    // Find the user by ID in the database
    const user = await userModel.findById(userId).select("+password");

    // Check if the user exists
    if (!user || user.isDeleted) {
      const err = new Error("Account not found");
      err.statusCode = StatusCode.NOT_FOUND;
      return next(err);
    }

    // Verify the current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const err = new Error("Current password is incorrect");
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }

    // Validate the new password
    if (newPassword.length < 6) {
      const err = new Error(
        "Password is required and should be at least 6 characters long"
      );
      err.statusCode = StatusCode.BAD_REQUEST;
      return next(err);
    }

    user.password = newPassword;

    // Save the updated user to the database
    await user.save();

    // Return success response
    res
      .status(StatusCode.OK)
      .json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};
