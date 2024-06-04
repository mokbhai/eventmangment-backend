export const validateFields = (fields, next) => {
  fields.forEach((field) => {
    if (!field.field) {
      return sendError(StatusCode.BAD_REQUEST, field.message, next);
    }
  });
};

export const sendError = (code, message, next) => {
  // console.log(message);
  const err = new Error(message);
  err.statusCode = code;
  return next(err);
};
