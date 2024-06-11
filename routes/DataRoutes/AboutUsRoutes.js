import express from "express";
import {
  aboutUsController,
  galaryController,
  mediaController,
  socialMediaController,
} from "../../controllers/DataControllers/AboutUsController.js";
import userAuth from "../../middlewares/authMiddleware.js";

const router = express.Router();

//#region About Us

const {
  createAboutUs,
  findAllAboutUs,
  findOneAboutUs,
  updateAboutUs,
  deleteAboutUs,
} = aboutUsController;

router.get("/", findAllAboutUs);
router.get("/:id", findOneAboutUs);
router.delete("/:id", userAuth, deleteAboutUs);
router.put("/:id", userAuth, updateAboutUs);
router.post("/create", userAuth, createAboutUs);

//#endregion

//#region SocialMedia

const {
  createSocialMedia,
  getAllSocialMedia,
  updateSocialMedia,
  deleteSocialMedia,
} = socialMediaController;

router.get("/SocialMedia/", getAllSocialMedia);
router.delete("/SocialMedia/:id", userAuth, deleteSocialMedia);
router.put("/SocialMedia/:id", userAuth, updateSocialMedia);
router.post("/SocialMedia/create", userAuth, createSocialMedia);

//#endregion

//#region SocialMedia

const { createGalary, getAllGalary, updateGalary, deleteGalary } =
  galaryController;

router.get("/Galary/", getAllGalary);
router.delete("/Galary/:id", userAuth, deleteGalary);
router.put("/Galary/:id", userAuth, updateGalary);
router.post("/Galary/create", userAuth, createGalary);

//#endregion

//#region SocialMedia

const { createMedia, getAllMedia, updateMedia, deleteMedia } = mediaController;

router.get("/Media/", getAllMedia);
router.delete("/Media/:id", userAuth, deleteMedia);
router.put("/Media/:id", userAuth, updateMedia);
router.post("/Media/create", userAuth, createMedia);

//#endregion

export default router;
