const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  // // Default error object
  // const defaultError = {
  //   statusCode: 500,
  //   message: " ",
  // };

  // // Handle specific error cases
  // if (err.message === "Email already registered. Please login") {
  //   defaultError.statusCode = 500;
  //   defaultError.message = "Email already registered. Please login";
  // } else if (
  //   err.message === "Email already registered. Please use another one"
  // ) {
  //   defaultError.statusCode = 500;
  //   defaultError.message = "Email already registered. Please use another one";
  // }
  // if (err.message === "Please Provide All Fields") {
  //   defaultError.statusCode = 400;
  //   defaultError.message = "Email and password are required fields";
  // } else if (err.message === "Invalid email or password") {
  //   defaultError.statusCode = 500;
  //   defaultError.message = "Invalid Email or password";
  // } else if (err.message === "Current password is incorrect") {
  //   defaultError.statusCode = 500;
  //   defaultError.message = "Current password is incorrect";
  // } else if (err.message === "Account not found") {
  //   defaultError.statusCode = 404;
  //   defaultError.message = "Account not found";
  // } else if (err.message === "Invalid user ID") {
  //   defaultError.statusCode = 500;
  //   defaultError.message = "Invalid user ID";
  // } else if (err.message === "Api Not Found") {
  //   defaultError.statusCode = 404;
  //   defaultError.message = "Api Not Found";
  // } else if (err.message === "File Not Found") {
  //   defaultError.statusCode = 404;
  //   defaultError.message = "File Not Found";
  // } else if (
  //   err.message ===
  //   "Password is required and should be at least 6 characters long"
  // ) {
  //   defaultError.statusCode = 500;
  //   defaultError.message =
  //     "Password is required and should be at least 6 characters long";
  // } else if (err.code && err.code === 11000) {
  //   defaultError.statusCode = 400;
  //   defaultError.message = `${Object.keys(
  //     err.keyValue
  //   )} field has to be unique`;
  // } else {
  //   defaultError.statusCode = err.code;
  //   defaultError.message = err.message;
  // }

  err.statusCode = err.statusCode || 500;
  err.status = err.status | "Internal server error";
  res.status(err.statusCode).json({
    status: err.statusCode,
    message: err.message,
  });

  // Send response with error details
};

export default errorMiddleware;
