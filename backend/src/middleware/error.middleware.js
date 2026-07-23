import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Không tìm thấy route: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message, errors } = err;

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = 'Đã xảy ra lỗi hệ thống';
    errors = [];
    logger.error(err.stack || err.message);
  } else if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`${statusCode} - ${message}`);
  }

  res.status(statusCode || 500).json({
    success: false,
    message: message || 'Internal Server Error',
    errors: errors || []
  });
};
