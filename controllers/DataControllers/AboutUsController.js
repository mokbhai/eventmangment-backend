import STATUSCODE from "../../Enums/HttpStatusCodes.js";
import { sendError, validateFields } from "../ErrorHandler.js";
import AboutUs, {
  Galary,
  Media,
  SocialMedia,
} from "../../models/DataModels/AboutUsModel.js";

//#region About Us

const createAboutUs = async (req, res, next) => {
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
const findAllAboutUs = async (req, res, next) => {
  redisClient.get("AboutUs", async (err, redisAboutUs) => {
    if (err) {
      return next(err);
    }

    if (redisAboutUs) {
      return res.status(STATUSCODE.OK).json(JSON.parse(redisAboutUs));
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
const findOneAboutUs = async (req, res, next) => {
  try {
    const { id } = req.params;
    checkId(id, "About Us", next);
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
const updateAboutUs = async (req, res, next) => {
  const { title, description } = req.body;
  const { id } = req.params;

  checkId(id, "About Us", next);
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
const deleteAboutUs = async (req, res, next) => {
  try {
    const { id } = req.params;
    checkId(id, "About Us", next);
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

export const aboutUsController = {
  createAboutUs,
  findAllAboutUs,
  findOneAboutUs,
  updateAboutUs,
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

//#region Galary

const createGalary = async (req, res, next) => {
  const { photo, alt, description, type } = req.body;

  validateFields(
    [
      { field: photo, message: "Galary Photo is required" },
      { field: alt, message: "Alt Text is required" },
      { field: description, message: "Galary Photo description is required" },
      { field: type, message: "Galary Photo type is required" },
    ],
    next
  );

  // Create a About Us
  const data = new Galary({
    photo,
    alt,
    description,
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
const getAllGalary = async (req, res, next) => {
  redisClient.get("Galary", async (err, redisData) => {
    if (err) {
      return next(err);
    }

    if (redisData) {
      return res.status(STATUSCODE.OK).json(JSON.parse(redisData));
    } else {
      try {
        const data = await Galary.find({ isDeleted: false });

        if (!data) {
          return sendError(
            STATUSCODE.NOT_FOUND,
            "No Galary Photos found",
            next
          );
        }
        redisClient.set("Galary", JSON.stringify(data));
        return res.status(STATUSCODE.OK).send(data);
      } catch (err) {
        next(err);
      }
    }
  });
};

// Update a about us identified by the aboutUsId in the request
const updateGalary = async (req, res, next) => {
  const { photo, alt, description, type } = req.body;
  const { id } = req.params;
  // Validate Request
  checkId(id, "Galary Photo", next);

  validateFields(
    [
      { field: photo, message: "Galary Photo is required" },
      { field: alt, message: "Alt Text is required" },
      { field: description, message: "Galary Photo description is required" },
      { field: type, message: "Galary Photo type is required" },
    ],
    next
  );

  // Find about us and update it with the request body
  try {
    const data = await Galary.findByIdAndUpdate(
      id,
      {
        photo,
        alt,
        description,
        type,
      },
      { new: true }
    );

    if (!data) {
      return sendError(STATUSCODE.NOT_FOUND, "About Us not found", next);
    }

    redisClient.del("Galary");
    return res.status(STATUSCODE.OK).send(data);
  } catch (err) {
    next(err);
  }
};

// Delete a about us with the specified aboutUsId in the request
const deleteGalary = async (req, res, next) => {
  try {
    const { id } = req.params;

    checkId(id, "Galary Photo", next);

    const data = await Galary.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!data) {
      return sendError(STATUSCODE.NOT_FOUND, "Galary Photo not found", next);
    }
    redisClient.del("Galary");

    res.send({ message: "Galary Photo deleted successfully!" });
  } catch (err) {
    next(err);
  }
};

export const galaryController = {
  createGalary,
  getAllGalary,
  updateGalary,
  deleteGalary,
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
