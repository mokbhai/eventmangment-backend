export const validateFields = (fields, next) => {
  fields.forEach((field) => {
    if (!field.field) {
      return sendError(StatusCode.BAD_REQUEST, field.message, next);
    }
  });
};

export const sendError = (statusCode, message, next) => {
  // console.log(message);
  const err = new Error(message);
  err.statusCode = statusCode;
  return next(err);
};
