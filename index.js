//#region imports

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import "./config/mongodb.js";
import { PORT } from "./ENV.js";
import errorMiddelware from "./middlewares/errorMiddleware.js";
import morgan from "morgan";
import APIRoutes from "./routes/index.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

/// Security Packages
import helmet from "helmet";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import STATUSCODE from "./Enums/HttpStatusCodes.js";

//#endregion

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

/// Api routes
app.get("/", (req, res, next) => {
  return res.status(STATUSCODE.OK).send("<b>Event Manangment Backend</b>");
});

app.use("/api", APIRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/// 404 Api not found
app.use("/uploads/*", (req, res, next) => {
  const err = new Error("File Not Found");
  err.statusCode = 404;
  next(err);
});
app.use("/*", (req, res, next) => {
  const err = new Error("Api Not Found");
  err.statusCode = 404;
  next(err);
});

// Error handling middleware for other errors
app.use(errorMiddelware);
// app.use(function (err, req, res, next) {
//   // Set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // Render the error page
//   res.status(err.status || 500);
//   res.json({
//     error: err.message,
//   });
// });

// Server start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
