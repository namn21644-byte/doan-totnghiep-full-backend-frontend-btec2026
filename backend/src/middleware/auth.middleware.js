import { verifyAccessToken } from '../utils/jwt.util.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { deviceService } from '../services/device.service.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Thiếu access token');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    throw ApiError.unauthorized('Access token không hợp lệ hoặc đã hết hạn');
  }
});

export const verifyDeviceKey = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers['x-device-key'];

  if (!apiKey) {
    throw ApiError.unauthorized('Thiếu X-Device-Key header');
  }

  const device = await deviceService.findDeviceByApiKey(apiKey);
  if (!device) {
    throw ApiError.unauthorized('API Key không hợp lệ');
  }

  if (device.status !== 'active') {
    throw ApiError.forbidden('Thiết bị hiện không ở trạng thái active');
  }

  req.device = { id: device._id, ipAddress: device.ipAddress, osType: device.osType };
  next();
});
