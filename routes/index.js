import express from "express";
import UserRoutes from "./UserRoutes.js";
import EventRoutes from "./EventRoutes.js";
import FileRoutes from "./FileRoutes.js";
import MailRoutes from "./MailRoutes.js";
import OtpRoutes from "./OtpRoutes.js";

const router = express.Router();

router.use("/user", UserRoutes);
router.use("/event", EventRoutes);
router.use("/file", FileRoutes);
router.use("/mail", MailRoutes);
router.use("/otp", OtpRoutes);

export default router;
