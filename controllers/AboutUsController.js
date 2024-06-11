// AboutUsModel.js
import mongoose from "mongoose";
import STATUSCODE from "../Enums/HttpStatusCodes.js";
import { sendError, validateFields } from "./ErrorHandler.js";

const AboutUsSchema = mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"] },
    description: { type: String, required: [true, "Description is required"] },
    isDeleted: { type: String, default: false },
  },
  {
    timestamps: true,
  }
);

const AboutUs = mongoose.model("AboutUs", AboutUsSchema);

// AboutUsController.js

export const createAboutUs = async (req, res, next) => {
  const { title, description } = req.body;
  validateFields(
    [
      { field: title, message: "Title is required" },
      { field: description, message: "Description is required" },
    ],
    next
  );

  // Create a About Us
  const aboutUs = new AboutUs({
    title,
    description,
  });

  // Save About Us in the database
  try {
    const data = await aboutUs.save();
    res.status(STATUSCODE.CREATED).send(data);
  } catch (err) {
    next(err);
  }
};

// Retrieve and return all about us from the database.
export const findAllAboutUs = async (req, res, next) => {
  redisClient.get("AboutUs", async (err, redisAboutUs) => {
    if (err) {
      return next(err);
    }

    if (redisContactUs) {
      return res.status(STATUSCODE.OK).json(JSON.parse(redisContactUs));
    } else {
      try {
        const aboutUs = await AboutUs.find({ isDeleted: false });

        if (!aboutUs) {
          return sendError(STATUSCODE.NOT_FOUND, "No Contact found", next);
        }
        redisClient.set("AboutUs", JSON.stringify(aboutUs));
        res.send(aboutUs);
      } catch (err) {
        next(err);
      }
    }
  });
};

// Find a single about us with a aboutUsId
export const findOneAboutUs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aboutUs = await AboutUs.findById(id);
    if (!aboutUs) {
      return sendError(STATUSCODE.NOT_FOUND, "About Us not found", next);
    }
    res.status(STATUSCODE.OK).send(aboutUs);
  } catch (err) {
    next(err);
  }
};

// Update a about us identified by the aboutUsId in the request
export const updateAboutUs = async (req, res, next) => {
  const { title, description } = req.body;
  const { id } = req.params;
  // Validate Request
  validateFields(
    [
      { field: title, message: "Title is required" },
      { field: description, message: "Description is required" },
    ],
    next
  );

  // Find about us and update it with the request body
  try {
    const aboutUs = await AboutUs.findByIdAndUpdate(
      id,
      {
        title,
        description,
      },
      { new: true }
    );

    if (!aboutUs) {
      return sendError(STATUSCODE.NOT_FOUND, "About Us not found", next);
    }
    redisClient.del("AboutUs");

    res.send(aboutUs);
  } catch (err) {
    if (err.kind === "ObjectId") {
      return sendError(STATUSCODE.NOT_FOUND, "About Us not found", next);
    }
    next(err);
  }
};

// Delete a about us with the specified aboutUsId in the request
export const deleteAboutUs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aboutUs = await AboutUs.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!aboutUs) {
      return res.status(404).send({
        message: "About Us not found with id " + req.params.aboutUsId,
      });
    }
    redisClient.del("AboutUs");

    res.send({ message: "About Us deleted successfully!" });
  } catch (err) {
    if (err.kind === "ObjectId" || err.name === "NotFound") {
      return res.status(404).send({
        message: "About Us not found with id " + req.params.aboutUsId,
      });
    }
    return res.status(500).send({
      message: "Could not delete about us with id " + req.params.aboutUsId,
    });
  }
};
