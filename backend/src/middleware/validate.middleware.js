import { ApiError } from '../utils/apiError.js';

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return next(ApiError.badRequest('Dữ liệu không hợp lệ', errors));
  }

  req.body = value;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return next(ApiError.badRequest('Query không hợp lệ', errors));
  }

  req.query = value;
  next();
};
