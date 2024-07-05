import express from "express";
import {
  aboutUsController,
  galaryController,
  mediaController,
  socialMediaController,
} from "../../controllers/DataControllers/AboutUsController.js";
import userAuth from "../../middlewares/authMiddleware.js";

const aboutusRouter = express.Router();
const socialMediaRouter = express.Router();
const galaryRouter = express.Router();

//#region About Us

const {
  createAboutUs,
  findAllAboutUs,
  findOneAboutUs,
  updateAboutUs,
  deleteAboutUs,
} = aboutUsController;

aboutusRouter.get("/", findAllAboutUs);
aboutusRouter.get("/:id", findOneAboutUs);
aboutusRouter.delete("/:id", userAuth, deleteAboutUs);
aboutusRouter.put("/:id", userAuth, updateAboutUs);
aboutusRouter.post("/create", userAuth, createAboutUs);

//#endregion

//#region SocialMedia

const {
  createSocialMedia,
  getAllSocialMedia,
  updateSocialMedia,
  deleteSocialMedia,
} = socialMediaController;

socialMediaRouter.get("/SocialMedia/", getAllSocialMedia);
socialMediaRouter.delete("/SocialMedia/:id", userAuth, deleteSocialMedia);
socialMediaRouter.put("/SocialMedia/:id", userAuth, updateSocialMedia);
socialMediaRouter.post("/SocialMedia/create", userAuth, createSocialMedia);

//#endregion

//#region Galary

const { createGalary, getAllGalary, deleteGalary } = galaryController;

galaryRouter.get("/", getAllGalary);
galaryRouter.delete("/:id", userAuth, deleteGalary);
// galaryRouter.put("/:id", userAuth, updateGalary);
galaryRouter.post("/create", userAuth, createGalary);

//#endregion

export { socialMediaRouter, galaryRouter, aboutusRouter };
