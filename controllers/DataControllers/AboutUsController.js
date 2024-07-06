import STATUSCODE from "../../Enums/HttpStatusCodes.js";
import { sendError, validateFields } from "../ErrorHandler.js";
import { Media, SocialMedia } from "../../models/DataModels/AboutUsModel.js";
import FilesModel from "../../models/FilesModel.js";
import mongoose from "mongoose";
import redisClient from "../../config/redis.js";
import { updateFileTill } from "../FilesController.js";

//#region About Us

const createAboutUs = async (req, res, next) => {
  const { title, photos, description } = req.body;
  validateFields(
    [
      { field: title, message: "Title is required" },
      { field: photos, message: "Photos is required" },
      { field: description, message: "Description is required" },
    ],
    next
  );

  try {
    // Create a About Us file and save discription and photos
    const data = {
      photos,
      description,
    };

    redisClient.del("AboutUs");

    await updateFileTill(photos, "AboutUs");

    redisClient.set("AboutUs", JSON.stringify(data));
    // Save About Us in the database
    return res.status(STATUSCODE.CREATED).send(data);
  } catch (err) {
    next(err);
  }
};

// Retrieve and return all about us from the database.
const getAboutUs = async (req, res, next) => {
  redisClient.get("AboutUs", async (err, redisAboutUs) => {
    if (err) {
      return next(err);
    }

    if (redisAboutUs) {
      return res.status(STATUSCODE.OK).json(JSON.parse(redisAboutUs));
    } else {
      return res.status(STATUSCODE.NOT_FOUND).json({
        photos: ["NOT_FOUND"],
        description: "NOT_FOUND",
      });
    }
  });
};

// Delete a about us with the specified aboutUsId in the request
const deleteAboutUs = async (req, res, next) => {
  try {
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

export const aboutUsController = {
  createAboutUs,
  getAboutUs,
  deleteAboutUs,
};

//#endregion

//#region SocialMedia

const createSocialMedia = async (req, res, next) => {
  const { icons, alt, link, platform } = req.body;
  validateFields(
    [
      { field: icons, message: "Social Media Icon is required" },
      { field: alt, message: "Alt Text is required" },
      { field: link, message: "Social Media Link is required" },
      { field: platform, message: "Social Media Platform is required" },
    ],
    next
  );

  // Create a About Us
  const socialMedia = new SocialMedia({
    icons,
    alt,
    link,
    platform,
  });

  // Save About Us in the database
  try {
    const data = await socialMedia.save();
    res.status(STATUSCODE.CREATED).send(data);
  } catch (err) {
    next(err);
  }
};

// Retrieve and return all about us from the database.
const getAllSocialMedia = async (req, res, next) => {
  redisClient.get("SocialMedia", async (err, redisData) => {
    if (err) {
      return next(err);
    }

    if (redisData) {
      return res.status(STATUSCODE.OK).json(JSON.parse(redisData));
    } else {
      try {
        const data = await SocialMedia.find({ isDeleted: false });

        if (!data) {
          return sendError(STATUSCODE.NOT_FOUND, "No Social Media found", next);
        }
        redisClient.set("SocialMedia", JSON.stringify(data));
        return res.status(STATUSCODE.OK).send(data);
      } catch (err) {
        next(err);
      }
    }
  });
};

// Update a about us identified by the aboutUsId in the request
const updateSocialMedia = async (req, res, next) => {
  const { icons, alt, link, platform } = req.body;
  const { id } = req.params;
  // Validate Request
  checkId(id, "Social Media", next);
  validateFields(
    [
      { field: icons, message: "Social Media Icon is required" },
      { field: alt, message: "Alt Text is required" },
      { field: link, message: "Social Media Link is required" },
      { field: platform, message: "Social Media Platform is required" },
    ],
    next
  );

  // Find about us and update it with the request body
  try {
    const data = await SocialMedia.findByIdAndUpdate(
      id,
      {
        icons,
        alt,
        link,
        platform,
      },
      { new: true }
    );

    if (!data) {
      return sendError(STATUSCODE.NOT_FOUND, "About Us not found", next);
    }

    redisClient.del("SocialMedia");
    return res.status(STATUSCODE.OK).send(data);
  } catch (err) {
    if (err.kind === "ObjectId") {
      return sendError(STATUSCODE.NOT_FOUND, "About Us not found", next);
    }
    next(err);
  }
};

// Delete a about us with the specified aboutUsId in the request
const deleteSocialMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    checkId(id, "Social Media", next);

    const data = await SocialMedia.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!data) {
      return sendError(STATUSCODE.NOT_FOUND, "About Us not found", next);
    }
    redisClient.del("SocialMedia");

    res.send({ message: "Social Media deleted successfully!" });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return sendError(STATUSCODE.NOT_FOUND, "About Us not found", next);
    }
    next(err);
  }
};

export const socialMediaController = {
  createSocialMedia,
  getAllSocialMedia,
  updateSocialMedia,
  deleteSocialMedia,
};

//#endregion

//#region Gallery

export const createGallery = async (req, res, next) => {
  try {
    const { photos, video } = req.body;

    redisClient.del("Gallery");

    await updateFileTill(photos, "Gallery");

    const data = { photos, video };

    redisClient.set("Gallery", JSON.stringify(data));

    res
      .status(STATUSCODE.CREATED)
      .json({ message: "gallery photos upoaded successfully" });
  } catch (err) {
    next(err);
  }
};

// Retrieve and return all about us from the database.
const getAllGallery = async (req, res, next) => {
  redisClient.get("Gallery", async (err, redisData) => {
    if (err) {
      return next(err);
    }

    if (redisData) {
      return res.status(STATUSCODE.OK).json(JSON.parse(redisData));
    } else {
      try {
        const filter = { used: "Gallery" };
        const data = await FilesModel.find(filter);

        if (data.length == 0) {
          return sendError(
            STATUSCODE.NOT_FOUND,
            "No Gallery Photos found",
            next
          );
        }
        redisClient.set("Gallery", JSON.stringify(data));
        return res.status(STATUSCODE.OK).send(data);
      } catch (err) {
        next(err);
      }
    }
  });
};

// Update a about us identified by the aboutUsId in the request
// const updateGallery = async (req, res, next) => {
//   const { photo, alt, description, type } = req.body;
//   const { id } = req.params;
//   // Validate Request
//   checkId(id, "Gallery Photo", next);

//   validateFields(
//     [
//       { field: photo, message: "Gallery Photo is required" },
//       { field: alt, message: "Alt Text is required" },
//       { field: description, message: "Gallery Photo description is required" },
//       { field: type, message: "Gallery Photo type is required" },
//     ],
//     next
//   );

//   // Find about us and update it with the request body
//   try {
//     const data = await Gallery.findByIdAndUpdate(
//       id,
//       {
//         photo,
//         alt,
//         description,
//         type,
//       },
//       { new: true }
//     );

//     if (!data) {
//       return sendError(STATUSCODE.NOT_FOUND, "About Us not found", next);
//     }

//     redisClient.del("Gallery");
//     return res.status(STATUSCODE.OK).send(data);
//   } catch (err) {
//     next(err);
//   }
// };

// Delete a about us with the specified aboutUsId in the request
const deleteGallery = async (req, res, next) => {
  try {
    const { id } = req.params;

    checkId(id, "Gallery Photo", next);

    const data = await FilesModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!data) {
      return sendError(STATUSCODE.NOT_FOUND, "Gallery Photo not found", next);
    }

    redisClient.del("Gallery");

    res.send({ message: "Gallery Photo deleted successfully!" });
  } catch (err) {
    next(err);
  }
};

export const galleryController = {
  createGallery,
  getAllGallery,
  // updateGallery,
  deleteGallery,
};

//#endregion

//#region Media

const createMedia = async (req, res, next) => {
  const { link, alt, platform, type } = req.body;

  validateFields(
    [
      { field: link, message: "Media link is required" },
      { field: alt, message: "Alt Text is required" },
      { field: platform, message: "Media platform is required" },
      { field: type, message: "Media type is required" },
    ],
    next
  );

  // Create a About Us
  const data = new Media({
    link,
    alt,
    platform,
    type,
  });

  // Save About Us in the database
  try {
    const result = await data.save();
    res.status(STATUSCODE.CREATED).send(result);
  } catch (err) {
    next(err);
  }
};

// Retrieve and return all about us from the database.
const getAllMedia = async (req, res, next) => {
  redisClient.get("Media", async (err, redisData) => {
    if (err) {
      return next(err);
    }

    if (redisData) {
      return res.status(STATUSCODE.OK).json(JSON.parse(redisData));
    } else {
      try {
        const data = await Media.find({ isDeleted: false });

        if (!data) {
          return sendError(STATUSCODE.NOT_FOUND, "No Media found", next);
        }
        redisClient.set("Media", JSON.stringify(data));
        return res.status(STATUSCODE.OK).send(data);
      } catch (err) {
        next(err);
      }
    }
  });
};

// Update a about us identified by the aboutUsId in the request
const updateMedia = async (req, res, next) => {
  const { link, alt, platform, type } = req.body;
  const { id } = req.params;
  // Validate Request
  checkId(id, "Media", next);

  validateFields(
    [
      { field: link, message: "Media link is required" },
      { field: alt, message: "Alt Text is required" },
      { field: platform, message: "Media platform is required" },
      { field: type, message: "Media type is required" },
    ],
    next
  );

  // Find about us and update it with the request body
  try {
    const data = await Media.findByIdAndUpdate(
      id,
      {
        link,
        alt,
        platform,
        type,
      },
      { new: true }
    );

    if (!data) {
      return sendError(STATUSCODE.NOT_FOUND, "Media not found", next);
    }

    redisClient.del("Media");
    return res.status(STATUSCODE.OK).send(data);
  } catch (err) {
    next(err);
  }
};

// Delete a about us with the specified aboutUsId in the request
const deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;

    checkId(id, "Media", next);

    const data = await Media.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!data) {
      return sendError(STATUSCODE.NOT_FOUND, "Media not found", next);
    }

    redisClient.del("Media");

    res.send({ message: "Media deleted successfully!" });
  } catch (err) {
    next(err);
  }
};

export const mediaController = {
  createMedia,
  getAllMedia,
  updateMedia,
  deleteMedia,
};

//#endregion

const checkId = (id, type, next) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(STATUSCODE.BAD_REQUEST, type + " is not valid", next);
  }
};
