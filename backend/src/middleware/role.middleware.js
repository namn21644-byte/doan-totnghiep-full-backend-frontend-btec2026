import { ApiError } from '../utils/apiError.js';

export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Chưa xác thực'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Bạn không có quyền thực hiện hành động này'));
    }
    next();
  };
