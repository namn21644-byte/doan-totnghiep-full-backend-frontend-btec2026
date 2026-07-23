import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return new ApiResponse(
      201,
      result,
      'Đăng ký thành công, vui lòng kiểm tra email để lấy mã OTP'
    ).send(res);
  }),

  resendOtp: asyncHandler(async (req, res) => {
    const result = await authService.resendOtp(req.body.email);
    return new ApiResponse(200, result, 'Đã gửi lại mã OTP').send(res);
  }),

  verifyOtp: asyncHandler(async (req, res) => {
    const result = await authService.verifyOtp(req.body);
    return new ApiResponse(200, result, 'Xác thực tài khoản thành công').send(res);
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login({
      ...req.body,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    return new ApiResponse(200, result, 'Đăng nhập thành công').send(res);
  }),

  refreshToken: asyncHandler(async (req, res) => {
    const result = await authService.refreshToken({
      ...req.body,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    return new ApiResponse(200, result, 'Làm mới token thành công').send(res);
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout({
      userId: req.user.id,
      refreshToken: req.body.refreshToken
    });
    return new ApiResponse(200, null, 'Đăng xuất thành công').send(res);
  }),

  getMe: asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user.id);
    return new ApiResponse(200, profile, 'OK').send(res);
  })
};
